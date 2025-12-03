#!/bin/bash

# Blockchain Initialization Script
# This script initializes the Geth private blockchain for the review system

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BLOCKCHAIN_DIR="$PROJECT_ROOT/blockchain"
DATA_DIR="$BLOCKCHAIN_DIR/data"
OLD_KEYSTORE_DIR="$(dirname "$PROJECT_ROOT")/data/keystore"
GETH="$HOME/UGM/pengantar-blockchain/myblockchain/geth-linux-amd64-1.13.15-c5ba367e/geth"

echo "=========================================="
echo "Blockchain Initialization"
echo "=========================================="

# Step 1: Copy keystores from old implementation
echo ""
echo "[1/5] Copying keystores from existing implementation..."

if [ -d "$OLD_KEYSTORE_DIR" ]; then
    mkdir -p "$DATA_DIR/keystore"
    cp -r "$OLD_KEYSTORE_DIR"/* "$DATA_DIR/keystore/"
    echo "✓ Keystores copied successfully"
    echo "  Found $(ls -1 "$DATA_DIR/keystore" | wc -l) keystore files"
else
    echo "✗ Old keystore directory not found at: $OLD_KEYSTORE_DIR"
    echo "  Please ensure the old implementation exists"
    exit 1
fi

# Step 2: Remove old blockchain data if exists
echo ""
echo "[2/5] Cleaning up old blockchain data..."

if [ -d "$DATA_DIR/geth" ]; then
    echo "  Removing old blockchain data..."
    rm -rf "$DATA_DIR/geth"
    echo "✓ Old blockchain data removed"
else
    echo "✓ No old blockchain data found"
fi

# Step 3: Initialize genesis block
echo ""
echo "[3/5] Initializing genesis block..."

cd "$BLOCKCHAIN_DIR"

if [ ! -f "genesis.json" ]; then
    echo "✗ Genesis file not found!"
    exit 1
fi

"$GETH" --datadir "$DATA_DIR" init genesis.json

if [ $? -eq 0 ]; then
    echo "✓ Genesis block initialized successfully"
else
    echo "✗ Failed to initialize genesis block"
    exit 1
fi

# Step 4: Create password file for unlocking accounts
echo ""
echo "[4/5] Creating password file..."

echo "admin123" > "$DATA_DIR/password.txt"
echo "✓ Password file created"

# Step 5: Display account information
echo ""
echo "[5/5] Account Information:"
echo ""
echo "Available accounts:"
"$GETH" account list --datadir "$DATA_DIR"

echo ""
echo "=========================================="
echo "Blockchain Initialization Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Run: ./scripts/start-blockchain.sh"
echo "  2. Deploy contract: cd blockchain && python3 deploy.py"
echo "  3. Update backend .env with contract address"
echo ""
