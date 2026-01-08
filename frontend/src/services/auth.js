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

export async function register(email, password, username, displayName) {
  const headers = { 'Content-Type': 'application/json' }
  const csrfToken = getCsrfToken()
  if (csrfToken) {
    headers['X-XSRF-Token'] = csrfToken
  }

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ email, password, username, displayName })
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Registration failed')
  }

  return res.json()
}

export async function verifyEmail(email, code) {
  const headers = { 'Content-Type': 'application/json' }
  const csrfToken = getCsrfToken()
  if (csrfToken) {
    headers['X-XSRF-Token'] = csrfToken
  }

  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ email, code })
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Verification failed')
  }

  return res.json()
}

export async function resendVerificationCode(email) {
  const headers = { 'Content-Type': 'application/json' }
  const csrfToken = getCsrfToken()
  if (csrfToken) {
    headers['X-XSRF-Token'] = csrfToken
  }

  const res = await fetch(`${API_BASE}/auth/resend-code`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ email })
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Resend failed')
  }

  return res.json()
}

export async function login(email, password, twoFactorCode = null, isBackupCode = false) {
  const headers = { 'Content-Type': 'application/json' }
  const csrfToken = getCsrfToken()
  if (csrfToken) {
    headers['X-XSRF-Token'] = csrfToken
  }

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ email, password, twoFactorCode, isBackupCode })
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Login failed')
  }

  return res.json()
}

export async function logout() {
  const headers = {}
  const csrfToken = getCsrfToken()
  if (csrfToken) {
    headers['X-XSRF-Token'] = csrfToken
  }

  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers,
    credentials: 'include'
  })

  if (!res.ok) {
    throw new Error('Logout failed')
  }

  return res.json()
}

export async function refreshAccessToken() {
  const headers = {}
  const csrfToken = getCsrfToken()
  if (csrfToken) {
    headers['X-XSRF-Token'] = csrfToken
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers,
    credentials: 'include'
  })

  if (!res.ok) {
    throw new Error('Token refresh failed')
  }

  return res.json()
}
