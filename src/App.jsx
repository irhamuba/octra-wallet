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
  hasPassword,
  hasWallets,
  verifyPassword,
  setWalletPassword,
  loadWallets,
  addWallet,
  getActiveWalletIndex,
  setActiveWalletIndex,
  getSettings,
  saveSettings,
  clearAllData,
  getTxHistory,
  updateWalletName,
  getPrivacyTransaction,
  getAllPrivacyTransactions
} from './utils/storage';
import { getRpcClient, setRpcUrl } from './utils/rpc';
import { keyringService } from './services/KeyringService';
import { ocs01Manager } from './services/OCS01TokenService';
import { cacheGet, cacheSet, cacheHas } from './utils/cache';
import { CheckIcon, CloseIcon, InfoIcon } from './components/shared/Icons';

import { Toast } from './components/shared/Toast';

function App() {
  // App State
  const [view, setView] = useState('loading');
  // Views: 'loading' | 'welcome' | 'setup-password' | 'lock' | 'create' | 'import' | 'dashboard' | 'settings'

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState(null); // Stored in memory only, never persisted
  const [wallets, setWallets] = useState([]);
  const [activeWalletIndex, setActiveWalletIdx] = useState(0);
  const [pendingWallet, setPendingWallet] = useState(null); // Wallet pending password setup

  const [balance, setBalance] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [transactions, setTransactions] = useState([]);
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

  // Initialize app - check if locked or needs setup
  useEffect(() => {
    const init = async () => {
      try {
        const savedSettings = getSettings();
        if (savedSettings.rpcUrl) {
          setRpcUrl(savedSettings.rpcUrl);
        }
        setSettingsState(savedSettings);

        // Check if user has set up wallet before
        const hasExistingPassword = hasPassword();
        const hasExistingWallets = hasWallets();

        if (hasExistingPassword && hasExistingWallets) {
          // User has wallet, show lock screen
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
  }, []);

  // Auto-lock after inactivity (5 minutes)
  useEffect(() => {
    if (!isUnlocked) return;

    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        handleLock();
      }, (settings.autoLockMinutes || 5) * 60 * 1000);
    };

    // Events that reset the timer
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isUnlocked, settings.autoLockMinutes]);

  // Fetch all tokens with cache (30s TTL)
  const fetchAllTokens = useCallback(async () => {
    if (!wallet?.address) return [];

    const cacheKey = `tokens_${wallet.address}`;

    // Return cached if available
    if (cacheHas(cacheKey)) {
      const cached = cacheGet(cacheKey);
      setAllTokens(cached);
      return cached;
    }

    setIsLoadingTokens(true);
    try {
      const nativeToken = {
        symbol: 'OCT',
        name: 'Octra',
        balance: balance,
        isNative: true
      };

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

      const tokens = [nativeToken, ...otherTokens];

      // Cache for 30 seconds
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
  }, [wallet, balance]);

  // Refresh balance with cache (10s TTL)
  const refreshBalance = useCallback(async () => {
    if (!wallet?.address) return;

    const cacheKey = `balance_${wallet.address}`;

    // Show cached data first if available
    if (cacheHas(cacheKey)) {
      const cached = cacheGet(cacheKey);
      setBalance(cached.balance);
      setNonce(cached.nonce);
    }

    setIsRefreshing(true);
    try {
      const data = await rpcClient.getBalance(wallet.address);
      setBalance(data.balance);
      setNonce(data.nonce);

      // SILENTLY update the balance in the full wallets list too
      if (activeWalletIndex !== -1) {
        setWallets(prev => {
          const updated = [...prev];
          if (updated[activeWalletIndex]) {
            updated[activeWalletIndex] = { ...updated[activeWalletIndex], lastKnownBalance: data.balance };
          }
          return updated;
        });
      }

      // Cache for 10 seconds
      cacheSet(cacheKey, data, 10000);

      // Update token balance immediately
      if (allTokens.length > 0) {
        const updatedTokens = allTokens.map(t =>
          t.isNative ? { ...t, balance: data.balance } : t
        );
        setAllTokens(updatedTokens);
      }
    } catch (error) {
      if (error.message && error.message.includes('Sender not found')) {
        setBalance(0);
        setNonce(0);

        if (allTokens.length > 0) {
          const updatedTokens = allTokens.map(t =>
            t.isNative ? { ...t, balance: 0 } : t
          );
          setAllTokens(updatedTokens);
        }
      } else {
        console.error('Failed to fetch balance:', error);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [wallet, rpcClient, allTokens, activeWalletIndex]);

  // BACKGROUND: Refresh ALL wallet balances every 30s
  const refreshAllBalances = useCallback(async () => {
    if (!isUnlocked || wallets.length === 0) return;

    try {
      const updatedWallets = await Promise.all(wallets.map(async (w) => {
        try {
          const data = await rpcClient.getBalance(w.address);
          return { ...w, lastKnownBalance: data.balance };
        } catch (err) {
          if (err.message && err.message.includes('Sender not found')) {
            return { ...w, lastKnownBalance: 0 };
          }
          return w;
        }
      }));

      // Only update if something actually changed to avoid unnecessary re-renders
      const hasChanges = updatedWallets.some((w, i) => w.lastKnownBalance !== wallets[i].lastKnownBalance);
      if (hasChanges) {
        setWallets(updatedWallets);
        // Persist to storage so they are there on next login
        const { saveWallets: saveWalletsToStorage } = await import('./utils/storage.js');
        await saveWalletsToStorage(updatedWallets, password);
      }
    } catch (error) {
      console.error('Background balance refresh failed:', error);
    }
  }, [wallets, isUnlocked, rpcClient, password]);

  // Refresh transactions (OPTIMIZED: Batch decryption + Pending from staging)
  const refreshTransactions = useCallback(async () => {
    if (!wallet?.address) return;

    try {
      // OPTIMIZATION: Decrypt privacy logs ONCE before loop
      const allPrivacyLogs = await getAllPrivacyTransactions(password);

      // Fetch confirmed transactions
      const info = await rpcClient.getAddressInfo(wallet.address, 20);

      let confirmedTxs = [];

      // Process confirmed transactions
      if (info.recent_transactions && info.recent_transactions.length > 0) {
        confirmedTxs = await Promise.all(
          info.recent_transactions.slice(0, 10).map(async (ref) => {
            try {
              const txData = await rpcClient.getTransaction(ref.hash);
              const parsed = txData.parsed_tx;
              const isIncoming = parsed.to.toLowerCase() === wallet.address.toLowerCase();

              const privacyLog = allPrivacyLogs[ref.hash] || null;
              let txType = isIncoming ? 'in' : 'out';

              if (privacyLog) {
                txType = privacyLog.type;
              }

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
              return null;
            }
          })
        );
        confirmedTxs = confirmedTxs.filter(Boolean);
      }

      // Try to fetch pending transactions from staging (optional - don't fail if unavailable)
      let pendingTxs = [];
      try {
        const stagingResult = await rpcClient.get('/staging');
        if (stagingResult.json && stagingResult.json.staged_transactions) {
          const userAddrLower = wallet.address.toLowerCase();
          const confirmedHashes = new Set(confirmedTxs.map(tx => tx.hash));

          // Filter for OUR pending transactions only (not yet confirmed)
          const ourPending = stagingResult.json.staged_transactions.filter(tx => {
            const fromAddr = (tx.from || '').toLowerCase();
            const toAddr = (tx.to || tx.to_ || '').toLowerCase();
            const txHash = tx.hash || '';

            // Must be our tx AND not already confirmed
            return (fromAddr === userAddrLower || toAddr === userAddrLower) &&
              !confirmedHashes.has(txHash);
          });

          pendingTxs = ourPending.map(tx => {
            const toAddr = (tx.to || tx.to_ || '').toLowerCase();
            const isIncoming = toAddr === wallet.address.toLowerCase();
            return {
              hash: tx.hash || `pending_${tx.nonce}_${Date.now()}`,
              type: isIncoming ? 'in' : 'out',
              amount: parseFloat(tx.amount || 0) / (tx.amount && tx.amount.includes('.') ? 1 : 1_000_000),
              address: isIncoming ? tx.from : (tx.to || tx.to_),
              timestamp: (tx.timestamp || Date.now() / 1000) * 1000,
              status: 'pending',
              ou: tx.ou
            };
          });
        }
      } catch (stagingError) {
        // Staging fetch failed - that's OK, just show confirmed
        console.log('Staging fetch skipped:', stagingError.message);
      }

      // Merge: pending first, then confirmed
      setTransactions([...pendingTxs, ...confirmedTxs]);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  }, [wallet, rpcClient, password]);

  // Fetch balance when wallet is available
  useEffect(() => {
    if (wallet && view === 'dashboard' && isUnlocked) {
      refreshBalance();
      refreshTransactions();
      refreshAllBalances(); // Initial check for all

      const balanceInterval = setInterval(() => {
        refreshBalance();
        refreshTransactions();
      }, 10000);

      const allBalancesInterval = setInterval(() => {
        refreshAllBalances();
      }, 30000);

      return () => {
        clearInterval(balanceInterval);
        clearInterval(allBalancesInterval);
      };
    }
  }, [wallet, view, isUnlocked, refreshBalance, refreshTransactions, refreshAllBalances]);

  // Load tokens on wallet change or balance update
  useEffect(() => {
    if (wallet?.address && isUnlocked) {
      // Update allTokens immediately when balance changes
      if (allTokens.length > 0) {
        const updatedTokens = allTokens.map(t =>
          t.isNative ? { ...t, balance: balance } : t
        );
        setAllTokens(updatedTokens);
      } else {
        // First load - fetch all tokens
        fetchAllTokens();
      }
    }
  }, [wallet?.address, isUnlocked, balance, fetchAllTokens]);

  // Lock wallet - SECURITY: Wipes all keys from memory
  const handleLock = useCallback(() => {
    // CRITICAL: Securely wipe all keys from memory via KeyringService
    keyringService.lock();

    setIsUnlocked(false);
    setPassword(null);
    setWallets([]);
    setView('lock');
  }, []);

  // Unlock wallet with password
  const handleUnlock = useCallback(async (enteredPassword) => {
    const isValid = await verifyPassword(enteredPassword);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    // Load wallets with password
    const loadedWallets = await loadWallets(enteredPassword);
    if (loadedWallets.length === 0) {
      throw new Error('No wallets found');
    }

    // SECURITY: Initialize KeyringService with decrypted keys
    await keyringService.unlock(enteredPassword, loadedWallets);

    setPassword(enteredPassword);
    setWallets(loadedWallets);
    setActiveWalletIdx(getActiveWalletIndex());
    setTransactions(getTxHistory(settings.network || 'testnet'));
    setIsUnlocked(true);
    setView('dashboard');
  }, [settings.network]);

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
      if (!hasPassword()) {
        // First time - set password
        await setWalletPassword(newPassword);
      }

      const passToUse = newPassword || password;
      await addWallet(newWallet, passToUse);

      // SECURITY: Initialize keyring and add key
      await keyringService.initialize(passToUse);
      keyringService.addKey(newWallet.address, newWallet.privateKeyB64, newWallet.publicKeyB64);

      setPassword(passToUse);
      setWallets([{ ...newWallet, id: crypto.randomUUID(), name: 'Wallet 1' }]);
      setIsUnlocked(true);
      setView('dashboard');
      // Removed success toast
    } catch (err) {
      console.error('Failed to create wallet:', err);
      showToast(err.message || 'Failed to create wallet', 'error');
    }
  }, [password, showToast]);

  // Handle wallet import - wallet and password come together now
  const handleImportWallet = useCallback(async (importedWallet, newPassword) => {
    try {
      if (!hasPassword()) {
        // First time - set password
        await setWalletPassword(newPassword);
      }

      const passToUse = newPassword || password;
      await addWallet(importedWallet, passToUse);

      // SECURITY: Initialize keyring and add key
      if (!keyringService.isUnlocked()) {
        await keyringService.initialize(passToUse);
      }
      keyringService.addKey(importedWallet.address, importedWallet.privateKeyB64, importedWallet.publicKeyB64);

      setPassword(passToUse);
      const existingWallets = wallets.length > 0 ? wallets : [];
      setWallets([...existingWallets, { ...importedWallet, id: crypto.randomUUID(), name: `Wallet ${existingWallets.length + 1}` }]);
      setIsUnlocked(true);
      setView('dashboard');
      // Removed success toast
    } catch (err) {
      console.error('Failed to import wallet:', err);
      showToast(err.message || 'Failed to import wallet', 'error');
    }
  }, [password, wallets, showToast]);

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
        <LockScreen onUnlock={handleUnlock} />
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
          onCreateWallet={() => setView('create')}
          onImportWallet={() => setView('import')}
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
      {view === 'dashboard' && wallet && (
        <Dashboard
          wallet={wallet}
          wallets={wallets}
          activeWalletIndex={activeWalletIndex}
          onSwitchWallet={handleSwitchWallet}
          onAddWallet={handleAddWallet}
          onRenameWallet={handleRenameWallet}
          balance={balance}
          nonce={nonce}
          transactions={transactions}
          allTokens={allTokens}
          isLoadingTokens={isLoadingTokens}
          onRefresh={() => { refreshBalance(); refreshTransactions(); fetchAllTokens(); }}
          isRefreshing={isRefreshing}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onOpenSettings={() => setView('settings')}
          onLock={handleLock}
        />
      )}

      {/* Settings */}
      {view === 'settings' && wallet && (
        <SettingsScreen
          wallet={wallet}
          settings={settings}
          password={password}
          onUpdateSettings={handleUpdateSettings}
          onDisconnect={handleDisconnect}
          onBack={() => setView('dashboard')}
        />
      )}
    </div>
  );
}

export default App;
