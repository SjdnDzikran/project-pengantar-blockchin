# MetaMask Setup Guide for DChain

## Quick Setup Instructions

### Add DChain Network to MetaMask

1. **Open MetaMask** and click the network dropdown at the top
2. Click **"Add Network"** or **"Add Network Manually"**
3. Enter these details:

```
Network Name:     DChain
RPC URL:          https://mainnet.dchain.id/
Chain ID:         17845
Currency Symbol:  DC
Block Explorer:   (leave empty if not available)
```

4. Click **"Save"**
5. Switch to DChain network

---

## Visual Guide

### Step 1: Open Network Menu
Click the network dropdown (usually shows "Ethereum Mainnet")

### Step 2: Add Custom Network
- Scroll down and click "Add Network"
- Or click "Add network manually" at the bottom

### Step 3: Fill in DChain Details
```
┌─────────────────────────────────────┐
│ Network Name                        │
│ DChain                              │
├─────────────────────────────────────┤
│ New RPC URL                         │
│ https://mainnet.dchain.id/          │
├─────────────────────────────────────┤
│ Chain ID                            │
│ 17845                               │
├─────────────────────────────────────┤
│ Currency Symbol                     │
│ DC                                  │
├─────────────────────────────────────┤
│ Block Explorer URL (optional)       │
│                                     │
└─────────────────────────────────────┘
```

### Step 4: Save and Switch
- Click "Save"
- Network will be added to your list
- Switch to DChain network

---

## Import Your Wallet

### Option 1: Import Deployer Account (For Testing)
1. Click account icon → "Import Account"
2. Select "Private Key"
3. Paste: `88f6ac39fb51eceb05c3f07b405bb4771eed80d6888bae2e3ced4d99fcac65de`
4. Click "Import"

**⚠️ WARNING:** Only use this for testing! Never share or expose private keys for production wallets.

### Option 2: Use Your Own Wallet
1. Create new wallet in MetaMask
2. Save seed phrase securely
3. Get DChain tokens to pay for gas

---

## Get DChain Tokens

You'll need tokens for gas fees:

### For Testing
- Check if DChain has a testnet faucet
- Ask in DChain community for test tokens

### For Production
- Purchase from exchanges (if listed)
- Bridge from other networks (if available)
- Contact DChain team for initial tokens

**Current Balance:** Deployer account has 0.1 tokens

---

## Verify Connection

### Test in Browser Console
```javascript
// After connecting wallet
console.log('Connected to:', ethereum.chainId); // Should show: "0x45b5" (17845 in hex)
console.log('Network:', ethereum.networkVersion); // Should show: "17845"
```

### In Your App
1. Visit your application
2. Click "Connect Wallet"
3. MetaMask should show DChain network
4. Approve connection
5. Sign authentication message
6. You're connected!

---

## Common Issues

### "Wrong network" Error
**Solution:** Make sure MetaMask is switched to DChain network

### Can't Add Network
**Solution:** 
- Try using chain ID in decimal: `17845`
- Or hex: `0x45b5`
- Restart MetaMask

### "Insufficient funds for gas"
**Solution:** You need DChain tokens
- Current balance: Check in MetaMask on DChain network
- Get tokens from faucet or exchange

### Transaction Stuck
**Solution:**
- Wait for network confirmation (can take 10-30 seconds)
- Check gas price settings
- Cancel and retry with higher gas

---

## Network Details Reference

```
Network Name:  DChain
RPC URL:       https://mainnet.dchain.id/
Chain ID (Dec): 17845
Chain ID (Hex): 0x45b5
Block Time:    ~3-5 seconds (estimated)
Gas Price:     ~1.5 Gwei (current)
```

---

## Security Best Practices

### ✅ DO:
- Keep seed phrase secret and offline
- Use hardware wallet for production
- Double-check network before signing
- Verify transaction details
- Use separate wallets for testing/production

### ❌ DON'T:
- Share private keys
- Store keys in plain text
- Use same wallet for test and production
- Sign transactions you don't understand
- Keep large amounts in hot wallets

---

## For Users

Send this to your users:

```
To use the Company Review System:

1. Install MetaMask: https://metamask.io
2. Add DChain network:
   - Network Name: DChain
   - RPC URL: https://mainnet.dchain.id/
   - Chain ID: 17845
3. Get DChain tokens for gas
4. Visit the app and connect wallet
5. Start reviewing!

Note: Submitting reviews costs a small amount of DChain tokens (~0.0003 per review)
```

---

## Testing Checklist

After MetaMask setup:

- [ ] DChain network added
- [ ] Switched to DChain
- [ ] Wallet imported/created
- [ ] Has some tokens for gas
- [ ] Can connect to app
- [ ] Can sign messages
- [ ] Can submit transactions
- [ ] Transactions confirm successfully

---

## Need Help?

- **MetaMask Support:** https://support.metamask.io
- **DChain Support:** [Add DChain community links]
- **Your Contract:** `0x3f9c46CF69c93B39c6D7e21723b465514Dd66758`

---

**Ready to use DChain!** 🚀
