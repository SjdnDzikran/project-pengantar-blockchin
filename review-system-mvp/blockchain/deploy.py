#!/usr/bin/env python3
"""
Deploy CompanyReviewLedger smart contract to the blockchain
"""
import json
import time
from getpass import getpass
from web3 import Web3
from solcx import compile_source, install_solc

# Configuration
RPC_URL = 'http://127.0.0.1:8545'
DEPLOYER_ADDRESS = '0x16F633126d81A620F48fF64CE55de718f26900aF'
KEY_UTC_FILE = 'data/keystore/UTC--2025-12-03T01-38-28.194286920Z--16f633126d81a620f48ff64ce55de718f26900af'
CHAIN_ID = 110261
GAS_LIMIT = 182417

def compile_contract():
    """Compile the Solidity contract"""
    print("Installing solc compiler...")
    install_solc('0.8.20')
    
    print("Reading contract source...")
    with open('contracts/CompanyReviewLedger.sol', 'r') as f:
        contract_source = f.read()
    
    print("Compiling contract...")
    compiled_sol = compile_source(
        contract_source,
        output_values=['abi', 'bin'],
        solc_version='0.8.20'
    )
    
    contract_id, contract_interface = compiled_sol.popitem()
    
    # Save ABI and bytecode
    with open('build/CompanyReviewLedger.abi', 'w') as f:
        json.dump(contract_interface['abi'], f, indent=2)
    
    with open('build/CompanyReviewLedger.bin', 'w') as f:
        f.write(contract_interface['bin'])
    
    print(f"✓ Contract compiled successfully")
    print(f"  ABI saved to: build/CompanyReviewLedger.abi")
    print(f"  Bytecode saved to: build/CompanyReviewLedger.bin")
    
    return contract_interface

def deploy_contract(w3, contract_interface, private_key):
    """Deploy the compiled contract using private key"""
    print(f"\nDeploying from account: {DEPLOYER_ADDRESS}")
    
    # Create contract instance
    Contract = w3.eth.contract(
        abi=contract_interface['abi'],
        bytecode=contract_interface['bin']
    )
    
    # Get nonce
    nonce = w3.eth.get_transaction_count(DEPLOYER_ADDRESS)
    print(f"Account nonce: {nonce}")
    
    # Build deployment transaction
    print("Building deployment transaction...")
    transaction = Contract.constructor().build_transaction({
        'chainId': CHAIN_ID,
        'from': DEPLOYER_ADDRESS,
        'nonce': nonce,
        'gas': GAS_LIMIT,
        'gasPrice': w3.eth.gas_price
    })
    
    # Sign transaction
    print("Signing transaction...")
    signed_txn = w3.eth.account.sign_transaction(transaction, private_key=private_key)
    
    # Send transaction
    print("Sending transaction...")
    tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
    print(f"✓ Transaction sent: {tx_hash.hex()}")
    
    # Wait for transaction receipt
    print("Waiting for transaction to be mined...")
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    contract_address = tx_receipt.contractAddress
    
    print(f"\n✓ Contract deployed successfully!")
    print(f"  Contract address: {contract_address}")
    print(f"  Block number: {tx_receipt.blockNumber}")
    print(f"  Gas used: {tx_receipt.gasUsed}")
    
    # Save deployment info
    deployment_info = {
        'address': contract_address,
        'deployer': DEPLOYER_ADDRESS,
        'block_number': tx_receipt.blockNumber,
        'transaction_hash': tx_hash.hex(),
        'gas_used': tx_receipt.gasUsed,
        'timestamp': int(time.time())
    }
    
    with open('build/deployment.json', 'w') as f:
        json.dump(deployment_info, f, indent=2)
    
    print(f"\n✓ Deployment info saved to: build/deployment.json")
    
    return contract_address

def main():
    print("=" * 60)
    print("CompanyReviewLedger Smart Contract Deployment")
    print("=" * 60)
    
    # Connect to blockchain
    print(f"\nConnecting to blockchain at {RPC_URL}...")
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    
    if not w3.is_connected():
        print("✗ Failed to connect to blockchain")
        return
    
    print(f"✓ Connected to blockchain")
    print(f"  Chain ID: {w3.eth.chain_id}")
    print(f"  Block number: {w3.eth.block_number}")
    print(f"  Deployer balance: {w3.eth.get_balance(DEPLOYER_ADDRESS) / 10**18} ETH")
    
    # Decrypt keystore file
    print(f"\nLoading keystore: {KEY_UTC_FILE}")
    with open(KEY_UTC_FILE) as keyfile:
        key_data = keyfile.read()
    
    pwd = getpass("Enter account password: ")
    
    try:
        private_key = w3.eth.account.decrypt(key_data, pwd)
        print("✓ Keystore decrypted successfully")
    except Exception as e:
        print(f"✗ Failed to decrypt keystore: {e}")
        return
    
    # Compile contract
    contract_interface = compile_contract()
    
    # Deploy contract
    contract_address = deploy_contract(w3, contract_interface, private_key)
    
    if contract_address:
        print("\n" + "=" * 60)
        print("Deployment complete!")
        print("=" * 60)
        print(f"\nContract address: {contract_address}")
        print(f"Update your backend configuration with this address.")

if __name__ == '__main__':
    main()