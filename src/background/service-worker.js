/**
 * Background Service Worker for Octra Wallet Extension
 * 
 * SECURITY ARCHITECTURE:
 * - Isolated execution context (separate from UI)
 * - Handles all cryptographic operations
 * - Auto-lock enforcement
 * - Secure message passing with UI
 * 
 * @version 1.0.0
 */

import { keyringService } from '../services/KeyringService.js';
import { loadWalletsSecure, verifyPasswordSecure } from '../utils/storageSecure.js';

console.log('[Background] Octra Wallet Service Worker initialized');

// Auto-lock alarm
chrome.alarms.create('autoLock', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'autoLock') {
        if (keyringService.isUnlocked()) {
            console.log('[Background] Auto-lock triggered by alarm');
            keyringService.lock();

            // Notify all tabs that wallet is locked
            chrome.runtime.sendMessage({
                type: 'WALLET_LOCKED',
                timestamp: Date.now()
            }).catch(() => {
                // Ignore if no listeners
            });
        }
    }
});

// Handle messages from UI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Background] Message received:', request.type);

    (async () => {
        try {
            switch (request.type) {
                case 'UNLOCK_WALLET':
                    const { password } = request;
                    const isValid = await verifyPasswordSecure(password);

                    if (isValid) {
                        const wallets = await loadWalletsSecure(password);
                        await keyringService.unlock(password, wallets);
                        sendResponse({ success: true, wallets });
                    } else {
                        sendResponse({ success: false, error: 'Invalid password' });
                    }
                    break;

                case 'LOCK_WALLET':
                    keyringService.lock();
                    sendResponse({ success: true });
                    break;

                case 'SIGN_TRANSACTION':
                    if (!keyringService.isUnlocked()) {
                        sendResponse({ success: false, error: 'Wallet is locked' });
                        break;
                    }

                    const signedTx = await keyringService.signTransaction(
                        request.address,
                        request.txParams
                    );
                    sendResponse({ success: true, signedTx });
                    break;

                case 'IS_UNLOCKED':
                    sendResponse({ unlocked: keyringService.isUnlocked() });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('[Background] Error:', error);
            sendResponse({ success: false, error: error.message });
        }
    })();

    // Return true to indicate async response
    return true;
});

// Handle installation/update
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('[Background] Extension installed');
    } else if (details.reason === 'update') {
        console.log('[Background] Extension updated to', chrome.runtime.getManifest().version);
    }
});

// Cleanup on suspension (optional, service workers are stateless)
self.addEventListener('suspend', () => {
    console.log('[Background] Service worker suspending - locking wallet');
    keyringService.lock();
});
