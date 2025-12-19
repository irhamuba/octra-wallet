/**
 * Token Icon Component
 * Displays token image from URL or fallback to placeholder
 */

import { useState } from 'react';
import { OctraLogo, OctraTokenLogo } from './Icons';
import './TokenIcon.css';

// Token metadata cache - in production this would come from an API or explorer
const KNOWN_TOKENS = {
    'OCT': {
        name: 'Octra',
        symbol: 'OCT',
        decimals: 6,
        isNative: true,
        // Native token uses built-in logo
        logoType: 'native'
    }
};

/**
 * TokenIcon - Displays token image with fallback
 * @param {string} symbol - Token symbol
 * @param {string} logoUrl - Optional URL to token logo
 * @param {number} size - Icon size in pixels
 * @param {string} color - Accent color for the icon
 */
export function TokenIcon({ symbol, logoUrl, size = 40, color = '#00D4FF' }) {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(!!logoUrl);

    // Check if it's a known native token
    const tokenInfo = KNOWN_TOKENS[symbol];
    const isNative = tokenInfo?.logoType === 'native';

    // If native OCT token, use Octra icon from public folder
    if (isNative && symbol === 'OCT') {
        return (
            <div
                className="token-icon token-icon-native"
                style={{
                    width: size,
                    height: size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}
            >
                <img
                    src="/octra-icon.svg"
                    alt="OCT"
                    width={size}
                    height={size}
                    style={{
                        display: 'block',
                        imageRendering: 'auto',
                        WebkitUserSelect: 'none',
                        userSelect: 'none'
                    }}
                />
            </div>
        );
    }

    // If logo URL exists and no error, try to load image
    if (logoUrl && !imageError) {
        return (
            <div
                className="token-icon"
                style={{
                    width: size,
                    height: size,
                    background: isLoading ? 'var(--bg-elevated)' : 'transparent'
                }}
            >
                <img
                    src={logoUrl}
                    alt={symbol}
                    width={size}
                    height={size}
                    onError={() => {
                        setImageError(true);
                        setIsLoading(false);
                    }}
                    onLoad={() => setIsLoading(false)}
                    style={{
                        borderRadius: '50%',
                        opacity: isLoading ? 0 : 1,
                        transition: 'opacity 0.2s'
                    }}
                />
                {isLoading && (
                    <div
                        className="skeleton"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%'
                        }}
                    />
                )}
            </div>
        );
    }

    // Fallback: Unknown token - show ? placeholder
    return (
        <div
            className="token-icon token-icon-unknown"
            style={{
                width: size,
                height: size,
                background: 'var(--bg-elevated)',
                color: 'var(--text-tertiary)'
            }}
        >
            <span style={{ fontSize: size * 0.4, fontWeight: 700 }}>?</span>
        </div>
    );
}

/**
 * Get token info from symbol
 * In production, this would fetch from an API/explorer
 */
export function getTokenInfo(symbol) {
    return KNOWN_TOKENS[symbol] || null;
}

/**
 * Format token amount based on decimals
 */
export function formatTokenAmount(amount, decimals = 6, displayDecimals = 4) {
    if (!amount || isNaN(amount)) return '0';

    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';

    return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: displayDecimals
    });
}

export default TokenIcon;
