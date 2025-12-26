const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

let accessToken = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

async function fetchWithAuth(url, options = {}) {
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json'
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })

  return res
}

export async function fetchTasks() {
  const res = await fetchWithAuth(`${API_BASE}/tasks`)
  return res.json()
}