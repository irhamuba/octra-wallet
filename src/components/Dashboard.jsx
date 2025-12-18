/**
 * Dashboard Component - Main wallet view
 * Displays balance, actions, and token list
 */

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    OctraLogo,
    SendIcon,
    ReceiveIcon,
    HistoryIcon,
    CopyIcon,
    CheckIcon,
    RefreshIcon,
    ArrowUpRightIcon,
    ArrowDownLeftIcon,
    CloseIcon,
    SettingsIcon,
    ChevronLeftIcon,
    WalletIcon,
    TokenIcon as TokenIconSvg,
    BuyIcon,
    SwapIcon,
    ChevronDownIcon,
    GlobeIcon,
    StakingIcon,
    EditIcon
} from './Icons';
import { TokenIcon } from './TokenIcon';
import { truncateAddress, formatAmount, isValidAddress, createTransaction } from '../utils/crypto';
import { getRpcClient } from '../utils/rpc';
import { addToTxHistory } from '../utils/storage';

// Feature components
import { TransactionHistory } from '../features/history';
import { AddressBook } from '../features/addressBook';
import { NFTGallery } from '../features/nft';
import { TokenManager } from '../features/tokens';
import { ConnectedDapps } from '../features/dapp';
import { NetworkSwitcher } from '../features/settings';

export function Dashboard({ wallet, wallets, activeWalletIndex, onSwitchWallet, onAddWallet, onRenameWallet, balance, nonce, transactions, onRefresh, isRefreshing, settings, onOpenSettings, onLock }) {
    const [view, setView] = useState('home'); // 'home' | 'send' | 'receive' | 'history' | 'nft' | 'tokens' | 'addressbook' | 'dapps'
    const [copied, setCopied] = useState(false);
    const [showWalletSwitcher, setShowWalletSwitcher] = useState(false);
    const [currentNetwork, setCurrentNetwork] = useState('testnet');
    const [showAddWallet, setShowAddWallet] = useState(false);
    const [addWalletMode, setAddWalletMode] = useState(null); // 'create' | 'import'
    const [importPrivateKey, setImportPrivateKey] = useState('');
    const [addWalletError, setAddWalletError] = useState('');
    const [isAddingWallet, setIsAddingWallet] = useState(false);

    // Rename wallet state
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameWalletIndex, setRenameWalletIndex] = useState(null);
    const [renameWalletName, setRenameWalletName] = useState('');

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

    const handleBack = () => setView('home');

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
                <div
                    className="wallet-logo wallet-logo-clickable"
                    onClick={() => setShowWalletSwitcher(!showWalletSwitcher)}
                >
                    <div className="wallet-logo-icon">
                        <OctraLogo size={18} />
                    </div>
                    <span className="wallet-logo-text">Octra</span>
                    <ChevronDownIcon size={14} className={showWalletSwitcher ? 'rotate-180' : ''} />
                </div>
                <div className="header-actions">
                    <NetworkSwitcher
                        currentNetwork={currentNetwork}
                        onSwitch={setCurrentNetwork}
                    />
                    <button className="header-icon-btn" onClick={onRefresh} disabled={isRefreshing}>
                        <RefreshIcon size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
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
                                    <div className="wallet-switcher-avatar">
                                        <WalletIcon size={16} />
                                        <button
                                            className="wallet-edit-btn"
                                            onClick={(e) => handleOpenRename(idx, w.name, e)}
                                            title="Rename wallet"
                                        >
                                            <EditIcon size={10} />
                                        </button>
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
                                    <div className="add-wallet-option-icon">✨</div>
                                    <div className="add-wallet-option-info">
                                        <span className="add-wallet-option-title">Create New Wallet</span>
                                        <span className="add-wallet-option-desc">Generate a new wallet automatically</span>
                                    </div>
                                </button>
                                <button className="add-wallet-option" onClick={() => setAddWalletMode('import')}>
                                    <div className="add-wallet-option-icon">🔑</div>
                                    <div className="add-wallet-option-info">
                                        <span className="add-wallet-option-title">Import with Private Key</span>
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
                        onTokens={() => setView('tokens')}
                        onAddressBook={() => setView('addressbook')}
                        onDapps={() => setView('dapps')}
                    />
                )}

                {view === 'send' && (
                    <SendView
                        wallet={wallet}
                        balance={balance}
                        nonce={nonce}
                        onBack={handleBack}
                        onRefresh={onRefresh}
                        settings={settings}
                    />
                )}

                {view === 'receive' && (
                    <ReceiveView
                        address={wallet.address}
                        onBack={handleBack}
                    />
                )}

                {view === 'history' && (
                    <TransactionHistory
                        transactions={transactions}
                        walletAddress={wallet.address}
                        onBack={handleBack}
                    />
                )}

                {view === 'nft' && (
                    <NFTGallery
                        wallet={wallet}
                        rpcClient={rpcClient}
                        onBack={handleBack}
                    />
                )}

                {view === 'tokens' && (
                    <TokenManager
                        wallet={wallet}
                        rpcClient={rpcClient}
                        onBack={handleBack}
                        onTransfer={(token) => {
                            // TODO: Handle token transfer
                            setView('send');
                        }}
                    />
                )}

                {view === 'addressbook' && (
                    <AddressBook
                        onBack={handleBack}
                        onQuickSend={handleQuickSend}
                    />
                )}

                {view === 'dapps' && (
                    <ConnectedDapps
                        onBack={handleBack}
                    />
                )}
            </div>

            {/* Bottom Navigation - OKX Style */}
            <nav className="wallet-nav">
                <button className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
                    <WalletIcon size={20} className="nav-icon" />
                    <span className="nav-label">Home</span>
                </button>
                <button className="nav-item" onClick={() => setView('send')}>
                    <SendIcon size={20} className="nav-icon" />
                    <span className="nav-label">Send</span>
                </button>
                <button className="nav-item" onClick={() => setView('receive')}>
                    <ReceiveIcon size={20} className="nav-icon" />
                    <span className="nav-label">Receive</span>
                </button>
                <button className="nav-item nav-item-disabled" disabled>
                    <SwapIcon size={20} className="nav-icon" />
                    <span className="nav-label">Swap</span>
                </button>
                <button className="nav-item" onClick={() => setView('history')}>
                    <HistoryIcon size={20} className="nav-icon" />
                    <span className="nav-label">History</span>
                </button>
            </nav>
        </>
    );
}

function HomeView({ wallet, balance, transactions, onCopyAddress, copied, onSend, onReceive, onHistory, onNFT, onTokens, onAddressBook, onDapps }) {
    const [activeTab, setActiveTab] = useState('crypto');

    // Token list - OCT as native token
    const tokens = [
        {
            symbol: 'OCT',
            name: 'Octra',
            balance: balance,
            logoUrl: null,
            isNative: true,
            verified: true
        }
    ];

    return (
        <div className="animate-fade-in">
            {/* Balance Card */}
            <div className="balance-card">
                <div className="balance-label">Total Balance</div>
                <div className="balance-amount">
                    {formatAmount(balance, 4)}
                    <span className="balance-currency">OCT</span>
                </div>

                <div className="address-display" onClick={onCopyAddress}>
                    <span className="address-text">{truncateAddress(wallet.address, 12, 8)}</span>
                    {copied ? (
                        <CheckIcon size={14} className="address-copy-icon" style={{ color: 'var(--success)' }} />
                    ) : (
                        <CopyIcon size={14} className="address-copy-icon" />
                    )}
                </div>
            </div>

            {/* Content Tabs - OKX Style */}
            <div className="content-tabs">
                <button
                    className={`content-tab ${activeTab === 'crypto' ? 'active' : ''}`}
                    onClick={() => setActiveTab('crypto')}
                >
                    Crypto
                </button>
                <button
                    className={`content-tab ${activeTab === 'nft' ? 'active' : ''}`}
                    onClick={() => setActiveTab('nft')}
                >
                    NFT
                </button>
                <button
                    className={`content-tab ${activeTab === 'dapps' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dapps')}
                >
                    dApps
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'crypto' && (
                    <div className="token-list">
                        {tokens.length > 0 ? (
                            tokens.map((token) => (
                                <TokenItem key={token.symbol} token={token} onClick={onTokens} />
                            ))
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">💰</div>
                                <p>No tokens added</p>
                                <button className="btn btn-outline btn-sm" onClick={onTokens}>
                                    Add Token
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'nft' && (
                    <div className="empty-state">
                        <div className="empty-state-icon">🖼️</div>
                        <p>No NFTs found</p>
                        <p className="text-tertiary text-xs">Your NFTs will appear here</p>
                        <button className="btn btn-outline btn-sm mt-md" onClick={onNFT}>
                            View Gallery
                        </button>
                    </div>
                )}

                {activeTab === 'dapps' && (
                    <div className="empty-state">
                        <div className="empty-state-icon">🌐</div>
                        <p>No connected dApps</p>
                        <p className="text-tertiary text-xs">Connect to dApps to see them here</p>
                        <button className="btn btn-outline btn-sm mt-md" onClick={onDapps}>
                            Manage Connections
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function TokenItem({ token }) {
    return (
        <div className="token-item">
            <div className="token-item-icon">
                <TokenIcon
                    symbol={token.symbol}
                    logoUrl={token.logoUrl}
                    size={40}
                />
            </div>
            <div className="token-item-info">
                <div className="token-item-name">
                    {token.name}
                    {token.isNative && <span className="token-badge">Native</span>}
                    {token.verified && !token.isNative && <span className="token-badge">✓</span>}
                </div>
                <div className="token-item-symbol">{token.symbol}</div>
            </div>
            <div className="token-item-balance">
                <div className="token-item-amount">
                    {formatAmount(token.balance, 4)}
                </div>
                <div className="token-item-value">{token.symbol}</div>
            </div>
        </div>
    );
}

function TransactionItem({ tx }) {
    const isIncoming = tx.type === 'in';
    const timeAgo = formatTimeAgo(tx.timestamp);

    return (
        <div className="tx-item">
            <div className={`tx-icon ${isIncoming ? 'tx-icon-in' : 'tx-icon-out'}`}>
                {isIncoming ? <ArrowDownLeftIcon size={18} /> : <ArrowUpRightIcon size={18} />}
            </div>
            <div className="tx-details">
                <div className="tx-type">{isIncoming ? 'Received' : 'Sent'}</div>
                <div className="tx-address">{truncateAddress(tx.address, 8, 6)}</div>
            </div>
            <div className="tx-amount">
                <div className={`tx-amount-value ${isIncoming ? 'tx-amount-in' : 'tx-amount-out'}`}>
                    {isIncoming ? '+' : '-'}{formatAmount(tx.amount, 4)} OCT
                </div>
                <div className="tx-time">{timeAgo}</div>
            </div>
        </div>
    );
}

function SendView({ wallet, balance, nonce, onBack, onRefresh, settings }) {
    const [step, setStep] = useState('select'); // 'select' | 'form' | 'confirm' | 'sending' | 'success' | 'error'
    const [selectedToken, setSelectedToken] = useState(null);
    const [tokenBalance, setTokenBalance] = useState(balance);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [txHash, setTxHash] = useState('');
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);

    // Fee state
    const [feeEstimate, setFeeEstimate] = useState({ low: 0.001, medium: 0.002, high: 0.003 });
    const [selectedFee, setSelectedFee] = useState('medium'); // 'low' | 'medium' | 'high'
    const [isLoadingFee, setIsLoadingFee] = useState(false);

    // Available tokens list
    const tokens = [
        { symbol: 'OCT', name: 'Octra', balance: balance, isNative: true }
        // Future: add other tokens here
    ];

    const fee = feeEstimate[selectedFee] || 0.001;
    const total = parseFloat(amount || 0) + fee;
    const isValid = recipient && isValidAddress(recipient) && amount && parseFloat(amount) > 0 && total <= tokenBalance;

    // Fetch balance and fee estimate when token selected
    const handleSelectToken = async (token) => {
        setSelectedToken(token);
        setIsLoadingBalance(true);
        setIsLoadingFee(true);

        try {
            const rpcClient = getRpcClient();

            // Fetch balance
            const data = await rpcClient.getBalance(wallet.address);
            setTokenBalance(data.balance);

            // Fetch fee estimate
            const fees = await rpcClient.getFeeEstimate(1);
            setFeeEstimate({
                low: fees.low,
                medium: fees.medium,
                high: fees.high
            });
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setTokenBalance(balance); // fallback
        }

        setIsLoadingBalance(false);
        setIsLoadingFee(false);
        setStep('form');
    };

    // Update fee estimate when amount changes
    useEffect(() => {
        const updateFee = async () => {
            if (amount && parseFloat(amount) > 0) {
                setIsLoadingFee(true);
                try {
                    const rpcClient = getRpcClient();
                    const fees = await rpcClient.getFeeEstimate(parseFloat(amount));
                    setFeeEstimate({
                        low: fees.low,
                        medium: fees.medium,
                        high: fees.high
                    });
                } catch (err) {
                    console.error('Failed to update fee:', err);
                }
                setIsLoadingFee(false);
            }
        };

        const debounce = setTimeout(updateFee, 500);
        return () => clearTimeout(debounce);
    }, [amount]);

    const handleSubmit = () => {
        if (!isValidAddress(recipient)) {
            setError('Invalid recipient address');
            return;
        }
        if (parseFloat(amount) <= 0) {
            setError('Invalid amount');
            return;
        }
        if (total > tokenBalance) {
            setError('Insufficient balance');
            return;
        }
        setError('');
        setStep('confirm');
    };

    const handleSend = async () => {
        setStep('sending');
        setError('');

        try {
            const rpcClient = getRpcClient();

            // Get fresh nonce
            const data = await rpcClient.getBalance(wallet.address);
            let currentNonce = data.nonce;

            // Check for pending transactions
            const staged = await rpcClient.getStagedTransactions();
            const ourStaged = staged.filter(tx => tx.from === wallet.address);
            const maxNonce = ourStaged.length > 0
                ? Math.max(currentNonce, ...ourStaged.map(tx => parseInt(tx.nonce)))
                : currentNonce;

            const tx = createTransaction(
                wallet.address,
                recipient,
                parseFloat(amount),
                maxNonce + 1,
                wallet.privateKeyB64,
                null
            );

            const result = await rpcClient.sendTransaction(tx);

            // Add to local history
            addToTxHistory({
                hash: result.txHash,
                type: 'out',
                amount: parseFloat(amount),
                address: recipient,
                status: 'pending'
            });

            setTxHash(result.txHash);
            setStep('success');
            onRefresh();
        } catch (err) {
            setError(err.message || 'Transaction failed');
            setStep('error');
        }
    };

    const handleReset = () => {
        setSelectedToken(null);
        setRecipient('');
        setAmount('');
        setStep('select');
        setError('');
        setTxHash('');
    };

    return (
        <div className="animate-fade-in">
            {/* Step 1: Select Token */}
            {step === 'select' && (
                <>
                    <div className="flex items-center gap-md mb-xl">
                        <button className="header-icon-btn" onClick={onBack}>
                            <ChevronLeftIcon size={20} />
                        </button>
                        <h2 className="text-lg font-semibold">Select Token</h2>
                    </div>

                    <p className="text-secondary text-sm mb-lg">Choose which token to send</p>

                    <div className="token-select-list">
                        {tokens.map((token) => (
                            <button
                                key={token.symbol}
                                className="token-select-item"
                                onClick={() => handleSelectToken(token)}
                            >
                                <div className="token-select-icon">
                                    <OctraLogo size={32} />
                                </div>
                                <div className="token-select-info">
                                    <span className="token-select-name">{token.name}</span>
                                    <span className="token-select-symbol">{token.symbol}</span>
                                </div>
                                <div className="token-select-balance">
                                    <span>{formatAmount(token.balance, 4)}</span>
                                    <span className="text-tertiary text-xs">{token.symbol}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Step 2: Enter Amount & Address */}
            {step === 'form' && (
                <>
                    <div className="flex items-center gap-md mb-xl">
                        <button className="header-icon-btn" onClick={() => setStep('select')}>
                            <ChevronLeftIcon size={20} />
                        </button>
                        <h2 className="text-lg font-semibold">Send {selectedToken?.symbol}</h2>
                    </div>

                    {/* Token Balance Display */}
                    <div className="send-balance-card mb-lg">
                        <div className="send-balance-icon">
                            <OctraLogo size={24} />
                        </div>
                        <div className="send-balance-info">
                            <span className="text-secondary text-xs">Available Balance</span>
                            <span className="text-lg font-bold">
                                {isLoadingBalance ? '...' : formatAmount(tokenBalance, 6)} {selectedToken?.symbol}
                            </span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Amount</label>
                        <div className="relative">
                            <input
                                type="number"
                                className="input input-lg"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.000001"
                                style={{ paddingRight: '80px' }}
                            />
                            <button
                                className="send-max-btn"
                                onClick={() => setAmount(Math.max(0, tokenBalance - fee).toFixed(6))}
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Recipient Address</label>
                        <input
                            type="text"
                            className={`input input-mono ${recipient && !isValidAddress(recipient) ? 'input-error' : ''}`}
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder="oct..."
                        />
                        {recipient && !isValidAddress(recipient) && (
                            <p className="form-error">Invalid Octra address</p>
                        )}
                    </div>

                    {/* Fee Selector */}
                    <div className="form-group">
                        <label className="form-label">
                            Network Fee {isLoadingFee && <span className="text-tertiary">(updating...)</span>}
                        </label>
                        <div className="fee-selector">
                            <button
                                className={`fee-option ${selectedFee === 'low' ? 'active' : ''}`}
                                onClick={() => setSelectedFee('low')}
                            >
                                <span className="fee-option-label">Slow</span>
                                <span className="fee-option-value">{formatAmount(feeEstimate.low, 6)}</span>
                            </button>
                            <button
                                className={`fee-option ${selectedFee === 'medium' ? 'active' : ''}`}
                                onClick={() => setSelectedFee('medium')}
                            >
                                <span className="fee-option-label">Normal</span>
                                <span className="fee-option-value">{formatAmount(feeEstimate.medium, 6)}</span>
                            </button>
                            <button
                                className={`fee-option ${selectedFee === 'high' ? 'active' : ''}`}
                                onClick={() => setSelectedFee('high')}
                            >
                                <span className="fee-option-label">Fast</span>
                                <span className="fee-option-value">{formatAmount(feeEstimate.high, 6)}</span>
                            </button>
                        </div>
                    </div>

                    {parseFloat(amount) > 0 && (
                        <div className="card mb-lg">
                            <div className="confirm-row">
                                <span className="confirm-label">Amount</span>
                                <span className="confirm-value">{formatAmount(parseFloat(amount), 6)} {selectedToken?.symbol}</span>
                            </div>
                            <div className="confirm-row">
                                <span className="confirm-label">Network Fee</span>
                                <span className="confirm-value">{formatAmount(fee, 6)} {selectedToken?.symbol}</span>
                            </div>
                            <div className="confirm-row confirm-row-total">
                                <span className="confirm-label">Total</span>
                                <span className="confirm-value font-bold">{formatAmount(total, 6)} {selectedToken?.symbol}</span>
                            </div>
                        </div>
                    )}

                    {error && <p className="text-error text-sm mb-lg">{error}</p>}

                    <button
                        className="btn btn-primary btn-lg btn-full"
                        onClick={handleSubmit}
                        disabled={!isValid}
                    >
                        Continue
                    </button>
                </>
            )}

            {/* Step 3: Confirm & Sign */}
            {step === 'confirm' && (
                <>
                    <div className="flex items-center gap-md mb-xl">
                        <button className="header-icon-btn" onClick={() => setStep('form')}>
                            <ChevronLeftIcon size={20} />
                        </button>
                        <h2 className="text-lg font-semibold">Confirm & Sign</h2>
                    </div>

                    <div className="text-center mb-xl">
                        <p className="text-secondary text-sm mb-sm">You're sending</p>
                        <p className="confirm-amount-large">{amount} {selectedToken?.symbol}</p>
                    </div>

                    <div className="confirm-card">
                        <div className="confirm-row">
                            <span className="confirm-label">From</span>
                            <span className="confirm-value text-mono text-sm">{truncateAddress(wallet.address, 8, 6)}</span>
                        </div>
                        <div className="confirm-row">
                            <span className="confirm-label">To</span>
                            <span className="confirm-value text-mono text-sm">{truncateAddress(recipient, 8, 6)}</span>
                        </div>
                        <div className="confirm-row">
                            <span className="confirm-label">Network Fee</span>
                            <span className="confirm-value">{fee} {selectedToken?.symbol}</span>
                        </div>
                        <div className="confirm-row confirm-row-total">
                            <span className="confirm-label">Total Amount</span>
                            <span className="confirm-value font-bold">{formatAmount(total, 6)} {selectedToken?.symbol}</span>
                        </div>
                    </div>

                    <div className="sign-info mb-lg">
                        <p className="text-xs text-secondary text-center">
                            🔐 Transaction will be signed with your private key
                        </p>
                    </div>

                    <div className="flex gap-md">
                        <button className="btn btn-secondary btn-lg flex-1" onClick={() => setStep('form')}>
                            Back
                        </button>
                        <button className="btn btn-primary btn-lg flex-1" onClick={handleSend}>
                            Sign & Send
                        </button>
                    </div>
                </>
            )}

            {/* Sending State */}
            {step === 'sending' && (
                <div className="flex flex-col items-center justify-center py-3xl">
                    <div className="loading-spinner mb-xl" style={{ width: 48, height: 48 }} />
                    <p className="text-lg font-semibold">Signing & Sending</p>
                    <p className="text-secondary text-sm mt-sm">Please wait...</p>
                </div>
            )}

            {/* Success State */}
            {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-3xl text-center animate-fade-in">
                    <div className="success-checkmark mb-xl">
                        <CheckIcon size={32} />
                    </div>
                    <p className="text-xl font-bold mb-sm">Transaction Sent!</p>
                    <p className="text-secondary text-sm mb-xl">
                        Your transaction has been submitted to the network
                    </p>

                    <div className="card w-full mb-xl">
                        <p className="text-xs text-secondary mb-sm">Transaction Hash</p>
                        <p className="text-mono text-xs truncate">{txHash}</p>
                    </div>

                    <button className="btn btn-primary btn-lg btn-full" onClick={() => { handleReset(); onBack(); }}>
                        Done
                    </button>
                </div>
            )}

            {/* Error State */}
            {step === 'error' && (
                <div className="flex flex-col items-center justify-center py-3xl text-center animate-fade-in">
                    <div className="success-checkmark mb-xl" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
                        <CloseIcon size={32} />
                    </div>
                    <p className="text-xl font-bold mb-sm">Transaction Failed</p>
                    <p className="text-secondary text-sm mb-xl">{error}</p>

                    <div className="flex gap-md w-full">
                        <button className="btn btn-secondary btn-lg flex-1" onClick={() => { handleReset(); onBack(); }}>
                            Cancel
                        </button>
                        <button className="btn btn-primary btn-lg flex-1" onClick={() => setStep('form')}>
                            Try Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ReceiveView({ address, onBack }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            console.error('Failed to copy');
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-md mb-xl">
                <button className="header-icon-btn" onClick={onBack}>
                    <ChevronLeftIcon size={20} />
                </button>
                <h2 className="text-lg font-semibold">Receive OCT</h2>
            </div>

            <div className="qr-container">
                <div className="qr-code">
                    {/* QR Code is genuine - qrcode.react generates real QR codes */}
                    <QRCodeSVG
                        value={address}
                        size={200}
                        level="M"
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        includeMargin={true}
                    />
                </div>

                <p className="text-secondary text-sm mb-lg text-center">
                    Scan this QR code to receive OCT
                </p>
            </div>

            {/* Improved address display with copy button on side */}
            <div className="address-display-full">
                <p className="address-display-label">Your Address</p>
                <div className="address-display-value">
                    <span className="address-display-text">{address}</span>
                    <button
                        className="address-copy-btn"
                        onClick={handleCopy}
                        title="Copy address"
                    >
                        {copied ? (
                            <CheckIcon size={18} style={{ color: 'var(--success)' }} />
                        ) : (
                            <CopyIcon size={18} />
                        )}
                    </button>
                </div>
            </div>

            <button
                className="btn btn-primary btn-lg btn-full gap-sm"
                onClick={handleCopy}
            >
                {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
                {copied ? 'Copied!' : 'Copy Address'}
            </button>
        </div>
    );
}

function HistoryView({ transactions, address, onBack }) {
    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-md mb-xl">
                <button className="header-icon-btn" onClick={onBack}>
                    <ChevronLeftIcon size={20} />
                </button>
                <h2 className="text-lg font-semibold">Transaction History</h2>
            </div>

            {transactions.length === 0 ? (
                <div className="tx-empty py-3xl">
                    <div className="tx-empty-icon">
                        <HistoryIcon size={24} />
                    </div>
                    <p className="text-sm">No transactions yet</p>
                    <p className="text-xs text-tertiary mt-sm">
                        Your transaction history will appear here
                    </p>
                </div>
            ) : (
                <div className="tx-section">
                    <div className="tx-list" style={{ maxHeight: '500px' }}>
                        {transactions.map((tx, index) => (
                            <TransactionItem key={tx.hash || index} tx={tx} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper: Format timestamp to relative time
function formatTimeAgo(timestamp) {
    if (!timestamp) return '';

    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

export default Dashboard;
