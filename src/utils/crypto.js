/**
 * Octra Wallet Cryptographic Utilities
 * Ed25519 keypair generation with BIP39 mnemonic support
 */

import * as bip39 from 'bip39';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';

// Ensure Buffer is globally available
if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Encode a buffer to base58
 */
export function base58Encode(buffer) {
    if (buffer.length === 0) return '';

    let num = BigInt('0x' + Buffer.from(buffer).toString('hex'));
    let encoded = '';

    while (num > 0n) {
        const remainder = num % 58n;
        num = num / 58n;
        encoded = BASE58_ALPHABET[Number(remainder)] + encoded;
    }

    // Handle leading zeros
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
        encoded = '1' + encoded;
    }

    return encoded;
}

/**
 * Decode base58 string to buffer
 */
export function base58Decode(str) {
    if (str.length === 0) return Buffer.alloc(0);

    let num = 0n;
    for (const char of str) {
        const index = BASE58_ALPHABET.indexOf(char);
        if (index === -1) throw new Error('Invalid base58 character');
        num = num * 58n + BigInt(index);
    }

    let hex = num.toString(16);
    if (hex.length % 2) hex = '0' + hex;

    // Count leading zeros
    let leadingZeros = 0;
    for (const char of str) {
        if (char === '1') leadingZeros++;
        else break;
    }

    return Buffer.concat([
        Buffer.alloc(leadingZeros),
        Buffer.from(hex, 'hex')
    ]);
}

/**
 * Convert buffer to hex string
 */
export function bufferToHex(buffer) {
    return Buffer.from(buffer).toString('hex');
}

/**
 * Convert hex string to buffer
 */
export function hexToBuffer(hex) {
    return Buffer.from(hex, 'hex');
}

/**
 * Convert buffer to base64
 */
export function bufferToBase64(buffer) {
    return Buffer.from(buffer).toString('base64');
}

/**
 * Convert base64 to buffer
 */
export function base64ToBuffer(base64) {
    return Buffer.from(base64, 'base64');
}

/**
 * Create SHA256 hash using Web Crypto API
 */
export async function sha256(data) {
    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Buffer.from(hashBuffer);
}

/**
 * Derive master key using HMAC-SHA512
 */
async function deriveMasterKey(seed) {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('Octra seed'),
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
    );

    const mac = await crypto.subtle.sign('HMAC', key, seed);
    const macBuffer = Buffer.from(mac);

    return {
        masterPrivateKey: macBuffer.slice(0, 32),
        masterChainCode: macBuffer.slice(32, 64)
    };
}

/**
 * Derive child key for Ed25519 (hardened derivation)
 */
async function deriveChildKeyEd25519(privateKey, chainCode, index) {
    let data;

    if (index >= 0x80000000) {
        // Hardened derivation
        data = Buffer.concat([
            Buffer.from([0x00]),
            privateKey,
            Buffer.from([
                (index >>> 24) & 0xff,
                (index >>> 16) & 0xff,
                (index >>> 8) & 0xff,
                index & 0xff
            ])
        ]);
    } else {
        // Non-hardened derivation
        const keyPair = nacl.sign.keyPair.fromSeed(privateKey);
        const publicKey = Buffer.from(keyPair.publicKey);
        data = Buffer.concat([
            publicKey,
            Buffer.from([
                (index >>> 24) & 0xff,
                (index >>> 16) & 0xff,
                (index >>> 8) & 0xff,
                index & 0xff
            ])
        ]);
    }

    const key = await crypto.subtle.importKey(
        'raw',
        chainCode,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
    );

    const mac = await crypto.subtle.sign('HMAC', key, data);
    const macBuffer = Buffer.from(mac);

    return {
        childPrivateKey: macBuffer.slice(0, 32),
        childChainCode: macBuffer.slice(32, 64)
    };
}

/**
 * Derive key path from seed
 */
async function derivePath(seed, path) {
    const { masterPrivateKey, masterChainCode } = await deriveMasterKey(seed);
    let key = masterPrivateKey;
    let chain = masterChainCode;

    for (const index of path) {
        const derived = await deriveChildKeyEd25519(key, chain, index);
        key = derived.childPrivateKey;
        chain = derived.childChainCode;
    }

    return { key, chain };
}

/**
 * Create Octra address from public key
 */
export async function createOctraAddress(publicKey) {
    const hash = await sha256(publicKey);
    const base58Hash = base58Encode(hash);
    return 'oct' + base58Hash;
}

/**
 * Verify Octra address format
 */
export function verifyAddressFormat(address) {
    if (!address.startsWith('oct')) return false;
    if (address.length !== 47) return false;

    const base58Part = address.slice(3);
    for (const char of base58Part) {
        if (!BASE58_ALPHABET.includes(char)) return false;
    }

    return true;
}

/**
 * Generate new wallet with mnemonic
 */
export async function generateWallet() {
    // Generate 128-bit entropy (12 words)
    const entropy = crypto.getRandomValues(new Uint8Array(16));
    const entropyHex = bufferToHex(entropy);

    // Generate mnemonic
    const mnemonic = bip39.entropyToMnemonic(entropyHex);

    // Derive seed from mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Derive master key with Octra-specific derivation path
    const path = [
        0x80000000 + 345, // Purpose (Octra)
        0x80000000 + 0,   // Coin type
        0x80000000 + 0,   // Network
        0x80000000 + 0,   // Contract
        0x80000000 + 0,   // Account
        0x80000000 + 0,   // Token
        0x80000000 + 0,   // Subnet
        0                  // Index
    ];

    const { key: derivedKey, chain: derivedChain } = await derivePath(Buffer.from(seed), path);

    // Create Ed25519 keypair from derived key
    const keyPair = nacl.sign.keyPair.fromSeed(derivedKey);
    const privateKey = Buffer.from(keyPair.secretKey.slice(0, 32));
    const publicKey = Buffer.from(keyPair.publicKey);

    // Create address
    const address = await createOctraAddress(publicKey);

    return {
        mnemonic: mnemonic.split(' '),
        seedHex: bufferToHex(seed),
        privateKeyHex: bufferToHex(privateKey),
        publicKeyHex: bufferToHex(publicKey),
        privateKeyB64: bufferToBase64(privateKey),
        publicKeyB64: bufferToBase64(publicKey),
        address,
        entropyHex
    };
}

/**
 * Import wallet from mnemonic
 */
export async function importFromMnemonic(mnemonicPhrase) {
    const mnemonic = mnemonicPhrase.trim().toLowerCase();

    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
    }

    // Derive seed from mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Derive master key with Octra-specific derivation path
    const path = [
        0x80000000 + 345,
        0x80000000 + 0,
        0x80000000 + 0,
        0x80000000 + 0,
        0x80000000 + 0,
        0x80000000 + 0,
        0x80000000 + 0,
        0
    ];

    const { key: derivedKey } = await derivePath(Buffer.from(seed), path);

    // Create Ed25519 keypair
    const keyPair = nacl.sign.keyPair.fromSeed(derivedKey);
    const privateKey = Buffer.from(keyPair.secretKey.slice(0, 32));
    const publicKey = Buffer.from(keyPair.publicKey);

    // Create address
    const address = await createOctraAddress(publicKey);

    return {
        mnemonic: mnemonic.split(' '),
        seedHex: bufferToHex(seed),
        privateKeyHex: bufferToHex(privateKey),
        publicKeyHex: bufferToHex(publicKey),
        privateKeyB64: bufferToBase64(privateKey),
        publicKeyB64: bufferToBase64(publicKey),
        address
    };
}

/**
 * Import wallet from private key (base64)
 */
export async function importFromPrivateKey(privateKeyB64) {
    const privateKey = base64ToBuffer(privateKeyB64);

    if (privateKey.length !== 32) {
        throw new Error('Invalid private key length');
    }

    // Create Ed25519 keypair
    const keyPair = nacl.sign.keyPair.fromSeed(privateKey);
    const publicKey = Buffer.from(keyPair.publicKey);

    // Create address
    const address = await createOctraAddress(publicKey);

    return {
        mnemonic: null,
        privateKeyHex: bufferToHex(privateKey),
        publicKeyHex: bufferToHex(publicKey),
        privateKeyB64,
        publicKeyB64: bufferToBase64(publicKey),
        address
    };
}

/**
 * Sign a message with private key
 */
export function signMessage(message, privateKeyB64) {
    const privateKey = base64ToBuffer(privateKeyB64);
    const keyPair = nacl.sign.keyPair.fromSeed(privateKey);

    const messageBytes = typeof message === 'string'
        ? new TextEncoder().encode(message)
        : message;

    const signature = nacl.sign.detached(messageBytes, keyPair.secretKey);
    return bufferToBase64(signature);
}

/**
 * Verify a signature
 */
export function verifySignature(message, signature, publicKeyB64) {
    const publicKey = base64ToBuffer(publicKeyB64);
    const signatureBytes = base64ToBuffer(signature);

    const messageBytes = typeof message === 'string'
        ? new TextEncoder().encode(message)
        : message;

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
}

/**
 * Create and sign a transaction
 */
export function createTransaction(from, to, amount, nonce, privateKeyB64, message = null) {
    const μ = 1_000_000;
    const amountRaw = Math.floor(amount * μ);

    const tx = {
        from,
        to_: to,
        amount: String(amountRaw),
        nonce: parseInt(nonce),
        ou: amount < 1000 ? '1' : '3',
        timestamp: Date.now() / 1000
    };

    if (message) {
        tx.message = message;
    }

    // Create signature payload (without message)
    const signPayload = JSON.stringify({
        from: tx.from,
        to_: tx.to_,
        amount: tx.amount,
        nonce: tx.nonce,
        ou: tx.ou,
        timestamp: tx.timestamp
    });

    const signature = signMessage(signPayload, privateKeyB64);
    const privateKey = base64ToBuffer(privateKeyB64);
    const keyPair = nacl.sign.keyPair.fromSeed(privateKey);
    const publicKeyB64 = bufferToBase64(keyPair.publicKey);

    return {
        ...tx,
        signature,
        public_key: publicKeyB64
    };
}

/**
 * Validate Octra address
 */
export function isValidAddress(address) {
    return verifyAddressFormat(address);
}

/**
 * Truncate address for display
 */
export function truncateAddress(address, startChars = 10, endChars = 8) {
    if (!address || address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format amount with proper decimals
 */
export function formatAmount(amount, decimals = 6) {
    if (amount === null || amount === undefined) return '0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(decimals);
}
