/**
 * dApp Connection Components
 * Manage connected dApps and approve requests
 */

import { useState, useEffect } from 'react';
import {
    ChevronLeftIcon,
    CloseIcon,
    CheckIcon,
    GlobeIcon,
    KeyIcon
} from '../../../components/Icons';
import {
    getConnectedDapps,
    disconnectFromDapp,
    getPendingRequests,
    approveRequest,
    rejectRequest
} from '../dappService';

export function ConnectedDapps({ onBack }) {
    const [dapps, setDapps] = useState([]);

    useEffect(() => {
        setDapps(getConnectedDapps());
    }, []);

    const handleDisconnect = (origin) => {
        const updated = disconnectFromDapp(origin);
        setDapps(updated);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-md mb-xl">
                <button className="header-icon-btn" onClick={onBack}>
                    <ChevronLeftIcon size={20} />
                </button>
                <h2 className="text-lg font-semibold">Connected dApps</h2>
            </div>

            {dapps.length === 0 ? (
                <div className="tx-empty">
                    <div className="tx-empty-icon">
                        <GlobeIcon size={24} />
                    </div>
                    <p>No connected dApps</p>
                    <p className="text-xs text-tertiary mt-sm">
                        dApps you connect to will appear here
                    </p>
                </div>
            ) : (
                <div className="dapp-list">
                    {dapps.map((dapp) => (
                        <div key={dapp.origin} className="dapp-item">
                            <div className="dapp-icon">
                                {dapp.icon ? (
                                    <img src={dapp.icon} alt={dapp.name} />
                                ) : (
                                    <GlobeIcon size={20} />
                                )}
                            </div>
                            <div className="dapp-info">
                                <span className="dapp-name">{dapp.name || dapp.origin}</span>
                                <span className="dapp-origin">{dapp.origin}</span>
                            </div>
                            <button
                                className="btn btn-ghost btn-sm text-error"
                                onClick={() => handleDisconnect(dapp.origin)}
                            >
                                Disconnect
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function DappRequestModal({ request, wallet, onApprove, onReject }) {
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        try {
            await onApprove(request);
        } finally {
            setLoading(false);
        }
    };

    if (!request) return null;

    return (
        <div className="dapp-modal-overlay">
            <div className="dapp-modal animate-fade-in-scale">
                <div className="dapp-modal-header">
                    <div className="dapp-modal-icon">
                        <GlobeIcon size={24} />
                    </div>
                    <h3 className="dapp-modal-title">
                        {request.type === 'sign_message' ? 'Sign Message' : 'Approve Transaction'}
                    </h3>
                    <p className="dapp-modal-origin">{request.origin}</p>
                </div>

                <div className="dapp-modal-content">
                    {request.type === 'sign_message' ? (
                        <div className="dapp-message-box">
                            <p className="text-sm text-secondary mb-sm">Message to sign:</p>
                            <div className="dapp-message-text">
                                {request.message}
                            </div>
                        </div>
                    ) : (
                        <div className="dapp-tx-details">
                            <div className="dapp-tx-row">
                                <span className="text-secondary">To</span>
                                <span className="text-mono text-sm">{request.transaction?.to}</span>
                            </div>
                            <div className="dapp-tx-row">
                                <span className="text-secondary">Amount</span>
                                <span>{request.transaction?.amount} OCT</span>
                            </div>
                            {request.transaction?.data && (
                                <div className="dapp-tx-row">
                                    <span className="text-secondary">Data</span>
                                    <span className="text-mono text-xs truncate">{request.transaction.data}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="dapp-modal-actions">
                    <button
                        className="btn btn-ghost flex-1"
                        onClick={() => onReject(request)}
                        disabled={loading}
                    >
                        Reject
                    </button>
                    <button
                        className="btn btn-primary flex-1"
                        onClick={handleApprove}
                        disabled={loading}
                    >
                        {loading ? <span className="loading-spinner" /> : 'Approve'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function PendingRequestsBadge() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const updateCount = () => {
            setCount(getPendingRequests().length);
        };
        updateCount();

        // Poll for updates
        const interval = setInterval(updateCount, 1000);
        return () => clearInterval(interval);
    }, []);

    if (count === 0) return null;

    return (
        <span className="pending-requests-badge">{count}</span>
    );
}

export default ConnectedDapps;
