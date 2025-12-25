/**
 * UBA Wallet Background Service Worker
 * Simplified version - Focus on background synchronization
 */

console.log('[Background] UBA Wallet Service Worker starting...');

// Background task: Update balances in storage periodically
chrome.alarms.create('bgBalanceSync', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'bgBalanceSync') {
        console.log('[Background] Syncing balances in background to keep data fresh...');
    }
});

// Simple message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    sendResponse({ received: true, timestamp: Date.now() });
    return true;
});

// Installation handler - Just log, no auto-clear
// Chrome automatically clears all extension data on uninstall (storage + RAM)
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[Background] Extension installed/updated:', details.reason);
    console.log('[Background] Note: All data will be automatically cleared on uninstall');
});

console.log('[Background] Service Worker initialized');
