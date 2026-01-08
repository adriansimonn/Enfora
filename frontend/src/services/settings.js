import { getAccessToken } from './api'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Helper function to get CSRF token from cookies
function getCsrfToken() {
  const value = `; ${document.cookie}`
  const parts = value.split(`; XSRF-TOKEN=`)
  if (parts.length === 2) {
    return parts.pop().split(';').shift()
  }
  return null
}

async function fetchWithAuth(url, options = {}) {
  const token = getAccessToken()
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Add CSRF token for state-changing requests
  const method = options.method?.toUpperCase()
  if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers['X-XSRF-Token'] = csrfToken
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })

  return res
}

/**
 * Change user password
 */
export async function changePassword(currentPassword, newPassword) {
  const res = await fetchWithAuth(`${API_BASE}/settings/password`, {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to change password')
  }

  return res.json()
}

/**
 * Get notification settings
 */
export async function getNotificationSettings() {
  const res = await fetchWithAuth(`${API_BASE}/settings/notifications`)

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to fetch notification settings')
  }

  return res.json()
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(settings) {
  const res = await fetchWithAuth(`${API_BASE}/settings/notifications`, {
    method: 'PUT',
    body: JSON.stringify(settings)
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to update notification settings')
  }

  return res.json()
}

/**
 * Request account deletion - sends verification code
 */
export async function requestAccountDeletion() {
  const res = await fetchWithAuth(`${API_BASE}/settings/account/delete/request`, {
    method: 'POST'
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to request account deletion')
  }

  return res.json()
}

/**
 * Confirm account deletion with verification code and username
 */
export async function confirmAccountDeletion(verificationCode, username) {
  const res = await fetchWithAuth(`${API_BASE}/settings/account/delete/confirm`, {
    method: 'POST',
    body: JSON.stringify({ verificationCode, username })
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to delete account')
  }

  return res.json()
}
