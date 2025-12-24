const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:3001";

// ---------- helper: consistent error handling ----------
async function throwIfNotOk(res) {
  if (res.ok) return;

  // Try JSON error first (your backend often sends { error: "..." })
  try {
    const data = await res.json();
    if (data?.error) throw new Error(data.error);
    throw new Error(JSON.stringify(data));
  } catch {
    // Fallback to text
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed with status ${res.status}`);
  }
}

// -------------------- Tickets / Analytics --------------------
export async function getAnalytics({ scope, email, team }) {
  const params = new URLSearchParams();
  params.set("scope", scope);
  if (email) params.set("email", email);
  if (team) params.set("team", team);

  const res = await fetch(`${BASE_URL}/api/analytics?${params.toString()}`);
  await throwIfNotOk(res);
  return res.json();
}

export async function getTickets({ scope, email, team }) {
  const params = new URLSearchParams();
  params.set("scope", scope);
  if (email) params.set("email", email);
  if (team) params.set("team", team);

  const res = await fetch(`${BASE_URL}/api/tickets?${params.toString()}`);
  await throwIfNotOk(res);
  return res.json();
}

export async function createTicket(payload) {
  const res = await fetch(`${BASE_URL}/api/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function updateTicket(ticketId, payload) {
  const res = await fetch(`${BASE_URL}/api/tickets/${ticketId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function getTicketComments(ticketId) {
  const res = await fetch(`${BASE_URL}/api/tickets/${ticketId}/comments`);
  await throwIfNotOk(res);
  return res.json();
}

export async function getTicketActivity(ticketId) {
  const res = await fetch(`${BASE_URL}/api/tickets/${ticketId}/activity`);
  await throwIfNotOk(res);
  return res.json(); // { ticketId, timeline: [] }
}

// -------------------- Identity --------------------
export async function getMe({ email }) {
  const params = new URLSearchParams();
  if (email) params.set("email", email);

  const res = await fetch(`${BASE_URL}/api/me?${params.toString()}`);
  await throwIfNotOk(res);
  return res.json(); // { user: { id,email,name,role,department } }
}

// -------------------- Admin (role management) --------------------
export async function adminSearchUsers({ adminKey, query }) {
  const params = new URLSearchParams();
  if (query) params.set("query", query);

  const res = await fetch(`${BASE_URL}/api/admin/users?${params.toString()}`, {
    headers: { "x-admin-key": adminKey },
  });
  await throwIfNotOk(res);
  return res.json(); // { users: [] }
}

export async function adminSetUserRole({ adminKey, email, role, name, department }) {
  const res = await fetch(`${BASE_URL}/api/admin/users/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
    },
    body: JSON.stringify({ email, role, name, department }),
  });
  await throwIfNotOk(res);
  return res.json(); // { ok: true, user: {...} }
}