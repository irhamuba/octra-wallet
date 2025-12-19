import { formatAmount } from '../../../utils/crypto';
import { ChevronLeftIcon } from '../../shared/Icons';
import { TokenIcon } from '../../shared/TokenIcon';
import './TokenSelect.css';

export function TokenSelectView({ tokens, onSelect, onBack }) {
    return (
        <div className="token-select-view animate-fade-in">
            <div className="flex items-center gap-md mb-xl">
                <button className="header-icon-btn" onClick={onBack}>
                    <ChevronLeftIcon size={20} />
                </button>
                <h2 className="text-lg font-semibold">Select Token</h2>
            </div>

            <p className="text-secondary text-sm mb-lg">Choose which token to send</p>

            <div className="token-select-list px-md">
                {tokens.map((token) => (
                    <button
                        key={token.symbol}
                        className="token-select-item"
                        onClick={() => onSelect(token)}
                    >
                        <div className="token-select-icon">
                            <TokenIcon
                                symbol={token.symbol}
                                logoUrl={token.logoUrl}
                                size={28}
                            />
                        </div>
                        <div className="token-select-info">
                            <span className="token-select-symbol">{token.symbol}</span>
                            <span className="token-select-balance-text">{formatAmount(token.balance)}</span>
                        </div>
                        <div className="token-select-market">
                            <span className="token-market-value">$0.00</span>
                            <span className="token-market-price">-</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
