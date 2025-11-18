from web3 import Web3
import json
from getpass import getpass
import time

# Configuration
RPC_URL = "http://127.0.0.1:8545"
CONTRACT_ADDRESS = "0xC341bbFbaCbcf8119282e3820E7A4A8f8CA35bCA"
ABI_FILE = "build/CompanyReviewLedger.abi"
KEY_UTC_FILE = 'data/keystore/UTC--2025-10-20T03-50-24.444331003Z--d9232db885e7db72eb0e55c25622e7c9413c4350'
REVIEWS_FILE = 'allreview.txt'

# Get password
ACCOUNT_PASSWORD = getpass("Account Password: ")

# Connect to Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))
assert w3.is_connected(), "Web3 Connect Fail"
print("✓ Connected to blockchain")

# Load contract
with open(ABI_FILE, "r") as f:
    abi = json.load(f)
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)
print("✓ Contract loaded")

# Load account
with open(KEY_UTC_FILE) as keyfile:
    encrypted_key = keyfile.read()
private_key = w3.eth.account.decrypt(encrypted_key, ACCOUNT_PASSWORD)
account = w3.eth.account.from_key(private_key)
print(f"✓ Using account: {account.address}\n")

def parse_reviews(filename):
    """Parse all reviews from the file"""
    reviews = []
    
    with open(filename, 'r') as file:
        lines = [line.strip() for line in file if line.strip()]
    
    # Each review has 8 lines
    i = 0
    while i < len(lines):
        if i + 7 < len(lines):
            review = {
                'review_id': lines[i],
                'company_name': lines[i + 1],
                'reviewer_email': lines[i + 2],
                'work_life_balance': int(lines[i + 3]),
                'salary_rating': int(lines[i + 4]),
                'management_rating': int(lines[i + 5]),
                'review_text': lines[i + 6],
                'employee_id': lines[i + 7]
            }
            reviews.append(review)
            i += 8
        else:
            break
    
    return reviews

def submit_review(review, nonce):
    """Submit a single review to the blockchain"""
    
    # Create hashes
    company_id = Web3.keccak(text=review['company_name']).hex()
    reviewer_hash = Web3.keccak(text=review['reviewer_email']).hex()
    employment_proof = Web3.keccak(text=review['employee_id']).hex()
    
    try:
        # Build transaction
        tx = contract.functions.storeReview(
            review['review_id'],
            company_id,
            reviewer_hash,
            review['work_life_balance'],
            review['salary_rating'],
            review['management_rating'],
            review['review_text'],
            employment_proof
        ).build_transaction({
            'from': account.address,
            'nonce': nonce,
            'gas': 500000,
            'gasPrice': w3.eth.gas_price,
        })
        
        # Sign and send transaction
        signed_tx = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        # Wait for confirmation
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return {
            'success': True,
            'tx_hash': tx_hash.hex(),
            'block': receipt.blockNumber,
            'gas_used': receipt.gasUsed
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def main():
    print("=== Batch Review Submission ===\n")
    
    # Parse all reviews
    print(f"Reading reviews from {REVIEWS_FILE}...")
    reviews = parse_reviews(REVIEWS_FILE)
    print(f"✓ Found {len(reviews)} reviews to submit\n")
    
    # Get starting nonce
    nonce = w3.eth.get_transaction_count(account.address)
    
    # Statistics
    successful = 0
    failed = 0
    total_gas = 0
    
    # Submit each review
    for i, review in enumerate(reviews, 1):
        print(f"[{i}/{len(reviews)}] Submitting {review['review_id']} - {review['company_name']}")
        
        result = submit_review(review, nonce)
        
        if result['success']:
            successful += 1
            total_gas += result['gas_used']
            print(f"  ✓ Success! Block: {result['block']}, Gas: {result['gas_used']}")
            print(f"  TX: {result['tx_hash']}")
            nonce += 1
        else:
            failed += 1
            print(f"  ✗ Failed: {result['error']}")
        
        print()
        
        # Small delay to avoid overwhelming the node
        if i < len(reviews):
            time.sleep(0.5)
    
    # Summary
    print("\n" + "="*50)
    print("=== SUBMISSION SUMMARY ===")
    print("="*50)
    print(f"Total Reviews: {len(reviews)}")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print(f"Total Gas Used: {total_gas}")
    print(f"Average Gas per Review: {total_gas // successful if successful > 0 else 0}")
    print("="*50)

if __name__ == "__main__":
    main()