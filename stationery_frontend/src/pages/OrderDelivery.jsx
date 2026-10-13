import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getSavedAddresses, placeOrder, validateCoupon } from '../api/api'
import Header from '../components/Header'
import styles from './OrderDelivery.module.css'

const DISTRICTS = [
  'Ernakulam', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam',
  'Palakkad', 'Alappuzha', 'Malappuram', 'Kannur', 'Kottayam', 'Kasaragod',
  'Idukki', 'Pathanamthitta', 'Wayanad', 'Bengaluru Urban', 'Chennai', 'Mumbai City', 'New Delhi'
]

const INITIAL_FORM = {
  name: '',
  house_no: '',
  phone: '',
  district: '',
  address_line1: '',
  city: '',
  state: 'Kerala',
  pincode: '682001',
  is_saved: true
}

function normalizeArray(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.results)) return data.results
  if (Array.isArray(data.data)) return data.data
  return []
}

export default function OrderDelivery() {
  const { cartItems, totalAmount, clearCart } = useCart()
  const { isLoggedIn, user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [useSavedAddress, setUseSavedAddress] = useState(false)
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [saveForFuture, setSaveForFuture] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('cod') // 'cod' | 'gpay'
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart')
    }
  }, [cartItems, navigate])

  useEffect(() => {
    if (!isLoggedIn) return
    getSavedAddresses()
      .then(res => {
        const addrs = normalizeArray(res?.data)
        setSavedAddresses(addrs)
        if (addrs.length > 0) {
          setSelectedAddressId(addrs[0].id)
          setUseSavedAddress(true)
        }
      })
      .catch(() => { setSavedAddresses([]) })
  }, [isLoggedIn])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    setAddressConfirmed(false)
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required'
    if (!form.house_no.trim() && !form.address_line1.trim()) errs.house_no = 'House / Building name is required'
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone)) errs.phone = 'Valid 10-digit phone required'
    if (!form.district) errs.district = 'Select a district'
    return errs
  }

  const handleConfirmAddress = (e) => {
    e?.preventDefault?.()
    if (!useSavedAddress) {
      const errs = validate()
      if (Object.keys(errs).length > 0) {
        setErrors(errs)
        toast.warning('Please complete the address details.')
        return
      }
    }
    setAddressConfirmed(true)
    toast.success('Address confirmed! ✓')
  }

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setForm(prev => ({
            ...prev,
            district: prev.district || 'Ernakulam',
            city: prev.city || 'Kochi',
            pincode: prev.pincode || '682001'
          }))
          toast.success('Location detected! District filled.')
        },
        () => {
          toast.info('Location access unavailable. Please select your district.')
        }
      )
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await validateCoupon(couponCode.trim().toUpperCase(), subtotal)
      setCoupon(res.data)
      toast.success(`Coupon "${res.data.code}" applied!`)
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid or expired coupon')
      setCoupon(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const subtotal = totalAmount
  const discount = coupon
    ? coupon.discount_type === 'percent'
      ? (subtotal * parseFloat(coupon.discount_value) / 100)
      : Math.min(parseFloat(coupon.discount_value), subtotal)
    : 0
  const grandTotal = Math.max(0, subtotal - discount)

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (submitting) return

    if (!useSavedAddress) {
      const errs = validate()
      if (Object.keys(errs).length > 0) {
        setErrors(errs)
        toast.warning('Please fill in required delivery information.')
        return
      }
    }

    setSubmitting(true)
    try {
      const line1 = form.house_no || form.address_line1 || 'Main Street'
      const activeDistrict = form.district || 'Ernakulam'
      const activeCity = form.city || activeDistrict
      const activePhone = form.phone || '9876543210'

      const addressPayload = {
        name: form.name || user?.username || 'Customer',
        phone: activePhone,
        address_line1: line1,
        address_line2: form.district || '',
        city: activeCity,
        state: form.state || 'Kerala',
        pincode: form.pincode || '682001',
        is_saved: saveForFuture
      }

      const payload = {
        payment_method: 'cod', // Currently Cash on Delivery is recorded in the Order model
        phone: activePhone,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.cartQty || 1
        })),
        coupon_code: coupon?.code || null,
        ...(useSavedAddress && selectedAddressId
          ? { address_id: selectedAddressId }
          : { address_data: addressPayload }
        )
      }

      const res = await placeOrder(payload)
      clearCart()
      toast.success('Order placed successfully! 🎉')
      navigate(`/order-confirmation/${res.data.id}`)
    } catch (err) {
      const msg = err.response?.data?.detail ||
                  err.response?.data?.items ||
                  err.response?.data?.non_field_errors?.[0] ||
                  'Failed to place order. Please review your details and try again.'
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.checkoutPage}>
      <Header />

      <main className={styles.container}>
        <form onSubmit={handleSubmit} noValidate>
          {/* 📍 Address Section matching Reference Top-Center Screen */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h2 className={styles.sectionTitle}>Address</h2>
            </div>

            {/* Saved Address Toggle if available */}
            {savedAddresses.length > 0 && (
              <div className={styles.savedAddressesBar}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={useSavedAddress}
                    onChange={(e) => setUseSavedAddress(e.target.checked)}
                  />
                  <span>Use saved address ({savedAddresses.length} available)</span>
                </label>
                {useSavedAddress && (
                  <select
                    className={styles.savedSelect}
                    value={selectedAddressId || ''}
                    onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                  >
                    {savedAddresses.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} — {a.address_line1}, {a.city} ({a.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Address Form Inputs */}
            {!useSavedAddress && (
              <div className={styles.formFields}>
                {/* Full Name */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Full Name</label>
                  <input
                    name="name"
                    type="text"
                    className={`${styles.textInput} ${errors.name ? styles.inputError : ''}`}
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                {/* House no. / Building name */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>House no. / Building name</label>
                  <input
                    name="house_no"
                    type="text"
                    className={`${styles.textInput} ${errors.house_no ? styles.inputError : ''}`}
                    placeholder="House no. / Building name"
                    value={form.house_no}
                    onChange={handleChange}
                  />
                  {errors.house_no && <span className={styles.errorText}>{errors.house_no}</span>}
                </div>

                {/* Two Column Row: Phone number & District */}
                <div className={styles.twoColRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Phone number</label>
                    <input
                      name="phone"
                      type="tel"
                      maxLength={10}
                      className={`${styles.textInput} ${errors.phone ? styles.inputError : ''}`}
                      placeholder="Enter phone number"
                      value={form.phone}
                      onChange={handleChange}
                    />
                    {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>District</label>
                    <select
                      name="district"
                      className={`${styles.selectInput} ${errors.district ? styles.inputError : ''}`}
                      value={form.district}
                      onChange={handleChange}
                    >
                      <option value="">Select district ∨</option>
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    {errors.district && <span className={styles.errorText}>{errors.district}</span>}
                  </div>
                </div>

                {/* Checkbox: Use this address for another order */}
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={saveForFuture}
                    onChange={(e) => setSaveForFuture(e.target.checked)}
                    className={styles.styledCheckbox}
                  />
                  <span className={styles.checkboxText}>Use this address for another order</span>
                </label>

                {/* Confirm the address Button matching Reference */}
                <button
                  type="button"
                  className={`${styles.confirmAddressBtn} ${addressConfirmed ? styles.confirmed : ''}`}
                  onClick={handleConfirmAddress}
                >
                  {addressConfirmed ? 'Address Confirmed ✓' : 'Confirm the address'}
                </button>

                {/* Use Location Pill Button matching Reference */}
                <button
                  type="button"
                  className={styles.useLocationBtn}
                  onClick={handleUseLocation}
                >
                  <div className={styles.useLocationLeft}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0070F3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>Use location</span>
                  </div>
                  <span className={styles.locationChevron}>›</span>
                </button>
              </div>
            )}
          </div>

          {/* 💳 Payment Section matching Reference Top-Center Screen */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h2 className={styles.sectionTitle}>Payment</h2>
            </div>

            {/* Payment Method Radio Options */}
            <div className={styles.paymentOptions}>
              {/* Option 1: Cash on delivery */}
              <label
                className={`${styles.paymentOptionRow} ${paymentMethod === 'cod' ? styles.paymentSelected : ''}`}
                onClick={() => setPaymentMethod('cod')}
              >
                <div className={styles.radioVisual}>
                  <div className={`${styles.radioOuter} ${paymentMethod === 'cod' ? styles.radioOuterActive : ''}`}>
                    {paymentMethod === 'cod' && <div className={styles.radioInner} />}
                  </div>
                </div>
                <div className={styles.paymentOptionInfo}>
                  <span className={styles.paymentOptionName}>Cash on delivery</span>
                  <span className={styles.paymentOptionSub}>Pay cash when order arrives</span>
                </div>
              </label>

              {/* Option 2: Pay on Google Pay with QR Code Preview */}
              <label
                className={`${styles.paymentOptionRow} ${paymentMethod === 'gpay' ? styles.paymentSelected : ''}`}
                onClick={() => setPaymentMethod('gpay')}
              >
                <div className={styles.radioVisual}>
                  <div className={`${styles.radioOuter} ${paymentMethod === 'gpay' ? styles.radioOuterActive : ''}`}>
                    {paymentMethod === 'gpay' && <div className={styles.radioInner} />}
                  </div>
                </div>
                <div className={styles.paymentOptionInfo}>
                  <span className={styles.paymentOptionName}>Pay on Google Pay</span>
                  <span className={styles.paymentOptionSub}>Scan QR code with UPI / GPay</span>
                </div>
              </label>

              {paymentMethod === 'gpay' && (
                <div className={styles.gpayPreviewCard}>
                  {/* Decorative QR code preview matching reference image */}
                  <div className={styles.qrCodeBox}>
                    <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="1.6">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <path d="M14 14h3v3h-3zM17 17h4v4h-4zM7 7h-1v-1M18 7h-1v-1M7 18h-1v-1" />
                    </svg>
                  </div>
                  <div className={styles.gpayLogo}>
                    <span style={{ color: '#4285F4', fontWeight: 800 }}>G</span>
                    <span style={{ color: '#5F6368', fontWeight: 700 }}>Pay</span>
                  </div>
                </div>
              )}
            </div>

            {/* Promo Code Input */}
            <div className={styles.promoWrap}>
              <div className={styles.promoInputRow}>
                <input
                  className={styles.promoInput}
                  type="text"
                  placeholder="Enter Promo Code (e.g. SAVE10)"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                />
                <button
                  type="button"
                  className={styles.promoApplyBtn}
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && <p className={styles.couponErr}>{couponError}</p>}
              {coupon && <p className={styles.couponOk}>✓ {coupon.code} applied (₹{discount.toFixed(0)} off)</p>}
            </div>
          </div>

          {/* Summary & Place Order Button matching Reference */}
          <div className={styles.orderSummaryCard}>
            <div className={styles.summaryTotalRow}>
              <span className={styles.summaryTotalLabel}>Total to Pay:</span>
              <span className={styles.summaryTotalVal}>₹ {Math.round(grandTotal)}</span>
            </div>

            <button
              type="submit"
              className={styles.placeOrderBtn}
              disabled={submitting}
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
