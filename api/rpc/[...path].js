/**
 * Vercel Edge Function - RPC Proxy
 * Solves CORS issue by proxying ALL requests to octra.network
 */

export const config = {
    runtime: 'edge',
};

const RPC_URL = process.env.VITE_RPC_URL || 'https://octra.network';

export default async function handler(request) {
    const url = new URL(request.url);

    // Handle OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    try {
        // Extract path after /api/rpc
        const rpcPath = url.pathname.replace('/api/rpc', '') || '/';
        const searchParams = url.searchParams.toString();
        const targetUrl = `${RPC_URL}${rpcPath}${searchParams ? '?' + searchParams : ''}`;

        console.log(`[RPC Proxy] ${request.method} ${targetUrl}`);

        // Prepare request options
        const fetchOptions = {
            method: request.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'OctraWallet/1.0',
            },
        };

        // Add body for POST/PUT requests
        if (request.method === 'POST' || request.method === 'PUT') {
            try {
                const body = await request.text();
                if (body) {
                    fetchOptions.body = body;
                }
            } catch (e) {
                console.error('[RPC Proxy] Error reading body:', e);
            }
        }

        // Forward request to actual RPC
        const response = await fetch(targetUrl, fetchOptions);

        // Get response data
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.text();
        } else {
            // Non-JSON response (might be error HTML)
            const text = await response.text();
            data = JSON.stringify({
                error: 'Non-JSON response from RPC',
                status: response.status,
                content: text.substring(0, 500) // First 500 chars for debugging
            });
        }

        // Return with CORS headers
        return new Response(data, {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    } catch (error) {
        console.error('[RPC Proxy] Error:', error);

        return new Response(
            JSON.stringify({
                error: 'Proxy error',
                message: error.message,
                stack: error.stack?.substring(0, 500)
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }
}
