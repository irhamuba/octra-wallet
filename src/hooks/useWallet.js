import { useState, useEffect, useCallback, useRef } from 'react';
import {
    generateWallet,
    importFromMnemonic,
    importFromPrivateKey,
    createTransaction,
    truncateAddress,
    formatAmount
} from '../utils/crypto';
import { getRpcClient, setRpcUrl } from '../utils/rpc';
import {
    saveWallet,
    loadWallet,
    clearWallet,
    hasWallet,
    getSettings,
    saveSettings,
    addToTxHistory,
    getTxHistory
} from '../utils/storage';

/**
 * Main wallet hook - manages wallet state and operations
 */
export function useWallet() {
    const [wallet, setWallet] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [balance, setBalance] = useState(0);
    const [nonce, setNonce] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [settings, setSettingsState] = useState(getSettings());

    const rpcClient = useRef(getRpcClient());
    const refreshIntervalRef = useRef(null);

    // Initialize wallet on mount
    useEffect(() => {
        const initWallet = async () => {
            setIsLoading(true);
            try {
                const savedWallet = loadWallet();
                const savedSettings = getSettings();

                if (savedSettings.rpcUrl) {
                    setRpcUrl(savedSettings.rpcUrl);
                }

                if (savedWallet) {
                    setWallet(savedWallet);
                    setSettingsState(savedSettings);

                    // Load cached transaction history
                    setTransactions(getTxHistory());
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        initWallet();
    }, []);

    // Fetch balance and transactions when wallet changes
    useEffect(() => {
        if (wallet && !isLocked) {
            refreshBalance();
            refreshTransactions();

            // Auto refresh every 30 seconds
            refreshIntervalRef.current = setInterval(() => {
                refreshBalance();
            }, 30000);
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [wallet, isLocked]);

    const refreshBalance = useCallback(async () => {
        if (!wallet?.address) return;

        setIsRefreshing(true);
        try {
            const data = await rpcClient.current.getBalance(wallet.address);
            setBalance(data.balance);
            setNonce(data.nonce);
            setError(null);
        } catch (err) {
            setError('Failed to fetch balance');
        } finally {
            setIsRefreshing(false);
        }
    }, [wallet]);

    const refreshTransactions = useCallback(async () => {
        if (!wallet?.address) return;

        try {
            const info = await rpcClient.current.getAddressInfo(wallet.address, 20);

            if (info.recent_transactions && info.recent_transactions.length > 0) {
                const txs = await Promise.all(
                    info.recent_transactions.slice(0, 10).map(async (ref) => {
                        try {
                            const txData = await rpcClient.current.getTransaction(ref.hash);
                            const parsed = txData.parsed_tx;
                            const isIncoming = parsed.to === wallet.address;

                            return {
                                hash: ref.hash,
                                type: isIncoming ? 'in' : 'out',
                                amount: parseFloat(parsed.amount_raw || parsed.amount || 0) / 1_000_000,
                                address: isIncoming ? parsed.from : parsed.to,
                                timestamp: parsed.timestamp * 1000,
                                status: 'confirmed',
                                epoch: ref.epoch
                            };
                        } catch {
                            return null;
                        }
                    })
                );

                setTransactions(txs.filter(Boolean));
            }
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        }
    }, [wallet]);

    const createNewWallet = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const newWallet = await generateWallet();
            setWallet(newWallet);
            saveWallet(newWallet);
            return newWallet;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const importWalletFromMnemonic = useCallback(async (mnemonic) => {
        setIsLoading(true);
        setError(null);

        try {
            const importedWallet = await importFromMnemonic(mnemonic);
            setWallet(importedWallet);
            saveWallet(importedWallet);
            return importedWallet;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const importWalletFromPrivateKey = useCallback(async (privateKey) => {
        setIsLoading(true);
        setError(null);

        try {
            const importedWallet = await importFromPrivateKey(privateKey);
            setWallet(importedWallet);
            saveWallet(importedWallet);
            return importedWallet;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const sendTransaction = useCallback(async (to, amount, message = null) => {
        if (!wallet) throw new Error('No wallet connected');

        setIsLoading(true);
        setError(null);

        try {
            // Get fresh nonce
            const data = await rpcClient.current.getBalance(wallet.address);
            const currentNonce = data.nonce;

            // Check for pending transactions
            const staged = await rpcClient.current.getStagedTransactions();
            const ourStaged = staged.filter(tx => tx.from === wallet.address);
            const maxNonce = ourStaged.length > 0
                ? Math.max(currentNonce, ...ourStaged.map(tx => parseInt(tx.nonce)))
                : currentNonce;

            const tx = createTransaction(
                wallet.address,
                to,
                amount,
                maxNonce + 1,
                wallet.privateKeyB64,
                message
            );

            const result = await rpcClient.current.sendTransaction(tx);

            // Add to local history
            addToTxHistory({
                hash: result.txHash,
                type: 'out',
                amount,
                address: to,
                status: 'pending',
                message
            });

            // Refresh balance
            await refreshBalance();
            await refreshTransactions();

            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [wallet, refreshBalance, refreshTransactions]);

    const lockWallet = useCallback(() => {
        setIsLocked(true);
    }, []);

    const unlockWallet = useCallback(() => {
        setIsLocked(false);
    }, []);

    const disconnectWallet = useCallback(() => {
        clearWallet();
        setWallet(null);
        setBalance(0);
        setNonce(0);
        setTransactions([]);
        setIsLocked(false);
    }, []);

    const updateSettings = useCallback((newSettings) => {
        const updated = { ...settings, ...newSettings };
        saveSettings(updated);
        setSettingsState(updated);

        if (newSettings.rpcUrl) {
            setRpcUrl(newSettings.rpcUrl);
        }
    }, [settings]);

    return {
        // State
        wallet,
        isLoading,
        isLocked,
        balance,
        nonce,
        transactions,
        isRefreshing,
        error,
        settings,
        hasWallet: !!wallet,

        // Derived
        address: wallet?.address,
        displayAddress: wallet ? truncateAddress(wallet.address) : null,
        displayBalance: formatAmount(balance),

        // Actions
        createNewWallet,
        importWalletFromMnemonic,
        importWalletFromPrivateKey,
        sendTransaction,
        refreshBalance,
        refreshTransactions,
        lockWallet,
        unlockWallet,
        disconnectWallet,
        updateSettings,
        clearError: () => setError(null)
    };
}

/**
 * Toast notification hook
 */
export function useToast() {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const hideToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return {
        toasts,
        showToast,
        hideToast,
        success: (msg) => showToast(msg, 'success'),
        error: (msg) => showToast(msg, 'error'),
        info: (msg) => showToast(msg, 'info')
    };
}

/**
 * Clipboard hook
 */
export function useClipboard() {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            return true;
        } catch {
            return false;
        }
    }, []);

    return { copy, copied };
}

export default useWallet;
