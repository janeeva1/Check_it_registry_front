import React, { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function BusinessDashboard() {
  const navigate = useNavigate()
  const [statsData, setStatsData] = useState({
    activeListings: 0,
    totalDevices: 0,
    revenue: 0,
    soldListings: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [verificationQueue, setVerificationQueue] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
        setLoading(true)
        const user = JSON.parse(localStorage.getItem('user_data') || '{}')
        
        // Parallel fetch for dashboard data
        const [stats, orders, devices, listings] = await Promise.all([
            (supabase.marketplace as any).getSellerStats().catch(() => ({ activeListings: 0, totalDevices: 0, revenue: 0, soldListings: 0 })),
            (supabase.marketplace as any).getSellerOrders().catch(() => []),
            supabase.devices.list().catch(() => []),
            (supabase.marketplace as any).list({ seller_id: user.id }).catch(() => [])
        ])

        if (stats) setStatsData(stats)

        // Process Verification Queue (devices that are unverified)
        const queue = devices.filter((d: any) => d.status === 'unverified').slice(0, 5)
        setVerificationQueue(queue)

        // Process Recent Activity
        // Combine orders, device registrations, and new listings
        const activity = [
            ...orders.map((o: any) => ({
                type: 'sale',
                title: `Order for ${o.brand} ${o.model}`,
                time: new Date(o.sold_at || o.updated_at),
                id: o.id
            })),
            ...devices.map((d: any) => ({
                type: 'device',
                title: `Registered ${d.brand} ${d.model}`,
                time: new Date(d.created_at),
                id: d.id
            })),
            ...listings.map((l: any) => ({
                type: 'listing',
                title: `Listed ${l.title}`,
                time: new Date(l.created_at),
                id: l.id
            }))
        ]
        
        // Sort by time desc and take top 5
        activity.sort((a, b) => b.time.getTime() - a.time.getTime())
        setRecentActivity(activity.slice(0, 5))

    } catch (err) {
        console.error(err)
    } finally {
        setLoading(false)
    }
  }

  const stats = [
    { label: 'Active Listings', value: statsData.activeListings },
    { label: 'Devices Registered', value: statsData.totalDevices },
    { label: 'Total Revenue', value: `₦${statsData.revenue.toLocaleString()}` },
    { label: 'Total Sales', value: statsData.soldListings },
  ]

  const operations = [
    { icon: 'smartphone', title: 'Register Device', desc: 'Add a single device', link: '/register-device' },
    { icon: 'library_add', title: 'Bulk Register', desc: 'Upload CSV template', link: '/bulk-register' },
    { icon: 'storefront', title: 'Create Listing', desc: 'Publish to marketplace', link: '/marketplace/create-listing' },
    { icon: 'shield_person', title: 'Verify Ownership', desc: 'Submit verification', link: '/verify-device' },
  ]

  const timeAgo = (date: Date) => {
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
      let interval = seconds / 31536000
      if (interval > 1) return Math.floor(interval) + " years ago"
      interval = seconds / 2592000
      if (interval > 1) return Math.floor(interval) + " months ago"
      interval = seconds / 86400
      if (interval > 1) return Math.floor(interval) + " days ago"
      interval = seconds / 3600
      if (interval > 1) return Math.floor(interval) + " hours ago"
      interval = seconds / 60
      if (interval > 1) return Math.floor(interval) + " minutes ago"
      return Math.floor(seconds) + " seconds ago"
  }

  return (
    <Layout requireAuth allowedRoles={["business"]}>
      <div className="container py-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h2 className="fw-bold m-0">Business Dashboard</h2>
            <p className="text-secondary m-0">Overview of devices, listings, and revenue</p>
          </div>
          <div className="d-flex gap-2">
            <a className="btn btn-gradient-primary" href="/marketplace/browse">Go to Marketplace</a>
            <a className="btn btn-outline-primary" href="/business/my-listings">My Listings</a>
          </div>
        </div>

        <div className="row g-3 mb-4">
          {stats.map((s, i) => (
            <div className="col-12 col-md-6 col-lg-3" key={i}>
              <div className="modern-card p-3">
                <p className="text-secondary mb-1">{s.label}</p>
                <h3 className="fw-bold m-0">{loading ? '...' : s.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12 col-lg-7">
            <div className="modern-card p-3 h-100">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="m-0">Quick Operations</h5>
                <span className="text-secondary">Tools</span>
              </div>
              <div className="row g-3">
                {operations.map((op, idx) => (
                  <div className="col-12 col-md-6" key={idx}>
                    <div className="modern-card p-3 h-100 d-flex flex-column">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-primary" style={{ fontFamily: 'Material Icons+Round' }}>{op.icon}</span>
                        <strong className="text-truncate" title={op.title}>{op.title}</strong>
                      </div>
                      <p className="text-secondary mb-3 small flex-grow-1">{op.desc}</p>
                      <button onClick={() => navigate(op.link)} className="btn btn-sm btn-outline-primary w-100">Open</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="modern-card p-3 h-100">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="m-0">Recent Activity</h5>
              </div>
              <div className="d-flex flex-column gap-3">
                {recentActivity.length === 0 ? <p className="text-secondary text-center my-3">No recent activity</p> : recentActivity.map((a, i) => (
                  <div key={i} className="d-flex align-items-start gap-3 border-bottom pb-2 last:border-0">
                    <div className={`status-badge ${a.type === 'sale' ? 'status-found' : a.type === 'device' ? 'status-verified' : 'status-unverified'}`} style={{ textTransform: 'capitalize' }}>{a.type}</div>
                    <div>
                      <p className="m-0 fw-medium">{a.title}</p>
                      <small className="text-secondary">{timeAgo(a.time)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12">
            <div className="modern-card p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h5 className="m-0">Verification Queue (Unverified Devices)</h5>
                <a href="/my-devices" className="text-primary">View All</a>
              </div>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th scope="col">Device</th>
                      <th scope="col">Brand/Model</th>
                      <th scope="col">Added</th>
                      <th scope="col" className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationQueue.length === 0 ? (
                        <tr><td colSpan={4} className="text-center text-secondary py-3">No pending verifications</td></tr>
                    ) : verificationQueue.map((d: any, i) => (
                      <tr key={i}>
                        <td>{d.imei || d.serial || d.vin || 'N/A'}</td>
                        <td>{d.brand} {d.model}</td>
                        <td>{new Date(d.created_at).toLocaleDateString()}</td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/verify-device?deviceId=${d.id}`)}>Verify</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  )
}