#!/usr/bin/env python3
from web3 import Web3
import json

w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))

# Load ABI
with open('../blockchain/build/CompanyReviewLedger.abi', 'r') as f:
    abi = json.load(f)

contract_address = '0x9B5fF6De6F8C63A282Ea7Bf693C5ac384ce267d1'
contract = w3.eth.contract(address=contract_address, abi=abi)

# Test: Get total review count
try:
    count = contract.functions.getReviewCount().call()
    print(f"✓ Contract is working! Total reviews: {count}")
    
    # Get all review IDs
    if count > 0:
        all_ids = contract.functions.getAllReviewIds().call()
        print(f"\nAll review IDs on blockchain:")
        for rid in all_ids:
            print(f"  - {rid}")
except Exception as e:
    print(f"✗ Error: {e}")
