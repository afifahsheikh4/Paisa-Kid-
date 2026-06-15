import { Link } from 'react-router-dom'

const Index = () => (
  <div style={{ maxWidth: '920px', margin: '0 auto', padding: '32px 24px' }}>
    <div style={{ marginBottom: '24px' }}>
      <div><Link to="/">Home</Link></div>
      <div>
        <Link to="/login">Login</Link>
        <Link to="/signup">Sign up</Link>
      </div>
    </div>
    <div style={{ background: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Welcome to PaisaHiPaisa</h1>
        <p>Use the links below to sign in, create an account, or continue to your role-specific dashboard.</p>
      </div>
      <div style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
        <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '14px' }}>
          <h2>Start here</h2>
          <p>If you already have an account, <Link to="/login">login now</Link>. Otherwise, <Link to="/signup">create a new account</Link>.</p>
        </div>
        <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '14px' }}>
          <h2>Account types</h2>
          <p>Sign up as a parent to access the parent dashboard, or as a merchant if your business is already registered.</p>
        </div>
      </div>
    </div>
    <div style={{ marginTop: '32px', color: '#475569', fontSize: '0.95rem' }}>
      <p>PaisaHiPaisa routes are fixed so root URL goes to login and each authenticated user lands on their own dashboard.</p>
    </div>
  </div>
)

export default Index
