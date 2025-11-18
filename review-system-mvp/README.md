# Blockchain-Based Company Review System - MVP

A decentralized platform for transparent and immutable company reviews powered by Ethereum blockchain.

## 🎯 Overview

This system allows employees to submit verified reviews about their companies. Reviews are stored on a private Ethereum blockchain ensuring:
- **Transparency**: All reviews are on the blockchain
- **Immutability**: Reviews cannot be altered or deleted
- **Privacy**: Personal data is hashed before storage
- **Verification**: Only verified employees can submit reviews

## 🏗️ Architecture

### Technology Stack

- **Blockchain**: Geth (Ethereum) with Proof of Authority (Clique)
- **Smart Contract**: Solidity 0.8.0+
- **Backend**: Node.js + Express
- **Frontend**: React 18
- **Database**: PostgreSQL
- **State Management**: Zustand

### Key Features

1. **Simplified Review System**
   - Single universal rating (1-5 stars)
   - Review content hash stored on blockchain
   - Full review text stored in database

2. **Privacy-First Design**
   - Email addresses hashed with Keccak256
   - Employee IDs hashed before blockchain storage
   - Review content hashed for integrity verification

3. **Employment Verification**
   - Users must verify employment before reviewing
   - Auto-approval for MVP (can be extended to manual approval)

## 📁 Project Structure

```
review-system-mvp/
├── blockchain/
│   ├── contracts/
│   │   └── CompanyReviewLedger.sol
│   ├── build/
│   ├── data/
│   │   └── keystore/
│   ├── genesis.json
│   └── deploy.py
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── database/
│   │   └── migrations/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   └── App.js
│   └── package.json
├── scripts/
│   ├── setup.sh
│   ├── init-blockchain.sh
│   ├── init-database.sh
│   ├── start-all.sh
│   ├── start-blockchain.sh
│   └── stop-all.sh
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js v16+
- npm or yarn
- Python 3.8+
- PostgreSQL 12+
- Geth (go-ethereum)

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd review-system-mvp
   ```

2. **Run the complete setup:**
   ```bash
   chmod +x scripts/*.sh
   ./scripts/setup.sh
   ```

   This will:
   - Initialize blockchain (copy keystores, create genesis)
   - Set up PostgreSQL database
   - Install all dependencies
   - Prepare environment files

3. **Start all services:**
   ```bash
   ./scripts/start-all.sh
   ```

   This starts:
   - Blockchain node (port 8545)
   - Backend API (port 3001)
   - Frontend app (port 3000)

4. **Deploy smart contract:**
   ```bash
   cd blockchain
   python3 deploy.py
   ```

   Copy the contract address from the output.

5. **Update backend configuration:**
   ```bash
   nano backend/.env
   # Set: CONTRACT_ADDRESS=0xYourContractAddress
   ```

6. **Restart services:**
   ```bash
   ./scripts/stop-all.sh
   ./scripts/start-all.sh
   ```

7. **Access the application:**
   Open your browser to: http://localhost:3000

## 📝 Manual Setup (Alternative)

### 1. Blockchain Setup

```bash
# Initialize blockchain
./scripts/init-blockchain.sh

# Start blockchain node
./scripts/start-blockchain.sh
```

### 2. Database Setup

```bash
# Create database and run migrations
./scripts/init-database.sh
```

Or manually:
```bash
createdb company_review_db
psql -d company_review_db -f backend/database/migrations/001_initial_schema.sql
```

### 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm start
```

## 🔧 Configuration

### Backend Environment Variables

Edit `backend/.env`:

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=company_review_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Blockchain
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_CHAIN_ID=110261
CONTRACT_ADDRESS=0xYourContractAddress
DEPLOYER_ADDRESS=0xd9232DB885e7db72eb0e55c25622e7C9413c4350
DEPLOYER_PASSWORD=admin123

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Blockchain Configuration

The blockchain uses:
- **Chain ID**: 110261
- **Network ID**: 110261
- **Consensus**: Clique (Proof of Authority)
- **Block Time**: 15 seconds
- **Accounts**:
  - Deployer: `0xd9232DB885e7db72eb0e55c25622e7C9413c4350`
  - Validator: `0x2c8983281c3aab992cdfb3eb5a4afe2c139aeae1`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Companies
- `GET /api/companies` - List all companies
- `GET /api/companies/:id` - Get company details
- `GET /api/companies/:id/reviews` - Get company reviews
- `GET /api/companies/search?q=name` - Search companies
- `POST /api/companies` - Create company (protected)

### Reviews
- `POST /api/reviews` - Submit review (protected)
- `GET /api/reviews/:id` - Get review details
- `GET /api/reviews/:id/verify` - Verify review on blockchain
- `GET /api/reviews/user` - Get user's reviews (protected)

### Verifications
- `POST /api/verifications` - Submit employment verification (protected)
- `GET /api/verifications` - Get user verifications (protected)
- `GET /api/verifications/:companyId` - Check verification status (protected)

## 🔐 Security Features

1. **Password Hashing**: bcrypt with 12 rounds
2. **JWT Authentication**: Secure token-based auth
3. **Data Privacy**: Keccak256 hashing for PII
4. **Rate Limiting**: API rate limiting enabled
5. **CORS Protection**: Configured CORS policies
6. **SQL Injection Prevention**: Parameterized queries

## 🧪 Testing

### Test User Creation

```bash
# Register via API
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### Submit Test Review

1. Login and get token
2. Verify employment
3. Submit review

## 📱 Usage Guide

### For Users

1. **Register an Account**
   - Go to http://localhost:3000/register
   - Fill in your details
   - Verify your email (auto-approved in MVP)

2. **Browse Companies**
   - View list of companies
   - See ratings and reviews
   - Search by company name

3. **Submit a Review**
   - Click on a company
   - Click "Write a Review"
   - Verify your employment (enter employee ID)
   - Rate the company (1-5 stars)
   - Write your review (optional)
   - Submit to blockchain

4. **View Your Reviews**
   - Go to Dashboard
   - See all your submitted reviews
   - Check blockchain transaction hashes

### For Administrators

1. **Add New Company**
   ```bash
   curl -X POST http://localhost:3001/api/companies \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "companyName": "New Company",
       "industry": "Technology",
       "location": "Jakarta"
     }'
   ```

## 🛠️ Maintenance

### View Logs

```bash
# Blockchain logs
tail -f logs/blockchain.log

# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log
```

### Stop All Services

```bash
./scripts/stop-all.sh
```

### Restart Services

```bash
./scripts/stop-all.sh
./scripts/start-all.sh
```

### Reset Blockchain

```bash
./scripts/stop-all.sh
rm -rf blockchain/data/geth
./scripts/init-blockchain.sh
./scripts/start-all.sh
# Redeploy contract
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :8545  # Blockchain
lsof -i :3001  # Backend
lsof -i :3000  # Frontend

# Kill the process
kill $(lsof -t -i:8545)
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Test connection
psql -U postgres -d company_review_db -c "SELECT 1"
```

### Contract Deployment Failed

```bash
# Ensure blockchain is running
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check account balance
cd blockchain
python3 -c "from web3 import Web3; w3=Web3(Web3.HTTPProvider('http://localhost:8545')); print(w3.eth.get_balance('0xd9232DB885e7db72eb0e55c25622e7C9413c4350'))"
```

## 📈 Future Enhancements

- [ ] Manual employment verification workflow
- [ ] File upload for employment proof (IPFS integration)
- [ ] Advanced analytics dashboard
- [ ] Review moderation system
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Public blockchain deployment option

## 📄 License

MIT License

## 👥 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review logs in the `logs/` directory
- Open an issue on GitHub

---

**Built with ❤️ using Ethereum, React, and Node.js**
