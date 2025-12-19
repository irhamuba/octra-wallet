/**
 * OCS01 Token Service
 * 
 * Implementation for Octra's OCS01 Token Standard
 * Based on official ocs01-test implementation
 * 
 * OCS01 is Octra's token standard similar to ERC-20
 * Supports view methods (no signing) and call methods (requires signing)
 */

import { getRpcClient } from '../utils/rpc';
import { keyringService } from './KeyringService';

// Well-known OCS01 contracts on Octra Network
export const KNOWN_CONTRACTS = {
    testnet: [
        {
            address: 'octBUHw585BrAMPMLQvGuWx4vqEsybYH9N7a3WNj1WBwrDn',
            name: 'OCS01 Test Contract',
            description: 'Official OCS01 test contract with token claiming',
            verified: true,
            methods: {
                view: ['greetCaller', 'getSpec', 'getCredits', 'dotProduct', 'vectorMagnitude', 'power', 'factorial', 'fibonacci', 'gcd', 'isPrime'],
                call: []
            }
        }
    ],
    mainnet: []
};

/**
 * OCS01 Contract Interface
 */
class OCS01Contract {
    constructor(contractAddress, network = 'testnet') {
        this.contractAddress = contractAddress;
        this.network = network;
        this.rpcClient = getRpcClient();
    }

    /**
     * Call a view method on the contract (no signing required)
     * Uses /contract/call-view endpoint
     */
    async callView(method, params = [], callerAddress) {
        try {
            const response = await fetch(`${this.rpcClient.rpcUrl}/contract/call-view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contract: this.contractAddress,
                    method: method,
                    params: params,
                    caller: callerAddress
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                return {
                    success: true,
                    result: result.result
                };
            }

            return {
                success: false,
                error: result.error || 'Call failed'
            };
        } catch (error) {
            console.error(`OCS01 callView error (${method}):`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Call a contract method that modifies state (requires signing)
     * Uses /call-contract endpoint
     */
    async callMethod(method, params, callerAddress) {
        try {
            // Get nonce
            const balanceData = await this.rpcClient.getBalance(callerAddress);
            const nonce = balanceData.nonce + 1;
            const timestamp = Date.now() / 1000;

            // Sign the contract call
            const signedData = await keyringService.signContractCall(callerAddress, {
                contract: this.contractAddress,
                method: method,
                params: params,
                nonce: nonce,
                timestamp: timestamp
            });

            // Submit to network
            const response = await fetch(`${this.rpcClient.rpcUrl}/call-contract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contract: this.contractAddress,
                    method: method,
                    params: params,
                    caller: callerAddress,
                    nonce: nonce,
                    timestamp: timestamp,
                    signature: signedData.signature,
                    public_key: signedData.publicKey
                })
            });

            const result = await response.json();

            if (result.tx_hash) {
                return {
                    success: true,
                    txHash: result.tx_hash
                };
            }

            return {
                success: false,
                error: result.error || 'Contract call failed'
            };
        } catch (error) {
            console.error(`OCS01 callMethod error (${method}):`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Wait for transaction confirmation
     */
    async waitForConfirmation(txHash, timeout = 60000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            try {
                const tx = await this.rpcClient.getTransaction(txHash);
                if (tx.status === 'confirmed') {
                    return { confirmed: true, tx };
                }
            } catch (error) {
                // Transaction not found yet, keep waiting
            }

            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        return { confirmed: false };
    }

    // ===== Common OCS01 Methods =====

    /**
     * Get greeting message
     */
    async greetCaller(callerAddress) {
        return await this.callView('greetCaller', [], callerAddress);
    }

    /**
     * Get contract specification/info
     */
    async getSpec(callerAddress) {
        return await this.callView('getSpec', [], callerAddress);
    }

    /**
     * Get token balance for an address
     */
    async getCredits(address, callerAddress) {
        return await this.callView('getCredits', [address], callerAddress || address);
    }

    /**
     * Transfer tokens to another address
     */
    async transfer(to, amount, callerAddress) {
        // Amount is already in raw units from SendView
        return await this.callMethod('transfer', [to, String(amount)], callerAddress);
    }
}

/**
 * OCS01 Token Manager
 * Manages OCS01 contracts and token interactions
 */
class OCS01Manager {
    constructor() {
        this.contracts = new Map(); // address -> OCS01Contract
        this.userContracts = new Map(); // userAddress -> Set of contractAddresses
    }

    /**
     * Get or create contract instance
     */
    getContract(contractAddress, network = 'testnet') {
        if (!this.contracts.has(contractAddress)) {
            this.contracts.set(contractAddress, new OCS01Contract(contractAddress, network));
        }
        return this.contracts.get(contractAddress);
    }

    /**
     * Add contract to user's list
     */
    addUserContract(userAddress, contractAddress) {
        if (!this.userContracts.has(userAddress)) {
            this.userContracts.set(userAddress, new Set());
        }
        this.userContracts.get(userAddress).add(contractAddress);
    }

    /**
     * Get known contracts for network
     */
    getKnownContracts(network = 'testnet') {
        return KNOWN_CONTRACTS[network] || [];
    }

    /**
     * Get user's token balances from all known contracts
     */
    async getUserTokenBalances(userAddress, network = 'testnet') {
        const balances = [];
        const contracts = this.getKnownContracts(network);

        for (const contractInfo of contracts) {
            try {
                const contract = this.getContract(contractInfo.address, network);
                const result = await contract.getCredits(userAddress, userAddress);

                if (result.success) {
                    balances.push({
                        contractAddress: contractInfo.address,
                        contractName: contractInfo.name,
                        balance: parseFloat(result.result) || 0,
                        verified: contractInfo.verified
                    });
                }
            } catch (error) {
                console.error(`Failed to get balance from ${contractInfo.name}:`, error);
            }
        }

        // Add user's custom contracts
        const customContracts = this.userContracts.get(userAddress) || new Set();
        for (const contractAddress of customContracts) {
            if (contracts.some(c => c.address === contractAddress)) continue;

            try {
                const contract = this.getContract(contractAddress, network);
                const result = await contract.getCredits(userAddress, userAddress);

                if (result.success) {
                    balances.push({
                        contractAddress: contractAddress,
                        contractName: 'Custom Contract',
                        balance: parseFloat(result.result) || 0,
                        verified: false,
                        isCustom: true
                    });
                }
            } catch (error) {
                console.error(`Failed to get balance from custom contract ${contractAddress}:`, error);
            }
        }

        return balances;
    }


}

// Singleton instance
export const ocs01Manager = new OCS01Manager();

// Export classes (KNOWN_CONTRACTS already exported at declaration)
export { OCS01Contract, OCS01Manager };
