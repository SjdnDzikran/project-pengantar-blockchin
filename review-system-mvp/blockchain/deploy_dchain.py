#!/usr/bin/env python3
"""
Deploy CompanyReviewLedger smart contract to DChain
"""
import json
import os
import time
from web3 import Web3
from solcx import compile_source, install_solc

# ========================================
# DChain Configuration
# ========================================
RPC_URL = os.getenv('DCHAIN_RPC_URL', 'https://mainnet.dchain.id/')
CHAIN_ID = int(os.getenv('DCHAIN_CHAIN_ID', '17845'))
DEPLOYER_ADDRESS = os.getenv('DEPLOYER_ADDRESS', '0x3B859543019Ac4F898994E82848ffbc9E1b7c689')

# Gas configuration
GAS_LIMIT = int(os.getenv('GAS_LIMIT', '3000000'))  # DChain may need different gas limit
GAS_PRICE = None  # Let Web3 estimate, or set manually: int(os.getenv('GAS_PRICE', '1000000000'))

print("=" * 50)
print("DChain Smart Contract Deployment")
print("=" * 50)
print(f"RPC URL: {RPC_URL}")
print(f"Chain ID: {CHAIN_ID}")
print(f"Deployer: {DEPLOYER_ADDRESS}")
print("=" * 50)

def compile_contract():
    """Compile the Solidity contract"""
    print("\n[1/4] Installing solc compiler...")
    install_solc('0.8.19')  # Use 0.8.19 instead of 0.8.20 for DChain compatibility
    
    print("[2/4] Reading contract source...")
    with open('contracts/CompanyReviewLedger.sol', 'r') as f:
        contract_source = f.read()
    
    print("[3/4] Compiling contract...")
    compiled_sol = compile_source(
        contract_source,
        output_values=['abi', 'bin'],
        solc_version='0.8.19'
    )
    
    contract_id, contract_interface = compiled_sol.popitem()
    
    # Save ABI and bytecode
    os.makedirs('build', exist_ok=True)
    with open('build/CompanyReviewLedger.abi', 'w') as f:
        json.dump(contract_interface['abi'], f, indent=2)
    
    with open('build/CompanyReviewLedger.bin', 'w') as f:
        f.write(contract_interface['bin'])
    
    print("✓ Contract compiled successfully")
    print(f"  ABI: build/CompanyReviewLedger.abi")
    print(f"  Bytecode: build/CompanyReviewLedger.bin")
    
    return contract_interface

def get_private_key():
    """Get private key from environment or prompt"""
    private_key = os.getenv('DEPLOYER_PRIVATE_KEY')
    
    if not private_key:
        print("\n⚠️  DEPLOYER_PRIVATE_KEY not found in environment")
        print("Please enter your private key (without 0x prefix):")
        private_key = input("> ").strip()
        
        if private_key.startswith('0x'):
            private_key = private_key[2:]
    
    return private_key

def deploy_contract(w3, contract_interface, private_key):
    """Deploy the compiled contract to DChain"""
    print(f"\n[4/4] Deploying to DChain...")
    print(f"Deployer address: {DEPLOYER_ADDRESS}")
    
    # Check balance
    balance = w3.eth.get_balance(DEPLOYER_ADDRESS)
    balance_eth = w3.from_wei(balance, 'ether')
    print(f"Account balance: {balance_eth} tokens")
    
    if balance == 0:
        print("❌ ERROR: Account has no balance!")
        print("Please fund your account with DChain tokens before deploying.")
        return None
    
    # Create contract instance
    Contract = w3.eth.contract(
        abi=contract_interface['abi'],
        bytecode=contract_interface['bin']
    )
    
    # Get nonce
    nonce = w3.eth.get_transaction_count(DEPLOYER_ADDRESS)
    print(f"Transaction nonce: {nonce}")
    
    # Build transaction
    print("Building deployment transaction...")
    constructor_txn = Contract.constructor().build_transaction({
        'from': DEPLOYER_ADDRESS,
        'nonce': nonce,
        'gas': GAS_LIMIT,
        'gasPrice': GAS_PRICE if GAS_PRICE else w3.eth.gas_price,
        'chainId': CHAIN_ID
    })
    
    # Estimate gas cost
    estimated_gas = w3.eth.estimate_gas(constructor_txn)
    gas_price = constructor_txn['gasPrice']
    estimated_cost = w3.from_wei(estimated_gas * gas_price, 'ether')
    print(f"Estimated gas: {estimated_gas}")
    print(f"Estimated cost: {estimated_cost} tokens")
    
    # Confirm deployment
    print("\n⚠️  Ready to deploy!")
    confirm = input("Deploy contract to DChain? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("Deployment cancelled.")
        return None
    
    # Sign transaction
    print("\nSigning transaction...")
    signed_txn = w3.eth.account.sign_transaction(constructor_txn, private_key=private_key)
    
    # Send transaction
    print("Sending transaction to DChain...")
    tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
    print(f"Transaction hash: {tx_hash.hex()}")
    
    # Wait for confirmation
    print("\nWaiting for confirmation (this may take a while on public network)...")
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
    
    contract_address = tx_receipt['contractAddress']
    block_number = tx_receipt['blockNumber']
    gas_used = tx_receipt['gasUsed']
    actual_cost = w3.from_wei(gas_used * gas_price, 'ether')
    
    print("\n" + "=" * 50)
    print("✅ CONTRACT DEPLOYED SUCCESSFULLY!")
    print("=" * 50)
    print(f"Contract Address: {contract_address}")
    print(f"Block Number: {block_number}")
    print(f"Gas Used: {gas_used}")
    print(f"Actual Cost: {actual_cost} tokens")
    print(f"Transaction: {tx_hash.hex()}")
    print("=" * 50)
    
    # Save deployment info
    deployment_info = {
        'contract_address': contract_address,
        'deployer_address': DEPLOYER_ADDRESS,
        'transaction_hash': tx_hash.hex(),
        'block_number': block_number,
        'gas_used': gas_used,
        'chain_id': CHAIN_ID,
        'rpc_url': RPC_URL,
        'deployed_at': time.strftime('%Y-%m-%d %H:%M:%S')
    }
    
    with open('build/deployment.dchain.json', 'w') as f:
        json.dump(deployment_info, f, indent=2)
    
    print(f"\nDeployment info saved to: build/deployment.dchain.json")
    
    print("\n📝 NEXT STEPS:")
    print("1. Add this to backend/.env:")
    print(f"   CONTRACT_ADDRESS={contract_address}")
    print("2. Restart the backend server")
    print("3. Configure MetaMask with DChain network")
    print(f"4. Verify contract on DChain explorer (if available)")
    
    return contract_address

def main():
    # Connect to DChain
    print("\nConnecting to DChain...")
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    
    if not w3.is_connected():
        print("❌ ERROR: Could not connect to DChain!")
        print(f"RPC URL: {RPC_URL}")
        print("\nTroubleshooting:")
        print("1. Check if RPC URL is correct")
        print("2. Verify network is accessible")
        print("3. Check if API key is required")
        return
    
    print(f"✓ Connected to DChain (Chain ID: {w3.eth.chain_id})")
    
    if w3.eth.chain_id != CHAIN_ID:
        print(f"⚠️  WARNING: Connected chain ID ({w3.eth.chain_id}) doesn't match configured ({CHAIN_ID})")
        confirm = input("Continue anyway? (yes/no): ").strip().lower()
        if confirm != 'yes':
            return
    
    # Compile contract
    contract_interface = compile_contract()
    
    # Get private key
    private_key = get_private_key()
    
    # Deploy contract
    deploy_contract(w3, contract_interface, private_key)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nDeployment cancelled by user.")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
