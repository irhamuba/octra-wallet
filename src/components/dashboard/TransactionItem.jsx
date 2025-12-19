import { formatAmount, truncateAddress } from '../../utils/crypto';
import { ArrowUpRightIcon, ArrowDownLeftIcon } from '../Icons';

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

export function TransactionItem({ tx, onClick }) {
    const isIncoming = tx.type === 'in';
    const timeAgo = formatTimeAgo(tx.timestamp);

    return (
        <div className={`tx-item ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
            <div className={`tx-icon ${isIncoming ? 'tx-icon-in' : 'tx-icon-out'}`}>
                {isIncoming ? <ArrowDownLeftIcon size={18} /> : <ArrowUpRightIcon size={18} />}
            </div>
            <div className="tx-details">
                <div className="tx-type">{isIncoming ? 'Received' : 'Sent'}</div>
                <div className="tx-address">{truncateAddress(tx.address, 8, 6)}</div>
            </div>
            <div className="tx-amount">
                <div className={`tx-amount-value ${isIncoming ? 'tx-amount-in' : 'tx-amount-out'}`}>
                    {isIncoming ? '+' : '-'}{formatAmount(tx.amount)} OCT
                </div>
                <div className="tx-time">{timeAgo}</div>
            </div>
        </div>
    );
}
