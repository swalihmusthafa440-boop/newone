import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import ProductSelection from './pages/ProductSelection'
import ProductDetail from './pages/ProductDetail'
import CartPage from './pages/CartPage'
import OrderDelivery from './pages/OrderDelivery'
import OrderConfirmation from './pages/OrderConfirmation'
import OrderHistory from './pages/OrderHistory'
import AuthPage from './pages/AuthPage'
import AdminDashboard from './pages/AdminDashboard'
import NotFound from './pages/NotFound'
import Chatbot from './components/chatbot'
import FloatingCart from './components/FloatingCart'
import './index.css'
import Accountpage from './pages/accountpage'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<ProductSelection />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<OrderDelivery />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
                <Route path='/accountpage' element={<Accountpage/>}/>
              </Routes>
              {/* Floating Cart Button near bottom-left on shopping pages */}
              <FloatingCart />
              {/* StatioMart Assistant near bottom-right (automatically excluded on /auth) */}
              <Chatbot />
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
