import {
    SendIcon,
    ReceiveIcon,
    ContractIcon,
    BridgeIcon,
    EarnIcon,
    GasIcon,
    CopyIcon,
    GlobeIcon,
    ChevronLeftIcon,
    ArrowUpRightIcon,
    ArrowDownLeftIcon,
    CheckIcon,
    CloseIcon
} from '../Icons';
import { formatAmount, truncateAddress } from '../../utils/crypto';
import './TransactionDetailModal.css';

export function TransactionDetailModal({ tx, onClose }) {
    if (!tx) return null;

    const isIncoming = tx.type === 'in';
    const explorerUrl = `https://octrascan.io/transactions/${tx.hash}`;

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        // Could add toast here
    };

    return (
        <div className="tx-modal-overlay" onClick={onClose}>
            <div className="tx-modal-content" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="tx-modal-header">
                    <h2 className="tx-modal-title">Transaction Details</h2>
                    <button className="icon-btn-ghost" onClick={onClose}>
                        <CloseIcon size={20} />
                    </button>
                </div>

                <div className="tx-modal-body">
                    {/* Hero Section */}
                    <div className="tx-hero">
                        <div className={`tx-hero-icon ${isIncoming ? 'incoming' : 'outgoing'}`}>
                            {isIncoming ? <ArrowDownLeftIcon size={32} /> : <ArrowUpRightIcon size={32} />}
                        </div>

                        <div className={`tx-amount-large ${isIncoming ? 'incoming' : ''}`}>
                            {isIncoming ? '+' : '-'}{formatAmount(tx.amount)} OCT
                        </div>

                        <div className="tx-status success">
                            Confirmed
                        </div>
                    </div>

                    {/* Transaction Info Card */}
                    <div className="tx-info-card">
                        <div className="tx-info-title">Information</div>

                        <div className="tx-row">
                            <span className="tx-label">Date</span>
                            <span className="tx-value">{new Date(tx.timestamp).toLocaleString()}</span>
                        </div>

                        <div className="tx-row">
                            <span className="tx-label">Status</span>
                            <span className="text-success font-semibold">Success</span>
                        </div>

                        <div className="divider my-sm opacity-50"></div>

                        <div className="tx-row">
                            <span className="tx-label">From</span>
                            <div className="tx-value-container">
                                <span className="tx-value mono">{truncateAddress(tx.address || '0x...', 8, 8)}</span>
                                <button className="tx-copy-btn" onClick={() => handleCopy(tx.address)}>
                                    <CopyIcon size={14} />
                                </button>
                            </div>
                        </div>

                        {/* If we had "To" or sender info explicitly available, we'd adding it here */}

                        <div className="tx-row">
                            <span className="tx-label">Network Fee</span>
                            <div className="tx-value-container">
                                <GasIcon size={14} className="text-tertiary" />
                                <span className="tx-value">{formatAmount(tx.fee || 0.0001)} OCT</span>
                            </div>
                        </div>
                    </div>

                    {/* Technical Details Card */}
                    <div className="tx-info-card">
                        <div className="tx-info-title">Technical Details</div>

                        <div className="tx-row">
                            <span className="tx-label">Hash</span>
                            <div className="tx-value-container">
                                <a
                                    href={`https://octrascan.io/transactions/${tx.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="tx-value mono text-accent hover:underline cursor-pointer"
                                    style={{ color: 'var(--accent-primary)' }}
                                >
                                    {truncateAddress(tx.hash, 10, 8)}
                                </a>
                            </div>
                        </div>

                        {tx.isContract && (
                            <div className="tx-row">
                                <span className="tx-label">Contract</span>
                                <div className="tx-value-container">
                                    <ContractIcon size={14} className="text-primary" />
                                    <span className="tx-value mono">{truncateAddress(tx.contractAddress, 8, 8)}</span>
                                </div>
                            </div>
                        )}

                        <div className="tx-row">
                            <span className="tx-label">Epoch</span>
                            <span className="tx-value">#{tx.blockNumber !== null && tx.blockNumber !== undefined ? tx.blockNumber : 'Pending'}</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
