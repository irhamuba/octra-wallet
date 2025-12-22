# 🔐 Octra Wallet - Secure Browser Extension

<div align="center">

![Octra Wallet](public/octra-icon.svg)

**Official non-custodial wallet for Octra blockchain**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-green)](https://chrome.google.com/webstore)
[![Firefox](https://img.shields.io/badge/Firefox-Add--on-orange)](https://addons.mozilla.org)
[![Security](https://img.shields.io/badge/Security-Audited-success)](docs/security/SECURITY_AUDIT.md)

[Installation](#installation) • [Features](#features) • [Security](#security) • [Documentation](#documentation) • [Support](#support)

</div>

---

## 🌟 Features

### ✅ **100% Client-Side**
- No servers, no APIs, no middleman
- Direct connection to Octra blockchain
- Your keys never leave your device

### 🔒 **Bank-Grade Security**
- AES-256-GCM encryption
- Ed25519 cryptographic signatures
- Secure memory management
- Zero telemetry or tracking

### 🎯 **Full Precision**
- 6 decimal places support
- Accurate transaction amounts
- Professional monospace display

### 🌐 **Multi-Wallet Support**
- Create unlimited wallets
- Import from mnemonic
- Easy wallet switching
- Secure local storage

### 🔐 **Privacy Features**
- FHE (Fully Homomorphic Encryption) support
- Private balance viewing
- No transaction history tracking
- Local-only data storage

### 📊 **Advanced Features**
- OCS01 token support
- Manual balance refresh
- Transaction history
- QR code generation
- Network fee customization

---

## 📥 Installation

### Chrome Web Store
```
Coming soon - Awaiting approval
```

### Firefox Add-ons
```
Coming soon - Awaiting approval
```

### Manual Installation (Developer Mode)
1. Download latest release: [GitHub Releases](https://github.com/irhamuba/octra-wallet/releases)
2. Unzip the file
3. Open Chrome/Firefox Extensions page
4. Enable "Developer mode"
5. Click "Load unpacked" and select the unzipped folder

---

## 🚀 Quick Start

### First Time Setup
1. Click the Octra Wallet extension icon
2. Click **"Create New Wallet"**
3. Set a strong password (min 8 characters)
4. **CRITICAL**: Write down your 12-word recovery phrase
5. Verify the recovery phrase
6. Done! Your wallet is ready

### Sending OCT
1. Click **"Send"** button
2. Enter recipient address (oct...)
3. Enter amount
4. Select network fee (Slow/Normal/Fast)
5. Click **"Review Transaction"**
6. Verify details and click **"Send"**

---

## 🔒 Security

### What We DO
✅ **Encrypt** - All wallet data encrypted with AES-256-GCM  
✅ **Secure** - Keys stored locally, never transmitted  
✅ **Open Source** - Code publicly auditable  
✅ **Zero Telemetry** - No tracking, analytics, or data collection  
✅ **Auto-Lock** - Wallet locks after 5 minutes of inactivity  

### What We DON'T DO
❌ **No Servers** - Zero backend infrastructure  
❌ **No Logging** - No user activity tracking  
❌ **No Third-Party** - Direct blockchain connection only  
❌ **No Cloud Sync** - Everything stays on your device  
❌ **No Analytics** - No Google Analytics, Mixpanel, etc.  

📖 **Read Full Security Architecture**: [docs/security/ARCHITECTURE.md](docs/security/ARCHITECTURE.md)

---

## 🛡️ Privacy Policy

### Data Storage
**ALL data is stored LOCALLY on your device only.**

| Data Type | Storage Location | Encrypted | Shared |
|-----------|------------------|-----------|--------|
| Private Keys | Browser Local Storage | ✅ AES-256 | ❌ Never |
| Passwords | Local (hashed) | ✅ SHA-256 | ❌ Never |
| Wallets | Browser Local Storage | ✅ AES-256 | ❌ Never |
| Transactions | Browser Local Storage | ❌ No | ❌ Never |
| Settings | Browser Local Storage | ❌ No | ❌ Never |

### Network Requests
The extension ONLY makes requests to:
- **`https://octra.network`** - Blockchain RPC (balance, transactions, send)

**NO other network requests are made. Period.**

📖 **Read Full Privacy Policy**: [docs/privacy/PRIVACY_POLICY.md](docs/privacy/PRIVACY_POLICY.md)

---

## 📚 Documentation

### For Users
- 📖 [User Guide](docs/getting-started/USER_GUIDE.md) - Complete walkthrough
- ❓ [FAQ](docs/troubleshooting/FAQ.md) - Common questions
- 🐛 [Troubleshooting](docs/troubleshooting/COMMON_ISSUES.md) - Fix issues
- 🔐 [Security Best Practices](docs/security/BEST_PRACTICES.md)

### For Developers
- 🏗️ [Architecture](docs/developers/ARCHITECTURE.md) - Technical design
- 🔧 [API Reference](docs/developers/API_REFERENCE.md) - Code documentation
- 🤝 [Contributing](docs/developers/CONTRIBUTING.md) - How to contribute
- 🧪 [Testing](docs/developers/TESTING.md) - Run tests

### Official Resources
- 🌐 **Octra Docs**: https://docs.octra.org/
- 🔗 **GitHub**: https://github.com/irhamuba/octra-wallet
- 📧 **Support**: Create an [Issue](https://github.com/irhamuba/octra-wallet/issues)

---

## ⚠️ Important Notes

### Swap Feature
> **⚠️ SWAP FEATURE NOT AVAILABLE YET**
> 
> The swap functionality is coming soon from Octra Network directly.  
> For latest updates, visit: https://docs.octra.org/

### Backup Your Recovery Phrase
> **🚨 CRITICAL**: Your 12-word recovery phrase is the ONLY way to restore your wallet.
> - Write it down on paper
> - Store it in a safe place
> - NEVER share it with anyone
> - NEVER store it digitally (cloud, screenshots, etc.)

### We Can't Help if You Lose Your Phrase
> **⚠️ WARNING**: If you lose your recovery phrase and password, your funds are GONE FOREVER.
> We cannot recover, reset, or restore access. This is the nature of decentralized wallets.

---

## 🤝 Support

### Get Help
- 📖 [User Guide](docs/getting-started/USER_GUIDE.md)
- ❓ [FAQ](docs/troubleshooting/FAQ.md)
- 🐛 [Report Bug](https://github.com/irhamuba/octra-wallet/issues)
- 💬 [Discussions](https://github.com/irhamuba/octra-wallet/discussions)

### Community
- 🌐 Website: https://octra.network
- 📚 Documentation: https://docs.octra.org/
- 🐦 Twitter: (Coming soon)
- 💬 Discord: (Coming soon)

---

## 📋 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Octra Network** - Blockchain infrastructure
- **TweetNaCl** - Cryptographic library
- **React** - UI framework
- **Vite** - Build tool

---

## ⚖️ Disclaimer

This wallet is provided "as is" without warranty of any kind. Use at your own risk. Always:
- Keep your recovery phrase safe
- Verify transaction details before sending
- Start with small amounts to test
- Never share your private keys

---

<div align="center">

**Made with ❤️ for the Octra Community**

[⬆ Back to Top](#-octra-wallet---secure-browser-extension)

</div>
