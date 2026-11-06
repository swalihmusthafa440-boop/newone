import { useNavigate } from 'react-router-dom'
import styles from './Footer.module.css'

const legalLinks = [
  ['Terms & Conditions', '/policies/terms-and-conditions'],
  ['Privacy Policy', '/policies/privacy-policy'],
  ['Return & Refund Policy', '/policies/return-refund'],
  ['Cancellation Policy', '/policies/cancellation'],
  ['Shipping & Delivery Policy', '/policies/shipping-delivery'],
  ['Payment Policy', '/policies/payment'],
  ['Cookie Policy', '/policies/cookies'],
]

const supportLinks = [
  ['About Us', '/policies/about-us'],
  ['Contact Us', '/policies/contact-us'],
  ['Frequently Asked Questions', '/policies/faq'],
  ['Grievance Redressal', '/policies/grievance-redressal'],
  ['Help & Support', '/policies/help-support'],
  ['Seller Terms & Conditions', '/policies/seller-terms'],
  ['Seller Policy', '/policies/seller-policy'],
]

export default function Footer() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.valueProps}>
        <div className={styles.valuePropsInner}>
          <div className={styles.propItem}></div>
        </div>
      </div>

      <div className={styles.mainFooter}>
        <div className={styles.footerGrid}>
          <div className={styles.brandCol}>
            <button
              type="button"
              className={styles.brandLogo}
              onClick={() => navigate('/')}
              aria-label="Go to StatioMart home"
            >
              <div className={styles.logoBadge}>
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="8" fill="#2563EB" />
                  <path
                    d="M7 8h14M7 12h10M7 16h12M7 20h8"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="20" cy="19" r="3" fill="#F59E0B" />
                </svg>
              </div>
              <span className={styles.brandName}>StatioMart</span>
            </button>

            <p className={styles.brandAbout}>
              Your local shopping marketplace for stationery, art supplies,
              office essentials and more.
            </p>

            <div className={styles.badgeRow}>
              <span className={styles.trustBadge}>🛍️ Local shopping</span>
              <span className={styles.trustBadge}>🔒 Secure experience</span>
            </div>
          </div>

          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Quick Links</h4>
            <ul className={styles.linkList}>
              <li>
                <button className={styles.footerBtn} onClick={() => navigate('/')}>
                  Shop All Products
                </button>
              </li>
              <li>
                <button className={styles.footerBtn} onClick={() => navigate('/orders')}>
                  My Orders
                </button>
              </li>
              <li>
                <button className={styles.footerBtn} onClick={() => navigate('/cart')}>
                  View Cart
                </button>
              </li>
              <li>
                <button className={styles.footerBtn} onClick={() => navigate('/auth')}>
                  Sign In / Register
                </button>
              </li>
            </ul>
          </div>

          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Legal & Policies</h4>
            <ul className={styles.linkList}>
              {legalLinks.map(([label, path]) => (
                <li key={path}>
                  <button
                    type="button"
                    className={styles.footerBtn}
                    onClick={() => navigate(path)}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Help & Information</h4>
            <ul className={styles.linkList}>
              {supportLinks.map(([label, path]) => (
                <li key={path}>
                  <button
                    type="button"
                    className={styles.footerBtn}
                    onClick={() => navigate(path)}
                  >
                    {label}
                  </button>
                </li>
              ))}

              <li className={styles.contactItem}>
                <span className={styles.contactIcon}>✉️</span>
                <a href="mailto:swalihmusthafa440@gmail.com">
                  swalihmusthafa440@gmail.com
                </a>
              </li>

              <li className={styles.contactItem}>
                <span className={styles.contactIcon}>🕒</span>
                <span>Mon - Sat: 9:00 AM - 6:00 PM</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.bottomInner}>
          <p className={styles.copyright}>
            &copy; {currentYear} <strong>StatioMart</strong>. All rights reserved.
          </p>

          <div className={styles.legalLinks}>
            <button
              type="button"
              onClick={() => navigate('/policies/privacy-policy')}
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => navigate('/policies/terms-and-conditions')}
            >
              Terms & Conditions
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => navigate('/policies/shipping-delivery')}
            >
              Shipping Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}