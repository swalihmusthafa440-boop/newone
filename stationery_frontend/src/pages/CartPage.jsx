import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import styles from './CartPage.module.css'

export default function CartPage() {
  const { cartItems, updateQty, removeFromCart, totalAmount, totalItems } = useCart()
  const navigate = useNavigate()

  return (
    <div className={styles.cartPage}>
      {/* Reference Navy-Blue Header */}
      <header className={styles.topNav}>
        <button
          className={styles.backIconButton}
          onClick={() => navigate('/')}
          aria-label="Back to home"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className={styles.brandGroup} onClick={() => navigate('/')}>
          <div className={styles.brandIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" fill="#0070F3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className={styles.brandName}>StatioMart</span>
        </div>

        <button
          className={styles.backPillButton}
          onClick={() => navigate('/')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
      </header>

      {/* Main Cart Body */}
      <main className={styles.cartContainer}>
        {cartItems.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconWrapper}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0070F3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>Your cart is empty</h2>
            <p className={styles.emptyDesc}>Looks like you haven't added any stationery items yet.</p>
            <button className={styles.startShoppingBtn} onClick={() => navigate('/')}>
              Explore Stationery
            </button>
          </div>
        ) : (
          <div className={styles.contentWrap}>
            <div className={styles.itemsList}>
              {cartItems.map((item) => {
                const itemPrice = parseFloat(item.price || 0)
                const qty = item.cartQty || 1
                const itemTotal = itemPrice * qty
                const imgSrc = item.display_image || item.image_url || `https://placehold.co/120x120/EBF5FF/0070F3?text=${encodeURIComponent(item.name ? item.name[0] : 'S')}`

                return (
                  <div key={item.id} className={styles.cartCard}>
                    <div className={styles.cardMain}>
                      <div className={styles.leftcolumn}>
                        <div className={styles.imageBox}>
                        
                          <img
                            src={imgSrc}
                            alt={item.name}
                            className={styles.productImg}
                            onError={(e) => {
                              e.target.src = `https://placehold.co/120x120/EBF5FF/0070F3?text=${encodeURIComponent(item.name ? item.name[0] : 'S')}`
                            }}
                          />
                        </div>
                        <div className={styles.qtyControl}>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQty(item.id, -1)}
                            disabled={qty <= 1}
                            aria-label="Decrease quantity"
                          >
                          −
                          </button>
                          <span className={styles.qtyValue}>{qty}</span>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQty(item.id, 1)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className={styles.detailsBox}>
                        <h3 className={styles.productTitle}>{item.name}</h3>
                        <p className={styles.productSubtitle}>
                          {typeof item.description === 'string' && item.description.trim()
                            ? item.description.slice(0,30) +
                            (item.description.length > 45 ? '...' : '')
                            : 'Premium Stationery'}
                        </p>
                        <div className={styles.pricerow}>
                          <div className={styles.unitPrice}>₹ {Math.round(itemPrice)}</div>

                            <div className={styles.actionsRow}>
                              <button
                                className={styles.removeBtn}
                                onClick={() => removeFromCart(item.id)}
                                aria-label={`Remove ${item.name} from cart`}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                <span>Remove Item cart</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                    <div className={styles.itemFooter}>
                      <span className={styles.itemTotalLabel}>Total Price :</span>
                      <span className={styles.itemTotalValue}>₹ {Math.round(itemTotal)}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Total & Checkout Bar */}
            <div className={styles.checkoutBar}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total price :</span>
                <span className={styles.totalValue}>₹ {Math.round(totalAmount)}</span>
              </div>
              <button
                className={styles.proceedBtn}
                onClick={() => navigate('/checkout')}
              >
                <span>Proceed to Checkout</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
