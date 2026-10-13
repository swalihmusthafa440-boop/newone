import { useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import styles from './FloatingCart.module.css'

export default function FloatingCart() {
  const { totalItems, totalAmount } = useCart()
  const location = useLocation()
  const navigate = useNavigate()

  // Pages where floating cart should be HIDDEN
  const hiddenPaths = [
    '/cart',
    '/checkout',
    '/auth',
    '/admin'
  ]

  const isHidden = hiddenPaths.some(p => location.pathname === p) ||
                   location.pathname.startsWith('/order-confirmation')

  if (isHidden) return null

  return (
    <button
      className={styles.floatingCart}
      onClick={() => navigate('/cart')}
      aria-label={`View Cart with ${totalItems} items`}
      title="View Shopping Cart"
    >
      <div className={styles.cartIconWrapper}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {totalItems > 0 && (
          <span className={styles.badge}>{totalItems}</span>
        )}
      </div>
      <span className={styles.cartLabel}>Cart</span>
      {totalItems > 0 && (
        <span className={styles.cartPrice}>₹{Math.round(totalAmount)}</span>
      )}
    </button>
  )
}
