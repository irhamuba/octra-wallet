import { formatAmount } from '../../../utils/crypto';
import { TokenIcon } from '../../TokenIcon';
import { SendIcon, ReceiveIcon, SwapIcon } from './TokenDetailIcons';
import './TokenDetailView.css';

export function TokenDetailView({ token, wallet, onBack, onSend, onReceive, transactions }) {
    // Filter transactions for this token.
    const tokenTransactions = transactions?.filter(tx =>
        (token.isNative && !tx.token) || tx.token === token.symbol
    ) || [];

    return (
        <div className="token-detail-view animate-fade-in">
            {/* Header */}
            <div className="token-detail-header">
                <button className="back-btn" onClick={onBack}>
                    ← Back
                </button>
                <div></div>
            </div>

            {/* Token Info Card */}
            <div className="token-info-card">
                <div className="token-info-header">
                    <TokenIcon
                        symbol={token.symbol}
                        logoUrl={token.logoUrl}
                        size={32}
                    />
                    <div className="token-info-name">
                        <h3>{token.name}</h3>
                        <span className="token-info-symbol">{token.symbol}</span>
                    </div>
                </div>

                {/* Balance */}
                <div className="token-balance-section">
                    <div className="token-balance-label">Balance</div>
                    <div className="token-balance-amount">
                        {formatAmount(token.balance)} {token.symbol}
                    </div>
                </div>

                {/* Price Info (Placeholder for Testnet) */}
                <div className="token-price-section">
                    <div className="token-price-row">
                        <span className="token-price-label">Price</span>
                        <span className="token-price-value">--</span>
                    </div>
                    <div className="token-price-row">
                        <span className="token-price-label">24h Change</span>
                        <span className="token-price-value text-secondary">--</span>
                    </div>
                    <div className="text-center mt-sm text-secondary" style={{ fontSize: '10px' }}>
                        Market data unavailable on Testnet
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="token-actions">
                <button
                    className="token-action-btn send"
                    onClick={() => onSend(token)}
                >
                    <span className="token-action-icon"><SendIcon /></span>
                    <span>Send</span>
                </button>
                <button
                    className="token-action-btn receive"
                    onClick={() => onReceive(token)}
                >
                    <span className="token-action-icon"><ReceiveIcon /></span>
                    <span>Receive</span>
                </button>
                <button
                    className="token-action-btn swap"
                    disabled
                    title="Swap coming soon"
                >
                    <span className="token-action-icon"><SwapIcon /></span>
                    <span>Swap</span>
                </button>
            </div>

            {/* Transaction History */}
            <div className="token-history-section">
                <h3 className="token-history-title">Traffic History</h3>
                {tokenTransactions.length === 0 ? (
                    <div className="token-history-empty">
                        <span className="empty-icon">📭</span>
                        <p>No transactions yet</p>
                    </div>
                ) : (
                    <div className="token-history-list">
                        {tokenTransactions.map((tx, index) => (
                            <div key={index} className="token-history-item">
                                <div className="token-history-icon">
                                    {tx.type === 'in' ? <ReceiveIcon /> : <SendIcon />}
                                </div>
                                <div className="token-history-info">
                                    <div className="token-history-type">
                                        {tx.type === 'in' ? 'Received' : 'Sent'}
                                    </div>
                                    <div className="token-history-date">
                                        {new Date(tx.timestamp).toLocaleString()}
                                    </div>
                                </div>
                                <div className="token-history-amount">
                                    <div className={`token-history-value ${tx.type === 'in' ? 'receive' : 'send'}`}>
                                        {tx.type === 'in' ? '+' : '-'}{formatAmount(tx.amount)}
                                    </div>
                                    <div className="token-history-symbol">{token.symbol}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
