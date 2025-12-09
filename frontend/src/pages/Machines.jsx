import React, { useEffect, useState, useContext } from 'react'
import api from '../api'
import { AuthContext } from '../App'

export default function Machines() {
  const [machines, setMachines] = useState([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')
  const { user } = useContext(AuthContext)
  const canEdit = user?.role === 'admin' || user?.role === 'planner'
  const canDelete = user?.role === 'admin'

  const loadMachines = async () => {
    try {
      const r = await api.get('/machines/')
      setMachines(r.data)
    } catch (e) {
      setMsg('Failed to load machines: ' + e.message)
    }
  }

  useEffect(() => {
    loadMachines()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/machines/', { name, code })
      setName('')
      setCode('')
      setMsg('Machine created!')
      loadMachines()
    } catch (e) {
      setMsg('Failed to create machine: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (m) => {
    setEditing(m.id)
    setEditName(m.name)
    setEditCode(m.code || '')
  }

  const cancelEdit = () => {
    setEditing(null)
    setEditName('')
    setEditCode('')
  }

  const submitEdit = async (id) => {
    try {
      await api.put(`/machines/${id}`, { name: editName, code: editCode })
      setMsg('Machine updated')
      cancelEdit()
      loadMachines()
    } catch (e) {
      setMsg('Failed to update machine: ' + (e.response?.data?.detail || e.message))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this machine?')) return
    try {
      // Backend doesn't have DELETE yet, so we'll just show a message
      setMsg('Delete functionality requires backend DELETE endpoint')
    } catch (e) {
      setMsg('Failed to delete: ' + e.message)
    }
  }

  return (
    <div>
      <h1>Machines Management</h1>

      <div style={{ 
        padding: '24px', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        marginBottom: '32px',
        background: '#f9f9f9'
      }}>
        <h3 style={{ marginTop: 0 }}>Add New Machine</h3>
        <form onSubmit={handleCreate} style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Machine Name</label>
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Machine Code</label>
            <input 
              value={code} 
              onChange={(e) => setCode(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <button 
            disabled={loading}
            style={{ 
              padding: '10px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Adding...' : 'Add Machine'}
          </button>
        </form>
        {msg && <div style={{ marginTop: '16px', color: '#dc3545' }}>{msg}</div>}
      </div>

      <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Machines List ({machines.length})</h3>
        {machines.length === 0 ? (
          <p style={{ color: '#666' }}>No machines yet. Create one above.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #007bff', background: '#f0f0f0' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Code</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {machines.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px' }}>{m.id}</td>
                  <td style={{ padding: '12px' }}>{m.name}</td>
                  <td style={{ padding: '12px' }}>{m.code || '—'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: m.status === 'idle' ? '#ffc107' : '#28a745',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {editing === m.id ? (
                      // modal-like inline for simplicity on small screens
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <input value={editName} onChange={(e)=>setEditName(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }} />
                        <input value={editCode} onChange={(e)=>setEditCode(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }} />
                        <button onClick={()=>submitEdit(m.id)} style={{ padding: '6px 8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>Save</button>
                        <button onClick={cancelEdit} style={{ padding: '6px 8px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {canEdit && <button onClick={() => startEdit(m)} style={{ padding: '4px 8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>}
                        {canDelete && <button 
                          onClick={() => handleDelete(m.id)}
                          style={{ 
                            padding: '4px 8px', 
                            background: '#dc3545', 
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
