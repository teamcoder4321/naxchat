#!/bin/bash

# NexChat - Full Stack Setup Guide
# This script sets up the complete NexChat application locally

echo "=========================================="
echo "NexChat - Complete Stack Setup"
echo "=========================================="
echo ""

# Prerequisites
echo "✓ Prerequisites Required:"
echo "  - Node.js 16+ and npm"
echo "  - MongoDB (local or Atlas)"
echo "  - Redis"
echo "  - Git"
echo ""

# Backend Setup
echo "Step 1: Setting up Backend..."
echo ""

cd backend

echo "Installing backend dependencies..."
npm install

echo ""
echo "✓ Backend setup complete!"
echo ""
echo "Next: Configure .env file with:"
echo "  - MONGODB_URI"
echo "  - JWT_SECRET"
echo "  - FRONTEND_URL"
echo ""
echo "Start backend with: npm run dev"
echo ""

cd ..

# Frontend Setup
echo "Step 2: Setting up Frontend..."
echo ""

cd frontend

echo "Installing frontend dependencies..."
npm install

echo ""
echo "✓ Frontend setup complete!"
echo ""
echo "Create .env file with:"
echo "  REACT_APP_API_URL=http://localhost:5000/api"
echo "  REACT_APP_SOCKET_URL=http://localhost:5000"
echo ""
echo "Start frontend with: npm start"
echo ""

cd ..

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Quick Start:"
echo ""
echo "Terminal 1 (Backend):"
echo "  $ cd backend"
echo "  $ npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  $ cd frontend"
echo "  $ npm start"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "=========================================="
