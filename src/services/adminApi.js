// Admin API helper — talks to the FastAPI backend admin endpoints using the
// admin's JWT (stored in localStorage under 'ixope-token').
import { SERVER_URL } from '../config/device'

function authHeaders(extra = {}) {
  const token = localStorage.getItem('ixope-token')
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function handle(res) {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const data = await res.json()
      detail = data.detail || detail
    } catch {
      /* ignore */
    }
    const err = new Error(detail)
    err.status = res.status
    throw err
  }
  // 204 / empty body safety
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export async function adminLogin(username, password) {
  const res = await fetch(`${SERVER_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return handle(res) // { access_token, token_type, user }
}

// ─── Devices ─────────────────────────────────────────────────────────────────
export async function listDevices() {
  return handle(await fetch(`${SERVER_URL}/admin/devices`, { headers: authHeaders() }))
}

export async function registerDevice({ device_id, name, username, password } = {}) {
  const res = await fetch(`${SERVER_URL}/admin/devices`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ device_id, name, username, password }),
  })
  return handle(res) // { device_id, name, username, password }
}

export async function resetDeviceCredentials(deviceId, { username, password } = {}) {
  const res = await fetch(`${SERVER_URL}/admin/devices/${deviceId}/reset-credentials`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ username, password }),
  })
  return handle(res)
}

export async function deleteDevice(deviceId) {
  const res = await fetch(`${SERVER_URL}/admin/devices/${deviceId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handle(res)
}

// ─── Users ───────────────────────────────────────────────────────────────────
export async function listUsers() {
  return handle(await fetch(`${SERVER_URL}/admin/users`, { headers: authHeaders() }))
}

export async function createUser({ email, username, password, full_name, role }) {
  const res = await fetch(`${SERVER_URL}/admin/users`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ email, username, password, full_name, role }),
  })
  return handle(res)
}

export async function deleteUser(userId) {
  const res = await fetch(`${SERVER_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handle(res)
}
