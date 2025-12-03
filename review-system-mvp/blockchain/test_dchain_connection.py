#!/usr/bin/env python3
"""
Test connection to DChain network
"""
import os
import sys
from web3 import Web3

# Get configuration
RPC_URL = os.getenv('DCHAIN_RPC_URL', 'https://mainnet.dchain.id/')
CHAIN_ID = os.getenv('DCHAIN_CHAIN_ID', '17845')
TEST_ADDRESS = os.getenv('DEPLOYER_ADDRESS', '0x3B859543019Ac4F898994E82848ffbc9E1b7c689')

print("=" * 60)
print("DChain Connection Test")
print("=" * 60)
print(f"RPC URL: {RPC_URL}")
print(f"Expected Chain ID: {CHAIN_ID}")
print(f"Test Address: {TEST_ADDRESS}")
print("=" * 60)

try:
    # Connect to DChain
    print("\n[1/5] Connecting to DChain...")
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    
    if not w3.is_connected():
        print("❌ FAILED: Could not connect to DChain")
        print("\nPossible issues:")
        print("  • RPC URL is incorrect")
        print("  • Network is down or unreachable")
        print("  • Firewall blocking connection")
        print("  • API key required but not provided")
        sys.exit(1)
    
    print("✅ SUCCESS: Connected to DChain")
    
    # Check chain ID
    print("\n[2/5] Checking chain ID...")
    actual_chain_id = w3.eth.chain_id
    print(f"Actual Chain ID: {actual_chain_id}")
    
    if str(actual_chain_id) == str(CHAIN_ID):
        print("✅ SUCCESS: Chain ID matches")
    else:
        print(f"⚠️  WARNING: Chain ID mismatch!")
        print(f"  Expected: {CHAIN_ID}")
        print(f"  Actual: {actual_chain_id}")
    
    # Get latest block
    print("\n[3/5] Fetching latest block...")
    latest_block = w3.eth.block_number
    print(f"Latest Block: {latest_block}")
    print("✅ SUCCESS: Can read blockchain data")
    
    # Check gas price
    print("\n[4/5] Checking gas price...")
    gas_price = w3.eth.gas_price
    gas_price_gwei = w3.from_wei(gas_price, 'gwei')
    print(f"Current Gas Price: {gas_price_gwei} Gwei")
    print("✅ SUCCESS: Gas price available")
    
    # Check account balance (if address provided)
    print("\n[5/5] Checking account balance...")
    if TEST_ADDRESS and TEST_ADDRESS != '0x0000000000000000000000000000000000000000':
        balance = w3.eth.get_balance(TEST_ADDRESS)
        balance_eth = w3.from_wei(balance, 'ether')
        print(f"Balance: {balance_eth} tokens")
        
        if balance > 0:
            print("✅ SUCCESS: Account has balance")
        else:
            print("⚠️  WARNING: Account has zero balance")
            print("  You'll need tokens to deploy contracts and submit transactions")
    else:
        print("⚠️  SKIPPED: No test address provided")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 CONNECTION SUMMARY")
    print("=" * 60)
    print(f"Status: Connected ✅")
    print(f"Network: DChain (Chain ID: {actual_chain_id})")
    print(f"Latest Block: {latest_block}")
    print(f"Gas Price: {gas_price_gwei} Gwei")
    if TEST_ADDRESS and TEST_ADDRESS != '0x0000000000000000000000000000000000000000':
        print(f"Account Balance: {balance_eth} tokens")
    print("=" * 60)
    
    print("\n✅ DChain connection test PASSED!")
    print("\nYou can now:")
    print("  1. Deploy contracts with: python3 deploy_dchain.py")
    print("  2. Update backend/.env with DChain configuration")
    print("  3. Configure MetaMask with DChain network")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("🔧 TROUBLESHOOTING")
    print("=" * 60)
    print("1. Verify RPC URL is correct")
    print("2. Check network connectivity:")
    print(f"   curl -X POST {RPC_URL} \\")
    print('     -H "Content-Type: application/json" \\')
    print('     -d \'{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}\'')
    print("3. Ensure any required API keys are set")
    print("4. Check DChain documentation for connection details")
    
    sys.exit(1)
