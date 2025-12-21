import { useState, useMemo } from 'react';

import { ChevronLeftIcon, HistoryIcon } from '../../shared/Icons';
import { TransactionItem } from '../TransactionItem';
import { TransactionDetailModal } from '../TransactionDetailModal';
import './HistoryView.css';

export function HistoryView({ transactions, address, settings, onBack }) {
    const [filter, setFilter] = useState('all'); // 'all' | 'sent' | 'received'
    const [selectedTx, setSelectedTx] = useState(null);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
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
    }, [transactions, filter]);

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
                <div className="tx-empty py-3xl flex flex-col items-center">
                    <div style={{ margin: '0 0 16px 0', opacity: 0.8, color: 'var(--text-tertiary)' }}>
                        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Shadow */}
                            <ellipse className="ghost-shadow" cx="50" cy="92" rx="20" ry="3" fill="currentColor" fillOpacity="0.2" />
                            {/* Body */}
                            <g className="ghost-body">
                                <path d="M50 15C30 15 15 35 15 60V85L22 78L29 85L36 78L43 85L50 78L57 85L64 78L71 85L78 78L85 85V60C85 35 70 15 50 15Z"
                                    fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                <circle cx="38" cy="45" r="4" fill="currentColor" fillOpacity="0.8" />
                                <circle cx="62" cy="45" r="4" fill="currentColor" fillOpacity="0.8" />
                                <ellipse cx="50" cy="58" rx="3" ry="4" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M15 55C10 55 5 45 10 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M85 55C90 55 95 45 90 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </g>
                        </svg>
                    </div>
                    <p className="text-tertiary">No transactions found</p>
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
