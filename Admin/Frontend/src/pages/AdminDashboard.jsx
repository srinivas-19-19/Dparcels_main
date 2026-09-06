import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  Calendar,
  Users,
  ShoppingBag,
  UserCheck,
  CreditCard,
  Shield,
  FileText,
  Bell,
  Settings,
  Search,
  CheckCircle,
  XCircle,
  Star,
  Package,
  LogOut,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import AdminRiders from './AdminRiders';
import AdminOrders from './AdminOrders';
import AdminCustomers from './AdminCustomers';
import AdminPayments from './AdminPayments';
import AdminSupport from './AdminSupport';
import AdminReports from './AdminReports';
import AdminNotifications from './AdminNotifications';
import AdminSettings from './AdminSettings';
import '../styles/dashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [timeRange, setTimeRange] = useState('1M');
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeRiders: 0,
    pendingRiders: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    if (activeTab === 'Overview') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  };

  // Chart Data Datasets
  const chartDatasets = {
    '7D': [
      { date: '17 Aug', amount: '₹8,400', prev: '₹7,100', orders: '28', x: 40, y: 110 },
      { date: '18 Aug', amount: '₹9,800', prev: '₹8,200', orders: '32', x: 100, y: 95 },
      { date: '19 Aug', amount: '₹11,200', prev: '₹9,400', orders: '36', x: 160, y: 75 },
      { date: '20 Aug', amount: '₹10,500', prev: '₹9,100', orders: '31', x: 220, y: 82 },
      { date: '21 Aug', amount: '₹14,100', prev: '₹11,000', orders: '44', x: 280, y: 48 },
      { date: '22 Aug', amount: '₹12,450', prev: '₹10,800', orders: '39', x: 340, y: 62 },
      { date: '23 Aug', amount: '₹16,800', prev: '₹12,500', orders: '52', x: 400, y: 28 }
    ],
    '1M': [
      { date: '1 Aug', amount: '₹2,500', prev: '₹2,100', orders: '12', x: 40, y: 145 },
      { date: '4 Aug', amount: '₹5,100', prev: '₹4,300', orders: '18', x: 75, y: 120 },
      { date: '6 Aug', amount: '₹8,900', prev: '₹6,800', orders: '29', x: 110, y: 90 },
      { date: '8 Aug', amount: '₹7,200', prev: '₹6,400', orders: '24', x: 145, y: 105 },
      { date: '11 Aug', amount: '₹10,100', prev: '₹8,200', orders: '33', x: 180, y: 80 },
      { date: '14 Aug', amount: '₹12,000', prev: '₹9,500', orders: '38', x: 215, y: 65 },
      { date: '16 Aug', amount: '₹11,200', prev: '₹9,100', orders: '35', x: 250, y: 72 },
      { date: '18 Aug', amount: '₹13,100', prev: '₹10,400', orders: '41', x: 285, y: 56 },
      { date: '21 Aug', amount: '₹14,000', prev: '₹11,200', orders: '45', x: 320, y: 48 },
      { date: '22 Aug', amount: '₹12,450', prev: '₹10,800', orders: '39', x: 355, y: 60 },
      { date: '26 Aug', amount: '₹16,500', prev: '₹12,900', orders: '51', x: 390, y: 32 },
      { date: '31 Aug', amount: '₹18,200', prev: '₹13,800', orders: '58', x: 425, y: 22 }
    ]
  };

  const currentDataset = chartDatasets[timeRange] || chartDatasets['1M'];
  const [hoveredPt, setHoveredPt] = useState(currentDataset[9] || currentDataset[currentDataset.length - 1]);

  const handleLogout = () => {
    navigate('/admin/login');
  };

  // Smooth SVG path
  const buildSvgPath = (points, key = 'y') => {
    return points.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt[key]}`;
      const prev = points[i - 1];
      const cpX1 = prev.x + (pt.x - prev.x) / 2;
      const cpY1 = prev[key];
      const cpX2 = prev.x + (pt.x - prev.x) / 2;
      const cpY2 = pt[key];
      return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pt.x} ${pt[key]}`;
    }, '');
  };

  const mainPathD = buildSvgPath(currentDataset, 'y');

  return (
    <div className="dashboard-container">
      {/* Dynamic Top Title Header Banner */}
      <div className="dashboard-top-title">
        {activeTab === 'Settings'
          ? '11. SYSTEM SETTINGS'
          : activeTab === 'Notifications'
          ? '10. NOTIFICATIONS MANAGEMENT'
          : activeTab === 'Reports'
          ? '9. REPORTS & ANALYTICS'
          : activeTab === 'Support'
          ? '8. SUPPORT / CHAT'
          : activeTab === 'Payments'
          ? '7. PAYMENTS & TRANSACTIONS'
          : activeTab === 'Customers'
          ? '6. CUSTOMERS MANAGEMENT'
          : activeTab === 'Orders'
          ? '4. ORDERS MANAGEMENT'
          : activeTab === 'Riders'
          ? '2. RIDERS MANAGEMENT'
          : '1. OVERVIEW DASHBOARD'}
      </div>

      <div className="dashboard-body">
        {/* LEFT SIDEBAR */}
        <aside className="dashboard-sidebar">
          <div>
            {/* DParcels Logo */}
            <div className="sidebar-logo">
              <div className="logo-box">
                <Package size={22} color="#FFF" strokeWidth={2.8} />
              </div>
              <div className="logo-text">
                <span className="logo-title">DParcels<span className="logo-dot">.</span></span>
                <span className="logo-subtitle">ADMIN PANEL</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="sidebar-nav">
              <button
                className={`nav-item ${activeTab === 'Overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('Overview')}
              >
                <Calendar size={18} />
                <span>Overview</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'Riders' ? 'active' : ''}`}
                onClick={() => setActiveTab('Riders')}
              >
                <Users size={18} />
                <span>Riders</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'Orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('Orders')}
              >
                <ShoppingBag size={18} />
                <span>Orders</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'Customers' ? 'active' : ''}`}
                onClick={() => setActiveTab('Customers')}
              >
                <UserCheck size={18} />
                <span>Customers</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'Payments' ? 'active' : ''}`}
                onClick={() => setActiveTab('Payments')}
              >
                <CreditCard size={18} />
                <span>Payments</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'Support' ? 'active' : ''}`}
                onClick={() => setActiveTab('Support')}
              >
                <Shield size={18} />
                <span>Support</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'Reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('Reports')}
              >
                <FileText size={18} />
                <span>Reports</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'Notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('Notifications')}
              >
                <div className="nav-icon-wrapper">
                  <Bell size={18} />
                  <span className="nav-badge">3</span>
                </div>
                <span>Notifications</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'Settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('Settings')}
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* User Profile Card & Logout */}
          <div className="sidebar-bottom">
            <div className="user-profile-card">
              <div className="avatar-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Admin Avatar"
                  className="user-avatar"
                />
                <span className="status-indicator"></span>
              </div>
              <div className="user-details">
                <div className="user-name">admin</div>
                <div className="user-role">Administrator</div>
                <div className="user-status-text">
                  <span className="green-dot"></span> Online
                </div>
              </div>
            </div>

            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* DYNAMIC MAIN AREA CONTENT */}
        <main className="dashboard-main">
          {activeTab === 'Settings' ? (
            <AdminSettings />
          ) : activeTab === 'Notifications' ? (
            <AdminNotifications />
          ) : activeTab === 'Reports' ? (
            <AdminReports />
          ) : activeTab === 'Support' ? (
            <AdminSupport />
          ) : activeTab === 'Payments' ? (
            <AdminPayments />
          ) : activeTab === 'Customers' ? (
            <AdminCustomers />
          ) : activeTab === 'Orders' ? (
            <AdminOrders />
          ) : activeTab === 'Riders' ? (
            <AdminRiders />
          ) : (
            <>
              {/* Header Bar */}
              <header className="main-header">
                <div>
                  <h1 className="header-greeting">Welcome back, admin! 👋</h1>
                  <p className="header-subtext">Here's what's happening with your delivery platform today.</p>
                </div>

                <div className="header-actions">
                  <button className="icon-btn" title="Search">
                    <Search size={18} />
                  </button>

                  <button className="icon-btn has-badge" title="Notifications" onClick={() => setActiveTab('Notifications')}>
                    <Bell size={18} />
                    <span className="header-badge">3</span>
                  </button>
                </div>
              </header>

              {/* TOP 4 STAT CARDS */}
              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">TOTAL REVENUE</span>
                  </div>
                  <div className="stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
                  <div className="stat-subtext positive">Real-time</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">TOTAL ORDERS</span>
                  </div>
                  <div className="stat-value">{stats.totalOrders}</div>
                  <div className="stat-subtext positive">Real-time</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">ACTIVE RIDERS</span>
                    <span className="stat-icon-badge green">
                      <Users size={14} />
                    </span>
                  </div>
                  <div className="stat-value">{stats.activeRiders}</div>
                  <div className="stat-subtext muted">Online Now</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">PENDING APPROVALS</span>
                    <span className="stat-icon-badge orange">
                      <TrendingUp size={14} />
                    </span>
                  </div>
                  <div className="stat-value">{stats.pendingRiders}</div>
                  <div className="stat-subtext muted">Riders</div>
                </div>
              </section>

              {/* MIDDLE SECTION (Revenue Graph & Live Orders) */}
              <section className="middle-grid">
                {/* REVENUE OVERVIEW CHART BOX */}
                <div className="graph-box advanced">
                  <div className="graph-header-advanced">
                    <div>
                      <div className="graph-title-row">
                        <h2 className="section-heading">Revenue Overview</h2>
                        <span className="growth-chip">
                          <ArrowUpRight size={13} /> +24.8% Growth
                        </span>
                      </div>
                      <div className="graph-meta-stats">
                        <span className="meta-stat-item">
                          Peak: <strong>₹18,200</strong>
                        </span>
                        <span className="meta-stat-divider">•</span>
                        <span className="meta-stat-item">
                          Avg Daily: <strong>₹11,400</strong>
                        </span>
                      </div>
                    </div>

                    {/* Time Filter Pills */}
                    <div className="time-filter-pills">
                      {['7D', '1M', '6M', '1Y'].map((range) => (
                        <button
                          key={range}
                          className={`filter-pill ${timeRange === range ? 'active' : ''}`}
                          onClick={() => setTimeRange(range)}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* GRAPH CANVAS */}
                  <div className="graph-wrapper advanced">
                    <svg viewBox="0 0 450 180" className="chart-svg">
                      <defs>
                        <linearGradient id="primaryOrangeGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.38" />
                          <stop offset="60%" stopColor="#FF6B00" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Gridlines */}
                      <line x1="30" y1="25" x2="440" y2="25" stroke="#161E14" strokeDasharray="4 4" />
                      <line x1="30" y1="65" x2="440" y2="65" stroke="#161E14" strokeDasharray="4 4" />
                      <line x1="30" y1="105" x2="440" y2="105" stroke="#161E14" strokeDasharray="4 4" />
                      <line x1="30" y1="145" x2="440" y2="145" stroke="#161E14" strokeDasharray="4 4" />

                      {/* Y Axis Numerical Scale */}
                      <text x="20" y="29" className="axis-label">₹20K</text>
                      <text x="20" y="69" className="axis-label">₹15K</text>
                      <text x="20" y="109" className="axis-label">₹10K</text>
                      <text x="20" y="149" className="axis-label">₹0</text>

                      {/* Area Fill */}
                      <path
                        d={`${mainPathD} L ${currentDataset[currentDataset.length - 1].x} 145 L ${currentDataset[0].x} 145 Z`}
                        fill="url(#primaryOrangeGlow)"
                      />

                      {/* Vertical Tracking Line */}
                      {hoveredPt && (
                        <line
                          x1={hoveredPt.x}
                          y1="20"
                          x2={hoveredPt.x}
                          y2="145"
                          stroke="#FF6B00"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          opacity="0.5"
                        />
                      )}

                      {/* Main Smooth Curved Trend Line */}
                      <path
                        d={mainPathD}
                        fill="none"
                        stroke="#FF6B00"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Transparent Hover Detection Rects */}
                      {currentDataset.map((pt, idx) => (
                        <rect
                          key={idx}
                          x={pt.x - 15}
                          y="15"
                          width="30"
                          height="140"
                          fill="transparent"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredPt(pt)}
                        />
                      ))}
                    </svg>

                    {/* Tooltip Popover */}
                    {hoveredPt && (
                      <div
                        className="advanced-graph-tooltip"
                        style={{
                          left: `${(hoveredPt.x / 450) * 100}%`,
                          top: `${(hoveredPt.y / 180) * 100}%`
                        }}
                      >
                        <div className="tooltip-header">
                          <span className="tooltip-badge">{hoveredPt.date}</span>
                          <span className="tooltip-orders">{hoveredPt.orders} Orders</span>
                        </div>
                        <div className="tooltip-main-val">{hoveredPt.amount}</div>
                        <div className="tooltip-sub-comparison">
                          Prev: <span className="prev-val">{hoveredPt.prev}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* X Axis Dates */}
                  <div className="x-axis-dates">
                    {currentDataset.filter((_, idx) => idx % Math.ceil(currentDataset.length / 6) === 0).map((pt, i) => (
                      <span key={i}>{pt.date}</span>
                    ))}
                  </div>
                </div>

                {/* Live Orders Box */}
                <div className="live-orders-box">
                  <div className="orders-header">
                    <h2 className="section-heading">Live Orders</h2>
                    <a href="#view-all" className="view-all-link">View All</a>
                  </div>

                  <div className="orders-list">
                    <OrderItem id="#104" customer="Srinivasulu" status="In Transit" statusClass="in-transit" />
                    <OrderItem id="#103" customer="Parimala" status="Picking Up" statusClass="picking-up" />
                    <OrderItem id="#102" customer="Ravi Kumar" status="Waiting" statusClass="waiting" />
                    <OrderItem id="#101" customer="Keerthi" status="Cancelled" statusClass="cancelled" />
                    <OrderItem id="#100" customer="Lalitha" status="Delivered" statusClass="delivered" />
                  </div>
                </div>
              </section>

              {/* BOTTOM ROW (4 Metrics Cards) */}
              <section className="bottom-grid">
                <div className="metric-card">
                  <div className="metric-title">COMPLETED ORDERS</div>
                  <div className="metric-content">
                    <span className="metric-number">324</span>
                    <CheckCircle size={22} className="metric-icon green" />
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-title">CANCELLED ORDERS</div>
                  <div className="metric-content">
                    <span className="metric-number">12</span>
                    <XCircle size={22} className="metric-icon red" />
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-title">AVG ORDER VALUE</div>
                  <div className="metric-content">
                    <span className="metric-number">₹68.80</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-title">CUSTOMER SATISFACTION</div>
                  <div className="metric-content">
                    <span className="metric-number">
                      4.8 <span className="sub-max">/ 5</span>
                    </span>
                    <Star size={20} className="metric-icon yellow-star" fill="#FF6B00" color="#FF6B00" />
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function OrderItem({ id, customer, status, statusClass }) {
  return (
    <div className="order-item-row">
      <div className="order-details">
        <span className="order-id">{id}</span>
        <span className="customer-name">{customer}</span>
      </div>
      <span className={`status-pill ${statusClass}`}>{status}</span>
    </div>
  );
}
