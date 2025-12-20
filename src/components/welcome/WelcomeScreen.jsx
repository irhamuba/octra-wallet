/**
 * Welcome / Onboarding Screen
 * Flow: Welcome → Password → Seed Phrase → Verify 3 words
 */

import { useState } from 'react';
import {
    UbaLogo,
    PlusIcon,
    ImportIcon,
    ChevronRightIcon,
    KeyIcon,
    ChevronLeftIcon,
    CheckIcon,
    EyeIcon,
    EyeOffIcon,
    CopyIcon,
    LockIcon,
    AnimatedLockIcon,
    AlertIcon
} from '../shared/Icons';
import './WelcomeScreen.css';

export function WelcomeScreen({ onCreateWallet, onImportWallet }) {
    return (
        <div className="onboarding-container animate-fade-in">
            <div className="onboarding-header animate-slide-up">
                <div className="onboarding-logo">
                    <UbaLogo size={40} />
                </div>
            </div>

            <div className="onboarding-content">
                <button
                    className="onboarding-option animate-slide-up-delay-1"
                    onClick={onCreateWallet}
                >
                    <div className="onboarding-option-icon">
                        <PlusIcon size={24} />
                    </div>
                    <div className="onboarding-option-content">
                        <div className="onboarding-option-title">Create New Wallet</div>
                        <div className="onboarding-option-desc">
                            Generate a new wallet with secure recovery phrase
                        </div>
                    </div>
                    <ChevronRightIcon size={20} className="onboarding-option-arrow" />
                </button>

                <button
                    className="onboarding-option animate-slide-up-delay-2"
                    onClick={onImportWallet}
                >
                    <div className="onboarding-option-icon">
                        <ImportIcon size={24} />
                    </div>
                    <div className="onboarding-option-content">
                        <div className="onboarding-option-title">Import Wallet</div>
                        <div className="onboarding-option-desc">
                            Restore wallet using recovery phrase or private key
                        </div>
                    </div>
                    <ChevronRightIcon size={20} className="onboarding-option-arrow" />
                </button>
            </div>

            <div className="text-center mt-xl animate-fade-in-delay">
                <p className="text-xs text-tertiary">Support Octra Network</p>
            </div>
        </div>
    );
}

export function CreateWalletScreen({ onBack, onComplete }) {
    const [step, setStep] = useState(1);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const [wallet, setWallet] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showMnemonic, setShowMnemonic] = useState(false);
    const [copied, setCopied] = useState(false);

    // Verification state
    const [verifyPositions, setVerifyPositions] = useState([]);
    const [selectedWords, setSelectedWords] = useState({});
    const [shuffledOptions, setShuffledOptions] = useState([]);
    const [verificationError, setVerificationError] = useState('');

    const passwordStrength = getPasswordStrength(password);

    const handleSetPassword = async () => {
        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        setStep(2);
        setIsLoading(true);

        try {
            const { generateWallet } = await import('../../utils/crypto');
            const newWallet = await generateWallet();
            setWallet(newWallet);

            const positions = getRandomPositions(3, 12);
            setVerifyPositions(positions);
            setShuffledOptions(shuffleArray([...newWallet.mnemonic]));

            setStep(3);
        } catch (error) {
            console.error('Failed to generate wallet:', error);
            setPasswordError('Failed to generate wallet: ' + error.message);
            setStep(1);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyMnemonic = async () => {
        if (!wallet?.mnemonic) return;
        try {
            await navigator.clipboard.writeText(wallet.mnemonic.join(' '));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            console.error('Failed to copy');
        }
    };

    const handleProceedToVerify = () => {
        setStep(4);
    };

    // Get next empty position
    const getNextEmptyPosition = () => {
        for (const pos of verifyPositions) {
            if (!selectedWords[pos]) return pos;
        }
        return null;
    };

    // Click a word - auto fill next empty position
    const handleWordClick = (word) => {
        const isUsed = Object.values(selectedWords).includes(word);
        if (isUsed) return;

        const nextPos = getNextEmptyPosition();
        if (nextPos) {
            setSelectedWords(prev => ({ ...prev, [nextPos]: word }));
            setVerificationError('');
        }
    };

    // Remove last filled word
    const handleRemoveLast = () => {
        const filledPositions = verifyPositions.filter(pos => selectedWords[pos]);
        if (filledPositions.length === 0) return;

        const lastFilled = filledPositions[filledPositions.length - 1];
        setSelectedWords(prev => {
            const newState = { ...prev };
            delete newState[lastFilled];
            return newState;
        });
        setVerificationError('');
    };

    const handleVerify = () => {
        for (const pos of verifyPositions) {
            if (selectedWords[pos] !== wallet.mnemonic[pos - 1]) {
                setVerificationError(`Word #${pos} is incorrect. Please try again.`);
                return;
            }
        }
        onComplete(wallet, password);
    };

    const isVerifyComplete = verifyPositions.every(pos => selectedWords[pos]);
    const nextEmptyPos = getNextEmptyPosition();

    return (
        <div className="onboarding-container animate-fade-in">
            {/* Step 1: Set Password */}
            {step === 1 && (
                <>
                    <div className="flex items-center gap-md mb-xl">
                        <button className="header-icon-btn" onClick={onBack}>
                            <ChevronLeftIcon size={20} />
                        </button>
                        <h2 className="text-lg font-semibold">Create Password</h2>
                        <span className="text-xs text-secondary ml-auto">Step 1 of 3</span>
                    </div>

                    <div className="text-center mb-xl">
                        <div className="animated-icon-container">
                            <AnimatedLockIcon
                                size={56}
                                isLocked={password.length >= 8 && password === confirmPassword}
                            />
                        </div>
                        <p className="text-secondary text-sm">
                            {password.length >= 8 && password === confirmPassword
                                ? '✓ Password secured!'
                                : 'Create a strong password to protect your wallet.'
                            }
                        </p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-with-icon">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input input-lg"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                                placeholder="Enter password (min 8 chars)"
                                autoFocus
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
                            onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                            placeholder="Confirm your password"
                        />
                    </div>

                    {passwordError && <p className="text-error text-sm mb-lg">{passwordError}</p>}

                    <button
                        className="btn btn-primary btn-lg btn-full"
                        onClick={handleSetPassword}
                        disabled={password.length < 8 || password !== confirmPassword}
                    >
                        Continue
                    </button>
                </>
            )}

            {/* Step 2: Generating */}
            {step === 2 && (
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="loading-spinner-large" />
                    <p className="text-secondary mt-lg">Generating your wallet...</p>
                </div>
            )}

            {/* Step 3: Show Recovery Phrase */}
            {step === 3 && wallet && (
                <>
                    <div className="flex items-center gap-md mb-xl">
                        <button className="header-icon-btn" onClick={() => setStep(1)}>
                            <ChevronLeftIcon size={20} />
                        </button>
                        <h2 className="text-lg font-semibold">Recovery Phrase</h2>
                        <span className="text-xs text-secondary ml-auto">Step 2 of 3</span>
                    </div>

                    <p className="text-secondary text-sm mb-md">
                        Write down these 12 words in order. This is the only way to recover your wallet.
                    </p>

                    {/* Toggle checkbox for reveal */}
                    <div className="reveal-toggle mb-lg" onClick={() => setShowMnemonic(!showMnemonic)}>
                        <div className={`reveal-checkbox ${showMnemonic ? 'checked' : ''}`}>
                            {showMnemonic && <CheckIcon size={12} />}
                        </div>
                        <span className="text-sm">Show recovery phrase</span>
                    </div>

                    {/* Mnemonic grid */}
                    <div
                        className="mnemonic-grid mb-lg"
                        style={{
                            filter: showMnemonic ? 'none' : 'blur(6px)',
                            userSelect: showMnemonic ? 'text' : 'none'
                        }}
                    >
                        {wallet.mnemonic.map((word, index) => (
                            <div key={index} className="mnemonic-word">
                                <span className="mnemonic-word-num">{index + 1}</span>
                                <span className="mnemonic-word-text">{word}</span>
                            </div>
                        ))}
                    </div>

                    <button className="btn btn-secondary btn-full mb-lg gap-sm" onClick={handleCopyMnemonic}>
                        {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>

                    <div className="card mb-lg flex items-center gap-md" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning)' }}>
                        <AlertIcon size={24} className="text-warning" style={{ flexShrink: 0 }} />
                        <p className="text-sm text-warning">
                            Never share your recovery phrase. Store it securely offline.
                        </p>
                    </div>

                    <button className="btn btn-primary btn-lg btn-full" onClick={handleProceedToVerify}>
                        I've Saved It, Continue
                    </button>
                </>
            )}

            {/* Step 4: Verify 3 Words - Single Word Pool */}
            {step === 4 && wallet && (
                <>
                    <div className="flex items-center gap-md mb-xl">
                        <button className="header-icon-btn" onClick={() => setStep(3)}>
                            <ChevronLeftIcon size={20} />
                        </button>
                        <h2 className="text-lg font-semibold">Verify Phrase</h2>
                        <span className="text-xs text-secondary ml-auto">Step 3 of 3</span>
                    </div>

                    <p className="text-secondary text-sm mb-md">
                        Tap the correct words to fill the blanks in order.
                    </p>

                    <p className="text-accent text-sm mb-lg font-medium flex items-center gap-xs">
                        {nextEmptyPos
                            ? `→ Filling word #${nextEmptyPos}`
                            : <><CheckIcon size={14} /> All words selected</>}
                    </p>

                    {/* Phrase grid with blanks */}
                    <div className="verify-phrase-grid mb-lg">
                        {wallet.mnemonic.map((word, index) => {
                            const position = index + 1;
                            const isBlank = verifyPositions.includes(position);
                            const selectedWord = selectedWords[position];
                            const isNextToFill = position === nextEmptyPos;

                            return (
                                <div
                                    key={index}
                                    className={`verify-phrase-word ${isBlank ? 'blank' : ''} ${selectedWord ? 'filled' : ''} ${isNextToFill ? 'active' : ''}`}
                                >
                                    <span className="verify-phrase-num">{position}</span>
                                    <span className="verify-phrase-text">
                                        {isBlank ? (selectedWord || '?') : word}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {verificationError && (
                        <p className="text-error text-sm mb-md">{verificationError}</p>
                    )}

                    {/* Remove Last button - always visible to prevent layout jump */}
                    <button
                        className="btn btn-ghost btn-sm mb-lg"
                        onClick={handleRemoveLast}
                        disabled={Object.keys(selectedWords).length === 0}
                        style={{ opacity: Object.keys(selectedWords).length === 0 ? 0.4 : 1 }}
                    >
                        ← Remove Last
                    </button>

                    {/* Single word pool */}
                    <div className="verify-word-pool mb-xl">
                        {shuffledOptions.map((word, idx) => {
                            const isUsed = Object.values(selectedWords).includes(word);
                            return (
                                <button
                                    key={idx}
                                    className={`verify-word-btn ${isUsed ? 'used' : ''}`}
                                    onClick={() => handleWordClick(word)}
                                    disabled={isUsed || !nextEmptyPos}
                                >
                                    {word}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        className="btn btn-primary btn-lg btn-full"
                        onClick={handleVerify}
                        disabled={!isVerifyComplete}
                    >
                        Complete Setup
                    </button>
                </>
            )}
        </div>
    );
}

export function ImportWalletScreen({ onBack, onComplete }) {
    const [step, setStep] = useState(1);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const [importType, setImportType] = useState(null);
    const [mnemonic, setMnemonic] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const passwordStrength = getPasswordStrength(password);

    const handleSetPassword = () => {
        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }
        setStep(2);
    };

    const handleImport = async () => {
        setIsLoading(true);
        setError('');

        try {
            let wallet;
            const { importFromMnemonic, importFromPrivateKey } = await import('../../utils/crypto');

            if (importType === 'mnemonic') {
                wallet = await importFromMnemonic(mnemonic.trim());
            } else {
                wallet = await importFromPrivateKey(privateKey.trim());
            }

            onComplete(wallet, password);
        } catch (err) {
            setError(err.message || 'Failed to import wallet');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="onboarding-container animate-fade-in">
            {/* Step 1: Set Password */}
            {step === 1 && (
                <>
                    <div className="flex items-center gap-md mb-xl">
                        <button className="header-icon-btn" onClick={onBack}>
                            <ChevronLeftIcon size={20} />
                        </button>
                        <h2 className="text-lg font-semibold">Create Password</h2>
                    </div>

                    <div className="text-center mb-xl">
                        <div className="animated-icon-container">
                            <AnimatedLockIcon
                                size={56}
                                isLocked={password.length >= 8 && password === confirmPassword}
                            />
                        </div>
                        <p className="text-secondary text-sm">
                            {password.length >= 8 && password === confirmPassword
                                ? '✓ Password secured!'
                                : 'Create a password to protect your imported wallet.'
                            }
                        </p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-with-icon">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input input-lg"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                                placeholder="Enter password (min 8 chars)"
                                autoFocus
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
                            onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                            placeholder="Confirm your password"
                        />
                    </div>

                    {passwordError && <p className="text-error text-sm mb-lg">{passwordError}</p>}

                    <button
                        className="btn btn-primary btn-lg btn-full"
                        onClick={handleSetPassword}
                        disabled={password.length < 8 || password !== confirmPassword}
                    >
                        Continue
                    </button>
                </>
            )}

            {/* Step 2: Choose Import Method */}
            {step === 2 && !importType && (
                <>
                    <div className="flex items-center gap-md mb-xl">
                        <button className="header-icon-btn" onClick={() => setStep(1)}>
                            <ChevronLeftIcon size={20} />
                        </button>
                        <h2 className="text-lg font-semibold">Import Wallet</h2>
                    </div>

                    <p className="text-secondary text-sm mb-xl">
                        Choose how you want to import your wallet
                    </p>

                    <div className="flex flex-col gap-md">
                        <button className="onboarding-option" onClick={() => setImportType('mnemonic')}>
                            <div className="onboarding-option-icon">
                                <ImportIcon size={24} />
                            </div>
                            <div className="onboarding-option-content">
                                <div className="onboarding-option-title">Recovery Phrase</div>
                                <div className="onboarding-option-desc">Import using 12-word mnemonic phrase</div>
                            </div>
                            <ChevronRightIcon size={20} className="onboarding-option-arrow" />
                        </button>

                        <button className="onboarding-option" onClick={() => setImportType('privateKey')}>
                            <div className="onboarding-option-icon">
                                <KeyIcon size={24} />
                            </div>
                            <div className="onboarding-option-content">
                                <div className="onboarding-option-title">Private Key</div>
                                <div className="onboarding-option-desc">Import using base64 encoded private key</div>
                            </div>
                            <ChevronRightIcon size={20} className="onboarding-option-arrow" />
                        </button>
                    </div>
                </>
            )}

            {/* Step 2: Enter Phrase or Key */}
            {step === 2 && importType && (
                <>
                    <div className="flex items-center gap-md mb-xl">
                        <button className="header-icon-btn" onClick={() => setImportType(null)}>
                            <ChevronLeftIcon size={20} />
                        </button>
                        <h2 className="text-lg font-semibold">
                            {importType === 'mnemonic' ? 'Recovery Phrase' : 'Private Key'}
                        </h2>
                    </div>

                    <div className="flex-1">
                        {importType === 'mnemonic' ? (
                            <div className="form-group">
                                <label className="form-label">Enter your 12-word recovery phrase</label>
                                <textarea
                                    className="input input-lg"
                                    value={mnemonic}
                                    onChange={(e) => setMnemonic(e.target.value)}
                                    placeholder="word1 word2 word3..."
                                    rows={4}
                                    style={{ resize: 'none', fontFamily: 'var(--font-mono)' }}
                                />
                                <p className="form-hint">Separate each word with a space</p>
                            </div>
                        ) : (
                            <div className="form-group">
                                <label className="form-label">Enter your private key (Base64)</label>
                                <div className="input-with-icon">
                                    <input
                                        type={showKey ? 'text' : 'password'}
                                        className="input input-lg input-mono"
                                        value={privateKey}
                                        onChange={(e) => setPrivateKey(e.target.value)}
                                        placeholder="Enter base64 private key"
                                    />
                                    <button
                                        type="button"
                                        className="input-icon-btn"
                                        onClick={() => setShowKey(!showKey)}
                                        tabIndex={-1}
                                    >
                                        {showKey ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && <div className="text-error text-sm mb-lg">{error}</div>}
                    </div>

                    <button
                        className="btn btn-primary btn-lg btn-full"
                        onClick={handleImport}
                        disabled={isLoading || (importType === 'mnemonic' ? !mnemonic.trim() : !privateKey.trim())}
                    >
                        {isLoading ? <span className="loading-spinner" /> : 'Import Wallet'}
                    </button>
                </>
            )}
        </div>
    );
}

// Helper functions
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getRandomPositions(count, max) {
    const positions = new Set();
    while (positions.size < count) {
        positions.add(Math.floor(Math.random() * max) + 1);
    }
    return Array.from(positions).sort((a, b) => a - b);
}

function getPasswordStrength(password) {
    if (!password) return { level: 'none', label: '', percent: 0 };

    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 2) return { level: 'weak', label: 'Weak', percent: 25 };
    if (score <= 4) return { level: 'fair', label: 'Fair', percent: 50 };
    if (score <= 5) return { level: 'good', label: 'Good', percent: 75 };
    return { level: 'strong', label: 'Strong', percent: 100 };
}

export default WelcomeScreen;
