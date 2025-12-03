#!/bin/bash

# Master Startup Script
# This script starts all components of the review system

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
GETH="$HOME/UGM/pengantar-blockchain/myblockchain/geth-linux-amd64-1.13.15-c5ba367e/geth"

echo ""
echo "=========================================="
echo "  Company Review System - MVP Launcher"
echo "=========================================="
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Check prerequisites
echo "[Prerequisites Check]"
echo ""

MISSING_DEPS=0

if ! command_exists "$GETH"; then
    if [ ! -f "$GETH" ]; then
        echo "✗ Geth not found at $GETH"
        MISSING_DEPS=1
    else
        echo "✓ Geth installed (custom path)"
    fi
else
    echo "✓ Geth installed"
fi

if ! command_exists node; then
    echo "✗ Node.js not found"
    MISSING_DEPS=1
else
    echo "✓ Node.js installed ($(node --version))"
fi

if ! command_exists npm; then
    echo "✗ npm not found"
    MISSING_DEPS=1
else
    echo "✓ npm installed ($(npm --version))"
fi

# Check if using remote PostgreSQL (skip local psql requirement)
ENV_FILE="$PROJECT_ROOT/backend/.env"
if [ -f "$ENV_FILE" ]; then
    DB_HOST=$(grep -E '^DB_HOST=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"')
    if [[ "$DB_HOST" == postgresql://* ]] || [[ "$DB_HOST" == postgres://* ]]; then
        echo "✓ Using remote PostgreSQL (local psql not required)"
    elif ! command_exists psql; then
        echo "✗ PostgreSQL not found"
        MISSING_DEPS=1
    else
        echo "✓ PostgreSQL installed"
    fi
else
    if ! command_exists psql; then
        echo "⚠ PostgreSQL not found (may be using remote DB)"
    else
        echo "✓ PostgreSQL installed"
    fi
fi

if ! command_exists python3; then
    echo "✗ Python3 not found"
    MISSING_DEPS=1
else
    echo "✓ Python3 installed ($(python3 --version))"
fi

if [ $MISSING_DEPS -eq 1 ]; then
    echo ""
    echo "✗ Missing dependencies. Please install them first."
    exit 1
fi

echo ""
echo "=========================================="
echo "[Component Startup]"
echo "=========================================="

# Step 1: Start Blockchain
echo ""
echo "[1/4] Starting Blockchain Node..."
echo ""

if port_in_use 8545; then
    echo "✓ Blockchain node already running on port 8545"
else
    echo "Starting Geth in background..."
    cd "$SCRIPT_DIR"
    nohup ./start-blockchain.sh > "$PROJECT_ROOT/logs/blockchain.log" 2>&1 &
    BLOCKCHAIN_PID=$!

    echo "Waiting for blockchain to start..."
    sleep 10

    if port_in_use 8545; then
        echo "✓ Blockchain node started (PID: $BLOCKCHAIN_PID)"
        echo "  RPC: http://localhost:8545"
        echo "  Logs: $PROJECT_ROOT/logs/blockchain.log"
    else
        echo "✗ Failed to start blockchain node"
        echo "  Check logs: $PROJECT_ROOT/logs/blockchain.log"
        exit 1
    fi
fi

# Step 2: Start Backend API
echo ""
echo "[2/4] Starting Backend API..."
echo ""

cd "$PROJECT_ROOT/backend"

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "⚠ Please update .env with your contract address after deployment"
fi

if port_in_use 3001; then
    echo "✓ Backend already running on port 3001"
else
    echo "Starting backend in background..."
    mkdir -p "$PROJECT_ROOT/logs"
    nohup npm start > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    BACKEND_PID=$!

    echo "Waiting for backend to start..."
    sleep 5

    if port_in_use 3001; then
        echo "✓ Backend started (PID: $BACKEND_PID)"
        echo "  API: http://localhost:3001"
        echo "  Logs: $PROJECT_ROOT/logs/backend.log"
    else
        echo "✗ Failed to start backend"
        echo "  Check logs: $PROJECT_ROOT/logs/backend.log"
    fi
fi

# Step 3: Start Frontend
echo ""
echo "[3/4] Starting Frontend..."
echo ""

cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

if port_in_use 3000; then
    echo "✓ Frontend already running on port 3000"
else
    echo "Starting frontend in background..."
    mkdir -p "$PROJECT_ROOT/logs"
    nohup npm start > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
    FRONTEND_PID=$!

    echo "Waiting for frontend to start..."
    sleep 10

    if port_in_use 3000; then
        echo "✓ Frontend started (PID: $FRONTEND_PID)"
        echo "  URL: http://localhost:3000"
        echo "  Logs: $PROJECT_ROOT/logs/frontend.log"
    else
        echo "✗ Failed to start frontend"
        echo "  Check logs: $PROJECT_ROOT/logs/frontend.log"
    fi
fi

# Step 4: Display Status
echo ""
echo "[4/4] System Status"
echo ""

echo "=========================================="
echo "  All Components Started!"
echo "=========================================="
echo ""
echo "Services:"
echo "  🔗 Blockchain RPC:  http://localhost:8545"
echo "  🖥️  Backend API:     http://localhost:3001"
echo "  🌐 Frontend App:    http://localhost:3000"
echo ""
echo "Logs:"
echo "  📝 Blockchain:      $PROJECT_ROOT/logs/blockchain.log"
echo "  📝 Backend:         $PROJECT_ROOT/logs/backend.log"
echo "  📝 Frontend:        $PROJECT_ROOT/logs/frontend.log"
echo ""
echo "Next Steps:"
echo "  1. Deploy smart contract:"
echo "     cd blockchain && python3 deploy.py"
echo ""
echo "  2. Update backend/.env with contract address"
echo ""
echo "  3. Restart backend:"
echo "     ./scripts/restart-backend.sh"
echo ""
echo "  4. Open browser: http://localhost:3000"
echo ""
echo "To stop all services:"
echo "  ./scripts/stop-all.sh"
echo ""
echo "=========================================="
echo ""
