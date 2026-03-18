import { getServerBaseUrl, loadManifest } from './manifest.mjs';
import { privateKeyToAccount } from 'viem/accounts';

export class ServerApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'ServerApiError';
    this.status = status;
    this.response = response;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const baseUrl = getServerBaseUrl(options.envName ?? 'fork-anvil');
  
  // Handle query parameters for GET requests
  let url = `${baseUrl}${endpoint}`;
  if (options.query && options.method === 'GET') {
    const params = new URLSearchParams(options.query);
    url = `${url}?${params.toString()}`;
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (options.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    console.error('API Error Response:', errorBody);
    throw new ServerApiError(
      `API request failed: ${response.status} ${response.statusText}`,
      response.status,
      errorBody,
    );
  }

  return response.json();
}

export async function getMyProfile(accessToken, envName) {
  return apiRequest('/api/v1/user/profile', { accessToken, envName });
}

export async function submitCheckin(accessToken, params, envName) {
  // params can be either a string (txHash) or an object with check-in details
  const body = typeof params === 'string' 
    ? { txHash: params, chainId: 97 }
    : params;
  
  return apiRequest('/api/v1/checkin', {
    method: 'POST',
    body,
    accessToken,
    envName,
  });
}

export async function syncPurchasedNft(accessToken, txHash, envName) {
  return apiRequest('/api/v1/claims/purchased-nft/sync', {
    method: 'POST',
    body: { txHash },
    accessToken,
    envName,
  });
}

export async function getMyClaims(accessToken, envName) {
  return apiRequest('/api/v1/claims', { accessToken, envName });
}

export async function syncClaim(accessToken, params, envName) {
  return apiRequest('/api/v1/claims/sync', {
    method: 'POST',
    body: params,
    accessToken,
    envName,
  });
}

export async function adminEpochSync(accessToken, referenceAt, envName) {
  return apiRequest('/api/v1/admin/ops/epochs/sync', {
    method: 'POST',
    body: { referenceAt },
    accessToken,
    envName,
  });
}

export async function previewEpochSync(accessToken, referenceAt, envName) {
  return apiRequest('/api/v1/admin/ops/epochs/sync/preview', {
    method: 'POST',
    body: { referenceAt },
    accessToken,
    envName,
  });
}

export async function login(address, signature, envName) {
  return apiRequest('/api/v1/auth/signature_signin', {
    method: 'POST',
    body: { 
      address, 
      signature,
      device: 'BROWSER',
      chain: 97,
    },
    envName,
  });
}

export async function getSignatureMessage(address, envName) {
  return apiRequest('/api/v1/auth/signature_message', {
    method: 'GET',
    query: { address, scenario: 'SIGNIN' },
    envName,
  });
}

export async function getAccessToken(address, privateKey, envName) {
  // First get the message to sign
  const { message } = await getSignatureMessage(address, envName);
  
  // Sign the message
  const account = privateKeyToAccount(privateKey);
  const signature = await account.signMessage({ message });
  
  // Login with the signature
  return login(address, signature, envName);
}
