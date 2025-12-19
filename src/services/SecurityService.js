/**
 * Security Service
 * Handles password rate limiting to prevent brute force attacks
 */

const MAX_PASSWORD_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

class SecurityService {
    constructor() {
        this.passwordAttempts = 0;
        this.lockoutUntil = null;
    }

    // Password rate limiting
    isLocked() {
        if (!this.lockoutUntil) return false;

        if (Date.now() < this.lockoutUntil) {
            return true;
        }

        // Lockout expired, reset
        this.lockoutUntil = null;
        this.passwordAttempts = 0;
        return false;
    }

    getRemainingLockoutTime() {
        if (!this.lockoutUntil) return 0;
        const remaining = this.lockoutUntil - Date.now();
        return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
    }

    recordPasswordAttempt(success) {
        if (success) {
            this.passwordAttempts = 0;
            this.lockoutUntil = null;
            return { allowed: true, success: true };
        }

        this.passwordAttempts++;

        if (this.passwordAttempts >= MAX_PASSWORD_ATTEMPTS) {
            this.lockoutUntil = Date.now() + LOCKOUT_DURATION;
            return {
                allowed: false,
                locked: true,
                remainingTime: this.getRemainingLockoutTime(),
                message: `Too many failed attempts. Try again in ${Math.ceil(LOCKOUT_DURATION / 60000)} minutes.`
            };
        }

        return {
            allowed: true,
            success: false,
            attemptsRemaining: MAX_PASSWORD_ATTEMPTS - this.passwordAttempts,
            message: `Invalid password. ${MAX_PASSWORD_ATTEMPTS - this.passwordAttempts} attempts remaining.`
        };
    }

    reset() {
        this.passwordAttempts = 0;
        this.lockoutUntil = null;
    }
}

export const securityService = new SecurityService();
