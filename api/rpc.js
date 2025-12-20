/**
 * Vercel Serverless Function - RPC Proxy
 * Node.js based - FREE TIER Compatible
 * 
 * Handles all /api/rpc/* requests
 * Supports ALL Octra RPC endpoints:
 * - GET /balance/{address}
 * - GET /staging
 * - GET /address/{address}
 * - GET /tx/{hash}
 * - POST /send-tx
 * - GET /public_key/{address}
 * - GET /view_encrypted_balance/{address}
 * - POST /encrypt_balance
 * - POST /decrypt_balance
 * - POST /private_transfer
 * - GET /pending_private_transfers
 * - POST /claim_private_transfer
 * - GET /health
 * - GET /info
 * - GET /fee-estimate
 */

const RPC_URL = process.env.VITE_RPC_URL || 'https://octra.network';

export default async function handler(req, res) {
    // Set CORS headers for ALL responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Private-Key, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle OPTIONS (CORS preflight) - MUST return 200 or 204
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Extract path from URL
        // URL: /api/rpc → path: /
        // URL: /api/rpc/balance/octxxx → path: /balance/octxxx
        let path = req.url.replace(/^\/api\/rpc/, '') || '/';

        // Handle edge case where path might be empty
        if (!path || path === '') {
            path = '/';
        }

        // Remove query params from path (they'll be added separately)
        const queryIndex = path.indexOf('?');
        let queryString = '';
        if (queryIndex !== -1) {
            queryString = path.substring(queryIndex);
            path = path.substring(0, queryIndex);
        }

        const targetUrl = `${RPC_URL}${path}${queryString}`;

        console.log(`[RPC Proxy] ${req.method} ${targetUrl}`);

        // Prepare fetch options
        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'OctraWallet/1.0',
            },
        };

        // Forward X-Private-Key header if present (for private balance operations)
        if (req.headers['x-private-key']) {
            fetchOptions.headers['X-Private-Key'] = req.headers['x-private-key'];
        }

        // Add body for POST/PUT
        if (req.method === 'POST' || req.method === 'PUT') {
            if (req.body) {
                fetchOptions.body = typeof req.body === 'string'
                    ? req.body
                    : JSON.stringify(req.body);
            }
        }

        // Forward request to RPC with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

        fetchOptions.signal = controller.signal;

        const response = await fetch(targetUrl, fetchOptions);
        clearTimeout(timeout);

        // Get response data
        const text = await response.text();

        // Set response content type
        res.setHeader('Content-Type', 'application/json');

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(text);
            return res.status(response.status).json(data);
        } catch (e) {
            // If not valid JSON, check if it's a simple OK response
            if (text.toLowerCase().startsWith('ok')) {
                // Octra sometimes returns "OK txhash" format
                return res.status(response.status).json({
                    status: 'ok',
                    raw: text
                });
            }

            // Return error with original content
            return res.status(response.status).json({
                error: 'Invalid JSON response from RPC',
                status: response.status,
                content: text.substring(0, 500)
            });
        }

    } catch (error) {
        console.error('[RPC Proxy] Error:', error);

        // Handle abort/timeout
        if (error.name === 'AbortError') {
            return res.status(504).json({
                error: 'Gateway Timeout',
                message: 'RPC server did not respond in time'
            });
        }

        return res.status(500).json({
            error: 'Proxy error',
            message: error.message,
            code: error.code || 'UNKNOWN'
        });
    }
}
