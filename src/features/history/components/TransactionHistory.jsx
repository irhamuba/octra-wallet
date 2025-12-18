/**
 * Transaction History Component
 * With filter tabs: All, Pending, Send, Receive
 */

import { useState, useEffect } from 'react';
import {
    ChevronLeftIcon,
    ArrowUpRightIcon,
    ArrowDownLeftIcon,
    HistoryIcon
} from '../../../components/Icons';
import { TX_FILTERS, filterTransactions, getPendingTransactions, mergeTransactions } from '../historyService';
import { truncateAddress, formatAmount } from '../../../utils/crypto';

export function TransactionHistory({
    transactions,
    walletAddress,
    onBack,
    onViewDetail
}) {
    const [filter, setFilter] = useState(TX_FILTERS.ALL);
    const [allTransactions, setAllTransactions] = useState([]);

    useEffect(() => {
        // Merge pending and confirmed transactions
        const pending = getPendingTransactions();
        const merged = mergeTransactions(transactions, pending);
        setAllTransactions(merged);
    }, [transactions]);

    const filteredTxs = filterTransactions(allTransactions, filter, walletAddress);

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-md mb-lg">
                <button className="header-icon-btn" onClick={onBack}>
                    <ChevronLeftIcon size={20} />
                </button>
                <h2 className="text-lg font-semibold">Transaction History</h2>
            </div>

            {/* Filter Tabs */}
            <div className="history-tabs mb-lg">
                {Object.entries(TX_FILTERS).map(([key, value]) => (
                    <button
                        key={key}
                        className={`history-tab ${filter === value ? 'active' : ''}`}
                        onClick={() => setFilter(value)}
                    >
                        {key.charAt(0) + key.slice(1).toLowerCase()}
                        {value === TX_FILTERS.PENDING && (
                            <span className="history-tab-count">
                                {getPendingTransactions().length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Transaction List */}
            {filteredTxs.length === 0 ? (
                <div className="tx-empty">
                    <div className="tx-empty-icon">
                        <HistoryIcon size={24} />
                    </div>
                    <p>No transactions found</p>
                    <p className="text-xs text-tertiary mt-sm">
                        {filter === TX_FILTERS.PENDING
                            ? 'No pending transactions'
                            : 'Transactions will appear here'}
                    </p>
                </div>
            ) : (
                <div className="tx-list">
                    {filteredTxs.map((tx, index) => (
                        <div
                            key={tx.hash || index}
                            className={`tx-item ${tx.status === 'pending' ? 'tx-pending' : ''}`}
                            onClick={() => onViewDetail?.(tx)}
                        >
                            <div className={`tx-icon ${tx.type === 'in' ? 'tx-icon-in' : 'tx-icon-out'}`}>
                                {tx.type === 'in' ? (
                                    <ArrowDownLeftIcon size={16} />
                                ) : (
                                    <ArrowUpRightIcon size={16} />
                                )}
                            </div>

                            <div className="tx-info">
                                <div className="tx-type">
                                    {tx.type === 'in' ? 'Received' : 'Sent'}
                                    {tx.status === 'pending' && (
                                        <span className="tx-pending-badge">Pending</span>
                                    )}
                                </div>
                                <div className="tx-address">{truncateAddress(tx.address, 8)}</div>
                            </div>

                            <div className="tx-amount">
                                <span className={`tx-amount-value ${tx.type === 'in' ? 'tx-amount-in' : 'tx-amount-out'}`}>
                                    {tx.type === 'in' ? '+' : '-'}{formatAmount(tx.amount, 4)} OCT
                                </span>
                                <span className="tx-time">{formatTime(tx.timestamp)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TransactionHistory;
