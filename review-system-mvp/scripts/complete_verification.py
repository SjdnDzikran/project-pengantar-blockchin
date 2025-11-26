#!/usr/bin/env python3
"""
Complete blockchain verification script
Verifies all aspects of a review on the blockchain
"""

from web3 import Web3
import json
import sys
from datetime import datetime
import os

def verify_complete(review_id, company_name=None, email=None, rating=None):
    """
    Verify all aspects of a review

    Args:
        review_id: The review ID to verify
        company_name: Expected company name (optional)
        email: Expected reviewer email (optional)
        rating: Expected rating (optional)
    """
    # Connect
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))

    if not w3.is_connected():
        print("✗ Cannot connect to blockchain at http://127.0.0.1:8545")
        return False

    # Load contract
    try:
        with open('../blockchain/build/CompanyReviewLedger.abi', 'r') as f:
            abi = json.load(f)
    except FileNotFoundError:
        print("✗ Contract ABI not found at ../blockchain/build/CompanyReviewLedger.abi")
        return False

    contract_address = os.getenv('CONTRACT_ADDRESS', '0xC341bbFbaCbcf8119282e3820E7A4A8f8CA35bCA')
    contract = w3.eth.contract(address=contract_address, abi=abi)

    print("\n" + "=" * 70)
    print("COMPLETE BLOCKCHAIN VERIFICATION")
    print("=" * 70)

    # 1. Check if review exists
    print(f"\n[1/6] Checking if review exists...")
    try:
        exists = contract.functions.reviewExists(review_id).call()
        print(f"  ✓ Review exists on blockchain: {exists}")
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

    if not exists:
        print("  ✗ Review not found!")
        return False

    # 2. Get review data
    print(f"\n[2/6] Fetching review data...")
    try:
        review = contract.functions.getReview(review_id).call()
        company_id = review[0]
        reviewer_hash = review[1]
        review_hash = review[2]
        rating_value = review[3]
        employment_proof = review[4]
        timestamp = review[5]
        print(f"  ✓ Review data retrieved")
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

    # 3. Verify company hash
    print(f"\n[3/6] Verifying company hash...")
    if company_name:
        expected_company_hash = w3.keccak(text=company_name).hex()
        matches = company_id == expected_company_hash
        print(f"  Expected: {expected_company_hash}")
        print(f"  Got:      {company_id}")
        print(f"  {'✓' if matches else '✗'} Company hash {'matches' if matches else 'DOES NOT MATCH'}")
    else:
        print(f"  Company ID: {company_id}")
        print(f"  (No company name provided for verification)")

    # 4. Verify reviewer hash
    print(f"\n[4/6] Verifying reviewer hash...")
    if email:
        expected_reviewer_hash = w3.keccak(text=email.lower()).hex()
        matches = reviewer_hash == expected_reviewer_hash
        print(f"  Expected: {expected_reviewer_hash}")
        print(f"  Got:      {reviewer_hash}")
        print(f"  {'✓' if matches else '✗'} Reviewer hash {'matches' if matches else 'DOES NOT MATCH'}")
    else:
        print(f"  Reviewer hash: {reviewer_hash}")
        print(f"  (No email provided for verification)")

    # 5. Verify rating
    print(f"\n[5/6] Verifying rating...")
    print(f"  Rating: {rating_value} / 5")
    if rating is not None:
        matches = rating_value == rating
        print(f"  Expected: {rating}")
        print(f"  {'✓' if matches else '✗'} Rating {'matches' if matches else 'DOES NOT MATCH'}")

    # 6. Display all data
    print(f"\n[6/6] Complete review data:")
    print(f"  Review ID:        {review_id}")
    print(f"  Company Hash:     {company_id}")
    print(f"  Reviewer Hash:    {reviewer_hash}")
    print(f"  Review Hash:      {review_hash}")
    print(f"  Rating:           {rating_value} / 5")
    print(f"  Employment Proof: {employment_proof}")
    print(f"  Timestamp:        {timestamp}")
    print(f"  Date:             {datetime.fromtimestamp(timestamp)}")

    # 7. Get all reviews for this company
    print(f"\n[BONUS] Other reviews for this company:")
    try:
        all_review_ids = contract.functions.getReviewsByCompanyId(company_id).call()
        print(f"  Total reviews: {len(all_review_ids)}")
        for rid in all_review_ids:
            marker = "← THIS ONE" if rid == review_id else ""
            print(f"    - {rid} {marker}")
    except Exception as e:
        print(f"  ✗ Error fetching company reviews: {e}")

    print("\n" + "=" * 70)
    print("✓ VERIFICATION COMPLETE")
    print("=" * 70 + "\n")

    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 complete_verification.py <REVIEW_ID> [company_name] [email] [rating]")
        print()
        print("Examples:")
        print('  python3 complete_verification.py REVMI5BI1E3UI1KM')
        print('  python3 complete_verification.py REVMI5BI1E3UI1KM "PT Teknologi Maju Indonesia"')
        print('  python3 complete_verification.py REVMI5BI1E3UI1KM "PT Teknologi Maju Indonesia" "john@example.com"')
        print('  python3 complete_verification.py REVMI5BI1E3UI1KM "PT Teknologi Maju Indonesia" "john@example.com" 5')
        print()
        sys.exit(1)

    review_id = sys.argv[1]
    company_name = sys.argv[2] if len(sys.argv) > 2 else None
    email = sys.argv[3] if len(sys.argv) > 3 else None
    rating = int(sys.argv[4]) if len(sys.argv) > 4 else None

    success = verify_complete(review_id, company_name, email, rating)

    sys.exit(0 if success else 1)
