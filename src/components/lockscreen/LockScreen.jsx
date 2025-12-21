/**
 * Lock Screen Component
 * Password unlock screen for accessing the wallet
 */

import { useState } from 'react';
import { UbaLogo, EyeIcon, EyeOffIcon, LockIcon, KeyIcon, ImportIcon, ChevronLeftIcon } from '../shared/Icons';
import { securityService } from '../../services/SecurityService';
import './LockScreen.css';

export function LockScreen({ onUnlock, onRecover }) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Forgot password state
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [recoveryMethod, setRecoveryMethod] = useState(null); // 'phrase' | 'key'
    const [recoveryInput, setRecoveryInput] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [recoveryError, setRecoveryError] = useState('');
    const [isRecovering, setIsRecovering] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if locked out
        if (securityService.isLocked()) {
            const remainingTime = securityService.getRemainingLockoutTime();
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            setError(`Too many failed attempts. Try again in ${minutes}:${seconds.toString().padStart(2, '0')}`);
            return;
        }

        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onUnlock(password);
            // Success - reset attempts
            securityService.recordPasswordAttempt(true);
        } catch (err) {
            // Failed - record attempt
            const result = securityService.recordPasswordAttempt(false);

            if (result.locked) {
                setError(result.message);
            } else if (result.message) {
                setError(result.message);
            } else {
                setError(err.message || 'Invalid password');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecovery = async (e) => {
        e.preventDefault();

        if (!recoveryInput.trim()) {
            setRecoveryError(`Please enter your ${recoveryMethod === 'phrase' ? 'recovery phrase' : 'private key'}`);
            return;
        }

        if (newPassword.length < 8) {
            setRecoveryError('Password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setRecoveryError('Passwords do not match');
            return;
        }

        setIsRecovering(true);
        setRecoveryError('');

        try {
            if (onRecover) {
                await onRecover({
                    type: recoveryMethod === 'phrase' ? 'mnemonic' : 'privateKey',
                    value: recoveryInput.trim(),
                    newPassword: newPassword
                });
            }
        } catch (err) {
            setRecoveryError(err.message || 'Recovery failed. Please check your input.');
        } finally {
            setIsRecovering(false);
        }
    };

    const resetForgotPassword = () => {
        setShowForgotPassword(false);
        setRecoveryMethod(null);
        setRecoveryInput('');
        setNewPassword('');
        setConfirmNewPassword('');
        setRecoveryError('');
    };

    const handleCreateNewWallet = () => {
        // Show confirmation
        if (window.confirm('⚠️ WARNING: This will DELETE your current wallet permanently!\n\nAll funds will be lost if you haven\'t backed up your recovery phrase.\n\nAre you sure you want to continue?')) {
            if (window.confirm('This action CANNOT be undone. Are you absolutely sure?')) {
                // Clear all wallet data and redirect to welcome
                localStorage.clear();
                window.location.reload();
            }
        }
    };

    // Forgot Password - Select Recovery Method
    if (showForgotPassword && !recoveryMethod) {
        return (
            <div className="lock-screen animate-fade-in">
                <div className="lock-screen-content">
                    <button className="forgot-back-btn" onClick={resetForgotPassword}>
                        <ChevronLeftIcon size={20} />
                        <span>Back</span>
                    </button>

                    <div className="lock-icon-container">
                        <LockIcon size={32} />
                    </div>

                    <h2 className="lock-title" style={{ marginBottom: 8 }}>Recover Wallet</h2>
                    <p className="lock-subtitle">Choose how to recover your wallet</p>

                    <div className="recovery-options">
                        <button
                            className="recovery-option"
                            onClick={() => setRecoveryMethod('phrase')}
                        >
                            <ImportIcon size={20} />
                            <div className="recovery-option-text">
                                <span className="recovery-option-title">Recovery Phrase</span>
                                <span className="recovery-option-desc">Use your 12-word phrase</span>
                            </div>
                        </button>
                        <button
                            className="recovery-option"
                            onClick={() => setRecoveryMethod('key')}
                        >
                            <KeyIcon size={20} />
                            <div className="recovery-option-text">
                                <span className="recovery-option-title">Private Key</span>
                                <span className="recovery-option-desc">Use your private key</span>
                            </div>
                        </button>
                    </div>

                    {/* Create New Wallet - Danger Option */}
                    <div className="recovery-divider">
                        <span>or</span>
                    </div>

                    <button
                        className="recovery-option recovery-option-danger"
                        onClick={handleCreateNewWallet}
                    >
                        <div className="recovery-option-text">
                            <span className="recovery-option-title">Create New Wallet</span>
                            <span className="recovery-option-desc recovery-option-danger-desc">
                                ⚠️ Deletes current wallet permanently
                            </span>
                        </div>
                    </button>
                </div>
                <p className="lock-network-badge">Support Octra Network</p>
            </div>
        );
    }

    // Forgot Password - Enter Recovery Data
    if (showForgotPassword && recoveryMethod) {
        return (
            <div className="lock-screen animate-fade-in">
                <div className="lock-screen-content">
                    <button className="forgot-back-btn" onClick={() => setRecoveryMethod(null)}>
                        <ChevronLeftIcon size={20} />
                        <span>Back</span>
                    </button>

                    <h2 className="lock-title" style={{ marginBottom: 8 }}>
                        {recoveryMethod === 'phrase' ? 'Enter Recovery Phrase' : 'Enter Private Key'}
                    </h2>
                    <p className="lock-subtitle">Enter your credentials and create a new password</p>

                    <form onSubmit={handleRecovery} className="lock-form">
                        <div className="form-group">
                            <textarea
                                className="input recovery-textarea"
                                value={recoveryInput}
                                onChange={(e) => {
                                    setRecoveryInput(e.target.value);
                                    setRecoveryError('');
                                }}
                                placeholder={recoveryMethod === 'phrase' ? 'word1 word2 word3 ...' : 'Paste your private key'}
                                rows={3}
                                disabled={isRecovering}
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                className="input"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    setRecoveryError('');
                                }}
                                placeholder="New password (min 8 chars)"
                                disabled={isRecovering}
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                className="input"
                                value={confirmNewPassword}
                                onChange={(e) => {
                                    setConfirmNewPassword(e.target.value);
                                    setRecoveryError('');
                                }}
                                placeholder="Confirm new password"
                                disabled={isRecovering}
                            />
                        </div>

                        {recoveryError && <p className="form-error">{recoveryError}</p>}

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg btn-full"
                            disabled={isRecovering || !recoveryInput.trim() || newPassword.length < 8 || newPassword !== confirmNewPassword}
                        >
                            {isRecovering ? <span className="loading-spinner" /> : 'Recover Wallet'}
                        </button>
                    </form>
                </div>
                <p className="lock-network-badge">Support Octra Network</p>
            </div>
        );
    }

    // Normal Lock Screen
    return (
        <div className="lock-screen animate-fade-in">
            <div className="lock-screen-content">
                <div className="lock-icon-container">
                    <LockIcon size={32} />
                </div>

                <div className="lock-branding">
                    <UbaLogo size={32} />
                    <h1 className="lock-title">Uba Wallet</h1>
                </div>

                <p className="lock-subtitle">Enter your password to unlock</p>

                <form onSubmit={handleSubmit} className="lock-form">
                    <div className="form-group">
                        <div className="input-with-icon">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={`input input-lg ${error ? 'input-error' : ''}`}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                placeholder="Enter password"
                                autoFocus
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="input-icon-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                            </button>
                        </div>
                        {error && <p className="form-error">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg btn-full"
                        disabled={isLoading || !password.trim()}
                    >
                        {isLoading ? <span className="loading-spinner" /> : 'Unlock'}
                    </button>

                    <button
                        type="button"
                        className="forgot-password-btn"
                        onClick={() => setShowForgotPassword(true)}
                    >
                        Forgot password?
                    </button>
                </form>
            </div>

            {/* Network Badge at Bottom */}
            <p className="lock-network-badge">Support Octra Network</p>
        </div>
    );
}

export function SetupPassword({ onComplete, isNewWallet = true }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const passwordStrength = getPasswordStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onComplete(password);
        } catch (err) {
            setError(err.message || 'Failed to set password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="setup-password animate-fade-in">
            <div className="setup-password-header">
                <div className="setup-icon-container">
                    <LockIcon size={28} />
                </div>
                <h2 className="setup-title">
                    {isNewWallet ? 'Secure Your Wallet' : 'Set Password'}
                </h2>
                <p className="setup-subtitle">
                    Create a strong password to protect your wallet. You'll need this to unlock your wallet and export your keys.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="setup-form">
                <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="input-with-icon">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className="input input-lg"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            placeholder="Enter password (min 8 chars)"
                            autoFocus
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="input-icon-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                        </button>
                    </div>

                    {/* Password strength indicator */}
                    {password && (
                        <div className="password-strength">
                            <div className="password-strength-bar">
                                <div
                                    className={`password-strength-fill strength-${passwordStrength.level}`}
                                    style={{ width: `${passwordStrength.percent}%` }}
                                />
                            </div>
                            <span className={`password-strength-text strength-${passwordStrength.level}`}>
                                {passwordStrength.label}
                            </span>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        className={`input input-lg ${confirmPassword && password !== confirmPassword ? 'input-error' : ''}`}
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setError('');
                        }}
                        placeholder="Confirm your password"
                        disabled={isLoading}
                    />
                    {confirmPassword && password !== confirmPassword && (
                        <p className="form-error">Passwords do not match</p>
                    )}
                </div>

                {error && <p className="text-error text-sm mb-lg">{error}</p>}

                <div className="card mb-xl" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning)' }}>
                    <p className="text-sm" style={{ color: 'var(--warning)' }}>
                        ⚠️ <strong>Important:</strong> If you forget your password, you can only recover your wallet using your recovery phrase. Make sure to save it securely.
                    </p>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-lg btn-full"
                    disabled={isLoading || password.length < 8 || password !== confirmPassword}
                >
                    {isLoading ? <span className="loading-spinner" /> : 'Continue'}
                </button>
            </form>
        </div>
    );
}

// Helper function to assess password strength
function getPasswordStrength(password) {
    if (!password) return { level: 'none', label: '', percent: 0 };

    let score = 0;

    // Length
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character types
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 2) return { level: 'weak', label: 'Weak', percent: 25 };
    if (score <= 4) return { level: 'fair', label: 'Fair', percent: 50 };
    if (score <= 5) return { level: 'good', label: 'Good', percent: 75 };
    return { level: 'strong', label: 'Strong', percent: 100 };
}

export default LockScreen;
