import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/appcpntext'

const Signup = () => {
  const [role, setRole] = useState('parent')
  const [username, setUsername] = useState('')
  const [password1, setPassword1] = useState('')
  const [password2, setPassword2] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [outletName, setOutletName] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { refreshState } = useApp()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password1 !== password2) {
      setError('Passwords do not match')
      return
    }
    if (role === 'merchant' && !displayName) {
      setError('Merchant display name is required')
      return
    }
    try {
      const response = await fetch('/api/auth/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: password1, role, display_name: displayName, outlet_name: outletName }),
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem('paisakid_token', data.token || '')
        await refreshState()
        if (data.role === 'parent') {
          navigate('/parent')
        } else if (data.role === 'merchant') {
          navigate('/merchant')
        } else {
          navigate('/')
        }
      } else {
        setError(data.detail || 'Signup failed')
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
        <h1>Create a new account</h1>
        <p>Select the account type and fill in your information.</p>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Account type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <label><input type="radio" name="role" value="parent" checked={role === 'parent'} onChange={(e) => setRole(e.target.value)} /> Parent</label>
              <label><input type="radio" name="role" value="merchant" checked={role === 'merchant'} onChange={(e) => setRole(e.target.value)} /> Merchant</label>
            </div>
          </div>
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
              value={password1}
              onChange={(e) => setPassword1(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '10px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Confirm password</label>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '10px' }}
              required
            />
          </div>
          {role === 'merchant' && (
            <>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Merchant display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '10px' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Outlet name</label>
                <input
                  type="text"
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '10px' }}
                />
              </div>
            </>
          )}
          <button type="submit" style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', padding: '12px 18px', border: 'none', borderRadius: '10px', background: '#2563eb', color: 'white', fontWeight: '600' }}>Sign up</button>
        </form>
        <p style={{ marginTop: '18px' }}>Already have an account? <a href="/login">Login</a>.</p>
      </div>
    </div>
  )
}

export default Signup