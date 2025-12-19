/**
 * Network Configuration
 */

export const NETWORKS = {
    testnet: {
        id: 'testnet',
        name: 'Testnet',
        rpcUrl: import.meta.env.VITE_RPC_URL || 'https://octra.network',
        explorerUrl: import.meta.env.VITE_EXPLORER_URL || 'https://explorer.octra.network',
        chainId: 1,
        symbol: 'OCT',
        isAvailable: true
    },
    mainnet: {
        id: 'mainnet',
        name: 'Mainnet',
        rpcUrl: import.meta.env.VITE_MAINNET_RPC_URL || 'https://mainnet.octra.network',
        explorerUrl: import.meta.env.VITE_EXPLORER_URL || 'https://explorer.octra.network',
        chainId: 2,
        symbol: 'OCT',
        isAvailable: false // Coming soon
    }
};

export const DEFAULT_NETWORK = 'testnet';

export const getNetwork = (networkId) => {
    return NETWORKS[networkId] || NETWORKS[DEFAULT_NETWORK];
};
