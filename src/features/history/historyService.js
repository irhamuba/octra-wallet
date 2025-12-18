/**
 * Transaction History Service
 * Handles transaction fetching and filtering
 */

export const TX_FILTERS = {
    ALL: 'all',
    PENDING: 'pending',
    SEND: 'send',
    RECEIVE: 'receive'
};

export const TX_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed'
};

// Pending transactions storage
const PENDING_TX_KEY = 'pending_transactions';

export const getPendingTransactions = () => {
    try {
        const stored = localStorage.getItem(PENDING_TX_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const savePendingTransactions = (txs) => {
    localStorage.setItem(PENDING_TX_KEY, JSON.stringify(txs));
};

export const addPendingTransaction = (tx) => {
    const pending = getPendingTransactions();
    pending.unshift({
        ...tx,
        status: TX_STATUS.PENDING,
        addedAt: Date.now()
    });
    savePendingTransactions(pending);
    return pending;
};

export const removePendingTransaction = (hash) => {
    const pending = getPendingTransactions().filter(tx => tx.hash !== hash);
    savePendingTransactions(pending);
    return pending;
};

export const updatePendingTransactionStatus = (hash, status) => {
    const pending = getPendingTransactions();
    const tx = pending.find(t => t.hash === hash);
    if (tx) {
        tx.status = status;
        savePendingTransactions(pending);
    }
    return pending;
};

// Filter transactions
export const filterTransactions = (transactions, filter, walletAddress) => {
    switch (filter) {
        case TX_FILTERS.PENDING:
            return transactions.filter(tx => tx.status === TX_STATUS.PENDING);
        case TX_FILTERS.SEND:
            return transactions.filter(tx => tx.type === 'out' || tx.from === walletAddress);
        case TX_FILTERS.RECEIVE:
            return transactions.filter(tx => tx.type === 'in' || tx.to === walletAddress);
        case TX_FILTERS.ALL:
        default:
            return transactions;
    }
};

// Merge pending and confirmed transactions
export const mergeTransactions = (confirmedTxs, pendingTxs) => {
    const pendingHashes = new Set(pendingTxs.map(tx => tx.hash));

    // Remove any pending that's now confirmed
    const stillPending = pendingTxs.filter(ptx => {
        const isConfirmed = confirmedTxs.some(ctx => ctx.hash === ptx.hash);
        if (isConfirmed) {
            removePendingTransaction(ptx.hash);
        }
        return !isConfirmed;
    });

    // Combine: pending first, then confirmed
    return [...stillPending, ...confirmedTxs];
};

// Format transaction for display
export const formatTransaction = (tx, walletAddress) => {
    const isIncoming = tx.to === walletAddress;

    return {
        hash: tx.hash,
        type: isIncoming ? 'in' : 'out',
        amount: tx.amount,
        address: isIncoming ? tx.from : tx.to,
        timestamp: tx.timestamp,
        status: tx.status || TX_STATUS.CONFIRMED,
        fee: tx.fee || 0
    };
};
