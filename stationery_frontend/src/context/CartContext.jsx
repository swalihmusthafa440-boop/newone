import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const CartContext = createContext(null)

const CART_STORAGE_KEY = 'stationery_cart_v1'

function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => loadCartFromStorage())

  // Persist cart to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
    } catch {}
  }, [cartItems])

  const addToCart = useCallback((product, quantity = 1) => {
    if (!product || (product.stock !== undefined && product.stock <= 0)) return
    const addCount = Math.max(1, Number(quantity) || 1)
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        const maxStock = (existing.stock !== undefined && existing.stock !== null && existing.stock > 0) ? existing.stock : 99
        const updatedQty = Math.min((existing.cartQty || 1) + addCount, maxStock)
        return prev.map(i => i.id === product.id ? { ...i, cartQty: updatedQty } : i)
      }
      return [{ ...product, cartQty: addCount }, ...prev]
    })
  }, [])

  const removeFromCart = useCallback((productId) => {
    setCartItems(prev => prev.filter(i => i.id !== productId))
  }, [])

  const updateQty = useCallback((productId, delta) => {
    setCartItems(prev => prev.map(i => {
      if (i.id !== productId) return i
      const maxStock = (i.stock !== undefined && i.stock !== null && i.stock > 0) ? i.stock : 99
      const newQty = Math.min(Math.max(1, (i.cartQty || 1) + delta), maxStock)
      return { ...i, cartQty: newQty }
    }))
  }, [])

  const setQty = useCallback((productId, qty, stock) => {
    setCartItems(prev => prev.map(i => {
      if (i.id !== productId) return i
      const maxStock = stock ?? (i.stock > 0 ? i.stock : 99)
      const newQty = Math.min(Math.max(1, qty), maxStock)
      return { ...i, cartQty: newQty }
    }))
  }, [])

  const clearCart = useCallback(() => setCartItems([]), [])

  const isInCart = useCallback((productId) => {
    return cartItems.some(i => i.id === productId)
  }, [cartItems])

  const totalAmount = cartItems.reduce((sum, i) => sum + (parseFloat(i.price || 0) * (i.cartQty || 1)), 0)
  const totalItems = cartItems.reduce((sum, i) => sum + (i.cartQty || 1), 0)

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQty, setQty,
      clearCart, isInCart, totalAmount, totalItems
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
