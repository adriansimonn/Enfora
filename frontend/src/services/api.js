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
  if (!res.ok) {
    throw new Error('Failed to fetch tasks')
  }
  return res.json()
}

export async function createTask(taskData) {
  const res = await fetchWithAuth(`${API_BASE}/tasks`, {
    method: 'POST',
    body: JSON.stringify(taskData)
  })
  if (!res.ok) {
    throw new Error('Failed to create task')
  }
  return res.json()
}

export async function updateTask(taskId, taskData) {
  const res = await fetchWithAuth(`${API_BASE}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(taskData)
  })
  if (!res.ok) {
    throw new Error('Failed to update task')
  }
  return res.json()
}

export async function deleteTask(taskId) {
  const res = await fetchWithAuth(`${API_BASE}/tasks/${taskId}`, {
    method: 'DELETE'
  })
  if (!res.ok) {
    throw new Error('Failed to delete task')
  }
  return res.json()
}

export async function submitDispute(taskId, disputeReasoning) {
  const res = await fetchWithAuth(`${API_BASE}/tasks/${taskId}/dispute`, {
    method: 'POST',
    body: JSON.stringify({ disputeReasoning })
  })
  if (!res.ok) {
    throw new Error('Failed to submit dispute')
  }
  return res.json()
}

export async function fetchAnalytics() {
  const res = await fetchWithAuth(`${API_BASE}/analytics`)
  if (!res.ok) {
    throw new Error('Failed to fetch analytics')
  }
  return res.json()
}

export async function fetchAnalyticsByUserId(userId) {
  const res = await fetch(`${API_BASE}/analytics/user/${userId}`)
  if (!res.ok) {
    throw new Error('Failed to fetch analytics')
  }
  return res.json()
}

export async function refreshAnalytics() {
  const res = await fetchWithAuth(`${API_BASE}/analytics/refresh`, {
    method: 'POST'
  })
  if (!res.ok) {
    throw new Error('Failed to refresh analytics')
  }
  return res.json()
}

// Leaderboard API functions
export async function fetchLeaderboardTop100() {
  const res = await fetch(`${API_BASE}/leaderboard/top100`)
  if (!res.ok) {
    throw new Error('Failed to fetch leaderboard')
  }
  return res.json()
}

export async function fetchMyRank() {
  const res = await fetchWithAuth(`${API_BASE}/leaderboard/me`)
  if (!res.ok) {
    if (res.status === 404) {
      return null // User has no rank yet
    }
    throw new Error('Failed to fetch your rank')
  }
  return res.json()
}