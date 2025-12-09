import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Users() {
  const [users, setUsers] = useState([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('planner')
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      const r = await api.get('/users/')
      setUsers(r.data)
    } catch (e) {
      setMsg('Failed to load users: ' + (e.response?.data?.detail || e.message))
    }
  }

  useEffect(()=>{ load() }, [])

  const createUser = async (e) => {
    e.preventDefault()
    try {
      await api.post('/users/', { username, password, full_name: fullName, role })
      setUsername(''); setPassword(''); setFullName(''); setRole('planner')
      setMsg('User created')
      load()
    } catch (e) {
      setMsg('Create failed: ' + (e.response?.data?.detail || e.message))
    }
  }

  const changeRole = async (id, newRole) => {
    try {
      await api.put(`/users/${id}/role`, newRole)
      load()
    } catch (e) {
      setMsg('Change role failed')
    }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Delete user?')) return
    try {
      await api.delete(`/users/${id}`)
      load()
    } catch (e) {
      setMsg('Delete failed')
    }
  }

  return (
    <div>
      <h1>Admin — Users</h1>
      <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '24px' }}>
        <h3>Create User</h3>
        <form onSubmit={createUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <input value={fullName} onChange={(e)=>setFullName(e.target.value)} placeholder="Full name" />
          <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Username" required />
          <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" required />
          <select value={role} onChange={(e)=>setRole(e.target.value)}>
            <option value="admin">admin</option>
            <option value="planner">planner</option>
            <option value="operator">operator</option>
            <option value="viewer">viewer</option>
          </select>
          <button style={{ gridColumn: '1 / -1', padding: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>Create</button>
        </form>
        {msg && <div style={{ marginTop: '8px', color: '#dc3545' }}>{msg}</div>}
      </div>

      <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Users ({users.length})</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ padding: '8px' }}>ID</th>
              <th style={{ padding: '8px' }}>Username</th>
              <th style={{ padding: '8px' }}>Full Name</th>
              <th style={{ padding: '8px' }}>Role</th>
              <th style={{ padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{u.id}</td>
                <td style={{ padding: '8px' }}>{u.username}</td>
                <td style={{ padding: '8px' }}>{u.full_name}</td>
                <td style={{ padding: '8px' }}>
                  <select defaultValue={u.role} onChange={(e)=>changeRole(u.id, e.target.value)}>
                    <option value="admin">admin</option>
                    <option value="planner">planner</option>
                    <option value="operator">operator</option>
                    <option value="viewer">viewer</option>
                  </select>
                </td>
                <td style={{ padding: '8px' }}>
                  <button onClick={()=>deleteUser(u.id)} style={{ padding: '6px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
