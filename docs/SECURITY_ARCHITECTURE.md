# 🏗️ Octra Wallet Technical Security Architecture

This document provides a deep dive into the security implementation of Octra Wallet for developers and auditors.

## 1. Threat Model & Mitigations

| Threat | Mitigation Strategy | Implementation |
| :--- | :--- | :--- |
| **XSS (Cross-Site Scripting)** | **React Escaping** + **Strict CSP** | `vercel.json` headers block unauthorized scripts. React prevents variable injection. |
| **Local Storage Theft** | **AES-GCM Encryption** | Data stored in `localStorage` is encrypted blob. Useless without user password. |
| **Brute-Force Password** | **PBKDF2 (600k Iterations)** | High-iteration hashing makes guessing passwords computationally expensive (NIST 2023 Standard). |
| **Supply Chain Attack** | **SRI (Subresource Integrity)** | `vite-plugin-sri` hashes all build files. Browser rejects modified files from CDN. |
| **Memory Dump** | **Active Memory Wiping** | `secureWipe()` overwrites sensitive variables with `0` immediately after use. |

## 2. Cryptography Stack

### A. Authentication & Key Derivation
- **Algorithm:** PBKDF2 (Password-Based Key Derivation Function 2)
- **Hash Function:** SHA-256
- **Iterations:** 600,000 (High Security)
- **Salt:** Static per-version salt (v1) combined with dynamic user inputs.
- **Reference:** `src/utils/storage.js` -> `deriveKey`

### B. Payload Encryption (The Vault)
- **Algorithm:** AES-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **Key Size:** 256-bit
- **IV Size:** 12 bytes (Generated securely via `crypto.getRandomValues`)
- **Tag Size:** 128-bit (Auth Tag)
- **Reference:** `src/utils/storage.js` -> `encryptData`

### C. Blockchain Signatures
- **Curve:** Ed25519 (Octra Network Standard)
- **Library:** `tweetnacl.js` (Audited, Pure JS)
- **Reference:** `src/services/KeyringService.js`

## 3. Critical Code Paths

### Signing a Transaction
1. **User Request:** User clicks "Send" in `SendView.jsx`.
2. **Unlock:** `KeyringService` checks if `_decryptedKeys` are in memory.
3. **Sign:** `nacl.sign.detached(msg, secretKey)` is called.
4. **Wipe:** `secretKey` variable is overwritten with zeros immediately.
5. **Broadcast:** Signed hex string is sent to RPC (`rpc.js`).

### Locking the Wallet
1. **Trigger:** Timer (5 mins) or Manual Click.
2. **Action:** `KeyringService.lock()` is called.
3. **Wipe:** `_decryptedKeys` Map is cleared and overwritten.
4. **State:** App returns to `LockScreen`.

## 4. Deployment Security (Vercel)

The `vercel.json` configuration applies the following headers to EVERY response:

```json
"Content-Security-Policy": "default-src 'self'; ...",
"X-Frame-Options": "DENY",             // Anti-Clickjacking
"X-Content-Type-Options": "nosniff",   // Anti-MIME Sniffing
"Referrer-Policy": "strict-origin...", // Privacy
"Permissions-Policy": "camera=()..."   // Hrdware Access Blocked
```

---
**Maintained by:** Octra Dev Team
**Last Update:** Dec 2025
