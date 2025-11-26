# 🎬 Demo Guide - Blockchain Company Review System

Complete walkthrough demonstrating how the blockchain-based review system works and how to manually verify all data on the blockchain.

## 📋 Table of Contents

1. [System Startup](#1-system-startup)
2. [User Flow Demo](#2-user-flow-demo)
3. [Blockchain Verification](#3-blockchain-verification)
4. [Manual Data Query](#4-manual-data-query)
5. [Understanding the Hashes](#5-understanding-the-hashes)
6. [Advanced Verification](#6-advanced-verification)

---

## 1. System Startup

### Prerequisites Check

```bash
# Ensure all services are installed
which geth      # Blockchain
which node      # Backend
which psql      # Database
which python3   # Contract deployment
```

### Start All Services

```bash
cd review-system-mvp

# Option A: Start everything automatically
./scripts/start-all.sh

# Option B: Start services individually
./scripts/start-blockchain.sh  # Terminal 1
cd backend && npm start         # Terminal 2
cd frontend && npm start        # Terminal 3
```

### Deploy Smart Contract

```bash
# In a new terminal
cd review-system-mvp/blockchain
python3 deploy.py
```

**Copy the contract address** from output:
```
✓ Contract deployed successfully!
  Contract address: 0xC341bbFbaCbcf8119282e3820E7A4A8f8CA35bCA
```

Update `backend/.env`:
```bash
CONTRACT_ADDRESS=0xC341bbFbaCbcf8119282e3820E7A4A8f8CA35bCA
```

Restart backend:
```bash
./scripts/stop-all.sh
./scripts/start-all.sh
```

### Verify Services Running

```bash
# Check if all services are up
curl http://localhost:8545 -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
# Should return: {"jsonrpc":"2.0","id":1,"result":"0x..."}

curl http://localhost:3001/health
# Should return: {"success":true,"status":"healthy",...}

curl http://localhost:3000
# Should load the React app
```

---

## 2. User Flow Demo

### Step 1: Register an Account

1. Open browser: http://localhost:3000
2. Click **"Register"**
3. Fill in details:
   - **Full Name**: John Doe
   - **Email**: john@example.com
   - **Password**: password123
4. Click **"Register"**

**What happens:**
- Password is hashed with bcrypt (12 rounds)
- Email is hashed with Keccak256 for blockchain privacy
- User stored in PostgreSQL database

### Step 2: Browse Companies

1. Click **"Companies"** in navigation
2. You'll see 5 pre-loaded Indonesian tech companies:
   - PT Teknologi Maju Indonesia
   - PT Digital Solusi Nusantara
   - PT Inovasi Teknologi Pratama
   - PT Cyber Solutions Indonesia
   - PT Global Tech Indonesia

3. Click on **"PT Teknologi Maju Indonesia"**

**Blockchain Data Displayed:**
```
🔗 Blockchain Data
Company Hash: 0x1cea74a9f291ed6d820335c1c4e085a19d654fe2e29e3a5c3ea7f21ae0f8b2c3
```

### Step 3: Write a Review

1. Click **"Write a Review"**
2. **Verify Employment:**
   - Enter Employee ID: `EMP123456`
   - Click **"Verify Employment"**
   - ✅ Auto-approved (MVP feature)

3. **Submit Review:**
   - Select rating: ⭐⭐⭐⭐⭐ (5 stars)
   - Write review: "Great company culture and work-life balance!"
   - Click **"Submit Review"**

4. **Transaction Processing:**
   - Backend hashes your data
   - Sends transaction to blockchain
   - Waits for mining (15 seconds)
   - Stores metadata in database

### Step 4: View Blockchain Data

After submission, you'll see:

```
✓ Review successfully stored on blockchain!

🔗 Blockchain Transaction Details

Review ID:
REVMI5BI1E3UI1KM

Transaction Hash:
0x75d49623d3e21463bc7bb43dab4b184d839af93d4dec7efe21622220fd88107e

Block Number:
1234

Gas Used:
245678

Review Hash:
0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b

Company Hash:
0x1cea74a9f291ed6d820335c1c4e085a19d654fe2e29e3a5c3ea7f21ae0f8b2c3
```

**Save these values for manual verification!**

---

## 3. Blockchain Verification

### Method 1: Using Python Script

Create `verify_review.py`:

```python
#!/usr/bin/env python3
from web3 import Web3
import json

# Connect to blockchain
w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))

# Load contract ABI
with open('blockchain/build/CompanyReviewLedger.abi', 'r') as f:
    abi = json.load(f)

# Contract address (from deployment)
contract_address = '0xC341bbFbaCbcf8119282e3820E7A4A8f8CA35bCA'
contract = w3.eth.contract(address=contract_address, abi=abi)

# Your review ID from submission
review_id = 'REVMI5BI1E3UI1KM'

# Get review from blockchain
review = contract.functions.getReview(review_id).call()

print("=" * 60)
print("REVIEW DATA FROM BLOCKCHAIN")
print("=" * 60)
print(f"Review ID:       {review_id}")
print(f"Company Hash:    {review[0]}")
print(f"Reviewer Hash:   {review[1]}")
print(f"Review Hash:     {review[2]}")
print(f"Rating:          {review[3]} / 5")
print(f"Employment Proof: {review[4]}")
print(f"Timestamp:       {review[5]}")
print("=" * 60)
```

Run it:
```bash
python3 verify_review.py
```

### Method 2: Using Node.js Script

Create `verify_review.js`:

```javascript
const { Web3 } = require('web3');
const fs = require('fs');

async function verifyReview() {
    // Connect to blockchain
    const web3 = new Web3('http://127.0.0.1:8545');

    // Load contract ABI
    const abi = JSON.parse(fs.readFileSync('blockchain/build/CompanyReviewLedger.abi', 'utf8'));

    // Contract address
    const contractAddress = '0xC341bbFbaCbcf8119282e3820E7A4A8f8CA35bCA';
    const contract = new web3.eth.Contract(abi, contractAddress);

    // Your review ID
    const reviewId = 'REVMI5BI1E3UI1KM';

    // Get review
    const review = await contract.methods.getReview(reviewId).call();

    console.log("=" .repeat(60));
    console.log("REVIEW DATA FROM BLOCKCHAIN");
    console.log("=" .repeat(60));
    console.log(`Review ID:        ${reviewId}`);
    console.log(`Company Hash:     ${review.companyId}`);
    console.log(`Reviewer Hash:    ${review.reviewerHash}`);
    console.log(`Review Hash:      ${review.reviewHash}`);
    console.log(`Rating:           ${review.rating} / 5`);
    console.log(`Employment Proof: ${review.employmentProof}`);
    console.log(`Timestamp:        ${review.timestamp}`);
    console.log("=" .repeat(60));
}

verifyReview().catch(console.error);
```

Run it:
```bash
node verify_review.js
```

### Method 3: Using Geth Console

```bash
# Attach to running geth
geth attach http://127.0.0.1:8545

# In geth console:
var abi = [/* paste ABI from CompanyReviewLedger.abi */];
var contractAddress = "0xC341bbFbaCbcf8119282e3820E7A4A8f8CA35bCA";
var contract = eth.contract(abi).at(contractAddress);

// Get review
var reviewId = "REVMI5BI1E3UI1KM";
var review = contract.getReview(reviewId);

console.log("Company Hash:", review[0]);
console.log("Reviewer Hash:", review[1]);
console.log("Review Hash:", review[2]);
console.log("Rating:", review[3].toString());
console.log("Employment Proof:", review[4]);
console.log("Timestamp:", review[5].toString());
```

---

## 4. Manual Data Query

### Query All Reviews for a Company

**Python:**
```python
company_id = '0x1cea74a9f291ed6d820335c1c4e085a19d654fe2e29e3a5c3ea7f21ae0f8b2c3'
review_ids = contract.functions.getReviewsByCompanyId(company_id).call()

print(f"Total reviews: {len(review_ids)}")
for review_id in review_ids:
    print(f"  - {review_id}")
```

**Node.js:**
```javascript
const companyId = '0x1cea74a9f291ed6d820335c1c4e085a19d654fe2e29e3a5c3ea7f21ae0f8b2c3';
const reviewIds = await contract.methods.getReviewsByCompanyId(companyId).call();

console.log(`Total reviews: ${reviewIds.length}`);
reviewIds.forEach(id => console.log(`  - ${id}`));
```

### Get Transaction Details

**Python:**
```python
tx_hash = '0x75d49623d3e21463bc7bb43dab4b184d839af93d4dec7efe21622220fd88107e'
tx = w3.eth.get_transaction(tx_hash)
receipt = w3.eth.get_transaction_receipt(tx_hash)

print(f"From:         {tx['from']}")
print(f"To:           {tx['to']}")
print(f"Gas Used:     {receipt['gasUsed']}")
print(f"Block:        {receipt['blockNumber']}")
print(f"Status:       {'Success' if receipt['status'] == 1 else 'Failed'}")
```

### Verify Review Hash

**Python:**
```python
# Calculate hash of review content
import json
from web3 import Web3

review_data = {
    'companyId': '0x1cea74a9f291ed6d820335c1c4e085a19d654fe2e29e3a5c3ea7f21ae0f8b2c3',
    'rating': 5,
    'reviewText': 'Great company culture and work-life balance!',
    'timestamp': 1700000000
}

content = json.dumps(review_data)
calculated_hash = Web3.keccak(text=content).hex()

# Get stored hash from blockchain
stored_hash = contract.functions.getReview('REVMI5BI1E3UI1KM').call()[2]

print(f"Calculated Hash: {calculated_hash}")
print(f"Stored Hash:     {stored_hash}")
print(f"Match:           {calculated_hash == stored_hash}")
```

---

## 5. Understanding the Hashes

### Company Hash (Keccak256)

**How it's generated:**
```python
from web3 import Web3

company_name = "PT Teknologi Maju Indonesia"
company_hash = Web3.keccak(text=company_name).hex()
# Result: 0x1cea74a9f291ed6d820335c1c4e085a19d654fe2e29e3a5c3ea7f21ae0f8b2c3
```

**Why it's used:**
- Privacy: Company name not exposed on blockchain
- Uniqueness: One hash per company
- Indexing: Fast lookup by hash

### Reviewer Hash (Keccak256)

**How it's generated:**
```python
from web3 import Web3

email = "john@example.com"
reviewer_hash = Web3.keccak(text=email.lower()).hex()
# Result: 0x7b3f8e9a2c1d5e4f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f
```

**Why it's used:**
- Anonymity: Email address never on blockchain
- Verification: Can prove you wrote a review without revealing email
- Privacy: GDPR compliant

### Employment Proof Hash

**How it's generated:**
```python
employee_id = "EMP123456"
proof_hash = Web3.keccak(text=employee_id).hex()
```

### Review Hash (Content Integrity)

**How it's generated:**
```python
import json
from web3 import Web3

review_content = {
    'companyId': '0x1cea...',
    'rating': 5,
    'reviewText': 'Great company!',
    'timestamp': 1700000000
}

content_json = json.dumps(review_content)
review_hash = Web3.keccak(text=content_json).hex()
```

**Why it's used:**
- Integrity: Proves review hasn't been tampered with
- Verification: Anyone can verify the hash matches
- Immutability: Hash stored on blockchain is permanent

---

## 6. Advanced Verification

### Complete Verification Script

Create `complete_verification.py`:

```python
#!/usr/bin/env python3
"""
Complete blockchain verification script
Verifies all aspects of a review on the blockchain
"""

from web3 import Web3
import json
from datetime import datetime

def verify_complete(review_id, expected_data):
    """
    Verify all aspects of a review

    Args:
        review_id: The review ID to verify
        expected_data: Dict with expected values
    """
    # Connect
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))

    # Load contract
    with open('blockchain/build/CompanyReviewLedger.abi', 'r') as f:
        abi = json.load(f)

    contract_address = '0xC341bbFbaCbcf8119282e3820E7A4A8f8CA35bCA'
    contract = w3.eth.contract(address=contract_address, abi=abi)

    print("\n" + "=" * 70)
    print("COMPLETE BLOCKCHAIN VERIFICATION")
    print("=" * 70)

    # 1. Check if review exists
    print(f"\n[1/6] Checking if review exists...")
    exists = contract.functions.reviewExists(review_id).call()
    print(f"✓ Review exists on blockchain: {exists}")

    if not exists:
        print("✗ Review not found!")
        return False

    # 2. Get review data
    print(f"\n[2/6] Fetching review data...")
    review = contract.functions.getReview(review_id).call()
    company_id = review[0]
    reviewer_hash = review[1]
    review_hash = review[2]
    rating = review[3]
    employment_proof = review[4]
    timestamp = review[5]
    print(f"✓ Review data retrieved")

    # 3. Verify company hash
    print(f"\n[3/6] Verifying company hash...")
    if 'company_name' in expected_data:
        expected_company_hash = w3.keccak(text=expected_data['company_name']).hex()
        matches = company_id == expected_company_hash
        print(f"  Expected: {expected_company_hash}")
        print(f"  Got:      {company_id}")
        print(f"  {'✓' if matches else '✗'} Company hash {'matches' if matches else 'DOES NOT MATCH'}")
    else:
        print(f"  Company ID: {company_id}")

    # 4. Verify reviewer hash
    print(f"\n[4/6] Verifying reviewer hash...")
    if 'email' in expected_data:
        expected_reviewer_hash = w3.keccak(text=expected_data['email'].lower()).hex()
        matches = reviewer_hash == expected_reviewer_hash
        print(f"  Expected: {expected_reviewer_hash}")
        print(f"  Got:      {reviewer_hash}")
        print(f"  {'✓' if matches else '✗'} Reviewer hash {'matches' if matches else 'DOES NOT MATCH'}")
    else:
        print(f"  Reviewer hash: {reviewer_hash}")

    # 5. Verify rating
    print(f"\n[5/6] Verifying rating...")
    print(f"  Rating: {rating} / 5")
    if 'rating' in expected_data:
        matches = rating == expected_data['rating']
        print(f"  {'✓' if matches else '✗'} Rating {'matches' if matches else 'DOES NOT MATCH'}")

    # 6. Display all data
    print(f"\n[6/6] Complete review data:")
    print(f"  Review ID:        {review_id}")
    print(f"  Company Hash:     {company_id}")
    print(f"  Reviewer Hash:    {reviewer_hash}")
    print(f"  Review Hash:      {review_hash}")
    print(f"  Rating:           {rating} / 5")
    print(f"  Employment Proof: {employment_proof}")
    print(f"  Timestamp:        {timestamp}")
    print(f"  Date:             {datetime.fromtimestamp(timestamp)}")

    # 7. Get all reviews for this company
    print(f"\n[BONUS] Other reviews for this company:")
    all_review_ids = contract.functions.getReviewsByCompanyId(company_id).call()
    print(f"  Total reviews: {len(all_review_ids)}")
    for rid in all_review_ids:
        print(f"    - {rid}")

    print("\n" + "=" * 70)
    print("✓ VERIFICATION COMPLETE")
    print("=" * 70 + "\n")

    return True

# Example usage
if __name__ == '__main__':
    # Your review data
    review_id = 'REVMI5BI1E3UI1KM'

    expected_data = {
        'company_name': 'PT Teknologi Maju Indonesia',
        'email': 'john@example.com',
        'rating': 5
    }

    verify_complete(review_id, expected_data)
```

Run it:
```bash
python3 complete_verification.py
```

### Expected Output:

```
======================================================================
COMPLETE BLOCKCHAIN VERIFICATION
======================================================================

[1/6] Checking if review exists...
✓ Review exists on blockchain: True

[2/6] Fetching review data...
✓ Review data retrieved

[3/6] Verifying company hash...
  Expected: 0x1cea74a9f291ed6d820335c1c4e085a19d654fe2e29e3a5c3ea7f21ae0f8b2c3
  Got:      0x1cea74a9f291ed6d820335c1c4e085a19d654fe2e29e3a5c3ea7f21ae0f8b2c3
  ✓ Company hash matches

[4/6] Verifying reviewer hash...
  Expected: 0x7b3f8e9a2c1d5e4f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f
  Got:      0x7b3f8e9a2c1d5e4f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f
  ✓ Reviewer hash matches

[5/6] Verifying rating...
  Rating: 5 / 5
  ✓ Rating matches

[6/6] Complete review data:
  Review ID:        REVMI5BI1E3UI1KM
  Company Hash:     0x1cea74a9f291ed6d820335c1c4e085a19d654fe2e29e3a5c3ea7f21ae0f8b2c3
  Reviewer Hash:    0x7b3f8e9a2c1d5e4f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f
  Review Hash:      0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b
  Rating:           5 / 5
  Employment Proof: 0x8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d
  Timestamp:        1700000000
  Date:             2023-11-14 22:13:20

[BONUS] Other reviews for this company:
  Total reviews: 3
    - REVMI5BI1E3UI1KM
    - REVNJ6CJ2F4VJ2LN
    - REVOK7DK3G5WK3MO

======================================================================
✓ VERIFICATION COMPLETE
======================================================================
```

---

## 📊 Demo Checklist

Use this checklist when demonstrating:

- [ ] All services started successfully
- [ ] Smart contract deployed
- [ ] User registered and logged in
- [ ] Employment verified
- [ ] Review submitted to blockchain
- [ ] Transaction hash received
- [ ] Review displayed in UI with all hashes
- [ ] Blockchain data manually verified using Python/Node
- [ ] Company hash verified (Keccak256 of company name)
- [ ] Reviewer hash verified (Keccak256 of email)
- [ ] Rating matches on blockchain
- [ ] Timestamp is correct
- [ ] Multiple reviews visible for same company
- [ ] All data immutable and verifiable

---

## 🎯 Key Demo Points

### 1. **Privacy Through Hashing**
- Show email in database vs hash on blockchain
- Prove anonymity while maintaining verifiability

### 2. **Immutability**
- Try to edit a review → Show it's impossible
- Blockchain record is permanent

### 3. **Transparency**
- Anyone can verify any review
- All hashes are visible in UI
- Manual verification with scripts

### 4. **Efficiency**
- Only hash stored on blockchain (not full text)
- Full text in database for fast queries
- Best of both worlds: blockchain security + database speed

### 5. **Verification**
- Show how to calculate hashes manually
- Prove data integrity with hash matching
- Demonstrate trustless verification

---

## 📝 Notes

- **Block time**: 15 seconds (Clique PoA)
- **Gas limit**: 500,000 per transaction
- **Chain ID**: 110261
- **Network**: Private (not public Ethereum)
- **Consensus**: Proof of Authority (Clique)

---

## 🔗 Useful Links

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/health
- **Blockchain RPC**: http://localhost:8545

---

## 🎥 Recording the Demo

### Suggested Flow:

1. **Introduction** (2 min)
   - Explain the problem: Fake reviews, manipulation
   - Show the solution: Blockchain immutability

2. **System Architecture** (3 min)
   - Show diagram of components
   - Explain data flow
   - Highlight privacy features

3. **Live Demo** (10 min)
   - Register user
   - Browse companies
   - Submit review
   - Show blockchain data in UI

4. **Blockchain Verification** (5 min)
   - Run Python verification script
   - Show all hashes match
   - Explain what each hash represents

5. **Conclusion** (2 min)
   - Recap benefits
   - Show impossible to tamper
   - Demonstrate transparency

---

**Total Demo Time**: ~20-25 minutes

**Best Practices**:
- Have everything pre-started
- Use clear variable names
- Explain each hash type
- Show both UI and blockchain data
- Emphasize privacy + transparency

---

🎬 **Ready to demonstrate!** Follow this guide to showcase the complete blockchain-based review system.
