import React, { createContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Configure axios with token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      fetchUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data.user);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUser(null);
      setToken(null);
    }
  }, [API_URL]);

  const signup = useCallback(
    async (username, email, password) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post(`${API_URL}/auth/signup`, {
          username,
          email,
          password,
        });
        setToken(response.data.token);
        setUser(response.data.user);
        return true;
      } catch (err) {
        setError(err.response?.data?.message || 'Signup failed');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [API_URL]
  );

  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email,
          password,
        });
        setToken(response.data.token);
        setUser(response.data.user);
        return true;
      } catch (err) {
        setError(err.response?.data?.message || 'Login failed');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [API_URL]
  );

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
      setToken(null);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [API_URL]);

  const updateProfile = useCallback(
    async (displayName, preferences) => {
      try {
        const response = await axios.put(`${API_URL}/auth/update-profile`, {
          displayName,
          preferences,
        });
        setUser(response.data.user);
        return true;
      } catch (err) {
        setError(err.response?.data?.message || 'Profile update failed');
        return false;
      }
    },
    [API_URL]
  );

  const spinWheel = useCallback(async () => {
    try {
      const response = await axios.post(`${API_URL}/credits/spin-wheel`);
      setUser((prev) => ({
        ...prev,
        credits: response.data.newBalance,
      }));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Spin failed');
      throw err;
    }
  }, [API_URL]);

  const getBalance = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/credits/balance`);
      return response.data.credits;
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  }, [API_URL]);

  const getCreditHistory = useCallback(
    async (page = 1, limit = 20) => {
      try {
        const response = await axios.get(`${API_URL}/credits/history`, {
          params: { page, limit },
        });
        return response.data;
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    },
    [API_URL]
  );

  const value = {
    user,
    token,
    loading,
    error,
    signup,
    login,
    logout,
    updateProfile,
    spinWheel,
    getBalance,
    getCreditHistory,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
