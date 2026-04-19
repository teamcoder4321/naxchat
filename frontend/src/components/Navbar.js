import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/chat" className="navbar-logo">
          <span className="logo-text">NexChat</span>
        </Link>

        <div className="nav-links">
          <Link
            to="/chat"
            className={`nav-link ${isActive('/chat') ? 'active' : ''}`}
          >
            Chat
          </Link>
          <Link
            to="/dashboard"
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            to="/wheel"
            className={`nav-link ${isActive('/wheel') ? 'active' : ''}`}
          >
            Daily Wheel
          </Link>
        </div>

        <div className="navbar-right">
          <div className="credits-pill">
            <span className="coin-icon">C</span>
            <span className="credits-amount">{user?.credits || 0}</span>
          </div>
          <div className="user-menu">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => navigate('/dashboard')}>
                👤 Profile
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                🚪 Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
