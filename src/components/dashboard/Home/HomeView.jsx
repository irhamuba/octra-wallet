import { useState, useEffect, useCallback, useMemo } from 'react';

import { truncateAddress, formatAmount } from '../../../utils/crypto';
import { CopyIcon, CheckIcon, EyeIcon, EyeOffIcon, ShieldIcon, PlusIcon, ImageIcon } from '../../shared/Icons';
import { TokenItem } from '../TokenItem';
import { privacyService } from '../../../services/PrivacyService';
import { ocs01Manager } from '../../../services/OCS01TokenService';
import { getTokenPrice, formatUsd, calculateUsdValue } from '../../../services/PriceService';
import { saveSettings } from '../../../utils/storage';
import { getRpcClient } from '../../../utils/rpc';
import { AddCustomTokenModal } from './AddCustomTokenModal';
import './HomeView.css';

export function HomeView({ wallet, balance, transactions, onCopyAddress, copied, onSend, onReceive, onHistory, onNFT, settings, onUpdateSettings, showToast, onTokenClick, isBalanceHidden, onToggleBalance, allTokens, isLoadingTokens, onRefresh }) {
    const [activeTab, setActiveTab] = useState('crypto');
    const [encryptedBalance, setEncryptedBalance] = useState(null);
    const [octPrice, setOctPrice] = useState(0);
    const [showAddTokenModal, setShowAddTokenModal] = useState(false);



    // Fetch OCT price based on network
    useEffect(() => {
        const fetchPrice = async () => {
            // OCT price not available on testnet/CoinGecko yet
            const priceData = await getTokenPrice('OCT');
            setOctPrice(priceData?.price || 0);
        };
        fetchPrice();
        // Refresh price every minute
        const interval = setInterval(fetchPrice, 60000);
        return () => clearInterval(interval);
    }, [settings?.network]);


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
    }, [balance, fetchEncryptedBalance]); // Only re-fetch if native balance changes or on mount

    // Calculate total balance including shielded - Memoized
    const totalBalance = useMemo(() => {
        return balance + (encryptedBalance?.encryptedBalance || 0);
    }, [balance, encryptedBalance]);

    // Calculate USD Value - Memoized
    const displayUsdValue = useMemo(() => {
        return formatUsd(calculateUsdValue(totalBalance, octPrice));
    }, [totalBalance, octPrice]);

    // Use tokens from parent (already includes OCT + OCS01)
    const tokens = allTokens || [];

    return (
        <>
            {/* Balance Card - Clickable USD, with Skeleton Loading */}
            <div className="balance-card">
                {isLoadingTokens && balance === 0 ? (
                    <div className="flex-col items-center">
                        <div className="skeleton" style={{ width: '160px', height: '36px', marginBottom: '8px', borderRadius: '8px' }} />
                        <div className="skeleton" style={{ width: '100px', height: '18px', borderRadius: '4px' }} />
                    </div>
                ) : isBalanceHidden ? (
                    <div className="balance-amount balance-clickable" onClick={onToggleBalance}>
                        <span className="balance-hidden">••••••</span>
                    </div>
                ) : (
                    <div className="balance-clickable" onClick={onToggleBalance}>
                        {/* USD Value - Primary - Clickable */}
                        <div className="balance-usd">
                            {displayUsdValue}
                        </div>

                        {/* OCT Amount - Secondary */}
                        <div className="balance-token">
                            {formatAmount(totalBalance)} OCT
                        </div>
                    </div>
                )}
            </div>

            {/* Content Tabs - Simplified */}
            <div className="tabs">
                <button
                    className={`tab-item ${activeTab === 'crypto' ? 'active' : ''}`}
                    onClick={() => setActiveTab('crypto')}
                >
                    Crypto
                </button>
                <button
                    className={`tab-item ${activeTab === 'nft' ? 'active' : ''}`}
                    onClick={() => setActiveTab('nft')}
                >
                    NFTs
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'crypto' && (
                    <div className="token-list-container">
                        <div className="token-list-header px-md flex justify-between items-center mb-sm">
                            <span className="text-xs text-tertiary font-medium uppercase tracking-wider">Assets</span>
                            <button
                                className="icon-btn-ghost text-accent"
                                onClick={() => setShowAddTokenModal(true)}
                                title="Add Custom Token"
                                style={{ padding: '4px' }}
                            >
                                <PlusIcon size={18} />
                            </button>
                        </div>
                        <div className="token-list px-md">
                            {isLoadingTokens && tokens.length === 0 ? (
                                /* Skeleton Loading List */
                                [1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-md p-md mb-xs" style={{ background: 'var(--bg-elevated)', borderRadius: '12px' }}>
                                        <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
                                        <div className="flex-1 flex flex-col gap-xs">
                                            <div className="skeleton" style={{ width: '80px', height: '14px' }} />
                                            <div className="skeleton" style={{ width: '50px', height: '10px' }} />
                                        </div>
                                        <div className="skeleton" style={{ width: '70px', height: '14px' }} />
                                    </div>
                                ))
                            ) : (
                                tokens.map((token) => (
                                    <TokenItem
                                        key={token.isNative ? 'OCT' : token.contractAddress}
                                        token={token}
                                        onClick={() => onTokenClick(token)}
                                        hideBalance={isBalanceHidden}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'nft' && (
                    <div className="empty-state flex flex-col items-center py-3xl">
                        <div style={{ marginBottom: '16px', opacity: 0.8, color: 'var(--text-tertiary)' }}>
                            <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <ellipse className="ghost-shadow" cx="50" cy="92" rx="20" ry="3" fill="currentColor" fillOpacity="0.2" />
                                <g className="ghost-body">
                                    <path d="M50 15C30 15 15 35 15 60V85L22 78L29 85L36 78L43 85L50 78L57 85L64 78L71 85L78 78L85 85V60C85 35 70 15 50 15Z"
                                        fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                    <circle cx="38" cy="45" r="4" fill="currentColor" fillOpacity="0.8" />
                                    <circle cx="62" cy="45" r="4" fill="currentColor" fillOpacity="0.8" />
                                    <ellipse cx="50" cy="58" rx="3" ry="4" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M15 55C10 55 5 45 10 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M85 55C90 55 95 45 90 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </g>
                            </svg>
                        </div>
                        <p>No NFTs yet</p>
                        <span className="text-tertiary text-sm">Your NFTs will appear here</span>
                    </div>
                )}
            </div>

            {/* Add Token Modal */}
            <AddCustomTokenModal
                isOpen={showAddTokenModal}
                onClose={() => setShowAddTokenModal(false)}
                wallet={wallet}
                rpcClient={getRpcClient(settings?.rpcUrl)}
                onSuccess={onRefresh}
            />
        </>
    );
}
