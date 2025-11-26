#!/bin/bash

# Stop All Services Script
# This script stops all running components

echo ""
echo "=========================================="
echo "  Stopping All Services"
echo "=========================================="
echo ""

# Stop processes on specific ports
echo "Stopping services..."
echo ""

# Stop frontend (port 3000)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Stopping frontend (port 3000)..."
    kill $(lsof -t -i:3000) 2>/dev/null || true
    echo "✓ Frontend stopped"
else
    echo "✓ Frontend not running"
fi

# Stop backend (port 3001)
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Stopping backend (port 3001)..."
    kill $(lsof -t -i:3001) 2>/dev/null || true
    echo "✓ Backend stopped"
else
    echo "✓ Backend not running"
fi

# Stop blockchain (port 8545)
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Stopping blockchain (port 8545)..."
    kill $(lsof -t -i:8545) 2>/dev/null || true
    echo "✓ Blockchain stopped"
else
    echo "✓ Blockchain not running"
fi

# Also stop geth by name
if pgrep -x "geth" > /dev/null; then
    echo "Stopping geth processes..."
    pkill -x geth 2>/dev/null || true
    echo "✓ Geth stopped"
fi

echo ""
echo "=========================================="
echo "  All Services Stopped"
echo "=========================================="
echo ""
