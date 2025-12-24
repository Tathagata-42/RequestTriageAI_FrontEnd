const BASE = "http://localhost:3001";

export async function getTicketActivity(ticketId) {
  const r = await fetch(`${BASE}/api/tickets/${ticketId}/activity`);
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { ticketId, timeline: [] }
}