/**
 * Price Service
 * Fetches cryptocurrency prices - Testnet returns $0, Mainnet uses real API
 */

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 60000; // 1 minute cache

// Price cache
let priceCache = {
    data: {},
    timestamp: 0
};

/**
 * Get current price for a token
 * @param {string} tokenSymbol - Token symbol (e.g., 'OCT', 'BTC', 'ETH')
 * @param {string} currency - Fiat currency (default: 'usd')
 * @param {string} network - Network type ('testnet' or 'mainnet')
 * @returns {Promise<number>} Price in specified currency
 */
export async function getTokenPrice(tokenSymbol = 'OCT', currency = 'usd', network = 'testnet') {
    try {
        // Testnet: Always return $0.00
        if (network === 'testnet') {
            return 0;
        }

        // Mainnet: Fetch real price
        const now = Date.now();
        const cacheKey = `${tokenSymbol}_${currency}`;

        // Check cache
        if (priceCache.data[cacheKey] && (now - priceCache.timestamp) < CACHE_DURATION) {
            return priceCache.data[cacheKey];
        }

        // For OCT token on mainnet - use actual API
        // TODO: Replace with your actual OCT price API endpoint
        if (tokenSymbol.toLowerCase() === 'oct') {
            // Example: You can integrate with your price API here
            // const response = await fetch('YOUR_OCT_PRICE_API');
            // const data = await response.json();
            // const price = data.usd;

            // For now, return 0 until real API is integrated
            console.warn('OCT mainnet price API not configured yet');
            return 0;
        }

        // For other tokens, use CoinGecko
        const coinGeckoId = getCoinGeckoId(tokenSymbol);
        if (!coinGeckoId) {
            console.warn(`No CoinGecko ID found for ${tokenSymbol}`);
            return 0;
        }

        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=${coinGeckoId}&vs_currencies=${currency}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch price: ${response.statusText}`);
        }

        const data = await response.json();
        const price = data[coinGeckoId]?.[currency] || 0;

        // Update cache
        priceCache.data[cacheKey] = price;
        priceCache.timestamp = now;

        return price;
    } catch (error) {
        console.error('Error fetching token price:', error);
        return 0;
    }
}

/**
 * Get multiple token prices
 * @param {string[]} tokenSymbols - Array of token symbols
 * @param {string} currency - Fiat currency
 * @param {string} network - Network type
 * @returns {Promise<Object>} Object with symbol: price pairs
 */
export async function getMultipleTokenPrices(tokenSymbols, currency = 'usd', network = 'testnet') {
    const prices = {};

    await Promise.all(
        tokenSymbols.map(async (symbol) => {
            prices[symbol] = await getTokenPrice(symbol, currency, network);
        })
    );

    return prices;
}

/**
 * Calculate USD value
 * @param {number} amount - Token amount
 * @param {number} price - Price per token
 * @returns {number} USD value
 */
export function calculateUsdValue(amount, price) {
    return amount * price;
}

/**
 * Format USD amount
 * @param {number} amount - USD amount
 * @returns {string} Formatted string (e.g., "$1,234.56")
 */
export function formatUsd(amount) {
    if (!amount || isNaN(amount) || amount === 0) return '$0.00';

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Map token symbols to CoinGecko IDs
 * @param {string} symbol - Token symbol
 * @returns {string|null} CoinGecko ID
 */
function getCoinGeckoId(symbol) {
    const symbolMap = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'USDT': 'tether',
        'USDC': 'usd-coin',
        'OCT': null // Custom token, configure API separately
    };

    return symbolMap[symbol.toUpperCase()] || null;
}

/**
 * Clear price cache
 */
export function clearPriceCache() {
    priceCache = {
        data: {},
        timestamp: 0
    };
}
