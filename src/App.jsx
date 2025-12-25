/**
 * Octra Wallet - Main Application
 * A simple, elegant wallet for the Octra network
 * 
 * SECURITY MODEL:
 * - All data stored in browser localStorage (client-side only)
 * - Password is hashed (SHA-256), never stored in plain text
 * - Private keys are encrypted with password using AES-GCM
 * - NO data is sent to any external server
 */

import { useState, useEffect, useCallback } from 'react';
import './App.css';

import { WelcomeScreen, CreateWalletScreen, ImportWalletScreen } from './components/welcome';
import { Dashboard } from './components/dashboard';
import { SettingsScreen } from './components/settings';
import { LockScreen, SetupPassword } from './components/lockscreen';

import {
  hasPasswordSecure as hasPassword,
  hasWalletsSecure as hasWallets,
  verifyPasswordSecure as verifyPassword,
  setWalletPasswordSecure as setWalletPassword,
  loadWalletsSecure as loadWallets,
  saveWalletsSecure as saveWallets, // Added
  addWalletSecure as addWallet,
  getActiveWalletIndex,
  setActiveWalletIndex,
  loadSettingsSecure as getSettings,
  saveSettingsSecure as saveSettings,
  clearAllDataSecure as clearAllData,
  getTxHistorySecure as getTxHistory,
  saveTxHistorySecure as saveTxHistory, // Added
  updateWalletNameSecure as updateWalletName,
  getPrivacyTransactionSecure as getPrivacyTransaction,
  getAllPrivacyTransactionsSecure as getAllPrivacyTransactions
} from './utils/storageSecure';
// Import VerifyPasswordSecure explicitly for session restore context consistency
import { verifyPasswordSecure } from './utils/storageSecure';
import { getRpcClient, setRpcUrl } from './utils/rpc';
import { encryptSession, decryptSession, generateSessionKey } from './utils/crypto';

// Activity logging
import { logWalletUnlock, logWalletLock } from './utils/activityLogger';

import { keyringService } from './services/KeyringService';
import { ocs01Manager } from './services/OCS01TokenService';
import { privacyService } from './services/PrivacyService';
import { balanceCache } from './utils/balanceCache';

import { CheckIcon, CloseIcon, InfoIcon } from './components/shared/Icons';

import { Toast } from './components/shared/Toast';

// Global Cache Helper
const cacheSet = (key, data, ttl) => {
  const expiry = Date.now() + ttl;
  localStorage.setItem(`cache_app_${key}`, JSON.stringify({ data, expiry }));
};

function App() {
  // App State
  const [view, setView] = useState('loading');
  // Views: 'loading' | 'welcome' | 'setup-password' | 'lock' | 'create' | 'import' | 'dashboard' | 'settings'

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState(null); // Stored in memory only, never persisted
  const [wallets, setWallets] = useState([]);
  const [activeWalletIndex, setActiveWalletIdx] = useState(0);
  const [lastRefreshId, setLastRefreshId] = useState(0);
  const [pendingWallet, setPendingWallet] = useState(null); // Wallet pending password setup

  // Session management
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes

  const [balance, setBalance] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [txLimit, setTxLimit] = useState(10);
  const [hasMoreTxs, setHasMoreTxs] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [settings, setSettingsState] = useState(getSettings());
  const [toast, setToast] = useState(null);

  // Shared tokens state with cache (30s TTL)
  const [allTokens, setAllTokens] = useState([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  // Current active wallet
  const wallet = wallets[activeWalletIndex] || null;
  const rpcClient = getRpcClient();

  // Show toast notification
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // --- Session Persistence Helpers ---

  const clearActiveSession = useCallback(() => {
    localStorage.removeItem('octra_session_data');
    localStorage.removeItem('octra_session_expiry');
  }, []);

  const saveActiveSession = useCallback(async (pwd) => {
    console.log('[DEBUG] saveActiveSession called. Pwd len:', pwd ? pwd.length : 0);
    try {
      const expiry = Date.now() + SESSION_DURATION;

      let sessionKey = localStorage.getItem('octra_session_key');
      console.log('[DEBUG] Session Key Check:', sessionKey ? 'EXISTS' : 'MISSING');

      if (!sessionKey) {
        sessionKey = generateSessionKey();
        localStorage.setItem('octra_session_key', sessionKey);
        console.log('[DEBUG] generated new session key');
      }

      if (!pwd) {
        console.error('[DEBUG] Password is empty! Cannot save session.');
        return;
      }

      console.log('[DEBUG] Encrypting session...');
      const encryptedPwd = await encryptSession(pwd, sessionKey);

      if (encryptedPwd) {
        localStorage.setItem('octra_session_data', encryptedPwd);
        localStorage.setItem('octra_session_expiry', expiry.toString());
        setSessionExpiry(expiry);
        console.log('[App] Session saved SUCCESS (expires in 5m)');
      } else {
        console.error('[App] Session encryption returned null');
      }
    } catch (e) {
      console.error('[App] Failed to save session (EXCEPTION):', e);
    }
  }, [SESSION_DURATION]);

  const restoreActiveSession = useCallback(async () => {
    try {
      const expiryStr = localStorage.getItem('octra_session_expiry');
      if (!expiryStr) return null;

      const expiry = parseInt(expiryStr, 10);
      if (Date.now() > expiry) {
        console.log('[App] Session expired');
        clearActiveSession();
        return null;
      }

      const sessionKey = localStorage.getItem('octra_session_key');
      const encryptedPwd = localStorage.getItem('octra_session_data');

      if (sessionKey && encryptedPwd) {
        const pwd = await decryptSession(encryptedPwd, sessionKey);

        if (pwd) {
          // Check integrity
          const isValid = await verifyPasswordSecure(pwd);

          if (isValid) {
            const newExpiry = Date.now() + SESSION_DURATION;
            localStorage.setItem('octra_session_expiry', newExpiry.toString());
            setSessionExpiry(newExpiry);
            console.log('[App] Session restored from persistence');
            return pwd;
          } else {
            console.warn('[App] Stored session password invalid');
            clearActiveSession();
          }
        }
      }
    } catch (e) {
      console.error('[App] Session restore failed:', e);
    }
    return null;
  }, [SESSION_DURATION, clearActiveSession]);

  // Initialize app - check if locked or needs setup
  useEffect(() => {
    const init = async () => {
      try {
        const savedSettings = getSettings();
        if (savedSettings.rpcUrl) {
          setRpcUrl(savedSettings.rpcUrl);
        }
        setSettingsState(savedSettings);

        const hasWalletsConfigured = await hasWallets();
        const hasPasswordConfigured = await hasPassword();

        if (hasWalletsConfigured && hasPasswordConfigured) {
          // Try to restore session first
          const restoredPwd = await restoreActiveSession();

          if (restoredPwd) {
            // Restore successful!
            const loadedWallets = await loadWallets(restoredPwd);
            if (loadedWallets.length > 0) {
              setWallets(loadedWallets);
              setPassword(restoredPwd);
              setIsUnlocked(true);

              await keyringService.unlock(restoredPwd, loadedWallets);
              const savedIndex = getActiveWalletIndex();
              const activeIdx = savedIndex >= 0 && savedIndex < loadedWallets.length ? savedIndex : 0;
              setActiveWalletIdx(activeIdx);
              await keyringService.setActiveWallet(loadedWallets[activeIdx].address);

              setView('dashboard');
              return;
            }
          }

          // If restore failed, show lock screen
          setView('lock');
        } else {
          // New user, show welcome
          setView('welcome');
        }
      } catch (error) {
        console.error('Init error:', error);
        setView('welcome');
      }
    };

    init();
  }, [restoreActiveSession]);

  // Session "Heartbeat" / Keep-Alive
  // As long as the extension UI is open and unlocked, we EXTEND the session.
  // The 5-minute timer should only effectively countdown when the popup is CLOSED.
  useEffect(() => {
    if (!isUnlocked) return;

    const keepAliveInterval = setInterval(() => {
      // Extend session by 5 minutes from NOW
      const newExpiry = Date.now() + SESSION_DURATION;
      localStorage.setItem('octra_session_expiry', newExpiry.toString());
      setSessionExpiry(newExpiry);
    }, 5000); // Pulse every 5 seconds

    return () => clearInterval(keepAliveInterval);
  }, [isUnlocked, SESSION_DURATION]);

  // Shared function to fetch all tokens for the active wallet
  const fetchAllTokens = useCallback(async () => {
    if (!wallet?.address || isLoadingTokens) return;

    setIsLoadingTokens(true);
    try {
      // Fetch OCS01 tokens
      const ocs01Balances = await ocs01Manager.getUserTokenBalances(wallet.address);
      const otherTokens = ocs01Balances.map(t => ({
        symbol: t.isCustom ? t.contractName : 'OCS01',
        name: t.contractName || 'OCS01 Token',
        balance: t.balance,
        contractAddress: t.contractAddress,
        isNative: false,
        isOCS01: true
      }));
      const nativeToken = { symbol: 'OCT', name: 'Octra', balance: balance, isNative: true };
      const tokens = [nativeToken, ...otherTokens];

      // Cache for 30 seconds
      const cacheKey = `tokens_${wallet.address}`;
      cacheSet(cacheKey, tokens, 30000);
      setAllTokens(tokens);

      return tokens;
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
      const fallback = [{ symbol: 'OCT', name: 'Octra', balance: balance, isNative: true }];
      setAllTokens(fallback);
      return fallback;
    } finally {
      setIsLoadingTokens(false);
    }
  }, [wallet, balance, rpcClient]);

  // Optimized balance refresh with 3-layer cache & request deduplication
  const refreshBalance = useCallback(async () => {
    if (!wallet?.address) return;

    const currentRequestId = Date.now();
    setLastRefreshId(currentRequestId);

    setIsRefreshing(true);
    try {
      // Fetch with automatic deduplication (prevents storm!)
      const data = await balanceCache.fetchWithDedup(
        wallet.address,
        async (addr) => await rpcClient.getBalance(addr)
      );

      // Race condition guard: only update if this is the latest request
      setLastRefreshId(prevId => {
        if (currentRequestId >= prevId) {
          // Batch state updates (single re-render!)
          setBalance(data.balance);
          setNonce(data.nonce);
        }
        return prevId;
      });

      // Update wallet list
      if (activeWalletIndex !== -1) {
        setWallets(prev => {
          const updated = [...prev];
          if (updated[activeWalletIndex]) {
            updated[activeWalletIndex] = {
              ...updated[activeWalletIndex],
              lastKnownBalance: data.balance
            };
          }
          return updated;
        });
      }

      // Update native token balance
      if (allTokens.length > 0) {
        const updatedTokens = allTokens.map(t =>
          t.isNative ? { ...t, balance: data.balance } : t
        );
        setAllTokens(updatedTokens);
      }

      // Save to cache with 25s TTL (slightly less than 30s refresh)
      cacheSet(`balance_${wallet.address}`, data, 25000);

    } catch (error) {
      if (error.message && error.message.includes('Sender not found')) {
        setBalance(0);
        setNonce(0);
        if (allTokens.length > 0) {
          setAllTokens(allTokens.map(t => t.isNative ? { ...t, balance: 0 } : t));
        }
      } else {
        console.error('Failed to fetch balance:', error);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [wallet, rpcClient, allTokens, activeWalletIndex]);

  // BACKGROUND: Refresh ALL wallet balances (OPTIMIZED with staggering & deduplication)
  const refreshAllBalances = useCallback(async () => {
    if (!isUnlocked || wallets.length === 0) return;

    try {
      // Use balanceCache for deduplication
      const updatedWallets = await Promise.all(wallets.map(async (w) => {
        try {
          const data = await balanceCache.fetchWithDedup(
            w.address,
            async (addr) => await rpcClient.getBalance(addr)
          );
          return { ...w, lastKnownBalance: data.balance };
        } catch (err) {
          if (err.message && err.message.includes('Sender not found')) {
            return { ...w, lastKnownBalance: 0 };
          }
          return w;
        }
      }));

      // Only update if something actually changed
      const hasChanges = updatedWallets.some((w, i) => w.lastKnownBalance !== wallets[i].lastKnownBalance);
      if (hasChanges) {
        setWallets(updatedWallets);
        // Persist to storage - SECURE STANDARDS
        await saveWallets(updatedWallets, password);
      }
    } catch (error) {
      console.error('Background balance refresh failed:', error);
    }
  }, [wallets, isUnlocked, rpcClient, password]);

  // Refresh transactions (OPTIMIZED: Merges new with old)
  const refreshTransactions = useCallback(async (customLimit = null) => {
    if (!wallet?.address) return;

    const limitToUse = customLimit || txLimit;

    try {
      // 1. Load from persistent storage first
      const storedHistory = getTxHistory(settings.network || 'testnet', wallet.address);

      // If we already have enough in storage for the current limit, and not doing a fresh refresh,
      // we can theoretically skip fetching older ones. But we always want to fetch at least 10 NEWEST.

      // OPTIMIZATION: Decrypt privacy logs ONCE
      const allPrivacyLogs = await getAllPrivacyTransactions(password);

      // 2. Fetch from network
      // 2. Fetch from network - OPTIMIZED SYNC STRATEGY
      // "Peek" strategy: Check if the latest transaction on-chain is already in our DB.
      // If yes, we are synced. Don't fetch the rest. Saves RPC calls.

      let info;
      let shouldFetchFullBatch = true;
      let limitToUse = customLimit || txLimit;

      // Only perform peek check if:
      // 1. We are not loading "more" (infinite scroll)
      // 2. We have some stored history
      if (!customLimit && storedHistory.length > 0) {
        try {
          // Fetch just the HEAD (1 item) to compare
          const headInfo = await rpcClient.getAddressInfo(wallet.address, 1);
          const latestRemoteHash = headInfo.recent_transactions?.[0]?.hash;
          const latestLocalHash = storedHistory[0]?.hash;

          if (latestRemoteHash && latestRemoteHash === latestLocalHash) {
            // SYNCED! No need to fetch details.
            console.log('[App] History is up-to-date (Optimistic Match)');
            shouldFetchFullBatch = false;

            // Reset hasMore state based on chain expectation
            const totalOnChain = headInfo.transaction_count || 0;
            setHasMoreTxs(storedHistory.length < totalOnChain);

            // Use local data as base, but assume success since we are synced
            info = headInfo; // Keeps basic structure
            info.recent_transactions = []; // Nothing new to process
          }
        } catch (e) {
          console.warn('Peek check failed, falling back to full fetch', e);
        }
      }

      if (shouldFetchFullBatch) {
        // If mismatch or empty DB, fetch the requested batch
        info = await rpcClient.getAddressInfo(wallet.address, limitToUse);

        const totalOnChain = info.transaction_count || 0;
        const fetchedCount = info.recent_transactions?.length || 0;
        const hitLimitWall = fetchedCount < limitToUse;
        const hasMoreSmart = totalOnChain > 0
          ? (limitToUse < totalOnChain)
          : !hitLimitWall;

        setHasMoreTxs(hasMoreSmart);
      }

      let newConfirmedTxs = [];
      if (shouldFetchFullBatch && info.recent_transactions && info.recent_transactions.length > 0) {
        // Throttling: Fetch transaction details in chunks of 3 to avoid RPC 429/503
        const TX_CONCURRENCY = 3;
        const processTxBatch = async (batch) => {
          return Promise.all(batch.map(async (ref) => {
            // ... Detail fetching logic (kept same, just wrapped) ...
            // We need to verify if this tx is arguably already in DB even if head didn't match?
            // But for now, just fetch details for everything returned by RPC to be safe
            try {
              const txData = await rpcClient.getTransaction(ref.hash);
              const parsed = txData.parsed_tx;
              const isIncoming = parsed.to.toLowerCase() === wallet.address.toLowerCase();
              const privacyLog = allPrivacyLogs[ref.hash] || null;
              let txType = isIncoming ? 'in' : 'out';
              if (privacyLog) txType = privacyLog.type;
              return {
                hash: ref.hash,
                type: txType,
                amount: parseFloat(parsed.amount_raw || parsed.amount || 0) / 1_000_000,
                address: isIncoming ? parsed.from : parsed.to,
                timestamp: parsed.timestamp * 1000,
                status: 'confirmed',
                epoch: txData.epoch || ref.epoch,
                ou: parsed.ou || txData.ou
              };
            } catch {
              return null; // Return null on failure instead of placeholder to cleaner list
            }
          }));
        };

        for (let i = 0; i < info.recent_transactions.length; i += TX_CONCURRENCY) {
          const batch = info.recent_transactions.slice(i, i + TX_CONCURRENCY);
          if (i > 0) await new Promise(r => setTimeout(r, 600)); // Strict 600ms throttle
          const batchResults = await processTxBatch(batch);
          newConfirmedTxs.push(...batchResults);
        }
        newConfirmedTxs = newConfirmedTxs.filter(Boolean);
      }

      // 3. Persistent Save & Update State
      saveTxHistory(newConfirmedTxs, settings.network || 'testnet', wallet.address);

      // Get the full merged history from storage
      const fullHistory = getTxHistory(settings.network || 'testnet', wallet.address);

      // 4. Add Pending Transactions (volatile, don't save to persistent history yet)
      let pendingTxs = [];
      try {
        const stagingResult = await rpcClient.get('/staging');
        if (stagingResult.json && stagingResult.json.staged_transactions) {
          const userAddrLower = wallet.address.toLowerCase();
          const confirmedHashes = new Set(fullHistory.map(tx => tx.hash));

          const ourPending = stagingResult.json.staged_transactions.filter(tx => {
            const fromAddr = (tx.from || '').toLowerCase();
            const toAddr = (tx.to || tx.to_ || '').toLowerCase();
            return (fromAddr === userAddrLower || toAddr === userAddrLower) && !confirmedHashes.has(tx.hash);
          });

          pendingTxs = ourPending.map(tx => ({
            hash: tx.hash || `pending_${tx.nonce}`,
            type: (tx.to || tx.to_ || '').toLowerCase() === userAddrLower ? 'in' : 'out',
            amount: parseFloat(tx.amount || 0) / (tx.amount && tx.amount.includes('.') ? 1 : 1_000_000),
            address: (tx.to || tx.to_ || '').toLowerCase() === userAddrLower ? tx.from : (tx.to || tx.to_),
            timestamp: Date.now(),
            status: 'pending',
            ou: tx.ou
          }));
        }
      } catch (err) { /* ignore staging errors */ }

      // Final display merge
      const displayHistory = [...pendingTxs, ...fullHistory].sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(displayHistory);

      // Also update ephemeral cache for instant load next time
      cacheSet(`txs_${wallet.address}`, displayHistory, 300000);

    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  }, [wallet, rpcClient, password, txLimit, settings.network]);

  // Load More Transactions (Infinite Scroll)
  const handleLoadMoreTransactions = useCallback(async () => {
    if (isLoadingMore || !hasMoreTxs) return;

    setIsLoadingMore(true);
    const newLimit = txLimit + 10;
    setTxLimit(newLimit);

    try {
      await refreshTransactions(newLimit);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreTxs, txLimit, refreshTransactions]);

  // Smart refresh - Simple & Smooth like MetaMask
  useEffect(() => {
    if (wallet && view === 'dashboard' && isUnlocked) {
      // Clear old data & show loading
      setBalance(0);
      setNonce(0);
      // Instant load history from storage (don't clear)
      const cachedTxs = getTxHistory(settings.network || 'testnet', wallet.address);
      setTransactions(cachedTxs);
      // setTransactions([]); // REMOVED to enabling instant persistent history loading
      setTxLimit(10);
      setHasMoreTxs(true);
      setIsRefreshing(true);

      // 1. Critical Path: Native Balance (Fastest)
      // We wait for this before triggering heavier loads
      refreshBalance().then(() => {
        // 2. Secondary Path: Tokens (Medium Priority)
        // Staggered by 200ms to allow UI updates
        setTimeout(() => {
          fetchAllTokens();
        }, 200);

        // 3. Background Path: Only Privacy Balance (Transactions fetched on demand in History View)
        setTimeout(() => {
          Promise.allSettled([
            // refreshTransactions(), // <-- DISABLED auto-fetch. User wants manual fetch on History view only.
            privacyService.getEncryptedBalance(wallet.address)
          ]).finally(() => {
            setIsRefreshing(false);
          });
        }, 1500);
      }).catch(err => {
        console.error('Critical balance fetch failed', err);
        setIsRefreshing(false);
      });

      // SECURITY: Random jitter to prevent network fingerprinting
      // Instead of predictable 30s intervals, randomize timing
      const createJitteredInterval = (fn, baseInterval, jitter = 5000) => {
        let timeoutId;
        const schedule = () => {
          const randomDelay = baseInterval + (Math.random() * jitter * 2 - jitter);
          timeoutId = setTimeout(() => {
            fn();
            schedule(); // Reschedule with new random delay
          }, randomDelay);
        };
        schedule();
        return () => clearTimeout(timeoutId);
      };

      // Auto-refresh with jitter (base: 30s, jitter: ±5s)
      const cancelBalanceRefresh = createJitteredInterval(
        () => refreshBalance().catch(() => { }),
        30000,
        5000
      );

      // Transaction refresh with jitter (base: 60s, jitter: ±8s)
      const cancelTxRefresh = createJitteredInterval(
        () => refreshTransactions().catch(() => { }),
        60000,
        8000
      );

      // Background wallet refresh (only if multiple wallets)
      let walletRefreshTimeout;
      if (wallets.length > 1) {
        const randomDelay = 120000 + (Math.random() * 20000 - 10000); // 110-130s
        walletRefreshTimeout = setTimeout(() => {
          refreshAllBalances().catch(() => { });
        }, randomDelay);
      }

      // Cleanup on unmount or wallet switch
      return () => {
        cancelBalanceRefresh();
        cancelTxRefresh();
        if (walletRefreshTimeout) clearTimeout(walletRefreshTimeout);
      };
    }
  }, [wallet?.address, view, isUnlocked]);

  // Sync tokens with balance update
  useEffect(() => {
    if (wallet?.address && isUnlocked && allTokens.length > 0) {
      const currentNative = allTokens.find(t => t.isNative);
      // Only update if there is a mismatch to prevent infinite loops
      if (currentNative && currentNative.balance !== balance) {
        const updatedTokens = allTokens.map(t =>
          t.isNative ? { ...t, balance: balance } : t
        );
        setAllTokens(updatedTokens);
      }
    }
  }, [wallet?.address, isUnlocked, balance, allTokens]);

  // Lock wallet - SECURITY: Wipes all  //
  // Lock wallet
  //
  const handleLock = useCallback(() => {
    // SECURITY: Clear all session data
    clearActiveSession();

    // Clear password from memory
    setPassword('');
    setIsUnlocked(false);
    setSessionExpiry(null);

    // Clear keyring (wipe sensitive data from memory)
    keyringService.panicLock();

    setView('lock');
    console.log('[App] 🔒 Wallet locked (Session cleared, memory wiped)');
  }, []);

  // Unlock wallet with password
  const handleUnlock = useCallback(async (enteredPassword) => {
    try {
      const isValid = await verifyPassword(enteredPassword);
      if (!isValid) {
        throw new Error('Invalid password');
      }

      const loadedWallets = await loadWallets(enteredPassword);

      if (loadedWallets.length === 0) {
        throw new Error('No wallets found');
      }

      // Auto-fix: Re-save wallets if they were recovered from HMAC mismatch
      // This ensures future unlocks won't trigger emergency recovery
      try {
        await saveWallets(loadedWallets, enteredPassword);
        console.log('[App] Wallets re-encrypted with correct HMAC');
      } catch (resaveError) {
        // Non-critical error, just log it
        console.warn('[App] Could not re-save wallets:', resaveError);
      }


      setWallets(loadedWallets);
      setPassword(enteredPassword);
      setIsUnlocked(true);

      // Save session for persistence (5 minutes)
      await saveActiveSession(enteredPassword);
      console.log('[App] Session saved with AES-GCM encryption, expires in 5 minutes');

      // Assuming setError is a state setter for an error state
      // setError(null);

      // Track unlock time for session duration
      // Assuming setUnlockTime is a state setter for unlock time
      // setUnlockTime(Date.now());

      // Initialize keyring with loaded wallets
      await keyringService.unlock(enteredPassword, loadedWallets);

      // Set active wallet (restore from saved index or default to first)
      const savedIndex = getActiveWalletIndex();
      if (savedIndex >= 0 && savedIndex < loadedWallets.length) {
        setActiveWalletIdx(savedIndex); // Changed from setActiveWallet to setActiveWalletIdx
        // setActiveWalletAddress(loadedWallets[savedIndex].address); // This state variable is not in the original code

        // Switch keyring to active wallet
        await keyringService.setActiveWallet(loadedWallets[savedIndex].address);

        // Initialize Token & Privacy Services
        await ocs01Manager.initializeSecure(enteredPassword);
        const activePk = keyringService.getPrivateKey(loadedWallets[savedIndex].address);
        const { privacyService } = await import('./services/PrivacyService');
        privacyService.setPrivateKey(activePk, enteredPassword);

        // Reset to home view
        setView('dashboard'); // Changed from setCurrentView('home') to setView('dashboard')
      } else if (loadedWallets.length > 0) {
        setActiveWalletIdx(0); // Changed from setActiveWallet to setActiveWalletIdx
        // setActiveWalletAddress(loadedWallets[0].address); // This state variable is not in the original code
        await keyringService.setActiveWallet(loadedWallets[0].address);
        setActiveWalletIndex(0);

        // Initialize Token & Privacy Services
        await ocs01Manager.initializeSecure(enteredPassword);
        const activePk = keyringService.getPrivateKey(loadedWallets[0].address);
        const { privacyService } = await import('./services/PrivacyService');
        privacyService.setPrivateKey(activePk, enteredPassword);

        setView('dashboard'); // Changed from setCurrentView('home') to setView('dashboard')
      }

      // Load saved settings
      const savedSettings = getSettings();
      setSettingsState(savedSettings); // Changed from setSettings to setSettingsState

      // Log wallet unlock
      // Assuming logWalletUnlock is a defined function
      // logWalletUnlock(loadedWallets.length).catch(err => {
      //   console.warn('[App] Failed to log wallet unlock:', err);
      // });

      // Refresh balances after unlock
      if (loadedWallets.length > 0) {
        refreshAllBalances(loadedWallets);
      }
      console.log('[App] Login successful - Data restored from cache');
    } catch (error) {
      console.error('[App] Failed to unlock:', error);
      // Assuming setError is a state setter for an error state
      // setError(error.message || 'Invalid password');
      throw error; // Re-throw to propagate error for UI handling
    }
  }, [refreshAllBalances, verifyPassword, loadWallets, keyringService, getActiveWalletIndex, setActiveWalletIdx, setActiveWalletIndex, setView, getSettings, setSettingsState, setWallets, setPassword, setIsUnlocked]);

  // Handle wallet recovery from seed phrase or private key
  const handleRecover = useCallback(async ({ type, value, newPassword }) => {
    try {
      console.log('[App] Starting wallet recovery...', { type });

      // Clear existing data first
      localStorage.clear();
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.clear();
      }
      sessionStorage.clear();

      let recoveredWallet;

      if (type === 'mnemonic') {
        // Recover from seed phrase
        const { importFromMnemonic } = await import('./utils/crypto');
        recoveredWallet = await importFromMnemonic(value);
        console.log('[App] ✅ Wallet recovered from mnemonic');
      } else {
        // Recover from private key
        const { importFromPrivateKey } = await import('./utils/crypto');
        recoveredWallet = await importFromPrivateKey(value);
        console.log('[App] ✅ Wallet recovered from private key');
      }

      // Set new password
      await setWalletPassword(newPassword);

      // VERIFY DATA INTEGRITY IMMEDIATELY
      // This ensures the password was correctly written to storage before we proceed
      const { verifyPasswordSecure } = await import('./utils/storageSecure');
      const isVerified = await verifyPasswordSecure(newPassword);

      if (!isVerified) {
        console.error('[App] Password verification failed immediately after set');
        // Retry once
        await setWalletPassword(newPassword);
        const retryVerified = await verifyPasswordSecure(newPassword);
        if (!retryVerified) {
          throw new Error('Failed to save password to secure storage. Please try again.');
        }
      }

      // Save recovered wallet
      await addWallet(recoveredWallet, newPassword);

      // Initialize keyring
      await keyringService.initialize([recoveredWallet], newPassword);
      keyringService.addKey(
        recoveredWallet.address,
        recoveredWallet.privateKeyB64,
        recoveredWallet.publicKeyB64
      );

      // Update state
      setPassword(newPassword);
      const walletWithMeta = {
        ...recoveredWallet,
        id: crypto.randomUUID(),
        name: 'Recovered Wallet'
      };
      setWallets([walletWithMeta]);
      setIsUnlocked(true);

      // Session Management (Fixed)
      // We save the session securely so it survives popup close, but expires in 5 mins
      await saveActiveSession(newPassword);

      // Fetch balance
      try {
        const balanceData = await rpcClient.getBalance(recoveredWallet.address);
        if (balanceData?.balance !== undefined) {
          setBalance(balanceData.balance);
          setNonce(balanceData.nonce || 0);
        }
      } catch (err) {
        console.warn('[App] Failed to fetch balance:', err);
        setBalance(0);
        setNonce(0);
      }

      setView('dashboard');
      console.log('[App] ✅ Wallet recovery complete');

    } catch (error) {
      console.error('[App] ❌ Recovery failed:', error);
      throw new Error(error.message || 'Failed to recover wallet. Please check your input.');
    }
  }, [keyringService, rpcClient, addWallet, setWalletPassword]);




  // Handle password change - Update all services in memory
  const handlePasswordChange = useCallback(async (newPassword) => {
    try {
      setPassword(newPassword);

      // Re-initialize keyring with new password
      if (wallets.length > 0) {
        await keyringService.initialize(wallets, newPassword);
        const activeWallet = wallets[activeWalletIndex];
        if (activeWallet) {
          await keyringService.setActiveWallet(activeWallet.address);

          // Update ocs01Manager
          await ocs01Manager.initializeSecure(newPassword);

          // Update privacyService
          const activePk = keyringService.getPrivateKey(activeWallet.address);
          // Privacy service update
          privacyService.setPrivateKey(activePk, newPassword);
        }
      }
      showToast('Password updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update services after password change:', error);
      showToast('Password changed, but session refresh failed. Please re-lock.', 'warning');
    }
  }, [wallets, activeWalletIndex, showToast]);


  // Setup password for new wallet
  const handleSetupPassword = useCallback(async (newPassword) => {
    await setWalletPassword(newPassword);
    setPassword(newPassword);

    if (pendingWallet) {
      // Save the pending wallet with the new password
      await addWallet(pendingWallet, newPassword);
      setWallets([{ ...pendingWallet, id: crypto.randomUUID(), name: 'Wallet 1' }]);
      setPendingWallet(null);
    }

    setIsUnlocked(true);
    setView('dashboard');
    // Removed success toast - user can see wallet is created
  }, [pendingWallet]);



  // Handle wallet creation - wallet and password come together now
  const handleWalletGenerated = useCallback(async (newWallet, newPassword) => {
    try {
      // Force clear any existing wallet data before creating new wallet
      if (!(await hasPassword())) {
        // First time - clear everything to ensure clean slate
        try {
          if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.clear();
          }
          localStorage.clear();
          sessionStorage.clear();
          console.log('[App] Forced data clear before wallet creation');
        } catch (clearErr) {
          console.warn('[App] Could not force clear:', clearErr);
        }

        // First time - set password
        // First time - set password
        await setWalletPassword(newPassword);

        // SECURITY: Verify password was saved correctly (Double Check)
        const isVerified = await verifyPasswordSecure(newPassword);
        if (!isVerified) {
          console.warn('[App] Password integrity check failed. Retrying storage...');
          await setWalletPassword(newPassword);
          const retryVerified = await verifyPasswordSecure(newPassword);
          if (!retryVerified) throw new Error('Critical Security Error: Cannot save password securely.');
        }
      }

      // Save persistent session immediately to prevent premature logout
      await saveActiveSession(newPassword);

      const passToUse = newPassword || password;

      // FIX: Handle race condition (double-fire) where wallet is saved twice
      try {
        await addWallet(newWallet, passToUse);
      } catch (addErr) {
        // If wallet exists, it's likely a race condition. Proceed anyway.
        if (addErr.message && addErr.message.includes('Wallet already exists')) {
          console.warn('[App] Wallet add skipped (duplicate/race-condition), proceeding to login...');
        } else {
          throw addErr;
        }
      }

      // SECURITY: Initialize keyring and add key
      await keyringService.initialize(passToUse);
      keyringService.addKey(newWallet.address, newWallet.privateKeyB64, newWallet.publicKeyB64);

      setPassword(passToUse);
      const walletWithMeta = { ...newWallet, id: crypto.randomUUID(), name: 'Wallet 1' };
      setWallets([walletWithMeta]);
      setIsUnlocked(true);

      // Initialize privacy service for new wallet
      privacyService.setPrivateKey(newWallet.privateKeyB64, passToUse);

      // ⚡ OPTIMIZATION: Skip RPC calls for new wallet (balance is always 0)
      console.log('[App] ⚡ New wallet created - skipping balance fetch (will be 0)');
      setBalance(0);
      setNonce(0);
      setTransactions([]);
      // No RPC calls needed - saves time and bandwidth!

      setView('dashboard');
      // Removed success toast
    } catch (err) {
      console.error('Failed to create wallet:', err);
      showToast(err.message || 'Failed to create wallet', 'error');
    }
  }, [password, showToast, rpcClient]);

  // Handle wallet import - wallet and password come together now
  const handleImportWallet = useCallback(async (importedWallet, newPassword) => {
    try {
      // Force clear any existing wallet data before importing (first time only)
      if (!(await hasPassword())) {
        // First time - clear everything to ensure clean slate
        try {
          if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.clear();
          }
          localStorage.clear();
          sessionStorage.clear();
          console.log('[App] Forced data clear before wallet import');
        } catch (clearErr) {
          console.warn('[App] Could not force clear:', clearErr);
        }

        // First time - set password
        await setWalletPassword(newPassword);
      }

      const passToUse = newPassword || password;

      // FIX: Handle race condition where wallet is added twice
      try {
        await addWallet(importedWallet, passToUse);
      } catch (addErr) {
        if (addErr.message && addErr.message.includes('Wallet already exists')) {
          console.warn('[App] Import ignored (duplicate), proceeding...');
        } else {
          throw addErr;
        }
      }

      // Save persistent session immediately
      await saveActiveSession(passToUse);

      // SECURITY: Initialize keyring and add key
      if (!keyringService.isUnlocked()) {
        await keyringService.initialize(passToUse);
      }
      keyringService.addKey(importedWallet.address, importedWallet.privateKeyB64, importedWallet.publicKeyB64);

      setPassword(passToUse);
      const existingWallets = wallets.length > 0 ? wallets : [];
      const newWallet = { ...importedWallet, id: crypto.randomUUID(), name: `Wallet ${existingWallets.length + 1}` };
      setWallets([...existingWallets, newWallet]);
      setIsUnlocked(true);

      // Initialize privacy service with key and password
      privacyService.setPrivateKey(importedWallet.privateKeyB64, passToUse);

      // Note: Data fetching (balance, tokens, transactions, privacy) will be 
      // automatically triggered by the main useEffect when view changes to 'dashboard'.
      // This ensures fully synchronized loading state.

      setView('dashboard');
      // Removed success toast
    } catch (err) {
      console.error('Failed to import wallet:', err);
      showToast(err.message || 'Failed to import wallet', 'error');
    }
  }, [password, wallets, showToast, rpcClient]);

  // Handle disconnect/reset
  const handleDisconnect = useCallback(() => {
    clearAllData();
    setWallets([]);
    setPassword(null);
    setBalance(0);
    setNonce(0);
    setTransactions([]);
    setIsUnlocked(false);
    setView('welcome');
    // Removed disconnect toast
  }, []);

  // Update settings
  const handleUpdateSettings = useCallback((newSettings) => {
    const updated = { ...settings, ...newSettings };
    const previousNetwork = settings?.network;
    const newNetwork = newSettings?.network;

    saveSettings(updated);
    setSettingsState(updated);

    if (newSettings.rpcUrl) {
      setRpcUrl(newSettings.rpcUrl);
    }

    // If network changed, reset balance and transactions
    if (newNetwork && previousNetwork !== newNetwork) {
      console.log(`Network changed from ${previousNetwork} to ${newNetwork}`);
      setBalance(0);
      setTransactions(getTxHistory(newNetwork));
      // Data will auto-refresh from useEffect hooks in Dashboard
    }

    // Removed settings saved toast
  }, [settings]);

  // Switch wallet
  const handleSwitchWallet = useCallback((index) => {
    setActiveWalletIdx(index);
    setActiveWalletIndex(index);
    setBalance(0);
    setTransactions([]);
  }, []);

  // Add new wallet (from Dashboard modal)
  const handleAddWallet = useCallback(async (options) => {
    try {
      const { generateWallet, importFromPrivateKey, importFromMnemonic } = await import('./utils/crypto.js');

      let newWallet;

      if (options.type === 'create') {
        // Generate new wallet
        newWallet = await generateWallet();
      } else if (options.type === 'import') {
        // Import from private key
        newWallet = await importFromPrivateKey(options.privateKey);
      } else if (options.type === 'import_mnemonic') {
        // Import from mnemonic
        newWallet = await importFromMnemonic(options.mnemonic);
      } else {
        throw new Error('Invalid add wallet type');
      }

      // Add to storage
      await addWallet(newWallet, password);

      // SECURITY: Add key to KeyringService
      keyringService.addKey(newWallet.address, newWallet.privateKeyB64, newWallet.publicKeyB64);

      // Update state
      const walletWithMeta = {
        ...newWallet,
        id: crypto.randomUUID(),
        name: `Wallet ${wallets.length + 1}`
      };

      const newWallets = [...wallets, walletWithMeta];
      setWallets(newWallets);

      // Switch to new wallet
      const newIndex = newWallets.length - 1;
      setActiveWalletIdx(newIndex);
      setActiveWalletIndex(newIndex);
      setBalance(0);
      setTransactions([]);

      showToast('New wallet added successfully', 'success');
    } catch (err) {
      console.error('Failed to add wallet:', err);
      showToast(err.message || 'Failed to add wallet', 'error');
      throw err;
    }
  }, [password, wallets]);

  // Rename wallet
  const handleRenameWallet = useCallback(async (index, newName) => {
    try {
      const walletToUpdate = wallets[index];
      if (!walletToUpdate) return;

      // Use ID if available, otherwise use address as fallback
      const identifier = walletToUpdate.id || walletToUpdate.address;

      // Update in storage
      await updateWalletName(identifier, newName, password);

      // Update state
      const updatedWallets = [...wallets];
      updatedWallets[index] = { ...walletToUpdate, name: newName };
      setWallets(updatedWallets);

      showToast('Wallet renamed successfully', 'success');
    } catch (err) {
      console.error('Failed to rename wallet:', err);
      showToast(err.message || 'Failed to rename wallet', 'error');
    }
  }, [wallets, password, showToast]);

  // Render loading state
  if (view === 'loading') {
    return (
      <div className="wallet-container">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="loading-spinner mb-lg" style={{ width: 40, height: 40 }} />
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Lock Screen */}
      {view === 'lock' && (
        <LockScreen onUnlock={handleUnlock} onRecover={handleRecover} />
      )}

      {/* Setup Password (for new users) */}
      {view === 'setup-password' && (
        <SetupPassword
          onComplete={handleSetupPassword}
          isNewWallet={true}
        />
      )}

      {/* Welcome Screen */}
      {view === 'welcome' && (
        <WelcomeScreen
          onCreateWallet={async () => {
            // Clear any existing corrupted data before creating new wallet
            try {
              if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.clear();
              }
              localStorage.clear();
              sessionStorage.clear();
              console.log('[App] Data cleared for fresh wallet creation');
            } catch (err) {
              console.warn('[App] Could not clear data:', err);
            }
            setView('create');
          }}
          onImportWallet={async () => {
            // Clear any existing corrupted data before importing
            try {
              if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.clear();
              }
              localStorage.clear();
              sessionStorage.clear();
              console.log('[App] Data cleared for fresh wallet import');
            } catch (err) {
              console.warn('[App] Could not clear data:', err);
            }
            setView('import');
          }}
        />
      )}

      {/* Create Wallet */}
      {view === 'create' && (
        <CreateWalletScreen
          onBack={() => setView('welcome')}
          onComplete={handleWalletGenerated}
        />
      )}

      {/* Import Wallet */}
      {view === 'import' && (
        <ImportWalletScreen
          onBack={() => setView('welcome')}
          onComplete={handleImportWallet}
        />
      )}

      {/* Dashboard */}
      {view === 'dashboard' && (
        <Dashboard
          wallet={wallet}
          wallets={wallets}
          balance={balance}
          nonce={nonce}
          transactions={transactions}
          settings={settings}
          onLock={handleLock}
          onUpdateSettings={handleUpdateSettings}
          onSwitchWallet={handleSwitchWallet}
          onAddWallet={handleAddWallet}
          onRenameWallet={handleRenameWallet}
          onDisconnect={handleDisconnect}
          isRefreshing={isRefreshing}
          onRefresh={refreshBalance} // Only refreshes balance normally
          onFetchHistory={refreshTransactions} // Special prop for History View
          allTokens={allTokens}
          isLoadingTokens={isLoadingTokens}
          onRefreshTokens={fetchAllTokens}
          onLoadMoreTransactions={handleLoadMoreTransactions}
          hasMoreTransactions={hasMoreTxs}
          isLoadingMore={isLoadingMore}
          onOpenSettings={() => setView('settings')}
        />
      )}

      {/* Settings Screen */}
      {view === 'settings' && (
        <SettingsScreen
          wallet={wallet}
          settings={settings}
          password={password}
          onUpdateSettings={handleUpdateSettings}
          onBack={() => setView('dashboard')}
          onDisconnect={handleDisconnect}
          onLock={handleLock}
          onPasswordChange={handlePasswordChange}
        />
      )}
    </div>
  );
}

export default App;
