# 🔐 Privacy Policy - Octra Wallet

**Last Updated**: December 22, 2025  
**Version**: 1.0.0

---

## TL;DR (Too Long; Didn't Read)

**Your data NEVER leaves your device. We collect NOTHING.**

- ✅ 100% local storage
- ✅ Zero telemetry
- ✅ No servers
- ✅ No tracking
- ✅ Open source

**That's it. Read below for technical details.**

---

## 1. Introduction

Octra Wallet is a **non-custodial, client-side browser extension**. This means:

1. **We do not have access to your data**
2. **We do not store your data**
3. **We do not collect your data**
4. **We cannot reset your password**
5. **We cannot recover your wallet**

This privacy policy explains exactly what data exists, where it's stored, and who has access to it.

---

## 2. What Data We Store

### 2.1 Data Stored LOCALLY on Your Device

All data is stored in **Browser Local Storage** on YOUR device ONLY.

| Data Category | What It Contains | Encrypted? | Who Has Access? |
|---------------|------------------|------------|-----------------|
| **Wallet Data** | Private keys, public keys, addresses, wallet names | ✅ **YES** (AES-256-GCM) | **YOU ONLY** |
| **Password Hash** |SHA-256 hash of your master password | ✅ **YES** (SHA-256) | **YOU ONLY** |
| **Transaction History** | Your sent/received transactions (addresses & amounts) | ❌ No | **YOU ONLY** |
| **Settings** | RPC URL, theme preference, auto-lock timer | ❌ No | **YOU ONLY** |
| **Privacy Logs** | FHE encrypted balance operations (optional) | ✅ **YES** (AES-256-GCM with password) | **YOU ONLY** |

### 2.2 Data We DO NOT Store

❌ **Email addresses** - We don't have your email  
❌ **Phone numbers** - We don't have your phone  
❌ **IP addresses** - We don't log IP addresses  
❌ **Browser fingerprints** - We don't track you  
❌ **Analytics events** - No Google Analytics, Mixpanel, etc.  
❌ **Crash reports** - No Sentry, Bugsnag, etc.  
❌ **Usage statistics** - We don't know how you use the wallet  

---

## 3. Where Your Data Is Stored

### 3.1 Browser Local Storage

**Location**: `chrome.storage.local` or `localStorage` (depending on browser)

**Physical Location**: Your computer's hard drive

**Access**: Only this extension (Octra Wallet) can read this data

**Persistence**: Data persists until you:
- Uninstall the extension
- Clear browser data
- Manually delete via Settings → Clear All Data

### 3.2 Data Flow Diagram

```
┌─────────────┐
│ Your Device │
│             │
│  ┌────────────────────────────┐
│  │  Browser Local Storage     │
│  │                            │
│  │  ┌──────────────────────┐  │
│  │  │ Encrypted Wallet Data│  │  ← Protected by YOUR password
│  │  └──────────────────────┘  │
│  │                            │
│  │  ┌──────────────────────┐  │
│  │  │ Transaction History  │  │  ← Plain text (not sensitive)
│  │  └──────────────────────┘  │
│  │                            │
│  │  ┌──────────────────────┐  │
│  │  │ Settings             │  │  ← Plain text
│  │  └──────────────────────┘  │
│  └────────────────────────────┘
│
└─────────────┘

   NO CLOUD ☁️
   NO SERVERS 🖥️
   NO BACKUP 💾
```

---

## 4. Network Requests

### 4.1 What We Send to the Blockchain

The extension makes HTTP requests ONLY to:

**`https://octra.network`** (Octra Blockchain RPC Node)

**What we send:**
- Your **public address** (oct...) - To check balance
- **Transaction data** (when you send) - To broadcast to blockchain
- **Contract calls** (when using tokens) - To interact with smart contracts

**What we DON'T send:**
- ❌ Your private keys (NEVER transmitted)
- ❌ Your password (stays local)
- ❌ Your name, email, or personal info
- ❌ Your browser info or device ID

### 4.2 Third-Party Services

**NONE.** We use ZERO third-party services.

No:
- Google Analytics
- Mixpanel
- Sentry
- Amplitude
- Facebook Pixel
- Nothing.

---

## 5. Data Security

### 5.1 Encryption Standards

| Data | Algorithm | Key Derivation |
|------|-----------|----------------|
| **Wallet Private Keys** | AES-256-GCM | PBKDF2 (100,000 iterations, SHA-256) |
| **Password Storage** | SHA-256 Hash | SHA-256 with salt |
| **Privacy Data** | AES-256-GCM | PBKDF2 (100,000 iterations, SHA-256) |

### 5.2 Memory Safety

**Secure Memory Management:**
- Private keys are zeroed out after use
- Keys are never logged to console
- Auto-lock after 5 minutes of inactivity
- Panic lock on suspicious activity

**Technical Implementation:**
```javascript
// Keys are wiped from RAM after use
function secureWipe(data) {
  if (data instanceof Uint8Array) {
    data.fill(0);                    // Zero out
    crypto.getRandomValues(data);    // Random fill
    data.fill(0);                    // Zero again
  }
}
```

### 5.3 What Happens if You Lose Your Password?

**Your wallet is GONE. Forever.**

This is NOT a bug. This is by design:
- We don't have a "forgot password" feature
- We cannot reset your password
- We cannot decrypt your data
- There is NO backdoor

**Why?** Because true security means even WE can't access your data.

**Solution:** ALWAYS keep your 12-word recovery phrase safe.

---

## 6. User Rights (GDPR Compliance)

### 6.1 Right to Access

**You have access to ALL your data** via:
- Extension Settings → Export Wallet
- Browser DevTools → Application → Local Storage

### 6.2 Right to Deletion

**Delete your data anytime:**
1. Settings → Security → Clear All Data
2. Uninstall the extension
3. Browser Settings → Clear site data

### 6.3 Right to Portability

**Export your wallet:**
- Settings → Backup → Export as JSON
- Contains: address, public key, private key (encrypted)

---

## 7. Data Retention

### 7.1 How Long We Keep Data

**Forever** (or until you delete it).

**Why?** Because the data is on YOUR device, not our servers.

We don't:
- Have expiration policies (no server to expire)
- Delete your data automatically
- Have retention limits

**You** control when data is deleted.

### 7.2 What Happens When You Uninstall?

**Browser may keep data** in Local Storage even after uninstall.

**To fully delete:**
1. Uninstall extension
2. Clear browser data → Site data → `chrome-extension://[extension-id]`

---

## 8. Children's Privacy

This wallet is not intended for children under 13.

We don't:
- Collect age information
- Market to children
- Have age verification

**Parental responsibility:** Monitor your child's crypto usage.

---

## 9. Changes to This Privacy Policy

**We'll update this document if:**
- We add features that affect privacy
- Laws require changes
- Best practices evolve

**How you'll know:**
- Version number increases
- "Last Updated" date changes
- GitHub commit history

**You agree to:**
- Review this policy periodically
- Continue using = acceptance of changes

---

## 10. International Users

### 10.1 Where We Operate

**Everywhere** (it's a browser extension, no geographic restrictions).

### 10.2 Data Transfer

**No data transfer** happens because:
- Data stays on your device
- No servers to transfer to

**GDPR Compliance:**
- ✅ Data minimization (we collect nothing)
- ✅ Right to access (you have full access)
- ✅ Right to deletion (delete anytime)
- ✅ Right to portability (export feature)
- ✅ No automated decision-making

---

## 11. Contact Information

### Privacy-Related Questions

**GitHub Issues:** https://github.com/irhamuba/octra-wallet/issues

**Label:** `privacy` or `security`

**Email:** (Coming soon)

### Security Vulnerabilities

**Report to:** Create a security issue on GitHub

**Response Time:** We aim to respond within 48 hours

---

## 12. Technical Appendix

### 12.1 Data Schema

**Wallet Storage:**
```json
{
  "OCTRA_WALLETS": {
    "encrypted": true,
    "algorithm": "AES-256-GCM",
    "data": "[encrypted_blob]|[integrity_hash]"
  },
  "OCTRA_PASSWORD_HASH": {
    "encrypted": false,
    "algorithm": "SHA-256",
    "data": "sha256_hash_of_password"
  },
  "OCTRA_SETTINGS": {
    "encrypted": false,
    "data": {
      "network": "testnet",
      "rpcUrl": "https://octra.network",
      "theme": "dark",
      "autoLockMinutes": 5
    }
  }
}
```

### 12.2 Storage Keys Used

| Key Name | Purpose | Encrypted |
|----------|---------|-----------|
| `OCTRA_WALLETS` | Encrypted wallet data | ✅ |
| `OCTRA_PASSWORD_HASH` | Password verification | ✅ (hash) |
| `OCTRA_ACTIVE_WALLET` | Index of active wallet | ❌ |
| `OCTRA_TX_HISTORY_testnet` | Transaction history | ❌ |
| `OCTRA_SETTINGS` | User preferences | ❌ |
| `OCTRA_PRIVACY_LOGS` | FHE operation logs | ✅ |
| `OCTRA_PRIVACY_BALANCE_CACHE` | Encrypted balance cache | ✅ |

### 12.3 Permissions Used

**From `manifest.json`:**
```json
{
  "permissions": [
    "storage",        // Why: Store wallet data locally
    "alarms",         // Why: Auto-lock timer
    "notifications"   // Why: Transaction confirmations
  ],
  "host_permissions": [
    "https://octra.network/*"  // Why: Blockchain RPC only
  ]
}
```

**We do NOT request:**
- ❌ `tabs` - We don't track your browsing
- ❌ `webRequest` - We don't intercept requests
- ❌ `cookies` - We don't use cookies
- ❌ `history` - We don't access browsing history
- ❌ `<all_urls>` - We only access Octra RPC

---

## 13. Third-Party Code

### 13.1 Dependencies Used

| Library | Purpose | Privacy Impact |
|---------|---------|----------------|
| React | UI framework | ✅ None (local only) |
| TweetNaCl | Cryptography | ✅ None (no network) |
| BIP39 | Mnemonic generation | ✅ None (local only) |
| Lottie | Animations | ✅ None (embedded SVG) |
| QRCode.react | QR generation | ✅ None (canvas only) |

**All libraries run locally. ZERO network calls.**

### 13.2 Web Fonts

**We use Google Fonts** (loaded from Google CDN):
- Font: Inter, Roboto Mono (if used)
- **Privacy impact:** Google may log font requests (includes IP address)
- **Mitigation:** We're considering self-hosting fonts

---

## 14. Blockchain Privacy

### 14.1 On-Chain Data

**Everything on the blockchain is PUBLIC:**
- Your address (oct...)
- Your balance
- All transactions (from, to, amount)
- Transaction timestamps

**This wallet does NOT add privacy to blockchain.**

**For privacy:** Use the Privacy feature (FHE encrypted balance).

### 14.2 Privacy Features

**FHE (Fully Homomorphic Encryption):**
- Encrypt your balance
- Compute on encrypted data
- Only you can decrypt

**How it works:**
1. Your balance is encrypted with YOUR password
2. Encrypted balance is stored on blockchain
3. Only you (with password) can decrypt

**Privacy guarantee:** Even Octra Network cannot see your encrypted balance.

---

## 15. Your Responsibilities

### What You MUST Do

✅ **Keep your recovery phrase safe**  
✅ **Use a strong password (12+ characters)**  
✅ **Never share your private keys**  
✅ **Verify transaction details before sending**  
✅ **Keep your computer malware-free**  

### What You MUST NOT Do

❌ **Don't screenshot your recovery phrase**  
❌ **Don't store keys in cloud (Google Drive, Dropbox)**  
❌ **Don't share password with anyone**  
❌ **Don't use wallet on public/shared computers**  
❌ **Don't input seed phrase on phishing sites**  

---

## 16. Legal Basis for Processing (GDPR)

**We don't process your data** (no servers = no processing).

**Legal basis (if we did):**
- **Consent** - You install and use the extension
- **Legitimate Interest** - Providing wallet functionality

**But again:** We don't process data because everything is local.

---

## 17. Questions?

**Read these first:**
- [Security Architecture](../security/ARCHITECTURE.md)
- [User Guide](../getting-started/USER_GUIDE.md)
- [FAQ](../troubleshooting/FAQ.md)

**Still have questions?**
- GitHub Issues: https://github.com/irhamuba/octra-wallet/issues
- Discussions: https://github.com/irhamuba/octra-wallet/discussions

---

<div align="center">

**Your Privacy Matters. That's Why We Collect Nothing.**

Made with 🔐 for the Octra Community

</div>
