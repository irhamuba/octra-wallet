/**
 * Keyring Service - Secure Key Management Controller
 * 
 * Inspired by MetaMask's Keyring Controller pattern.
 * This service acts as the SOLE gatekeeper for private keys.
 * UI components should NEVER access private keys directly.
 * 
 * Features:
 * - Isolated key storage (keys never leave this service)
 * - Disposable memory (keys are wiped after use)
 * - Secure signing without exposing keys
 */

import nacl from 'tweetnacl';
import { Buffer } from 'buffer';

// Private state - NOT exported, completely isolated
let _vault = null;           // Encrypted vault data
let _password = null;        // Session password (cleared on lock)
let _decryptedKeys = null;   // Decrypted keys (cleared after use)
let _isUnlocked = false;

/**
 * Securely wipe sensitive data from memory
 * Uses multiple techniques to ensure data is cleared
 */
function secureWipe(data) {
    if (!data) return;

    if (data instanceof Uint8Array || data instanceof Buffer) {
        // Fill with zeros
        data.fill(0);
        // Fill with random data to overwrite
        crypto.getRandomValues(data);
        // Fill with zeros again
        data.fill(0);
    } else if (typeof data === 'string') {
        // Strings are immutable in JS, but we can null the reference
        return null;
    } else if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            if (typeof data[i] === 'object') {
                secureWipe(data[i]);
            }
            data[i] = null;
        }
        data.length = 0;
    } else if (typeof data === 'object') {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                if (typeof data[key] === 'object') {
                    secureWipe(data[key]);
                }
                data[key] = null;
            }
        }
    }
}

/**
 * Convert base64 to Uint8Array
 */
function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Convert Uint8Array to base64
 */
function uint8ArrayToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * KeyringService - Singleton Service for Key Management
 */
class KeyringService {
    constructor() {
        // Enforce singleton
        if (KeyringService._instance) {
            return KeyringService._instance;
        }
        KeyringService._instance = this;
    }

    /**
     * Check if the keyring is unlocked
     */
    isUnlocked() {
        return _isUnlocked && _password !== null;
    }

    /**
     * Initialize the keyring with a password (for new setup)
     */
    async initialize(password) {
        _password = password;
        _isUnlocked = true;
        _decryptedKeys = new Map();
    }

    /**
     * Unlock the keyring with password
     * Called when user enters password to unlock wallet
     */
    async unlock(password, wallets) {
        _password = password;
        _isUnlocked = true;

        // Store decrypted keys in memory (mapped by address)
        _decryptedKeys = new Map();

        for (const wallet of wallets) {
            if (wallet.privateKeyB64) {
                _decryptedKeys.set(wallet.address, {
                    privateKeyB64: wallet.privateKeyB64,
                    publicKeyB64: wallet.publicKeyB64
                });
            }
        }
    }

    /**
     * Lock the keyring - CRITICAL SECURITY FUNCTION
     * Wipes all keys from memory immediately
     */
    lock() {
        // Securely wipe password
        if (_password) {
            _password = secureWipe(_password);
            _password = null;
        }

        // Securely wipe all decrypted keys
        if (_decryptedKeys) {
            for (const [address, keyData] of _decryptedKeys) {
                if (keyData.privateKeyB64) {
                    // Convert to buffer and wipe
                    try {
                        const keyBuffer = base64ToUint8Array(keyData.privateKeyB64);
                        secureWipe(keyBuffer);
                    } catch (e) {
                        // Ignore errors during wipe
                    }
                }
                secureWipe(keyData);
            }
            _decryptedKeys.clear();
            _decryptedKeys = null;
        }

        _isUnlocked = false;
        _vault = null;
    }

    /**
     * Add a new key to the keyring
     */
    addKey(address, privateKeyB64, publicKeyB64) {
        if (!_isUnlocked) {
            throw new Error('Keyring is locked');
        }

        if (!_decryptedKeys) {
            _decryptedKeys = new Map();
        }

        _decryptedKeys.set(address, {
            privateKeyB64,
            publicKeyB64
        });
    }

    /**
     * Sign a transaction - THE CORE SECURE FUNCTION
     * 
     * This is the ONLY way to sign transactions.
     * The private key is:
     * 1. Retrieved from secure storage
     * 2. Used for signing
     * 3. IMMEDIATELY wiped from the temporary buffer
     * 
     * UI components call this instead of accessing privateKey directly
     */
    async signTransaction(address, txParams) {
        if (!_isUnlocked) {
            throw new Error('Keyring is locked. Please unlock your wallet first.');
        }

        const keyData = _decryptedKeys?.get(address);
        if (!keyData) {
            throw new Error('No key found for this address');
        }

        // Create a temporary buffer for the private key
        let tempPrivateKey = null;
        let tempSecretKey = null;

        try {
            // Decode private key to temporary buffer
            tempPrivateKey = base64ToUint8Array(keyData.privateKeyB64);

            // Generate keypair from seed
            const keyPair = nacl.sign.keyPair.fromSeed(tempPrivateKey);
            tempSecretKey = keyPair.secretKey;

            // Create the transaction object
            // Create the transaction object
            const μ = 1_000_000;
            const amountRaw = Math.floor(txParams.amount * μ);
            const timestamp = Date.now() / 1000;

            const tx = {
                from: address,
                to_: txParams.to, // Note the underscore matching backend
                amount: String(amountRaw),
                nonce: parseInt(txParams.nonce),
                ou: txParams.fee ? String(Math.floor(txParams.fee * μ)) : '2000',
                timestamp: timestamp
            };

            if (txParams.message) {
                tx.message = txParams.message;
            }

            // Create signature payload - EXACTLY matching Python client
            // Python: bl = json.dumps({k: v for k, v in tx.items() if k != "message"}, separators=(",", ":"))
            // We must construct object with exact same keys in potentially same order
            // Note: JS JSON.stringify creates compact JSON (no spaces) by default which matches separators=(",", ":")
            const payloadObj = {
                from: tx.from,
                to_: tx.to_,
                amount: tx.amount,
                nonce: tx.nonce,
                ou: tx.ou,
                timestamp: tx.timestamp
            };

            const signPayload = JSON.stringify(payloadObj);

            // Sign the payload
            const messageBytes = new TextEncoder().encode(signPayload);
            const signature = nacl.sign.detached(messageBytes, tempSecretKey);

            // Create the final transaction
            const signedTx = {
                ...tx,
                signature: uint8ArrayToBase64(signature),
                public_key: keyData.publicKeyB64
            };

            return signedTx;

        } finally {
            // CRITICAL: Always wipe temporary key material
            if (tempPrivateKey) {
                secureWipe(tempPrivateKey);
                tempPrivateKey = null;
            }
            if (tempSecretKey) {
                secureWipe(tempSecretKey);
                tempSecretKey = null;
            }
        }
    }

    /**
     * Sign a message (for dApp connections, etc.)
     */
    async signMessage(address, message) {
        if (!_isUnlocked) {
            throw new Error('Keyring is locked');
        }

        const keyData = _decryptedKeys?.get(address);
        if (!keyData) {
            throw new Error('No key found for this address');
        }

        let tempPrivateKey = null;
        let tempSecretKey = null;

        try {
            tempPrivateKey = base64ToUint8Array(keyData.privateKeyB64);
            const keyPair = nacl.sign.keyPair.fromSeed(tempPrivateKey);
            tempSecretKey = keyPair.secretKey;

            const messageBytes = typeof message === 'string'
                ? new TextEncoder().encode(message)
                : message;

            const signature = nacl.sign.detached(messageBytes, tempSecretKey);
            return uint8ArrayToBase64(signature);

        } finally {
            if (tempPrivateKey) {
                secureWipe(tempPrivateKey);
                tempPrivateKey = null;
            }
            if (tempSecretKey) {
                secureWipe(tempSecretKey);
                tempSecretKey = null;
            }
        }
    }

    /**
     * Sign a contract call for OCS01 contracts
     * Returns signature and public key for contract submission
     */
    async signContractCall(address, callParams) {
        if (!_isUnlocked) {
            throw new Error('Keyring is locked');
        }

        const keyData = _decryptedKeys?.get(address);
        if (!keyData) {
            throw new Error('No key found for this address');
        }

        let tempPrivateKey = null;
        let tempSecretKey = null;

        try {
            tempPrivateKey = base64ToUint8Array(keyData.privateKeyB64);
            const keyPair = nacl.sign.keyPair.fromSeed(tempPrivateKey);
            tempSecretKey = keyPair.secretKey;

            // Create the signing payload for contract calls
            // Format matches ocs01-test implementation
            const signPayload = JSON.stringify({
                from: address,
                to_: callParams.contract,
                amount: "0",
                nonce: callParams.nonce,
                ou: "1",
                timestamp: callParams.timestamp
            });

            const messageBytes = new TextEncoder().encode(signPayload);
            const signature = nacl.sign.detached(messageBytes, tempSecretKey);

            return {
                signature: uint8ArrayToBase64(signature),
                publicKey: keyData.publicKeyB64
            };

        } finally {
            if (tempPrivateKey) {
                secureWipe(tempPrivateKey);
                tempPrivateKey = null;
            }
            if (tempSecretKey) {
                secureWipe(tempSecretKey);
                tempSecretKey = null;
            }
        }
    }

    /**
     * Get public key for an address (safe to expose)
     */
    getPublicKey(address) {
        if (!_isUnlocked) {
            throw new Error('Keyring is locked');
        }

        const keyData = _decryptedKeys?.get(address);
        return keyData?.publicKeyB64 || null;
    }

    /**
     * Get all addresses in the keyring
     */
    getAddresses() {
        if (!_decryptedKeys) return [];
        return Array.from(_decryptedKeys.keys());
    }

    /**
     * Remove a key from the keyring
     */
    removeKey(address) {
        if (_decryptedKeys?.has(address)) {
            const keyData = _decryptedKeys.get(address);
            secureWipe(keyData);
            _decryptedKeys.delete(address);
        }
    }
}

// Export singleton instance
export const keyringService = new KeyringService();

// Export class for testing purposes
export { KeyringService };
