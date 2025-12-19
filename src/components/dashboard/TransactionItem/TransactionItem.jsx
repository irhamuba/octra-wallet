import { formatAmount, truncateAddress } from '../../../utils/crypto';
import { ArrowUpRightIcon, ArrowDownLeftIcon, ShieldIcon, UnshieldIcon, PrivateTransferIcon, ClaimIcon } from '../../shared/Icons';
import './TransactionItem.css';

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
    const isIncoming = tx.type === 'in' || tx.type === 'claim' || tx.type === 'unshield';
    const timeAgo = formatTimeAgo(tx.timestamp);

    let Icon = isIncoming ? ArrowDownLeftIcon : ArrowUpRightIcon;
    let iconClass = isIncoming ? 'incoming' : 'outgoing';
    let title = isIncoming ? 'Received' : 'Sent';

    // Handle specific transaction types
    switch (tx.type) {
        case 'shield':
            Icon = ShieldIcon;
            iconClass = 'shield';
            title = 'Shielded Balance';
            break;
        case 'unshield':
            Icon = UnshieldIcon;
            iconClass = 'unshield';
            title = 'Unshielded Balance';
            break;
        case 'private':
            Icon = PrivateTransferIcon;
            iconClass = 'private';
            title = 'Private Transfer';
            break;
        case 'claim':
            Icon = ClaimIcon;
            iconClass = 'claim';
            title = 'Claimed Transfer';
            break;
        case 'in':
            title = 'Received';
            break;
        case 'out':
            title = 'Sent';
            break;
    }

    return (
        <div className="tx-item" onClick={onClick}>
            <div className="tx-item-main">
                <div className={`tx-item-icon ${iconClass}`}>
                    <Icon size={16} />
                </div>
                <div className="tx-item-info">
                    <div className="flex items-center gap-xs">
                        <span className="tx-item-title">{title}</span>
                        {tx.status === 'pending' && (
                            <span className="tx-pending-badge">Pending</span>
                        )}
                    </div>
                    <span className="tx-item-subtitle">{truncateAddress(tx.address, 6, 4)}</span>
                </div>
            </div>
            <div className="tx-item-side">
                <div className={`tx-item-amount ${iconClass}`}>
                    {isIncoming ? '+' : '-'}{formatAmount(tx.amount)}
                </div>
                <div className="tx-item-time">{timeAgo}</div>
            </div>
        </div>
    );
}
