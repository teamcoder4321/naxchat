// import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute, PublicRoute } from './utils/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { Chat } from './components/Chat';
import { Dashboard } from './components/Dashboard';
import { Wheel } from './components/Wheel';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wheel"
                  element={
                    <ProtectedRoute>
                      <Wheel />
                    </ProtectedRoute>
                  }
                />

                {/* Redirect root to chat or login */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
