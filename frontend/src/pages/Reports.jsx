import React, { useState } from 'react'
import api from '../api'

export default function Reports() {
  const [machineId, setMachineId] = useState('machine:1')
  const [startDate, setStartDate] = useState(new Date(Date.now() - 86400000).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [oeeData, setOeeData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleGenerateReport = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      const start = new Date(startDate).toISOString()
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      const endIso = end.toISOString()

      const r = await api.get('/reports/oee', {
        params: {
          machine_id: machineId,
          start,
          end: endIso
        }
      })

      setOeeData(r.data)
    } catch (e) {
      setMsg('Failed to generate report: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }

  const getOeeColor = (oee) => {
    if (oee >= 0.85) return '#28a745'
    if (oee >= 0.70) return '#ffc107'
    return '#dc3545'
  }

  const formatPercent = (val) => (val * 100).toFixed(1) + '%'

  return (
    <div>
      <h1>Production Reports & Analytics</h1>

      <div style={{ 
        padding: '24px', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        marginBottom: '32px',
        background: '#f9f9f9'
      }}>
        <h3 style={{ marginTop: 0 }}>OEE (Overall Equipment Effectiveness) Report</h3>
        <form onSubmit={handleGenerateReport} style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Machine ID</label>
              <input 
                value={machineId} 
                onChange={(e) => setMachineId(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Start Date</label>
              <input 
                type="date"
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>End Date</label>
              <input 
                type="date"
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                required
              />
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
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </form>
        {msg && <div style={{ marginTop: '16px', color: '#dc3545' }}>{msg}</div>}
      </div>

      {oeeData && (
        <div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div style={{ padding: '24px', border: '2px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>OEE Score</div>
              <div style={{ 
                fontSize: '48px', 
                fontWeight: 'bold', 
                color: getOeeColor(oeeData.oee)
              }}>
                {formatPercent(oeeData.oee)}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Overall Equipment Effectiveness</div>
            </div>

            <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>Availability</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>
                {formatPercent(oeeData.availability)}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                {oeeData.run_seconds.toFixed(0)}s run time
              </div>
            </div>

            <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>Performance</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
                {formatPercent(oeeData.performance)}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Production rate</div>
            </div>

            <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>Quality</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>
                {formatPercent(oeeData.quality)}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Good units ratio</div>
            </div>
          </div>

          <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>Report Details</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>Machine ID</td>
                  <td style={{ padding: '12px' }}>{oeeData.machine_id}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>Period</td>
                  <td style={{ padding: '12px' }}>{new Date(oeeData.start).toLocaleString()} to {new Date(oeeData.end).toLocaleString()}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>Planned Time</td>
                  <td style={{ padding: '12px' }}>{oeeData.planned_seconds.toFixed(0)} seconds ({(oeeData.planned_seconds / 3600).toFixed(2)} hours)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>Downtime</td>
                  <td style={{ padding: '12px' }}>{oeeData.downtime_seconds.toFixed(0)} seconds ({(oeeData.downtime_seconds / 3600).toFixed(2)} hours)</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', fontWeight: '500' }}>Run Time</td>
                  <td style={{ padding: '12px' }}>{oeeData.run_seconds.toFixed(0)} seconds ({(oeeData.run_seconds / 3600).toFixed(2)} hours)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!oeeData && !loading && !msg && (
        <div style={{ padding: '24px', background: '#e7f3ff', border: '1px solid #b3d9ff', borderRadius: '4px', color: '#004085' }}>
          <strong>How OEE is calculated:</strong>
          <ul>
            <li><strong>Availability</strong> = Run Time / Planned Time</li>
            <li><strong>Performance</strong> = (Produced Units × Ideal Cycle Time) / Run Time</li>
            <li><strong>Quality</strong> = Good Units / Total Produced</li>
            <li><strong>OEE</strong> = Availability × Performance × Quality</li>
          </ul>
          <p>Fill in the form above and click "Generate Report" to see metrics for a specific machine and time period.</p>
        </div>
      )}
    </div>
  )
}
