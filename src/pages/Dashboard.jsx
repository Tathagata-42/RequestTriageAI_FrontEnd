// Dashboard.jsx
import React from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  Cell,
} from "recharts";

import {
  getAnalytics,
  getTickets,
  updateTicket,
  getTicketComments,
  // Admin APIs
  adminSearchUsers,
  adminSetUserRole,
  // NEW: who am I?
  getMe,
} from "../lib/api";

function cn(...x) {
  return x.filter(Boolean).join(" ");
}

function Card({ className, children }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <Card>
      <div className="text-sm text-white/60">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {value ?? "-"}
      </div>
      {sub ? <div className="mt-1 text-xs text-white/50">{sub}</div> : null}
    </Card>
  );
}

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm border transition",
        active
          ? "bg-white text-black border-white"
          : "bg-transparent text-white/80 border-white/15 hover:border-white/30 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function SectionTitle({ title, desc }) {
  return (
    <div className="mb-3">
      <div className="text-lg font-semibold text-white">{title}</div>
      {desc ? <div className="text-sm text-white/60 mt-0.5">{desc}</div> : null}
    </div>
  );
}

function toChartData(obj = {}) {
  return Object.entries(obj).map(([name, value]) => ({ name, value }));
}

const PALETTE = [
  "#22c55e",
  "#38bdf8",
  "#a78bfa",
  "#f59e0b",
  "#fb7185",
  "#94a3b8",
];
function colorForIndex(i) {
  return PALETTE[i % PALETTE.length];
}

function prettyLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

// Frontend UX-only (backend still enforces)
const ALLOWED = {
  NEW: ["IN_PROGRESS"],
  IN_PROGRESS: ["WAITING", "RESOLVED"],
  WAITING: ["IN_PROGRESS"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

function FieldLabel({ children }) {
  return <div className="text-xs text-white/60 mb-1">{children}</div>;
}

function Input(props) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none",
        "placeholder:text-white/30 focus:border-white/25",
        props.className,
        props.disabled && "opacity-60 cursor-not-allowed"
      )}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none",
        "focus:border-white/25",
        props.className,
        props.disabled && "opacity-60 cursor-not-allowed"
      )}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none",
        "placeholder:text-white/30 focus:border-white/25 min-h-[110px]",
        props.className,
        props.disabled && "opacity-60 cursor-not-allowed"
      )}
    />
  );
}

function Badge({ tone = "neutral", children }) {
  const cls =
    tone === "danger"
      ? "border-red-400/40 bg-red-400/10 text-red-200"
      : tone === "success"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
      : "border-white/15 bg-white/5 text-white/80";

  return (
    <span className={cn("px-2 py-1 rounded-lg border text-xs", cls)}>
      {children}
    </span>
  );
}

function TicketDrawer({ open, onClose, ticket, actorEmail, actorRole, onSaved }) {
  const [status, setStatus] = React.useState("");
  const [priority, setPriority] = React.useState("");
  const [assignedTeam, setAssignedTeam] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");

  // comments
  const [comments, setComments] = React.useState([]);
  const [cLoading, setCLoading] = React.useState(false);

  const isRequester = (actorRole || "REQUESTER") === "REQUESTER";

  React.useEffect(() => {
    if (!ticket) return;
    setStatus(ticket.status);
    setPriority(ticket.priority);
    setAssignedTeam(ticket.assigned_team);
    setComment("");
    setErr("");
  }, [ticket]);

  React.useEffect(() => {
    let alive = true;

    async function load() {
      if (!ticket?.id) return;
      setCLoading(true);
      try {
        const r = await getTicketComments(ticket.id);
        if (alive) setComments(r.comments || []);
      } catch {
        if (alive) setComments([]);
      } finally {
        if (alive) setCLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [ticket?.id]);

  if (!open || !ticket) return null;

  const allowedNext = ALLOWED[ticket.status] || [];

  const requesterTriedToChangeLockedFields =
    isRequester &&
    ((priority && priority !== ticket.priority) ||
      (assignedTeam && assignedTeam !== ticket.assigned_team));

  async function save() {
    setSaving(true);
    setErr("");
    try {
      const payload = { actorEmail };

      // only send changed fields
      if (status && status !== ticket.status) payload.status = status;

      // send these ONLY if not requester (UI disabled, but extra safe)
      if (!isRequester) {
        if (priority && priority !== ticket.priority) payload.priority = priority;
        if (assignedTeam && assignedTeam !== ticket.assigned_team)
          payload.assignedTeam = assignedTeam;
      }

      if (comment.trim()) payload.comment = comment.trim();

      const res = await updateTicket(ticket.id, payload);
      onSaved(res.ticket);

      // refresh comments
      try {
        const r = await getTicketComments(ticket.id);
        setComments(r.comments || []);
      } catch {
        // ignore
      }

      setComment("");
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[560px] border-l border-white/10 bg-[#0B0F14]">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-white/50">Ticket</div>
              <div className="text-lg font-semibold text-white mt-1">
                {ticket.title}
              </div>
              <div className="text-xs text-white/50 mt-1 break-all">
                {ticket.id}
              </div>

              <div className="mt-2 text-xs text-white/50">
                You are:{" "}
                <span className="text-white/70">{actorRole || "REQUESTER"}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 text-sm hover:border-white/30"
            >
              Close
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-auto flex-1 space-y-4">
            {/* Ticket summary */}
            <Card className="p-4">
              <div className="flex flex-wrap gap-2">
                <Badge>{prettyLabel(ticket.status)}</Badge>
                <Badge>{ticket.priority}</Badge>
                <Badge
                  tone={ticket.sla_status === "BREACHED" ? "danger" : "neutral"}
                >
                  {prettyLabel(ticket.sla_status)}
                </Badge>
                <Badge tone="success">{ticket.assigned_team}</Badge>
              </div>

              <div className="mt-3 text-sm text-white/80 whitespace-pre-wrap">
                {ticket.description}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-white/60">
                <div>
                  <div className="text-white/40">Created</div>
                  <div>{new Date(ticket.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-white/40">SLA Due</div>
                  <div>
                    {ticket.sla_due_at
                      ? new Date(ticket.sla_due_at).toLocaleString()
                      : "-"}
                  </div>
                </div>
              </div>
            </Card>

            {/* AI Summary */}
            <Card className="p-4">
              <div className="text-sm font-semibold text-white">AI Summary</div>
              <div className="mt-2 space-y-2 text-sm text-white/75">
                <div>
                  <div className="text-xs text-white/50">Problem</div>
                  <div>{ticket.ai_summary_problem || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Impact</div>
                  <div>{ticket.ai_summary_impact || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Requested Action</div>
                  <div>{ticket.ai_summary_action || "-"}</div>
                </div>
              </div>
            </Card>

            {/* Comments feed */}
            <Card className="p-4">
              <div className="text-sm font-semibold text-white">Comments</div>

              {cLoading ? (
                <div className="mt-2 text-sm text-white/60">Loading...</div>
              ) : comments.length === 0 ? (
                <div className="mt-2 text-sm text-white/60">No comments yet.</div>
              ) : (
                <div className="mt-3 space-y-3">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-white/70">
                          {c.author?.name || c.author?.email || "Unknown user"}
                        </div>
                        <div className="text-xs text-white/40">
                          {new Date(c.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-white/80 whitespace-pre-wrap">
                        {c.body}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Update */}
            <Card className="p-4">
              <div className="text-sm font-semibold text-white">Update Ticket</div>

              <div className="mt-3 grid grid-cols-1 gap-3">
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value={ticket.status}>
                      {prettyLabel(ticket.status)} (current)
                    </option>
                    {allowedNext.map((s) => (
                      <option key={s} value={s}>
                        {prettyLabel(s)}
                      </option>
                    ))}
                  </Select>
                  <div className="text-xs text-white/40 mt-1">
                    Allowed next:{" "}
                    {allowedNext.length
                      ? allowedNext.map(prettyLabel).join(", ")
                      : "None"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Priority</FieldLabel>
                    <Select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      disabled={isRequester}
                      title={isRequester ? "Requesters cannot change priority" : ""}
                    >
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </Select>
                    {isRequester ? (
                      <div className="text-xs text-white/40 mt-1">
                        Disabled: Requesters can’t change priority. (Admins/Agents can)
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <FieldLabel>Assigned Team</FieldLabel>
                    <Input
                      value={assignedTeam}
                      onChange={(e) => setAssignedTeam(e.target.value)}
                      disabled={isRequester}
                      placeholder="HR / People Ops"
                      title={isRequester ? "Requesters cannot reassign team" : ""}
                    />
                    {isRequester ? (
                      <div className="text-xs text-white/40 mt-1">
                        Disabled: Requesters can’t reassign the team. (Admins/Agents can)
                      </div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <FieldLabel>Add Comment</FieldLabel>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add context, updates, blockers, etc."
                  />
                  <div className="text-xs text-white/40 mt-1">
                    Tip: Hit “Save Changes” to persist updates + comment.
                  </div>
                </div>

                {requesterTriedToChangeLockedFields ? (
                  <div className="text-sm text-amber-200">
                    You’re a REQUESTER — priority/team changes won’t be sent. Status + comments will save.
                  </div>
                ) : null}

                {err ? <div className="text-sm text-red-300">{err}</div> : null}

                <button
                  onClick={save}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-white/15 bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 text-xs text-white/40">
            Actor email used for updates:{" "}
            <span className="text-white/60">{actorEmail}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------- Admin View UI --------------------
function AdminPanel({ meRole }) {
  const [adminKey, setAdminKey] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [okMsg, setOkMsg] = React.useState("");

  // per-row edits
  const [roleDraft, setRoleDraft] = React.useState({});
  const [nameDraft, setNameDraft] = React.useState({});
  const [deptDraft, setDeptDraft] = React.useState({});
  const [savingId, setSavingId] = React.useState("");

  const isAdmin = (meRole || "REQUESTER") === "ADMIN";
  const isUnlocked = isAdmin && !!adminKey.trim();

  async function search() {
    setLoading(true);
    setErr("");
    setOkMsg("");
    try {
      const r = await adminSearchUsers({
        adminKey: adminKey.trim(),
        query: query.trim(),
      });

      setUsers(r.users || []);

      const rd = {};
      const nd = {};
      const dd = {};
      for (const u of r.users || []) {
        rd[u.id] = u.role || "REQUESTER";
        nd[u.id] = u.name || "";
        dd[u.id] = u.department || "";
      }
      setRoleDraft(rd);
      setNameDraft(nd);
      setDeptDraft(dd);

      setOkMsg(`Loaded ${(r.users || []).length} user(s).`);
    } catch (e) {
      setUsers([]);
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function saveRow(u) {
    setSavingId(u.id);
    setErr("");
    setOkMsg("");
    try {
      const role = roleDraft[u.id] || u.role || "REQUESTER";
      const name = nameDraft[u.id] ?? "";
      const department = deptDraft[u.id] ?? "";

      const r = await adminSetUserRole({
        adminKey: adminKey.trim(),
        email: u.email,
        role,
        name,
        department,
      });

      const updated = r.user;
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setOkMsg(`Updated ${updated.email} → ${updated.role}`);
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setSavingId("");
    }
  }

  return (
    <Card>
      <SectionTitle
        title="Admin View: Roles & Access"
        desc="Admins can assign roles: REQUESTER (default), AGENT, ADMIN."
      />

      {/* Always visible but disabled if not admin */}
      <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
        <div className="text-white/80">
          Status:{" "}
          {isAdmin ? (
            <span className="text-emerald-200">ADMIN unlocked (enter Admin Key to use)</span>
          ) : (
            <span className="text-amber-200">
              Disabled — your role is <span className="text-white/80">{meRole || "REQUESTER"}</span>
            </span>
          )}
        </div>
        <div className="text-xs text-white/50 mt-1">
          This panel stays visible for everyone, but actions are disabled unless you’re ADMIN.
        </div>
      </div>

      <div className={cn(!isAdmin && "opacity-60")}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <FieldLabel>Admin Key</FieldLabel>
            <Input
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Paste ADMIN_KEY here"
              disabled={!isAdmin}
            />
            <div className="text-xs text-white/40 mt-1">
              Backend checks this via header{" "}
              <span className="text-white/60">x-admin-key</span>.
            </div>
          </div>

          <div className="md:col-span-2">
            <FieldLabel>Search (email or name)</FieldLabel>
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. tatha@company.com"
                disabled={!isAdmin}
              />
              <button
                onClick={search}
                disabled={!isUnlocked || loading}
                className="px-4 py-2 rounded-xl border border-white/15 bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-60"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            <div className="mt-2">
              {err ? <div className="text-sm text-red-300">{err}</div> : null}
              {okMsg ? <div className="text-sm text-emerald-200">{okMsg}</div> : null}
              {!isAdmin ? (
                <div className="text-xs text-white/50 mt-1">
                  Ask an ADMIN to grant you AGENT/ADMIN if needed.
                </div>
              ) : null}
              {isAdmin && !adminKey.trim() ? (
                <div className="text-xs text-white/50 mt-1">
                  Enter Admin Key to enable search & save.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Department</th>
                <th className="text-left p-3 font-medium">Role</th>
                <th className="text-left p-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {!isAdmin ? (
                <tr>
                  <td className="p-4 text-white/60" colSpan={5}>
                    Disabled: Only ADMIN can manage roles.
                  </td>
                </tr>
              ) : !adminKey.trim() ? (
                <tr>
                  <td className="p-4 text-white/60" colSpan={5}>
                    Enter Admin Key to unlock admin actions.
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="p-4 text-white/60" colSpan={5}>
                    No users loaded yet. Search to view users.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="p-3 text-white/80">{u.email}</td>

                    <td className="p-3">
                      <Input
                        value={nameDraft[u.id] ?? ""}
                        onChange={(e) =>
                          setNameDraft((p) => ({ ...p, [u.id]: e.target.value }))
                        }
                        placeholder="Name"
                        className="bg-black/10"
                        disabled={!isUnlocked}
                      />
                    </td>

                    <td className="p-3">
                      <Input
                        value={deptDraft[u.id] ?? ""}
                        onChange={(e) =>
                          setDeptDraft((p) => ({ ...p, [u.id]: e.target.value }))
                        }
                        placeholder="Department"
                        className="bg-black/10"
                        disabled={!isUnlocked}
                      />
                    </td>

                    <td className="p-3">
                      <Select
                        value={roleDraft[u.id] || u.role || "REQUESTER"}
                        onChange={(e) =>
                          setRoleDraft((p) => ({ ...p, [u.id]: e.target.value }))
                        }
                        className="bg-black/10"
                        disabled={!isUnlocked}
                      >
                        <option value="REQUESTER">REQUESTER</option>
                        <option value="AGENT">AGENT</option>
                        <option value="ADMIN">ADMIN</option>
                      </Select>
                      <div className="text-xs text-white/40 mt-1">
                        Current:{" "}
                        <span className="text-white/60">
                          {u.role || "REQUESTER"}
                        </span>
                      </div>
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => saveRow(u)}
                        disabled={!isUnlocked || savingId === u.id}
                        className="px-3 py-1.5 rounded-xl border border-white/15 bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-60"
                      >
                        {savingId === u.id ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-white/40">
          Tip: Anyone not in <span className="text-white/60">users</span> table will become{" "}
          <span className="text-white/60">REQUESTER</span> automatically when they create their first ticket.
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [scope, setScope] = React.useState("my"); // my | team | all
  const [email, setEmail] = React.useState("tatha@example.com");
  const [team, setTeam] = React.useState("HR / People Ops");

  const actorEmail = email;

  const [meRole, setMeRole] = React.useState("REQUESTER");

  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  const [kpis, setKpis] = React.useState({ total: 0, open: 0, breached: 0 });
  const [charts, setCharts] = React.useState({
    byStatus: {},
    byPriority: {},
    bySla: {},
    byTeam: {},
  });
  const [tickets, setTickets] = React.useState([]);

  const [selected, setSelected] = React.useState(null);

  async function refresh() {
    setLoading(true);
    setErr("");
    try {
      const ctx = {
        scope,
        email: scope === "my" ? email : "",
        team: scope === "team" ? team : "",
      };

      const [a, t, me] = await Promise.all([
        getAnalytics(ctx),
        getTickets(ctx),
        getMe({ email: actorEmail }),
      ]);

      setKpis(a.kpis || { total: 0, open: 0, breached: 0 });
      setCharts(
        a.charts || { byStatus: {}, byPriority: {}, bySla: {}, byTeam: {} }
      );
      setTickets(t.tickets || []);
      setMeRole(me?.user?.role || "REQUESTER");
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, email, team]);

  const statusData = toChartData(charts.byStatus).map((d) => ({
    ...d,
    name: prettyLabel(d.name),
  }));

  const priorityData = toChartData(charts.byPriority).map((d) => ({
    ...d,
    name: prettyLabel(d.name),
  }));

  const legendFormatter = (value) => (
    <span className="text-white/70 text-xs">{value}</span>
  );

  const tooltipStyle = {
    background: "rgba(10, 14, 20, 0.95)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    color: "white",
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-6 space-y-6">
      <TicketDrawer
        open={!!selected}
        ticket={selected}
        actorEmail={actorEmail}
        actorRole={meRole}
        onClose={() => setSelected(null)}
        onSaved={() => refresh()}
      />

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold">Dashboard</div>
          <div className="text-sm text-white/60">
            Click any ticket row to open details & update
          </div>
          <div className="text-xs text-white/50 mt-1">
            Current role for{" "}
            <span className="text-white/70">{actorEmail}</span>:{" "}
            <span className="text-white/70">{meRole}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Pill active={scope === "my"} onClick={() => setScope("my")}>
            My
          </Pill>
          <Pill active={scope === "team"} onClick={() => setScope("team")}>
            Team
          </Pill>
          <Pill active={scope === "all"} onClick={() => setScope("all")}>
            All
          </Pill>

          <button
            onClick={refresh}
            className="ml-2 px-3 py-1.5 rounded-xl border border-white/15 hover:border-white/30 bg-white/5 text-sm"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Scope inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          className={cn(
            "rounded-2xl border border-white/10 bg-white/5 p-3",
            scope !== "my" && "opacity-40"
          )}
        >
          <div className="text-xs text-white/60 mb-1">
            Requester Email (scope=my)
          </div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={scope !== "my"}
            className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/30"
            placeholder="you@company.com"
          />
        </div>

        <div
          className={cn(
            "rounded-2xl border border-white/10 bg-white/5 p-3",
            scope !== "team" && "opacity-40"
          )}
        >
          <div className="text-xs text-white/60 mb-1">Team (scope=team)</div>
          <input
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            disabled={scope !== "team"}
            className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/30"
            placeholder="HR / People Ops"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/0 p-3">
          <div className="text-xs text-white/60 mb-1">Status</div>
          <div className="text-sm text-white/80">
            {err ? <span className="text-red-300">{err}</span> : "Connected"}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Total Tickets" value={kpis.total} />
        <Stat label="Open Tickets" value={kpis.open} sub="Total - Closed" />
        <Stat label="SLA Breached" value={kpis.breached} sub="Needs attention" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle
            title="Tickets by Status"
            desc="Distribution across lifecycle states"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={colorForIndex(i)} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend formatter={legendFormatter} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Tickets by Priority"
            desc="High / Medium / Low split"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend formatter={legendFormatter} />
                <Bar dataKey="value" name="Tickets">
                  {priorityData.map((_, i) => (
                    <Cell key={i} fill={colorForIndex(i)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ✅ Admin View (Visible to all, disabled for non-admin) */}
      <AdminPanel meRole={meRole} />

      {/* Tickets table */}
      <Card>
        <SectionTitle title="Latest Tickets" desc="Click a row to open details" />

        <div className="overflow-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Team</th>
                <th className="text-left p-3 font-medium">Priority</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">SLA</th>
                <th className="text-left p-3 font-medium">Created</th>
              </tr>
            </thead>

            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td className="p-4 text-white/60" colSpan={6}>
                    No tickets found for this scope.
                  </td>
                </tr>
              ) : (
                tickets.slice(0, 30).map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="border-t border-white/10 hover:bg-white/5 cursor-pointer"
                  >
                    <td className="p-3">
                      <div className="text-white">{t.title}</div>
                      {(t.ai_summary_problem || t.ai_summary_action) && (
                        <div className="text-xs text-white/50 mt-1 line-clamp-1">
                          {t.ai_summary_problem || t.ai_summary_action}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-white/80">{t.assigned_team}</td>

                    <td className="p-3">
                      <span className="px-2 py-1 rounded-lg border border-white/15 bg-white/5">
                        {t.priority}
                      </span>
                    </td>

                    <td className="p-3 text-white/80">{prettyLabel(t.status)}</td>

                    <td className="p-3">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-lg border text-xs",
                          t.sla_status === "BREACHED"
                            ? "border-red-400/40 bg-red-400/10 text-red-200"
                            : "border-white/15 bg-white/5 text-white/80"
                        )}
                      >
                        {prettyLabel(t.sla_status)}
                      </span>
                    </td>

                    <td className="p-3 text-white/60">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}