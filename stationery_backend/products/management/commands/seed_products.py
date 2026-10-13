from django.core.management.base import BaseCommand
from products.models import Category, Product

class Command(BaseCommand):
    help = 'Seed the database with sample stationery products'

    def handle(self, *args, **options):
        # Create categories
        categories = [
            {'name': 'Pens & Pencils', 'slug': 'pens-pencils'},
            {'name': 'Notebooks & Paper', 'slug': 'notebooks-paper'},
            {'name': 'Art Supplies', 'slug': 'art-supplies'},
            {'name': 'Office Supplies', 'slug': 'office-supplies'},
            {'name': 'Geometry & Math', 'slug': 'geometry-math'},
        ]
        cat_objs = {}
        for c in categories:
            obj, _ = Category.objects.get_or_create(slug=c['slug'], defaults={'name': c['name']})
            cat_objs[c['slug']] = obj

        products = [
            # Pens & Pencils
            {'name': 'Blue Ballpoint Pen (Pack of 10)', 'price': '45.00', 'stock': 200, 'category': 'pens-pencils',
             'image_url': 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80',
             'description': 'Smooth writing blue ballpoint pens, comfortable grip, pack of 10.'},
            {'name': 'HB Pencil Set (12 pcs)', 'price': '60.00', 'stock': 150, 'category': 'pens-pencils',
             'image_url': 'https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=400&q=80',
             'description': 'Premium HB pencils for writing and sketching, set of 12.'},
            {'name': 'Gel Ink Pen - Black', 'price': '25.00', 'stock': 300, 'category': 'pens-pencils',
             'image_url': 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&q=80',
             'description': 'Smooth gel ink pen for clean, smear-free writing.'},
            {'name': 'Fountain Pen - Premium', 'price': '299.00', 'stock': 50, 'category': 'pens-pencils',
             'image_url': 'https://images.unsplash.com/photo-1627634777217-c864268db30c?w=400&q=80',
             'description': 'Classic fountain pen with fine nib, perfect for elegant writing.'},
            {'name': 'Mechanical Pencil 0.5mm', 'price': '85.00', 'stock': 100, 'category': 'pens-pencils',
             'image_url': 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80',
             'description': 'Precision mechanical pencil with 0.5mm lead, ideal for technical drawing.'},

            # Notebooks & Paper
            {'name': 'A4 Ruled Notebook - 200 Pages', 'price': '120.00', 'stock': 80, 'category': 'notebooks-paper',
             'image_url': 'https://images.unsplash.com/photo-1531346680769-a1d79b57de5c?w=400&q=80',
             'description': 'High-quality A4 ruled notebook with 200 pages, hard cover.'},
            {'name': 'Spiral Notebook A5', 'price': '75.00', 'stock': 120, 'category': 'notebooks-paper',
             'image_url': 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&q=80',
             'description': 'Compact A5 spiral notebook, perfect for notes and journaling.'},
            {'name': 'Sticky Notes Pack (5 colors)', 'price': '55.00', 'stock': 200, 'category': 'notebooks-paper',
             'image_url': 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80',
             'description': 'Colorful sticky notes in 5 colors, 100 sheets each.'},
            {'name': 'A4 Printer Paper (500 sheets)', 'price': '350.00', 'stock': 60, 'category': 'notebooks-paper',
             'image_url': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
             'description': 'Premium A4 80gsm printer paper, 500 sheets per ream.'},

            # Art Supplies
            {'name': 'Watercolor Paint Set (24 colors)', 'price': '450.00', 'stock': 40, 'category': 'art-supplies',
             'image_url': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80',
             'description': 'Professional watercolor set with 24 vibrant colors and brush.'},
            {'name': 'Sketch Pencil Set (6B-2H)', 'price': '180.00', 'stock': 75, 'category': 'art-supplies',
             'image_url': 'https://images.unsplash.com/photo-1602524816763-e4a33a7d4025?w=400&q=80',
             'description': 'Complete sketching set from 6B to 2H grades, for artists.'},
            {'name': 'Acrylic Paint Set (12 colors)', 'price': '380.00', 'stock': 35, 'category': 'art-supplies',
             'image_url': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80',
             'description': 'Vibrant acrylic paints, 12 colors, 75ml tubes.'},
            {'name': 'Sketchbook A4 - 100 Pages', 'price': '220.00', 'stock': 55, 'category': 'art-supplies',
             'image_url': 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80',
             'description': '160gsm cartridge paper sketchbook, perfect for all art media.'},

            # Office Supplies
            {'name': 'Stapler with 1000 Staples', 'price': '150.00', 'stock': 90, 'category': 'office-supplies',
             'image_url': 'https://images.unsplash.com/photo-1568283096533-078a45c8a375?w=400&q=80',
             'description': 'Heavy-duty stapler with 1000 staples included.'},
            {'name': 'Scissors - Stainless Steel', 'price': '95.00', 'stock': 110, 'category': 'office-supplies',
             'image_url': 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&q=80',
             'description': 'Sharp stainless steel scissors, comfortable grip handles.'},
            {'name': 'Tape Dispenser with 3 Rolls', 'price': '85.00', 'stock': 130, 'category': 'office-supplies',
             'image_url': 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80',
             'description': 'Desktop tape dispenser with 3 extra rolls of transparent tape.'},
            {'name': 'Highlighter Set (6 colors)', 'price': '110.00', 'stock': 160, 'category': 'office-supplies',
             'image_url': 'https://images.unsplash.com/photo-1568283096533-078a45c8a375?w=400&q=80',
             'description': 'Bright fluorescent highlighters in 6 colors for marking text.'},
            {'name': 'Whiteboard Marker Set', 'price': '140.00', 'stock': 85, 'category': 'office-supplies',
             'image_url': 'https://images.unsplash.com/photo-1533073526757-2c8ca1df9f1c?w=400&q=80',
             'description': 'Set of 8 dry-erase whiteboard markers in assorted colors.'},

            # Geometry & Math
            {'name': 'Geometry Box - Premium', 'price': '175.00', 'stock': 70, 'category': 'geometry-math',
             'image_url': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80',
             'description': 'Complete geometry set: compass, protractor, set squares, ruler.'},
            {'name': 'Scientific Calculator', 'price': '650.00', 'stock': 30, 'category': 'geometry-math',
             'image_url': 'https://images.unsplash.com/photo-1564939558297-fc396f18e5c7?w=400&q=80',
             'description': '240 functions scientific calculator, ideal for students.'},
            {'name': '30cm Ruler (Pack of 5)', 'price': '70.00', 'stock': 200, 'category': 'geometry-math',
             'image_url': 'https://images.unsplash.com/photo-1609421740586-93e90d32c96f?w=400&q=80',
             'description': 'Transparent plastic rulers, 30cm, set of 5.'},

        ]

        for p in products:
            cat = cat_objs.get(p['category'])
            obj, created = Product.objects.get_or_create(
                name=p['name'],
                defaults={
                    'price': p['price'],
                    'stock': p['stock'],
                    'category': cat,
                    'image_url': p['image_url'],
                    'description': p['description'],
                    'is_active': True,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created: {obj.name}'))
            else:
                self.stdout.write(f'Already exists: {obj.name}')

        self.stdout.write(self.style.SUCCESS('\nSeeding complete!'))
