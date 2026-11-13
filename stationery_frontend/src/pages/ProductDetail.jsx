
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProductDetail, getProducts, getReviews, addReview } from '../api/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import styles from './ProductDetail.module.css'

function normalizeArray(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.results)) return data.results
  if (Array.isArray(data.data)) return data.data
  return []
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isInCart, addToCart, removeFromCart, cartItems, updateQty } = useCart()
  const { isLoggedIn } = useAuth()
  const toast = useToast()

  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const [wishlisted, setWishlisted] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [localQty, setLocalQty] = useState(1)

  const inCart = isInCart(Number(id))
  const cartItem = cartItems.find((i) => i.id === Number(id))

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    Promise.all([
      getProductDetail(id),
      getReviews(id),
      getProducts()
    ])
      .then(([pRes, rRes, prodsRes]) => {
        if (isMounted) {
          setProduct(pRes.data)
          setReviews(normalizeArray(rRes?.data))

          const allProds = normalizeArray(prodsRes?.data)

          const related = allProds
            .filter(p => p.id !== Number(id))
            .slice(0, 8)

          setRelatedProducts(related)
        }
      })
      .catch(() => {
        if (isMounted) {
          toast.error('Failed to load product details')
          setReviews([])
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id, toast])

  const handleAddToCart = () => {
    if (!product) return

    if (Number(product.stock) <= 0) {
      toast.error('Out of Stock')
      return
    }

    addToCart(product, localQty)
    toast.success(`Added ${localQty}x "${product.name}" to cart! 🛒`)
  }

  const handleRemoveFromCart = () => {
    removeFromCart(Number(id))
    toast.info('Removed from cart')
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()

    if (!reviewText.trim()) return

    setSubmittingReview(true)

    try {
      const res = await addReview(id, {
        rating: 5,
        comment: reviewText.trim()
      })

      setReviews((prev) => [res.data, ...prev])
      setReviewText('')
      toast.success('Thank you for your review! ⭐')
    } catch {
      toast.error('Unable to submit review. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.loadingCenter}>
          <div className={styles.spinner} />
          <p>Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.loadingCenter}>
          <h2>Product Not Found</h2>
          <button
            className={styles.primaryBtn}
            onClick={() => navigate('/')}
          >
            Back to Shop
          </button>
        </div>
        
      </div>
    )
  }

  const itemPrice = parseFloat(product.price || 0)

  const imgSrc =
    product.display_image ||
    product.image_url ||
    `https://placehold.co/500x500/EBF5FF/0070F3?text=${encodeURIComponent(product.name[0])}`

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.container}>
        <div className={styles.detailLayout}>

          {/* Main Product Card */}
          <div className={styles.mainCard}>

            {/* Product Image Box */}
            <div className={styles.imageBox}>
              <img
                src={imgSrc}
                alt={product.name}
                className={styles.productImage}
                onError={(e) => {
                  e.target.src = `https://placehold.co/500x500/EBF5FF/0070F3?text=${encodeURIComponent(product.name[0])}`
                }}
              />

              <button
                className={`${styles.wishlistIconBtn} ${wishlisted ? styles.wishlistActive : ''}`}
                onClick={() => setWishlisted(!wishlisted)}
                aria-label="Wishlist"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill={wishlisted ? "#EF4444" : "none"}
                  stroke={wishlisted ? "#EF4444" : "#475569"}
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>

              <div className={styles.ratingBar}>
                <span className={styles.stars}>★★★★☆</span>
                <span className={styles.ratingCount}>(128)</span>
              </div>
            </div>

            {/* Product Information */}
            <div className={styles.productinfo}>
              <div className={styles.titleRow}>
                <div className={styles.titleGroup}>
                  <h1 className={styles.productTitle}>
                    {product.name}
                  </h1>

                  <p className={styles.productSubtitle}>
                    {product.category_name || product.category?.name || 'A5 Spiral Notebook'}
                    <br />

                    <span className={styles.subDetail}>
                      {typeof product.description === 'string' && product.description.trim()
                        ? product.description.slice(0, 30) +
                          (product.description.length > 45 ? '...' : '')
                        : 'Premium Stationery'}
                    </span>
                  </p>
                </div>

                <div className={styles.priceAndQtyRow}>
                  <div className={styles.priceText}>
                    ₹ {Math.round(itemPrice)}
                  </div>
                </div>

                {/* Quantity Picker */}
                <div className={styles.qtyPicker}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => {
                      if (inCart) updateQty(product.id, -1)
                      else setLocalQty(prev => Math.max(1, prev - 1))
                    }}
                    disabled={
                      inCart
                        ? cartItem?.cartQty <= 1
                        : localQty <= 1
                    }
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>

                  <span className={styles.qtyDisplay}>
                    {inCart ? (cartItem?.cartQty || 1) : localQty}
                  </span>

                  <button
                    className={styles.qtyBtn}
                    onClick={() => {
                      if (inCart) updateQty(product.id, 1)
                      else setLocalQty(prev =>
                        Math.min(product.stock || 99, prev + 1)
                      )
                    }}
                    disabled={
                      inCart
                        ? cartItem?.cartQty >= product.stock
                        : localQty >= (product.stock || 99)
                    }
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.buttonsRow}>
              {inCart ? (
                <button
                  className={styles.removeBtn}
                  onClick={handleRemoveFromCart}
                >
                  🗑 Remove from cart
                </button>
              ) : (
                <button
                  className={styles.addToCartBtn}
                  onClick={handleAddToCart}
                  disabled={Number(product.stock) <= 0}
                >
                  {Number(product.stock) <= 0
                    ? 'Out of Stock'
                    : '🛒 Add to cart'}
                </button>
              )}
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <section className={styles.relatedSection}>

              <div className={styles.sectionHeaderRow}>
                <h3 className={styles.sectionTitle}>
                  Related Products
                </h3>

                <button
                  className={styles.seeAllBtn}
                  onClick={() => navigate('/')}
                >
                  See all →
                </button>
              </div>

              <div className={styles.relatedGrid}>
                {relatedProducts.map((rel) => {
                  const relImg =
                    rel.display_image ||
                    rel.image_url ||
                    `https://placehold.co/120x120/EBF5FF/0070F3?text=${encodeURIComponent(rel.name[0])}`

                  const isOutOfStock = Number(rel.stock) <= 0

                  return (
                    <div
                      key={rel.id}
                      className={styles.relatedCard}
                      onClick={() => navigate(`/product/${rel.id}`)}
                    >
                      <button
                        className={styles.relatedWishlist}
                        onClick={(e) => {
                          e.stopPropagation()
                          toast.info('Saved to wishlist')
                        }}
                        aria-label="Wishlist"
                      >
                        ♡
                      </button>

                      {/* Related Product Image */}
                      <div
                        className={styles.relatedImgWrap}
                        style={{ position: 'relative' }}
                      >
                        <img
                          src={relImg}
                          alt={rel.name}
                          className={styles.relatedImg}
                        />

                        {isOutOfStock && (
                          <span
                            style={{
                              position: 'absolute',
                              left: '8px',
                              bottom: '4px',
                              zIndex: 2,
                              background: '#ef4444',
                              color: '#fff',
                              padding: '5px 2px',
                              borderRadius: '5px',
                              fontSize: '12px',
                              fontWeight: 700,
                              lineHeight: 1.2,
                              pointerEvents: 'none'
                            }}
                          >
                            Out of Stock
                          </span>
                        )}
                      </div>

                      <div className={styles.namepriceadd}>
                        <p className={styles.relatedName}>
                          {rel.name}
                        </p>

                        <div className={styles.relatedBottom}>
                          <span className={styles.relatedPrice}>
                            ₹ {Math.round(parseFloat(rel.price || 0))}
                          </span>

                          <button
                            className={styles.relatedPlusBtn}
                            disabled={isOutOfStock}
                            onClick={(e) => {
                              e.stopPropagation()

                              if (isOutOfStock) {
                                toast.error('Out of Stock')
                                return
                              }

                              addToCart(rel, 1)
                              toast.success(`Added ${rel.name} to cart!`)
                            }}
                            aria-label={
                              isOutOfStock
                                ? `${rel.name} is out of stock`
                                : `Add ${rel.name} to cart`
                            }
                            title={
                              isOutOfStock
                                ? 'Out of Stock'
                                : `Add ${rel.name} to cart`
                            }
                            style={
                              isOutOfStock
                                ? {
                                    opacity: 0.55,
                                    cursor: 'not-allowed'
                                  }
                                : undefined
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Reviews Section */}
          <section className={styles.reviewsSection}>
            <div className={styles.reviewHeader}>
              <span className={styles.reviewsTitle}>
                Reviews
              </span>

              <span className={styles.stars}>★★★★☆</span>
              <span className={styles.ratingCount}>(128)</span>
            </div>

            <form
              className={styles.reviewInputRow}
              onSubmit={handleReviewSubmit}
            >
              <input
                className={styles.reviewInput}
                type="text"
                placeholder="Write your review..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />

              <button
                type="submit"
                className={styles.submitReviewBtn}
                disabled={submittingReview || !reviewText.trim()}
              >
                {submittingReview ? '...' : 'Submit'}
              </button>
            </form>
          </section>
        </div>
      </main>

      
    </div>
  )
}
