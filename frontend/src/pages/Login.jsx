import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { AuthContext } from '../App'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const { handleLogin } = useContext(AuthContext)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('username', username)
      fd.append('password', password)
      const r = await api.post('/auth/token', fd)
      handleLogin(r.data.access_token)
      nav('/')
    } catch (err) {
      setMsg('Login failed: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto' }}>
      <div style={{ 
        padding: '32px', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0, textAlign: 'center' }}>Login</h2>
        <form onSubmit={submit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Username</label>
            <input 
              value={username} 
              onChange={(e)=>setUsername(e.target.value)} 
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              required
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              required
            />
          </div>
          <button 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '10px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {msg && <div style={{ marginTop: '16px', color: '#dc3545' }}>{msg}</div>}
        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          Don't have an account? <Link to="/register" style={{ color: '#007bff' }}>Register here</Link>
        </p>
      </div>
    </div>
  )
}
