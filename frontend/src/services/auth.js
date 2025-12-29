const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export async function register(email, password, username, displayName) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, username, displayName })
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Registration failed')
  }

  return res.json()
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Login failed')
  }

  return res.json()
}

export async function logout() {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  })

  if (!res.ok) {
    throw new Error('Logout failed')
  }

  return res.json()
}

export async function refreshAccessToken() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include'
  })

  if (!res.ok) {
    throw new Error('Token refresh failed')
  }

  return res.json()
}
