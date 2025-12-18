/**
 * Lock Screen Component
 * Password unlock screen for accessing the wallet
 */

import { useState } from 'react';
import { OctraLogo, EyeIcon, EyeOffIcon, LockIcon } from './Icons';

export function LockScreen({ onUnlock }) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onUnlock(password);
        } catch (err) {
            setError(err.message || 'Invalid password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="lock-screen animate-fade-in">
            <div className="lock-screen-content">
                <div className="lock-icon-container">
                    <LockIcon size={32} />
                </div>

                <div className="lock-branding">
                    <OctraLogo size={32} />
                    <h1 className="lock-title">Octra Wallet</h1>
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
                </form>
            </div>
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
