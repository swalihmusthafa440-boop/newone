
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  getSavedAddresses,
  placeOrder,
  validateCoupon,getDeliveryChargePreview
} from '../api/api'

import Header from '../components/Header'
import styles from './OrderDelivery.module.css'

const DISTRICTS = [
  'Ernakulam', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur',
  'Kollam', 'Palakkad', 'Alappuzha', 'Malappuram', 'Kannur',
  'Kottayam', 'Kasaragod', 'Idukki', 'Pathanamthitta', 'Wayanad',
  'Bengaluru Urban', 'Chennai', 'Mumbai City', 'New Delhi'
]

const INITIAL_FORM = {
  name: '',
  house_no: '',
  phone: '',
  district: '',
  address_line1: '',
  city: '',
  state: 'Kerala',
  pincode: '',
  is_saved: true
}

const DEFAULT_LOCATION = {
  lat: 10.8505,
  lng: 76.2711
}

let googleMapsOptionsConfigured = false



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
  const [deliveryCharge, setDeliveryCharge] = useState(null)
  const [deliveryChargeLoading, setDeliveryChargeLoading] = useState(false)
  const [deliveryChargeError, setDeliveryChargeError] = useState('')

  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)

  const [useSavedAddress, setUseSavedAddress] = useState(false)
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [saveForFuture, setSaveForFuture] = useState(true)

  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  const [showMap, setShowMap] = useState(false)
  const [locationCoords, setLocationCoords] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [mapLoading, setMapLoading] = useState(false)
  const [mapError, setMapError] = useState('')

  const mapElementRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const loaderRef = useRef(null)
  const latitude = locationCoords?.lat ?? null
  const longitude = locationCoords?.lng ?? null
  const [locationConfirmed, setLocationConfirmed] = useState(false)

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart')
    }
  }, [cartItems, navigate])


  useEffect(() => {
    if (!isLoggedIn) return

    getSavedAddresses()
      .then(res => {
        const addresses = normalizeArray(res?.data)
        setSavedAddresses(addresses)

        if (addresses.length > 0) {
          const saved = addresses[0]

          setSelectedAddressId(saved.id)
          setUseSavedAddress(true)

          const lat = Number(saved.latitude)
          const lng = Number(saved.longitude)

          if (
            saved.latitude != null &&
            saved.longitude != null &&
            saved.latitude !== '' &&
            saved.longitude !== '' &&
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180
          ) {
            setLocationCoords({ lat, lng })
            setLocationConfirmed(true)
          } else {
            setLocationCoords(null)
            setLocationConfirmed(false)
          }
        }
      })
      .catch(err => {
        console.error('Failed to load saved addresses:', err)
        setSavedAddresses([])
      })
  }, [isLoggedIn])

  // Load Google Maps using the current functional loader API.
  useEffect(() => {
    if (!showMap) return

    let cancelled = false

    async function initializeMap() {
      setMapLoading(true)
      setMapError('')

      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

        if (!apiKey) {
          throw new Error(
            'Google Maps API key missing. Check your frontend .env file.'
          )
        }

        if (!googleMapsOptionsConfigured) {
          setOptions({
            key: apiKey,
            v: 'weekly'
          })
          googleMapsOptionsConfigured = true
        }

        const { Map } = await importLibrary('maps')
        const { AdvancedMarkerElement } = await importLibrary('marker')

        if (cancelled || !mapElementRef.current) return

        const map = new Map(mapElementRef.current, {
          center: locationCoords || DEFAULT_LOCATION,
          zoom: locationCoords ? 19 : 8,
          mapId: 'DEMO_MAP_ID',
          mapTypeId: 'satellite',
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'greedy'
        })

        mapInstanceRef.current = map

        const marker = new AdvancedMarkerElement({
          map: locationCoords ? map : null,
          position: locationCoords || undefined,
          gmpDraggable: true,
          title: 'Delivery location'
        })

        markerRef.current = marker

        const selectLocation = position => {
          const coordinates = {
            lat:
              typeof position.lat === 'function'
                ? position.lat()
                : position.lat,
            lng:
              typeof position.lng === 'function'
                ? position.lng()
                : position.lng
          }

          setLocationCoords(coordinates)
          marker.position = coordinates
          marker.map = map
          map.panTo(coordinates)
        }

        map.addListener('click', event => {
          if (event.latLng) {
            selectLocation(event.latLng)
          }
        })

        marker.addListener('dragend', () => {
          if (marker.position) {
            selectLocation(marker.position)
          }
        })

        if (locationCoords) {
          marker.position = locationCoords
          marker.map = map
        }
      } catch (error) {
        console.error('Google Maps error:', error)

        if (!cancelled) {
          setMapError(
            error.message ||
              'Google Maps could not load. Check your API key and Maps JavaScript API settings.'
          )
        }
      } finally {
        if (!cancelled) {
          setMapLoading(false)
        }
      }
    }

    initializeMap()

    return () => {
      cancelled = true
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [showMap])


// Update the map pin when GPS coordinates change.
useEffect(() => {
  if (!locationCoords || !mapInstanceRef.current) return

  mapInstanceRef.current.setCenter(locationCoords)
  mapInstanceRef.current.setZoom(19)

  if (markerRef.current) {
    markerRef.current.position = locationCoords
    markerRef.current.map = mapInstanceRef.current
  }
}, [locationCoords])

  const handleChange = e => {
    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value
    }))

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    setAddressConfirmed(false)
  }

  const validate = () => {
    const validationErrors = {}

    if (!form.name.trim()) {
      validationErrors.name = 'Full name is required'
    }

    if (!form.house_no.trim() && !form.address_line1.trim()) {
      validationErrors.house_no =
        'House / Building name is required'
    }

    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone)) {
      validationErrors.phone = 'Valid 10-digit phone required'
    }

    if (!form.district) {
      validationErrors.district = 'Select a district'
    }

    return validationErrors
  }

  const handleConfirmAddress = e => {
    e?.preventDefault?.()

    if (!useSavedAddress) {
      const validationErrors = validate()

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        toast.warning('Please complete the address details.')
        return
      }
    }

    setAddressConfirmed(true)
    toast.success('Address confirmed!')
  }

  const handleUseLocation = () => {
    setLocationConfirmed(false)
    setShowMap(true)
    setMapError('')
  }
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location is not supported by this browser.')
      return
    }

    setLocationLoading(true)

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationLoading(false)
        setShowMap(true)
      
        if (coords.accuracy > 100) {
          toast.warning(
            `GPS accuracy is poor (about ${Math.round(coords.accuracy)} metres). Please select your house manually on the map.`
          )
          return
        }
      
        setLocationCoords({
          lat: coords.latitude,
          lng: coords.longitude
        })
      
        toast.success('Location detected! Check your map pin.')
      },

      error => {
        setLocationLoading(false)

        toast.error(
          error.code === 1
            ? 'Please allow location access in your browser.'
            : 'Could not detect your location. Select a point on the map.'
        )

        setShowMap(true)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    )
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    setCouponLoading(true)
    setCouponError('')

    try {
      const res = await validateCoupon(
        couponCode.trim().toUpperCase(),
        subtotal
      )

      setCoupon(res.data)
      toast.success(`Coupon "${res.data.code}" applied!`)
    } catch (err) {
      setCouponError(
        err.response?.data?.error || 'Invalid or expired coupon'
      )
      setCoupon(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const subtotal = totalAmount

  const discount = coupon
    ? coupon.discount_type === 'percent'
      ? subtotal * (parseFloat(coupon.discount_value) / 100)
      : Math.min(parseFloat(coupon.discount_value), subtotal)
    : 0



  useEffect(() => {
    if (
      !locationConfirmed ||
      !locationCoords ||
      !cartItems.length
    ) {
      setDeliveryCharge(null)
      return
    }

    let cancelled = false

    const fetchDeliveryCharge = async () => {

      setDeliveryChargeLoading(true)
      setDeliveryChargeError('')

      try {

        const response = await getDeliveryChargePreview({
          latitude: locationCoords.lat,
          longitude: locationCoords.lng,

          product_ids: cartItems.map(item => item.id)
        })

        if (!cancelled) {
          setDeliveryCharge(
            Number(response.data.delivery_charge)
          )
        }

      } catch (error) {

        if (!cancelled) {
          setDeliveryCharge(null)

          setDeliveryChargeError(
            error.response?.data?.error ||
            'Unable to calculate delivery charge.'
          )
        }

      } finally {

        if (!cancelled) {
          setDeliveryChargeLoading(false)
        }

      }
    }

    fetchDeliveryCharge()

    return () => {
      cancelled = true
    }

  }, [locationConfirmed, locationCoords, cartItems])
  const grandTotal = Math.max(0,subtotal - discount) + Number(deliveryCharge || 0)

    

  const handleSubmit = async e => {
    e.preventDefault()

    if (submitting) return

    // Validate delivery location
  const lat = Number(
    Number(locationCoords?.lat).toFixed(6)
  )
  const lng = Number(
    Number(locationCoords?.lng).toFixed(6)
  )  
    if (
      !locationConfirmed ||
      locationCoords?.lat == null ||
      locationCoords?.lng == null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      toast.error('Please select and confirm your delivery location.')
      setShowMap(true)
      return
    }

    // Validate a new address
    if (!useSavedAddress) {
      const validationErrors = validate()

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        toast.warning('Please fill in required delivery information.')
        return
      }
    }

    // Find the existing saved address
    const activeAddress = useSavedAddress
      ? savedAddresses.find(
          address => Number(address.id) === Number(selectedAddressId)
        )
      : null

    if (useSavedAddress && !activeAddress) {
      toast.error('Please select a valid saved address.')
      return
    }

    setSubmitting(true)

    const fullAddressLine = [
      form.house_no,
      form.address_line1,
      form.city,
      form.district,
      form.pincode
    ].filter(Boolean).join(', ')




    try {
      const activePhone =
        activeAddress?.phone || form.phone || ''

      // Keep the existing address ID so Django can update
      // the location on that address instead of creating another one.
      const addressPayload = {
        ...(activeAddress ? { id: activeAddress.id } : {}),
        name: activeAddress?.name || form.name || user?.username || 'Customer',
        phone: activePhone,
        address_line1:
          activeAddress?.address_line1 || fullAddressLine ||'Main Street',
        state: activeAddress?.state || form.state || 'Kerala',
        is_saved: activeAddress ? true : saveForFuture,
        latitude: lat,
        longitude: lng
      }

      const payload = {
        payment_method: paymentMethod,
        phone: activePhone,
        latitude: lat,
        longitude: lng,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.cartQty || 1
        })),
        coupon_code: coupon?.code || null,
        address_data: addressPayload
      }

      // Debug: inspect the exact data being sent
      console.log(
        'ORDER PAYLOAD:',
        JSON.stringify(payload, null, 2)
      )

      const res = await placeOrder(payload)

      clearCart()
      toast.success('Order placed successfully!')
      navigate(`/order-confirmation/${res.data.id}`)
    } catch (err) {
      console.error(
        'Place order error:',
        err.response?.data || err
      )

      const errorData = err.response?.data

      toast.error(
        typeof errorData === 'string'
          ? errorData
          : errorData
            ? JSON.stringify(errorData)
            : 'Failed to place order. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className={styles.checkoutPage}>
      <Header />

      <main className={styles.container}>
        <form onSubmit={handleSubmit} noValidate>
          {/* Address section */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0A2540"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>

              <h2 className={styles.sectionTitle}>Address</h2>
            </div>

            {/* Saved addresses */}
            {savedAddresses.length > 0 && (
              <div className={styles.savedAddressesBar}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={useSavedAddress}
                    onChange={e => setUseSavedAddress(e.target.checked)}
                  />
                  <span>
                    Use saved address ({savedAddresses.length} available)
                  </span>
                </label>

                {useSavedAddress && (
                  <select
                    className={styles.savedSelect}
                    value={selectedAddressId || ''}
                    onChange={e => {
                      const id = Number(e.target.value)
                      const saved = savedAddresses.find(a => a.id === id)
                    
                      setSelectedAddressId(id)
                      setLocationConfirmed(false)
                      setLocationCoords(null)
                    
                      if (!saved) return
                    
                      const lat = Number(saved.latitude)
                      const lng = Number(saved.longitude)
                    
                      if (
                        saved.latitude != null &&
                        saved.longitude != null &&
                        saved.latitude !== '' &&
                        saved.longitude !== '' &&
                        Number.isFinite(lat) &&
                        Number.isFinite(lng) &&
                        lat >= -90 && lat <= 90 &&
                        lng >= -180 && lng <= 180
                      ) {
                        setLocationCoords({ lat, lng })
                        setLocationConfirmed(true)
                      }
                    }}
                  >
                    {savedAddresses.map(address => (
                      <option key={address.id} value={address.id}>
                        {address.name} — {address.address_line1},{' '}
                        {address.city} ({address.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* New address form */}
            {!useSavedAddress && (
              <div className={styles.formFields}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Full Name</label>
                  <input
                    name="name"
                    type="text"
                    className={`${styles.textInput} ${
                      errors.name ? styles.inputError : ''
                    }`}
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                  />
                  {errors.name && (
                    <span className={styles.errorText}>{errors.name}</span>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    House no. / Building name
                  </label>
                  <input
                    name="house_no"
                    type="text"
                    className={`${styles.textInput} ${
                      errors.house_no ? styles.inputError : ''
                    }`}
                    placeholder="House no. / Building name"
                    value={form.house_no}
                    onChange={handleChange}
                  />
                  {errors.house_no && (
                    <span className={styles.errorText}>
                      {errors.house_no}
                    </span>
                  )}
                </div>

                <div className={styles.twoColRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Phone number</label>
                    <input
                      name="phone"
                      type="tel"
                      maxLength={10}
                      className={`${styles.textInput} ${
                        errors.phone ? styles.inputError : ''
                      }`}
                      placeholder="Enter phone number"
                      value={form.phone}
                      onChange={handleChange}
                    />
                    {errors.phone && (
                      <span className={styles.errorText}>
                        {errors.phone}
                      </span>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>District</label>
                    <select
                      name="district"
                      className={`${styles.selectInput} ${
                        errors.district ? styles.inputError : ''
                      }`}
                      value={form.district}
                      onChange={handleChange}
                    >
                      <option value="">Select district</option>
                      {DISTRICTS.map(district => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                    {errors.district && (
                      <span className={styles.errorText}>
                        {errors.district}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    Street / Locality
                  </label>
                  <input
                    name="address_line1"
                    type="text"
                    className={styles.textInput}
                    placeholder="Enter street or locality"
                    value={form.address_line1}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.twoColRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>City / Town</label>
                    <input
                      name="city"
                      type="text"
                      className={styles.textInput}
                      placeholder="Enter city or town"
                      value={form.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Pincode</label>
                    <input
                      name="pincode"
                      type="text"
                      maxLength={6}
                      className={styles.textInput}
                      placeholder="6-digit pincode"
                      value={form.pincode}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={saveForFuture}
                    onChange={e => setSaveForFuture(e.target.checked)}
                    className={styles.styledCheckbox}
                  />
                  <span className={styles.checkboxText}>
                    Use this address for another order
                  </span>
                </label>

                <button
                  type="button"
                  className={`${styles.confirmAddressBtn} ${
                    addressConfirmed ? styles.confirmed : ''
                  }`}
                  onClick={handleConfirmAddress}
                >
                  {addressConfirmed
                    ? 'Address Confirmed ✓'
                    : 'Confirm the address'}
                </button>
              </div>
            )}

            {/* Google satellite map controls */}
            <button
              type="button"
              className={styles.useLocationBtn}
              onClick={handleUseLocation}
            >
              <span className={styles.useLocationLeft}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0070F3"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>
                  {locationConfirmed
                    ? 'Delivery location confirmed ✓'
                    : showMap
                      ? 'Satellite map opened'
                      : 'Choose delivery location'}
                </span>
              </span>
              <span className={styles.locationChevron}>›</span>
            </button>

            {showMap && (
              <div style={{ marginTop: 16 }}>
                <p style={{ marginBottom: 10 }}>
                  Tap the satellite map to select your delivery location.
                  Drag the pin to adjust it.
                </p>

                <button
                  type="button"
                  onClick={handleCurrentLocation}
                  disabled={locationLoading}
                  style={{
                    marginBottom: 12,
                    padding: '10px 14px',
                    border: '1px solid #0070F3',
                    borderRadius: 8,
                    background: '#eef6ff',
                    color: '#005fc5',
                    cursor: 'pointer'
                  }}
                >
                  {locationLoading
                    ? 'Detecting location...'
                    : 'Use my current location'}
                </button>

                {mapLoading && <p>Loading satellite map...</p>}

                {mapError && (
                  <p role="alert" style={{ color: '#b42318' }}>
                    {mapError}
                  </p>
                )}

                <div
                  ref={mapElementRef}
                  style={{
                    width: '100%',
                    height: 350,
                    borderRadius: 12,
                    background: '#eef1f5'
                  }}
                />

                {locationCoords && (
                  <div style={{ marginTop: 10 }}>
                    <strong>Selected delivery location</strong>
                    <p>
                      Latitude: {locationCoords.lat.toFixed(6)}
                    </p>
                    <p>
                      Longitude: {locationCoords.lng.toFixed(6)}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (
                      locationCoords?.lat == null ||
                      locationCoords?.lng == null
                    ) {
                      toast.error('Please select your delivery location on the map.')
                      return
                    }
                    setLocationConfirmed(true)
                    setShowMap(false)
                    toast.success('Delivery location confirmed.')
                  }}

                  style={{
                    marginTop: 10,
                    padding: '10px 14px',
                    border: 'none',
                    borderRadius: 8,
                    background: '#0070F3',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Confirm location and close map
                </button>
              </div>
            )}
          </div>

          {/* Payment section */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0A2540"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h2 className={styles.sectionTitle}>Payment</h2>
            </div>

            <div className={styles.paymentOptions}>
              <label
                className={`${styles.paymentOptionRow} ${
                  paymentMethod === 'cod' ? styles.paymentSelected : ''
                }`}
              >
                <div className={styles.radioVisual}>
                  <div
                    className={`${styles.radioOuter} ${
                      paymentMethod === 'cod' ? styles.radioOuterActive : ''
                    }`}
                  >
                    {paymentMethod === 'cod' && (
                      <div className={styles.radioInner} />
                    )}
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  style={{ display: 'none' }}
                />
                <div className={styles.paymentOptionInfo}>
                  <span className={styles.paymentOptionName}>
                    Cash on delivery
                  </span>
                  <span className={styles.paymentOptionSub}>
                    Pay cash when your order arrives
                  </span>
                </div>
              </label>

              <label
                className={`${styles.paymentOptionRow} ${
                  paymentMethod === 'gpay' ? styles.paymentSelected : ''
                }`}
              >
                <div className={styles.radioVisual}>
                  <div
                    className={`${styles.radioOuter} ${
                      paymentMethod === 'gpay' ? styles.radioOuterActive : ''
                    }`}
                  >
                    {paymentMethod === 'gpay' && (
                      <div className={styles.radioInner} />
                    )}
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'gpay'}
                  onChange={() => setPaymentMethod('gpay')}
                  style={{ display: 'none' }}
                />
                <div className={styles.paymentOptionInfo}>
                  <span className={styles.paymentOptionName}>
                    Pay on Google Pay
                  </span>
                  <span className={styles.paymentOptionSub}>
                    UPI payment
                  </span>
                </div>
              </label>

              {paymentMethod === 'gpay' && (
                <div className={styles.gpayPreviewCard}>
                  <div className={styles.qrCodeBox}>
                    <p style={{ fontSize: 13 }}>
                      Online Paymenet is temporarily unavailable. Please select Cash on Delivery to continue with your order. We apologize for the inconvenience. 
                    </p>
                  </div>
                  <div className={styles.gpayLogo}>
                    <span style={{ color: '#4285F4', fontWeight: 800 }}>
                      G
                    </span>
                    <span style={{ color: '#5F6368', fontWeight: 700 }}>
                      Pay
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Coupon */}
            <div className={styles.promoWrap}>
              <div className={styles.promoInputRow}>
                <input
                  className={styles.promoInput}
                  type="text"
                  placeholder="Enter Promo Code (e.g. SAVE10)"
                  value={couponCode}
                  onChange={e => {
                    setCouponCode(e.target.value.toUpperCase())
                    setCouponError('')
                  }}
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

              {couponError && (
                <p className={styles.couponErr}>{couponError}</p>
              )}

              {coupon && (
                <p className={styles.couponOk}>
                  ✓ {coupon.code} applied (₹{discount.toFixed(0)} off)
                </p>
              )}
            </div>
          </div>

          {/* Order total */}
          <div className={styles.orderSummaryCard}>
            <div className={styles.summaryTotalRow}>
              <span>Product Total:</span>
              <span>₹ {subtotal.toFixed(2)}</span>
            </div>

            <div className={styles.summaryTotalRow}>
              <span>Discount:</span>
              <span>- ₹ {discount.toFixed(2)}</span>
            </div>

            <div className={styles.summaryTotalRow}>
              <span>Delivery Charge:</span>

              <span>
                {deliveryChargeLoading
                  ? 'Calculating...'
                  : deliveryCharge !== null
                    ? deliveryCharge === 0
                      ? 'FREE'
                      : `₹ ${deliveryCharge.toFixed(2)}`
                    : '--'}
              </span>
            </div>
                
            {deliveryChargeError && (
              <p style={{ color: 'red' }}>
                {deliveryChargeError}
              </p>
            )}

            <div className={styles.summaryTotalRow}>
              <span>Total to Pay:</span>
          
              <span>
                ₹ {grandTotal.toFixed(2)}
              </span>
            </div>
          
            <button
              type="submit"
              className={styles.placeOrderBtn}
              disabled={
                submitting ||
                deliveryChargeLoading ||
                deliveryCharge === null ||
                !!deliveryChargeError
              }
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
            
          </div>
        </form>
      </main>
    </div>
  )
}
