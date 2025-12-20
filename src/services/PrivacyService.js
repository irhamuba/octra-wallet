/**
 * Privacy Service for Octra Wallet
 * 
 * Implements Octra's FHE-based privacy features exactly matching
 * the official octra_pre_client implementation.
 * 
 * API Endpoints:
 * - GET /view_encrypted_balance/{address} (requires X-Private-Key header)
 * - POST /encrypt_balance (shield)
 * - POST /decrypt_balance (unshield)
 * - POST /private_transfer
 * - GET /pending_private_transfers?address={addr} (requires X-Private-Key header)
 * - POST /claim_private_transfer
 */

import { getRpcClient } from '../utils/rpc';
import { base64ToBuffer, bufferToBase64 } from '../utils/crypto';
import { savePrivacyTransaction } from '../utils/storage';
import { keyringService } from './KeyringService';
import nacl from 'tweetnacl';

/**
 * Derive encryption key from private key (matching Octra protocol)
 * Uses: SHA256("octra_encrypted_balance_v2" + privateKeyBytes)[:32]
 */
async function deriveEncryptionKey(privateKeyB64) {
    const privateKeyBytes = base64ToBuffer(privateKeyB64);
    const salt = new TextEncoder().encode('octra_encrypted_balance_v2');

    // Concatenate salt + privateKey
    const combined = new Uint8Array(salt.length + privateKeyBytes.length);
    combined.set(salt);
    combined.set(privateKeyBytes, salt.length);

    // SHA256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    return new Uint8Array(hashBuffer).slice(0, 32);
}

/**
 * Encrypt balance value for storage (v2 format)
 * Format: "v2|" + base64(nonce + ciphertext)
 */
async function encryptBalance(balance, privateKeyB64) {
    const key = await deriveEncryptionKey(privateKeyB64);
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(String(balance));

    // Import key for AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce },
        cryptoKey,
        plaintext
    );

    // Combine nonce + ciphertext
    const combined = new Uint8Array(nonce.length + ciphertext.byteLength);
    combined.set(nonce);
    combined.set(new Uint8Array(ciphertext), nonce.length);

    return 'v2|' + bufferToBase64(combined);
}

/**
 * Privacy Service Class
 */
class PrivacyService {
    constructor() {
        this.rpcClient = getRpcClient();
        this._privateKey = null;
        this._publicKey = null;
    }

    /**
     * Helper to get the 64-byte expanded secret key (seed + public component)
     * Mainnet parsers expect the full 64-byte secret key in the private_key field.
     * Base64 of 64 bytes is 88 characters.
     */
    /**
     * Helper to get the 64-byte expanded secret key (seed + public component)
     * Mainnet parsers expect the full 64-byte secret key in the private_key field.
     * Base64 of 64 bytes is 88 characters.
     */
    getExpandedPrivateKey() {
        if (!this._privateKey) return null;
        try {
            if (!nacl) throw new Error('NaCl library not initialized');

            const seed = base64ToBuffer(this._privateKey);
            if (seed.length !== 32) {
                console.warn(`Warning: Seed length is ${seed.length} bytes (expected 32)`);
            }

            const keyPair = nacl.sign.keyPair.fromSeed(seed);

            // Auto-set public key if missing
            if (!this._publicKey) {
                this._publicKey = bufferToBase64(keyPair.publicKey);
                console.log('Public key derived on-the-fly');
            }

            const expandedKey = bufferToBase64(keyPair.secretKey);
            // console.log(`Key expansion: Seed(${this._privateKey.length}) -> Expanded(${expandedKey.length})`);
            return expandedKey;
        } catch (error) {
            console.error('Error expanding private key:', error);
            // Do NOT fallback to seed for Mainnet, it will fail.
            // Throwing allows UI to catch the specific error.
            throw new Error(`Key expansion failed: ${error.message}`);
        }
    }

    /**
     * Set the wallet private key and derive corresponding public key
     */
    setPrivateKey(privateKeyB64) {
        if (!privateKeyB64) return;
        this._privateKey = privateKeyB64;
        try {
            // Try to derive public key immediately, but don't crash if nacl isn't ready
            if (nacl) {
                const seed = base64ToBuffer(privateKeyB64);
                const keyPair = nacl.sign.keyPair.fromSeed(seed);
                this._publicKey = bufferToBase64(keyPair.publicKey);
            }
        } catch (error) {
            console.error('Error deriving public key during set:', error);
        }
    }

    /**
     * Clear private key from memory
     */
    clearPrivateKey() {
        this._privateKey = null;
        this._publicKey = null;
    }

    /**
     * Get RPC URL (handles proxy in dev)
     */
    getRpcUrl() {
        return this.rpcClient.rpcUrl;
    }

    /**
     * Get encrypted balance for an address
     */
    async getEncryptedBalance(address) {
        try {
            // Auto-fetch private key from KeyringService if not set
            let privateKey = this._privateKey;
            if (!privateKey && keyringService.isUnlocked()) {
                privateKey = keyringService.getPrivateKey(address, 'getEncryptedBalance');
            }

            if (!privateKey) {
                console.warn('[PrivacyService] No private key available for encrypted balance');
                return {
                    success: false,
                    error: 'Wallet locked or no key available',
                    publicBalance: 0,
                    encryptedBalance: 0,
                    totalBalance: 0,
                    hasEncryptedFunds: false
                };
            }

            const response = await fetch(
                `${this.getRpcUrl()}/view_encrypted_balance/${address}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Private-Key': privateKey
                    }
                }
            );


            if (!response.ok) {
                if (response.status === 404) {
                    return {
                        success: true,
                        publicBalance: 0,
                        publicBalanceRaw: 0,
                        encryptedBalance: 0,
                        encryptedBalanceRaw: 0,
                        totalBalance: 0,
                        hasEncryptedFunds: false
                    };
                }
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }

            const data = await response.json();

            // Parse balance strings (format: "1.234567 OCT")
            const parseBalance = (str) => {
                if (!str) return 0;
                const parts = String(str).split(' ');
                return parseFloat(parts[0]) || 0;
            };

            return {
                success: true,
                publicBalance: parseBalance(data.public_balance),
                publicBalanceRaw: parseInt(data.public_balance_raw || '0'),
                encryptedBalance: parseBalance(data.encrypted_balance),
                encryptedBalanceRaw: parseInt(data.encrypted_balance_raw || '0'),
                totalBalance: parseBalance(data.total_balance),
                hasEncryptedFunds: parseInt(data.encrypted_balance_raw || '0') > 0
            };
        } catch (error) {
            console.error('getEncryptedBalance error:', error);
            return {
                success: false,
                error: error.message,
                publicBalance: 0,
                encryptedBalance: 0,
                totalBalance: 0,
                hasEncryptedFunds: false
            };
        }
    }

    /**
     * Shield balance - Convert public balance to encrypted balance
     */
    async shieldBalance(address, amount) {
        if (!this._privateKey) throw new Error('Private key not set');

        try {
            const encData = await this.getEncryptedBalance(address);
            const μ = 1_000_000;
            const amountRaw = Math.floor(amount * μ);
            const newEncryptedRaw = encData.encryptedBalanceRaw + amountRaw;

            // Encrypt the new balance
            const encryptedValue = await encryptBalance(newEncryptedRaw, this._privateKey);

            // Fetch current nonce to prevent replay
            const walletData = await this.rpcClient.getBalance(address).catch(() => ({ nonce: 0 }));

            // Submit to network - Mainnet style (Required for https://octra.network)
            const data = {
                address: address,
                amount: String(amountRaw),
                private_key: this.getExpandedPrivateKey(), // 64-byte key required
                public_key: this._publicKey,
                nonce: (walletData.nonce || 0) + 1,
                timestamp: Date.now() / 1000,
                encrypted_data: encryptedValue
            };

            console.log('Shield request (mainnet-style):', { ...data, private_key: '[HIDDEN]' });

            const response = await fetch(`${this.getRpcUrl()}/encrypt_balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const responseText = await response.text();
            console.log('Shield response:', responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch {
                result = { error: responseText };
            }

            if (response.ok && result.tx_hash) {
                savePrivacyTransaction(result.tx_hash, 'shield', { amount });
                return { success: true, txHash: result.tx_hash };
            }

            throw new Error(result.error || responseText || 'Shield operation failed');
        } catch (error) {
            console.error('shieldBalance error:', error);
            throw error;
        }
    }

    /**
     * Unshield balance - Convert encrypted balance to public balance
     */
    async unshieldBalance(address, amount) {
        if (!this._privateKey) throw new Error('Private key not set');

        try {
            const encData = await this.getEncryptedBalance(address);
            const μ = 1_000_000;
            const amountRaw = Math.floor(amount * μ);

            if (encData.encryptedBalanceRaw < amountRaw) {
                throw new Error(`Insufficient encrypted balance. Available: ${encData.encryptedBalance} OCT`);
            }

            const newEncryptedRaw = encData.encryptedBalanceRaw - amountRaw;
            const encryptedValue = await encryptBalance(newEncryptedRaw, this._privateKey);
            const walletData = await this.rpcClient.getBalance(address).catch(() => ({ nonce: 0 }));

            const data = {
                address: address,
                amount: String(amountRaw),
                private_key: this.getExpandedPrivateKey(), // 64-byte key for Mainnet
                public_key: this._publicKey,
                nonce: (walletData.nonce || 0) + 1,
                timestamp: Date.now() / 1000,
                encrypted_data: encryptedValue
            };

            console.log('Unshield request (mainnet-style):', { ...data, private_key: '[HIDDEN]' });

            const response = await fetch(`${this.getRpcUrl()}/decrypt_balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const responseText = await response.text();
            console.log('Unshield response:', responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch {
                result = { error: responseText };
            }

            if (response.ok && result.tx_hash) {
                savePrivacyTransaction(result.tx_hash, 'unshield', { amount });
                return { success: true, txHash: result.tx_hash };
            }

            throw new Error(result.error || responseText || 'Unshield operation failed');
        } catch (error) {
            console.error('unshieldBalance error:', error);
            throw error;
        }
    }

    /**
     * Get recipient's public key
     */
    async getRecipientPublicKey(address) {
        try {
            const response = await fetch(`${this.getRpcUrl()}/public_key/${address}`);
            if (response.ok) {
                const data = await response.json();
                return data.public_key;
            }
            return null;
        } catch (error) {
            console.error('getRecipientPublicKey error:', error);
            return null;
        }
    }

    /**
     * Get address info
     */
    async getAddressInfo(address) {
        try {
            const response = await fetch(`${this.getRpcUrl()}/address/${address}`);
            if (response.ok) return await response.json();
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Privacy Transfer - Send from encrypted balance
     */
    async privacyTransfer(from, to, amount) {
        if (!this._privateKey) throw new Error('Private key not set');

        try {
            const addrInfo = await this.getAddressInfo(to);
            if (!addrInfo || !addrInfo.has_public_key) {
                throw new Error('Recipient has no public key registered');
            }

            const toPublicKey = await this.getRecipientPublicKey(to);
            if (!toPublicKey) throw new Error('Cannot get recipient public key');

            const μ = 1_000_000;
            const amountRaw = Math.floor(amount * μ);
            const walletData = await this.rpcClient.getBalance(from).catch(() => ({ nonce: 0 }));

            const data = {
                from: from,
                to: to,
                amount: String(amountRaw),
                from_private_key: this.getExpandedPrivateKey(), // 64-byte key
                from_public_key: this._publicKey,
                to_public_key: toPublicKey,
                nonce: (walletData.nonce || 0) + 1,
                timestamp: Date.now() / 1000
            };

            console.log('Private transfer request:', { ...data, from_private_key: '[HIDDEN]' });

            const response = await fetch(`${this.getRpcUrl()}/private_transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const responseText = await response.text();
            console.log('Private transfer response:', responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch {
                result = { error: responseText };
            }

            if (response.ok && result.tx_hash) {
                savePrivacyTransaction(result.tx_hash, 'private', { amount, to });
                return { success: true, txHash: result.tx_hash };
            }

            throw new Error(result.error || responseText || 'Privacy transfer failed');
        } catch (error) {
            console.error('privacyTransfer error:', error);
            throw error;
        }
    }

    /**
     * Get pending private transfers
     */
    async getPendingTransfers(address) {
        try {
            // Auto-fetch private key from KeyringService if not set
            let privateKey = this._privateKey;
            if (!privateKey && keyringService.isUnlocked()) {
                privateKey = keyringService.getPrivateKey(address, 'getPendingTransfers');
            }

            if (!privateKey) {
                return []; // No key = no pending transfers to show
            }

            const response = await fetch(
                `${this.getRpcUrl()}/pending_private_transfers?address=${address}`,
                {
                    headers: { 'X-Private-Key': privateKey }
                }
            );

            if (response.ok) {
                const data = await response.json();
                return data.pending_transfers || [];
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Claim a pending private transfer
     */
    async claimPrivateTransfer(address, transferId) {
        if (!this._privateKey) throw new Error('Private key not set');

        try {
            const walletData = await this.rpcClient.getBalance(address).catch(() => ({ nonce: 0 }));

            const data = {
                recipient_address: address,
                private_key: this.getExpandedPrivateKey(), // 64-byte key
                public_key: this._publicKey,
                transfer_id: transferId,
                nonce: (walletData.nonce || 0) + 1,
                timestamp: Date.now() / 1000
            };

            console.log('Claim request:', { ...data, private_key: '[HIDDEN]' });

            const response = await fetch(`${this.getRpcUrl()}/claim_private_transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const responseText = await response.text();
            console.log('Claim response:', responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch {
                result = { error: responseText };
            }

            if (response.ok && result.tx_hash) {
                savePrivacyTransaction(result.tx_hash, 'claim', { transferId });
                return { success: true, txHash: result.tx_hash };
            }

            throw new Error(result.error || responseText || 'Claim failed');
        } catch (error) {
            console.error('claimPrivateTransfer error:', error);
            throw error;
        }
    }

    /**
     * Get privacy status summary
     */
    async getPrivacyStatus(address) {
        const encBalance = await this.getEncryptedBalance(address);

        if (!encBalance.success) {
            return {
                isPrivacyEnabled: false,
                error: encBalance.error
            };
        }

        const privacyRatio = encBalance.totalBalance > 0
            ? (encBalance.encryptedBalance / encBalance.totalBalance * 100)
            : 0;

        return {
            isPrivacyEnabled: encBalance.hasEncryptedFunds,
            publicBalance: encBalance.publicBalance,
            encryptedBalance: encBalance.encryptedBalance,
            totalBalance: encBalance.totalBalance,
            privacyRatio: privacyRatio.toFixed(1)
        };
    }
}

// Singleton instance
export const privacyService = new PrivacyService();

// Export for testing
export { PrivacyService, encryptBalance };
