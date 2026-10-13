import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { sendChatMessage } from '../api/api'
import styles from './Chatbot.module.css'

const QUICK_ACTIONS = [
  'Browse Products',
  'Show All Pens',
  'Show Notebooks',
  'Products Under ₹100',
  'My Cart',
  'My Orders',
  'Track My Order',
  'Payment Methods',
  'Delivery Information'
]

const INITIAL_WELCOME = {
  id: 'welcome',
  sender: 'bot',
  type: 'greeting',
  text: '👋 Hi! Welcome to **StatioMart Assistant**!\n\nI can help you search products, manage your cart, check order tracking, and answer FAQs. How can I assist you today?',
  suggestions: ['Show All Pens', 'Show Notebooks', 'Products Under ₹100', 'My Cart', 'My Orders'],
  timestamp: new Date()
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function MessageBubble({ msg, onSuggestion, onAddToCart, onOpenCart, navigate }) {
  const isBot = msg.sender === 'bot'

  const renderText = (text) => {
    if (!text) return null
    // Simple bold markdown: **text**
    const parts = text.split(/\*\*(.+?)\*\*/g)
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    )
  }

  return (
    <div className={`${styles.msgRow} ${isBot ? styles.msgRowBot : styles.msgRowUser}`}>
      {isBot && (
        <div className={styles.botAvatar}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" fill="#0070F3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <div className={`${styles.bubble} ${isBot ? styles.botBubble : styles.userBubble}`}>
        {msg.text && (
          <p className={styles.msgText} style={{ whiteSpace: 'pre-line' }}>
            {renderText(msg.text)}
          </p>
        )}

        {/* Product Cards Grid in Chat */}
        {msg.products && msg.products.length > 0 && (
          <div className={styles.productCards}>
            {msg.products.map(p => (
              <div key={p.id} className={styles.productCard}>
                <img
                  src={p.display_image || `https://placehold.co/90x90/EBF5FF/0070F3?text=${encodeURIComponent((p.name || 'P')[0])}`}
                  alt={p.name}
                  className={styles.productImg}
                  onError={e => { e.target.src = `https://placehold.co/90x90/EBF5FF/0070F3?text=${encodeURIComponent((p.name || 'P')[0])}` }}
                />
                <div className={styles.productInfo}>
                  <p className={styles.productName}>{p.name}</p>
                  <p className={styles.productPrice}>₹{parseFloat(p.price || 0).toFixed(0)}</p>
                  {p.in_stock ? (
                    <span className={styles.inStock}>✓ In Stock</span>
                  ) : (
                    <span className={styles.outStock}>✕ Out of Stock</span>
                  )}
                </div>
                <div className={styles.productBtns}>
                  <button
                    className={styles.viewBtn}
                    onClick={() => navigate(`/product/${p.id}`)}
                  >
                    View
                  </button>
                  {p.in_stock && (
                    <button
                      className={styles.addCartBtn}
                      onClick={() => onAddToCart(p)}
                    >
                      + Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cart View Action Button */}
        {msg.action?.type === 'OPEN_CART' && (
          <button className={styles.actionCartBtn} onClick={onOpenCart}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span>Open Shopping Cart →</span>
          </button>
        )}

        {/* Contextual Suggestions */}
        {msg.suggestions && msg.suggestions.length > 0 && (
          <div className={styles.suggestions}>
            {msg.suggestions.map((s, i) => (
              <button
                key={i}
                className={styles.suggestion}
                onClick={() => onSuggestion(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <span className={styles.timestamp}>{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  )
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([INITIAL_WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { cartItems, addToCart, removeFromCart } = useCart()

  // EXCLUSION: Do NOT display StatioMart Assistant on Login or Registration page
  const isAuthPage = location.pathname === '/auth'

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (open) scrollToBottom()
  }, [messages, open, scrollToBottom])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  const handleOpenCart = useCallback(() => {
    setOpen(false)
    navigate('/cart')
  }, [navigate])

  const handleAddToCart = useCallback((product, qty = 1) => {
    addToCart(product, qty)
  }, [addToCart])

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: msg,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Typing indicator
    const typingId = Date.now() + 1
    setMessages(prev => [...prev, { id: typingId, sender: 'bot', type: 'typing', timestamp: new Date() }])

    try {
      // Send message along with live client cart items for realtime DB totals & verification
      const res = await sendChatMessage(msg, {}, cartItems)
      const data = res.data

      // Execute any backend returned actions
      if (data.action) {
        if (data.action.type === 'ADD_TO_CART' && data.action.product) {
          addToCart(data.action.product, data.action.quantity || 1)
        } else if (data.action.type === 'REMOVE_FROM_CART' && data.action.productId) {
          removeFromCart(data.action.productId)
        }
      }

      setMessages(prev => [
        ...prev.filter(m => m.id !== typingId),
        {
          id: Date.now(),
          sender: 'bot',
          type: data.type || 'text',
          text: data.reply,
          products: data.products || [],
          action: data.action || null,
          suggestions: data.suggestions || [],
          timestamp: new Date()
        }
      ])
    } catch {
      setMessages(prev => [
        ...prev.filter(m => m.id !== typingId),
        {
          id: Date.now(),
          sender: 'bot',
          type: 'error',
          text: "I couldn't reach the StatioMart service right now. Please check your connection or try again in a moment.",
          timestamp: new Date()
        }
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, cartItems, addToCart, removeFromCart])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // If on AuthPage (Login/Register), assistant is completely excluded
  if (isAuthPage) return null

  return (
    <>
      {/* Floating Circular Assistant Button (Bottom-Right) */}
      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close StatioMart Assistant' : 'Open StatioMart Assistant'}
        title="StatioMart Assistant"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <div className={styles.fabInner}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={styles.fabSparkle}>✨</span>
          </div>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div className={styles.window} role="dialog" aria-label="StatioMart Assistant Window">
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerAvatar}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className={styles.headerName}>StatioMart Assistant</p>
                <p className={styles.headerStatus}>
                  <span className={styles.statusDot} />
                  Live Shopping & Support
                </p>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close Assistant">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Quick-Action Topic Bar */}
          <div className={styles.quickBar}>
            <div className={styles.quickScroll}>
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  className={styles.quickChip}
                  onClick={() => sendMessage(action)}
                  disabled={loading}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Container */}
          <div className={styles.messages}>
            {messages.map(msg => (
              msg.type === 'typing' ? (
                <div key={msg.id} className={`${styles.msgRow} ${styles.msgRowBot}`}>
                  <div className={styles.botAvatar}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" fill="#0070F3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className={`${styles.bubble} ${styles.botBubble} ${styles.typingBubble}`}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                  </div>
                </div>
              ) : (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onSuggestion={sendMessage}
                  onAddToCart={handleAddToCart}
                  onOpenCart={handleOpenCart}
                  navigate={navigate}
                />
              )
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <input
              ref={inputRef}
              className={styles.input}
              type="text"
              placeholder="Ask about stationery, orders, cart..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={500}
              aria-label="Type message"
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}