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

# Read company ID from file
with open('company_id.txt', 'r') as file:
    company_id = file.read().strip()

print(f"Fetching reviews for Company ID: {company_id}")
print("=" * 80)

try:
    # Get all reviews for the company
    reviews = contract.functions.getReviewsByCompanyId(company_id).call()
    
    if len(reviews) == 0:
        print("\nNo reviews found for this company.")
    else:
        print(f"\n=== Found {len(reviews)} Review(s) for Company ===\n")
        
        # Initialize statistics
        total_work_life = 0
        total_salary = 0
        total_management = 0
        
        # Display each review
        for idx, review in enumerate(reviews, 1):
            print(f"{'─' * 80}")
            print(f"Review #{idx}")
            print(f"{'─' * 80}")
            print(f"Company ID (hash): {review[0]}")
            print(f"Reviewer Hash: {review[1]}")
            print(f"Work-Life Balance Rating: {review[2]}/5 {'★' * review[2]}{'☆' * (5-review[2])}")
            print(f"Salary Rating: {review[3]}/5 {'★' * review[3]}{'☆' * (5-review[3])}")
            print(f"Management Rating: {review[4]}/5 {'★' * review[4]}{'☆' * (5-review[4])}")
            
            avg_rating = (review[2] + review[3] + review[4]) / 3
            print(f"Average Rating: {avg_rating:.2f}/5")
            print(f"\nReview Text:")
            print(f"  {review[5]}")
            print(f"\nEmployment Proof (hash): {review[6]}")
            
            # Format timestamp
            timestamp = review[7]
            readable_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp))
            print(f"Review Date: {readable_time}")
            
            # Accumulate for statistics
            total_work_life += review[2]
            total_salary += review[3]
            total_management += review[4]
            print()
        
        # Display aggregate statistics
        print(f"{'═' * 80}")
        print(f"COMPANY STATISTICS")
        print(f"{'═' * 80}")
        print(f"Total Reviews: {len(reviews)}")
        print(f"Average Work-Life Balance: {total_work_life / len(reviews):.2f}/5")
        print(f"Average Salary Rating: {total_salary / len(reviews):.2f}/5")
        print(f"Average Management Rating: {total_management / len(reviews):.2f}/5")
        
        overall_avg = (total_work_life + total_salary + total_management) / (len(reviews) * 3)
        print(f"Overall Company Rating: {overall_avg:.2f}/5 {'★' * int(overall_avg)}{'☆' * (5-int(overall_avg))}")
        
        # Get total reviews in system
        total_system = contract.functions.totalReviews().call()
        print(f"\nTotal Reviews in System: {total_system}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()