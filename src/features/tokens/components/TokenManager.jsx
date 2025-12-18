/**
 * Token Manager Component
 * View all tokens, add/remove custom tokens, transfer
 */

import { useState, useEffect } from 'react';
import {
    ChevronLeftIcon,
    PlusIcon,
    CloseIcon,
    SendIcon,
    RefreshIcon,
    ChevronRightIcon
} from '../../../components/Icons';
import { TokenIcon } from '../../../components/TokenIcon';
import { getTokensWithBalances, addToken, removeToken } from '../tokenService';
import { formatAmount, isValidAddress } from '../../../utils/crypto';

export function TokenManager({ wallet, rpcClient, onBack, onTransfer }) {
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddToken, setShowAddToken] = useState(false);
    const [selectedToken, setSelectedToken] = useState(null);

    const loadTokens = async () => {
        setLoading(true);
        try {
            const tokensWithBalances = await getTokensWithBalances(wallet.address, rpcClient);
            setTokens(tokensWithBalances);
        } catch (error) {
            console.error('Failed to load tokens:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTokens();
    }, [wallet.address]);

    const handleAddToken = async (tokenData) => {
        try {
            await addToken(tokenData, rpcClient);
            await loadTokens();
            setShowAddToken(false);
        } catch (error) {
            throw error;
        }
    };

    const handleRemoveToken = async (contractAddress) => {
        removeToken(contractAddress);
        await loadTokens();
        setSelectedToken(null);
    };

    if (showAddToken) {
        return (
            <AddTokenForm
                onBack={() => setShowAddToken(false)}
                onAdd={handleAddToken}
            />
        );
    }

    if (selectedToken) {
        return (
            <TokenDetail
                token={selectedToken}
                onBack={() => setSelectedToken(null)}
                onRemove={handleRemoveToken}
                onTransfer={() => onTransfer?.(selectedToken)}
            />
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-xl">
                <div className="flex items-center gap-md">
                    <button className="header-icon-btn" onClick={onBack}>
                        <ChevronLeftIcon size={20} />
                    </button>
                    <h2 className="text-lg font-semibold">Tokens</h2>
                </div>
                <div className="flex gap-sm">
                    <button
                        className="header-icon-btn"
                        onClick={loadTokens}
                        disabled={loading}
                    >
                        <RefreshIcon size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        className="header-icon-btn"
                        onClick={() => setShowAddToken(true)}
                    >
                        <PlusIcon size={18} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-3xl">
                    <div className="loading-spinner mb-lg" style={{ width: 40, height: 40 }} />
                    <p className="text-secondary">Loading tokens...</p>
                </div>
            ) : (
                <div className="token-list">
                    {tokens.map((token) => (
                        <div
                            key={token.contractAddress || token.symbol}
                            className="token-item"
                            onClick={() => !token.isNative && setSelectedToken(token)}
                        >
                            <div className="token-item-icon">
                                <TokenIcon symbol={token.symbol} logoUrl={token.logoUrl} size={40} />
                            </div>
                            <div className="token-item-info">
                                <span className="token-item-name">{token.name}</span>
                                <span className="token-item-symbol">{token.symbol}</span>
                            </div>
                            <div className="token-item-balance">
                                <span className="token-item-amount">
                                    {formatAmount(token.balance, 4)}
                                </span>
                                {!token.isNative && <ChevronRightIcon size={16} className="text-tertiary" />}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AddTokenForm({ onBack, onAdd }) {
    const [contractAddress, setContractAddress] = useState('');
    const [symbol, setSymbol] = useState('');
    const [name, setName] = useState('');
    const [decimals, setDecimals] = useState('6');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');

        if (!contractAddress.trim()) {
            setError('Contract address is required');
            return;
        }

        if (!isValidAddress(contractAddress.trim())) {
            setError('Invalid contract address');
            return;
        }

        if (!symbol.trim()) {
            setError('Token symbol is required');
            return;
        }

        setLoading(true);
        try {
            await onAdd({
                contractAddress: contractAddress.trim(),
                symbol: symbol.trim().toUpperCase(),
                name: name.trim() || symbol.trim().toUpperCase(),
                decimals: parseInt(decimals) || 6
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-md mb-xl">
                <button className="header-icon-btn" onClick={onBack}>
                    <ChevronLeftIcon size={20} />
                </button>
                <h2 className="text-lg font-semibold">Add Custom Token</h2>
            </div>

            <div className="form-group">
                <label className="form-label">Contract Address</label>
                <input
                    type="text"
                    className="input input-mono"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    placeholder="octra1..."
                />
            </div>

            <div className="form-group">
                <label className="form-label">Token Symbol</label>
                <input
                    type="text"
                    className="input"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.slice(0, 10))}
                    placeholder="e.g. USDT"
                    maxLength={10}
                />
            </div>

            <div className="form-group">
                <label className="form-label">Token Name (Optional)</label>
                <input
                    type="text"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tether USD"
                />
            </div>

            <div className="form-group">
                <label className="form-label">Decimals</label>
                <input
                    type="number"
                    className="input"
                    value={decimals}
                    onChange={(e) => setDecimals(e.target.value)}
                    placeholder="6"
                    min="0"
                    max="18"
                />
            </div>

            {error && <p className="text-error text-sm mb-lg">{error}</p>}

            <button
                className="btn btn-primary btn-lg btn-full"
                onClick={handleSubmit}
                disabled={loading}
            >
                {loading ? <span className="loading-spinner" /> : 'Add Token'}
            </button>
        </div>
    );
}

function TokenDetail({ token, onBack, onRemove, onTransfer }) {
    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-md mb-xl">
                <button className="header-icon-btn" onClick={onBack}>
                    <ChevronLeftIcon size={20} />
                </button>
                <h2 className="text-lg font-semibold">{token.symbol}</h2>
            </div>

            <div className="flex flex-col items-center mb-xl">
                <TokenIcon symbol={token.symbol} logoUrl={token.logoUrl} size={64} />
                <h3 className="text-2xl font-bold mt-lg">
                    {formatAmount(token.balance, 6)} {token.symbol}
                </h3>
                <p className="text-secondary">{token.name}</p>
            </div>

            <div className="card mb-lg">
                <h4 className="text-sm font-semibold mb-md">Token Info</h4>
                <div className="token-details-list">
                    <div className="token-detail-row">
                        <span className="text-secondary">Symbol</span>
                        <span>{token.symbol}</span>
                    </div>
                    <div className="token-detail-row">
                        <span className="text-secondary">Decimals</span>
                        <span>{token.decimals}</span>
                    </div>
                    {token.contractAddress && (
                        <div className="token-detail-row">
                            <span className="text-secondary">Contract</span>
                            <span className="text-mono text-xs">{token.contractAddress}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-md">
                <button
                    className="btn btn-primary btn-lg btn-full gap-sm"
                    onClick={onTransfer}
                >
                    <SendIcon size={18} />
                    Transfer {token.symbol}
                </button>

                {!token.isNative && (
                    <button
                        className="btn btn-ghost btn-lg btn-full text-error"
                        onClick={() => {
                            if (confirm(`Remove ${token.symbol} from your wallet?`)) {
                                onRemove(token.contractAddress);
                            }
                        }}
                    >
                        Remove Token
                    </button>
                )}
            </div>
        </div>
    );
}

export default TokenManager;
