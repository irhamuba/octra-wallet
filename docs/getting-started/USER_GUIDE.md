# 📖 User Guide - Octra Wallet

**Welcome to Octra Wallet!** This complete guide will help you get started with your secure, non-custodial wallet.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Creating Your First Wallet](#2-creating-your-first-wallet)
3. [Importing an Existing Wallet](#3-importing-an-existing-wallet)
4. [Sending OCT](#4-sending-oct)
5. [Receiving OCT](#5-receiving-oct)
6. [Managing Multiple Wallets](#6-managing-multiple-wallets)
7. [Privacy Features](#7-privacy-features)
8. [Security Settings](#8-security-settings)
9. [Swap Feature (Coming Soon)](#9-swap-feature-coming-soon)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Getting Started

### Installation

**Chrome:**
1. Visit Chrome Web Store (link coming soon)
2. Click "Add to Chrome"
3. Click "Add Extension"
4. Octra Wallet icon appears in toolbar

**Firefox:**
1. Visit Firefox Add-ons (link coming soon)
2. Click "Add to Firefox"
3. Click "Add"
4. Octra Wallet icon appears in toolbar

**Manual (Developer Mode):**
1. Download `octra-wallet-extension-v1.0.0.zip`
2. Unzip the file
3. Chrome: `chrome://extensions` → Enable "Developer mode" → "Load unpacked"
4. Firefox: `about:debugging` → "This Firefox" → "Load Temporary Add-on"

---

## 2. Creating Your First Wallet

### Step-by-Step

1. **Click the Octra Wallet extension icon**
   - It opens a popup window

2. **Choose "Create New Wallet"**
   - Click the blue button

3. **Set a Strong Password**
   - Minimum 8 characters
   - Use mix of letters, numbers, symbols
   - You'll need this EVERY TIME you unlock the wallet
   
   ⚠️ **IMPORTANT**: If you forget this password, we CANNOT reset it. Your funds will be lost.

4. **Write Down Your Recovery Phrase**
   - You'll see 12 words (e.g., "apple banana cherry...")
   - Write these on PAPER (not digital)
   - Store in a SAFE place
   - NEVER share with anyone
   
   🚨 **CRITICAL**: This is the ONLY way to recover your wallet if you forget your password or lose access.

5. **Verify Your Recovery Phrase**
   - You'll be asked to select the words in order
   - This confirms you wrote them down correctly

6. **Done!**
   - Your wallet is created
   - You'll see your wallet address (oct...)

### What You Get

- **Public Address**: `oct1abc...xyz` (46-47 characters)
  - This is like your bank account number
  - Safe to share
  - Use this to RECEIVE funds

- **Private Keys**: Hidden (encrypted)
  - Like your PIN code
  - NEVER share

- **Recovery Phrase**: 12 words
  - Like your master key
  - Can restore wallet on any device

---

## 3. Importing an Existing Wallet

### From Recovery Phrase

1. **Click "Import Existing Wallet"**

2. **Enter Your 12-Word Phrase**
   - Type the words in order
   - Separated by spaces
   - Case doesn't matter

3. **Set a New Password**
   - Can be different from before
   - You'll use this on THIS device

4. **Done!**
   - Wallet imported
   - Your balance and address are restored

### From JSON File

(Feature coming in v1.1)

---

## 4. Sending OCT

### How to Send

1. **Click "Send" button** on the dashboard

2. **Enter Recipient Address**
   - Must start with "oct"
   - 46 or 47 characters
   - Example: `oct1abc...xyz`
   
   ⚠️ **Double-check the address!** Transactions are irreversible.

3. **Enter Amount**
   - Up to 6 decimal places
   - Example: `0.123456`
   - Click "MAX" to send all (minus fee)

4. **Choose Network Fee**
   - **Slow**: 0.001 OCT (~30 seconds)
   - **Normal**: 0.002 OCT (~15 seconds) ← Recommended
   - **Fast**: 0.005 OCT (~5 seconds)

5. **Review Transaction**
   - Verify recipient address
   - Verify amount
   - Verify fee
   - Verify total (amount + fee)

6. **Click "Send"**
   - Transaction is signed and broadcast
   - You'll see a success animation
   - Transaction appears in History

### Transaction Limits

- **Minimum**: 0.000001 OCT
- **Maximum**: Your available balance - fee
- **Precision**: 6 decimal places

### Transaction Status

After sending, your transaction goes through:
1. **Pending** (⏳) - Broadcast to network
2. **Confirming** (🔄) - Being validated
3. **Confirmed** (✅) - Included in blockchain (final)

Check status: Dashboard → History tab

---

## 5. Receiving OCT

### Share Your Address

1. **Click "Receive" button**

2. **Your address is shown as:**
   - Text (copyable)
   - QR code (scannable)

3. **Share with the sender:**
   - Click "Copy Address" button
   - OR screenshot the QR code
   - OR manually type it

### Waiting for Funds

- **No action needed** - Just wait
- Funds arrive automatically when sender broadcasts
- You'll see balance update (may take 10-60 seconds)
- Click refresh icon to check immediately

### Verifying Receipt

- Check your balance in the dashboard
- Or check History tab
- Or check on blockchain explorer: https://octra.network/explorer (if available)

---

## 6. Managing Multiple Wallets

### Creating Additional Wallets

1. **Click wallet name** at the top
2. **Click "+ Add Wallet"**
3. **Choose:**
   - **Create New** - Generate fresh wallet
   - **Import Existing** - From recovery phrase
4. **Follow same steps** as initial wallet creation

### Switching Between Wallets

1. **Click current wallet name** (top of popup)
2. **Select wallet** from dropdown
3. **Enter password** to unlock (if locked)

### Renaming Wallets

1. **Click wallet name dropdown**
2. **Click pencil icon** next to wallet
3. **Type new name**
4. **Press Enter**

### Removing Wallets

⚠️ **WARNING**: This deletes wallet from THIS device only. If you have the recovery phrase, you can import it again.

1. **Settings → Security → Advanced**
2. **Click "Remove Wallet"**
3. **Confirm** (requires password)

---

## 7. Privacy Features

### Encrypted Balance (FHE)

**What is it?**  
Store your balance encrypted on the blockchain. Only you (with password) can see the real amount.

**How to use:**
1. **Privacy tab → Enable FHE**
2. **Enter amount to encrypt**
3. **Transaction is broadcast** with encrypted value
4. **Only you can decrypt** your true balance

**Use cases:**
- Hide wealth from public blockchain explorers
- Privacy for business transactions
- Protection from targeted attacks

**Limitations:**
- FHE is experimental
- Requires network support
- Slightly higher fees

📖 **Learn more**: https://docs.octra.org/privacy/fhe

### Private Transactions

(Feature coming in v1.2 - Pending Octra Network implementation)

---

## 8. Security Settings

### Auto-Lock Timer

**Default**: 5 minutes

**Change:**
1. **Settings → Security → Auto-Lock**
2. **Select time**: 1, 5, 10, 30 minutes, Never
3. **Recommended**: 5 minutes

### Change Password

1. **Settings → Security → Change Password**
2. **Enter current password**
3. **Enter new password** (twice)
4. **All wallets re-encrypted** with new password

### Backup Wallet

1. **Settings → Backup → Export Wallet**
2. **Enter password**
3. **JSON file downloads** with:
   - Public key
   - Private key (encrypted)
   - Address
   
   ⚠️ **Keep this file safe!** Anyone with this file + password can access your funds.

### Clear All Data

🚨 **DANGER ZONE**

This will DELETE all wallets, settings, and history from this device.

**Before doing this:**
- ✅ Backup recovery phrases
- ✅ Export wallet JSON files
- ✅ Verify backups work

**To clear:**
1. **Settings → Security → Advanced → Clear All Data**
2. **Confirm** (requires password)
3. **Extension resets** to fresh state

---

## 9. Swap Feature (Coming Soon)

### ⚠️ SWAP NOT AVAILABLE YET

The Swap feature (OCT ↔ Other Tokens) is **currently in development** by the Octra Network team.

**Expected features:**
- OCT to USDT
- OCT to BTC (wrapped)
- Low slippage
- Decentralized (no custody)

**When will it be ready?**
- Target: Q1 2026 (tentative)
- Follow updates: https://docs.octra.org/

**What to do now?**
- Use centralized exchanges for swaps
- Or wait for official Octra Swap launch
- **DO NOT** use third-party swaps claiming to support Octra (likely scams)

📖 **Latest updates**: https://docs.octra.org/features/swap

---

## 10. Troubleshooting

### Common Issues

#### "Password Incorrect"

**Solution:**
- Double-check password (case-sensitive)
- Try copy-pasting if using password manager
- If truly forgotten → Use recovery phrase to import wallet with NEW password

#### "Transaction Failed"

**Reasons:**
- Insufficient balance (need amount + fee)
- Invalid recipient address
- Network congestion

**Solution:**
- Check balance
- Verify recipient address format
- Try increasing fee to "Fast"
- Wait 5 minutes and retry

#### "Balance Not Updating"

**Solution:**
- Click refresh icon (top right)
- Wait 30 seconds
- Check RPC settings (Settings → Network)
- Verify internet connection

#### "Extension Won't Open"

**Solution:**
- Reload extension: Chrome Extensions → Turn off/on
- Clear browser cache
- Reinstall extension
- Check browser version (Chrome 90+, Firefox 88+)

### Advanced Troubleshooting

#### Check Console Logs

1. Right-click extension icon → "Inspect Popup"
2. Console tab → Look for errors
3. Screenshot and report: https://github.com/irhamuba/octra-wallet/issues

#### Reset Extension

⚠️ **This deletes all data!** Backup first!

1. **Settings → Clear All Data**
2. **Reinstall extension**
3. **Import wallets** from recovery phrases

---

## Need More Help?

### Resources

- 📖 **Full Documentation**: https://docs.octra.org/
- ❓ **FAQ**: [docs/troubleshooting/FAQ.md](../troubleshooting/FAQ.md)
- 🐛 **Report Bug**: https://github.com/irhamuba/octra-wallet/issues
- 💬 **Community**: (Discord/Telegram coming soon)

### Contact

- **GitHub**: https://github.com/irhamuba/octra-wallet
- **Email**: (Coming soon)
- **Twitter**: (Coming soon)

---

<div align="center">

**Happy Wallet Usage! 🚀**

Remember: Your keys, your crypto. Stay safe!

</div>
