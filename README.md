# 🌐 Octra Wallet

A secure, modern web wallet for the Octra blockchain network with built-in privacy features powered by Fully Homomorphic Encryption (FHE).

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Security](https://img.shields.io/badge/security-AES--256--GCM-red.svg)

---

## ✨ Features

### 🔐 Core Features
- **Secure Wallet Management** - AES-256-GCM encryption for private keys
- **Multi-Wallet Support** - Manage multiple wallets in one interface
- **Password Protection** - PBKDF2 key derivation with 100k iterations
- **Import/Export** - Mnemonic phrase and private key support

### 🛡️ Privacy Features (FHE)
- **Shield Balance** - Convert public balance to encrypted (private) balance
- **Unshield Balance** - Convert private balance back to public
- **Private Transfers** - Send funds privately using FHE encryption
- **Claim Private Transfers** - Receive private transfers from others

### 🪙 Token Support
- **Native OCT Token** - Full support for Octra native token
- **OCS01 Tokens** - Support for custom tokens on Octra network
- **Token Management** - View balances and transfer all supported tokens

### 📊 Additional Features
- **Transaction History** - View all transaction types (Send, Receive, Shield, Private)
- **Real-time Balance** - Auto-refresh every 10 seconds
- **Network Support** - Testnet (mainnet coming soon)
- **Mobile Responsive** - Works on desktop and mobile devices

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

```bash
# Clone repository
git clone https://github.com/irhamuba/octra-wallet.git
cd octra-wallet

# Install dependencies
npm install

# (Optional) Configure environment variables
# Copy .env.example to .env.local and modify if needed
cp .env.example .env.local

# Start development server
npm run dev
```

The wallet will open at **http://localhost:5174**

**Note:** RPC URL defaults to `https://octra.network`. Override by setting `VITE_RPC_URL` in `.env.local` if needed.

---

## 📖 How to Use

### 1️⃣ First Time Setup

**Option A: Create New Wallet**
1. Click **"Create Wallet"**
2. Set a strong password (used to encrypt your wallet)
3. **CRITICAL:** Write down your 12-word mnemonic phrase
4. Store it in a safe place (you'll need it to recover your wallet)

**Option B: Import Existing Wallet**
1. Click **"Import Wallet"**
2. Enter your 12-word mnemonic phrase OR private key
3. Set a password
4. Click Import

### 2️⃣ Get Testnet Tokens

Visit the official faucet:
👉 **https://faucet.octra.network**

Enter your wallet address and request free testnet OCT tokens.

### 3️⃣ Send Transactions

1. Go to **"Send"** tab
2. Enter recipient address (starts with `oct`)
3. Enter amount
4. Select fee level (Low/Medium/High)
5. Confirm transaction

### 4️⃣ Use Privacy Features

**Shield Your Balance:**
1. Go to **"Privacy"** tab
2. Click **"Shield"**
3. Enter amount to shield (convert to private)
4. Confirm transaction

**Private Transfer:**
1. Ensure you have shielded balance
2. Click **"Transfer"** (in Privacy tab)
3. Enter recipient address
4. Enter amount
5. Send privately (recipient must claim)

**Claim Private Transfer:**
1. Go to **"Privacy"** tab
2. Click **"Claim"**
3. View pending transfers
4. Click claim on any pending transfer

---

## 🏗️ Project Structure

```
octra-wallet/
├── src/
│   ├── components/
│   │   ├── dashboard/       # Main wallet UI
│   │   ├── shared/          # Reusable components
│   │   └── welcome/         # Onboarding screens
│   ├── services/
│   │   ├── KeyringService.js      # Secure key management
│   │   ├── PrivacyService.js      # FHE privacy operations
│   │   ├── OCS01TokenService.js   # Token support
│   │   └── SecurityService.js     # Security utilities
│   ├── utils/
│   │   ├── crypto.js        # Cryptographic functions
│   │   ├── encryption.js    # Vault encryption
│   │   ├── storage.js       # Secure localStorage
│   │   └── rpc.js           # Blockchain RPC client
│   ├── App.jsx              # Main application
│   └── main.jsx             # Entry point
├── index.html
├── vite.config.js
└── package.json
```

---

## 🔒 Security Features

### Encryption
- **Wallet Data:** AES-256-GCM encryption
- **Private Keys:** Never stored in plain text
- **Password:** Hashed with PBKDF2 (100,000 iterations)
- **Privacy Logs:** Encrypted with user password

### Memory Safety
- Automatic wallet lock after 5 minutes of inactivity
- Secure key wiping on lock/logout
- No sensitive data in browser console
- Obfuscated localStorage keys

### Best Practices
- ✅ Client-side only (no server)
- ✅ No analytics or tracking
- ✅ No third-party scripts
- ✅ Open source (auditable)

---

## ⚙️ Configuration

### RPC Endpoint

Default: `https://octra.network`

To change RPC endpoint:
1. Go to **Settings** → **Network**
2. Enter custom RPC URL
3. Click Save

### Auto-lock Timer

Default: 5 minutes

To change:
1. Go to **Settings** → **Security**
2. Adjust auto-lock duration
3. Click Save

---

## 🛠️ Development

### Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

### Run Tests

```bash
npm run test
```

### Lint Code

```bash
npm run lint
```

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

**Step 1: Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

**Step 2: Import to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Vite settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

**Step 3: Configure Environment Variables** ⚠️ **IMPORTANT**
1. In Vercel Dashboard → Settings → Environment Variables
2. Add the following variable:
   ```
   Key: VITE_RPC_URL
   Value: https://octra.network
   ```
3. Apply to: Production, Preview, Development

**Step 4: Deploy**
Click **"Deploy"** - that's it! ✅

Your wallet will be live at: `https://your-project.vercel.app`

**Troubleshooting RPC Connection:**
- ✅ Verify `VITE_RPC_URL` is set in Vercel env vars
- ✅ Check browser console for CORS errors
- ✅ Ensure RPC endpoint (`https://octra.network`) is accessible
- ✅ Review CSP policy allows RPC domain

### Configuration Files

The project includes `vercel.json` with:
- ✅ **SPA Routing** - No 404 on page refresh
- ✅ **Security Headers** - X-Frame-Options, CSP, etc.
- ✅ **Cache Optimization** - Assets cached for 1 year

### Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate auto-generated

---

## 🌐 Network Information

### Testnet
- **RPC:** https://octra.network
- **Faucet:** https://faucet.octra.network
- **Block Explorer:** Coming soon

### Mainnet
- Coming soon

---

## 📝 API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/balance/{address}` | GET | Get wallet balance and nonce |
| `/address/{address}` | GET | Get address info and tx history |
| `/tx/{hash}` | GET | Get transaction details |
| `/send-tx` | POST | Send transaction |
| `/view_encrypted_balance/{address}` | GET | Get FHE encrypted balance |
| `/encrypt_balance` | POST | Shield balance (public → private) |
| `/decrypt_balance` | POST | Unshield balance (private → public) |
| `/private_transfer` | POST | Send private transfer |
| `/claim_private_transfer` | POST | Claim private transfer |

---

## 🐛 Troubleshooting

### "Invalid Password" Error
- Ensure you're using the correct password
- Password is case-sensitive
- Try importing wallet with mnemonic phrase

### Wallet Not Unlocking
- Clear browser cache
- Try incognito/private mode
- Check browser console for errors

### Transactions Pending Forever
- Check network connection
- Verify RPC endpoint is reachable
- Try refreshing balance

### Balance Not Updating
- Click refresh button manually
- Check if RPC is online
- Clear cache and reload

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## ⚠️ Disclaimer

**USE AT YOUR OWN RISK**

This wallet is provided as-is for the Octra testnet. While we implement industry-standard security practices:
- Always backup your mnemonic phrase
- Never share your private keys
- Use strong passwords
- Test with small amounts first

For production use, wait for official mainnet launch and security audit.

---

## 📞 Support

- **GitHub Issues:** https://github.com/irhamuba/octra-wallet/issues
- **Octra Docs:** https://docs.octra.org
- **Telegram:** https://t.me/octra_chat_en
- **Discord:** https://discord.com/channels/1038740318255841280

---

Made with ❤️ for the Octra ecosystem
