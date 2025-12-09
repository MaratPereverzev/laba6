import React, { useEffect, useState, useContext } from 'react'
import api from '../api'
import { AuthContext } from '../App'

export default function Profile() {
  const { token, handleLogout } = useContext(AuthContext)
  const [profile, setProfile] = useState(null)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const r = await api.get('/users/me')
        if (!mounted) return
        setProfile(r.data)
        setFullName(r.data.full_name || '')
      } catch (e) {
        setMsg('Failed to load profile')
      }
    }
    load()
    return () => { mounted = false }
  }, [token])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.put('/users/me', { full_name: fullName, password: password || undefined })
      setMsg('Profile updated')
      if (password) {
        // if password changed, logout so user can re-login
        handleLogout()
      }
    } catch (e) {
      setMsg('Update failed: ' + (e.response?.data?.detail || e.message))
    }
  }

  if (!profile) return <div>Loading profile...</div>

  return (
    <div style={{ maxWidth: '600px', margin: '24px auto' }}>
      <h1>Profile</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px' }}>Username</label>
          <input value={profile.username} disabled style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px' }}>Full name</label>
          <input value={fullName} onChange={(e)=>setFullName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px' }}>New password (leave blank to keep)</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>Save</button>
        </div>
        {msg && <div style={{ color: '#dc3545' }}>{msg}</div>}
      </form>
    </div>
  )
}
