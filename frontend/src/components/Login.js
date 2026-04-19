import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let success = false;
    if (isSignup) {
      success = await signup(username, email, password);
    } else {
      success = await login(email, password);
    }

    setLoading(false);

    if (success) {
      navigate('/chat');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>NexChat</h1>
          <p>Random video & text chat with a twist</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`tab ${!isSignup ? 'active' : ''}`}
            onClick={() => setIsSignup(false)}
          >
            Sign In
          </button>
          <button
            className={`tab ${isSignup ? 'active' : ''}`}
            onClick={() => setIsSignup(true)}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignup && (
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength="3"
                maxLength="30"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Loading...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="oauth-section">
          <div className="divider">or</div>
          <div className="oauth-buttons">
            <button className="oauth-btn">🌐 Google</button>
            <button className="oauth-btn">🍎 Apple</button>
          </div>
        </div>

        <p className="auth-footer">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          {' '}
          <button
            type="button"
            className="toggle-link"
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
};
