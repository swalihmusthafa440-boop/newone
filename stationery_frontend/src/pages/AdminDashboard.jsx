import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getAdminStats, getOrders, getProducts, updateOrderStatus, deleteProduct, updateProduct } from '../api/api'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AddProduct from '../components/AddProduct'
import styles from './AdminDashboard.module.css'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: '#F59E0B', bg: '#FFFBEB' },
  { value: 'confirmed', label: 'Confirmed', color: '#3B82F6', bg: '#EFF6FF' },
  { value: 'shipped', label: 'Shipped', color: '#7C3AED', bg: '#F5F3FF' },
  { value: 'delivered', label: 'Delivered', color: '#10B981', bg: '#ECFDF5' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2' },
]

function normalizeArray(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.results)) return data.results
  if (Array.isArray(data.data)) return data.data
  return []
}

export default function AdminDashboard() {
  const { isLoggedIn, user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [tab, setTab] = useState('overview') // 'overview' | 'orders' | 'products'
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [orderFilter, setOrderFilter] = useState('all')
  const [orderSearch, setOrderSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productStockFilter, setProductStockFilter] = useState('all')

  // Modals & Editing
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, oRes, pRes] = await Promise.all([
        getAdminStats().catch(() => ({ data: null })),
        getOrders(),
        getProducts()
      ])
      setStats(sRes.data)
      setOrders(normalizeArray(oRes?.data))
      setProducts(normalizeArray(pRes?.data))
    } catch {
      toast.error('Failed to load dashboard data')
      setOrders([])
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/auth')
      return
    }
    if (user && !user.is_staff) {
      toast.error('Access restricted to administrators 🚫')
      navigate('/')
      return
    }
    loadData()
  }, [isLoggedIn, user, navigate, loadData])

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
      toast.success(`Order #${orderId} marked as "${newStatus}"`)
    } catch {
      toast.error('Failed to update order status')
    }
  }

  const handleQuickToggleProduct = async (product) => {
    const updatedStatus = !product.is_active
    try {
      await updateProduct(product.id, { is_active: updatedStatus })
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: updatedStatus } : p))
      )
      toast.success(`"${product.name}" is now ${updatedStatus ? 'Active' : 'Inactive'}`)
    } catch {
      toast.error('Failed to update product visibility')
    }
  }

  const confirmDeleteProduct = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteProduct(deleteTarget.id)
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast.success(`Product "${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete product')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = orderFilter === 'all' || o.status === orderFilter
      const q = orderSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        o.id.toString().includes(q) ||
        (o.address?.name && o.address.name.toLowerCase().includes(q)) ||
        (o.address?.city && o.address.city.toLowerCase().includes(q)) ||
        (o.address?.phone && o.address.phone.includes(q))
      return matchesStatus && matchesSearch
    })
  }, [orders, orderFilter, orderSearch])

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = productSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.category_name && p.category_name.toLowerCase().includes(q))
      
      let matchesStock = true
      if (productStockFilter === 'in_stock') matchesStock = p.stock > 5
      else if (productStockFilter === 'low_stock') matchesStock = p.stock > 0 && p.stock <= 5
      else if (productStockFilter === 'out_of_stock') matchesStock = p.stock === 0
      else if (productStockFilter === 'inactive') matchesStock = !p.is_active

      return matchesSearch && matchesStock
    })
  }, [products, productSearch, productStockFilter])

  // Derived metrics
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length
  const outOfStockCount = products.filter((p) => p.stock === 0).length
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div>
            <div className={styles.adminBadge}>👑 Administration Portal</div>
            <h1 className={styles.title}>Admin Dashboard</h1>
            <p className={styles.subtitle}>Manage catalog, process customer orders, and track revenue</p>
          </div>
          <div className={styles.topActions}>
            <button className={styles.refreshBtn} onClick={loadData} disabled={loading} title="Reload data">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Refresh
            </button>
            <button className={styles.addPrimaryBtn} onClick={() => { setEditingProduct(null); setShowAddModal(true) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add New Product
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsNav}>
          <button
            className={`${styles.tabBtn} ${tab === 'overview' ? styles.tabBtnActive : ''}`}
            onClick={() => setTab('overview')}
          >
            📊 Analytics & Overview
          </button>
          <button
            className={`${styles.tabBtn} ${tab === 'orders' ? styles.tabBtnActive : ''}`}
            onClick={() => setTab('orders')}
          >
            📦 Orders Management ({orders.length})
          </button>
          <button
            className={`${styles.tabBtn} ${tab === 'products' ? styles.tabBtnActive : ''}`}
            onClick={() => setTab('products')}
          >
            🛍️ Products Catalog ({products.length})
          </button>
        </div>

        {loading && (
          <div className={styles.loadingCenter}>
            <div className={styles.spinner} />
            <p>Loading administrative data...</p>
          </div>
        )}

        {/* ================= OVERVIEW TAB ================= */}
        {!loading && tab === 'overview' && (
          <div className={styles.overviewSection}>
            {/* Stat Cards Grid */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconOrders}`}>📦</div>
                <div>
                  <h3 className={styles.statVal}>{totalOrders}</h3>
                  <p className={styles.statLabel}>Total Orders</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconRevenue}`}>💰</div>
                <div>
                  <h3 className={styles.statVal}>₹{totalRevenue.toFixed(0)}</h3>
                  <p className={styles.statLabel}>Total Sales Revenue</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconPending}`}>⏳</div>
                <div>
                  <h3 className={styles.statVal}>{pendingOrders}</h3>
                  <p className={styles.statLabel}>Pending Processing</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconDelivered}`}>✅</div>
                <div>
                  <h3 className={styles.statVal}>{deliveredOrders}</h3>
                  <p className={styles.statLabel}>Delivered Orders</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconProducts}`}>🛍️</div>
                <div>
                  <h3 className={styles.statVal}>{products.length}</h3>
                  <p className={styles.statLabel}>Total Products</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconStock}`}>⚠️</div>
                <div>
                  <h3 className={styles.statVal}>{outOfStockCount}</h3>
                  <p className={styles.statLabel}>Out of Stock</p>
                  {lowStockCount > 0 && (
                    <span className={styles.lowStockHint}>+ {lowStockCount} low in stock</span>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>Recent Orders</h2>
                <button className={styles.panelLink} onClick={() => setTab('orders')}>
                  View All Orders →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className={styles.emptyTable}>No orders received yet.</div>
              ) : (
                <div className={styles.tableResponsive}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 8).map((order) => {
                        const stObj = STATUS_OPTIONS.find((s) => s.value === order.status) || STATUS_OPTIONS[0]
                        return (
                          <tr key={order.id}>
                            <td>
                              <span className={styles.orderIdBadge}>#{order.id}</span>
                            </td>
                            <td>
                              <div className={styles.customerCell}>
                                <span className={styles.custName}>{order.address?.name || 'Guest User'}</span>
                                <span className={styles.custSub}>{order.address?.city || 'India'}</span>
                              </div>
                            </td>
                            <td className={styles.dateCell}>
                              {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className={styles.itemsCell}>{order.items?.length || 1} item(s)</td>
                            <td className={styles.amountCell}>₹{parseFloat(order.total_amount).toFixed(0)}</td>
                            <td>
                              <span
                                className={styles.statusPill}
                                style={{ background: stObj.bg, color: stObj.color }}
                              >
                                {stObj.label}
                              </span>
                            </td>
                            <td>
                              <select
                                className={styles.statusSelectSm}
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ORDERS TAB ================= */}
        {!loading && tab === 'orders' && (
          <div className={styles.tabSection}>
            {/* Filter bar */}
            <div className={styles.filterRow}>
              <div className={styles.searchWrap}>
                <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search by Order #, customer name, phone, city..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Status:</span>
                <select
                  className={styles.filterSelect}
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                >
                  <option value="all">All Statuses ({orders.length})</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label} ({orders.filter((o) => o.status === s.value).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Orders list */}
            {filteredOrders.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔍</div>
                <h3 className={styles.emptyTitle}>No matching orders found</h3>
                <p className={styles.emptyDesc}>Try changing your filter criteria or search terms.</p>
              </div>
            ) : (
              <div className={styles.ordersGrid}>
                {filteredOrders.map((order) => {
                  const stObj = STATUS_OPTIONS.find((s) => s.value === order.status) || STATUS_OPTIONS[0]
                  return (
                    <div key={order.id} className={styles.orderCard}>
                      <div className={styles.orderCardHeader}>
                        <div>
                          <div className={styles.orderCardId}>
                            Order #{order.id}
                            <span className={styles.orderDate}>
                              · {new Date(order.created_at).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className={styles.customerName}>
                            👤 {order.address?.name || 'Guest User'} &nbsp;|&nbsp; 📞 {order.address?.phone || order.phone || 'N/A'}
                          </p>
                        </div>
                        <div className={styles.orderCardPrice}>
                          <span className={styles.totalPrice}>₹{parseFloat(order.total_amount).toFixed(0)}</span>
                          <span className={styles.payBadge}>💵 COD</span>
                        </div>
                      </div>

                      {/* Address */}
                      <div className={styles.orderAddressBox}>
                        <span className={styles.addrIcon}>📍</span>
                        <p className={styles.addrText}>
                          {order.address?.address_line1}
                          {order.address?.address_line2 ? `, ${order.address.address_line2}` : ''}
                          , {order.address?.city}, {order.address?.state} - {order.address?.pincode}
                        </p>
                      </div>

                      {/* Items */}
                      <div className={styles.orderItemsList}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} className={styles.orderItemRow}>
                            <span className={styles.orderItemName}>{item.product_name || `Product #${item.product}`}</span>
                            <span className={styles.orderItemQty}>× {item.quantity}</span>
                            <span className={styles.orderItemSubtotal}>₹{parseFloat(item.subtotal || (item.unit_price * item.quantity)).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Footer / Status Changer */}
                      <div className={styles.orderCardFooter}>
                        <div className={styles.statusChangeWrap}>
                          <span className={styles.statusLabel}>Update Status:</span>
                          <select
                            className={styles.statusSelect}
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            style={{ color: stObj.color, borderColor: stObj.color }}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          className={styles.receiptBtn}
                          onClick={() => navigate(`/order-confirmation/${order.id}`)}
                        >
                          Receipt →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= PRODUCTS TAB ================= */}
        {!loading && tab === 'products' && (
          <div className={styles.tabSection}>
            {/* Filter and search bar */}
            <div className={styles.filterRow}>
              <div className={styles.searchWrap}>
                <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search products by title, category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Stock / Visibility:</span>
                <select
                  className={styles.filterSelect}
                  value={productStockFilter}
                  onChange={(e) => setProductStockFilter(e.target.value)}
                >
                  <option value="all">All Products ({products.length})</option>
                  <option value="in_stock">In Stock ({products.filter((p) => p.stock > 5).length})</option>
                  <option value="low_stock">Low Stock (≤5) ({lowStockCount})</option>
                  <option value="out_of_stock">Out of Stock ({outOfStockCount})</option>
                  <option value="inactive">Hidden / Inactive ({products.filter((p) => !p.is_active).length})</option>
                </select>
              </div>

              <button
                className={styles.addSecondaryBtn}
                onClick={() => { setEditingProduct(null); setShowAddModal(true) }}
              >
                + Add Product
              </button>
            </div>

            {/* Products Table */}
            {filteredProducts.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📦</div>
                <h3 className={styles.emptyTitle}>No products found</h3>
                <p className={styles.emptyDesc}>Try adjusting your search or add a new product.</p>
              </div>
            ) : (
              <div className={styles.panelCard}>
                <div className={styles.tableResponsive}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className={!p.is_active ? styles.inactiveRow : ''}>
                          <td>
                            <div className={styles.productCell}>
                              <img
                                src={
                                  p.display_image ||
                                  p.image_url ||
                                  `https://placehold.co/60x60/2563EB/white?text=${encodeURIComponent(p.name[0])}`
                                }
                                alt={p.name}
                                className={styles.prodThumb}
                                onError={(e) => {
                                  e.target.src = `https://placehold.co/60x60/2563EB/white?text=${encodeURIComponent(p.name[0])}`
                                }}
                              />
                              <div>
                                <h4 className={styles.prodName}>{p.name}</h4>
                                <span className={styles.prodId}>ID: #{p.id}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={styles.catBadge}>{p.category_name || 'General'}</span>
                          </td>
                          <td className={styles.priceCell}>₹{parseFloat(p.price).toFixed(2)}</td>
                          <td>
                            <span
                              className={`${styles.stockBadge} ${
                                p.stock === 0
                                  ? styles.stockOut
                                  : p.stock <= 5
                                  ? styles.stockLow
                                  : styles.stockGood
                              }`}
                            >
                              {p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`${styles.visibilityBtn} ${p.is_active ? styles.visibleBtn : styles.hiddenBtn}`}
                              onClick={() => handleQuickToggleProduct(p)}
                              title="Toggle public visibility"
                            >
                              {p.is_active ? 'Active' : 'Hidden'}
                            </button>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className={styles.actionBtns}>
                              <button
                                className={styles.actionBtnEdit}
                                onClick={() => {
                                  setEditingProduct(p)
                                  setShowAddModal(true)
                                }}
                                title="Edit Product"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className={styles.actionBtnDel}
                                onClick={() => setDeleteTarget(p)}
                                title="Delete Product"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <AddProduct
          productToEdit={editingProduct}
          onClose={() => {
            setShowAddModal(false)
            setEditingProduct(null)
          }}
          onSuccess={loadData}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>⚠️</div>
            <h3 className={styles.confirmTitle}>Delete Product</h3>
            <p className={styles.confirmText}>
              Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>? This will permanently remove it from the catalog.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancel}
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDelete}
                onClick={confirmDeleteProduct}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
