import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  ShoppingBag,
  Award,
  Filter
} from 'lucide-react';
import '../styles/dashboard.css';

export default function AdminReports() {
  const [timeframe, setTimeframe] = useState('This Month (Aug 2026)');

  // Combo Chart Dataset
  const reportData = [
    { date: '01 Aug', revenue: 4200, orders: 45, height: '40%' },
    { date: '05 Aug', revenue: 6800, orders: 68, height: '60%' },
    { date: '10 Aug', revenue: 9500, orders: 92, height: '80%' },
    { date: '15 Aug', revenue: 8100, orders: 78, height: '70%' },
    { date: '20 Aug', revenue: 12400, orders: 115, height: '95%' },
    { date: '23 Aug', revenue: 14850, orders: 138, height: '100%' }
  ];

  return (
    <div className="reports-view-container">
      {/* Top Action Bar */}
      <div className="reports-top-filter-bar">
        <div className="timeframe-dropdown">
          <Calendar size={16} color="#FF6B00" style={{ marginLeft: 12 }} />
          <select
            className="timeframe-select"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option>This Week (17 Aug - 23 Aug)</option>
            <option>This Month (Aug 2026)</option>
            <option>Last Month (Jul 2026)</option>
            <option>Quarter 3 (Q3 2026)</option>
          </select>
        </div>

        <button className="add-rider-btn glow-btn">
          <Download size={16} />
          <span>Export Analytics PDF / CSV</span>
        </button>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="reports-stats-grid">
        <div className="report-stat-card">
          <span className="stat-label">GROSS REVENUE</span>
          <span className="stat-amount">₹1,48,920.00</span>
          <span className="stat-subtext positive">
            <ArrowUpRight size={14} /> +18.4% vs last period
          </span>
        </div>

        <div className="report-stat-card">
          <span className="stat-label">TOTAL DELIVERIES</span>
          <span className="stat-amount">1,842</span>
          <span className="stat-subtext positive">
            <ArrowUpRight size={14} /> +12.1% vs last period
          </span>
        </div>

        <div className="report-stat-card">
          <span className="stat-label">RIDER PAYOUTS</span>
          <span className="stat-amount">₹1,14,200.00</span>
          <span className="stat-subtext positive">
            <ArrowUpRight size={14} /> 76.6% Payout Share
          </span>
        </div>

        <div className="report-stat-card">
          <span className="stat-label">AVG DELIVERY TIME</span>
          <span className="stat-amount">18.4 Mins</span>
          <span className="stat-subtext positive">
            <ArrowDownRight size={14} /> 2.1 mins faster
          </span>
        </div>
      </div>

      {/* Middle Grid: Revenue vs Orders Combo Chart + Top Performing Riders */}
      <div className="reports-middle-grid">
        <div className="report-chart-box">
          <div className="chart-header-row">
            <div>
              <h2 className="section-heading">Revenue & Order Volume Analytics</h2>
              <span className="header-subtext">Monthly comparison of platform turnover vs completed parcels.</span>
            </div>

            <div className="chart-legend-item">
              <span className="orange-dot-legend"></span>
              <span>Gross Revenue (₹)</span>
            </div>
          </div>

          <div className="combo-chart-wrapper">
            <svg viewBox="0 0 500 200" className="combo-chart-svg">
              <defs>
                <linearGradient id="barOrangeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.15" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="30" x2="480" y2="30" stroke="#161E14" strokeDasharray="4 4" />
              <line x1="30" y1="80" x2="480" y2="80" stroke="#161E14" strokeDasharray="4 4" />
              <line x1="30" y1="130" x2="480" y2="130" stroke="#161E14" strokeDasharray="4 4" />
              <line x1="30" y1="180" x2="480" y2="180" stroke="#161E14" strokeWidth="1.5" />

              {/* Bars */}
              {reportData.map((d, i) => {
                const xPos = 60 + i * 75;
                const barHeight = i * 25 + 40;
                return (
                  <g key={i}>
                    <rect
                      x={xPos}
                      y={180 - barHeight}
                      width="34"
                      height={barHeight}
                      rx="6"
                      fill="url(#barOrangeGrad)"
                    />
                    <circle cx={xPos + 17} cy={170 - barHeight} r="4" fill="#FF6B00" />
                  </g>
                );
              })}

              {/* Trend Line Overlay */}
              <path
                d="M 77 130 Q 150 110 227 80 T 377 55 T 452 35"
                fill="none"
                stroke="#FF6B00"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>

            <div className="reports-x-dates">
              {reportData.map((d, i) => (
                <span key={i}>{d.date}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Top Performers Leaderboard */}
        <div className="top-riders-box">
          <div className="section-title-with-icon" style={{ margin: 0, paddingBottom: 10 }}>
            <Award size={20} color="#FF6B00" />
            <h2 className="section-heading">Top Performing Riders</h2>
          </div>

          <div className="top-riders-list">
            <div className="top-rider-item">
              <div className="rider-rank-info">
                <span className="rank-num">#1</span>
                <span className="rider-name-val">Srinivasulu</span>
              </div>
              <div className="rider-stats-right">
                <span className="rider-orders-count">142 orders</span>
                <span className="rider-earnings-val">₹14,200</span>
              </div>
            </div>

            <div className="top-rider-item">
              <div className="rider-rank-info">
                <span className="rank-num">#2</span>
                <span className="rider-name-val">Gorkal sreenu</span>
              </div>
              <div className="rider-stats-right">
                <span className="rider-orders-count">118 orders</span>
                <span className="rider-earnings-val">₹11,870</span>
              </div>
            </div>

            <div className="top-rider-item">
              <div className="rider-rank-info">
                <span className="rank-num">#3</span>
                <span className="rider-name-val">Ravi Teja</span>
              </div>
              <div className="rider-stats-right">
                <span className="rider-orders-count">96 orders</span>
                <span className="rider-earnings-val">₹9,450</span>
              </div>
            </div>

            <div className="top-rider-item">
              <div className="rider-rank-info">
                <span className="rank-num">#4</span>
                <span className="rider-name-val">Kiran Kumar</span>
              </div>
              <div className="rider-stats-right">
                <span className="rider-orders-count">84 orders</span>
                <span className="rider-earnings-val">₹8,120</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
