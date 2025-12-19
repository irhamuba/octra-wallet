/**
 * Network Switcher Component
 * Switch between Testnet and Mainnet with animation
 */

import { useState } from 'react';
import { ChevronLeftIcon } from '../../../components/shared/Icons';
import { RPC_URLS } from '../../../utils/rpc';
import './NetworkSwitcher.css';

export function NetworkSwitcher({ settings, onUpdateSettings, onBack, onSwitchComplete }) {
    const [isSwitching, setIsSwitching] = useState(false);
    const currentNetwork = settings?.network || 'testnet';

    const handleNetworkSwitch = async (network) => {
        if (network === currentNetwork || isSwitching) return;

        // Start switching animation
        setIsSwitching(true);

        // Update settings with new network only (user writes RPC manually)
        const updated = {
            ...settings,
            network
        };
        onUpdateSettings(updated);

        // Wait for animation (1.5 seconds)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // End animation
        setIsSwitching(false);

        // Notify parent to refresh data
        if (onSwitchComplete) {
            onSwitchComplete(network);
        }
    };

    return (
        <div className="animate-fade-in">
            <header className="wallet-header">
                <div className="flex items-center gap-md">
                    <button className="header-icon-btn" onClick={onBack}>
                        <ChevronLeftIcon size={20} />
                    </button>
                    <span className="text-lg font-semibold">Network</span>
                </div>
            </header>

            <div className="wallet-content">
                <p className="text-secondary text-sm mb-xl">
                    Select network. Switching will reload balance and transaction data.
                </p>

                <div className="network-options">
                    {/* Testnet Option */}
                    <button
                        className={`network-option ${currentNetwork === 'testnet' ? 'active' : ''}`}
                        onClick={() => handleNetworkSwitch('testnet')}
                        disabled={isSwitching}
                    >
                        <div className="network-option-indicator">
                            {currentNetwork === 'testnet' && (
                                <div className="network-option-dot" />
                            )}
                        </div>
                        <div className="network-option-content">
                            <div className="network-option-name">Testnet</div>
                            <div className="network-option-desc">For testing purposes only</div>
                        </div>
                    </button>

                    {/* Mainnet Option */}
                    <button
                        className={`network-option ${currentNetwork === 'mainnet' ? 'active' : ''} soon`}
                        onClick={() => { }}
                        disabled={true}
                    >
                        <div className="network-option-indicator">
                            {currentNetwork === 'mainnet' && (
                                <div className="network-option-dot" />
                            )}
                        </div>
                        <div className="network-option-content">
                            <div className="flex items-center justify-between">
                                <div className="network-option-name">Mainnet</div>
                                <span className="network-soon-badge">Soon</span>
                            </div>
                            <div className="network-option-desc">Connect to the official Octra Mainnet</div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Switching Animation Overlay */}
            {isSwitching && (
                <div className="network-switching-overlay">
                    <div className="network-switching-content">
                        {/* Switch Icon Animation */}
                        <svg
                            width="80"
                            height="80"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="network-switch-icon"
                        >
                            <path
                                d="M7 16V4M7 4L3 8M7 4L11 8"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="network-switch-arrow-1"
                            />
                            <path
                                d="M17 8V20M17 20L21 16M17 20L13 16"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="network-switch-arrow-2"
                            />
                        </svg>
                        <p className="network-switching-text">Switching network...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
