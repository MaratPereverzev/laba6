import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { AuthContext } from '../App'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('planner')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const { handleLogin } = useContext(AuthContext)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register', {
        username,
        password,
        full_name: fullName,
        role
      })
      // Auto-login after registration
      const fd = new FormData()
      fd.append('username', username)
      fd.append('password', password)
      const r = await api.post('/auth/token', fd)
      handleLogin(r.data.access_token)
      nav('/')
    } catch (err) {
      setMsg('Registration failed: ' + (err.response?.data?.detail || err.message))
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
        <h2 style={{ marginTop: 0, textAlign: 'center' }}>Register</h2>
        <form onSubmit={submit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Full Name</label>
            <input 
              value={fullName} 
              onChange={(e)=>setFullName(e.target.value)} 
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Username</label>
            <input 
              value={username} 
              onChange={(e)=>setUsername(e.target.value)} 
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              required
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Role</label>
            <select value={role} onChange={(e)=>setRole(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <option value="planner">planner</option>
              <option value="operator">operator</option>
              <option value="viewer">viewer</option>
              <option value="admin">admin</option>
            </select>
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
              background: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        {msg && <div style={{ marginTop: '16px', color: '#dc3545' }}>{msg}</div>}
        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          Already have an account? <Link to="/login" style={{ color: '#007bff' }}>Login here</Link>
        </p>
      </div>
    </div>
  )
}
