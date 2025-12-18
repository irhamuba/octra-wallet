/**
 * Token Service
 * Handles token fetching, balance, and transfers
 */

import { getAllTokens, addCustomToken, removeCustomToken } from '../../constants/tokens';

// Get all tokens with balances
export const getTokensWithBalances = async (address, rpcClient) => {
    const tokens = getAllTokens();

    const tokensWithBalances = await Promise.all(
        tokens.map(async (token) => {
            try {
                let balance = 0;

                if (token.isNative) {
                    // Get native OCT balance
                    const data = await rpcClient.getBalance(address);
                    balance = data.balance || 0;
                } else {
                    // TODO: Get token balance from contract
                    balance = 0;
                }

                return {
                    ...token,
                    balance
                };
            } catch (error) {
                console.error(`Failed to get balance for ${token.symbol}:`, error);
                return {
                    ...token,
                    balance: 0
                };
            }
        })
    );

    return tokensWithBalances;
};

// Add a new custom token
export const addToken = async (tokenData, rpcClient) => {
    // Validate token data
    if (!tokenData.contractAddress) {
        throw new Error('Contract address is required');
    }

    if (!tokenData.symbol) {
        throw new Error('Token symbol is required');
    }

    // TODO: Validate contract exists on Octra network

    const token = {
        symbol: tokenData.symbol.toUpperCase(),
        name: tokenData.name || tokenData.symbol,
        decimals: tokenData.decimals || 6,
        contractAddress: tokenData.contractAddress,
        logoUrl: tokenData.logoUrl || null,
        isNative: false
    };

    return addCustomToken(token);
};

// Remove a custom token
export const removeToken = (contractAddress) => {
    return removeCustomToken(contractAddress);
};

// Transfer token
export const transferToken = async (wallet, token, toAddress, amount, rpcClient) => {
    if (token.isNative) {
        // Use regular transfer for native OCT
        throw new Error('Use regular send for native OCT');
    }

    // TODO: Implement token transfer via contract
    throw new Error('Token transfer not yet implemented');
};

// Get token info from contract
export const getTokenInfo = async (contractAddress, rpcClient) => {
    // TODO: Fetch token metadata from contract
    return null;
};
