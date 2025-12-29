# Request Triage AI — Frontend

A modern, minimal, and intuitive frontend interface for **Request Triage AI**, designed to manage internal requests with clarity, speed, and AI-assisted insights.

This UI focuses on real-world usability: clear dashboards, role-aware actions, and smooth ticket interactions — without unnecessary complexity.

---

## What This Frontend Does

### Dashboard
- Displays key metrics:
  - Total tickets
  - Open tickets
  - SLA-breached tickets
- Visual analytics for:
  - Ticket status distribution
  - Priority breakdown
- Supports scoped views:
  - **My tickets**
  - **Team tickets**
  - **All tickets**

### Ticket Management
- Click any ticket to open a detailed side drawer
- View:
  - Ticket description
  - SLA status and due time
  - Assigned team and priority
- Update ticket status following allowed workflow transitions
- Add comments for discussion and updates

### AI Assistance
- Shows AI-generated summaries for each ticket:
  - Problem summary
  - Impact
  - Requested action
- Designed to help agents understand context faster

### Role-Aware Experience
- Automatically adapts UI based on user role:
  - **Requester**
  - **Agent**
  - **Admin**
- Restricted actions are **disabled (not hidden)** for transparency
- Backend remains the source of truth for permissions

### Admin Capabilities (UI-Level)
- View users
- Assign roles (Requester / Agent / Admin)
- Update basic user details
- Protected via admin key (checked by backend)

---

## Tech Used

- React (Vite)
- Tailwind CSS
- Recharts for analytics
- JavaScript (JSX)

---

## Environment Configuration

The frontend communicates with the backend via an environment variable:

```env
VITE_API_BASE=https://requesttriageai-3.onrender.com
```

---

## Deployment

The frontend is deployed using **Vercel**.

- Build tool: Vite
- Hosting: Vercel
- Environment variable required:

```env
VITE_API_BASE=https://requesttriageai-3.onrender.com
