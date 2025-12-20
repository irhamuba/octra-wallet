/**
 * RPC Client for Octra Blockchain
 * Handles communication with the Octra network
 */

// Use proxy in development AND production to bypass CORS
const isDev = import.meta.env.DEV;

// Network RPC URLs
export const RPC_URLS = {
    mainnet: '', // Mainnet coming soon
    testnet: import.meta.env.VITE_RPC_URL || 'https://octra.network',
};

// ALWAYS use proxy to avoid CORS issues
// Development: Vite dev proxy (/api)
// Production: Vercel Edge Function (/api/rpc)
const DEFAULT_RPC = isDev ? '/api' : '/api/rpc';
const ACTUAL_RPC = RPC_URLS.testnet;

class RPCClient {
    constructor(rpcUrl = DEFAULT_RPC) {
        this.rpcUrl = rpcUrl;
        this.timeout = 15000;
    }

    setRpcUrl(url) {
        // Always use proxy for octra.network to avoid CORS
        if (url === ACTUAL_RPC || url.startsWith('https://octra.network')) {
            this.rpcUrl = isDev ? '/api' : '/api/rpc';
        } else if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
            // Local nodes can be accessed directly
            this.rpcUrl = url;
        } else {
            // Custom RPC URL - use proxy if production
            this.rpcUrl = isDev ? '/api' : '/api/rpc';
        }
    }

    getActualRpcUrl() {
        if (this.rpcUrl === '/api' || this.rpcUrl === '/api/rpc') {
            return ACTUAL_RPC;
        }
        return this.rpcUrl;
    }

    async request(method, path, data = null) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            };

            if (data && method === 'POST') {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.rpcUrl}${path}`, options);
            clearTimeout(timeoutId);

            const text = await response.text();
            let json = null;

            try {
                json = text.trim() ? JSON.parse(text) : null;
            } catch {
                json = null;
            }

            return {
                status: response.status,
                text,
                json,
                ok: response.ok
            };
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                return { status: 0, text: 'timeout', json: null, ok: false, error: 'Request timeout' };
            }

            return { status: 0, text: error.message, json: null, ok: false, error: error.message };
        }
    }

    async get(path) {
        return this.request('GET', path);
    }

    async post(path, data) {
        return this.request('POST', path, data);
    }

    /**
     * Get balance and nonce for an address
     */
    async getBalance(address) {
        const result = await this.get(`/balance/${address}`);

        if (result.status === 200 && result.json) {
            return {
                balance: parseFloat(result.json.balance || 0),
                nonce: parseInt(result.json.nonce || 0)
            };
        } else if (result.status === 404) {
            return { balance: 0, nonce: 0 };
        }

        throw new Error(result.error || 'Failed to get balance');
    }

    /**
     * Get address info including transaction history
     */
    async getAddressInfo(address, limit = 20) {
        const result = await this.get(`/address/${address}?limit=${limit}`);

        if (result.status === 200 && result.json) {
            return result.json;
        } else if (result.status === 404) {
            return {
                address,
                balance: '0',
                nonce: 0,
                recent_transactions: []
            };
        }

        throw new Error(result.error || 'Failed to get address info');
    }

    /**
     * Get transaction details by hash
     */
    async getTransaction(txHash) {
        const result = await this.get(`/tx/${txHash}`);

        if (result.status === 200 && result.json) {
            return result.json;
        }

        throw new Error(result.error || 'Transaction not found');
    }

    /**
     * Get staged transactions (pending in mempool)
     */
    async getStagedTransactions() {
        const result = await this.get('/staging');

        if (result.status === 200 && result.json) {
            return result.json.staged_transactions || [];
        }

        return [];
    }

    /**
     * Send a transaction
     */
    async sendTransaction(tx) {
        const result = await this.post('/send-tx', tx);

        if (result.status === 200) {
            if (result.json && result.json.status === 'accepted') {
                return {
                    success: true,
                    txHash: result.json.tx_hash,
                    poolInfo: result.json.pool_info
                };
            } else if (result.text && result.text.toLowerCase().startsWith('ok')) {
                const parts = result.text.split(/\s+/);
                return {
                    success: true,
                    txHash: parts[parts.length - 1]
                };
            }
        }

        const error = result.json?.error || result.text || 'Transaction failed';
        throw new Error(error);
    }

    /**
     * Get encrypted balance (for privacy features)
     */
    async getEncryptedBalance(address, privateKey) {
        try {
            const result = await this.request('GET', `/view_encrypted_balance/${address}`, null);

            if (result.status === 200 && result.json) {
                return {
                    public: parseFloat(result.json.public_balance?.split(' ')[0] || '0'),
                    publicRaw: parseInt(result.json.public_balance_raw || '0'),
                    encrypted: parseFloat(result.json.encrypted_balance?.split(' ')[0] || '0'),
                    encryptedRaw: parseInt(result.json.encrypted_balance_raw || '0'),
                    total: parseFloat(result.json.total_balance?.split(' ')[0] || '0')
                };
            }

            return null;
        } catch {
            return null;
        }
    }

    /**
     * Check if RPC is reachable
     */
    async checkConnection() {
        try {
            const result = await this.get('/health');
            return result.ok || result.status === 200;
        } catch {
            try {
                // Try alternate endpoint
                const result = await this.get('/staging');
                return result.status === 200;
            } catch {
                return false;
            }
        }
    }

    /**
     * Get fee estimate from network
     * Returns low, medium, high fee options
     */
    async getFeeEstimate(amount = 1) {
        try {
            // Try to get fee estimate from network
            const result = await this.get('/fee-estimate');

            if (result.status === 200 && result.json) {
                return {
                    low: parseFloat(result.json.low || 0.001),
                    medium: parseFloat(result.json.medium || 0.002),
                    high: parseFloat(result.json.high || 0.003),
                    baseFee: parseFloat(result.json.base_fee || 0.001)
                };
            }

            // Fallback: calculate based on amount (Octra fee structure)
            // Fee = base fee + percentage based on amount
            const baseFee = 0.001;
            const percentFee = amount * 0.0001; // 0.01% of amount

            return {
                low: Math.max(baseFee, baseFee + percentFee * 0.5),
                medium: Math.max(baseFee, baseFee + percentFee),
                high: Math.max(baseFee, baseFee + percentFee * 2),
                baseFee: baseFee
            };
        } catch {
            // Default fallback fees
            return {
                low: 0.001,
                medium: 0.002,
                high: 0.003,
                baseFee: 0.001
            };
        }
    }

    /**
     * Get network info
     */
    async getNetworkInfo() {
        try {
            const result = await this.get('/info');
            if (result.status === 200 && result.json) {
                return result.json;
            }
            return null;
        } catch {
            return null;
        }
    }
}

// Singleton instance
let rpcClientInstance = null;

export function getRpcClient() {
    if (!rpcClientInstance) {
        rpcClientInstance = new RPCClient();
    }
    return rpcClientInstance;
}

export function setRpcUrl(url) {
    const client = getRpcClient();
    client.setRpcUrl(url);
}

export default RPCClient;
