#!/usr/bin/env python3
"""
Query all reviews for a specific company
Shows aggregated statistics and all review IDs
"""

from web3 import Web3
import json
import sys
import os
from datetime import datetime

def query_company_reviews(company_id_or_name):
    """
    Query all reviews for a company

    Args:
        company_id_or_name: Company hash OR company name
    """
    # Connect
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))

    if not w3.is_connected():
        print("✗ Cannot connect to blockchain")
        return False

    # Load contract
    try:
        with open('../blockchain/build/CompanyReviewLedger.abi', 'r') as f:
            abi = json.load(f)
    except FileNotFoundError:
        print("✗ Contract ABI not found")
        return False

    contract_address = os.getenv('CONTRACT_ADDRESS', '0xC341bbFbaCbcf8119282e3820E7A4A8f8CA35bCA')
    contract = w3.eth.contract(address=contract_address, abi=abi)

    # Determine if input is hash or name
    if company_id_or_name.startswith('0x'):
        company_id = company_id_or_name
        company_name = "Unknown"
    else:
        company_name = company_id_or_name
        company_id = w3.keccak(text=company_name).hex()

    print("\n" + "=" * 70)
    print("COMPANY REVIEWS QUERY")
    print("=" * 70)
    print()
    print(f"Company Name: {company_name}")
    print(f"Company Hash: {company_id}")
    print()

    # Get all reviews for this company
    try:
        review_ids = contract.functions.getReviewsByCompanyId(company_id).call()
    except Exception as e:
        print(f"✗ Error fetching reviews: {e}")
        return False

    if len(review_ids) == 0:
        print("No reviews found for this company.")
        print()
        return True

    print(f"Total Reviews: {len(review_ids)}")
    print()
    print("-" * 70)

    # Fetch and display each review
    ratings = []

    for i, review_id in enumerate(review_ids, 1):
        try:
            review = contract.functions.getReview(review_id).call()
            rating = review[3]
            timestamp = review[5]
            ratings.append(rating)

            print(f"\nReview #{i}: {review_id}")
            print(f"  Rating:     {'⭐' * rating} ({rating}/5)")
            print(f"  Date:       {datetime.fromtimestamp(timestamp)}")
            print(f"  Reviewer:   {review[1][:20]}...")
            print(f"  Review Hash: {review[2][:20]}...")
        except Exception as e:
            print(f"\n✗ Error fetching review {review_id}: {e}")

    # Calculate statistics
    if ratings:
        print()
        print("-" * 70)
        print("\nSTATISTICS")
        print("-" * 70)
        avg_rating = sum(ratings) / len(ratings)
        print(f"Average Rating: {avg_rating:.2f} / 5.0")
        print(f"Total Reviews:  {len(ratings)}")
        print()
        print("Rating Distribution:")
        for stars in range(5, 0, -1):
            count = ratings.count(stars)
            percentage = (count / len(ratings)) * 100 if len(ratings) > 0 else 0
            bar = '█' * int(percentage / 5)
            print(f"  {stars}⭐: {bar} {count} ({percentage:.1f}%)")

    print()
    print("=" * 70)
    print()

    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 query_company_reviews.py <COMPANY_ID_OR_NAME>")
        print()
        print("Examples:")
        print('  python3 query_company_reviews.py "PT Teknologi Maju Indonesia"')
        print('  python3 query_company_reviews.py 0x1cea74a9f291ed6d820335c1c4e085a19d654fe2e29e3a5c3ea7f21ae0f8b2c3')
        print()
        sys.exit(1)

    company_input = sys.argv[1]
    success = query_company_reviews(company_input)

    sys.exit(0 if success else 1)
