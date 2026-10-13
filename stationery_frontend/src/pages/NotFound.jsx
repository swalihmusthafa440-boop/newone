import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      gap: '24px',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '5rem', lineHeight: 1 }}>404</div>
      <div style={{ fontSize: '4rem' }}>📭</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '320px', lineHeight: 1.6 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '12px 28px',
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Go Back Home
      </button>
    </div>
  )
}
