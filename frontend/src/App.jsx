import React, { createContext, useState } from 'react'
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Machines from './pages/Machines'
import Orders from './pages/Orders'
import Events from './pages/Events'
import Reports from './pages/Reports'
import Users from './pages/Users'
import { getToken, setToken } from './api'

export const AuthContext = createContext()

export default function App() {
  const [token, setTokenState] = useState(getToken())
  const [user, setUser] = useState(null)
  const nav = useNavigate()

  // When token changes, fetch profile
  React.useEffect(() => {
    let mounted = true
    async function fetchProfile() {
      if (!token) return setUser(null)
      try {
        const r = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!mounted) return
        if (r.ok) {
          const data = await r.json()
          setUser(data)
        } else {
          setUser(null)
        }
      } catch (e) {
        setUser(null)
      }
    }
    fetchProfile()
    return () => { mounted = false }
  }, [token])

  const handleLogin = (t) => {
    setToken(t)
    setTokenState(t)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setTokenState(null)
    setUser(null)
    nav('/login')
  }

  const ProtectedRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" />
  }

  return (
    <AuthContext.Provider value={{ token, user, handleLogin, handleLogout }}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {token && (
          <nav style={{ 
            padding: '16px 24px', 
            borderBottom: '2px solid #007bff',
            background: '#f8f9fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <Link to="/" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold', fontSize: '16px' }}>Production Optimization</Link>
              <Link to="/" style={{ textDecoration: 'none', color: '#333' }}>Dashboard</Link>
              <Link to="/machines" style={{ textDecoration: 'none', color: '#333' }}>Machines</Link>
              <Link to="/orders" style={{ textDecoration: 'none', color: '#333' }}>Orders</Link>
              <Link to="/events" style={{ textDecoration: 'none', color: '#333' }}>Events</Link>
              <Link to="/reports" style={{ textDecoration: 'none', color: '#333' }}>Reports</Link>
              {user?.role === 'admin' && <Link to="/users" style={{ textDecoration: 'none', color: '#333' }}>Users</Link>}
              <Link to="/profile" style={{ textDecoration: 'none', color: '#333' }}>Profile</Link>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ textAlign: 'right', lineHeight: 1 }}>
                    <div style={{ fontWeight: '600' }}>{user.full_name || user.username}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{user.role}</div>
                  </div>
                </div>
              )}
              <button onClick={handleLogout} style={{ padding: '8px 12px', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>Logout</button>
            </div>
          </nav>
        )}
        <main style={{ padding: '24px', flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/machines" element={<ProtectedRoute><Machines /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  )
}
