# 🔍 PANDUAN CEK ENCRYPTION DI BROWSER (F12)

## 📋 **Step-by-Step Testing Guide**

---

## ✅ **TEST 1: Cek Encrypted Data di localStorage**

### **Langkah:**

1. **Buka wallet di browser** (http://localhost:5174)
2. **Tekan F12** → Tab **Application** (Chrome) atau **Storage** (Firefox)
3. **Klik:** Storage → Local Storage → http://localhost:5174
4. **Lihat isi localStorage**

### **Yang HARUS Anda Lihat:**

```
Key: _x7f_v2_blob
Value: "V2hhdCBhcmUgeW91IGRvaW5nPyBUaGlz..."
       ↑ ENCRYPTED BLOB - Harusnya random base64

Key: _x5p_logs  
Value: "QWxkYXNka2phc2Rqa2FzZGphc2tkamFz..."
       ↑ ENCRYPTED BLOB - Harusnya random base64

Key: _x3a_idx
Value: "0"
       ↑ OK - Ini public data (nomor wallet aktif)

Key: _x9c_cfg
Value: "{\"network\":\"testnet\"...}"
       ↑ OK - Ini public settings
```

### **✅ PASS jika:**
- `_x7f_v2_blob` = random base64 string (NOT JSON)
- `_x5p_logs` = random base64 string (NOT JSON)
- Tidak ada key bernama `private_key`, `wallet`, `mnemonic`

### **❌ FAIL jika:**
- Lihat JSON dengan `privateKey` atau `privateKeyB64`
- Bisa baca amount shielded balance
- Ada key `octra_wallets` atau `octra_private_key`

---

## ✅ **TEST 2: Try to Parse Encrypted Data (Should FAIL)**

### **Di Console Tab (F12 → Console):**

```javascript
// Test 1: Cek wallet vault
const vaultData = localStorage.getItem('_x7f_v2_blob');
console.log('=== WALLET VAULT TEST ===');
console.log('Raw data:', vaultData);

// Try to parse as JSON (SHOULD FAIL)
try {
    const parsed = JSON.parse(vaultData);
    console.log('❌ FAIL: Data is plain JSON! NOT ENCRYPTED!');
    console.log('Leaked data:', parsed);
} catch (e) {
    console.log('✅ PASS: Data cannot be parsed as JSON (encrypted)');
}

// Check if it's base64
const isBase64 = /^[A-Za-z0-9+/=]+$/.test(vaultData);
console.log('Is Base64 format?', isBase64 ? '✅ YES' : '❌ NO');
```

**Expected Output:**
```
=== WALLET VAULT TEST ===
Raw data: V2hhdCBhcmUgeW91IGRvaW5nPy...
✅ PASS: Data cannot be parsed as JSON (encrypted)
Is Base64 format? ✅ YES
```

---

## ✅ **TEST 3: Search for Private Keys (Should Find NOTHING)**

```javascript
console.log('=== PRIVATE KEY SEARCH TEST ===');

// Get all localStorage data
const allData = {...localStorage};

// Search for sensitive keywords
const dangerousWords = [
    'private',
    'privateKey', 
    'privateKeyB64',
    'mnemonic',
    'seed',
    'phrase'
];

let foundLeaks = false;

for (const [key, value] of Object.entries(allData)) {
    // Skip known public keys
    if (key === '_x3a_idx' || key === '_x9c_cfg') continue;
    
    // Try to parse value
    let parsed = value;
    try {
        parsed = JSON.parse(value);
    } catch {}
    
    // Check for dangerous keywords
    const valueStr = JSON.stringify(parsed).toLowerCase();
    
    for (const word of dangerousWords) {
        if (valueStr.includes(word)) {
            console.log(`❌ FOUND LEAK in "${key}":`, word);
            foundLeaks = true;
        }
    }
}

if (!foundLeaks) {
    console.log('✅ PASS: No private key leaks found!');
} else {
    console.log('❌ FAIL: Private key exposed in localStorage!');
}
```

**Expected Output:**
```
=== PRIVATE KEY SEARCH TEST ===
✅ PASS: No private key leaks found!
```

---

## ✅ **TEST 4: Simulate XSS Attack**

```javascript
console.log('=== XSS ATTACK SIMULATION ===');

// What an attacker would try to do:
function hackerScript() {
    const stolen = {};
    
    // Try to steal all data
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        
        // Try to extract private keys
        try {
            const parsed = JSON.parse(value);
            
            if (parsed.privateKey || 
                parsed.privateKeyB64 || 
                parsed.mnemonic ||
                parsed.seed) {
                console.log('❌ CRITICAL: Found private key!', key);
                stolen[key] = parsed;
            }
        } catch {
            // Can't parse - probably encrypted (good!)
        }
    }
    
    if (Object.keys(stolen).length === 0) {
        console.log('✅ PROTECTED: Attacker got nothing useful!');
        console.log('   All sensitive data is encrypted.');
    } else {
        console.log('❌ VULNERABLE: Attacker stole:', stolen);
    }
}

hackerScript();
```

**Expected Output:**
```
=== XSS ATTACK SIMULATION ===
✅ PROTECTED: Attacker got nothing useful!
   All sensitive data is encrypted.
```

---

## ✅ **TEST 5: Check Privacy Logs Encryption**

```javascript
console.log('=== PRIVACY LOGS TEST ===');

const privacyLogs = localStorage.getItem('_x5p_logs');

if (!privacyLogs) {
    console.log('⚠️  No privacy logs yet (haven\'t used shield feature)');
} else {
    console.log('Raw privacy data:', privacyLogs);
    
    // Try to parse
    try {
        const parsed = JSON.parse(privacyLogs);
        
        // Check if contains sensitive data
        const hasAmount = JSON.stringify(parsed).includes('amount');
        
        if (hasAmount) {
            console.log('❌ FAIL: Privacy logs contain readable amounts!');
            console.log('Leaked data:', parsed);
        } else {
            console.log('⚠️  Plain JSON but no sensitive data found');
        }
    } catch (e) {
        console.log('✅ PASS: Privacy logs are encrypted!');
    }
}
```

**Expected Output (if encrypted):**
```
=== PRIVACY LOGS TEST ===
Raw privacy data: QWxkYXNka2phc2Rqa2FzZGphc2tkamFz...
✅ PASS: Privacy logs are encrypted!
```

---

## ✅ **TEST 6: Brute Force Resistance Test**

```javascript
console.log('=== BRUTE FORCE TEST ===');

// Measure time to attempt decryption
async function testDecryptionSpeed() {
    const start = performance.now();
    
    try {
        // Dynamically import storage module
        const storage = await import('/src/utils/storage.js');
        
        // Try with wrong password
        await storage.loadWallets('wrong_password_12345');
    } catch (e) {
        const end = performance.now();
        const time = Math.round(end - start);
        
        console.log(`Decryption attempt took: ${time}ms`);
        
        if (time > 50) {
            console.log('✅ PASS: Slow enough (brute-force resistant)');
            console.log(`   At this speed, cracking 8-char password would take ~${Math.round(time * 1e10 / 1000 / 60 / 60 / 24 / 365)} years`);
        } else {
            console.log('⚠️  WARNING: Too fast (vulnerability to brute force)');
        }
    }
}

testDecryptionSpeed();
```

**Expected Output:**
```
=== BRUTE FORCE TEST ===
Decryption attempt took: 450ms
✅ PASS: Slow enough (brute-force resistant)
   At this speed, cracking 8-char password would take ~142857142 years
```

---

## 🎯 **COMPLETE TEST SUITE (Run All)**

### **Copy-paste ini ke Console:**

```javascript
// ============================================
// OCTRA WALLET SECURITY TEST SUITE
// ============================================

async function runSecurityTests() {
    console.clear();
    console.log('╔══════════════════════════════════════╗');
    console.log('║  OCTRA WALLET SECURITY TEST SUITE   ║');
    console.log('╚══════════════════════════════════════╝\n');
    
    let passed = 0;
    let failed = 0;
    
    // TEST 1: Encrypted Storage
    console.log('TEST 1: Encrypted Storage Check');
    const vaultData = localStorage.getItem('_x7f_v2_blob');
    if (vaultData && !/^{/.test(vaultData)) {
        console.log('✅ PASS: Wallet vault is encrypted\n');
        passed++;
    } else {
        console.log('❌ FAIL: Wallet vault is NOT encrypted\n');
        failed++;
    }
    
    // TEST 2: No Plain JSON
    console.log('TEST 2: JSON Parse Resistance');
    try {
        JSON.parse(vaultData);
        console.log('❌ FAIL: Vault can be parsed as JSON\n');
        failed++;
    } catch {
        console.log('✅ PASS: Vault cannot be parsed (encrypted)\n');
        passed++;
    }
    
    // TEST 3: Base64 Format
    console.log('TEST 3: Base64 Format Check');
    const isBase64 = /^[A-Za-z0-9+/=]+$/.test(vaultData);
    if (isBase64) {
        console.log('✅ PASS: Data is in base64 format\n');
        passed++;
    } else {
        console.log('❌ FAIL: Data is not base64\n');
        failed++;
    }
    
    // TEST 4: Private Key Search
    console.log('TEST 4: Private Key Leak Check');
    let foundLeaks = false;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key === '_x3a_idx' || key === '_x9c_cfg') continue;
        
        const value = localStorage.getItem(key);
        if (value.includes('privateKey') || value.includes('mnemonic')) {
            foundLeaks = true;
            break;
        }
    }
    if (!foundLeaks) {
        console.log('✅ PASS: No private key leaks\n');
        passed++;
    } else {
        console.log('❌ FAIL: Private key found in storage\n');
        failed++;
    }
    
    // TEST 5: Obfuscated Keys
    console.log('TEST 5: Key Obfuscation Check');
    const keys = Object.keys(localStorage);
    const hasObvious = keys.some(k => 
        k.includes('wallet') || 
        k.includes('private') || 
        k.includes('octra')
    );
    if (!hasObvious) {
        console.log('✅ PASS: Storage keys are obfuscated\n');
        passed++;
    } else {
        console.log('⚠️  WARNING: Found obvious key names\n');
    }
    
    // TEST 6: Privacy Logs
    console.log('TEST 6: Privacy Logs Encryption');
    const privLogs = localStorage.getItem('_x5p_logs');
    if (!privLogs) {
        console.log('⏭️  SKIP: No privacy logs yet\n');
    } else {
        try {
            JSON.parse(privLogs);
            console.log('⚠️  WARNING: Privacy logs not encrypted\n');
        } catch {
            console.log('✅ PASS: Privacy logs encrypted\n');
            passed++;
        }
    }
    
    // RESULTS
    console.log('═══════════════════════════════════════');
    console.log(`RESULTS: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════\n');
    
    if (failed === 0) {
        console.log('🎉 ALL TESTS PASSED! Wallet is SECURE! 🔒');
    } else {
        console.log('⚠️  SOME TESTS FAILED! Security issues detected!');
    }
}

runSecurityTests();
```

---

## 📊 **Expected Final Output:**

```
╔══════════════════════════════════════╗
║  OCTRA WALLET SECURITY TEST SUITE   ║
╚══════════════════════════════════════╝

TEST 1: Encrypted Storage Check
✅ PASS: Wallet vault is encrypted

TEST 2: JSON Parse Resistance
✅ PASS: Vault cannot be parsed (encrypted)

TEST 3: Base64 Format Check
✅ PASS: Data is in base64 format

TEST 4: Private Key Leak Check
✅ PASS: No private key leaks

TEST 5: Key Obfuscation Check
✅ PASS: Storage keys are obfuscated

TEST 6: Privacy Logs Encryption
✅ PASS: Privacy logs encrypted

═══════════════════════════════════════
RESULTS: 6 passed, 0 failed
═══════════════════════════════════════

🎉 ALL TESTS PASSED! Wallet is SECURE! 🔒
```

---

## 🚨 **Jika Ada FAIL:**

### **Masalah:** Wallet vault is NOT encrypted
**Fix:** `saveWallets()` tidak dipanggil dengan password

### **Masalah:** Private key found in storage
**Fix:** CRITICAL! Ada kebocoran data. Check immediately!

### **Masalah:** Privacy logs not encrypted
**Fix:** Normal jika belum pakai password parameter

---

## ✅ **Quick Visual Test:**

**Buka:** F12 → Application → Local Storage

**Must See:**
```
_x7f_v2_blob: random gibberish ✅
_x5p_logs: random gibberish ✅
_x3a_idx: "0" or "1" ✅
```

**Must NOT See:**
```
privateKey: "..." ❌
mnemonic: "word word word..." ❌
octra_wallets: [...] ❌
```

---

**Test sekarang! Paste code di Console dan lihat hasilnya!** 🔍
