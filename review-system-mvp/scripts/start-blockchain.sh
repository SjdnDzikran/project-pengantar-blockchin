#!/bin/bash

# Start Blockchain Node Script
# This script starts the Geth node with mining enabled

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BLOCKCHAIN_DIR="$PROJECT_ROOT/blockchain"
DATA_DIR="$BLOCKCHAIN_DIR/data"

echo "=========================================="
echo "Starting Blockchain Node"
echo "=========================================="

# Check if blockchain is initialized
if [ ! -d "$DATA_DIR/geth" ]; then
    echo "✗ Blockchain not initialized!"
    echo "  Please run: ./scripts/init-blockchain.sh"
    exit 1
fi

# Get validator address (last account in keystore)
VALIDATOR_ADDRESS=$(geth account list --datadir "$DATA_DIR" | grep "Account #2" | sed 's/.*{\(.*\)}.*/\1/')

if [ -z "$VALIDATOR_ADDRESS" ]; then
    echo "✗ Validator account not found!"
    exit 1
fi

echo ""
echo "Configuration:"
echo "  Data Directory: $DATA_DIR"
echo "  Network ID: 110261"
echo "  Chain ID: 110261"
echo "  RPC Port: 8545"
echo "  Validator: 0x$VALIDATOR_ADDRESS"
echo ""

# Check if geth is already running
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠ Port 8545 is already in use!"
    echo "  Blockchain node may already be running"
    read -p "Do you want to kill the existing process? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $(lsof -t -i:8545) 2>/dev/null || true
        sleep 2
    else
        exit 1
    fi
fi

echo "Starting Geth node..."
echo ""
echo "=========================================="
echo ""

# Start geth with all necessary flags
geth \
    --datadir "$DATA_DIR" \
    --networkid 110261 \
    --port 30303 \
    --http \
    --http.addr "0.0.0.0" \
    --http.port 8545 \
    --http.api "eth,net,web3,personal,miner,admin" \
    --http.corsdomain "*" \
    --allow-insecure-unlock \
    --unlock "0x$VALIDATOR_ADDRESS" \
    --password "$DATA_DIR/password.txt" \
    --mine \
    --miner.etherbase "0x$VALIDATOR_ADDRESS" \
    --nodiscover \
    --maxpeers 0 \
    --verbosity 3 \
    --gcmode archive
