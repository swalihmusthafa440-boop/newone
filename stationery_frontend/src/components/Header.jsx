import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import styles from './Header.module.css'

export default function Header() {
  const { totalItems } = useCart()
  const { dark, toggle } = useTheme()
  const { isLoggedIn, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isHome = location.pathname === '/'
  const isCart = location.pathname === '/cart'
  const isCheckout = location.pathname === '/checkout'
  const isConfirmation = location.pathname.startsWith('/order-confirmation')
  const isProductDetail = location.pathname.startsWith('/product/')
  const isOrders = location.pathname === '/orders'
  const isAuth = location.pathname === '/auth'

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setDrawerOpen(false)
    navigate('/')
  }

  // Subpage header mode for Cart, Checkout, OrderConfirmation, ProductDetail, Orders
  const isSubpage = !isHome && !isAuth

  return (
    <>
      <header className={styles.header}>
        <div className={styles.navRow}>
          {/* Left: Back Arrow on subpages OR Hamburger menu on Home */}
          {isSubpage ? (
            <button
              className={styles.iconBtn}
              onClick={() => navigate(-1)}
              aria-label="Go back"
              title="Back"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <button
              className={styles.iconBtn}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu drawer"
              title="Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          {/* Center Brand Logo */}
          <div className={styles.brand} onClick={() => navigate('/')}>
            <div className={styles.logoIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" fill="#0070F3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              
            </div>
            <span className={styles.brandName}>StatioMart</span>
          </div>

          {/* Desktop Links (visible on desktop) */}
          <nav className={styles.desktopNav}>
            <button
              className={`${styles.navLink} ${isHome ? styles.navLinkActive : ''}`}
              onClick={() => navigate('/')}
            >
              Shop
            </button>
            <button
              className={`${styles.navLink} ${isOrders ? styles.navLinkActive : ''}`}
              onClick={() => navigate('/orders')}
            >
              My Orders
            </button>
            {user?.is_staff && (
              <button
                className={styles.navLink}
                onClick={() => navigate('/admin')}
              >
                Admin
              </button>
            )}
          </nav>

          {/* Right Actions: Back button OR User & Cart Icons */}
          <div className={styles.actions}>
            {isSubpage ? (
              <button
                className={styles.backPillBtn}
                onClick={() => navigate('/')}
                title="Back to shopping"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
            ) : (
              <>
                {/* User Profile */}
                <button
                  className={styles.iconBtn}
                  onClick={() => navigate(isLoggedIn ? '/orders' : '/auth')}
                  title={isLoggedIn ? (user?.username || 'My Account') : 'Sign In'}
                  aria-label="User account"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>

                {/* Cart Icon with Red Notification Badge */}
                <button
                  className={styles.cartIconBtn}
                  onClick={() => navigate('/cart')}
                  aria-label={`View cart with ${totalItems} items`}
                  title="View Shopping Cart"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  {totalItems > 0 && (
                    <span className={styles.cartBadge}>{totalItems}</span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Side Menu Drawer matching Bottom-Center of Reference Image */}
      {drawerOpen && (
        <div className={styles.drawerBackdrop} onClick={() => setDrawerOpen(false)}>
          <aside className={styles.drawer} onClick={e => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className={styles.drawerHeader}>
              <button
                className={styles.iconBtn}
                onClick={() => setDrawerOpen(false)}
                aria-label="Back"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>

              <div className={styles.brand} onClick={() => { setDrawerOpen(false); navigate('/') }}>
                <div className={styles.logoIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" fill="#0070F3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span className={styles.brandName}>StatioMart</span>
              </div>

              <button
                className={styles.iconBtn}
                onClick={() => setDrawerOpen(false)}
                aria-label="Close drawer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu List */}
            <div className={styles.drawerMenu}>
              <button
                className={styles.menuItem}
                onClick={() => { setDrawerOpen(false); navigate('/orders') }}
              >
                <div className={styles.menuItemLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <span>My Orders</span>
                </div>
                <span className={styles.chevron}>›</span>
              </button>

              <button
                className={styles.menuItem}
                onClick={() => { setDrawerOpen(false); navigate('/cart') }}
              >
                <div className={styles.menuItemLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>Wishlist</span>
                </div>
                <span className={styles.chevron}>›</span>
              </button>

              <button
                className={styles.menuItem}
                onClick={toggle}
              >
                <div className={styles.menuItemLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <span>Theme ({dark ? 'Dark' : 'Light'})</span>
                </div>
                <span className={styles.chevron}>›</span>
              </button>

              {user?.is_staff && (
                <button
                  className={styles.menuItem}
                  onClick={() => { setDrawerOpen(false); navigate('/admin') }}
                >
                  <div className={styles.menuItemLeft}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>Settings & Admin</span>
                  </div>
                  <span className={styles.chevron}>›</span>
                </button>
              )}

              {isLoggedIn ? (
                <button
                  className={styles.menuItem}
                  onClick={handleLogout}
                >
                  <div className={styles.menuItemLeft}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Logout</span>
                  </div>
                  <span className={styles.chevron}>›</span>
                </button>
              ) : (
                <button
                  className={styles.menuItem}
                  onClick={() => { setDrawerOpen(false); navigate('/auth') }}
                >
                  <div className={styles.menuItemLeft}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    <span>Login / Sign Up</span>
                  </div>
                  <span className={styles.chevron}>›</span>
                </button>
              )}
            </div>

            {/* Bottom Graphic matching Reference */}
            <div className={styles.drawerFooter}>
              <div className={styles.drawerPromo}>
                <h4 className={styles.promoTitle}>Your Stationery Partner</h4>
                <p className={styles.promoDesc}>Premium tools for bright minds</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
