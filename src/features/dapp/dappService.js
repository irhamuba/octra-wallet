/**
 * dApp Connection Service
 * Handles wallet connection to Octra dApps
 */

const CONNECTED_DAPPS_KEY = 'connected_dapps';

// Get all connected dApps
export const getConnectedDapps = () => {
    try {
        const stored = localStorage.getItem(CONNECTED_DAPPS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// Save connected dApps
export const saveConnectedDapps = (dapps) => {
    localStorage.setItem(CONNECTED_DAPPS_KEY, JSON.stringify(dapps));
};

// Connect to a dApp
export const connectToDapp = (dappInfo) => {
    const dapps = getConnectedDapps();

    // Check if already connected
    if (!dapps.find(d => d.origin === dappInfo.origin)) {
        dapps.push({
            ...dappInfo,
            connectedAt: Date.now()
        });
        saveConnectedDapps(dapps);
    }

    return dapps;
};

// Disconnect from a dApp
export const disconnectFromDapp = (origin) => {
    const dapps = getConnectedDapps().filter(d => d.origin !== origin);
    saveConnectedDapps(dapps);
    return dapps;
};

// Check if dApp is connected
export const isDappConnected = (origin) => {
    return getConnectedDapps().some(d => d.origin === origin);
};

// Pending requests for dApp interactions
let pendingRequests = [];

export const addPendingRequest = (request) => {
    const id = crypto.randomUUID();
    pendingRequests.push({
        id,
        ...request,
        createdAt: Date.now(),
        status: 'pending'
    });
    return id;
};

export const getPendingRequests = () => pendingRequests;

export const removePendingRequest = (id) => {
    pendingRequests = pendingRequests.filter(r => r.id !== id);
};

export const approveRequest = (id) => {
    const request = pendingRequests.find(r => r.id === id);
    if (request) {
        request.status = 'approved';
    }
    return request;
};

export const rejectRequest = (id) => {
    const request = pendingRequests.find(r => r.id === id);
    if (request) {
        request.status = 'rejected';
    }
    removePendingRequest(id);
    return request;
};

// Sign message request
export const createSignMessageRequest = (origin, message) => {
    return addPendingRequest({
        type: 'sign_message',
        origin,
        message
    });
};

// Transaction approval request
export const createTransactionRequest = (origin, txData) => {
    return addPendingRequest({
        type: 'transaction',
        origin,
        transaction: txData
    });
};
