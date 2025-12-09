import React, { useEffect, useState, useContext } from 'react'
import api from '../api'
import { AuthContext } from '../App'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [orderNumber, setOrderNumber] = useState('')
  const [product, setProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [priority, setPriority] = useState(1)
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [editing, setEditing] = useState(null)
  const [editOrderNumber, setEditOrderNumber] = useState('')
  const [editProduct, setEditProduct] = useState('')
  const [editQuantity, setEditQuantity] = useState(1)
  const [editPriority, setEditPriority] = useState(1)
  const [editStatus, setEditStatus] = useState('pending')
  const { user } = useContext(AuthContext)
  const canEdit = user?.role === 'admin' || user?.role === 'planner'

  const loadOrders = async () => {
    try {
      const r = await api.get('/orders/')
      setOrders(r.data)
    } catch (e) {
      setMsg('Failed to load orders: ' + e.message)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/orders/', { 
        order_number: orderNumber, 
        product, 
        quantity: parseInt(quantity),
        priority: parseInt(priority),
        status
      })
      setOrderNumber('')
      setProduct('')
      setQuantity(1)
      setPriority(1)
      setMsg('Order created!')
      loadOrders()
    } catch (e) {
      setMsg('Failed to create order: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (o) => {
    setEditing(o.id)
    setEditOrderNumber(o.order_number)
    setEditProduct(o.product)
    setEditQuantity(o.quantity)
    setEditPriority(o.priority)
    setEditStatus(o.status)
  }

  const cancelEdit = () => {
    setEditing(null)
  }

  const submitEdit = async (id) => {
    try {
      await api.put(`/orders/${id}`, {
        order_number: editOrderNumber,
        product: editProduct,
        quantity: parseInt(editQuantity),
        priority: parseInt(editPriority),
        status: editStatus
      })
      setMsg('Order updated')
      cancelEdit()
      loadOrders()
    } catch (e) {
      setMsg('Failed to update order: ' + (e.response?.data?.detail || e.message))
    }
  }

  const getPriorityColor = (p) => {
    if (p >= 3) return '#dc3545'
    if (p === 2) return '#ffc107'
    return '#28a745'
  }

  const getStatusColor = (s) => {
    if (s === 'completed') return '#28a745'
    if (s === 'in_progress') return '#007bff'
    return '#ffc107'
  }

  return (
    <div>
      <h1>Orders Management</h1>

      <div style={{ 
        padding: '24px', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        marginBottom: '32px',
        background: '#f9f9f9'
      }}>
        <h3 style={{ marginTop: 0 }}>Create New Order</h3>
        <form onSubmit={handleCreate} style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Order Number</label>
              <input 
                value={orderNumber} 
                onChange={(e) => setOrderNumber(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                required
                placeholder="ORD-001"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Product</label>
              <input 
                value={product} 
                onChange={(e) => setProduct(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                required
                placeholder="Product name"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Quantity</label>
              <input 
                type="number"
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                required
                min="1"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Priority (1-5)</label>
              <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              >
                {[1,2,3,4,5].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '8px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Status</label>
              <select value={status} onChange={(e)=>setStatus(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <option value="pending">pending</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
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
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </form>
        {msg && <div style={{ marginTop: '16px', color: '#dc3545' }}>{msg}</div>}
      </div>

      <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Orders List ({orders.length})</h3>
        {orders.length === 0 ? (
          <p style={{ color: '#666' }}>No orders yet. Create one above.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #007bff', background: '#f0f0f0' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Order #</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Priority</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #ddd' }}>
                  {editing === o.id ? (
                    <>
                      <td style={{ padding: '12px' }}><input value={editOrderNumber} onChange={(e)=>setEditOrderNumber(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }} /></td>
                      <td style={{ padding: '12px' }}><input value={editProduct} onChange={(e)=>setEditProduct(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }} /></td>
                      <td style={{ padding: '12px', textAlign: 'center' }}><input type="number" value={editQuantity} onChange={(e)=>setEditQuantity(e.target.value)} style={{ padding: '6px', width: '80px', borderRadius: '4px', border: '1px solid #ddd' }} /></td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <select value={editPriority} onChange={(e)=>setEditPriority(e.target.value)}>
                          {[1,2,3,4,5].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={()=>submitEdit(o.id)} style={{ padding: '6px 8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>Save</button>
                          <button onClick={cancelEdit} style={{ padding: '6px 8px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{o.order_number}</td>
                      <td style={{ padding: '12px' }}>{o.product}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{o.quantity}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          background: getPriorityColor(o.priority),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {o.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          <span style={{ 
                            background: getStatusColor(o.status),
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {o.status}
                          </span>
                          <button onClick={() => startEdit(o)} style={{ padding: '4px 8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
