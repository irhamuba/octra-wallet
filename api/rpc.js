/**
 * Simpler Vercel Edge Function - Index route
 * Catches /api/rpc/* paths
 */

export const config = {
    runtime: 'edge',
};

const RPC_URL = 'https://octra.network';

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
        // Get path - remove /api/rpc prefix
        // URL will be like: /api/rpc/balance/octxxx or /api/rpc/staging
        const fullPath = url.pathname; // e.g., /api/rpc/balance/octxxx
        const rpcPath = fullPath.replace(/^\/api\/rpc/, '') || '/'; // → /balance/octxxx

        const searchParams = url.searchParams.toString();
        const targetUrl = `${RPC_URL}${rpcPath}${searchParams ? '?' + searchParams : ''}`;

        console.log(`[RPC Proxy] ${request.method} ${targetUrl}`);

        // Prepare request
        const fetchOptions = {
            method: request.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        };

        // Add body for POST/PUT
        if (request.method === 'POST' || request.method === 'PUT') {
            try {
                const body = await request.text();
                if (body) fetchOptions.body = body;
            } catch (e) {
                console.error('[RPC Proxy] Body error:', e);
            }
        }

        // Forward to RPC
        const response = await fetch(targetUrl, fetchOptions);

        // Get response
        const data = await response.text();

        // Return with CORS
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
