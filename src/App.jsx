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

import { WelcomeScreen, CreateWalletScreen, ImportWalletScreen } from './components/WelcomeScreen';
import { Dashboard } from './components/Dashboard';
import { SettingsScreen } from './components/Settings';
import { LockScreen, SetupPassword } from './components/LockScreen';

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
  updateWalletName
} from './utils/storage';
import { getRpcClient, setRpcUrl } from './utils/rpc';
import { keyringService } from './services/KeyringService';

// Toast component
function Toast({ message, type }) {
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icon}</span>
      <span className="toast-message">{message}</span>
    </div>
  );
}

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

  // Fetch balance when wallet is available
  useEffect(() => {
    if (wallet && view === 'dashboard' && isUnlocked) {
      refreshBalance();
      refreshTransactions();

      const interval = setInterval(() => {
        refreshBalance();
        refreshTransactions();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [wallet, view, isUnlocked]);

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
    setTransactions(getTxHistory());
    setIsUnlocked(true);
    setView('dashboard');
  }, []);

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

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!wallet?.address) return;

    setIsRefreshing(true);
    try {
      const data = await rpcClient.getBalance(wallet.address);
      setBalance(data.balance);
      setNonce(data.nonce);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [wallet, rpcClient]);

  // Refresh transactions
  const refreshTransactions = useCallback(async () => {
    if (!wallet?.address) return;

    try {
      const info = await rpcClient.getAddressInfo(wallet.address, 20);

      if (info.recent_transactions && info.recent_transactions.length > 0) {
        const txs = await Promise.all(
          info.recent_transactions.slice(0, 10).map(async (ref) => {
            try {
              const txData = await rpcClient.getTransaction(ref.hash);
              const parsed = txData.parsed_tx;
              const isIncoming = parsed.to === wallet.address;

              return {
                hash: ref.hash,
                type: isIncoming ? 'in' : 'out',
                amount: parseFloat(parsed.amount_raw || parsed.amount || 0) / 1_000_000,
                address: isIncoming ? parsed.from : parsed.to,
                timestamp: parsed.timestamp * 1000,
                status: 'confirmed',
                blockNumber: ref.epoch || ref.block || txData.block || txData.epoch || txData.block_height || parsed.block
              };
            } catch {
              return null;
            }
          })
        );

        setTransactions(txs.filter(Boolean));
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  }, [wallet, rpcClient]);

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
    saveSettings(updated);
    setSettingsState(updated);

    if (newSettings.rpcUrl) {
      setRpcUrl(newSettings.rpcUrl);
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

      // Removed success toast
    } catch (err) {
      console.error('Failed to add wallet:', err);
      throw err;
    }
  }, [password, wallets]);

  // Rename wallet
  const handleRenameWallet = useCallback(async (index, newName) => {
    try {
      const walletToUpdate = wallets[index];
      if (!walletToUpdate) return;

      // Update in storage
      await updateWalletName(walletToUpdate.id, newName, password);

      // Update state
      const updatedWallets = [...wallets];
      updatedWallets[index] = { ...walletToUpdate, name: newName };
      setWallets(updatedWallets);

      // Removed success toast
    } catch (err) {
      console.error('Failed to rename wallet:', err);
      showToast('Failed to rename wallet', 'error');
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
      {toast && <Toast message={toast.message} type={toast.type} />}

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
          onRefresh={() => { refreshBalance(); refreshTransactions(); }}
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
