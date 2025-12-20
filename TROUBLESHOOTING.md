# TROUBLESHOOTING GUIDE: RPC Connection Issues

## Quick Diagnostic Checklist

### 1. Check Vercel Deployment Status
- Go to: https://vercel.com/your-username/octra-wallet
- Check latest deployment
- Should include: /api/rpc folder
- Status: Ready (green)

### 2. Test Edge Function Directly

Open browser console on your Vercel URL and run:

```javascript
// Test 1: Direct Edge Function
fetch('/api/rpc/staging')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

// Expected: {"count":0,"staged_transactions":[]}
// If error: Check logs below
```

### 3. Check Edge Function Logs

In Vercel Dashboard:
1. Go to Deployments → Latest
2. Click "Functions" tab
3. Look for "/api/rpc/[...path]"
4. Check logs for errors

---

## Common Issues & Fixes

### Issue A: 404 - Function Not Found

**Symptom:** `/api/rpc/staging` returns 404

**Cause:** Edge Function not deployed

**Fix:**
1. Check if `api/rpc/[...path].js` exists in repo
2. Redeploy: `git commit --allow-empty -m "redeploy" && git push`
3. Wait 2-3 minutes

---

### Issue B: 500 - Internal Server Error

**Symptom:** Edge Function returns 500

**Cause:** Code error in Edge Function

**Fix:**
Check function logs in Vercel for error message

---

### Issue C: CORS Still Blocked

**Symptom:** Console shows CORS error even with proxy

**Cause:** Request not going through proxy

**Fix:**
Verify RPC client is using `/api/rpc`:

```javascript
// In browser console:
localStorage.getItem('settings')
// Should show: "rpcUrl":"/api/rpc" or similar
```

---

### Issue D: Timeout

**Symptom:** Request hangs for 15s then fails

**Cause:** octra.network is down or slow

**Fix:**
Check if octra.network is accessible:
```bash
curl https://octra.network/staging
```

---

## Alternative Solution: User-Side RPC Input

If proxy keeps failing, allow users to configure RPC themselves:

### Option 1: Use Public CORS Proxy (NOT RECOMMENDED)
```javascript
rpcUrl: 'https://corsproxy.io/?https://octra.network'
```

### Option 2: Run Local Octra Node
```bash
git clone https://github.com/octra/node
cd node
./run.sh
# Then use: http://localhost:8080
```

### Option 3: Contact Octra Team
Ask them to enable CORS on their server

---

## Debug Commands

Run these in browser console:

```javascript
// 1. Check current RPC URL
const settings = JSON.parse(localStorage.getItem('settings') || '{}')
console.log('RPC URL:', settings.rpcUrl)

// 2. Test proxy
fetch('/api/rpc/staging').then(r => r.text()).then(console.log)

// 3. Check if Edge Function exists
fetch('/api/rpc').then(r => console.log('Status:', r.status))

// 4. Test direct (will fail with CORS)
fetch('https://octra.network/staging').then(r => r.text()).then(console.log)
```

---

## Expected Behavior

### Working Setup:
```
Browser → /api/rpc/balance/oct1xxx
         ↓ (Vercel Edge Function)
         → https://octra.network/balance/oct1xxx
         ↓ (add CORS headers)
         ← {"balance":"10.5","nonce":5}
         ↓
Browser ✅ Shows balance
```

### Broken Setup:
```
Browser → https://octra.network/balance/oct1xxx
         ↓ (direct fetch)
         ❌ CORS blocked
         
Browser ❌ Balance: 0 or error
```

---

## Contact Support

If all else fails:

1. **Vercel Support:**
   - https://vercel.com/support
   - Show them Edge Function code

2. **Octra Team:**
   - Ask to enable CORS
   - Or provide alternative RPC endpoint

3. **GitHub Issue:**
   - Open issue in octra-wallet repo
   - Include browser console errors
