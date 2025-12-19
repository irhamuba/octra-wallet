import { useState } from 'react';
import { ChevronLeftIcon, HistoryIcon } from '../../shared/Icons';
import { TransactionItem } from '../TransactionItem';
import { TransactionDetailModal } from '../TransactionDetailModal';
import './HistoryView.css';

export function HistoryView({ transactions, address, settings, onBack }) {
    const [filter, setFilter] = useState('all'); // 'all' | 'sent' | 'received'
    const [selectedTx, setSelectedTx] = useState(null);

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all') return true;

        // Group outgoing transactions
        if (filter === 'sent') {
            return tx.type === 'out' || tx.type === 'shield' || tx.type === 'private';
        }

        // Group incoming transactions
        if (filter === 'received') {
            return tx.type === 'in' || tx.type === 'unshield' || tx.type === 'claim';
        }

        return true;
    });

    return (
        <div className="animate-fade-in">
            {selectedTx && (
                <TransactionDetailModal
                    tx={selectedTx}
                    network={settings?.network || 'testnet'}
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
                    className={`tab-pill ${filter === 'sent' ? 'active' : ''}`}
                    onClick={() => setFilter('sent')}
                >
                    Sent
                </button>
                <button
                    className={`tab-pill ${filter === 'received' ? 'active' : ''}`}
                    onClick={() => setFilter('received')}
                >
                    Received
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
