/**
 * Common validation utilities for Octra Wallet
 */

/**
 * Calculates the strength of a password
 * @param {string} password - The password to check
 * @returns {Object} - { level: string, label: string, percent: number }
 */
export function getPasswordStrength(password) {
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

/**
 * Validates a wallet name
 * @param {string} name - The name to check
 * @returns {string|null} - Error message or null if valid
 */
export function validateWalletName(name) {
    if (!name || !name.trim()) return 'Name cannot be empty';
    if (name.length > 20) return 'Name is too long (max 20 chars)';
    return null;
}
