/**
 * Wallet Selector Component
 * Dropdown for switching between multiple wallets
 */

import { useState } from 'react';
import './WalletSelector.css';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    PlusIcon,
    CheckIcon,
    CopyIcon,
    WalletIcon,
    EditIcon
} from './Icons';
import { truncateAddress } from '../../utils/crypto';

export function WalletSelector({
    wallets,
    activeIndex,
    onSelect,
    onAddWallet,
    onEditWallet,
    onClose
}) {
    const [copied, setCopied] = useState(null);

    const handleCopy = async (address, index, e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(address);
            setCopied(index);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="wallet-selector animate-fade-in">
            <div className="wallet-selector-header">
                <button className="header-icon-btn" onClick={onClose}>
                    <ChevronLeftIcon size={20} />
                </button>
                <h2 className="text-lg font-semibold">My Wallets</h2>
                <button className="header-icon-btn" onClick={onAddWallet}>
                    <PlusIcon size={20} />
                </button>
            </div>

            <div className="wallet-list">
                {wallets.map((wallet, index) => (
                    <div
                        key={wallet.id || index}
                        className={`wallet-list-item ${index === activeIndex ? 'active' : ''}`}
                        onClick={() => onSelect(index)}
                    >
                        <div
                            className="wallet-list-icon-wrapper"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onEditWallet) onEditWallet(index);
                            }}
                        >
                            <div className="wallet-list-icon">
                                <WalletIcon size={20} />
                            </div>
                            <div className="wallet-list-icon-edit">
                                <EditIcon size={12} />
                            </div>
                        </div>

                        <div className="wallet-list-info">
                            <div className="wallet-list-name">
                                {wallet.name || `Wallet ${index + 1}`}
                                {index === activeIndex && (
                                    <span className="wallet-active-badge">Active</span>
                                )}
                            </div>
                            <div className="wallet-list-address">
                                {truncateAddress(wallet.address, 10, 8)}
                            </div>
                        </div>

                        <button
                            className="wallet-list-copy"
                            onClick={(e) => handleCopy(wallet.address, index, e)}
                        >
                            {copied === index ? (
                                <CheckIcon size={16} style={{ color: 'var(--success)' }} />
                            ) : (
                                <CopyIcon size={16} />
                            )}
                        </button>
                    </div>
                ))}
            </div>

            <button
                className="btn btn-secondary btn-full mt-lg gap-sm"
                onClick={onAddWallet}
            >
                <PlusIcon size={18} />
                Add Wallet
            </button>
        </div>
    );
}

export function WalletHeader({
    wallet,
    wallets = [],
    onOpenSelector,
    onCopyAddress
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(wallet.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            if (onCopyAddress) onCopyAddress();
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="wallet-header-address" onClick={onOpenSelector}>
            <div className="wallet-header-name">
                {wallet.name || 'Wallet 1'}
                {wallets.length > 1 && (
                    <ChevronRightIcon size={14} className="wallet-dropdown-icon" />
                )}
            </div>
            <div className="wallet-header-addr">
                <span className="address-text">{truncateAddress(wallet.address, 8, 6)}</span>
                <button
                    className="address-copy-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCopy();
                    }}
                >
                    {copied ? (
                        <CheckIcon size={14} style={{ color: 'var(--success)' }} />
                    ) : (
                        <CopyIcon size={14} />
                    )}
                </button>
            </div>
        </div>
    );
}

export default WalletSelector;
