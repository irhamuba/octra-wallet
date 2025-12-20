# Future: Jika Octra Fix CORS

## Cara Revert ke Direct Connection

Jika octra.network sudah support CORS (menambahkan header), Anda bisa:

### Option 1: Keep Proxy (Recommended)
**Tidak perlu ubah apapun!**
- Proxy tetap works
- Lebih reliable
- No changes needed

### Option 2: Direct Connection (Optional)
Jika ingin remove proxy overhead (~50ms):

**File: `src/utils/rpc.js`**

```javascript
// CHANGE:
const DEFAULT_RPC = isDev ? '/api' : '/api/rpc';

// BACK TO:
const DEFAULT_RPC = isDev ? '/api' : RPC_URLS.testnet;
```

**Then DELETE:** `/api/rpc/[...path].js`

**Benefit:** Slightly faster (no proxy)
**Trade-off:** Depends on Octra CORS stability

---

## Skenario Lain (Tidak Perlu Ubah)

### ✅ Change RPC Endpoint
User bisa ganti RPC via Settings → RPC Endpoint
- Tidak perlu ubah code
- User-friendly

### ✅ Multiple Networks
Sudah support testnet & mainnet
- Tinggal set VITE_MAINNET_RPC_URL

### ✅ Custom RPC
Proxy automatically handles custom RPC
- No code changes needed

---

## Kesimpulan

**SHORT ANSWER:** TIDAK PERLU UBAH! ✅

Setup sekarang sudah:
- ✅ Production-ready
- ✅ Future-proof
- ✅ User-configurable
- ✅ Scalable

Proxy akan tetap work forever, regardless of Octra changes.
