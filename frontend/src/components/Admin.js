import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Admin.css';

export const AdminPanel = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/moderation/reports`, {
        params: { status: statusFilter },
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(response.data.reports);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // This endpoint would need to be implemented in the backend
      // For now, we'll show a placeholder
      setUsers([]);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      await axios.put(
        `${API_URL}/moderation/report/${reportId}/status`,
        {
          status: action,
          resolution: `Action taken: ${action}`,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status: action } : r))
      );
      setSelectedReport(null);
    } catch (error) {
      alert('Failed to update report: ' + error.message);
    }
  };

  const handleBanUser = async (userId) => {
    if (window.confirm('Are you sure you want to ban this user?')) {
      try {
        await axios.post(
          `${API_URL}/moderation/ban/${userId}`,
          { reason: 'Violates community guidelines' },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        alert('User has been banned');
        fetchReports();
      } catch (error) {
        alert('Failed to ban user: ' + error.message);
      }
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="admin-access-denied">Access Denied - Admin Only</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Moderation Dashboard</h1>
        <p>Manage reports, users, and platform safety</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📋 Reports
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={`admin-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📝 Logs
        </button>
      </div>

      {activeTab === 'reports' && (
        <div className="admin-section">
          <div className="filter-bar">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="pending">Pending Review</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          {loading ? (
            <div className="loading">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="empty-state">No reports found</div>
          ) : (
            <div className="reports-grid">
              {reports.map((report) => (
                <div key={report._id} className="report-card">
                  <div className="report-header">
                    <div>
                      <div className="report-user">
                        {report.reportedUser?.username || 'Unknown'}
                      </div>
                      <div className="report-reason">{report.reason}</div>
                    </div>
                    <div className={`report-status ${report.status}`}>
                      {report.status}
                    </div>
                  </div>

                  {report.description && (
                    <div className="report-description">{report.description}</div>
                  )}

                  <div className="report-meta">
                    <small>Reported by: {report.reportedBy?.username || 'Unknown'}</small>
                    <small>Session ID: {report.sessionId.slice(0, 8)}...</small>
                  </div>

                  <div className="report-actions">
                    {report.status === 'pending' && (
                      <>
                        <button
                          className="action-btn review"
                          onClick={() => {
                            handleReportAction(report._id, 'under_review');
                          }}
                        >
                          Review
                        </button>
                        <button
                          className="action-btn dismiss"
                          onClick={() => {
                            handleReportAction(report._id, 'dismissed');
                          }}
                        >
                          Dismiss
                        </button>
                      </>
                    )}

                    {report.status === 'under_review' && (
                      <>
                        <button
                          className="action-btn ban"
                          onClick={() => {
                            handleBanUser(report.reportedUser?._id);
                          }}
                        >
                          Ban User
                        </button>
                        <button
                          className="action-btn resolve"
                          onClick={() => {
                            handleReportAction(report._id, 'resolved');
                          }}
                        >
                          Resolve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-section">
          <div className="empty-state">User management coming soon</div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="admin-section">
          <div className="empty-state">Activity logs coming soon</div>
        </div>
      )}
    </div>
  );
};
