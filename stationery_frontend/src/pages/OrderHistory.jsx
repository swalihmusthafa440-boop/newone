import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrders, updateOrderStatus } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import styles from './OrderHistory.module.css'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#F59E0B', bg: '#FFFBEB', icon: '⏳' },
  confirmed: { label: 'Confirmed', color: '#3B82F6', bg: '#EFF6FF', icon: '✔️' },
  shipped:   { label: 'Shipped',   color: '#7C3AED', bg: '#F5F3FF', icon: '🚚' },
  delivered: { label: 'Delivered', color: '#10B981', bg: '#ECFDF5', icon: '🎁' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2', icon: '❌' },
}

const STEPS = ['pending', 'confirmed', 'shipped', 'delivered']

function OrderTracker({ status }) {
  if (status === 'cancelled') return null
  const currentIdx = STEPS.indexOf(status)
  return (
    <div className={styles.tracker}>
      {STEPS.map((step, i) => (
        <div key={step} className={`${styles.trackerStep} ${i <= currentIdx ? styles.trackerDone : ''}`}>
          <div className={styles.trackerDot}>
            {i <= currentIdx ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            ) : null}
          </div>
          <span className={styles.trackerLabel}>{STATUS_CONFIG[step]?.label || step}</span>
          {i < STEPS.length - 1 && <div className={`${styles.trackerLine} ${i < currentIdx ? styles.trackerLineDone : ''}`} />}
        </div>
      ))}
    </div>
  )
}

function normalizeArray(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.results)) return data.results
  if (Array.isArray(data.data)) return data.data
  return []
}

export default function OrderHistory() {
  const { isLoggedIn } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => {
    if (!isLoggedIn) { navigate('/auth'); return }
    getOrders()
      .then(res => setOrders(normalizeArray(res?.data)))
      .catch(() => { setOrders([]) })
      .finally(() => setLoading(false))
  }, [isLoggedIn, navigate])

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderId}?`)) return
    setCancellingId(orderId)
    try {
      await updateOrderStatus(orderId, 'cancelled')
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
      toast.success(`Order #${orderId} has been cancelled.`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel order.')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>My Orders</h1>
            <p className={styles.pageSubtitle}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
          </div>
          <button className={styles.shopBtn} onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
            </svg>
            Shop More
          </button>
        </div>

        {loading && (
          <div className={styles.loading}>
            {[1,2,3].map(i => <div key={i} className={`skeleton ${styles.orderSkeleton}`} />)}
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📦</div>
            <h2 className={styles.emptyTitle}>No orders yet</h2>
            <p className={styles.emptyDesc}>When you place orders, they'll appear here.</p>
            <button className={styles.emptyBtn} onClick={() => navigate('/')}>Start Shopping</button>
          </div>
        )}

        <div className={styles.orderList}>
          {orders.map(order => {
            const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
            const isOpen = expanded === order.id
            return (
              <div key={order.id} className={`${styles.orderCard} ${isOpen ? styles.orderCardOpen : ''}`}>
                <div className={styles.orderHeader} onClick={() => setExpanded(isOpen ? null : order.id)}>
                  <div className={styles.orderLeft}>
                    <div className={styles.orderNumber}>Order #{order.id}</div>
                    <div className={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className={styles.orderRight}>
                    <span className={styles.statusBadge} style={{ background: st.bg, color: st.color }}>
                      {st.icon} {st.label}
                    </span>
                    <span className={styles.orderTotal}>₹{parseFloat(order.total_amount).toFixed(0)}</span>
                    <div className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className={styles.orderBody}>
                    <OrderTracker status={order.status} />

                    <div className={styles.itemsSection}>
                      <h3 className={styles.sectionTitle}>Items</h3>
                      <div className={styles.itemsList}>
                        {order.items?.map((item, i) => (
                          <div key={i} className={styles.item}>
                            <span className={styles.itemName}>{item.product_name || `Item #${item.product}`}</span>
                            <span className={styles.itemQty}>×{item.quantity}</span>
                            <span className={styles.itemPrice}>₹{parseFloat(item.unit_price).toFixed(0)}</span>
                            <span className={styles.itemSubtotal}>₹{parseFloat(item.subtotal || (item.unit_price * item.quantity)).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={styles.infoGrid}>
                      <div className={styles.infoCard}>
                        <p className={styles.infoLabel}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          Delivery Address
                        </p>
                        <p className={styles.infoValue}>
                          {order.address?.name}<br/>
                          {order.address?.address_line1} {order.address?.address_line2 ? `, ${order.address.address_line2}` : ''}<br/>
                          {order.address?.city}, {order.address?.state} – {order.address?.pincode}
                        </p>
                      </div>
                      <div className={styles.infoCard}>
                        <p className={styles.infoLabel}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="4" width="22" height="16" rx="2"/>
                            <path d="M1 10h22"/>
                          </svg>
                          Payment
                        </p>
                        <p className={styles.infoValue}>Cash on Delivery</p>
                        {order.coupon && (
                          <p className={styles.couponTag}>🎁 Coupon: {order.coupon.code} – ₹{parseFloat(order.discount_amount || 0).toFixed(0)} off</p>
                        )}
                      </div>
                    </div>

                    <div className={styles.orderFooter}>
                      <div className={styles.totalRow}>
                        <span>Order Total</span>
                        <span className={styles.totalAmt}>₹{parseFloat(order.total_amount).toFixed(0)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {order.status === 'pending' && (
                          <button
                            onClick={e => { e.stopPropagation(); handleCancelOrder(order.id) }}
                            disabled={cancellingId === order.id}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '8px',
                              border: '1px solid #EF4444',
                              background: '#FEF2F2',
                              color: '#EF4444',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {cancellingId === order.id ? 'Cancelling...' : '✕ Cancel Order'}
                          </button>
                        )}
                        <button className={styles.receiptBtn}
                          onClick={e => { e.stopPropagation(); navigate(`/order-confirmation/${order.id}`) }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/>
                          </svg>
                          View Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
      <Footer />
    </div>
  )
}
