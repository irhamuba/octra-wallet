/**
 * Network Switcher Component
 * Switch between Testnet and Mainnet (soon)
 */

import { useState } from 'react';
import { NETWORKS } from '../../../constants/networks';
import { ChevronDownIcon, CheckIcon, GlobeIcon } from '../../../components/Icons';

export function NetworkSwitcher({ currentNetwork, onSwitch }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (networkId) => {
        const network = NETWORKS[networkId];
        if (network.isAvailable) {
            onSwitch(networkId);
        }
        setIsOpen(false);
    };

    const current = NETWORKS[currentNetwork];

    return (
        <div className="network-switcher-wrapper">
            <button
                className="network-switcher-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                <GlobeIcon size={14} />
                <span>{current?.name || 'Network'}</span>
                <ChevronDownIcon size={12} className={isOpen ? 'rotate-180' : ''} />
            </button>

            {isOpen && (
                <>
                    <div className="network-dropdown animate-fade-in">
                        {Object.entries(NETWORKS).map(([id, network]) => (
                            <div
                                key={id}
                                className={`network-dropdown-item ${!network.isAvailable ? 'disabled' : ''} ${id === currentNetwork ? 'active' : ''}`}
                                onClick={() => handleSelect(id)}
                            >
                                <div className="network-dropdown-info">
                                    <span className="network-dropdown-name">{network.name}</span>
                                    {!network.isAvailable && (
                                        <span className="network-soon-badge">Soon</span>
                                    )}
                                </div>
                                {id === currentNetwork && network.isAvailable && (
                                    <CheckIcon size={14} className="text-accent" />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="network-dropdown-overlay" onClick={() => setIsOpen(false)} />
                </>
            )}
        </div>
    );
}

export default NetworkSwitcher;
