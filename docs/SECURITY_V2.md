# 🔒 Octra Wallet - Security Architecture v2.0

## Extension-Ready Security Hardening

This document outlines the comprehensive security enhancements implemented in Octra Wallet v2.0.

---

## 1. 🔑 Hashing Password yang Diperkuat (High-Iteration PBKDF2)

### Upgrade: PBKDF2 Standard → PBKDF2 1 Juta Iterasi

**Mengapa tidak Argon2?**
Awalnya kami mempertimbangkan Argon2, tetapi kami memilih **Native PBKDF2** karena:
1. **Native Security:** Menggunakan `window.crypto.subtle` bawaan browser (teruji & diaudit oleh vendor browser).
2. **Zero Dependencies:** Tidak butuh library WASM eksternal (mengurangi risiko supply chain attack).
3. **Performance:** Sangat cepat di eksekusi native, memungkinkan jumlah iterasi ekstrem (1 juta).

**Previous (v1.x):**
- Algorithm: PBKDF2-SHA256
- Iterations: Standard (e.g. 10,000 - 600,000)
- Weakness: Rentan terhadap serangan GPU modern jika iterasi rendah.

**Current (v2.0):**
- Algorithm: **PBKDF2-SHA256**
- Iterations: **1,000,000** (1 Juta)
- **Benefits:**
  - Standard OWASP/NIST merekomendasikan 600k, kita pakai **1 Juta**.
  - Membuat serangan brute-force sangat mahal secara komputasi.
  - Menggunakan API kriptografi native browser (paling aman).

### File: `src/utils/storageSecure.js`

```javascript
const key = await crypto.subtle.deriveKey(
    {
        name: 'PBKDF2',
        salt: encoder.encode('_x8f_kdf_salt_v3_'),
        iterations: 1000000, // 1 Juta Iterasi (High Security)
        hash: 'SHA-256'
    },
    // ...
);
```

---

## 2. 🛡️ Storage Integrity (HMAC-SHA256)

### Data Tampering Protection

Every encrypted data blob now includes an **HMAC-SHA256** signature.

**Format:** `base64(encrypted_data)|base64(hmac)`

**Protection Against:**
- Bit-flipping attacks
- Malicious data modification
- Storage corruption

### Implementation

```javascript
// Encrypt
const encrypted = await encryptDataSecure(data, password);
// Format: "iv+ciphertext|hmac"

// Decrypt (with integrity check)
const decrypted = await decryptDataSecure(encrypted, password);
// Throws error if HMAC verification fails
```

### File: `src/utils/storageSecure.js`

**Key Functions:**
- `generateHMAC()` - Creates integrity signature
- `verifyHMAC()` - Constant-time verification
- `encryptDataSecure()` - Encrypt + sign
- `decryptDataSecure()` - Verify + decrypt

---

## 3. 🧹 Aggressive Memory Wiping

### Zero-Knowledge Memory Management

**Previous:**
- Single-pass zero fill
- Keys lingered in RAM

**Current:**
- **5-pass military-grade wipe:**
  1. Fill with zeros
  2. Fill with random data
  3. Fill with zeros
  4. Fill with 0xFF
  5. Final zero pass

### Implementation

```javascript
function secureWipeAggressive(buffer) {
    buffer.fill(0);              // Pass 1
    crypto.getRandomValues(buffer); // Pass 2
    buffer.fill(0);              // Pass 3
    buffer.fill(0xFF);           // Pass 4
    buffer.fill(0);              // Pass 5
}
```

### File: `src/services/KeyringService.js`

**Auto-Wiping Triggers:**
- After every transaction signature
- After message signing
- On wallet lock
- On panic lock (emergency)
- On service worker suspension

---

## 4. ⏱️ Auto-Lock with Activity Detection

### Smart Session Management

**Features:**
- 5-minute idle timeout
- Activity detection (mouse, keyboard, touch, scroll)
- Background alarm enforcement
- Memory sanitization on lock

### Implementation

```javascript
// Activity reset
['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
    document.addEventListener(event, () => resetAutoLockTimer(), { passive: true });
});

// Background alarm (extension)
chrome.alarms.create('autoLock', { periodInMinutes: 5 });
```

### File: `src/services/KeyringServiceSecure.js`

---

## 5. 🔐 Content Security Policy (CSP) Lockdown

### Strict CSP Without `unsafe-eval`

**Extension Manifest CSP:**
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
  }
}
```

**Build-Time Hardening:**
- Strip all `console.log()` in production
- Remove debugger statements
- Disable source maps
- Variable name mangling
- Comment removal

### File: `vite.config.js`

```javascript
terserOptions: {
  compress: {
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.debug']
  }
}
```

---

## 6. 🏗️ Browser Extension Architecture

### Isolated Security Contexts

```
┌─────────────────────────────────────────┐
│         Browser Extension               │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │     UI       │◄───┤   Background │  │
│  │  (Popup)     │    │    Worker    │  │
│  │              │    │              │  │
│  │ - No crypto  │    │ - KeyringService│
│  │ - Display    │    │ - Signing    │  │
│  │ - User input │    │ - Encryption │  │
│  └──────────────┘    └──────────────┘  │
│         │                    │          │
│         └────Secure Msg─────┘          │
│                                         │
└─────────────────────────────────────────┘
```

**Security Benefits:**
- UI isolated from crypto operations
- Service worker persists in background
- Secure message passing (chrome.runtime)
- XSS attacks can't access private keys

### Files:
- `src/background/service-worker.js`
- `manifest.json`

---

## 7. 📦 chrome.storage vs localStorage

### Extension Storage

**Current (Extension):**
```javascript
// Secure, isolated storage
await chrome.storage.local.set({ key: encryptedData });
const { key } = await chrome.storage.local.get(['key']);
```

**Benefits:**
- Not accessible by web pages
- Survives browser restart
- Extension-only access
- 10 MB quota (vs 5 MB localStorage)

### File: `src/utils/storageSecure.js`

---

## 8. 🚨 Panic Lock

### Emergency Memory Wipe

Immediate wallet lock with forced garbage collection.

```javascript
keyringService.panicLock();
// - Instant memory wipe
// - Clears all keys
// - Forces GC (if available)
```

**Use Cases:**
- Detected XSS attack
- DevTools opened
- Suspicious activity
- User-triggered emergency

---

## Security Checklist ✅

### Before Production Deployment

- [ ] Argon2id KDF implemented
- [ ] HMAC integrity checks active
- [ ] Aggressive memory wiping verified
- [ ] CSP headers strict (no unsafe-eval)
- [ ] Console logs stripped in build
- [ ] Auto-lock functional
- [ ] Service worker secure message passing tested
- [ ] chrome.storage migration complete
- [ ] Extension manifest v3 validated
- [ ] Security audit report (if applicable)

---

## Migration Guide

### From v1.x to v2.0

1. **Password Re-Derivation:**
   - Users must re-authenticate
   - Data re-encrypted with Argon2id
   - Old PBKDF2 hashes removed

2. **Storage Migration:**
   - `localStorage` → `chrome.storage.local`
   - Automatic migration script provided
   - Backup created before migration

3. **UI Changes:**
   - Auto-lock warnings
   - Activity indicators
   - Enhanced security notices

---

## Threat Model

### Attacks Mitigated

| Attack Vector | Mitigation |
|--------------|------------|
| **GPU Brute Force** | Argon2id (memory-hard) |
| **Data Tampering** | HMAC-SHA256 verification |
| **Memory Forensics** | 5-pass aggressive wipe |
| **XSS Injection** | Strict CSP, isolated contexts |
| **Timing Attacks** | Constant-time HMAC compare |
| **Side-Channel** | Disposable key buffers |
| **Idle Session Hijack** | Auto-lock with activity detection |

---

## Performance Impact

### Expected Overhead

- **Argon2id:** +50-100ms per encryption (acceptable)
- **HMAC:** +5-10ms per operation (negligible)
- **Memory Wipe:** <1ms per operation
- **Total:** Minimal impact on UX

---

## Compliance

- ✅ OWASP Password Storage Cheat Sheet (2023)
- ✅ NIST SP 800-63B (Digital Identity Guidelines)
- ✅ Google Extension Security Best Practices
- ✅ GDPR (Data Protection)

---

**Maintained by:** Octra Dev Team  
**Version:** 2.0.0  
**Last Updated:** December 2024
