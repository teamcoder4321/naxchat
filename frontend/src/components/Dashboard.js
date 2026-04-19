import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export const Dashboard = () => {
  const { user, getBalance, getCreditHistory, logout } = useAuth();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const bal = await getBalance();
      const hist = await getCreditHistory();
      setBalance(bal);
      setHistory(hist?.transactions || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  if (loading) {
    return <div className="dashboard">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-scroll">
        {/* Profile Section */}
        <div className="profile-section">
          <div className="profile-header">
            <div className="avatar-large">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h2>{user?.displayName || user?.username}</h2>
              <p>@{user?.username}</p>
              <p className="member-since">Member since {new Date(user?.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="credits-display">
              <div className="credits-value">{balance || user?.credits || 0}</div>
              <div className="credits-label">Credits</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{user?.stats?.totalChats || 0}</div>
            <div className="stat-label">Chats this month</div>
            <div className="stat-trend up">↑ {user?.stats?.totalChats || 0} vs last month</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#f59e0b' }}>
              {user?.stats?.currentStreak || 0}x
            </div>
            <div className="stat-label">Daily streak</div>
            <div className="stat-trend up">↑ Personal best!</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{user?.rating?.average?.toFixed(1) || 5.0}★</div>
            <div className="stat-label">Rating received</div>
            <div className="stat-trend" style={{ color: '#666' }}>
              From {user?.rating?.count || 0} sessions
            </div>
          </div>
        </div>

        {/* Credit History Section */}
        <div className="history-section">
          <h3>Credit History</h3>
          <div className="history-list">
            {history.length === 0 ? (
              <div className="empty-history">No transactions yet</div>
            ) : (
              history.map((transaction) => (
                <div key={transaction._id} className="history-item">
                  <div className="transaction-icon">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="transaction-info">
                    <div className="transaction-title">
                      {getTransactionTitle(transaction.type)}
                    </div>
                    <div className="transaction-date">
                      {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
                      {new Date(transaction.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className={`transaction-amount ${transaction.amount > 0 ? 'gain' : 'loss'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Settings Section */}
        <div className="settings-section">
          <h3>Account Settings</h3>
          <div className="settings-group">
            <label>Email</label>
            <div className="setting-value">{user?.email}</div>
          </div>
          <div className="settings-group">
            <label>Account Status</label>
            <div className="setting-value status-active">{user?.accountStatus || 'Active'}</div>
          </div>
          <div className="settings-group">
            <label>Language</label>
            <div className="setting-value">{user?.preferences?.language || 'English'}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

function getTransactionIcon(type) {
  const icons = {
    spin: '🎡',
    gift: '🎁',
    purchase: '🛒',
    referral: '👥',
    admin_grant: '⭐',
    filter_unlock: '🔓',
    daily_bonus: '🎉',
  };
  return icons[type] || '💳';
}

function getTransactionTitle(type) {
  const titles = {
    spin: 'Daily Wheel Spin',
    gift: 'Gift received',
    purchase: 'Feature purchased',
    referral: 'Referral bonus',
    admin_grant: 'Admin grant',
    filter_unlock: 'Filter unlocked',
    daily_bonus: 'Daily bonus',
  };
  return titles[type] || 'Credit transaction';
}
