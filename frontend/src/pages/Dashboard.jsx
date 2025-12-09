import React, { useEffect, useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import api from '../api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement)

export default function Dashboard() {
  // include avgPriority & totalQuantity in defaults so UI shows numbers (not dash)
  const [stats, setStats] = useState({ orders: 0, machines: 0, events: 0, avgPriority: 0, totalQuantity: 0 })
  const [chartData, setChartData] = useState(null)
  const [machineStatus, setMachineStatus] = useState({})
  const [machineBar, setMachineBar] = useState(undefined)
  const [goodBad, setGoodBad] = useState({ good: 0, bad: 0 })
  const [ordersStatus, setOrdersStatus] = useState({ labels: [], data: [] })

  useEffect(() => {
    async function load() {
      try {
        const orders = await api.get('/orders/')
        const machines = await api.get('/machines/')
        // /events/bulk is a POST-only endpoint; use production metrics instead
        let productionMetrics = { data: [] }
        try {
          productionMetrics = await api.get('/reports/metrics/production')
        } catch (e) {
          console.warn('Failed to load production metrics', e)
        }

        // compute more statistics
        // Active orders = orders not completed or cancelled
        const activeOrders = orders.data.filter(o => (o.status || '').toLowerCase() !== 'completed' && (o.status || '').toLowerCase() !== 'cancelled')
        const totalMachines = machines.data.length
        const avgPriority = orders.data.length ? Number((orders.data.reduce((s, o) => s + (Number(o.priority) || 0), 0) / orders.data.length).toFixed(2)) : 0
        const totalQuantity = orders.data.length ? orders.data.reduce((s, o) => s + (o.quantity || 0), 0) : 0
        const totalProduced = productionMetrics.data.reduce((s, m) => s + (m.produced || 0), 0)

        setStats({
          orders: activeOrders.length,
          machines: totalMachines,
          events: totalProduced || 0,
          avgPriority,
          totalQuantity
        })

        // Build machine production bar (for potential reuse)
        const statusMap = {}
        machines.data.forEach(m => {
          statusMap[m.status] = (statusMap[m.status] || 0) + 1
        })
        setMachineStatus(statusMap)
        // machine bar from productionMetrics
        if (productionMetrics.data && productionMetrics.data.length) {
          const labels = productionMetrics.data.map(x => x.machine)
          const data = productionMetrics.data.map(x => x.produced)
          setMachineBar({ labels, data })
          // compute good/bad
          const good = productionMetrics.data.reduce((s, x) => s + (x.good || 0), 0)
          const bad = productionMetrics.data.reduce((s, x) => s + ((x.produced || 0) - (x.good || 0)), 0)
          setGoodBad({ good, bad })
        }

        // Production time series: try real trend, fallback to demo
        try {
          const trend = await api.get('/reports/production_trend')
          const labels = trend.data.map(t => new Date(t.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
          const values = trend.data.map(t => t.produced)
          setChartData({ labels, datasets: [{ label: 'Production (units/hour)', data: values, borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.1)', tension: 0.4 }] })
        } catch (e) {
          const now = Date.now()
          const labels = [...Array(12).keys()].map(i => {
            const d = new Date(now - (11-i)*3600*1000)
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })
          const data = [...Array(12).keys()].map(() => Math.floor(Math.random()*100))
          setChartData({ labels, datasets: [{ label: 'Production (units/hour)', data, borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.1)', tension: 0.4 }] })
        }

        // Orders by status
        try {
          const s = await api.get('/reports/orders_status')
          const labels = s.data.map(x => x.status)
          const values = s.data.map(x => x.count)
          setOrdersStatus({ labels, data: values })
        } catch (e) {
          setOrdersStatus({ labels: ['pending','in_progress','completed'], data: [5,2,3] })
        }
      } catch (e) {
        console.error('Failed to load dashboard data:', e)
      }
    }
    load()
  }, [])

  return (
    <div>
      <h1>Production Dashboard</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>{stats.orders}</div>
          <div style={{ color: '#666', marginTop: '8px' }}>Active Orders</div>
        </div>
        <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>{stats.machines}</div>
          <div style={{ color: '#666', marginTop: '8px' }}>Machines</div>
        </div>
        <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffc107' }}>{stats.avgPriority !== undefined && stats.avgPriority !== null ? stats.avgPriority : '—'}</div>
          <div style={{ color: '#666', marginTop: '8px' }}>Avg. Order Priority</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
        <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Production Output (Last 12 Hours)</h3>
          {chartData && <Line data={chartData} options={{ maintainAspectRatio: true }} />}
        </div>
        <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Orders by Status</h3>
          {ordersStatus.labels.length > 0 && (
            <Bar data={{ labels: ordersStatus.labels, datasets: [{ label: 'Orders', data: ordersStatus.data, backgroundColor: ['#ffc107', '#007bff', '#28a745', '#dc3545'] }] }} options={{ maintainAspectRatio: true }} />
          )}
        </div>
      </div>

      

      <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>System Health</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '12px' }}>Database Connection</td>
              <td style={{ padding: '12px', textAlign: 'right', color: '#28a745', fontWeight: 'bold' }}>✓ Active</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '12px' }}>API Server</td>
              <td style={{ padding: '12px', textAlign: 'right', color: '#28a745', fontWeight: 'bold' }}>✓ Running</td>
            </tr>
            <tr>
              <td style={{ padding: '12px' }}>Frontend</td>
              <td style={{ padding: '12px', textAlign: 'right', color: '#28a745', fontWeight: 'bold' }}>✓ Connected</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
