/**
 * Default Token List
 */

export const DEFAULT_TOKENS = [
    {
        symbol: 'OCT',
        name: 'Octra',
        decimals: 6,
        contractAddress: null, // Native token
        logoUrl: null,
        isNative: true
    }
];

export const TOKEN_STORAGE_KEY = 'custom_tokens';

export const getStoredTokens = () => {
    try {
        const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const saveCustomTokens = (tokens) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
};

export const addCustomToken = (token) => {
    const tokens = getStoredTokens();
    if (!tokens.find(t => t.contractAddress === token.contractAddress)) {
        tokens.push(token);
        saveCustomTokens(tokens);
    }
    return tokens;
};

export const removeCustomToken = (contractAddress) => {
    const tokens = getStoredTokens().filter(t => t.contractAddress !== contractAddress);
    saveCustomTokens(tokens);
    return tokens;
};

export const getAllTokens = () => {
    return [...DEFAULT_TOKENS, ...getStoredTokens()];
};
