#!/usr/bin/env python3
"""
Diagnostic script to troubleshoot contract issues
"""

from web3 import Web3
import json
import os
import sys

def diagnose():
    print("\n" + "=" * 70)
    print("BLOCKCHAIN CONTRACT DIAGNOSTIC")
    print("=" * 70 + "\n")

    # 1. Check blockchain connection
    print("[1/6] Testing blockchain connection...")
    try:
        w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
        if not w3.is_connected():
            print("  ✗ Cannot connect to blockchain")
            return False

        block = w3.eth.block_number
        print(f"  ✓ Connected (Block: {block})")
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

    # 2. Check ABI file
    print("\n[2/6] Checking ABI file...")
    abi_path = '../blockchain/build/CompanyReviewLedger.abi'
    if not os.path.exists(abi_path):
        print(f"  ✗ ABI not found at {abi_path}")
        return False

    try:
        with open(abi_path, 'r') as f:
            abi = json.load(f)
        print(f"  ✓ ABI loaded ({len(abi)} functions)")
    except Exception as e:
        print(f"  ✗ Error loading ABI: {e}")
        return False

    # 3. Check contract address
    print("\n[3/6] Checking contract address...")

    # Try to get from env
    env_address = os.getenv('CONTRACT_ADDRESS')

    # Try to get from deployment.json
    deployment_address = None
    try:
        with open('../blockchain/build/deployment.json', 'r') as f:
            deployment = json.load(f)
            deployment_address = deployment.get('address')
    except:
        pass

    # Try to get from backend .env
    backend_address = None
    try:
        with open('../backend/.env', 'r') as f:
            for line in f:
                if line.startswith('CONTRACT_ADDRESS='):
                    backend_address = line.split('=')[1].strip()
    except:
        pass

    print(f"  Environment variable: {env_address or 'Not set'}")
    print(f"  Deployment file:      {deployment_address or 'Not found'}")
    print(f"  Backend .env:         {backend_address or 'Not found'}")

    # Use the most reliable address
    contract_address = env_address or deployment_address or backend_address

    if not contract_address or contract_address == '0xYourContractAddressHere':
        print("\n  ✗ No valid contract address found!")
        print("  Please deploy the contract first:")
        print("    cd blockchain && python3 deploy.py")
        return False

    print(f"\n  Using address: {contract_address}")

    # 4. Test contract connection
    print("\n[4/6] Testing contract...")
    try:
        contract = w3.eth.contract(address=contract_address, abi=abi)
        print("  ✓ Contract object created")
    except Exception as e:
        print(f"  ✗ Error creating contract: {e}")
        return False

    # 5. Test contract functions
    print("\n[5/6] Testing contract functions...")

    # Test getReviewCount
    try:
        count = contract.functions.getReviewCount().call()
        print(f"  ✓ getReviewCount() works: {count} reviews")
    except Exception as e:
        print(f"  ✗ getReviewCount() failed: {e}")
        print("\n  This suggests the contract address is wrong or contract not deployed")
        return False

    # Test getAllReviewIds
    try:
        if count > 0:
            review_ids = contract.functions.getAllReviewIds().call()
            print(f"  ✓ getAllReviewIds() works: {len(review_ids)} IDs")
        else:
            print(f"  ℹ No reviews yet (count = 0)")
    except Exception as e:
        print(f"  ✗ getAllReviewIds() failed: {e}")

    # 6. Display all reviews
    print("\n[6/6] Reviews on blockchain:")
    if count == 0:
        print("  No reviews found on blockchain")
        print("\n  Try submitting a review through the UI at:")
        print("  http://localhost:3000")
    else:
        try:
            review_ids = contract.functions.getAllReviewIds().call()
            print(f"\n  Total: {len(review_ids)} reviews\n")

            for i, rid in enumerate(review_ids, 1):
                try:
                    review = contract.functions.getReview(rid).call()
                    rating = review[3]
                    print(f"  [{i}] {rid}")
                    print(f"      Rating: {rating}/5")
                    print(f"      Company: {review[0][:20]}...")
                    print()
                except Exception as e:
                    print(f"  [{i}] {rid} - Error: {e}")
        except Exception as e:
            print(f"  ✗ Error fetching reviews: {e}")

    print("\n" + "=" * 70)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 70 + "\n")

    # Summary
    print("Summary:")
    print(f"  ✓ Blockchain connected (Block {block})")
    print(f"  ✓ Contract address: {contract_address}")
    print(f"  ✓ Total reviews: {count}")

    if count > 0:
        print("\n✅ Everything looks good!")
        print(f"\nTo verify a review, use:")
        print(f"  python3 verify_review.py {review_ids[0]}")
    else:
        print("\n⚠️ No reviews on blockchain yet")
        print("Submit a review through the UI first:")
        print("  1. Go to http://localhost:3000")
        print("  2. Register/Login")
        print("  3. Browse companies")
        print("  4. Write a review")

    print()
    return True

if __name__ == '__main__':
    try:
        success = diagnose()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
