# ❓ Frequently Asked Questions (FAQ)

Last Updated: December 22, 2025

---

## 📋 Table of Contents

1. [General Questions](#general-questions)
2. [Security & Privacy](#security--privacy)
3. [Wallet Management](#wallet-management)
4. [Transactions](#transactions)
5. [Features](#features)
6. [Troubleshooting](#troubleshooting)

---

## General Questions

### What is Octra Wallet?

Octra Wallet is a **non-custodial browser extension** for managing OCT (Octra cryptocurrency) and OCS01 tokens. It's 100% client-side, meaning your keys NEVER leave your device.

**Key features:**
- ✅ Direct blockchain connection (no servers)
- ✅ Bank-grade encryption (AES-256)
- ✅ Multi-wallet support
- ✅ Privacy features (FHE)
- ✅ Open source

### Is Octra Wallet free?

**YES, 100% free!**
- ❌ No subscription fees
- ❌ No hidden charges
- ❌ No premium tiers

**Only costs:**
- Network fees (paid to blockchain validators, not us)
- Typical: 0.001-0.005 OCT per transaction

### Is my data collected or sold?

**NO, NEVER.**

We don't collect:
- ❌ Email addresses
- ❌ Phone numbers
- ❌ IP addresses
- ❌ Usage analytics
- ❌ Transaction history
- ❌ Anything

**Your data stays on YOUR device. Period.**

📖 Full details: [Privacy Policy](../privacy/PRIVACY_POLICY.md)

### Can I use Octra Wallet on mobile?

**Not yet.**  
Currently desktop browsers only:
- Chrome (Windows, Mac, Linux)
- Firefox (Windows, Mac, Linux)
- Edge (Windows, Mac)

📱 **Mobile app coming in 2026** (planned)

### Is Octra Wallet open source?

**YES!** Fully open source under MIT License.

**GitHub**: https://github.com/irhamuba/octra-wallet

**Why this matters:**
- ✅ Anyone can audit the code
- ✅ Transparent security
- ✅ Community-driven improvements
- ✅ No hidden backdoors

---

## Security & Privacy

### How secure is Octra Wallet?

**Very secure** - Industry-standard cryptography:

| Component | Security Level |
|-----------|----------------|
| Encryption | AES-256-GCM (military-grade) |
| Signatures | Ed25519 (128-bit security) |
| Hashing | SHA-256 |
| Key Derivation | PBKDF2 (100,000 iterations) |

📖 Full analysis: [Security Architecture](../security/ARCHITECTURE.md)

### What if I forget my password?

**You can recover using your 12-word recovery phrase.**

**Steps:**
1. Click "Forgot Password" (or "Import Wallet")
2. Enter your 12-word phrase
3. Set a NEW password
4. Wallet restored!

**⚠️ If you lose BOTH password AND recovery phrase:**
- Your funds are **gone forever**
- We CANNOT help (no backdoor by design)
- This is the nature of decentralized wallets

### Where are my private keys stored?

**On YOUR device ONLY**, in browser Local Storage.

**Encrypted with:**
- Your password (via PBKDF2 → AES-256-GCM)
- Never transmitted over internet
- Never stored on our servers (we have no servers!)

**When unlocked:**
- Keys loaded into RAM temporarily
- Wiped from memory after 5 minutes (auto-lock)
- Wiped immediately after signing transactions

### Can Octra Wallet access my keys?

**NO. Absolutely not.**

We don't have:
- ❌ Your private keys
- ❌ Your passwords
- ❌ Your recovery phrases
- ❌ Backdoor access

**This is by design.**  
We CHOSE not to have this access because the safest wallet is one where even the creators can't access user funds.

### Is my transaction history tracked?

**Locally: YES (on your device)**
- History saved in Local Storage (not encrypted)
- Used to show your past transactions
- Never sent to us

**Remotely: NO**
- We don't track your transactions
- We don't have analytics
- We don't log anything

**On Blockchain: YES (public)**
- All blockchain transactions are public
- Anyone can see: from, to, amount
- This is how blockchains work

**For privacy:** Use FHE encrypted balance feature.

### How does the Privacy (FHE) feature work?

**FHE = Fully Homomorphic Encryption**

**What it does:**
- Encrypt your balance on the blockchain
- Only YOU (with password) can decrypt
- Network can still validate transactions without seeing balance

**Example:**
- Real balance: 100 OCT
- Encrypted balance on chain: `0xa3f8...b91c` (looks random)
- Public can't see you have 100 OCT

**Limitations:**
- Experimental feature
- Higher gas fees
- Not all wallets support it

📖 More: https://docs.octra.org/privacy/fhe

### What happens if my computer is hacked?

**If hacker has access WHILE wallet is unlocked:**
- ⚠️ They can steal keys from RAM
- **Mitigation**: Auto-lock after 5 minutes

**If hacker has access WHILE wallet is locked:**
- ✅ They CANNOT decrypt (need password)
- ✅ Keys are encrypted with AES-256

**Best practices:**
- Use antivirus software
- Don't install pirated software
- Don't click suspicious links
- Keep OS updated

---

## Wallet Management

### How many wallets can I create?

**Unlimited!**

Each wallet has its own:
- Address
- Private key
- Recovery phrase
- Name (customizable)

**Use cases:**
- Personal wallet
- Business wallet
- Savings wallet
- Testing wallet

### Can I rename my wallet?

**YES!**

1. Click wallet name dropdown (top)
2. Click pencil icon next to wallet
3. Type new name
4. Press Enter

**Note:** Only the name changes, not the address or keys.

### Can I delete a wallet?

**YES, but be careful!**

**Deleting removes wallet from THIS device only.**
- If you have recovery phrase → Can import again later
- If you DON'T have recovery phrase → Funds lost forever

**To delete:**
1. Settings → Security → Advanced → Remove Wallet
2. Select wallet to remove
3. Confirm (requires password)

### How do I export/backup my wallet?

**Method 1: Recovery Phrase (Recommended)**
- Write down 12 words on paper
- Store in safe place
- Can restore on ANY device

**Method 2: JSON File**
1. Settings → Backup → Export Wallet
2. Enter password
3. Save `.json` file to USB or secure location

⚠️ **WARNING**: JSON file contains encrypted private key. Anyone with file + password = access to funds.

### Can I import a wallet from another app?

**YES, if you have:**
- ✅ 12-word recovery phrase (BIP39 standard)
- ✅ Private key (hex or base64)

**NOT compatible with:**
- ❌ 24-word phrases (not supported yet)
- ❌ MetaMask/Ethereum wallets (different blockchain)
- ❌ Bitcoin wallets

---

## Transactions

### What are network fees?

**Network fees** (also called "gas fees") are paid to blockchain validators for processing your transaction.

**Fee levels:**
- **Slow**: 0.001 OCT (~30 sec)
- **Normal**: 0.002 OCT (~15 sec) ← Most used
- **Fast**: 0.005 OCT (~5 sec)

**Who gets the fee?**
- Validators (miners/stakers) on Octra Network
- NOT Octra Wallet (we don't collect fees)

### Can I cancel a transaction?

**NO - Blockchain transactions are irreversible.**

Once you click "Send" and transaction is broadcast:
- Cannot be cancelled
- Cannot be reversed
- Cannot be refunded

**Always:**
- Double-check recipient address
- Verify amount
- Start with small test transactions

### Why is my transaction stuck?

**Common causes:**
1. **Low fee** - Network busy, higher fee transactions prioritized
2. **Network congestion** - Many transactions at once
3. **Invalid transaction** - Rare (usually rejected immediately)

**Solutions:**
- Wait 5-10 minutes
- Check transaction status in History tab
- Next time, use "Fast" fee

### What's the maximum I can send?

**Maximum = Your balance - Network fee**

**Example:**
- Balance: 10 OCT
- Fee: 0.002 OCT
- Max you can send: 9.998 OCT

**Use "MAX" button** to auto-calculate maximum amount.

### What if I send to wrong address?

**Unfortunately, funds are lost.**

Blockchain transactions are:
- Irreversible
- Immediate
- No customer support to reverse

**Prevention:**
- Always double-check address
- Send small test amount first
- Use address book (future feature)
- Copy-paste (don't type manually)

### How long do transactions take?

**Typical times:**
- Slow fee: 30-60 seconds
- Normal fee: 10-20 seconds
- Fast fee: 5-10 seconds

**Factors affecting speed:**
- Network congestion
- Fee amount
- Validator availability

**Delayed?**
- Wait 5 minutes
- Click refresh button
- Check blockchain explorer (if available)

---

## Features

### Does Octra Wallet support tokens?

**YES!** Supports OCS01 tokens (Octra's token standard).

**To add custom token:**
1. Home → Assets → "+" button
2. Enter contract address
3. Enter symbol & decimals
4. Click "Add Token"

**Supported:**
- ✅ OCS01 tokens (Octra standard)
- ❌ ERC-20 (Ethereum) - Different blockchain
- ❌ BEP-20 (BSC) - Different blockchain

### Does Octra Wallet support NFTs?

**Partially.**

**Current:**
- NFT tab available
- Can view NFT balance
- Basic NFT display

**Coming soon:**
- NFT marketplace integration
- Transfer NFTs
- NFT metadata display

### Can I swap/exchange tokens?

**⚠️ SWAP FEATURE NOT AVAILABLE YET**

**Status:** Under development by Octra Network team

**When ready:**
- Direct OCT ↔ Token swaps
- Low fees
- Decentralized (no custody)
- Expected: Q1 2026 (tentative)

**Current alternatives:**
- Use centralized exchanges (CEX)
- Wait for official launch

**⚠️ WARNING:** Do NOT use third-party "Octra Swaps" (likely scams)

📖 **Updates**: https://docs.octra.org/features/swap

### Can I stake OCT?

**Not in wallet yet.**

**Staking** (if Octra Network supports it):
- Must be done via Octra Network directly
- Not wallet feature (blockchain feature)

📖 **Check**: https://docs.octra.org/staking

### Can I connect to DApps?

**Not yet - Coming in v2.0.**

**Planned features:**
- WalletConnect support
- DApp browser
- Web3 injection

**Current workaround:**
- Use wallet for storage
- Interact with DApps via their native interfaces

### Does Octra Wallet have a mobile app?

**Not yet.**

**Currently:** Desktop browser extension only

**Future:**
- iOS app (planned 2026)
- Android app (planned 2026)
- Same security, mobile-optimized UI

---

## Troubleshooting

### Extension won't open after clicking icon

**Solutions:**
1. Reload extension:
   - Chrome: `chrome://extensions` → Toggle off/on
   - Firefox: `about:debugging` → Reload

2. Clear browser cache

3. Check browser version (Chrome 90+, Firefox 88+)

4. Reinstall extension

### "RPC Error" or "Network Error"

**Cause:** Cannot connect to `https://octra.network`

**Solutions:**
1. Check internet connection
2. Verify firewall not blocking
3. Try different RPC URL (Settings → Network → Custom RPC)
4. Wait 5 minutes (network may be down temporarily)

### Balance shows 0 but I have funds

**Solutions:**
1. Click refresh button (top right)
2. Wait 30 seconds for RPC sync
3. Check correct network selected (Mainnet/Testnet)
4. Verify wallet address on blockchain explorer

### "Insufficient Balance" error when sending

**Causes:**
- Trying to send more than you have
- Forgetting to account for network fee

**Solution:**
- Use "MAX" button (auto-calculates fee)
- Or manually: Send amount = Balance - Fee

### Password not accepting (but I know it's correct)

**Solutions:**
1. Check Caps Lock is OFF
2. Try copy-pasting from password manager
3. Look for extra spaces
4. If truly forgotten → Use recovery phrase

### Can't import wallet with recovery phrase

**Common issues:**
1. **Wrong order** - Words must be in exact order
2. **Typos** - Check spelling carefully
3. **Extra words** - Must be exactly 12 words
4. **Wrong phrase** - Verify you're using correct wallet's phrase

**Verification:**
- Try importing in another BIP39 wallet (e.g., Trust Wallet)
- If works there → Contact us (might be bug)
- If doesn't work → Wrong phrase

### Extension using too much memory/CPU

**Normal:**
- Initial load: ~50-100 MB RAM
- Idle: ~30-50 MB RAM

**High usage:**
- Unlocked: ~100-150 MB (keys in RAM)
- Many wallets: ~20 MB per wallet

**If excessive (>500 MB):**
1. Lock wallet (clears RAM)
2. Close/reopen extension
3. Report issue: https://github.com/irhamuba/octra-wallet/issues

---

## Still Need Help?

### 📚 Documentation
- [User Guide](../getting-started/USER_GUIDE.md) - Complete walkthrough
- [Security Architecture](../security/ARCHITECTURE.md) - Technical details
- [Privacy Policy](../privacy/PRIVACY_POLICY.md) - Data handling

### 🌐 Official Resources
- **Octra Docs**: https://docs.octra.org/
- **GitHub**: https://github.com/irhamuba/octra-wallet
- **Issues**: https://github.com/irhamuba/octra-wallet/issues

### 💬 Community
- Discord: (Coming soon)
- Telegram: (Coming soon)
- Twitter: (Coming soon)

---

<div align="center">

**Can't find your question?**  
[Ask on GitHub Discussions](https://github.com/irhamuba/octra-wallet/discussions)

</div>
