import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import styles from './ProductCard.module.css'

export default function ProductCard({ product }) {
  const { isInCart, addToCart, cartItems } = useCart()
  const toast = useToast()
  const navigate = useNavigate()
  const [wishlisted, setWishlisted] = useState(false)

  const inCart = isInCart(product.id)
  const cartItem = cartItems.find(i => i.id === product.id)
  const outOfStock = product.stock === 0

  const handleAdd = (e) => {
    e.stopPropagation()
    if (outOfStock) {
      toast.warning('This item is currently out of stock')
      return
    }
    addToCart(product, 1)
    toast.success(`Added ${product.name} to cart!`)
  }

  const handleWishlistToggle = (e) => {
    e.stopPropagation()
    setWishlisted(!wishlisted)
    toast.info(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist')
  }

  const imageSrc = product.display_image || product.image_url || product.image ||
    `https://placehold.co/300x300/EBF5FF/0070F3?text=${encodeURIComponent((product.name || 'P')[0])}`

  return (
    <div
      className={styles.card}
      onClick={() => navigate(`/product/${product.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/product/${product.id}`) }}
    >
      {/* Wishlist Heart Icon matching reference top-right */}
      <button
        className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlistActive : ''}`}
        onClick={handleWishlistToggle}
        aria-label="Toggle wishlist"
        title={wishlisted ? 'In Wishlist' : 'Add to Wishlist'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted ? "#EF4444" : "none"} stroke={wishlisted ? "#EF4444" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      {/* Product Image */}
      <div className={styles.imageContainer}>
        <img
          src={imageSrc}
          alt={product.name || 'Product'}
          className={styles.image}
          onError={e => {
            e.target.src = `https://placehold.co/300x300/EBF5FF/0070F3?text=${encodeURIComponent((product.name || 'P')[0])}`
          }}
        />
        {outOfStock && <span className={styles.outOfStockTag}>Out of Stock</span>}
        {inCart && (
          <span className={styles.inCartIndicator} title={`In Cart: ${cartItem?.cartQty || 1}`}>
            ✓ {cartItem?.cartQty || 1}
          </span>
        )}
      </div>

      {/* Product Information */}
      <div className={styles.info}>
        <h3 className={styles.title} title={product.name}>
          {product.name}
        </h3>

        <div className={styles.bottomRow}>
          <div className={styles.priceContainer}>
            <span className={styles.currencySymbol}>₹</span>
            <span className={styles.price}>{Math.round(parseFloat(product.price || 0))}</span>
          </div>

          {/* Reference Circular Plus (+) Action Button */}
          <button
            className={`${styles.plusBtn} ${outOfStock ? styles.plusBtnDisabled : ''}`}
            onClick={handleAdd}
            disabled={outOfStock}
            aria-label={`Add ${product.name} to cart`}
            title={outOfStock ? 'Out of stock' : 'Add to cart'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
