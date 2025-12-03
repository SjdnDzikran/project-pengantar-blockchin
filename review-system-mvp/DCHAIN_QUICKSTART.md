# Quick Start: Switch to DChain

Follow these steps to migrate from local blockchain to DChain.

## Step 1: Get DChain Network Information

You need the following information from DChain:

- **RPC URL**: The endpoint to connect to DChain
- **Chain ID**: Network identifier (e.g., 42069 for testnet, 12345 for mainnet)
- **Block Explorer**: (Optional) For viewing transactions
- **Faucet**: (For testnet) To get test tokens

## Step 2: Fund Your Wallet

Get DChain tokens for gas fees:
- **Testnet**: Use DChain faucet
- **Mainnet**: Purchase or bridge tokens

You'll need tokens for:
- Contract deployment: ~0.01-0.1 tokens (one-time)
- Review submissions: ~0.001-0.01 tokens per review

## Step 3: Configure Environment

```bash
cd review-system-mvp/backend

# Set environment variables
export DCHAIN_RPC_URL="https://rpc.dchain.network"
export DCHAIN_CHAIN_ID="12345"
export DEPLOYER_ADDRESS="0xYourWalletAddress"
export DEPLOYER_PRIVATE_KEY="your_private_key_without_0x"
```

Or create `.env` file:
```bash
cp .env.dchain.example .env
# Edit .env with your actual values
```

## Step 4: Test Connection

```bash
cd ../blockchain

# Test connection to DChain
python3 test_dchain_connection.py

# Should output: "DChain connection test PASSED!"
```

## Step 5: Deploy Smart Contract

```bash
# Deploy to DChain
python3 deploy_dchain.py

# Follow prompts and confirm deployment
# Copy the contract address from output
```

## Step 6: Update Backend Configuration

```bash
cd ../backend

# Edit .env and add:
# CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

## Step 7: Configure MetaMask

Add DChain network to MetaMask:

1. Open MetaMask → Networks → Add Network
2. Fill in:
   - **Network Name**: DChain
   - **RPC URL**: `https://rpc.dchain.network`
   - **Chain ID**: `12345`
   - **Currency Symbol**: DCHAIN
   - **Block Explorer**: (if available)
3. Save and switch to DChain network

## Step 8: Test the Application

```bash
# Start backend
cd backend
npm start

# Start frontend (new terminal)
cd ../frontend
npm start
```

Test:
1. Connect wallet (should show DChain network)
2. Submit a review (MetaMask will prompt for gas)
3. Verify review on blockchain

## Troubleshooting

### "Could not connect to DChain"
- Check RPC URL is correct
- Verify network is accessible
- Test with: `curl -X POST <RPC_URL> -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`

### "Insufficient funds"
- Check wallet balance on block explorer
- Get tokens from faucet (testnet) or exchange (mainnet)

### "Wrong network"
- Make sure MetaMask is on DChain network
- Check Chain ID matches

### "Transaction failed"
- Check gas price isn't too low
- Verify contract address is correct
- Check wallet has enough tokens for gas

## Production Checklist

Before going live:

- [ ] Tested on DChain testnet
- [ ] All features working
- [ ] Gas costs acceptable
- [ ] Smart contract audited (if handling real value)
- [ ] Error handling implemented
- [ ] Monitoring set up
- [ ] Backup plans for private keys
- [ ] User documentation updated

## Support

If you need help with DChain specifics:
- DChain Documentation: [Add URL]
- DChain Discord/Telegram: [Add URL]
- Block Explorer: [Add URL]

## Cost Comparison

| Operation | Local Blockchain | DChain Testnet | DChain Mainnet |
|-----------|-----------------|----------------|----------------|
| Deploy Contract | Free | Free (faucet) | ~$X USD |
| Submit Review | Free | Free (faucet) | ~$X USD |
| Read Data | Free | Free | Free |

Estimate your monthly costs based on expected review volume.
