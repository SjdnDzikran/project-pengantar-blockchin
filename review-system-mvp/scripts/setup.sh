#!/bin/bash

# Complete Setup Script
# This script performs the initial setup of the entire system

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo ""
echo "=========================================="
echo "  Company Review System - Complete Setup"
echo "=========================================="
echo ""
echo "This script will:"
echo "  1. Initialize blockchain (copy keystores, init genesis)"
echo "  2. Initialize database (create DB, run migrations)"
echo "  3. Install dependencies (backend & frontend)"
echo "  4. Prepare environment files"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

echo ""
echo "=========================================="
echo "[Step 1/5] Blockchain Setup"
echo "=========================================="
echo ""

cd "$SCRIPT_DIR"
chmod +x init-blockchain.sh
./init-blockchain.sh

echo ""
echo "=========================================="
echo "[Step 2/5] Database Setup"
echo "=========================================="
echo ""

chmod +x init-database.sh
./init-database.sh

echo ""
echo "=========================================="
echo "[Step 3/5] Backend Dependencies"
echo "=========================================="
echo ""

cd "$PROJECT_ROOT/backend"

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "Installing backend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✓ Backend dependencies installed"
else
    echo "✗ Failed to install backend dependencies"
    exit 1
fi

echo ""
echo "=========================================="
echo "[Step 4/5] Frontend Dependencies"
echo "=========================================="
echo ""

cd "$PROJECT_ROOT/frontend"

echo "Installing frontend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✓ Frontend dependencies installed"
else
    echo "✗ Failed to install frontend dependencies"
    exit 1
fi

echo ""
echo "=========================================="
echo "[Step 5/5] Python Dependencies"
echo "=========================================="
echo ""

echo "Installing Python packages..."

# Try with virtual environment first, fall back to --break-system-packages if needed
if pip3 install web3 py-solc-x --quiet 2>/dev/null; then
    echo "✓ Python dependencies installed"
elif pip3 install web3 py-solc-x --break-system-packages --quiet 2>/dev/null; then
    echo "✓ Python dependencies installed (system-wide)"
else
    echo "⚠ Could not install Python packages system-wide"
    echo ""
    echo "Creating virtual environment for Python dependencies..."
    
    VENV_DIR="$PROJECT_ROOT/blockchain/venv"
    
    if [ ! -d "$VENV_DIR" ]; then
        python3 -m venv "$VENV_DIR"
    fi
    
    source "$VENV_DIR/bin/activate"
    pip install --upgrade pip --quiet
    pip install web3 py-solc-x --quiet
    
    if [ $? -eq 0 ]; then
        echo "✓ Python dependencies installed in virtual environment"
        echo "  Location: $VENV_DIR"
        echo ""
        echo "  NOTE: Activate the venv before deploying contract:"
        echo "  source blockchain/venv/bin/activate"
        deactivate
    else
        echo "✗ Failed to install Python dependencies"
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "✓ Blockchain initialized"
echo "✓ Database created and migrated"
echo "✓ Backend dependencies installed"
echo "✓ Frontend dependencies installed"
echo "✓ Python dependencies installed"
echo ""
echo "Next steps:"
echo ""
echo "1. Start all services:"
echo "   cd $PROJECT_ROOT"
echo "   ./scripts/start-all.sh"
echo ""
echo "2. In a new terminal, deploy smart contract:"
echo "   cd $PROJECT_ROOT/blockchain"
echo "   python3 deploy.py"
echo ""
echo "3. Copy the contract address from deployment output"
echo ""
echo "4. Update backend/.env:"
echo "   CONTRACT_ADDRESS=<your_contract_address>"
echo ""
echo "5. Restart backend:"
echo "   ./scripts/stop-all.sh"
echo "   ./scripts/start-all.sh"
echo ""
echo "6. Open your browser:"
echo "   http://localhost:3000"
echo ""
echo "=========================================="
echo ""
