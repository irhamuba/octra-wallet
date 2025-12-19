/**
 * Vault Encryption Service
 * 
 * Provides secure encryption/decryption for wallet private keys
 * Uses TweetNaCl (NaCl/libsodium) for encryption - same as MetaMask
 * 
 * Security Features:
 * - Password-based key derivation (PBKDF2)
 * - XSalsa20-Poly1305 authenticated encryption
 * - Random nonce per encryption
 * - Argon2-style iterations for brute-force protection
 */

import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

/**
 * Convert string to Uint8Array
 */
function stringToUint8Array(str) {
    return new TextEncoder().encode(str);
}

/**
 * Convert Uint8Array to string
 */
function uint8ArrayToString(arr) {
    return new TextDecoder().decode(arr);
}

/**
 * Simple PBKDF2-like key derivation
 * Derives encryption key from password using multiple iterations
 * 
 * @param {string} password - User password
 * @param {Uint8Array} salt - Random salt (16 bytes)
 * @param {number} iterations - Number of hash iterations (default: 100000)
 * @returns {Promise<Uint8Array>} 32-byte derived key
 */
async function deriveKey(password, salt, iterations = 100000) {
    const passwordBytes = stringToUint8Array(password);

    // Use Web Crypto API for PBKDF2
    const importedKey = await crypto.subtle.importKey(
        'raw',
        passwordBytes,
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: iterations,
            hash: 'SHA-256'
        },
        importedKey,
        256 // 256 bits = 32 bytes for secretbox
    );

    return new Uint8Array(derivedBits);
}

/**
 * Encrypt wallet data with password
 * 
 * @param {Array} wallets - Array of wallet objects with private keys
 * @param {string} password - User password
 * @returns {Promise<Object>} Encrypted vault object
 */
export async function encryptVault(wallets, password) {
    try {
        // 1. Generate random salt (16 bytes)
        const salt = nacl.randomBytes(16);

        // 2. Derive encryption key from password
        const key = await deriveKey(password, salt);

        // 3. Generate random nonce (24 bytes for secretbox)
        const nonce = nacl.randomBytes(24);

        // 4. Serialize wallet data
        const plaintext = stringToUint8Array(JSON.stringify(wallets));

        // 5. Encrypt with XSalsa20-Poly1305
        const ciphertext = nacl.secretbox(plaintext, nonce, key);

        if (!ciphertext) {
            throw new Error('Encryption failed');
        }

        // 6. Return vault structure
        return {
            version: 1,
            ciphertext: encodeBase64(ciphertext),
            nonce: encodeBase64(nonce),
            salt: encodeBase64(salt),
            iterations: 100000
        };
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt wallet: ' + error.message);
    }
}

/**
 * Decrypt wallet data with password
 * 
 * @param {Object} vault - Encrypted vault object
 * @param {string} password - User password
 * @returns {Promise<Array>} Decrypted wallet array
 */
export async function decryptVault(vault, password) {
    try {
        // 1. Validate vault structure
        if (!vault || !vault.ciphertext || !vault.nonce || !vault.salt) {
            throw new Error('Invalid vault structure');
        }

        // 2. Decode vault components
        const ciphertext = decodeBase64(vault.ciphertext);
        const nonce = decodeBase64(vault.nonce);
        const salt = decodeBase64(vault.salt);
        const iterations = vault.iterations || 100000;

        // 3. Derive key from password
        const key = await deriveKey(password, salt, iterations);

        // 4. Decrypt
        const plaintext = nacl.secretbox.open(ciphertext, nonce, key);

        if (!plaintext) {
            throw new Error('Decryption failed - invalid password');
        }

        // 5. Parse and return wallets
        const walletsJson = uint8ArrayToString(plaintext);
        return JSON.parse(walletsJson);
    } catch (error) {
        if (error.message.includes('invalid password')) {
            throw error;
        }
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt wallet: ' + error.message);
    }
}

/**
 * Verify password against vault
 * @param {Object} vault - Encrypted vault
 * @param {string} password - Password to verify
 * @returns {Promise<boolean>} True if password is correct
 */
export async function verifyPassword(vault, password) {
    try {
        await decryptVault(vault, password);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Check if data is encrypted vault or plain wallets
 * @param {any} data - Data to check
 * @returns {boolean} True if data is encrypted vault
 */
export function isEncryptedVault(data) {
    return data &&
        typeof data === 'object' &&
        data.version !== undefined &&
        data.ciphertext !== undefined &&
        data.nonce !== undefined &&
        data.salt !== undefined;
}
