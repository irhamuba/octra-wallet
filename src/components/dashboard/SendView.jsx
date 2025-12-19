import { useState, useEffect } from 'react';
import { isValidAddress, formatAmount, truncateAddress } from '../../utils/crypto';
import { getRpcClient } from '../../utils/rpc';
import { addToTxHistory } from '../../utils/storage';
import { keyringService } from '../../services/KeyringService';
import {
    ChevronLeftIcon,
    OctraLogo,
    CheckIcon,
    CloseIcon
} from '../Icons';
import { TokenIcon } from '../TokenIcon';
import { TokenSelectView } from './TokenSelect/TokenSelectView';

export function SendView({ wallet, balance, nonce, onBack, onRefresh, settings, onLock }) {
    const [step, setStep] = useState('select'); // 'select' | 'form' | 'confirm' | 'sending' | 'success' | 'error'
    const [selectedToken, setSelectedToken] = useState(null);
    const [tokenBalance, setTokenBalance] = useState(balance);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [txHash, setTxHash] = useState('');
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);

    // Fee state
    // Default to higher values to avoid "OU too low" (1000 OU required)
    const [feeEstimate, setFeeEstimate] = useState({ low: 0.002, medium: 0.003, high: 0.005 });
    const [selectedFee, setSelectedFee] = useState('medium'); // 'low' | 'medium' | 'high'
    const [isLoadingFee, setIsLoadingFee] = useState(false);

    // Available tokens list
    const tokens = [
        { symbol: 'OCT', name: 'Octra', balance: balance, isNative: true }
        // Future: add other tokens here
    ];

    const fee = feeEstimate[selectedFee] || 0.002;
    const total = parseFloat(amount || 0) + fee;
    const isValid = recipient && isValidAddress(recipient) && amount && parseFloat(amount) > 0 && total <= tokenBalance;

    // Fetch balance and fee estimate when token selected
    const handleSelectToken = async (token) => {
        setSelectedToken(token);

        // Try to load cached balance for this token
        const cachedBalance = localStorage.getItem(`balance_${token.symbol}_${wallet?.address}`);
        if (cachedBalance) {
            setTokenBalance(parseFloat(cachedBalance));
        }

        setIsLoadingBalance(true);
        setIsLoadingFee(true);

        // Move to next step immediately
        setStep('form');

        try {
            const rpcClient = getRpcClient();

            // Fetch fresh balance in background
            const data = await rpcClient.getBalance(wallet.address);
            setTokenBalance(data.balance);

            // Cache the new balance
            localStorage.setItem(`balance_${token.symbol}_${wallet?.address}`, data.balance.toString());

            // Fetch fee estimate
            const fees = await rpcClient.getFeeEstimate(1);
            setFeeEstimate({
                low: Math.max(fees.low, 0.002),
                medium: Math.max(fees.medium, 0.003),
                high: Math.max(fees.high, 0.005)
            });
        } catch (err) {
            console.error('Failed to fetch data:', err);
            // Balance is already set from prop or cache
        } finally {
            setIsLoadingBalance(false);
            setIsLoadingFee(false);
        }
    };

    // Update fee estimate when amount changes
    useEffect(() => {
        const updateFee = async () => {
            if (amount && parseFloat(amount) > 0) {
                setIsLoadingFee(true);
                try {
                    const rpcClient = getRpcClient();
                    const fees = await rpcClient.getFeeEstimate(parseFloat(amount));
                    setFeeEstimate({
                        low: Math.max(fees.low, 0.002),
                        medium: Math.max(fees.medium, 0.003),
                        high: Math.max(fees.high, 0.005)
                    });
                } catch (err) {
                    console.error('Failed to update fee:', err);
                    // Fallback safeguards
                    setFeeEstimate({ low: 0.002, medium: 0.003, high: 0.005 });
                }
                setIsLoadingFee(false);
            }
        };

        const debounce = setTimeout(updateFee, 500);
        return () => clearTimeout(debounce);
    }, [amount]);

    const handleSubmit = () => {
        if (!isValidAddress(recipient)) {
            setError('Invalid recipient address');
            return;
        }
        if (parseFloat(amount) <= 0) {
            setError('Invalid amount');
            return;
        }
        if (total > tokenBalance) {
            setError('Insufficient balance');
            return;
        }
        setError('');
        setStep('confirm');
    };

    const handleSend = async () => {
        setStep('sending');
        setError('');

        try {
            const rpcClient = getRpcClient();

            // Get fresh nonce
            const data = await rpcClient.getBalance(wallet.address);
            let currentNonce = data.nonce;

            // Check for pending transactions
            const staged = await rpcClient.getStagedTransactions();
            const ourStaged = staged.filter(tx => tx.from === wallet.address);
            const maxNonce = ourStaged.length > 0
                ? Math.max(currentNonce, ...ourStaged.map(tx => parseInt(tx.nonce)))
                : currentNonce;

            // SECURITY: Use KeyringService for signing
            // This ensures private key never leaves the secure service
            // and is wiped from memory immediately after signing
            const tx = await keyringService.signTransaction(wallet.address, {
                to: recipient,
                amount: parseFloat(amount),
                nonce: maxNonce + 1,
                message: null,
                fee: fee // Pass selected fee
            });

            const result = await rpcClient.sendTransaction(tx);

            // Add to local history
            addToTxHistory({
                hash: result.txHash,
                type: 'out',
                amount: parseFloat(amount),
                address: recipient,
                status: 'pending'
            });

            setTxHash(result.txHash);
            setStep('success');
            onRefresh();
        } catch (err) {
            console.error('Send error:', err);
            if (err.message && err.message.includes('Keyring is locked') && onLock) {
                onLock();
                return;
            }
            setError(err.message || 'Transaction failed');
            setStep('error');
        }
    };

    const handleReset = () => {
        setSelectedToken(null);
        setRecipient('');
        setAmount('');
        setStep('select');
        setError('');
        setTxHash('');
    };

    return (
        <div className="animate-fade-in">
            {/* Step 1: Select Token */}
            {step === 'select' && (
                <TokenSelectView
                    tokens={tokens}
                    onSelect={handleSelectToken}
                    onBack={onBack}
                />
            )}

            {/* Step 2: Enter Amount & Address */}
            {step === 'form' && (
                <>
                    <div className="flex items-center gap-md mb-xl">
                        <button className="header-icon-btn" onClick={() => setStep('select')}>
                            <ChevronLeftIcon size={20} />
                        </button>
                        <h2 className="text-lg font-semibold">Send {selectedToken?.symbol}</h2>
                    </div>

                    {/* Token Balance Display */}
                    <div className="send-balance-card mb-lg">
                        <div className="send-balance-icon">
                            <TokenIcon
                                symbol={selectedToken?.symbol}
                                logoUrl={selectedToken?.logoUrl}
                                size={24}
                            />
                        </div>
                        <div className="send-balance-info">
                            <span className="text-secondary text-xs">Available Balance</span>
                            <span className="text-lg font-bold">
                                {isLoadingBalance ? '...' : formatAmount(tokenBalance)} {selectedToken?.symbol}
                            </span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Amount</label>
                        <div className="relative">
                            <input
                                type="number"
                                className="input input-lg"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.000001"
                                style={{ paddingRight: '80px' }}
                            />
                            <button
                                className="send-max-btn"
                                onClick={() => setAmount(Math.max(0, tokenBalance - fee).toFixed(6))}
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Recipient Address</label>
                        <input
                            type="text"
                            className={`input input-mono ${recipient && !isValidAddress(recipient) ? 'input-error' : ''}`}
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder="oct..."
                        />
                        {recipient && !isValidAddress(recipient) && (
                            <p className="form-error">Invalid Octra address</p>
                        )}
                    </div>

                    {/* Fee Selector */}
                    <div className="form-group">
                        <label className="form-label">
                            Network Fee {isLoadingFee && <span className="text-tertiary">(updating...)</span>}
                        </label>
                        <div className="fee-selector">
                            <button
                                className={`fee-option ${selectedFee === 'low' ? 'active' : ''}`}
                                onClick={() => setSelectedFee('low')}
                            >
                                <span className="fee-option-label">Slow</span>
                                <span className="fee-option-value">{formatAmount(feeEstimate.low)}</span>
                            </button>
                            <button
                                className={`fee-option ${selectedFee === 'medium' ? 'active' : ''}`}
                                onClick={() => setSelectedFee('medium')}
                            >
                                <span className="fee-option-label">Normal</span>
                                <span className="fee-option-value">{formatAmount(feeEstimate.medium)}</span>
                            </button>
                            <button
                                className={`fee-option ${selectedFee === 'high' ? 'active' : ''}`}
                                onClick={() => setSelectedFee('high')}
                            >
                                <span className="fee-option-label">Fast</span>
                                <span className="fee-option-value">{formatAmount(feeEstimate.high)}</span>
                            </button>
                        </div>
                    </div>

                    {parseFloat(amount) > 0 && (
                        <div className="card mb-lg">
                            <div className="confirm-row">
                                <span className="confirm-label">Amount</span>
                                <span className="confirm-value">{formatAmount(parseFloat(amount))} {selectedToken?.symbol}</span>
                            </div>
                            <div className="confirm-row">
                                <span className="confirm-label">Network Fee</span>
                                <span className="confirm-value">{formatAmount(fee)} {selectedToken?.symbol}</span>
                            </div>
                            <div className="confirm-row confirm-row-total">
                                <span className="confirm-label">Total</span>
                                <span className="confirm-value font-bold">{formatAmount(total)} {selectedToken?.symbol}</span>
                            </div>
                        </div>
                    )}

                    {error && <p className="text-error text-sm mb-lg">{error}</p>}

                    <button
                        className="btn btn-primary btn-lg btn-full"
                        onClick={handleSubmit}
                        disabled={!isValid}
                    >
                        Continue
                    </button>
                </>
            )}

            {/* Step 3: Confirm & Sign */}
            {step === 'confirm' && (
                <>
                    <div className="flex items-center gap-md mb-xl">
                        <button className="header-icon-btn" onClick={() => setStep('form')}>
                            <ChevronLeftIcon size={20} />
                        </button>
                        <h2 className="text-lg font-semibold">Confirm & Sign</h2>
                    </div>

                    <div className="text-center mb-xl">
                        <p className="text-secondary text-sm mb-sm">You're sending</p>
                        <p className="confirm-amount-large">{amount} {selectedToken?.symbol}</p>
                    </div>

                    <div className="confirm-card">
                        <div className="confirm-row">
                            <span className="confirm-label">From</span>
                            <span className="confirm-value text-mono text-sm">{truncateAddress(wallet.address, 8, 6)}</span>
                        </div>
                        <div className="confirm-row">
                            <span className="confirm-label">To</span>
                            <span className="confirm-value text-mono text-sm">{truncateAddress(recipient, 8, 6)}</span>
                        </div>
                        <div className="confirm-row">
                            <span className="confirm-label">Network Fee</span>
                            <span className="confirm-value">{fee} {selectedToken?.symbol}</span>
                        </div>
                        <div className="confirm-row confirm-row-total">
                            <span className="confirm-label">Total Amount</span>
                            <span className="confirm-value font-bold">{formatAmount(total)} {selectedToken?.symbol}</span>
                        </div>
                    </div>

                    <div className="sign-info mb-lg">
                        <p className="text-xs text-secondary text-center">
                            🔐 Transaction will be signed with your private key
                        </p>
                    </div>

                    <div className="flex gap-md">
                        <button className="btn btn-secondary btn-lg flex-1" onClick={() => setStep('form')}>
                            Back
                        </button>
                        <button className="btn btn-primary btn-lg flex-1" onClick={handleSend}>
                            Sign & Send
                        </button>
                    </div>
                </>
            )}

            {/* Sending State */}
            {step === 'sending' && (
                <div className="flex flex-col items-center justify-center py-3xl">
                    <div className="loading-spinner mb-xl" style={{ width: 48, height: 48 }} />
                    <p className="text-lg font-semibold">Signing & Sending</p>
                    <p className="text-secondary text-sm mt-sm">Please wait...</p>
                </div>
            )}

            {/* Success State */}
            {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-3xl text-center animate-fade-in">
                    <div className="success-checkmark mb-xl">
                        <CheckIcon size={32} />
                    </div>
                    <p className="text-xl font-bold mb-sm">Transaction Sent!</p>
                    <p className="text-secondary text-sm mb-xl">
                        Your transaction has been submitted to the network
                    </p>

                    <div className="card w-full mb-xl">
                        <p className="text-xs text-secondary mb-sm">Transaction Hash</p>
                        <p className="text-mono text-xs truncate">{txHash}</p>
                    </div>

                    <button className="btn btn-primary btn-lg btn-full" onClick={() => { handleReset(); onBack(); }}>
                        Done
                    </button>
                </div>
            )}

            {/* Error State */}
            {step === 'error' && (
                <div className="flex flex-col items-center justify-center py-3xl text-center animate-fade-in">
                    <div className="success-checkmark mb-xl" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
                        <CloseIcon size={32} />
                    </div>
                    <p className="text-xl font-bold mb-sm">Transaction Failed</p>
                    <p className="text-secondary text-sm mb-xl">{error}</p>

                    <div className="flex gap-md w-full">
                        <button className="btn btn-secondary btn-lg flex-1" onClick={() => { handleReset(); onBack(); }}>
                            Cancel
                        </button>
                        <button className="btn btn-primary btn-lg flex-1" onClick={() => setStep('form')}>
                            Try Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
