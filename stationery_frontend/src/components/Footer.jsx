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
