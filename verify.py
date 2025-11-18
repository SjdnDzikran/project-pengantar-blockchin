from web3 import Web3
import json
import time

RPC_URL = "http://127.0.0.1:8545"
CONTRACT_ADDRESS = "0xC341bbFbaCbcf8119282e3820E7A4A8f8CA35bCA"
ABI_FILE = "build/CompanyReviewLedger.abi"

w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    raise ConnectionError("Cannot connect to node at " + RPC_URL)

with open(ABI_FILE, "r") as f:
    abi = json.load(f)
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)

# Read review data from file
with open('review.txt', 'r') as file:
    lines = [line.strip() for line in file if line.strip()]

review_id = lines[0]

print(f"Verifying review ID: {review_id}")

try:
    # Check if review exists
    if contract.functions.reviewExists(review_id).call():
        # Get review details
        review = contract.functions.getReview(review_id).call()
        
        print(f"\n=== Review Found ===")
        print(f"Review ID: {review_id}")
        print(f"Company ID (hash): {review[0]}")
        print(f"Reviewer Hash: {review[1]}")
        print(f"Work-Life Balance Rating: {review[2]}/5")
        print(f"Salary Rating: {review[3]}/5")
        print(f"Management Rating: {review[4]}/5")
        print(f"Average Rating: {(review[2] + review[3] + review[4]) / 3:.2f}/5")
        print(f"Review Text: {review[5]}")
        print(f"Employment Proof (hash): {review[6]}")
        
        # Get and format timestamp
        timestamp = review[7]
        readable_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp))
        print(f"Review Timestamp: {readable_time}")
        
        # Get total reviews
        total = contract.functions.totalReviews().call()
        print(f"\nTotal Reviews in System: {total}")
        
    else:
        print("Review not found!")
        
except Exception as e:
    print(f"Error: {e}")