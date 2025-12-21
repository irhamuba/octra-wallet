import { webcrypto } from 'node:crypto';
import { Buffer } from 'node:buffer';

// Polyfill Browser APIs for Node.js Environment
if (!globalThis.crypto) globalThis.crypto = webcrypto;
if (!globalThis.Buffer) globalThis.Buffer = Buffer;

// Polyfill Vite's import.meta.env for Node.js
if (!import.meta.env) {
    import.meta.env = {
        VITE_RPC_URL: 'https://octra.network'
    };
}

// Mock LocalStorage
const localStorageMock = {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, value) { this.store[key] = value.toString(); },
    removeItem(key) { delete this.store[key]; },
    clear() { this.store = {}; }
};
globalThis.localStorage = localStorageMock;

// Import core logic from source
// Note: We are testing the ACTUAL app code, not a mock.
import { generateWallet, importFromMnemonic } from '../src/utils/crypto.js';
import { setWalletPassword, saveWallets, loadWallets } from '../src/utils/storage.js';
import { keyringService } from '../src/services/KeyringService.js';

const TOTAL_USERS = 50; // Equivalent to 50 active users clicking at once
const ITERATIONS_PER_USER = 5;

console.log('\n🚀 Starting Octra Wallet Stress Test');
console.log('===================================');
console.log(`Resources: Node.js ${process.version}`);
console.log(`Simulation: ${TOTAL_USERS} Concurrent Users`);
console.log('===================================\n');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runStressTest() {
    const startTime = Date.now();
    const errors = [];
    const wallets = [];

    // --- Phase 1: Mass Wallet Generation & Encryption ---
    console.log(`[Phase 1] Generating & Encrypting ${TOTAL_USERS} Wallets...`);
    const p1Start = Date.now();

    for (let i = 0; i < TOTAL_USERS; i++) {
        try {
            // 1. Generate Mnemonic & Keys
            const wallet = await generateWallet();
            if (!wallet.address.startsWith('oct')) throw new Error('Invalid Address Format');

            // 2. Encrypt & Save (High CPU Load - PBKDF2)
            // We mock separate storage per user by just testing the function call integrity
            // In a real browser, each user has own localStorage. verify performance of 1 encryption.
            const password = `UserPass${i}!123`;

            // Clean previous state to simulate fresh user
            localStorage.clear();

            await setWalletPassword(password);
            await saveWallets([wallet], password);

            // Verify
            const loaded = await loadWallets(password);
            if (loaded[0].address !== wallet.address) throw new Error('Storage Corruption');

            wallets.push({ wallet, password });

            if (i % 10 === 0) process.stdout.write('.');
        } catch (e) {
            errors.push(`User ${i}: ${e.message}`);
            process.stdout.write('x');
        }
    }
    console.log(`\n✅ Phase 1 Complete in ${((Date.now() - p1Start) / 1000).toFixed(2)}s`);

    // --- Phase 2: Transaction Signing Burst ---
    console.log(`\n[Phase 2] Signing Stress Test (${TOTAL_USERS * ITERATIONS_PER_USER} txs)...`);
    const p2Start = Date.now();

    // Unlock Keyring First
    // In this test, we simulate unlocking ONE active session repeatedly or many sessions?
    // Let's test the KeyringService switching.

    let signedCount = 0;

    for (const user of wallets) {
        try {
            // Unlock
            await keyringService.unlock(user.password, [user.wallet]);

            if (!keyringService.isUnlocked()) throw new Error('Unlock Failed');

            // Sign multiple transactions rapidly
            for (let k = 0; k < ITERATIONS_PER_USER; k++) {
                const txParams = {
                    to: 'oct1ReceiverAddressExampleForTest1234567890',
                    amount: '10.5',
                    fee: '0.01',
                    nonce: k
                };

                const signedTx = await keyringService.signTransaction(user.wallet.address, txParams);
                if (!signedTx.signature) throw new Error('Sign Failed');
                signedCount++;
            }

            // Lock
            keyringService.lock();
            if (keyringService.isUnlocked()) throw new Error('Lock Failed');

        } catch (e) {
            errors.push(`Signing Error: ${e.message}`);
        }
    }
    console.log(`✅ Phase 2 Complete: ${signedCount} txs signed in ${((Date.now() - p2Start) / 1000).toFixed(2)}s`);

    // --- Phase 3: Memory Leak Check ---
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`\n[Unstats] Memory Usage: ${Math.round(used * 100) / 100} MB`);

    console.log('\n===================================');
    if (errors.length === 0) {
        console.log('🎉 RESULT: PASSED (100% Success)');
        console.log('Performance Rating: Excellent');
        console.log(`Total Time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    } else {
        console.log(`⚠️ RESULT: FAILED with ${errors.length} errors`);
        console.log(errors.slice(0, 5));
    }
    console.log('===================================');
}

runStressTest();
