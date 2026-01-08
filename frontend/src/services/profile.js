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

/**
 * Helper function for authenticated requests
 */
async function fetchWithAuth(url, options = {}) {
  const headers = {
    ...options.headers,
  }

  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Don't set Content-Type for FormData - browser will set it with boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
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

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Request failed')
  }

  return res.json()
}

/**
 * Get profile by username
 */
export async function getProfile(username) {
  const res = await fetch(`${API_BASE}/profile/${username}`)

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to fetch profile')
  }

  return res.json()
}

/**
 * Get profile by userId (authenticated)
 */
export async function getProfileByUserId(userId) {
  return fetchWithAuth(`${API_BASE}/profile/user/${userId}`)
}

/**
 * Update profile information
 */
export async function updateProfile(username, updates) {
  return fetchWithAuth(`${API_BASE}/profile/${username}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(username, file) {
  const formData = new FormData()
  formData.append('profilePicture', file)

  return fetchWithAuth(`${API_BASE}/profile/${username}/picture`, {
    method: 'POST',
    body: formData
  })
}

/**
 * Delete profile picture
 */
export async function deleteProfilePicture(username) {
  return fetchWithAuth(`${API_BASE}/profile/${username}/picture`, {
    method: 'DELETE'
  })
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailability(username) {
  const res = await fetch(`${API_BASE}/profile/check-username/${username}`)

  if (!res.ok) {
    throw new Error('Failed to check username')
  }

  return res.json()
}
