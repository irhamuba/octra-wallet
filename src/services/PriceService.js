/**
 * Price Service - Fetches token prices from CoinGecko API
 */

const COINGECKO_API_URL = import.meta.env.VITE_COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;

// Cache for price data (5 min TTL)
const priceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Token ID mapping for CoinGecko
// Add mappings for tokens when they get listed on CoinGecko
const TOKEN_ID_MAP = {
    'OCT': null,  // Octra not listed yet
    'ETH': 'ethereum',
    'BTC': 'bitcoin',
    'USDT': 'tether',
    'USDC': 'usd-coin',
};

/**
 * Get price data for a token
 * @param {string} symbol - Token symbol (e.g., 'OCT', 'ETH')
 * @returns {Promise<{price: number, change24h: number, marketCap: number} | null>}
 */
export async function getTokenPrice(symbol) {
    const coinId = TOKEN_ID_MAP[symbol.toUpperCase()];

    // Token not mapped to CoinGecko
    if (!coinId) {
        return null;
    }

    // Check cache
    const cacheKey = `price_${coinId}`;
    const cached = priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const headers = {};
        if (COINGECKO_API_KEY) {
            headers['x-cg-demo-api-key'] = COINGECKO_API_KEY;
        }

        const response = await fetch(
            `${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
            { headers }
        );

        if (!response.ok) {
            console.warn(`CoinGecko API error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const tokenData = data[coinId];

        if (!tokenData) {
            return null;
        }

        const priceData = {
            price: tokenData.usd || 0,
            change24h: tokenData.usd_24h_change || 0,
            marketCap: tokenData.usd_market_cap || 0,
        };

        // Cache the result
        priceCache.set(cacheKey, {
            data: priceData,
            timestamp: Date.now()
        });

        return priceData;
    } catch (error) {
        console.error('Failed to fetch price:', error);
        return null;
    }
}

/**
 * Get prices for multiple tokens at once
 * @param {string[]} symbols - Array of token symbols
 * @returns {Promise<Map<string, {price: number, change24h: number}>>}
 */
export async function getMultipleTokenPrices(symbols) {
    const results = new Map();

    // Filter to only tokens with CoinGecko mapping
    const coinIds = symbols
        .map(s => ({ symbol: s, coinId: TOKEN_ID_MAP[s.toUpperCase()] }))
        .filter(item => item.coinId);

    if (coinIds.length === 0) {
        return results;
    }

    try {
        const headers = {};
        if (COINGECKO_API_KEY) {
            headers['x-cg-demo-api-key'] = COINGECKO_API_KEY;
        }

        const ids = coinIds.map(c => c.coinId).join(',');
        const response = await fetch(
            `${COINGECKO_API_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
            { headers }
        );

        if (!response.ok) {
            return results;
        }

        const data = await response.json();

        coinIds.forEach(({ symbol, coinId }) => {
            const tokenData = data[coinId];
            if (tokenData) {
                results.set(symbol, {
                    price: tokenData.usd || 0,
                    change24h: tokenData.usd_24h_change || 0,
                });
            }
        });

        return results;
    } catch (error) {
        console.error('Failed to fetch multiple prices:', error);
        return results;
    }
}

/**
 * Format price for display
 * @param {number} price 
 * @returns {string}
 */
export function formatPrice(price) {
    if (!price || price === 0) return '--';

    if (price < 0.01) {
        return `$${price.toFixed(6)}`;
    } else if (price < 1) {
        return `$${price.toFixed(4)}`;
    } else if (price < 1000) {
        return `$${price.toFixed(2)}`;
    } else {
        return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    }
}

/**
 * Format percentage change
 * @param {number} change 
 * @returns {string}
 */
export function formatChange(change) {
    if (change === null || change === undefined) return '--';

    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
}

/**
 * Check if token has price data available
 * @param {string} symbol 
 * @returns {boolean}
 */
export function hasPriceData(symbol) {
    return TOKEN_ID_MAP[symbol.toUpperCase()] !== undefined && TOKEN_ID_MAP[symbol.toUpperCase()] !== null;
}

/**
 * Format USD value for display
 * @param {number} value 
 * @returns {string}
 */
export function formatUsd(value) {
    if (!value || value === 0 || isNaN(value)) {
        return '$0.00';
    }

    return `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

/**
 * Calculate USD value from token amount and price
 * @param {number|string} amount - Token amount
 * @param {number} price - Token price in USD
 * @returns {number}
 */
export function calculateUsdValue(amount, price) {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!numAmount || !price || isNaN(numAmount) || isNaN(price)) {
        return 0;
    }
    return numAmount * price;
}

export default {
    getTokenPrice,
    getMultipleTokenPrices,
    formatPrice,
    formatChange,
    hasPriceData,
    formatUsd,
    calculateUsdValue,
};
