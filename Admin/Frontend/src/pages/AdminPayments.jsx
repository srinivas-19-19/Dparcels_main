import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Search,
  Download,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import '../styles/dashboard.css';

export default function AdminPayments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');

  // Transactions dataset matching screenshot 7
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/admin/payments');
      const formatted = res.data.data.map(p => ({
        id: `#TX-${p.id.substring(0,6).toUpperCase()}`,
        orderId: `#${p.orderId.substring(0,6).toUpperCase()}`,
        customer: p.order?.customer?.user?.email?.split('@')[0] || 'Unknown',
        amount: `₹${p.amount.toFixed(2)}`,
        method: p.method === 'COD' ? 'Cash' : 'UPI',
        status: p.status === 'COMPLETED' ? 'Success' : p.status === 'PENDING' ? 'Pending' : 'Refunded',
        date: new Date(p.createdAt).toLocaleString()
      }));
      setTransactions(formatted);
    } catch (err) {
      console.error('Failed to fetch payments', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions by search & payment method pill
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.method.toLowerCase().includes(searchQuery.toLowerCase());

    if (methodFilter === 'All') return matchesSearch;
    return matchesSearch && t.method.toLowerCase() === methodFilter.toLowerCase();
  });

  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Order ID', 'Customer', 'Amount', 'Method', 'Status', 'Date'];
    const rows = filteredTransactions.map((t) => [t.id, t.orderId, t.customer, t.amount, t.method, t.status, t.date]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'DParcels_Payments_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="payments-view-container">
      {/* Top 3 Stat Summary Cards Row */}
      <div className="payments-summary-grid">
        <div className="payment-stat-card">
          <div className="stat-label">TOTAL COLLECTED</div>
          <div className="stat-amount">₹12,450.00</div>
          <div className="stat-change positive">
            <span>▲ +12.5%</span>
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="stat-label">PENDING AMOUNT</div>
          <div className="stat-amount">₹850.00</div>
        </div>

        <div className="payment-stat-card">
          <div className="stat-label">SUCCEEDED / REFUNDED</div>
          <div className="stat-amount">₹340.00</div>
        </div>
      </div>

      {/* Search Bar, Method Pills & Export CSV Bar */}
      <div className="payments-actions-bar">
        <div className="payments-search-wrapper">
          <Search size={16} color="#8A9285" />
          <input
            type="text"
            className="payments-search-input"
            placeholder="Search transaction..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="payments-method-pills">
          {['All', 'UPI', 'Card', 'Cash', 'Wallet'].map((method) => (
            <button
              key={method}
              className={`method-pill ${methodFilter === method ? 'active' : ''}`}
              onClick={() => setMethodFilter(method)}
            >
              {method}
            </button>
          ))}
        </div>

        <button className="add-rider-btn export-btn" onClick={handleExportCSV}>
          <span>Export CSV</span>
        </button>
      </div>

      {/* TRANSACTIONS TABLE CARD */}
      <div className="payments-table-card">
        <table className="payments-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ORDER ID</th>
              <th>CUSTOMER</th>
              <th>AMOUNT</th>
              <th>METHOD</th>
              <th>STATUS</th>
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx) => (
              <tr key={tx.id}>
                <td className="tx-id-cell">{tx.id}</td>
                <td className="order-id-cell">{tx.orderId}</td>
                <td className="customer-cell">{tx.customer}</td>
                <td className="amount-cell">{tx.amount}</td>
                <td className="method-cell">{tx.method}</td>
                <td>
                  <span className={`status-pill-tx ${tx.status.toLowerCase()}`}>
                    {tx.status}
                  </span>
                </td>
                <td className="date-cell">{tx.date}</td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#8A9285' }}>
                  No transaction records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
