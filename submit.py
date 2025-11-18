from web3 import Web3
import json
from getpass import getpass

RPC_URL = "http://127.0.0.1:8545"
CONTRACT_ADDRESS = "0xC341bbFbaCbcf8119282e3820E7A4A8f8CA35bCA"  
ABI_FILE = "build/CompanyReviewLedger.abi"
KEY_UTC_FILE = 'data/keystore/UTC--2025-10-20T03-50-24.444331003Z--d9232db885e7db72eb0e55c25622e7c9413c4350'

ACCOUNT_PASSWORD = getpass("Account Password:")

w3 = Web3(Web3.HTTPProvider(RPC_URL))
assert w3.is_connected(), "Web3 Connect Fail"

with open(ABI_FILE, "r") as f:
    abi = json.load(f)
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)

with open(KEY_UTC_FILE) as keyfile:
    encrypted_key = keyfile.read()
    private_key = w3.eth.account.decrypt(encrypted_key, ACCOUNT_PASSWORD)

account = w3.eth.account.from_key(private_key)
print(f"Using account: {account.address}")

# Read review data from file
with open('review.txt', 'r') as file:
    lines = [line.strip() for line in file if line.strip()]

review_id = lines[0]
company_name = lines[1]
reviewer_email = lines[2]
work_life_balance = int(lines[3])
salary_rating = int(lines[4])
management_rating = int(lines[5])
review_text = lines[6]
employee_id = lines[7]

# Create hashes
company_id = Web3.keccak(text=company_name).hex()
reviewer_hash = Web3.keccak(text=reviewer_email).hex()
employment_proof = Web3.keccak(text=employee_id).hex()

print(f"\n=== Review Details ===")
print(f"Review ID: {review_id}")
print(f"Company: {company_name}")
print(f"Company ID (hash): {company_id}")
print(f"Reviewer Hash: {reviewer_hash}")
print(f"Ratings - Work-Life: {work_life_balance}, Salary: {salary_rating}, Management: {management_rating}")
print(f"Review: {review_text}")
print(f"Employment Proof: {employment_proof}")

# Build and send transaction
nonce = w3.eth.get_transaction_count(account.address)
tx = contract.functions.storeReview(
    review_id,
    company_id,
    reviewer_hash,
    work_life_balance,
    salary_rating,
    management_rating,
    review_text,
    employment_proof
).build_transaction({
    'from': account.address,
    'nonce': nonce,
    'gas': 500000,
    'gasPrice': w3.eth.gas_price,
})

signed_tx = account.sign_transaction(tx)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
print(f"\nTransaction sent: {tx_hash.hex()}")

# Wait for confirmation
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print(f"Transaction confirmed in block {receipt.blockNumber}")
print(f"\nReview successfully stored on blockchain!")