import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CreateTicket from "./pages/createTicket";

function cn(...x) {
  return x.filter(Boolean).join(" ");
}

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "block px-3 py-2 rounded-xl text-sm border transition",
          isActive
            ? "bg-white/5 border-white/10 text-white"
            : "border-transparent text-white/60 hover:text-white hover:bg-white/5 hover:border-white/10"
        )
      }
    >
      {label}
    </NavLink>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-72 min-h-screen border-r border-white/10 bg-black/20">
          <div className="p-6 w-full">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                <span className="text-sm font-semibold">RT</span>
              </div>
              <div>
                <div className="font-semibold leading-tight">Request Triage</div>
                <div className="text-xs text-white/50">ServiceNow alternative</div>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <NavItem to="/" label="Dashboard" />
              <NavItem to="/create" label="Create Ticket" />
            </div>

            <div className="mt-10 text-xs text-white/40 space-y-1">
              <div>
                Backend: <span className="text-white/60">http://localhost:3001</span>
              </div>
              <div>
                Frontend: <span className="text-white/60">http://localhost:5173</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          {/* Topbar */}
          <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0B0F14]/80 backdrop-blur">
            <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold">Request Triage</div>
                <div className="text-sm text-white/60">AI triage + SLA + dashboards</div>
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateTicket />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}