#!/bin/bash

# Wrapper script to deploy contract with proper Python environment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"

echo "=========================================="
echo "  Smart Contract Deployment"
echo "=========================================="
echo ""

# Check if virtual environment exists
if [ -d "$VENV_DIR" ]; then
    echo "Activating virtual environment..."
    source "$VENV_DIR/bin/activate"
    python3 deploy.py
    deactivate
else
    echo "No virtual environment found, using system Python..."
    python3 deploy.py
fi
