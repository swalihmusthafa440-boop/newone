from django.core.management.base import BaseCommand
from chatbot.models import chatbotfaq

FAQS_DATA = [
    # 11. General Questions
    {
        'questions': 'What is StatioMart?',
        'keywords': 'what is statiomart, about statiomart, who are you, intro, company, what is this website',
        'answer': 'StatioMart is an online stationery shopping platform where you can browse products, explore available categories, add products to your cart, and place orders conveniently.'
    },
    {
        'questions': 'What products are available on StatioMart?',
        'keywords': 'what products are available, what do you sell, items, catalog, available stationery, list products',
        'answer': 'You can explore the stationery products currently available in our store, such as notebooks, pens, pencils, sticky notes, office supplies, and other listed items. Ask me about a product or category to see matching products.'
    },
    {
        'questions': 'How can I find a product?',
        'keywords': 'how can i find a product, search product, find stationery, how to search, look for items',
        'answer': 'Tell me the product name or category you are looking for. For example, you can ask me to show all pens, find notebooks under ₹100, or list available office supplies.'
    },
    {
        'questions': 'Can you recommend products?',
        'keywords': 'can you recommend products, recommend, suggest, top items, popular products, suggestions, recommendations',
        'answer': 'Yes! Tell me what type of stationery you need and your budget. I can search the available products in StatioMart and show relevant options.'
    },
    {
        'questions': 'How can I contact customer support?',
        'keywords': 'how can i contact customer support, contact us, support email, phone number, helpdesk, customer care',
        'answer': 'Please check the Contact Us section of StatioMart for the available customer-support contact information.'
    },

    # 12. Product Questions
    {
        'questions': 'Show me all pens.',
        'keywords': 'show me all pens, show pens, pen list, ball pen, gel pen, fountain pen, all pens, pen undo',
        'answer': "Sure! I'll search the current product database and show all matching available pens, including their names, prices, and images when available."
    },
    {
        'questions': 'Show me all notebooks.',
        'keywords': 'show me all notebooks, show notebooks, notebooks list, spiral notebook, ruled notebook, all notebooks',
        'answer': "Of course! I'll find the available notebooks in StatioMart and display the matching products with their current prices."
    },
    {
        'questions': 'What is the price of a product?',
        'keywords': 'what is the price of a product, product price, cost of item, notebook price ethra, pen price ethra, rate',
        'answer': "Tell me the product name, and I'll check its current price in the product database."
    },
    {
        'questions': 'Is this product available?',
        'keywords': 'is this product available, product availability, in stock, stock status, item undo, available undo',
        'answer': "I'll check the current product information and stock availability to help you determine whether the product is available to purchase."
    },
    {
        'questions': 'Do you have products under ₹50?',
        'keywords': 'do you have products under 50, under 50, below 50, cheap items, affordable under 50',
        'answer': "I can search for products priced below ₹50 and display matching products based on the current database prices."
    },
    {
        'questions': 'Can I see similar products?',
        'keywords': 'can i see similar products, similar items, related products, alternatives, comparable',
        'answer': "Yes! I'll look for related products using available product categories and information, then show relevant alternatives."
    },

    # 13. Cart Questions
    {
        'questions': 'How do I add a product to my cart?',
        'keywords': 'how do i add a product to my cart, add to cart, how to add, buy product',
        'answer': "Find the product you want and click its Add to Cart or plus (+) button. I'll also help you find products if you tell me what you need."
    },
    {
        'questions': 'Show my cart.',
        'keywords': 'show my cart, view cart, my cart, ente cart kaanikku, open cart, what is in my cart',
        'answer': "I'll retrieve your current cart and show its products, quantities, prices, subtotals, and total amount. Please log in if authentication is required."
    },
    {
        'questions': 'What is my cart total?',
        'keywords': 'what is my cart total, cart total, how much in cart, total bill, grand total cart',
        'answer': "I'll calculate your cart total using the current cart contents and trusted product prices."
    },
    {
        'questions': 'How can I change a product quantity?',
        'keywords': 'how can i change a product quantity, change quantity, increase quantity, decrease quantity, update qty',
        'answer': "Open your cart and use the quantity controls to increase or decrease the number of items. The total will update after the change is successfully saved."
    },
    {
        'questions': 'How can I remove a product from my cart?',
        'keywords': 'how can i remove a product from my cart, remove item from cart, delete from cart, clear item',
        'answer': "Open your cart and select the remove option next to the product you want to remove."
    },
    {
        'questions': 'How do I place an order?',
        'keywords': 'how do i place an order, place order, how to checkout, buy items, complete order, ordering process',
        'answer': "Add your required products to the cart, open the cart, and select Proceed to Checkout. Enter your delivery details, select an available payment method, and place your order."
    },

    # 14. Order Questions
    {
        'questions': 'Show my orders.',
        'keywords': 'show my orders, my orders, order history, previous orders, list orders',
        'answer': "I'll retrieve your recent orders and display their order IDs, dates, totals, and current statuses."
    },
    {
        'questions': 'Where is my order?',
        'keywords': 'where is my order, track my order, ente order evide ethi, order tracking, order location, status of my order',
        'answer': "I'll check your latest orders and show the status recorded in the order database."
    },
    {
        'questions': 'Check order number 25.',
        'keywords': 'check order number, check order #, order details, track order number',
        'answer': "I'll verify the order ID and confirm that it belongs to your account before displaying its details. Replace the example order number with the ID you want to check."
    },
    {
        'questions': 'What does my order status mean?',
        'keywords': 'what does my order status mean, explain order status, pending status, confirmed status, shipped status, delivered status, cancelled status',
        'answer': "Your order status indicates the current stage of your order. I'll explain the status using the actual status values configured in StatioMart."
    },
    {
        'questions': 'Can I cancel my order?',
        'keywords': 'can i cancel my order, cancel order, how to cancel, cancellation policy',
        'answer': "I'll check whether cancellation is supported and whether your order is eligible. If cancellation is available, I'll guide you through the existing cancellation process."
    },
    {
        'questions': 'How can I check my order payment status?',
        'keywords': 'how can i check my order payment status, payment status, payment confirmation',
        'answer': "I'll retrieve the payment status recorded for your order, provided that the information is available in the system."
    },
    {
        'questions': 'My order is delayed. What should I do?',
        'keywords': 'my order is delayed, order late, delay, not delivered yet, late delivery',
        'answer': "Please check your latest order status first. If you need further assistance, visit the Contact Us section to find the available support options."
    },

    # 15. Payment Questions
    {
        'questions': 'Which payment methods are available?',
        'keywords': 'which payment methods are available, payment options, how can i pay, available payment, cod, google pay, gpay',
        'answer': "StatioMart will display the payment methods currently supported by the checkout page. You can select one of the available options when placing your order."
    },
    {
        'questions': 'Can I pay on delivery?',
        'keywords': 'can i pay on delivery, cash on delivery, cod available, pay later, pay on cash',
        'answer': "If Cash on Delivery is enabled for your order, you can select it during checkout. I'll help you check the available payment options."
    },
    {
        'questions': 'Was my payment successful?',
        'keywords': 'was my payment successful, payment status check, did payment go through, payment success',
        'answer': "I'll check the payment information recorded for your order. If the payment status is unavailable or still pending, please verify it using the existing payment process."
    },
    {
        'questions': 'Why is my payment pending?',
        'keywords': 'why is my payment pending, payment pending, payment processing, transaction pending',
        'answer': "Your payment may still be awaiting confirmation. I'll check the recorded status and guide you to the available next steps without assuming that a payment has succeeded."
    },

    # 16. Delivery Questions
    {
        'questions': 'How do I enter my delivery address?',
        'keywords': 'how do i enter my delivery address, enter address, address format, location selection, shipping address',
        'answer': "During checkout, enter the delivery information requested by StatioMart. If location selection is available, you can use that feature to help provide your address."
    },
    {
        'questions': 'Can you deliver to my location?',
        'keywords': 'can you deliver to my location, deliver to my area, service area, deliver to pincode, district delivery',
        'answer': "Tell me your delivery area or district, and I'll check the delivery restrictions or service-area information available in StatioMart. I won't promise delivery unless the system supports it."
    },
    {
        'questions': 'How long will delivery take?',
        'keywords': 'how long will delivery take, delivery time, shipping duration, when will it reach, estimated delivery',
        'answer': "Delivery time depends on the delivery information and policies configured by StatioMart. I'll share an estimated time only if a reliable estimate is available."
    },

    # 17. Account Questions
    {
        'questions': 'How do I create an account?',
        'keywords': 'how do i create an account, register, sign up, new account, registration',
        'answer': "Open the registration page, enter the required information, and submit the registration form. Follow any verification steps shown by StatioMart."
    },
    {
        'questions': 'How do I log in?',
        'keywords': 'how do i log in, login, sign in, how to access account',
        'answer': "Open the login page and enter your registered credentials. After successful authentication, you can access the features available to your account."
    },
    {
        'questions': 'How can I view my order history?',
        'keywords': 'how can i view my order history, see past orders, view order history, previous purchases',
        'answer': "Log in to your account and open My Orders to view the orders associated with your account."
    },
    {
        'questions': 'I cannot log in. What should I do?',
        'keywords': 'i cannot log in, login failed, forgot password, unable to login, login problem',
        'answer': "Check that your credentials are correct and try again. If the problem continues, use the account-recovery options available in StatioMart or contact the listed support team."
    },

    # 18. Chatbot Assistance Questions
    {
        'questions': 'What can you do?',
        'keywords': 'what can you do, capabilities, what are your features, assistant features, help me',
        'answer': "I can help you search products, compare available options, check product prices and availability, view your cart, guide you through checkout, and retrieve your order information securely."
    },
    {
        'questions': 'I cannot find the product I need.',
        'keywords': 'i cannot find the product i need, product not found, missing item, search failed',
        'answer': "Try entering the product name, category, or budget. I'll search for matching available products and suggest alternatives when possible."
    },
    {
        'questions': "I don't understand how to place an order.",
        'keywords': "i don't understand how to place an order, don't know how to order, help placing order, order guide",
        'answer': "No problem! First, select your products and add them to your cart. Next, open your cart, proceed to checkout, enter your delivery details, select an available payment method, and place your order."
    },
]


class Command(BaseCommand):
    help = 'Seed the database with complete StatioMart FAQ knowledge base'

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0
        for faq in FAQS_DATA:
            obj, created = chatbotfaq.objects.update_or_create(
                questions=faq['questions'],
                defaults={
                    'keywords': faq['keywords'],
                    'answer': faq['answer'],
                    'is_active': True,
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded FAQs: {created_count} created, {updated_count} updated."
        ))
