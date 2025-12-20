# RPC Connection Diagnostics

## Test RPC Endpoint

Run this to check if RPC is accessible:

```bash
# Test 1: Check if RPC is online
curl -v https://octra.network/staging

# Test 2: Check CORS headers
curl -I -X OPTIONS https://octra.network/staging \
  -H "Origin: https://octra-ubawallet.vercel.app" \
  -H "Access-Control-Request-Method: GET"

# Test 3: Try actual balance request
curl https://octra.network/balance/oct1test123
```

## Common Issues

### 1. CORS Error
**Symptom:** "Connection failed" in browser, works in curl
**Solution:** 
- Contact Octra team to whitelist your domain
- Or use proxy/middleware

### 2. CSP Blocking
**Check:** Browser console for CSP violations
**Fix:** Update vercel.json CSP

### 3. Network Timeout
**Check:** Request takes >15s
**Fix:** Increase timeout in rpc.js

## Browser Console Commands

Open browser console and run:

```javascript
// Test direct fetch
fetch('https://octra.network/staging')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

// Check CSP
console.log(document.querySelector('meta[http-equiv*="Content"]'))
```
