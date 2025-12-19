/**
 * Network Configuration
 */

export const NETWORKS = {
    testnet: {
        id: 'testnet',
        name: 'Testnet',
        rpcUrl: 'https://octra.network',
        explorerUrl: 'https://explorer.octra.network',
        chainId: 1,
        symbol: 'OCT',
        isAvailable: true
    },
    mainnet: {
        id: 'mainnet',
        name: 'Mainnet',
        rpcUrl: 'https://mainnet.octra.network',
        explorerUrl: 'https://explorer.octra.network',
        chainId: 2,
        symbol: 'OCT',
        isAvailable: false // Coming soon
    }
};

export const DEFAULT_NETWORK = 'testnet';

export const getNetwork = (networkId) => {
    return NETWORKS[networkId] || NETWORKS[DEFAULT_NETWORK];
};
