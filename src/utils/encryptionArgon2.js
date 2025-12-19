/**
 * Enhanced Encryption with Argon2
 * Quantum-resistant key derivation
 */

import argon2 from 'argon2-browser';
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

/**
 * Derive key using Argon2id (quantum-resistant)
 * @param {string} password 
 * @param {Uint8Array} salt 
 * @returns {Promise<Uint8Array>}
 */
export async function deriveKeyArgon2(password, salt) {
    try {
        const result = await argon2.hash({
            pass: password,
            salt: salt,
            time: 3,           // iterations
            mem: 65536,        // 64MB memory
            hashLen: 32,       // 32 bytes output
            parallelism: 4,    // threads
            type: argon2.ArgonType.Argon2id  // Hybrid mode (best security)
        });

        return result.hash;
    } catch (error) {
        console.error('Argon2 derivation failed:', error);
        throw new Error('Key derivation failed');
    }
}

/**
 * Encrypt vault with Argon2 + XSalsa20-Poly1305
 * @param {Array} wallets 
 * @param {string} password 
 * @returns {Promise<Object>}
 */
export async function encryptVaultArgon2(wallets, password) {
    try {
        // 1. Generate random salt (16 bytes)
        const salt = nacl.randomBytes(16);

        // 2. Derive encryption key with Argon2
        const key = await deriveKeyArgon2(password, salt);

        // 3. Generate random nonce (24 bytes for secretbox)
        const nonce = nacl.randomBytes(24);

        // 4. Serialize wallet data
        const plaintext = new TextEncoder().encode(JSON.stringify(wallets));

        // 5. Encrypt with XSalsa20-Poly1305
        const ciphertext = nacl.secretbox(plaintext, nonce, key);

        if (!ciphertext) {
            throw new Error('Encryption failed');
        }

        // 6. Return vault structure
        return {
            version: 2,  // v2 = Argon2
            ciphertext: encodeBase64(ciphertext),
            nonce: encodeBase64(nonce),
            salt: encodeBase64(salt),
            kdf: 'argon2id',
            kdfParams: {
                time: 3,
                memory: 65536,
                parallelism: 4
            }
        };
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt wallet: ' + error.message);
    }
}

/**
 * Decrypt vault (supports both v1 PBKDF2 and v2 Argon2)
 * @param {Object} vault 
 * @param {string} password 
 * @returns {Promise<Array>}
 */
export async function decryptVaultArgon2(vault, password) {
    try {
        // 1. Validate vault structure
        if (!vault || !vault.ciphertext || !vault.nonce || !vault.salt) {
            throw new Error('Invalid vault structure');
        }

        // 2. Decode vault components
        const ciphertext = decodeBase64(vault.ciphertext);
        const nonce = decodeBase64(vault.nonce);
        const salt = decodeBase64(vault.salt);

        // 3. Derive key based on version
        let key;
        if (vault.version === 2 && vault.kdf === 'argon2id') {
            // v2: Argon2
            key = await deriveKeyArgon2(password, salt);
        } else {
            // v1: PBKDF2 (backward compatibility)
            const { deriveKey } = await import('./encryption.js');
            const iterations = vault.iterations || 100000;
            key = await deriveKey(password, salt, iterations);
        }

        // 4. Decrypt
        const plaintext = nacl.secretbox.open(ciphertext, nonce, key);

        if (!plaintext) {
            throw new Error('Decryption failed - invalid password');
        }

        // 5. Parse and return wallets
        const walletsJson = new TextDecoder().decode(plaintext);
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
 * Migrate v1 vault to v2 (PBKDF2 → Argon2)
 * @param {Object} oldVault 
 * @param {string} password 
 * @returns {Promise<Object>}
 */
export async function migrateVaultToArgon2(oldVault, password) {
    // Decrypt with old method
    const { decryptVault } = await import('./encryption.js');
    const wallets = await decryptVault(oldVault, password);

    // Re-encrypt with Argon2
    return await encryptVaultArgon2(wallets, password);
}

export default {
    deriveKeyArgon2,
    encryptVaultArgon2,
    decryptVaultArgon2,
    migrateVaultToArgon2
};
