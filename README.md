# Octra Wallet

<div align="center">

![Octra Wallet](public/octra-icon.svg)

**Simple, Secure, and Elegant Wallet for the Octra Network**

</div>

## Overview

Octra Wallet is a web-based cryptocurrency wallet designed specifically for the Octra blockchain network. It features a clean, minimal UI/UX inspired by popular wallets like OKX Wallet and MetaMask, with a focus on simplicity and elegance.

## Features

### 🔐 Wallet Management
- **Create New Wallet** - Generate a new wallet with a secure 12-word BIP39 recovery phrase
- **Import Wallet** - Restore existing wallet using:
  - 12-word mnemonic phrase
  - Base64 encoded private key
- **Export Keys** - Backup your private key and recovery phrase

### 💸 Transactions
- **Send OCT** - Transfer tokens to any Octra address with optional message
- **Receive OCT** - Display QR code and copy address for receiving funds
- **Transaction History** - View all incoming and outgoing transactions

### ⚙️ Settings
- **Custom RPC Endpoint** - Connect to different Octra nodes
- **Network Testing** - Verify RPC connection before saving
- **Wallet Export** - Download wallet as JSON keystore file

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **TweetNaCl** - Ed25519 cryptography
- **BIP39** - Mnemonic phrase generation
- **QRCode.react** - QR code generation
- **Vanilla CSS** - Custom design system

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Navigate to wallet directory
cd octra-wallet

# Install dependencies
npm install

# Start development server
npm run dev
```

The wallet will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
```

## Design Philosophy

The UI follows a **dark, minimal aesthetic** with these principles:

- **Monochrome Base** - Dark backgrounds (#0D0D0D, #1A1A1A) with white text
- **Subtle Accent** - Cyan (#00D4FF) for branding and interactions
- **Clean Typography** - Inter font family for readability
- **Smooth Animations** - Subtle transitions for premium feel
- **Mobile-First** - Responsive design optimized for all screen sizes

## Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS:**

1. **Never share** your private key or recovery phrase with anyone
2. **Store offline** - Write down your recovery phrase and keep it secure
3. **Use HTTPS** - Only connect to secure RPC endpoints in production
4. **Testnet Only** - This wallet is configured for the Octra Testnet

## Compatibility with CLI Client

This wallet is fully compatible with the existing Octra CLI client (`octra_pre_client`). Wallets created in either can be used in both:

### Export from Web → CLI
```bash
# The exported JSON file can be used directly as wallet.json
mv octra_wallet_xxx.json wallet.json
```

### Import from CLI → Web
Use "Import Wallet" → "Private Key" and enter the `priv` value from your `wallet.json`

## Project Structure

```
octra-wallet/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx     # Main wallet view
│   │   ├── Icons.jsx         # SVG icon components
│   │   ├── Settings.jsx      # Settings screen
│   │   └── WelcomeScreen.jsx # Onboarding flow
│   ├── hooks/
│   │   └── useWallet.js      # Wallet state management
│   ├── utils/
│   │   ├── crypto.js         # Cryptographic functions
│   │   ├── rpc.js            # RPC client
│   │   └── storage.js        # Local storage utils
│   ├── App.jsx               # Main app component
│   ├── App.css               # Component styles
│   ├── index.css             # Design system
│   └── main.jsx              # Entry point
├── public/
│   └── octra-icon.svg        # App icon
├── index.html
├── package.json
└── vite.config.js
```

## License

MIT © Octra Labs
