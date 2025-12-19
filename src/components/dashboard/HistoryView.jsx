import { useState } from 'react';
import { ChevronLeftIcon, HistoryIcon } from '../Icons';
import { TransactionItem } from './TransactionItem';
import { TransactionDetailModal } from './TransactionDetailModal';

export function HistoryView({ transactions, address, onBack }) {
    const [filter, setFilter] = useState('all'); // 'all' | 'in' | 'out'
    const [selectedTx, setSelectedTx] = useState(null);

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all') return true;
        return tx.type === filter;
    });

    return (
        <div className="animate-fade-in">
            {selectedTx && (
                <TransactionDetailModal
                    tx={selectedTx}
                    onClose={() => setSelectedTx(null)}
                />
            )}
            <div className="flex items-center gap-md mb-xl">
                <button className="header-icon-btn" onClick={onBack}>
                    <ChevronLeftIcon size={20} />
                </button>
                <h2 className="text-lg font-semibold">Transaction History</h2>
            </div>

            {/* Filter Tabs */}
            <div className="tab-pills mb-lg">
                <button
                    className={`tab-pill ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`tab-pill ${filter === 'out' ? 'active' : ''}`}
                    onClick={() => setFilter('out')}
                >
                    Send
                </button>
                <button
                    className={`tab-pill ${filter === 'in' ? 'active' : ''}`}
                    onClick={() => setFilter('in')}
                >
                    Receive
                </button>
            </div>

            {filteredTransactions.length === 0 ? (
                <div className="tx-empty py-3xl">
                    <div className="tx-empty-icon">
                        <HistoryIcon size={24} />
                    </div>
                    <p className="text-sm">No transactions found</p>
                    {(filter !== 'all') && (
                        <p className="text-xs text-tertiary mt-sm">
                            Try changing the filter
                        </p>
                    )}
                </div>
            ) : (
                <div className="tx-section">
                    <div className="tx-list">
                        {filteredTransactions.map((tx, index) => (
                            <TransactionItem
                                key={tx.hash || index}
                                tx={tx}
                                onClick={() => setSelectedTx(tx)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
