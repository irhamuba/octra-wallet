/**
 * Dashboard Component - Main wallet view
 * Displays balance, actions, and token list
 */

import { useState, useEffect } from 'react';
import './Dashboard.css';
import {
    UbaLogo,
    OctraLogo,
    SendIcon,
    ReceiveIcon,
    HistoryIcon,
    RefreshIcon,
    CloseIcon,
    SettingsIcon,
    WalletIcon,
    EditIcon,
    ChevronDownIcon,
    CheckIcon,
    PrivacyIcon,
    PlusIcon,
    ImportIcon,
    KeyIcon,
    InfoIcon,
    CopyIcon
} from '../shared/Icons';
import { truncateAddress } from '../../utils/crypto';
import { getRpcClient } from '../../utils/rpc';

// Sub-components
import { HomeView } from './Home';
import { SendView } from './Send';
import { ReceiveView } from './Receive';
import { HistoryView } from './History';
import { PrivacyView } from './Privacy';
import { TokenDetailView } from './TokenDetail';

// Feature components
import { TransactionHistory } from '../../features/history';
import { NFTGallery } from '../../features/nft';

export function Dashboard({ wallet, wallets, activeWalletIndex, onSwitchWallet, onAddWallet, onRenameWallet, balance, nonce, transactions, allTokens, isLoadingTokens, onRefresh, isRefreshing, settings, onUpdateSettings, onOpenSettings, onLock }) {
    const [view, setView] = useState('home'); // 'home' | 'send' | 'receive' | 'history' | 'nft' | 'tokens' | 'addressbook'
    const [copied, setCopied] = useState(false);
    const [showWalletSwitcher, setShowWalletSwitcher] = useState(false);
    const [currentNetwork, setCurrentNetwork] = useState('testnet');
    const [showAddWallet, setShowAddWallet] = useState(false);
    const [addWalletMode, setAddWalletMode] = useState(null); // 'create' | 'import'
    const [importPrivateKey, setImportPrivateKey] = useState('');
    const [addWalletError, setAddWalletError] = useState('');
    const [isAddingWallet, setIsAddingWallet] = useState(false);

    // Session-based balance visibility (resets on refresh)
    const [isBalanceHidden, setIsBalanceHidden] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState(null);

    // Rename wallet state
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameWalletIndex, setRenameWalletIndex] = useState(null);
    const [renameWalletName, setRenameWalletName] = useState('');

    // Token detail state
    const [selectedToken, setSelectedToken] = useState(null);

    // Show toast notification
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Reset to home view when wallet changes
    useEffect(() => {
        setView('home');
        setSelectedToken(null);
    }, [wallet?.address, activeWalletIndex]);

    const rpcClient = getRpcClient(settings?.rpcUrl);

    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(wallet.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy address', error);
        }
    };

    const handleBack = () => {
        if (selectedToken) {
            setSelectedToken(null);
            setView('tokens');
        } else {
            setView('home');
        }
    };

    const handleTokenClick = (token) => {
        setSelectedToken(token);
        setView('token-detail');
    };

    const handleTokenSend = (token) => {
        setSelectedToken(token);
        setView('send');
    };

    const handleQuickSend = (address) => {
        // Pre-fill send view with address
        setView('send');
        // TODO: Pass address to SendView
    };

    const handleSelectWallet = (index) => {
        onSwitchWallet(index);
        setShowWalletSwitcher(false);
    };

    const handleOpenAddWallet = () => {
        setShowWalletSwitcher(false);
        setShowAddWallet(true);
        setAddWalletMode(null);
        setImportPrivateKey('');
        setAddWalletError('');
    };

    const handleCreateNewWallet = async () => {
        setIsAddingWallet(true);
        setAddWalletError('');

        try {
            await onAddWallet({ type: 'create' });
            setShowAddWallet(false);
            setAddWalletMode(null);
        } catch (err) {
            setAddWalletError(err.message || 'Failed to create wallet');
        }

        setIsAddingWallet(false);
    };

    const handleImportWallet = async () => {
        if (!importPrivateKey.trim()) {
            setAddWalletError('Please enter private key');
            return;
        }

        setIsAddingWallet(true);
        setAddWalletError('');

        try {
            await onAddWallet({ type: 'import', privateKey: importPrivateKey.trim() });
            setShowAddWallet(false);
            setAddWalletMode(null);
            setImportPrivateKey('');
        } catch (err) {
            setAddWalletError(err.message || 'Failed to import wallet');
        }

        setIsAddingWallet(false);
    };

    const handleImportMnemonicWallet = async () => {
        if (!importPrivateKey.trim()) {
            setAddWalletError('Please enter recovery phrase');
            return;
        }

        setIsAddingWallet(true);
        setAddWalletError('');

        try {
            await onAddWallet({ type: 'import_mnemonic', mnemonic: importPrivateKey.trim() });
            setShowAddWallet(false);
            setAddWalletMode(null);
            setImportPrivateKey('');
        } catch (err) {
            setAddWalletError(err.message || 'Failed to import wallet from phrase');
        }

        setIsAddingWallet(false);
    };

    // Rename wallet handlers
    const handleOpenRename = (index, currentName, e) => {
        e.stopPropagation(); // Don't select wallet when clicking edit
        setRenameWalletIndex(index);
        setRenameWalletName(currentName || `Wallet ${index + 1}`);
        setShowRenameModal(true);
    };

    const handleSaveRename = () => {
        if (renameWalletName.trim() && onRenameWallet) {
            onRenameWallet(renameWalletIndex, renameWalletName.trim());
        }
        setShowRenameModal(false);
        setRenameWalletIndex(null);
        setRenameWalletName('');
    };

    return (
        <>
            {/* Header */}
            <header className="wallet-header">
                {/* Wallet Logo - Click to show wallet switcher */}
                <div className="flex items-center gap-xs">
                    <div
                        className="wallet-logo wallet-logo-clickable"
                        onClick={() => setShowWalletSwitcher(!showWalletSwitcher)}
                    >
                        <div className="wallet-logo-icon">
                            <UbaLogo size={18} />
                        </div>
                        <span className="wallet-logo-text">
                            {(wallet.name || `Wallet ${activeWalletIndex + 1}`).slice(0, 8)}
                        </span>
                        <ChevronDownIcon size={14} className={showWalletSwitcher ? 'rotate-180' : ''} />
                    </div>
                </div>
                <div className="header-actions">
                    {/* Address Copy Pill - Moved to right */}
                    <div
                        className="header-address-pill"
                        onClick={handleCopyAddress}
                        title="Copy Address"
                    >
                        <span className="address-pill-text">{truncateAddress(wallet.address, 4, 4)}</span>
                        {copied ? (
                            <CheckIcon size={10} className="text-success" />
                        ) : (
                            <CopyIcon size={10} className="text-tertiary" />
                        )}
                    </div>

                    <button className="header-icon-btn" onClick={onOpenSettings}>
                        <SettingsIcon size={18} />
                    </button>
                </div>

                {/* Wallet Switcher Dropdown */}
                {showWalletSwitcher && (
                    <div className="wallet-switcher-dropdown animate-fade-in">
                        <div className="wallet-switcher-header">
                            <span className="text-sm font-semibold">Wallets</span>
                            <button className="add-wallet-btn" onClick={handleOpenAddWallet}>
                                <span>+</span>
                            </button>
                        </div>
                        <div className="wallet-switcher-list">
                            {wallets && wallets.map((w, idx) => (
                                <div
                                    key={w.id || idx}
                                    className={`wallet-switcher-item ${idx === activeWalletIndex ? 'active' : ''}`}
                                    onClick={() => handleSelectWallet(idx)}
                                >
                                    <div
                                        className="wallet-switcher-avatar"
                                        onClick={(e) => handleOpenRename(idx, w.name, e)}
                                    >
                                        <div className="wallet-switcher-icon">
                                            <WalletIcon size={16} />
                                        </div>
                                        <div className="wallet-switcher-edit">
                                            <EditIcon size={10} />
                                        </div>
                                    </div>
                                    <div className="wallet-switcher-info">
                                        <span className="wallet-switcher-name">{w.name || `Wallet ${idx + 1}`}</span>
                                        <span className="wallet-switcher-address">{truncateAddress(w.address, 6)}</span>
                                    </div>
                                    {idx === activeWalletIndex && (
                                        <CheckIcon size={16} className="text-accent" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {/* Click outside to close dropdown */}
            {showWalletSwitcher && (
                <div className="wallet-switcher-overlay" onClick={() => setShowWalletSwitcher(false)} />
            )}

            {/* Rename Wallet Modal */}
            {showRenameModal && (
                <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
                    <div className="modal-content rename-wallet-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="text-lg font-semibold">Rename Wallet</h3>
                            <button className="modal-close" onClick={() => setShowRenameModal(false)}>
                                <CloseIcon size={20} />
                            </button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Wallet Name</label>
                            <input
                                type="text"
                                className="input"
                                value={renameWalletName}
                                onChange={(e) => setRenameWalletName(e.target.value)}
                                placeholder="Enter wallet name..."
                                maxLength={20}
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-md">
                            <button
                                className="btn btn-secondary flex-1"
                                onClick={() => setShowRenameModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary flex-1"
                                onClick={handleSaveRename}
                                disabled={!renameWalletName.trim()}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Add Wallet Modal */}
            {showAddWallet && (
                <div className="modal-overlay" onClick={() => setShowAddWallet(false)}>
                    <div className="modal-content add-wallet-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="text-lg font-semibold">
                                {addWalletMode === null && 'Add Wallet'}
                                {addWalletMode === 'create' && 'Create New Wallet'}
                                {addWalletMode === 'import' && 'Import Wallet'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowAddWallet(false)}>
                                <CloseIcon size={20} />
                            </button>
                        </div>

                        {/* Step 1: Choose mode */}
                        {addWalletMode === null && (
                            <div className="add-wallet-options">
                                <button className="add-wallet-option" onClick={() => setAddWalletMode('create')}>
                                    <div className="add-wallet-option-icon">
                                        <PlusIcon size={24} />
                                    </div>
                                    <div className="add-wallet-option-info">
                                        <span className="add-wallet-option-title">Create New Wallet</span>
                                        <span className="add-wallet-option-desc">Generate a new wallet automatically</span>
                                    </div>
                                </button>
                                <button className="add-wallet-option" onClick={() => setAddWalletMode('import_mnemonic')}>
                                    <div className="add-wallet-option-icon">
                                        <ImportIcon size={24} />
                                    </div>
                                    <div className="add-wallet-option-info">
                                        <span className="add-wallet-option-title">Import Recovery Phrase</span>
                                        <span className="add-wallet-option-desc">Use 12-word recovery phrase</span>
                                    </div>
                                </button>
                                <button className="add-wallet-option" onClick={() => setAddWalletMode('import')}>
                                    <div className="add-wallet-option-icon">
                                        <KeyIcon size={24} />
                                    </div>
                                    <div className="add-wallet-option-info">
                                        <span className="add-wallet-option-title">Import Private Key</span>
                                        <span className="add-wallet-option-desc">Use existing private key</span>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Create new wallet */}
                        {addWalletMode === 'create' && (
                            <div className="add-wallet-form">
                                <p className="text-secondary text-sm mb-lg">
                                    A new wallet will be created automatically. Make sure to backup the seed phrase from Settings later.
                                </p>

                                {addWalletError && (
                                    <p className="text-error text-sm mb-lg">{addWalletError}</p>
                                )}

                                <div className="flex gap-md">
                                    <button
                                        className="btn btn-secondary flex-1"
                                        onClick={() => setAddWalletMode(null)}
                                        disabled={isAddingWallet}
                                    >
                                        Back
                                    </button>
                                    <button
                                        className="btn btn-primary flex-1"
                                        onClick={handleCreateNewWallet}
                                        disabled={isAddingWallet}
                                    >
                                        {isAddingWallet ? 'Creating...' : 'Create Wallet'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Import with private key */}
                        {addWalletMode === 'import' && (
                            <div className="add-wallet-form">
                                <div className="form-group">
                                    <label className="form-label">Private Key (Base64)</label>
                                    <textarea
                                        className="input input-mono"
                                        value={importPrivateKey}
                                        onChange={(e) => setImportPrivateKey(e.target.value)}
                                        placeholder="Paste your private key here..."
                                        rows={3}
                                    />
                                </div>

                                {addWalletError && (
                                    <p className="text-error text-sm mb-lg">{addWalletError}</p>
                                )}

                                <div className="flex gap-md">
                                    <button
                                        className="btn btn-secondary flex-1"
                                        onClick={() => setAddWalletMode(null)}
                                        disabled={isAddingWallet}
                                    >
                                        Back
                                    </button>
                                    <button
                                        className="btn btn-primary flex-1"
                                        onClick={handleImportWallet}
                                        disabled={isAddingWallet || !importPrivateKey.trim()}
                                    >
                                        {isAddingWallet ? 'Importing...' : 'Import Wallet'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Import with Mnemonic */}
                        {addWalletMode === 'import_mnemonic' && (
                            <div className="add-wallet-form">
                                <div className="form-group">
                                    <label className="form-label">Recovery Phrase (12 words)</label>
                                    <textarea
                                        className="input input-mono"
                                        value={importPrivateKey} // Reuse state variable for simplicity or create new one
                                        onChange={(e) => setImportPrivateKey(e.target.value)}
                                        placeholder="word1 word2 word3 ..."
                                        rows={3}
                                    />
                                    <p className="form-hint">Separate words with spaces</p>
                                </div>

                                {addWalletError && (
                                    <p className="text-error text-sm mb-lg">{addWalletError}</p>
                                )}

                                <div className="flex gap-md">
                                    <button
                                        className="btn btn-secondary flex-1"
                                        onClick={() => {
                                            setAddWalletMode(null);
                                            setImportPrivateKey('');
                                        }}
                                        disabled={isAddingWallet}
                                    >
                                        Back
                                    </button>
                                    <button
                                        className="btn btn-primary flex-1"
                                        onClick={handleImportMnemonicWallet}
                                        disabled={isAddingWallet || !importPrivateKey.trim()}
                                    >
                                        {isAddingWallet ? 'Importing...' : 'Import Wallet'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="wallet-content">
                {view === 'home' && (
                    <HomeView
                        wallet={wallet}
                        balance={balance}
                        transactions={transactions}
                        onCopyAddress={handleCopyAddress}
                        copied={copied}
                        onSend={() => setView('send')}
                        onReceive={() => setView('receive')}
                        onHistory={() => setView('history')}
                        onNFT={() => setView('nft')}
                        onTokenClick={handleTokenClick}
                        settings={settings}
                        onUpdateSettings={onUpdateSettings}
                        showToast={showToast}
                        isBalanceHidden={isBalanceHidden}
                        onToggleBalance={() => setIsBalanceHidden(!isBalanceHidden)}
                        allTokens={allTokens}
                        isLoadingTokens={isLoadingTokens}
                    />
                )}

                {view === 'send' && (
                    <SendView
                        wallet={wallet}
                        balance={balance}
                        nonce={nonce}
                        onBack={() => { setSelectedToken(null); handleBack(); }}
                        onRefresh={onRefresh}
                        settings={settings}
                        onLock={onLock}
                        initialToken={selectedToken}
                        allTokens={allTokens}
                    />
                )}

                {view === 'receive' && (
                    <ReceiveView
                        address={wallet.address}
                        onBack={handleBack}
                    />
                )}

                {view === 'history' && (
                    <HistoryView
                        transactions={transactions}
                        address={wallet.address}
                        settings={settings}
                        onBack={handleBack}
                    />
                )}

                {view === 'privacy' && (
                    <PrivacyView
                        wallet={wallet}
                        onBack={handleBack}
                        showToast={showToast}
                    />
                )}

                {view === 'nft' && (
                    <NFTGallery
                        wallet={wallet}
                        rpcClient={rpcClient}
                        onBack={handleBack}
                    />
                )}


                {view === 'token-detail' && selectedToken && (
                    <TokenDetailView
                        token={selectedToken}
                        wallet={wallet}
                        onBack={handleBack}
                        onSend={handleTokenSend}
                        onReceive={() => setView('receive')}
                        transactions={transactions}
                    />
                )}


            </div>

            {/* Bottom Navigation - OKX Style */}
            <nav className="wallet-nav">
                <button className={`nav-item nav-home ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
                    <WalletIcon size={20} className="nav-icon" />
                    <span className="nav-label">Home</span>
                </button>
                <button className={`nav-item nav-send ${view === 'send' ? 'active' : ''}`} onClick={() => setView('send')}>
                    <SendIcon size={20} className="nav-icon" />
                    <span className="nav-label">Send</span>
                </button>
                <button className={`nav-item nav-privacy ${view === 'privacy' ? 'active' : ''}`} onClick={() => setView('privacy')}>
                    <PrivacyIcon size={20} className="nav-icon" />
                    <span className="nav-label">Privacy</span>
                </button>
                <button className={`nav-item nav-receive ${view === 'receive' ? 'active' : ''}`} onClick={() => setView('receive')}>
                    <ReceiveIcon size={20} className="nav-icon" />
                    <span className="nav-label">Receive</span>
                </button>
                <button className={`nav-item nav-history ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}>
                    <HistoryIcon size={20} className="nav-icon" />
                    <span className="nav-label">History</span>
                </button>
            </nav>

            {/* Toast Notification */}
            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    <span className="toast-icon">
                        {toast.type === 'success' ? <CheckIcon size={14} /> :
                            toast.type === 'error' ? <CloseIcon size={14} /> :
                                <InfoIcon size={14} />}
                    </span>
                    <span className="toast-message">{toast.message}</span>
                </div>
            )}
        </>
    );
}

export default Dashboard;
