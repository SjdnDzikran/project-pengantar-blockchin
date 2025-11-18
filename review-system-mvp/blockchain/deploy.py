#!/usr/bin/env python3
"""
Deploy CompanyReviewLedger smart contract to the blockchain
"""
import json
import time
from web3 import Web3
from solcx import compile_source, install_solc

# Configuration
RPC_URL = 'http://127.0.0.1:8545'
DEPLOYER_ADDRESS = '0xd9232DB885e7db72eb0e55c25622e7C9413c4350'
DEPLOYER_PASSWORD = 'admin123'
CHAIN_ID = 110261
GAS_LIMIT = 5000000

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

def deploy_contract(w3, contract_interface):
    """Deploy the compiled contract"""
    print(f"\nDeploying from account: {DEPLOYER_ADDRESS}")

    # Unlock account
    try:
        w3.geth.personal.unlock_account(DEPLOYER_ADDRESS, DEPLOYER_PASSWORD, 0)
        print("✓ Account unlocked")
    except Exception as e:
        print(f"✗ Failed to unlock account: {e}")
        return None

    # Create contract instance
    Contract = w3.eth.contract(
        abi=contract_interface['abi'],
        bytecode=contract_interface['bin']
    )

    # Build constructor transaction
    print("Building deployment transaction...")
    tx_hash = Contract.constructor().transact({
        'from': DEPLOYER_ADDRESS,
        'gas': GAS_LIMIT
    })

    print(f"Transaction sent: {tx_hash.hex()}")
    print("Waiting for transaction to be mined...")

    # Wait for transaction receipt
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

    # Compile contract
    contract_interface = compile_contract()

    # Deploy contract
    contract_address = deploy_contract(w3, contract_interface)

    if contract_address:
        print("\n" + "=" * 60)
        print("Deployment complete!")
        print("=" * 60)
        print(f"\nContract address: {contract_address}")
        print(f"Update your backend configuration with this address.")

if __name__ == '__main__':
    main()
