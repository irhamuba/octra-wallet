/**
 * Address Book Component
 * Manage saved addresses (max 3)
 */

import { useState, useEffect } from 'react';
import { getAddressBook, addAddress, removeAddress } from '../addressBookStorage';
import {
    ChevronLeftIcon,
    PlusIcon,
    CloseIcon,
    SendIcon,
    CheckIcon,
    WalletIcon
} from '../../../components/Icons';
import { truncateAddress, isValidAddress } from '../../../utils/crypto';

export function AddressBook({ onBack, onQuickSend }) {
    const [addresses, setAddresses] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAddress, setNewAddress] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setAddresses(getAddressBook());
    }, []);

    const handleAdd = () => {
        setError('');

        if (!newAddress.trim()) {
            setError('Address is required');
            return;
        }

        if (!isValidAddress(newAddress.trim())) {
            setError('Invalid address format');
            return;
        }

        if (!newLabel.trim()) {
            setError('Label is required');
            return;
        }

        const result = addAddress(newAddress.trim(), newLabel.trim());

        if (!result.success) {
            setError(result.error);
            return;
        }

        setAddresses(result.book);
        setNewAddress('');
        setNewLabel('');
        setShowAddForm(false);
    };

    const handleRemove = (address) => {
        const updated = removeAddress(address);
        setAddresses(updated);
    };

    const handleQuickSend = (address) => {
        if (onQuickSend) {
            onQuickSend(address);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-xl">
                <div className="flex items-center gap-md">
                    <button className="header-icon-btn" onClick={onBack}>
                        <ChevronLeftIcon size={20} />
                    </button>
                    <h2 className="text-lg font-semibold">Address Book</h2>
                </div>
                {addresses.length < 3 && !showAddForm && (
                    <button
                        className="btn btn-ghost btn-sm gap-sm"
                        onClick={() => setShowAddForm(true)}
                    >
                        <PlusIcon size={16} />
                        Add
                    </button>
                )}
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="card mb-lg animate-fade-in">
                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <input
                            type="text"
                            className="input input-mono"
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            placeholder="octra1..."
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Label</label>
                        <input
                            type="text"
                            className="input"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value.slice(0, 20))}
                            placeholder="e.g. My Exchange"
                            maxLength={20}
                        />
                        <p className="form-hint">{newLabel.length}/20</p>
                    </div>

                    {error && <p className="text-error text-sm mb-md">{error}</p>}

                    <div className="flex gap-md">
                        <button
                            className="btn btn-ghost flex-1"
                            onClick={() => {
                                setShowAddForm(false);
                                setNewAddress('');
                                setNewLabel('');
                                setError('');
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary flex-1"
                            onClick={handleAdd}
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}

            {/* Address List */}
            {addresses.length === 0 ? (
                <div className="tx-empty">
                    <div className="tx-empty-icon">
                        <WalletIcon size={24} />
                    </div>
                    <p>No saved addresses</p>
                    <p className="text-xs text-tertiary mt-sm">Save up to 3 addresses for quick access</p>
                </div>
            ) : (
                <div className="address-book-list">
                    {addresses.map((item) => (
                        <div key={item.address} className="address-book-item">
                            <div className="address-book-info">
                                <span className="address-book-label">{item.label}</span>
                                <span className="address-book-address">{truncateAddress(item.address, 8)}</span>
                            </div>
                            <div className="address-book-actions">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleQuickSend(item.address)}
                                    title="Quick Send"
                                >
                                    <SendIcon size={16} />
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleRemove(item.address)}
                                    title="Remove"
                                >
                                    <CloseIcon size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {addresses.length > 0 && addresses.length < 3 && (
                <p className="text-xs text-tertiary text-center mt-lg">
                    {3 - addresses.length} slot{3 - addresses.length > 1 ? 's' : ''} remaining
                </p>
            )}
        </div>
    );
}

export default AddressBook;
