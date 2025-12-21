/**
 * Storage Utilities for Octra Wallet
 * Handles encrypted wallet storage, multi-wallet management, and settings
 * 
 * SECURITY: Storage keys are obfuscated to prevent simple malware
 * from finding wallet data by searching for obvious patterns
 */

// Obfuscated storage keys - looks like random data to malware
const STORAGE_KEYS = {
    WALLETS: '_x7f_v2_blob',           // Encrypted wallets (was: octra_wallets)
    ACTIVE_WALLET: '_x3a_idx',         // Active wallet index (was: octra_active_wallet)
    SETTINGS: '_x9c_cfg',              // Settings (was: octra_settings)
    TX_HISTORY: '_x4e_hist',           // Transaction history (was: octra_tx_history)
    PRIVACY_LOGS: '_x5p_logs',         // Privacy transaction logs (new)
    PASSWORD_HASH: '_x2b_auth',        // Password hash (was: octra_pw_hash)
};

/**
 * Hash password using SHA-256
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'octra_salt_v1');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive encryption key from password using PBKDF2
 * SECURITY: Using 600,000 iterations per NIST SP 800-132 (2023) recommendations
 */
async function deriveKey(password) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('_x8f_kdf_salt_v2'),  // Obfuscated salt
            iterations: 600000,  // NIST 2023 recommendation (was 100000)
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt data with password
 */
async function encryptData(data, password) {
    try {
        const key = await deriveKey(password);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const encoded = encoder.encode(JSON.stringify(data));

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoded
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt data with password
 */
async function decryptData(encryptedData, password) {
    try {
        const key = await deriveKey(password);
        const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encrypted
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Invalid password or corrupted data');
    }
}

// ===== Password Management =====

/**
 * Set wallet password (only during initial setup)
 */
export async function setWalletPassword(password) {
    const hash = await hashPassword(password);
    localStorage.setItem(STORAGE_KEYS.PASSWORD_HASH, hash);
}

/**
 * Verify password
 */
export async function verifyPassword(password) {
    const stored = localStorage.getItem(STORAGE_KEYS.PASSWORD_HASH);
    if (!stored) return false;

    const hash = await hashPassword(password);
    return hash === stored;
}

/**
 * Check if password is set
 */
export function hasPassword() {
    return !!localStorage.getItem(STORAGE_KEYS.PASSWORD_HASH);
}

/**
 * Change password (requires current password)
 */
export async function changePassword(currentPassword, newPassword) {
    // Verify current password
    const isValid = await verifyPassword(currentPassword);
    if (!isValid) throw new Error('Invalid current password');

    // Get all wallets with current password
    const wallets = await loadWallets(currentPassword);

    // Re-encrypt with new password
    await saveWallets(wallets, newPassword);

    // Update password hash
    await setWalletPassword(newPassword);

    return true;
}

// ===== Multi-Wallet Management =====

/**
 * Save all wallets (encrypted)
 */
export async function saveWallets(wallets, password) {
    try {
        const encrypted = await encryptData(wallets, password);
        localStorage.setItem(STORAGE_KEYS.WALLETS, encrypted);
        return true;
    } catch (error) {
        console.error('Failed to save wallets:', error);
        return false;
    }
}

/**
 * Load all wallets (requires password)
 */
export async function loadWallets(password) {
    try {
        const encrypted = localStorage.getItem(STORAGE_KEYS.WALLETS);
        if (!encrypted) return [];
        return await decryptData(encrypted, password);
    } catch (error) {
        console.error('Failed to load wallets:', error);
        throw error;
    }
}

/**
 * Add a new wallet
 */
export async function addWallet(wallet, password) {
    const wallets = await loadWallets(password);

    // Check for duplicate address
    if (wallets.some(w => w.address === wallet.address)) {
        throw new Error('Wallet already exists');
    }

    // Add wallet with metadata
    const walletWithMeta = {
        ...wallet,
        name: wallet.name || `Wallet ${wallets.length + 1}`,
        createdAt: Date.now(),
        id: crypto.randomUUID()
    };

    wallets.push(walletWithMeta);
    await saveWallets(wallets, password);

    // Set as active if first wallet
    if (wallets.length === 1) {
        setActiveWalletIndex(0);
    }

    return walletWithMeta;
}

/**
 * Remove a wallet
 */
export async function removeWallet(walletId, password) {
    const wallets = await loadWallets(password);
    const filtered = wallets.filter(w => w.id !== walletId);

    if (filtered.length === wallets.length) {
        throw new Error('Wallet not found');
    }

    await saveWallets(filtered, password);

    // Adjust active index if needed
    const activeIndex = getActiveWalletIndex();
    if (activeIndex >= filtered.length) {
        setActiveWalletIndex(Math.max(0, filtered.length - 1));
    }

    return true;
}

/**
 * Update wallet name
 * Searches by ID first, then by address (for backwards compatibility)
 */
export async function updateWalletName(walletIdOrAddress, name, password) {
    const wallets = await loadWallets(password);

    // Try to find by ID first, then by address
    let wallet = wallets.find(w => w.id === walletIdOrAddress);
    if (!wallet) {
        wallet = wallets.find(w => w.address === walletIdOrAddress);
    }

    if (!wallet) {
        console.warn(`[updateWalletName] Wallet not found: ${walletIdOrAddress?.slice(0, 20)}...`);
        throw new Error('Wallet not found');
    }

    wallet.name = name;
    await saveWallets(wallets, password);

    return wallet;
}

/**
 * Get/Set active wallet index
 */
export function getActiveWalletIndex() {
    const index = localStorage.getItem(STORAGE_KEYS.ACTIVE_WALLET);
    return index ? parseInt(index, 10) : 0;
}

export function setActiveWalletIndex(index) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WALLET, index.toString());
}

/**
 * Check if any wallets exist
 */
export function hasWallets() {
    return !!localStorage.getItem(STORAGE_KEYS.WALLETS);
}

/**
 * Clear all wallet data (for disconnect/reset)
 */
export function clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.WALLETS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_WALLET);
    localStorage.removeItem(STORAGE_KEYS.PASSWORD_HASH);
    localStorage.removeItem(STORAGE_KEYS.TX_HISTORY);
}

// ===== Settings =====

const DEFAULT_SETTINGS = {
    network: 'testnet',
    rpcUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RPC_URL) || 'https://octra.network',
    currency: 'USD',
    theme: 'dark',
    autoLockMinutes: 5,
};

export function getSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        let settings = stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;

        // AUTO-MIGRATION: Fix legacy proxy paths to real URL
        // We now handle proxying internally in rpc.js, so we store the REAL URL
        if (settings.rpcUrl === '/api' || settings.rpcUrl === '/api/rpc') {
            const realUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RPC_URL) || 'https://octra.network';
            console.log(`🔧 Reverting RPC path to URL: ${settings.rpcUrl} → ${realUrl}`);
            settings.rpcUrl = realUrl;
            saveSettings(settings);
        }

        return settings;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// ===== Transaction History =====

export function getTxHistory(network = 'testnet') {
    try {
        const key = `${STORAGE_KEYS.TX_HISTORY}_${network}`;
        const stored = localStorage.getItem(key);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

export function addToTxHistory(tx, network = 'testnet') {
    const history = getTxHistory(network);
    history.unshift({
        ...tx,
        timestamp: Date.now()
    });
    // Keep only last 100 transactions
    const trimmed = history.slice(0, 100);
    const key = `${STORAGE_KEYS.TX_HISTORY}_${network}`;
    localStorage.setItem(key, JSON.stringify(trimmed));
}

// ===== Privacy Transaction Logs =====

/**
 * Store privacy transaction status with encryption
 * SECURITY: Privacy logs contain sensitive shielded balance info - must be encrypted!
 */
export async function savePrivacyTransaction(hash, type, details = {}, password = null) {
    try {
        // Load existing encrypted logs
        const stored = localStorage.getItem(STORAGE_KEYS.PRIVACY_LOGS);
        let logs = {};

        if (stored) {
            try {
                logs = await decryptData(stored, password);
            } catch (e) {
                // If decryption fails, start fresh (might be first time or password changed)
                console.warn('Could not decrypt existing privacy logs, creating new');
                logs = {};
            }
        }

        // Add new log
        logs[hash] = { type, timestamp: Date.now(), ...details };

        // Encrypt and save if password available
        if (password) {
            const encrypted = await encryptData(logs, password);
            localStorage.setItem(STORAGE_KEYS.PRIVACY_LOGS, encrypted);
        } else {
            // Fallback: store unencrypted (backward compat, but less secure)
            console.warn('⚠️ Privacy log stored unencrypted - password recommended');
            localStorage.setItem(STORAGE_KEYS.PRIVACY_LOGS, JSON.stringify(logs));
        }
    } catch (e) {
        console.error('Failed to save privacy log', e);
    }
}

/**
 * Get privacy transaction with decryption
 */
export async function getPrivacyTransaction(hash, password = null) {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.PRIVACY_LOGS);
        if (!stored) return null;

        let logs = {};
        if (password) {
            try {
                logs = await decryptData(stored, password);
            } catch {
                // Try plain JSON fallback
                logs = JSON.parse(stored);
            }
        } else {
            logs = JSON.parse(stored);
        }
        return logs[hash] || null;
    } catch (e) {
        console.error('Failed to get privacy log', e);
        return null;
    }
}

/**
 * Get all privacy transactions (for display)
 */
export async function getAllPrivacyTransactions(password = null) {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.PRIVACY_LOGS);
        if (!stored) return {};

        if (password) {
            try {
                return await decryptData(stored, password);
            } catch {
                return JSON.parse(stored);
            }
        } else {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to get privacy logs', e);
        return {};
    }
}

// ===== Export/Import =====

export function exportWallet(wallet, filename) {
    const data = {
        address: wallet.address,
        publicKey: wallet.publicKeyB64,
        privateKey: wallet.privateKeyB64,
        mnemonic: wallet.mnemonic,
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `octra_wallet_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function parseImportedWallet(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        if (!data.privateKey && !data.priv) {
            throw new Error('Invalid wallet file');
        }
        return {
            privateKeyB64: data.privateKey || data.priv,
            publicKeyB64: data.publicKey || data.pub,
            address: data.address,
            mnemonic: data.mnemonic
        };
    } catch (error) {
        throw new Error('Failed to parse wallet file');
    }
}

// Legacy single wallet functions (for backwards compatibility)
export function saveWallet(walletData) {
    console.warn('saveWallet is deprecated, use saveWallets instead');
    try {
        // Simple encoding for legacy support
        const encoded = btoa(JSON.stringify(walletData));
        localStorage.setItem('octra_wallet_legacy', encoded);
        return true;
    } catch (error) {
        return false;
    }
}

export function loadWallet() {
    console.warn('loadWallet is deprecated, use loadWallets instead');
    try {
        const encoded = localStorage.getItem('octra_wallet_legacy');
        if (!encoded) return null;
        return JSON.parse(atob(encoded));
    } catch (error) {
        return null;
    }
}

export function clearWallet() {
    console.warn('clearWallet is deprecated, use clearAllData instead');
    localStorage.removeItem('octra_wallet_legacy');
}
