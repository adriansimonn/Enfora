const API_BASE = 'http://localhost:5000/api'

export async function fetchTasks() {
  const res = await fetch(`${API_BASE}/tasks`)
  return res.json()
}