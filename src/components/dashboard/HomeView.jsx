import { useState, useEffect, useCallback } from 'react';
import { truncateAddress, formatAmount } from '../../utils/crypto';
import { CopyIcon, CheckIcon, EyeIcon, EyeOffIcon, ShieldIcon } from '../Icons';
import { TokenItem } from './TokenItem';
import { privacyService } from '../../services/PrivacyService';
import { saveSettings } from '../../utils/storage';

export function HomeView({ wallet, balance, transactions, onCopyAddress, copied, onSend, onReceive, onHistory, onNFT, onTokens, onDapps, settings, onUpdateSettings, showToast, onTokenClick }) {
    const [activeTab, setActiveTab] = useState('crypto');
    const [encryptedBalance, setEncryptedBalance] = useState(null);
    const [localHideBalance, setLocalHideBalance] = useState(settings?.hideBalance || false);

    // Sync local state with settings prop
    useEffect(() => {
        setLocalHideBalance(settings?.hideBalance || false);
    }, [settings?.hideBalance]);

    const hideBalance = localHideBalance;
    const toggleHideBalance = (e) => {
        e.stopPropagation();
        const newValue = !localHideBalance;
        // Update local state immediately for instant UI feedback
        setLocalHideBalance(newValue);
        // Save to storage silently without toast notification
        const updated = { ...settings, hideBalance: newValue };
        saveSettings(updated);
    };

    // Fetch encrypted balance
    const fetchEncryptedBalance = useCallback(async () => {
        if (wallet?.address && wallet?.privateKeyB64) {
            try {
                // Try to load from cache first
                const cached = localStorage.getItem(`privacy_data_${wallet.address}`);
                if (cached && !encryptedBalance) {
                    setEncryptedBalance(JSON.parse(cached));
                }

                privacyService.setPrivateKey(wallet.privateKeyB64);
                const result = await privacyService.getEncryptedBalance(wallet.address);
                if (result.success) {
                    setEncryptedBalance(result);
                    localStorage.setItem(`privacy_data_${wallet.address}`, JSON.stringify(result));
                }
            } catch (error) {
                console.error('Failed to fetch privacy data:', error);
            }
        }
    }, [wallet?.address, wallet?.privateKeyB64, encryptedBalance]);

    useEffect(() => {
        fetchEncryptedBalance();
    }, [balance]); // Only re-fetch if native balance changes or on mount

    // Calculate total balance including shielded
    const totalBalance = balance + (encryptedBalance?.encryptedBalance || 0);
    const hasShieldedBalance = encryptedBalance?.encryptedBalance > 0;

    // Token list - OCT is the main token
    const tokens = [
        {
            symbol: 'OCT',
            name: 'Octra',
            balance: totalBalance,
            icon: '◉',
            isNative: true,
            shieldedBalance: encryptedBalance?.encryptedBalance || 0
        }
    ];

    return (
        <>
            {/* Balance Card */}
            <div className="balance-card">
                <div className="balance-label">
                    <span>Total Balance</span>
                    <button className="icon-btn-ghost" onClick={toggleHideBalance}>
                        {hideBalance ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                </div>

                <div className="balance-amount">
                    {hideBalance ? (
                        <span className="balance-hidden">••••••</span>
                    ) : (
                        <>
                            <span className="balance-value">{formatAmount(totalBalance)}</span>
                            <span className="balance-currency">OCT</span>
                        </>
                    )}
                </div>

                {/* Shielded Indicator */}
                {hasShieldedBalance && !hideBalance && (
                    <div className="shielded-indicator">
                        <ShieldIcon size={14} className="shielded-icon" />
                        <span>{formatAmount(encryptedBalance.encryptedBalance)} shielded</span>
                    </div>
                )}

                {/* Address */}
                <div className="address-display" onClick={onCopyAddress}>
                    <span className="address-text">{truncateAddress(wallet.address)}</span>
                    {copied ? (
                        <CheckIcon size={14} className="address-copy-icon" style={{ color: 'var(--success)' }} />
                    ) : (
                        <CopyIcon size={14} className="address-copy-icon" />
                    )}
                </div>
            </div>

            {/* Content Tabs - Simplified */}
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
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'crypto' && (
                    <div className="token-list px-md">
                        {tokens.map((token) => (
                            <TokenItem
                                key={token.symbol}
                                token={token}
                                onClick={() => onTokenClick(token)}
                                hideBalance={hideBalance}
                            />
                        ))}
                    </div>
                )}

                {activeTab === 'nft' && (
                    <div className="empty-state">
                        <span className="empty-icon">🖼️</span>
                        <p>No NFTs yet</p>
                        <span className="text-tertiary text-sm">Your NFTs will appear here</span>
                    </div>
                )}
            </div>
        </>
    );
}
