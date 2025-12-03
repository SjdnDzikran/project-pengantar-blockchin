# DChain Blockchain Setup Guide

This guide explains how to switch from local blockchain to DChain public blockchain.

## Prerequisites

1. **DChain RPC URL** - Get from DChain documentation or provider
   - Example: `https://rpc.dchain.network` or `https://dchain-testnet-rpc.example.com`

2. **DChain Chain ID** - Network identifier
   - Mainnet: (check DChain docs)
   - Testnet: (check DChain docs)

3. **Wallet with funds** - You need native DChain tokens for:
   - Deploying smart contract (one-time cost)
   - Submitting reviews (ongoing cost per review)

4. **Wallet private key or keystore**
   - For deploying: Use deployer account
   - For users: MetaMask will sign transactions

## Configuration Steps

### 1. Update Backend Environment Variables

Edit `backend/.env`:

```env
# Blockchain - DChain Configuration
BLOCKCHAIN_RPC_URL=https://rpc.dchain.network  # Replace with actual DChain RPC
BLOCKCHAIN_CHAIN_ID=12345                      # Replace with actual DChain ID
CONTRACT_ADDRESS=                              # Leave empty, will fill after deployment
DEPLOYER_ADDRESS=0xYourDeployerAddress         # Your wallet address
DEPLOYER_PASSWORD=YourPassword                 # Password for keystore (if using)
```

### 2. Update Deployment Script

Edit `blockchain/deploy.py`:

```python
# Configuration
RPC_URL = 'https://rpc.dchain.network'  # DChain RPC URL
DEPLOYER_ADDRESS = '0xYourAddress'       # Your deployer wallet
CHAIN_ID = 12345                         # DChain Chain ID
```

### 3. Add MetaMask Network

Users need to add DChain to MetaMask:

**Network Details:**
- Network Name: DChain (or DChain Testnet)
- RPC URL: `https://rpc.dchain.network`
- Chain ID: `12345`
- Currency Symbol: DCHAIN (or appropriate symbol)
- Block Explorer: `https://explorer.dchain.network` (if available)

### 4. Deploy Contract to DChain

```bash
cd blockchain

# Make sure you have DChain tokens for gas
# Deploy contract
python3 deploy.py

# This will output the contract address
# Copy it to backend/.env as CONTRACT_ADDRESS
```

### 5. Update Frontend Configuration

The frontend will automatically use the chain ID from the connected wallet,
but you might want to add network detection:

Edit `frontend/src/store/walletStore.js` to validate chain ID:

```javascript
const EXPECTED_CHAIN_ID = 12345; // DChain Chain ID

connectWallet: async () => {
  // ... existing code ...
  
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
    throw new Error(`Please switch to DChain network (Chain ID: ${EXPECTED_CHAIN_ID})`);
  }
  
  // ... rest of code ...
}
```

## Security Considerations

### For Production Deployment:

1. **Never commit private keys** - Use environment variables only
2. **Use separate wallets:**
   - Deployer wallet (one-time use, can be less funded)
   - Application wallet (for backend operations, well-funded)
3. **Rate limiting** - Implement to prevent transaction spam
4. **Gas price management** - Monitor and adjust for network conditions

### Wallet Security:

```bash
# Store keystore file securely
chmod 600 blockchain/data/keystore/*

# Use strong passwords
# Consider hardware wallet for production
```

## Cost Estimation

Before deploying, estimate costs:

1. **Contract Deployment:**
   - One-time cost: ~200k-300k gas
   - Multiply by current gas price on DChain

2. **Per Review Submission:**
   - ~150k-200k gas per review
   - Budget accordingly

## Testing on Testnet First

**Highly recommended:** Deploy to DChain testnet first!

1. Get testnet tokens from DChain faucet
2. Deploy contract to testnet
3. Test all functionality
4. Then deploy to mainnet

## Troubleshooting

### Connection Issues:
```bash
# Test RPC connection
curl -X POST https://rpc.dchain.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Insufficient Funds:
- Check balance: Visit DChain explorer with your address
- Get tokens from exchange or bridge

### Wrong Network in MetaMask:
- Users must manually switch to DChain network
- Add helpful error messages in frontend

## DChain-Specific Resources

- Documentation: (Add DChain docs URL)
- Explorer: (Add DChain explorer URL)
- Faucet (testnet): (Add faucet URL if available)
- Community: (Add Discord/Telegram links)

## Post-Deployment Checklist

- [ ] Contract deployed successfully
- [ ] Contract address added to `.env`
- [ ] Backend can connect to DChain RPC
- [ ] MetaMask configured with DChain network
- [ ] Test review submission working
- [ ] Test blockchain verification working
- [ ] Gas costs acceptable
- [ ] Error handling for wrong network
- [ ] Documentation updated with contract address
