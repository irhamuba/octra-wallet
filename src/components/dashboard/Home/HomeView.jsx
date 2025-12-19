import { useState, useEffect, useCallback } from 'react';
import { truncateAddress, formatAmount } from '../../../utils/crypto';
import { CopyIcon, CheckIcon, EyeIcon, EyeOffIcon, ShieldIcon, PlusIcon, ImageIcon } from '../../shared/Icons';
import { TokenItem } from '../TokenItem';
import { privacyService } from '../../../services/PrivacyService';
import { ocs01Manager } from '../../../services/OCS01TokenService';
import { getTokenPrice, formatUsd, calculateUsdValue } from '../../../services/PriceService';
import { saveSettings } from '../../../utils/storage';
import { getRpcClient } from '../../../utils/rpc';
import { AddTokenModal } from './AddTokenModal';
import './HomeView.css';

export function HomeView({ wallet, balance, transactions, onCopyAddress, copied, onSend, onReceive, onHistory, onNFT, settings, onUpdateSettings, showToast, onTokenClick, isBalanceHidden, onToggleBalance, allTokens, isLoadingTokens }) {
    const [activeTab, setActiveTab] = useState('crypto');
    const [encryptedBalance, setEncryptedBalance] = useState(null);
    const [octPrice, setOctPrice] = useState(0);
    const [showAddTokenModal, setShowAddTokenModal] = useState(false);

    // Fetch OCT price based on network
    useEffect(() => {
        const fetchPrice = async () => {
            const price = await getTokenPrice('OCT', 'usd', settings?.network || 'testnet');
            setOctPrice(price);
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

    // Calculate total balance including shielded
    const totalBalance = balance + (encryptedBalance?.encryptedBalance || 0);

    // Use tokens from parent (already includes OCT + OCS01)
    const tokens = allTokens || [];

    return (
        <>
            {/* Balance Card - Clickable USD, No Eye Button */}
            <div className="balance-card">
                {isBalanceHidden ? (
                    <div className="balance-amount balance-clickable" onClick={onToggleBalance}>
                        <span className="balance-hidden">••••••</span>
                    </div>
                ) : (
                    <div className="balance-clickable" onClick={onToggleBalance}>
                        {/* USD Value - Primary - Clickable */}
                        <div className="balance-usd">
                            {formatUsd(calculateUsdValue(totalBalance, octPrice))}
                        </div>

                        {/* OCT Amount - Secondary */}
                        <div className="balance-token">
                            {formatAmount(totalBalance)} OCT
                        </div>
                    </div>
                )}

                {/* Address */}
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
                            {tokens.map((token) => (
                                <TokenItem
                                    key={token.isNative ? 'OCT' : token.contractAddress}
                                    token={token}
                                    onClick={() => onTokenClick(token)}
                                    hideBalance={isBalanceHidden}
                                />
                            ))}
                            {isLoadingTokens && tokens.length === 0 && (
                                <div className="text-center py-md opacity-50">
                                    <div className="loading-spinner mb-xs" style={{ width: 16, height: 16, margin: '0 auto' }} />
                                    <span className="text-xs">Scanning for tokens...</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'nft' && (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <ImageIcon size={40} className="opacity-20" />
                        </div>
                        <p>No NFTs yet</p>
                        <span className="text-tertiary text-sm">Your NFTs will appear here</span>
                    </div>
                )}
            </div>

            {/* Add Token Modal */}
            <AddTokenModal
                isOpen={showAddTokenModal}
                onClose={() => setShowAddTokenModal(false)}
                rpcClient={getRpcClient(settings?.rpcUrl)}
                onSuccess={() => {/* Token will be auto-refreshed by parent */ }}
            />
        </>
    );
}
