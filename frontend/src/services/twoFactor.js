import { fetchWithAuth } from './api'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Get 2FA status for current user
 */
export async function get2FAStatus() {
  const response = await fetchWithAuth(`${API_BASE}/2fa/status`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get 2FA status')
  }
  return response.json()
}

/**
 * Setup authenticator app 2FA - Step 1: Get QR code and secret
 */
export async function setupAuthenticator() {
  const response = await fetchWithAuth(`${API_BASE}/2fa/setup/authenticator`, {
    method: 'POST'
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to setup authenticator')
  }
  return response.json()
}

/**
 * Verify and complete authenticator app 2FA setup - Step 2
 */
export async function verifyAuthenticatorSetup(code, backupCodes) {
  const response = await fetchWithAuth(`${API_BASE}/2fa/setup/authenticator/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code, backupCodes })
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to verify authenticator setup')
  }
  return response.json()
}

/**
 * Setup email-based 2FA
 */
export async function setupEmail2FA() {
  const response = await fetchWithAuth(`${API_BASE}/2fa/setup/email`, {
    method: 'POST'
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to setup email 2FA')
  }
  return response.json()
}

/**
 * Disable 2FA
 */
export async function disable2FA(password) {
  const response = await fetchWithAuth(`${API_BASE}/2fa/disable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to disable 2FA')
  }
  return response.json()
}

/**
 * Send 2FA code via email (for login)
 */
export async function send2FAEmailCode(email) {
  const response = await fetch(`${API_BASE}/2fa/send-email-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send 2FA code')
  }
  return response.json()
}

/**
 * Verify 2FA code during login
 */
export async function verify2FACode(email, code, isBackupCode = false) {
  const response = await fetch(`${API_BASE}/2fa/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, code, isBackupCode })
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to verify 2FA code')
  }
  return response.json()
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(password) {
  const response = await fetchWithAuth(`${API_BASE}/2fa/backup-codes/regenerate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to regenerate backup codes')
  }
  return response.json()
}
