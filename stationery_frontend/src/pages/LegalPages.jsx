import { Link, useParams } from 'react-router-dom'
import './LegalPages.css'

const policies = {
  'terms-and-conditions': {
    title: 'Terms & Conditions',
    updated: '5 November 2026',
    sections: [
      ['1. About StatioMart', 'StatioMart is a multi-store online marketplace that helps customers discover participating local shops and place orders through the platform. The relevant shop is responsible for the products it lists and fulfils, while StatioMart provides the marketplace and related platform features.'],
      ['2. Acceptance and eligibility', 'By accessing or using StatioMart, you agree to these terms. You must provide accurate information and be legally capable of entering into a purchase transaction. If you do not agree, do not use the platform.'],
      ['3. Accounts and security', 'Keep your login credentials confidential and notify us if you suspect unauthorized access. You are responsible for activity carried out through your account, except where applicable law provides otherwise.'],
      ['4. Product information and prices', 'Products, descriptions, images, prices and stock information are supplied by participating shops and may change. Product images are illustrative. The price and charges shown at checkout before you place an order are the amounts applicable to that order, subject to correction of genuine errors and applicable law.'],
      ['5. Orders and confirmation', 'Submitting an order is a request to purchase. The relevant shop must accept or confirm the order. You can view available status updates in My Orders. A shop may reject an order where an item is unavailable or fulfilment is not possible; any amount paid for an unfulfilled order will be handled in accordance with applicable law and the refund policy.'],
      ['6. Payments', 'Available payment methods are shown at checkout. You must pay the displayed product total, delivery charges and other disclosed charges. Payment status may be updated after payment-provider confirmation or authorized manual verification.'],
      ['7. Delivery', 'Delivery availability depends on the participating shop and the service area. Delivery charges and an estimated delivery time, where available, are shown before order placement. Estimates are not guarantees and may change due to traffic, weather, shop preparation or other operational conditions.'],
      ['8. Cancellation, returns and refunds', 'Cancellation, return and refund requests are handled under the applicable policies and consumer law. Nothing in these terms removes a right or remedy that cannot legally be excluded.'],
      ['9. Shop credit', 'Credit is available only if the relevant shop or authorized administrator approves it. The credit amount, amount collected and outstanding balance should be shown in the account or transaction record. Repayment terms must be communicated by the shop before credit is accepted.'],
      ['10. User conduct', 'Do not misuse the platform, submit false information, interfere with security, engage in fraudulent activity or use the service for unlawful purposes.'],
      ['11. Platform availability and liability', 'We aim to keep the platform available and accurate but do not guarantee uninterrupted service. Nothing in these terms excludes liability, consumer rights or remedies that cannot be excluded under Indian law.'],
      ['12. Changes and governing law', 'We may update these terms by publishing a revised version with an updated date. These terms are governed by Indian law, without limiting statutory consumer remedies or access to competent consumer authorities.'],
      ['13. Contact', 'For questions, use the Contact Us or Grievance Redressal details published on this platform. Replace the contact placeholders in the site configuration with verified business details before publication.'],
    ],
  },

  'privacy-policy': {
    title: 'Privacy Policy',
    updated: '5 November 2026',
    sections: [
      ['1. Information we collect', 'Depending on the features you use, we may collect your name, phone number, email address, delivery address, location coordinates when you grant permission, order history, payment references, account information, device information and support communications.'],
      ['2. How we use information', 'We use information to create accounts, process orders, identify nearby shops, calculate delivery charges, coordinate deliveries, provide order updates, maintain approved credit records, provide support, secure the platform and meet legal obligations.'],
      ['3. Location information', 'If you permit location access, we may use it to show nearby shops, calculate distance and delivery charges, and support delivery. You can manage location permission in your device or browser settings. Some location-based features may not work if permission is disabled.'],
      ['4. Sharing', 'Information needed to fulfil an order may be shared with the relevant shop and delivery personnel. Information may also be processed by hosting, payment, mapping, notification and other service providers, or disclosed to authorities where legally required. We do not sell personal information.'],
      ['5. Security and retention', 'We use reasonable safeguards to protect information. We retain information for as long as reasonably necessary for the purposes described here, including transaction, accounting, legal and dispute-resolution requirements. No online system can guarantee absolute security.'],
      ['6. Your choices and rights', 'Subject to applicable law, you may request access to, correction of or deletion of personal information, or raise a privacy concern, by contacting [swalihmusthafa440@gmail.com]. We may need to verify your identity before acting on a request.'],
      ['7. Children', 'The platform is not intended for independent use by children who are not legally able to enter into transactions. A parent or guardian should supervise any permitted use by a minor.'],
      ['8. Updates and contact', 'We may update this policy when our services or legal requirements change. The updated date will be shown above. Privacy contact: [swalihmusthafa440@gmail.com].'],
    ],
  },

  'return-refund': {
    title: 'Return & Refund Policy',
    updated: '5 November 2026',
    sections: [
      ['1. When to contact us', 'Contact us if an item is damaged, defective, incorrect, materially different from its description, missing from the order or not delivered as agreed. Your statutory rights remain unaffected.'],
      ['2. Requesting a return or refund', 'Open My Orders, select the order and contact support using the available option. Include the order ID and a clear description. Photographs or other reasonable evidence may be requested where relevant.'],
      ['3. Perishable and hygiene-sensitive items', 'Some products, such as perishable goods or certain hygiene-sensitive products, may not be eligible for change-of-mind returns where legally permitted. This does not exclude remedies for defective, damaged, incorrect or otherwise legally non-conforming goods.'],
      ['4. Refund processing', 'Once a request is reviewed and approved, the refund will be arranged through the original payment method where practical, or another lawful method communicated to you. Bank and payment-provider processing times may vary.'],
      ['5. Cash on Delivery', 'For eligible Cash on Delivery refunds, support will contact you to arrange an appropriate refund method.'],
      ['6. Contact', 'For help, contact [swalihmusthafa440@gmail.com] or [+91 9895560257] and include your order ID. The final return window and category-specific conditions must be configured and displayed before this policy is published.'],
    ],
  },

  'cancellation': {
    title: 'Cancellation Policy',
    updated: '5 November 2026',
    sections: [
      ['1. Customer cancellation', 'You may request cancellation through the order page or customer support. Whether cancellation can be completed depends on the order status and whether the shop has started preparing or dispatching the order.'],
      ['2. After shop confirmation', 'After a shop confirms and begins processing an order, cancellation may be limited. Contact support as soon as possible. Your rights under applicable law remain unaffected.'],
      ['3. Shop cancellation', 'A shop may need to cancel if an item is unavailable or fulfilment is not possible. You will be informed and any amount paid for an unfulfilled order will be handled under applicable law.'],
      ['4. Charges', 'Currently, StatioMart does not charge any additional fee for order cancellations.Cancellation requests will be handled based on the current order status and whether order preparation or delivery arrangements have already started.'],
    ],
  },

  'shipping-delivery': {
    title: 'Shipping & Delivery Policy',
    updated: '5 November 2026',
    sections: [
      ['1. Service area', 'Delivery is available only where a participating shop serves the customer location. Availability may differ by shop and product.'],
      ['2. Delivery charges', 'Delivery charges may be calculated using the distance between the shop and delivery location and other disclosed conditions. The applicable charge will be shown before you place the order.'],
      ['3. Estimated delivery time', 'Any delivery time shown is an estimate, not a guarantee. Traffic, weather, shop preparation, delivery-person availability and unexpected events may affect delivery.'],
      ['4. Customer responsibilities', 'Provide a complete and accurate address, a reachable phone number and any useful delivery instructions. Be available to receive the order.'],
      ['5. Failed delivery', 'If delivery cannot be completed, the shop or delivery team may contact you to arrange next steps. Any additional fee must be communicated transparently and comply with applicable law.'],
    ],
  },

  'payment': {
    title: 'Payment Policy',
    updated: '5 November 2026',
    sections: [
      ['1. Payment methods', 'The payment methods available for your order are displayed at checkout and may include Cash on Delivery, UPI or other supported methods.'],
      ['2. Amount payable', 'The total may include product prices, delivery charges, applicable taxes and other charges disclosed before order placement.'],
      ['3. Payment confirmation', 'A digital payment is treated as paid after the relevant payment confirmation is received or verified. Cash payments may be recorded by an authorized shop representative or delivery person.'],
      ['4. Payment issues', 'Contact support if money is debited but the order is not confirmed, a duplicate payment occurs, the payment status is incorrect or an eligible refund is delayed. Provide the order ID and transaction reference.'],
    ],
  },

  'cookies': {
    title: 'Cookie Policy',
    updated: '5 November 2026',
    sections: [
      ['1. What cookies are', 'Cookies are small files stored by a browser. Similar technologies may be used to support website operation.'],
      ['2. How we use them', 'Cookies may support login sessions, security, user preferences, site functionality and performance measurement where enabled.'],
      ['3. Managing cookies', 'You can manage or delete cookies through browser settings. Disabling essential cookies may affect sign-in or other website features.'],
    ],
  },

  'about-us': {
    title: 'About StatioMart',
    updated: '5 November 2026',
    sections: [
      ['Our platform', 'StatioMart is a multi-store shopping platform designed to connect customers with participating local shops. Customers can discover shops, browse products, place orders and view available order updates.'],
      ['Our mission', 'Our goal is to make local shopping more convenient and accessible while helping participating shops serve customers through an online platform.'],
    ],
  },

  'contact-us': {
    title: 'Contact Us',
    updated: '5 November 2026',
    sections: [
      ['Customer support', 'Email: [swalihmusthafa440@gmail.com]'],
      ['Phone', '[+91 9895560257]'],
      ['Business address', '[Thekkinkad,Pallanchathanur,Palakkad,678571'],
      ['Support hours', '[WORKING DAYS]'],
      ['Order enquiries', 'Please include your order ID when contacting us about an order. Replace all bracketed contact details with verified information before publishing.'],
    ],
  },

  'faq': {
    title: 'Frequently Asked Questions',
    updated: '5 November 2026',
    sections: [
      ['How do I place an order?', 'Choose a shop, browse its products, add items to your cart and complete checkout.'],
      ['How do I know if my order is confirmed?', 'Open My Orders to see the latest status provided by the shop.'],
      ['Can I cancel an order?', 'You can request cancellation. Availability depends on the order status and the Cancellation Policy.'],
      ['How are delivery charges calculated?', 'Charges may depend on the distance between the shop and your delivery location. The applicable charge is shown at checkout.'],
      ['How do I request a refund?', 'Contact support from the relevant order and provide the order ID and reason.'],
      ['Can I buy on credit?', 'Only if the relevant shop or authorized administrator has approved a credit facility for you.'],
      ['What if my order is delayed?', 'Check My Orders or contact customer support with your order ID.'],
    ],
  },

  'grievance-redressal': {
    title: 'Grievance Redressal',
    updated: '5 November 2026',
    sections: [
      ['How to submit a complaint', 'You may raise a complaint about orders, payments, refunds, delivery, products, privacy or platform functionality. Include your name, contact details, order ID (if applicable) and a clear description.'],
      ['Grievance Officer', 'Name: [ASIM KAMAL T M]'],
      ['Contact details', 'Email: [swalihmusthafa440@gmail.com] | Phone: [+91 9895560257] | Address: [Thekkinkad,Pallanchathanur,Palakkad,678571]'],
      ['Acknowledgement and resolution', 'Consumer complaints will be acknowledged within 48 hours and redressed within one month of receipt, in accordance with applicable requirements.'],
    ],
  },

  'help-support': {
    title: 'Help & Support',
    updated: '5 November 2026',
    sections: [
      ['What we can help with', 'Our support team can assist with registration, login, product information, orders, delivery updates, payments, eligible refunds, credit balance enquiries and technical issues.'],
      ['Contact support', 'Email: [swalihmusthafa440@gmail.com] | Phone: [+91 9895560257]'],
      ['Before contacting us', 'Keep your order ID and relevant payment reference ready, if your enquiry relates to an order or payment.'],
    ],
  },

  'seller-terms': {
    title: 'Seller Terms & Conditions',
    updated: '5 November 2026',
    sections: [
      ['1. Seller registration', 'Shop owners must provide accurate business, identity and contact information and any verification documents reasonably required by the platform.'],
      ['2. Product listings', 'Sellers must provide accurate descriptions, images, prices, stock information and legally required product details. Listings must not be misleading or unlawful.'],
      ['3. Orders', 'Sellers must review incoming orders, confirm or reject them promptly, prepare accepted orders and update order status accurately.'],
      ['4. Product quality and compliance', 'Sellers are responsible for the legality, quality, safety, labelling and fulfilment of products they offer, including applicable licences and tax obligations.'],
      ['5. Customer complaints and refunds', 'Sellers must cooperate with reasonable investigations and honour applicable return, refund and consumer-law obligations.'],
      ['6. Credit', 'Sellers may offer credit only through the platform approved process and must accurately record amounts collected and outstanding balances. Credit terms must be communicated to the customer.'],
      ['7. Platform action', 'The platform may investigate suspected fraud, misuse or policy violations and may restrict seller access where permitted by law and platform rules.'],
    ],
  },

  'seller-policy': {
    title: 'Seller / Shop Policy',
    updated: '5 November 2026',
    sections: [
      ['1. Shop information', 'Keep shop name, address, contact information, operating hours, service area and required registrations accurate and up to date.'],
      ['2. Stock and pricing', 'Update stock and prices regularly. Do not accept orders for unavailable products or use misleading prices and descriptions.'],
      ['3. Order handling', 'Review orders and update confirmation, preparation and delivery statuses accurately. Communicate promptly if an order cannot be fulfilled.'],
      ['4. Delivery and customer service', 'Follow the delivery arrangements and charges shown to customers. Cooperate with customer support on order-related complaints.'],
      ['5. Legal compliance', 'Comply with all laws applicable to your shop and products, including consumer protection, product safety, food safety and tax requirements where relevant.'],
    ],
  },
}

export default function LegalPages() {
  const { slug } = useParams()
  const page = policies[slug]

  if (!page) {
    return (
      <main className="legal-page">
        <div className="legal-card">
          <h1>Page not found</h1>
          <p>The requested information page could not be found.</p>
          <Link to="/">Return to shopping</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="legal-page">
      <article className="legal-card">
        <Link className="legal-back" to="/">
          ← Back to StatioMart
        </Link>

        <p className="legal-eyebrow">STATIOMART • INFORMATION</p>
        <h1>{page.title}</h1>
        <p className="legal-updated">
          Last updated: {page.updated}
        </p>

        <div className="legal-content">
          {page.sections.map(([heading, content]) => (
            <section className="legal-section" key={heading}>
              <h2>{heading}</h2>
              <p>{content}</p>
            </section>
          ))}
        </div>

        <div className="legal-help">
          <strong>Need help?</strong>
          <p>Contact StatioMart support at [swalihmusthafa440@gmail.com].</p>
        </div>
      </article>
    </main>
  )
}