import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrder } from '../api/api'
import Header from '../components/Header'
import Footer from '../components/Footer'
import styles from './OrderConfirmation.module.css'

export default function OrderConfirmation() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrder(orderId)
      .then(res => { setOrder(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [orderId])

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.container}>
        <div className={styles.successCard}>
          {/* Radiating Green Checkmark Graphic matching Reference Image */}
          <div className={styles.graphicContainer}>
            <div className={styles.radiatingRays}>
              <span className={`${styles.ray} ${styles.ray1}`} />
              <span className={`${styles.ray} ${styles.ray2}`} />
              <span className={`${styles.ray} ${styles.ray3}`} />
              <span className={`${styles.ray} ${styles.ray4}`} />
              <span className={`${styles.ray} ${styles.ray5}`} />
              <span className={`${styles.ray} ${styles.ray6}`} />
              <span className={`${styles.ray} ${styles.ray7}`} />
              <span className={`${styles.ray} ${styles.ray8}`} />
            </div>

            <div className={styles.greenCircleBadge}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          {/* Heading matching Reference Image */}
          <h1 className={styles.successTitle}>
            Order Placed <br />
            Successfully!
          </h1>

          {/* Subtext matching Reference Image */}
          <p className={styles.successSubtext}>
            Thank you for shopping with <br />
            <strong>STATIOMART</strong>. <br />
            Your order has been placed and <br />
            will be processed soon.
          </p>

          {/* Order Details Badge if loaded */}
          {order && (
            <div className={styles.orderMetaBadge}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Order ID:</span>
                <span className={styles.metaVal}>#{order.id}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Total Amount:</span>
                <span className={styles.metaVal}>₹ {Math.round(parseFloat(order.total_amount || 0))}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Payment:</span>
                <span className={styles.metaVal}>Cash on Delivery</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Status:</span>
                <span className={styles.statusPill}>{order.status.toUpperCase()}</span>
              </div>
            </div>
          )}

          {/* Action Button: Continue Shopping → matching Reference */}
          <button
            className={styles.continueBtn}
            onClick={() => navigate('/')}
          >
            <span>Continue Shopping</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
