import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/appcpntext'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { refreshState } = useApp()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const response = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem('paisakid_token', data.token)
        await refreshState()
        if (data.role === 'parent') {
          navigate('/parent')
        } else if (data.role === 'merchant') {
          navigate('/merchant')
        } else {
          navigate('/')
        }
      } else {
        setError(data.detail || 'Login failed')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div><a href="/">Home</a></div>
        <div>
          <a href="/login">Login</a>
          <a href="/signup">Sign up</a>
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)' }}>
        <h1>Login</h1>
        <p>Enter your username and password to continue.</p>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '10px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '10px' }}
              required
            />
          </div>
          <button type="submit" style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', padding: '12px 18px', border: 'none', borderRadius: '10px', background: '#2563eb', color: 'white', fontWeight: '600' }}>Login</button>
        </form>
        <p style={{ marginTop: '18px' }}>New here? <a href="/signup">Create an account</a>.</p>
      </div>
    </div>
  )
}

export default Login