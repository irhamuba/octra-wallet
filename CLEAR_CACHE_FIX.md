# ⚠️ URGENT FIX: Clear Browser Cache

## Problem

Console shows:
```
Access to fetch at 'https://octra.network/staging'
```

This means wallet is using OLD RPC URL (direct fetch), not the new proxy (`/api/rpc`).

## Root Cause

**localStorage cached old RPC URL** from previous deployment.

Even though we updated the code, browser still uses cached settings.

## SOLUTION

### For Users:

1. **Open browser console** (F12)
2. **Run this command:**
   ```javascript
   localStorage.clear()
   ```
3. **Reload page** (Ctrl+R or F5)
4. **Re-import/create wallet**

### Alternative (Manual):

1. Settings → Reset (if available)
2. Or: Browser → Clear Site Data → localhost/vercel domain
3. Reload

---

## For Developers:

### Force RPC Update on App Load

Add to `App.jsx` or `main.jsx`:

```javascript
// Force update RPC URL on version change
const APP_VERSION = '1.1.0';
const storedVersion = localStorage.getItem('app_version');

if (storedVersion !== APP_VERSION) {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    
    // Force update to proxy
    settings.rpcUrl = import.meta.env.DEV ? '/api' : '/api/rpc';
    
    localStorage.setItem('settings', JSON.stringify(settings));
    localStorage.setItem('app_version', APP_VERSION);
    console.log('[Migration] Updated RPC to proxy');
}
```

This auto-migrates users to new proxy on first load after update.

---

## Verification

After clearing localStorage, run in console:

```javascript
// Check RPC URL
const settings = JSON.parse(localStorage.getItem('settings') || '{}');
console.log('RPC URL:', settings.rpcUrl);

// Should be: '/api/rpc' (production) or '/api' (dev)
// NOT: 'https://octra.network'

// Test fetch
fetch('/api/rpc/staging')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Should return: {"count":0,"staged_transactions":[]}
```

---

## Prevention

To prevent this in future:

1. **Versioned localStorage** - Check app version on load
2. **Migration scripts** - Auto-update old settings
3. **Clear cache on deploy** - Service Worker update
4. **Force refresh** - Show "Update available" banner

---

## Status Checks

### ✅ Good (Using Proxy):
```javascript
{
  "rpcUrl": "/api/rpc"  // or "/api" in dev
}
```

### ❌ Bad (Direct Fetch):
```javascript
{
  "rpcUrl": "https://octra.network"  // OLD!
}
```

---

## Quick Fix for Production

If many users affected, add to `src/utils/storage.js`:

```javascript
// Migration: Force proxy for octra.network
export function migrateSettings() {
    const settings = getSettings();
    
    if (settings.rpcUrl === 'https://octra.network') {
        const isDev = import.meta.env.DEV;
        settings.rpcUrl = isDev ? '/api' : '/api/rpc';
        saveSettings(settings);
        console.log('🔧 Migrated RPC to proxy');
    }
}

// Call on app start
migrateSettings();
```
