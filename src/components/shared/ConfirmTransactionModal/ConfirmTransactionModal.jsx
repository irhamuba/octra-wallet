import { formatAmount } from '../../../utils/crypto';
import { CloseIcon, AlertIcon, SendIcon } from '../Icons';
import './ConfirmTransactionModal.css';

export function ConfirmTransactionModal({
    isOpen,
    onClose,
    onConfirm,
    recipient,
    amount,
    fee,
    tokenSymbol = 'OCT',
    isLoading = false
}) {
    if (!isOpen) return null;

    const total = parseFloat(amount) + parseFloat(fee);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal confirm-tx-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Confirm Transaction</h3>
                    <button className="modal-close" onClick={onClose}>
                        <CloseIcon size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Warning */}
                    <div className="confirm-warning">
                        <AlertIcon size={20} />
                        <p>Please verify the details before confirming. This action cannot be undone.</p>
                    </div>

                    {/* Transaction Details */}
                    <div className="confirm-details">
                        <div className="confirm-detail-row">
                            <span className="confirm-label">To</span>
                            <span className="confirm-value confirm-address">{recipient}</span>
                        </div>
                        <div className="confirm-detail-row">
                            <span className="confirm-label">Amount</span>
                            <span className="confirm-value confirm-amount">
                                {formatAmount(amount)} {tokenSymbol}
                            </span>
                        </div>
                        <div className="confirm-detail-row">
                            <span className="confirm-label">Network Fee</span>
                            <span className="confirm-value">
                                {formatAmount(fee)} {tokenSymbol}
                            </span>
                        </div>
                        <div className="confirm-divider"></div>
                        <div className="confirm-detail-row confirm-total">
                            <span className="confirm-label">Total</span>
                            <span className="confirm-value">
                                {formatAmount(total)} {tokenSymbol}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        className="btn btn-secondary btn-full"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary btn-full"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading-spinner" style={{ width: 16, height: 16 }} />
                                Sending...
                            </>
                        ) : (
                            <>
                                <SendIcon size={18} />
                                Confirm Send
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
