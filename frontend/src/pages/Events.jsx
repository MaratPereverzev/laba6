import React, { useState } from 'react'
import api from '../api'

export default function Events() {
  const [source, setSource] = useState('')
  const [type, setType] = useState('production')
  const [payload, setPayload] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [recentEvents, setRecentEvents] = useState([])

  const handleIngest = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let parsed = {}
      try {
        parsed = JSON.parse(payload)
      } catch {
        setMsg('Invalid JSON payload')
        setLoading(false)
        return
      }

      await api.post('/events/bulk', [{
        source,
        type,
        payload: parsed
      }])
      
      setMsg('Event ingested successfully!')
      setSource('')
      setPayload('')
      
      // Add to recent events display
      setRecentEvents([{
        id: Date.now(),
        source,
        type,
        payload: parsed,
        ts: new Date().toLocaleString()
      }, ...recentEvents.slice(0, 9)])
    } catch (e) {
      setMsg('Failed to ingest event: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Events Ingestion</h1>

      <div style={{ 
        padding: '24px', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        marginBottom: '32px',
        background: '#f9f9f9'
      }}>
        <h3 style={{ marginTop: 0 }}>Ingest Production Event</h3>
        <form onSubmit={handleIngest} style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Machine ID/Source</label>
              <input 
                value={source} 
                onChange={(e) => setSource(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                required
                placeholder="machine:1"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Event Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              >
                <option value="production">Production</option>
                <option value="downtime">Downtime</option>
                <option value="quality_check">Quality Check</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Payload (JSON)</label>
            <textarea 
              value={payload} 
              onChange={(e) => setPayload(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontFamily: 'monospace', minHeight: '120px' }}
              required
              placeholder={JSON.stringify({ produced: 100, good: 95, ideal_cycle_time_ms: 2000 }, null, 2)}
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
            {loading ? 'Ingesting...' : 'Ingest Event'}
          </button>
        </form>
        {msg && <div style={{ marginTop: '16px', color: msg.includes('successfully') ? '#28a745' : '#dc3545' }}>{msg}</div>}
      </div>

      {recentEvents.length > 0 && (
        <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Recent Events ({recentEvents.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #007bff', background: '#f0f0f0' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Time</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Source</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Payload</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', fontSize: '12px' }}>{e.ts}</td>
                  <td style={{ padding: '12px' }}>{e.source}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: '#007bff',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {e.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', fontFamily: 'monospace' }}>
                    {JSON.stringify(e.payload).substring(0, 60)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '24px', padding: '16px', border: '1px solid #d4edda', background: '#d4edda', color: '#155724', borderRadius: '4px' }}>
        <strong>Example Payloads:</strong>
        <pre style={{ background: 'white', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
{`Production: {"produced": 100, "good": 95, "ideal_cycle_time_ms": 2000}
Downtime: {"duration_seconds": 600, "reason": "maintenance"}
Quality: {"checked": 50, "passed": 48}
Maintenance: {"duration_minutes": 30}`}
        </pre>
      </div>
    </div>
  )
}
