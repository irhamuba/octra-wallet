/**
 * Vercel Edge Function - RPC Proxy
 * Solves CORS issue by proxying requests to octra.network
 */

export const config = {
    runtime: 'edge',
};

const RPC_URL = process.env.VITE_RPC_URL || 'https://octra.network';

export default async function handler(request) {
    const url = new URL(request.url);

    // Extract path after /api/rpc
    const rpcPath = url.pathname.replace('/api/rpc', '') || '/';
    const searchParams = url.searchParams.toString();
    const targetUrl = `${RPC_URL}${rpcPath}${searchParams ? '?' + searchParams : ''}`;

    try {
        // Forward request to actual RPC
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: request.method !== 'GET' && request.method !== 'HEAD'
                ? await request.text()
                : undefined,
        });

        // Get response data
        const data = await response.text();

        // Return with CORS headers
        return new Response(data, {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
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
