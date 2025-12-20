/**
 * Vercel Serverless Function - RPC Proxy
 * Node.js based - FREE TIER Compatible
 * 
 * Handles all /api/rpc/* requests
 */

const RPC_URL = process.env.VITE_RPC_URL || 'https://octra.network';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle OPTIONS (CORS preflight)
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    try {
        // Extract path from URL
        // URL: /api/rpc → path: /
        // URL: /api/rpc/balance/octxxx → path: /balance/octxxx
        let path = req.url.replace('/api/rpc', '') || '/';

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

        // Add body for POST/PUT
        if (req.method === 'POST' || req.method === 'PUT') {
            if (req.body) {
                fetchOptions.body = typeof req.body === 'string'
                    ? req.body
                    : JSON.stringify(req.body);
            }
        }

        // Forward request to RPC
        const response = await fetch(targetUrl, fetchOptions);

        // Get response data
        const text = await response.text();
        let data;

        try {
            data = JSON.parse(text);
        } catch (e) {
            // Not JSON, return error
            data = {
                error: 'Invalid JSON response from RPC',
                status: response.status,
                content: text.substring(0, 200)
            };
        }

        // Return response with same status code
        return res.status(response.status).json(data);

    } catch (error) {
        console.error('[RPC Proxy] Error:', error);

        return res.status(500).json({
            error: 'Proxy error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
