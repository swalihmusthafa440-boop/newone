import re
from decimal import Decimal
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from products.models import Product, Category
from orders.models import Order, OrderItem
from .models import chatbotfaq


def serialize_product(product, request=None):
    """Serialize a product for chatbot response."""
    img_url = product.display_image
    if product.image and request:
        img_url = request.build_absolute_uri(product.image.url)
    return {
        'id': product.id,
        'name': product.name,
        'price': str(product.price),
        'stock': product.stock,
        'in_stock': product.stock > 0,
        'category': product.category.name if product.category else None,
        'display_image': img_url,
        'description': product.description[:180] if product.description else '',
    }


def extract_price_filter(text):
    """Extract price threshold from phrases like 'under 100', 'below 50', 'less than 200', 'under ₹100'."""
    patterns = [
        r'(?:under|below|less than|within|upto|up to|max|maximum)\s*(?:rs\.?|inr|₹)?\s*(\d+)',
        r'(?:rs\.?|inr|₹)\s*(\d+)\s*(?:or less|and below|maximum|below|under)?',
        r'(\d+)\s*(?:rs|rupees|₹|inr)\s*(?:or less|and below|maximum|below|under)',
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            try:
                return float(m.group(1))
            except (ValueError, TypeError):
                pass
    return None


def extract_quantity(text):
    """Extract requested quantity from text like 'add 3 notebooks', '2 pens'."""
    m = re.search(r'\b(?:add|buy|put|want)\s+(\d+)\b', text, re.IGNORECASE)
    if m:
        try:
            return max(1, int(m.group(1)))
        except (ValueError, TypeError):
            pass
    m2 = re.search(r'\b(\d+)\s+(?:pieces|pcs|pack|packs|items|item|nos|count)\b', text, re.IGNORECASE)
    if m2:
        try:
            return max(1, int(m2.group(1)))
        except (ValueError, TypeError):
            pass
    return 1


def clean_search_term(text):
    """Clean filler words and normalize Malayalam/Manglish terms."""
    t = text.lower()
    # Normalize Manglish terms
    t = re.sub(r'\b(undo|ondoo|undoo)\b', '', t) # "undo" means "is it available?"
    t = re.sub(r'\b(ethra|ethraya|vilaya|rate ethra)\b', '', t) # "ethra" means "how much?"
    t = re.sub(r'\b(ente|ende|njan|njn)\b', '', t) # "my / I"
    t = re.sub(r'\b(kaanikku|kaannikku|tha|tharu|tharo|therumo)\b', '', t) # "show / give"
    t = re.sub(r'\b(evide|evida|ethi|ethiyo)\b', '', t) # "where / reached"

    # Normalize common English fillers
    fillers = [
        'show me all', 'show all', 'show me', 'show', 'list all', 'list', 'i want',
        'i need', 'do you have', 'can you give', 'can i get', 'find', 'search for',
        'search', 'looking for', 'what is the price of', 'price of', 'price for',
        'tell me about', 'any', 'some', 'please', 'can you', 'could you', 'what are the'
    ]
    for f in fillers:
        t = re.sub(rf'\b{re.escape(f)}\b', ' ', t)

    # Remove price mentions from the text search part
    t = re.sub(r'(?:under|below|less than|upto|up to)\s*(?:rs\.?|inr|₹)?\s*\d+', ' ', t)
    t = re.sub(r'[₹$#]', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def find_matching_products(query_term, max_price=None, category_slug=None, in_stock_only=False):
    """Search products using Django ORM and weighted ranking."""
    qs = Product.objects.filter(is_active=True)
    if in_stock_only:
        qs = qs.filter(stock__gt=0)
    if category_slug:
        qs = qs.filter(category__slug__icontains=category_slug)
    if max_price is not None:
        qs = qs.filter(price__lte=max_price)

    if not query_term or len(query_term) < 2:
        return list(qs.order_by('-stock', 'name')[:8])

    words = [w for w in query_term.lower().split() if len(w) >= 2]
    matched = []
    for product in qs:
        score = 0
        name_lower = product.name.lower()
        desc_lower = product.description.lower() if product.description else ''
        cat_lower = product.category.name.lower() if product.category else ''

        # Exact match bonus
        if query_term.lower() in name_lower:
            score += 10

        for word in words:
            # Stemming for plural: notebook vs notebooks, pen vs pens
            singular = word[:-1] if word.endswith('s') and len(word) > 3 else word
            if word in name_lower or singular in name_lower:
                score += 5
            if word in cat_lower or singular in cat_lower:
                score += 4
            if word in desc_lower or singular in desc_lower:
                score += 2

        if score > 0:
            matched.append((score, product))

    matched.sort(key=lambda x: (x[0], x[1].stock > 0, -float(x[1].price)), reverse=True)
    return [p for _, p in matched[:8]]


def find_faq_answer(message):
    """Match message against database chatbotfaq entries."""
    msg = message.lower().strip()
    faqs = chatbotfaq.objects.filter(is_active=True)
    best_faq = None
    best_score = 0

    for faq in faqs:
        score = 0
        q_lower = faq.questions.lower()
        # Direct question similarity
        if msg == q_lower or msg in q_lower or q_lower in msg:
            score += 10

        # Keywords matching
        keywords = [k.strip().lower() for k in faq.keywords.split(',') if k.strip()]
        for kw in keywords:
            if kw in msg:
                score += 5
            else:
                kw_words = kw.split()
                if kw_words and all(w in msg for w in kw_words):
                    score += 4

        if score > best_score:
            best_score = score
            best_faq = faq

    if best_faq and best_score >= 4:
        return best_faq
    return None


@api_view(['POST'])
@permission_classes([AllowAny])
def chatbot(request):
    """
    Intelligent, database-integrated StatioMart chatbot assistant.
    Supports products, categories, cart sync, orders, order tracking,
    cancellations, and complete FAQ knowledge base.
    """
    message = request.data.get('message', '').strip()
    client_cart = request.data.get('cart_items', []) # Live cart items from frontend
    context = request.data.get('context', {})

    if not message:
        return Response({
            'reply': 'Hi! Welcome to StatioMart. How can I help you today? Ask me about products, cart, or orders! 😊',
            'type': 'greeting',
            'suggestions': ['Browse Products', 'Show All Pens', 'Show Notebooks', 'Products Under ₹100', 'My Cart', 'My Orders', 'Payment Methods', 'Delivery Information']
        })

    msg_lower = message.lower().strip()
    max_price = extract_price_filter(msg_lower)

    # ────────────────────────────────────────────────────────────────
    # 1. GREETING
    # ────────────────────────────────────────────────────────────────
    greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon', 'namaste', 'halo', 'hai']
    if any(msg_lower == g or msg_lower.startswith(g + ' ') for g in greetings):
        return Response({
            'reply': "👋 Hello! Welcome to **StatioMart**!\n\nI can help you:\n• 🔍 Find stationery & office supplies\n• 📦 Check order status & tracking\n• 🛒 Manage your shopping cart\n• 💡 Answer questions about delivery, payments, and returns\n\nWhat are you looking for today?",
            'type': 'greeting',
            'suggestions': ['Show All Pens', 'Show Notebooks', 'Products Under ₹100', 'My Cart', 'My Orders', 'Delivery Information']
        })

    # ────────────────────────────────────────────────────────────────
    # 2. CANCEL ORDER INTENT
    # ────────────────────────────────────────────────────────────────
    if any(k in msg_lower for k in ['cancel order', 'cancel my order', 'cancel the order']):
        order_num_match = re.search(r'\d+', msg_lower)
        if order_num_match:
            order_id = int(order_num_match.group())
            try:
                order = Order.objects.get(id=order_id)
                # Verify customer ownership
                if order.user and (not request.user.is_authenticated or (not request.user.is_staff and order.user != request.user)):
                    return Response({
                        'reply': f"For privacy reasons, order #{order_id} can only be managed by its account owner. Please ensure you are logged into your account.",
                        'type': 'text'
                    })
                if order.status == 'pending':
                    with transaction.atomic():
                        order.status = 'cancelled'
                        order.save()
                        # Restore product stock
                        for item in order.items.all():
                            item.product.stock += item.quantity
                            item.product.save(update_fields=['stock'])
                    return Response({
                        'reply': f"✅ Order #{order.id} has been successfully cancelled. If you need anything else, feel free to ask!",
                        'type': 'order_cancelled',
                        'order': {'id': order.id, 'status': 'cancelled'}
                    })
                elif order.status == 'cancelled':
                    return Response({
                        'reply': f"Order #{order.id} is already cancelled.",
                        'type': 'text'
                    })
                else:
                    return Response({
                        'reply': f"Order #{order.id} is currently **{order.get_status_display()}** and cannot be cancelled automatically. Please contact our customer support for assistance.",
                        'type': 'text'
                    })
            except Order.DoesNotExist:
                return Response({
                    'reply': f"I couldn't find an order with ID #{order_id}. Please check your order number.",
                    'type': 'text'
                })
        else:
            return Response({
                'reply': "You can cancel any order that is currently in **Pending** status. Please provide your order number (e.g., 'Cancel order #25') so I can process it for you.",
                'type': 'text'
            })

    # ────────────────────────────────────────────────────────────────
    # 3. SPECIFIC ORDER LOOKUP (e.g., "Check order number 25", "Order #12")
    # ────────────────────────────────────────────────────────────────
    if re.search(r'\border\s*(?:number|no|#)?\s*\d+\b', msg_lower) or (msg_lower.isdigit() and len(msg_lower) <= 6):
        order_match = re.search(r'\d+', msg_lower)
        if order_match:
            order_id = int(order_match.group())
            try:
                order = Order.objects.select_related('address', 'coupon').prefetch_related('items__product').get(id=order_id)
                # Verify ownership
                if order.user:
                    if not request.user.is_authenticated:
                        return Response({
                            'reply': f"🔒 Order #{order_id} is associated with a registered customer account. Please log in to your account to view this order.",
                            'type': 'auth_required'
                        })
                    if not request.user.is_staff and order.user != request.user:
                        return Response({
                            'reply': "🔒 You do not have permission to view this order as it belongs to another customer account.",
                            'type': 'text'
                        })

                status_explanations = {
                    'pending': 'Your order has been received and is awaiting confirmation.',
                    'confirmed': 'Your order has been confirmed and is being prepared for dispatch.',
                    'shipped': 'Your order has been dispatched and is on its way to your delivery address.',
                    'delivered': 'Your order has been successfully delivered.',
                    'cancelled': 'This order was cancelled.'
                }
                explanation = status_explanations.get(order.status, '')

                items_list = [
                    f"• {item.product_name or item.product.name} × {item.quantity} (₹{item.unit_price})"
                    for item in order.items.all()
                ]
                items_text = "\n".join(items_list) if items_list else "Items recorded"

                customer_name = order.address.name if order.address else (order.user.get_full_name() or order.user.username if order.user else 'Customer')
                order_date = order.created_at.strftime('%d %b %Y, %I:%M %p')

                reply = (
                    f"📦 **Order Details — #{order.id}**\n\n"
                    f"• **Date:** {order_date}\n"
                    f"• **Customer:** {customer_name}\n"
                    f"• **Status:** **{order.get_status_display().upper()}** — {explanation}\n"
                    f"• **Payment Method:** {order.get_payment_method_display()} (Cash on Delivery)\n"
                    f"• **Payment Status:** {'Paid on Delivery' if order.status == 'delivered' else 'Due upon Delivery'}\n"
                    f"• **Total Amount:** **₹{order.total_amount}**\n\n"
                    f"**Items Ordered:**\n{items_text}"
                )

                can_cancel = (order.status == 'pending')
                return Response({
                    'reply': reply,
                    'type': 'order_detail',
                    'order': {
                        'id': order.id,
                        'status': order.status,
                        'total': str(order.total_amount),
                        'created_at': order_date,
                        'can_cancel': can_cancel,
                        'items_count': order.items.count(),
                    },
                    'suggestions': [f'Cancel order #{order.id}'] if can_cancel else ['Track My Order', 'Show My Orders']
                })
            except Order.DoesNotExist:
                return Response({
                    'reply': f"I couldn't find order #{order_id} in the database. Please verify the order number and try again.",
                    'type': 'text'
                })

    # ────────────────────────────────────────────────────────────────
    # 4. ORDER STATUS & TRACKING (e.g., "Where is my order?", "Ente order evide ethi?")
    # ────────────────────────────────────────────────────────────────
    if any(k in msg_lower for k in [
        'where is my order', 'my order', 'my orders', 'show my orders',
        'track my order', 'order tracking', 'order status', 'ente order evide ethi',
        'order evide', 'orders list'
    ]):
        if request.user.is_authenticated:
            orders = Order.objects.filter(user=request.user).order_by('-created_at')[:4]
            if orders.exists():
                lines = []
                for o in orders:
                    date_str = o.created_at.strftime('%d %b %Y')
                    lines.append(f"• **Order #{o.id}** ({date_str}) — Status: **{o.get_status_display()}** | Total: ₹{o.total_amount}")
                reply = "📦 **Here are your recent orders:**\n\n" + "\n".join(lines) + "\n\nReply with an order number (e.g. *'Check order number 25'*) to see full details."
                return Response({
                    'reply': reply,
                    'type': 'orders_list',
                    'suggestions': [f'Check order number {orders[0].id}', 'Browse Products', 'My Cart']
                })
            else:
                return Response({
                    'reply': "You don't have any placed orders yet. Once you place an order, you can track its progress right here! 🛍️",
                    'type': 'text',
                    'suggestions': ['Browse Products', 'Show All Pens', 'Show Notebooks']
                })
        else:
            return Response({
                'reply': "To view your recent orders and track deliveries, please log in to your account. 🔐\n\nAlternatively, if you have your Order ID, share it with me (e.g., *'Check order number 25'*).",
                'type': 'auth_required',
                'suggestions': ['Sign In', 'Browse Products']
            })

    # ────────────────────────────────────────────────────────────────
    # 5. CART ACTIONS & TOTALS ("Show my cart", "What is my cart total?", "Ente cart kaanikku")
    # ────────────────────────────────────────────────────────────────
    is_cart_total_query = any(k in msg_lower for k in ['cart total', 'total price in cart', 'how much in my cart', 'total of cart', 'bill amount'])
    is_view_cart_query = any(k in msg_lower for k in [
        'show my cart', 'show cart', 'view cart', 'my cart', 'open cart',
        'ente cart kaanikku', 'cart items', 'items in cart', "what's in my cart", 'what is in my cart'
    ])

    if is_cart_total_query or is_view_cart_query:
        if client_cart and len(client_cart) > 0:
            # Calculate trusted total from database
            total = Decimal('0.00')
            cart_details = []
            for item in client_cart:
                pid = item.get('id')
                qty = item.get('cartQty') or item.get('quantity') or 1
                try:
                    p = Product.objects.get(id=pid)
                    subtotal = p.price * qty
                    total += subtotal
                    cart_details.append(f"• **{p.name}** × {qty} = ₹{subtotal:.2f}")
                except Product.DoesNotExist:
                    pass

            cart_str = "\n".join(cart_details)
            reply = f"🛒 **Your Current Cart:**\n\n{cart_str}\n\n**Grand Total:** **₹{total:.2f}**\n\nWould you like to proceed to checkout?"
            return Response({
                'reply': reply,
                'type': 'cart_summary',
                'cart': {
                    'total': str(total),
                    'items_count': len(client_cart),
                },
                'action': {'type': 'OPEN_CART'},
                'suggestions': ['Proceed to Checkout', 'Browse Products', 'Payment Methods']
            })
        else:
            return Response({
                'reply': "Your shopping cart is currently empty! 🛒\n\nBrowse our stationery collection and click '+' or 'Add to Cart' on items you like.",
                'type': 'cart_empty',
                'action': {'type': 'OPEN_CART'},
                'suggestions': ['Browse Products', 'Show All Pens', 'Show Notebooks', 'Products Under ₹100']
            })

    # ────────────────────────────────────────────────────────────────
    # 6. ADD TO CART VIA CHATBOT ("Add 3 notebooks", "Add pen", "Buy this")
    # ────────────────────────────────────────────────────────────────
    if any(msg_lower.startswith(prefix) for prefix in ['add ', 'buy ', 'put in cart', 'add to cart']):
        clean_item_term = clean_search_term(msg_lower)
        qty = extract_quantity(msg_lower)
        if clean_item_term:
            matches = find_matching_products(clean_item_term, in_stock_only=True)
            if len(matches) == 1:
                product = matches[0]
                return Response({
                    'reply': f"✅ Added **{qty}× {product.name}** (₹{product.price} each) to your cart! Total for this item: ₹{float(product.price)*qty:.2f}.",
                    'type': 'cart_add',
                    'action': {
                        'type': 'ADD_TO_CART',
                        'product': serialize_product(product, request),
                        'quantity': qty
                    },
                    'suggestions': ['View Cart', 'Browse More Products', 'Proceed to Checkout']
                })
            elif len(matches) > 1:
                return Response({
                    'reply': f"I found multiple items matching '{clean_item_term}'. Which one would you like to add?",
                    'type': 'product_selection',
                    'products': [serialize_product(p, request) for p in matches[:4]],
                    'suggestions': [f"Add {p.name}" for p in matches[:3]]
                })
            else:
                return Response({
                    'reply': f"I couldn't find an available item matching '{clean_item_term}'. Try searching with a different name or browse our categories.",
                    'type': 'text',
                    'suggestions': ['Show All Pens', 'Show Notebooks', 'Browse Products']
                })

    # ────────────────────────────────────────────────────────────────
    # 7. PRODUCT AVAILABILITY / PRICE QUERIES (Manglish & English)
    # e.g., "Pen undo?", "Notebook price ethra?", "Is pen available?"
    # ────────────────────────────────────────────────────────────────
    is_availability_query = any(k in msg_lower for k in ['undo', 'available', 'in stock', 'stock', 'ondoo'])
    is_price_query = any(k in msg_lower for k in ['price ethra', 'ethra', 'rate', 'cost', 'how much'])

    if (is_availability_query or is_price_query) and not max_price:
        search_kw = clean_search_term(msg_lower)
        if search_kw:
            matched_products = find_matching_products(search_kw)
            if matched_products:
                lines = []
                for p in matched_products:
                    avail_str = f"In Stock ({p.stock} units)" if p.stock > 0 else "Out of stock"
                    lines.append(f"• **{p.name}** — ₹{p.price} ({avail_str})")
                reply = f"Here are the details for **{search_kw.title()}**:\n\n" + "\n".join(lines)
                return Response({
                    'reply': reply,
                    'type': 'products',
                    'products': [serialize_product(p, request) for p in matched_products[:6]],
                    'suggestions': ['My Cart', 'Products Under ₹100', 'Browse Products']
                })

    # ────────────────────────────────────────────────────────────────
    # 8. MATCH AGAINST DATABASE FAQ KNOWLEDGE BASE
    # ────────────────────────────────────────────────────────────────
    faq_match = find_faq_answer(message)
    if faq_match:
        # If the FAQ is asking for products (e.g., "Show me all pens", "Show me all notebooks", "Products under ₹50")
        # supplement with dynamic live products from the database!
        supplement_products = []
        if 'pen' in faq_match.questions.lower():
            supplement_products = find_matching_products('pen')
        elif 'notebook' in faq_match.questions.lower():
            supplement_products = find_matching_products('notebook')
        elif 'under' in faq_match.questions.lower() and '50' in faq_match.questions.lower():
            supplement_products = find_matching_products('', max_price=50)

        resp_data = {
            'reply': faq_match.answer,
            'type': 'faq',
            'faq_id': faq_match.id,
            'suggestions': ['Browse Products', 'My Cart', 'My Orders', 'Payment Methods']
        }
        if supplement_products:
            resp_data['type'] = 'products'
            resp_data['products'] = [serialize_product(p, request) for p in supplement_products[:6]]

        return Response(resp_data)

    # ────────────────────────────────────────────────────────────────
    # 9. PRICE FILTER SEARCH (e.g., "Notebooks under ₹100", "Products under ₹50")
    # ────────────────────────────────────────────────────────────────
    if max_price is not None:
        search_kw = clean_search_term(msg_lower)
        products = find_matching_products(search_kw, max_price=max_price)
        if products:
            reply = f"💰 Found {len(products)} product(s) "
            if search_kw:
                reply += f"matching '{search_kw.title()}' "
            reply += f"under ₹{max_price:.0f}:"
            return Response({
                'reply': reply,
                'type': 'products',
                'products': [serialize_product(p, request) for p in products[:6]],
                'suggestions': ['Show All Pens', 'Show Notebooks', 'My Cart']
            })
        else:
            return Response({
                'reply': f"I couldn't find any products under ₹{max_price:.0f} matching your criteria. Would you like to check other categories?",
                'type': 'no_results',
                'suggestions': ['Browse Products', 'Show All Pens', 'Show Notebooks']
            })

    # ────────────────────────────────────────────────────────────────
    # 10. CATEGORY LISTING / DISCOVERY
    # ────────────────────────────────────────────────────────────────
    if any(k in msg_lower for k in ['category', 'categories', 'what do you sell', 'departments']):
        cats = list(Category.objects.all())
        if cats:
            cat_list = "\n".join(f"• **{c.name}**" for c in cats)
            return Response({
                'reply': f"📂 **Available Categories on StatioMart:**\n\n{cat_list}\n\nAsk me about any category to see products!",
                'type': 'categories',
                'suggestions': [c.name for c in cats[:4]]
            })

    # ────────────────────────────────────────────────────────────────
    # 11. GENERAL PRODUCT SEARCH (DEFAULT)
    # ────────────────────────────────────────────────────────────────
    search_term = clean_search_term(msg_lower)
    if search_term and len(search_term) >= 2:
        products = find_matching_products(search_term)
        if products:
            in_stock = [p for p in products if p.stock > 0]
            out_of_stock = [p for p in products if p.stock == 0]
            if in_stock:
                reply = f"Found {len(in_stock)} item(s) for '{search_term.title()}':"
                return Response({
                    'reply': reply,
                    'type': 'products',
                    'products': [serialize_product(p, request) for p in in_stock[:6]],
                    'suggestions': ['View Cart', 'Under ₹100', 'Check Delivery']
                })
            else:
                names = ", ".join(p.name for p in out_of_stock[:3])
                return Response({
                    'reply': f"😔 '{names}' are currently out of stock. Here are similar items from our collection:",
                    'type': 'products',
                    'products': [serialize_product(p, request) for p in find_matching_products('')[:4]],
                    'suggestions': ['Browse Products', 'Show All Pens', 'Show Notebooks']
                })

    # Fallback response
    return Response({
        'reply': "I'm your **StatioMart Assistant**! 📚 You can ask me to search for products (like pens, notebooks, sticky notes), check order status, manage your cart, or answer delivery and payment questions.",
        'type': 'help',
        'suggestions': ['Browse Products', 'Show All Pens', 'Show Notebooks', 'Products Under ₹100', 'My Cart', 'My Orders']
    })