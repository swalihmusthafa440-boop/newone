import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import styles from './AuthPage.module.css'
import {  useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'

export default function AuthPage() {
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', first_name: '', last_name: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const { login, register,googleLogin } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.username.trim()) errs.username = 'Username is required'
    if (!form.password) errs.password = 'Password is required'
    if (mode === 'register') {
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email is required'
      if (form.password.length < 6) errs.password = 'Password must be at least 6 characters'
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    }
    return errs
  }
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential)
      toast.success('Welcome to StatioMart!')
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      toast.error(
        err.response?.data?.detail || 'Google login failed. Please try again.'
      )
    }
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.username, form.password)
        toast.success('Welcome back! 🎉')
      } else {
        await register({ username: form.username, email: form.email, password: form.password, first_name: form.first_name, last_name: form.last_name })
        toast.success('Account created successfully! 🎉')
      }
      navigate(location.state?.from || '/')
    } catch (err) {
      const data = err.response?.data
      const msg = data?.detail || data?.username?.[0] || data?.email?.[0] || 'Something went wrong. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Left Panel */}
        <div className={styles.leftPanel}>
          <div className={styles.brandSection}>
            <div className={styles.logo}>
              <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="white" fillOpacity="0.2"/>
                <path d="M7 8h14M7 12h10M7 16h12M7 20h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className={styles.brandName}>StatioMart</h1>
            <p className={styles.brandTagline}>Premium Stationery, Delivered to Your Door</p>
          </div>
          <div className={styles.features}>
            {[['📦', '1000+ Products', 'Notebooks, pens, art supplies & more'],
              ['🚚', 'Fast Delivery', '3-5 business days across India'],
              ['⭐', 'Top Quality', 'Curated premium stationery brands'],
            ].map(([icon, title, desc]) => (
              <div key={title} className={styles.feature}>
                <span className={styles.featureIcon}>{icon}</span>
                <div>
                  <p className={styles.featureTitle}>{title}</p>
                  <p className={styles.featureDesc}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className={styles.rightPanel}>
          <div className={styles.card}>
            {/* Tabs */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
                onClick={() => { setMode('login'); setErrors({}) }}
              >Sign In</button>
              <button
                className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
                onClick={() => { setMode('register'); setErrors({}) }}
              >Create Account</button>
            </div>

            <div className={styles.cardBody}>
              <h2 className={styles.title}>
                {mode === 'login' ? 'Welcome back!' : 'Join StatioMart'}
              </h2>
              <p className={styles.subtitle}>
                {mode === 'login' ? 'Sign in to your account to continue' : 'Create your free account today'}
              </p>

              <form onSubmit={handleSubmit} noValidate className={styles.form}>
                {mode === 'register' && (
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.label}>First Name</label>
                      <input name="first_name" value={form.first_name} onChange={handleChange}
                        className={styles.input} placeholder="First name" />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Last Name</label>
                      <input name="last_name" value={form.last_name} onChange={handleChange}
                        className={styles.input} placeholder="Last name" />
                    </div>
                  </div>
                )}

                <div className={styles.field}>
                  <label className={styles.label}>Username *</label>
                  <input
                    name="username" value={form.username} onChange={handleChange}
                    className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                    placeholder="Choose a username"
                    autoComplete="username"
                  />
                  {errors.username && <p className={styles.err}>{errors.username}</p>}
                </div>

                {mode === 'register' && (
                  <div className={styles.field}>
                    <label className={styles.label}>Email *</label>
                    <input
                      name="email" type="email" value={form.email} onChange={handleChange}
                      className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                      placeholder="your@email.com"
                      autoComplete="email"
                    />
                    {errors.email && <p className={styles.err}>{errors.email}</p>}
                  </div>
                )}

                <div className={styles.field}>
                  <label className={styles.label}>Password *</label>
                  <div className={styles.passwordWrap}>
                    <input
                      name="password" type={showPassword ? 'text' : 'password'}
                      value={form.password} onChange={handleChange}
                      className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                      placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.password && <p className={styles.err}>{errors.password}</p>}
                </div>

                {mode === 'register' && (
                  <div className={styles.field}>
                    <label className={styles.label}>Confirm Password *</label>
                    <div className={styles.passwordWrap}>
                      <input
                        name="confirmPassword" type={showPassword ? 'text' : 'password'}
                        value={form.confirmPassword} onChange={handleChange}
                        className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                        placeholder="Repeat password"
                        autoComplete="new-password"
                      />
                    </div>
                    {errors.confirmPassword && <p className={styles.err}>{errors.confirmPassword}</p>}
                  </div>
                )}

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? (
                    <><span className={styles.spinner} /> {mode === 'login' ? 'Signing in...' : 'Creating account...'}</>
                  ) : (
                    mode === 'login' ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: '15px'}}>
                <p style={{fontSize:"14px", color:"grey"}}>or sign in with</p>
                
                <GoogleLogin 
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google sign-in failed.')}
                  text="signin_with"
                  theme="outline"
                  size="large"
                  shape="pill"
                  width={window.innerWidth <= 767 ? "265" : "375"}
                />
              </div>
              <div className={styles.divider}><span>or</span></div>

              <button className={styles.guestBtn} onClick={() => navigate('/')}>
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
