import { useNavigate } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      {/* Value props banner */}
      <div className={styles.valueProps}>
        <div className={styles.valuePropsInner}>
          <div className={styles.propItem}>
            <div className={styles.propIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h4 className={styles.propTitle}>100% Genuine Products</h4>
              <p className={styles.propDesc}>Curated top-quality stationery brands</p>
            </div>
          </div>

          <div className={styles.propItem}>
            <div className={styles.propIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <h4 className={styles.propTitle}>Express Delivery</h4>
              <p className={styles.propDesc}>Fast doorstep delivery across India</p>
            </div>
          </div>

          <div className={styles.propItem}>
            <div className={styles.propIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div>
              <h4 className={styles.propTitle}>Easy Returns</h4>
              <p className={styles.propDesc}>Hassle-free 7-day return policy</p>
            </div>
          </div>

          <div className={styles.propItem}>
            <div className={styles.propIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <path d="M1 10h22"/>
              </svg>
            </div>
            <div>
              <h4 className={styles.propTitle}>Cash on Delivery</h4>
              <p className={styles.propDesc}>Pay safely when your package arrives</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className={styles.mainFooter}>
        <div className={styles.footerGrid}>
          {/* Brand Col */}
          <div className={styles.brandCol}>
            <div className={styles.brandLogo} onClick={() => navigate('/')}>
              <div className={styles.logoBadge}>
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="8" fill="#2563EB"/>
                  <path d="M7 8h14M7 12h10M7 16h12M7 20h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="20" cy="19" r="3" fill="#F59E0B"/>
                </svg>
              </div>
              <span className={styles.brandName}>StatioMart</span>
            </div>
            <p className={styles.brandAbout}>
              Your trusted partner for premium pens, notebooks, sketchbooks, art supplies, and office essentials. Designed for creators, thinkers, and professionals.
            </p>
            <div className={styles.badgeRow}>
              <span className={styles.trustBadge}>🇮🇳 Pan-India Shipping</span>
              <span className={styles.trustBadge}>🛡️ Secure COD</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Quick Links</h4>
            <ul className={styles.linkList}>
              <li><button className={styles.footerBtn} onClick={() => navigate('/')}>Shop All Products</button></li>
              <li><button className={styles.footerBtn} onClick={() => navigate('/orders')}>My Orders</button></li>
              <li><button className={styles.footerBtn} onClick={() => navigate('/checkout')}>View Cart / Checkout</button></li>
              <li><button className={styles.footerBtn} onClick={() => navigate('/auth')}>Sign In / Register</button></li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Categories</h4>
            <ul className={styles.linkList}>
              <li><button className={styles.footerBtn} onClick={() => navigate('/')}>Notebooks & Journals</button></li>
              <li><button className={styles.footerBtn} onClick={() => navigate('/')}>Luxury & Gel Pens</button></li>
              <li><button className={styles.footerBtn} onClick={() => navigate('/')}>Art & Craft Supplies</button></li>
              <li><button className={styles.footerBtn} onClick={() => navigate('/')}>Desk & Office Accessories</button></li>
            </ul>
          </div>

          {/* Support */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Help & Support</h4>
            <ul className={styles.linkList}>
              <li className={styles.contactItem}>
                <span className={styles.contactIcon}>✉️</span>
                <span>support@statiomart.com</span>
              </li>
              <li className={styles.contactItem}>
                <span className={styles.contactIcon}>🕒</span>
                <span>Mon - Sat: 9:00 AM - 6:00 PM</span>
              </li>
              <li className={styles.contactItem}>
                <span className={styles.contactIcon}>💬</span>
                <span>24/7 AI Smart Assistant</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomInner}>
          <p className={styles.copyright}>
            &copy; {currentYear} <strong>StatioMart</strong>. All rights reserved. Built with modern e-commerce standards.
          </p>
          <div className={styles.legalLinks}>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Shipping Policy</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
