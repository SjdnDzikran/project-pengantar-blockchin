#!/usr/bin/env python3
"""
Simple review verification script
Fetches and displays a review from the blockchain
"""

from web3 import Web3
import json
import sys
from datetime import datetime

def verify_review(review_id):
    """Fetch and display a review from blockchain"""

    # Connect to blockchain
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))

    if not w3.is_connected():
        print("✗ Cannot connect to blockchain at http://127.0.0.1:8545")
        print("  Make sure the blockchain node is running")
        return False

    print(f"✓ Connected to blockchain (Block: {w3.eth.block_number})")

    # Load contract ABI
    try:
        with open('./blockchain/build/CompanyReviewLedger.abi', 'r') as f:
            abi = json.load(f)
    except FileNotFoundError:
        print("✗ Contract ABI not found")
        print("  Make sure the contract is compiled and deployed")
        return False

    # Load contract address from env or use default
    import os
    contract_address = os.getenv('CONTRACT_ADDRESS', '0x9B5fF6De6F8C63A282Ea7Bf693C5ac384ce267d1')

    contract = w3.eth.contract(address=contract_address, abi=abi)

    print(f"✓ Contract loaded at: {contract_address}")
    print()

    # Check if review exists
    # try:
    #     exists = contract.functions.reviewExists(review_id).call()
    #     if not exists:
    #         print(f"✗ Review '{review_id}' not found on blockchain")
    #         return False
    # except Exception as e:
    #     print(f"✗ Error checking review: {e}")
    #     return False

    # Get review
    try:
        review = contract.functions.getReview(review_id).call()
    except Exception as e:
        print(f"✗ Error fetching revihew: {e}")
        return False

    # Parse review data
    company_id = review[0]
    reviewer_hash = review[1]
    review_hash = review[2]
    rating = review[3]
    employment_proof = review[4]
    timestamp = review[5]

    # Display review
    print("=" * 70)
    print("REVIEW DATA FROM BLOCKCHAIN")
    print("=" * 70)
    print()
    print(f"Review ID:        {review_id}")
    print(f"Company Hash:     {company_id}")
    print(f"Reviewer Hash:    {reviewer_hash}")
    print(f"Review Hash:      {review_hash}")
    print(f"Rating:           {rating} / 5")
    print(f"Employment Proof: {employment_proof}")
    print(f"Timestamp:        {timestamp}")
    print(f"Date:             {datetime.fromtimestamp(timestamp)}")
    print()
    print("=" * 70)
    print()

    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 verify_review.py <REVIEW_ID>")
        print()
        print("Example:")
        print("  python3 verify_review.py REVMI5BI1E3UI1KM")
        sys.exit(1)

    review_id = sys.argv[1]
    success = verify_review(review_id)

    sys.exit(0 if success else 1)
