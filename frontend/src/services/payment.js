import { getAccessToken } from './api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper function to get CSRF token from cookies
function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; XSRF-TOKEN=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
}

async function fetchWithAuth(url, options = {}) {
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json'
  };

  const accessToken = getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  // Add CSRF token for state-changing requests
  const method = options.method?.toUpperCase();
  if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-XSRF-Token'] = csrfToken;
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  return res;
}

/**
 * Get user's current payment method
 */
export async function getPaymentMethod() {
  const res = await fetchWithAuth(`${API_BASE}/payments/methods`);

  if (!res.ok) {
    throw new Error('Failed to fetch payment method');
  }

  const data = await res.json();
  return data.paymentMethod;
}

/**
 * Create SetupIntent for collecting payment method
 */
export async function createSetupIntent() {
  const res = await fetchWithAuth(`${API_BASE}/payments/setup-intent`, {
    method: 'POST'
  });

  if (!res.ok) {
    throw new Error('Failed to create setup intent');
  }

  return res.json();
}

/**
 * Save payment method to user account
 */
export async function savePaymentMethod(paymentMethodId) {
  const res = await fetchWithAuth(`${API_BASE}/payments/methods`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethodId })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to save payment method');
  }

  const data = await res.json();
  return data.paymentMethod;
}

/**
 * Remove user's payment method
 */
export async function removePaymentMethod() {
  const res = await fetchWithAuth(`${API_BASE}/payments/methods`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    throw new Error('Failed to remove payment method');
  }

  return res.json();
}

/**
 * Get user's payment history
 */
export async function getPaymentHistory(limit = 20, lastKey = null) {
  let url = `${API_BASE}/payments/history?limit=${limit}`;

  if (lastKey) {
    url += `&lastKey=${encodeURIComponent(JSON.stringify(lastKey))}`;
  }

  const res = await fetchWithAuth(url);

  if (!res.ok) {
    throw new Error('Failed to fetch payment history');
  }

  return res.json();
}
