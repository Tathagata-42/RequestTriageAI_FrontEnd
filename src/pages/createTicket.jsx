import React from "react";
import { createTicket } from "../lib/api";

function cn(...x) { return x.filter(Boolean).join(" "); }

function Card({ className, children }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5", className)}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <div className="text-xs text-white/60 mb-1">{children}</div>;
}

function Input(props) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none",
        "placeholder:text-white/30 focus:border-white/25",
        props.className
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
        "placeholder:text-white/30 focus:border-white/25 min-h-[120px]",
        props.className
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
        props.className
      )}
    />
  );
}

export default function CreateTicket() {
  const [form, setForm] = React.useState({
    email: "tatha@example.com",
    name: "Tatha",
    department: "Deloitte",
    title: "",
    description: "",
    affectedSystem: "",
    isBlocking: false,
    requestedTimeline: "ASAP", // ASAP | TODAY | THIS_WEEK | NO_RUSH
    tryKbFirst: true,
  });

  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [result, setResult] = React.useState(null);

  function update(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setResult(null);
    setLoading(true);
    try {
      const res = await createTicket(form);
      setResult(res);
      // keep title/description, or clear them:
      update("title", "");
      update("description", "");
      update("affectedSystem", "");
      update("isBlocking", false);
    } catch (e2) {
      setErr(e2?.message || String(e2));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 space-y-4">
      <div>
        <div className="text-xl font-semibold text-white">Create Ticket</div>
        <div className="text-sm text-white/60">Submit a request — AI will triage team, priority, and suggestions.</div>
      </div>

      <Card>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Email *</Label>
            <Input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@company.com" />
          </div>

          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" />
          </div>

          <div>
            <Label>Department</Label>
            <Input value={form.department} onChange={(e) => update("department", e.target.value)} placeholder="HR / IT / Ops..." />
          </div>

          <div>
            <Label>Affected System</Label>
            <Input value={form.affectedSystem} onChange={(e) => update("affectedSystem", e.target.value)} placeholder="Payroll portal, VPN, Laptop..." />
          </div>

          <div className="md:col-span-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Short summary of the issue" />
          </div>

          <div className="md:col-span-2">
            <Label>Description *</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Explain what happened, error message, urgency, etc." />
          </div>

          <div>
            <Label>Requested Timeline</Label>
            <Select value={form.requestedTimeline} onChange={(e) => update("requestedTimeline", e.target.value)}>
              <option value="ASAP">ASAP</option>
              <option value="TODAY">Today</option>
              <option value="THIS_WEEK">This week</option>
              <option value="NO_RUSH">No rush</option>
            </Select>
          </div>

          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={form.isBlocking}
                onChange={(e) => update("isBlocking", e.target.checked)}
                className="h-4 w-4"
              />
              Work is blocked
            </label>

            <label className="flex items-center gap-2 text-sm text-white/60 ml-4">
              <input
                type="checkbox"
                checked={form.tryKbFirst}
                onChange={(e) => update("tryKbFirst", e.target.checked)}
                className="h-4 w-4"
              />
              Tried KB first
            </label>
          </div>

          <div className="md:col-span-2 flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-white/15 bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>

            {err ? <div className="text-sm text-red-300">{err}</div> : null}
          </div>
        </form>
      </Card>

      {result ? (
        <Card className="border-white/15">
          <div className="text-sm text-white/70">Created</div>
          <div className="mt-1 text-white font-semibold">{result.id}</div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs text-white/60">Assigned Team</div>
              <div className="text-sm text-white mt-1">{result.assignedTeam}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs text-white/60">Priority</div>
              <div className="text-sm text-white mt-1">{result.priority}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs text-white/60">SLA Due</div>
              <div className="text-sm text-white mt-1">{new Date(result.slaDueAt).toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold text-white">AI Suggestions</div>
            {result.knowledgeSuggestions?.length ? (
              <div className="mt-2 space-y-2">
                {result.knowledgeSuggestions.map((k, idx) => (
                  <div key={idx} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-sm text-white">{k.title}</div>
                    <div className="text-xs text-white/60 mt-1">{k.reason}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-white/60 mt-1">No suggestions returned.</div>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
