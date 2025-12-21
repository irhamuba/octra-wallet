# 🛡️ Octra Wallet Security Architecture

**Version:** 1.0.0 (Mainnet Ready)
**Type:** Non-Custodial Client-Side Wallet
**Last Audit:** 2025-12-21

## 🔒 Core Security Specification

This document outlines the security mechanisms implemented in the Octra Wallet codebase.

---

### 1. Key Derivation (Password Hashing)
We use industry-standard derivation to turn user passwords into strong encryption keys.

- **Algorithm:** **PBKDF2-SHA256**
- **Iterations:** **600,000** (Compliant with NIST 2023 Guidelines)
- **Implementation File:** [`src/utils/storage.js`](src/utils/storage.js) (Line 34: `deriveKey`)
- **Comparison:**
  - MetaMask uses ~10,000-100,000 iterations.
  - Octra uses 600,000 iterations (6x-60x stronger resistance against brute-force).

### 2. Data Encryption (At Rest)
All sensitive data (Private Keys, Seed Phrases) is encrypted before being saved to browser storage.

- **Algorithm:** **AES-256-GCM** (Galois/Counter Mode)
- **Key Length:** 256-bit
- **IV (Nonce):** 12 bytes random (Unique per encryption)
- **Implementation File:** [`src/utils/storage.js`](src/utils/storage.js) (Line 61: `encryptData`)
- **Storage Location:** `localStorage` key `_x7f_v2_blob`

### 3. Memory Hygiene (Anti-RAM Analysis)
Private keys are kept in memory for the shortest time possible.

- **Mechanism:** `secureWipe` (Overwrites memory with 0s)
- **Trigger:** Immediately after signing a transaction or locking the wallet.
- **Implementation File:** [`src/services/KeyringService.js`](src/services/KeyringService.js) (Line 27: `secureWipe`)

### 4. Network Security (Anti-XSS & Injection)
We implement strict browser policies to prevent malicious scripts.

- **Content Security Policy (CSP):**
  - **Status:** **Active** (Strict Whitelist)
  - **Config File:** [`vercel.json`](vercel.json)
  - **Protection:** Blocks loading scripts/images from unauthorized domains.
- **Subresource Integrity (SRI):**
  - **Status:** **Active** (SHA-384)
  - **Config File:** [`vite.config.js`](vite.config.js)
  - **Protection:** Prevents CDN tampering of JS/CSS files.

### 5. Privacy & Shielded Data
Octra-specific privacy features are handled with double encryption.

- **Shielded Balance:** Encrypted on-chain (FHE) + Encrypted local storage (AES-GCM).
- **Implementation:** [`src/services/PrivacyService.js`](src/services/PrivacyService.js)

---

## 📂 Security File Map

| Feature | Implementation File | Key Function |
| :--- | :--- | :--- |
| **Password Hashing** | `src/utils/storage.js` | `deriveKey(password)` |
| **Wallet Encryption** | `src/utils/storage.js` | `encryptData(data, key)` |
| **Key Managment** | `src/services/KeyringService.js` | `signTransaction()`, `secureWipe()` |
| **CSP Headers** | `vercel.json` | `"Content-Security-Policy"` |
| **Asset Integrity** | `vite.config.js` | `vite-plugin-sri` |

---

## ⚠️ Security Notes for Auditors
1. **Argon2 Status:** The codebase contains `src/utils/encryptionArgon2.js` for future upgrades (V2), but the active production version currently relies on the native `PBKDF2` (WebCrypto API) for better performance and zero-dependency loading.
2. **Client-Side Only:** This is a purely non-custodial wallet. No private keys are ever sent to any server.

---

**Report Vulnerabilities:**
If you find a security flaw, please open a GitHub Issue or contact the developer directly.
