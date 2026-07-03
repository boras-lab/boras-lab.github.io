# TaskFlow — Frontend (React + Vite)

Web client for TaskFlow. Public landing page + authenticated role-aware app.

## Stack
- React 19 + Vite
- React Router 7
- axios (JWT access/refresh interceptor)
- Tailwind CSS 4 (`@tailwindcss/vite`)
- i18next / react-i18next — 3 languages: **en / ru / kk** (Kazakh, shown "KZ")
- Light/dark theme via semantic CSS-variable tokens (`bg-bg`, `text-text`, …)

## i18n & theme
- Language + theme live in `PreferencesContext`; a switch sits in every header.
- Persisted to `localStorage` and synced to the backend (`PATCH /api/auth/me/`)
  when signed in; the user's server prefs are adopted on login.
- Theme toggles the `.dark` class on `<html>`; tokens are defined in `index.css`.
- Strings live in `src/i18n/index.js`.

## Quick start
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```
The dev server proxies `/api` → `http://localhost:8000` (Django), so **start the
backend too** (see `../backend/README.md`). No CORS/config needed in dev.

Build: `npm run build` · Preview: `npm run preview` · Lint: `npm run lint`

## Routes
| Path | Access | Purpose |
|---|---|---|
| `/` | public | Landing — stats + current-project progress from `/api/public/dashboard/` |
| `/login` | public | Sign in (JWT) |
| `/register` | public | Self-serve sign up (Member / Team Lead) |
| `/dashboard` | protected | My projects + my tasks; Head can create projects |
| `/projects/:id` | protected | Project detail: Kanban board, team, instructions, task modal w/ comments |

Signed-in users hitting `/` are redirected to `/dashboard`; unauthenticated
users hitting `/dashboard` are redirected to `/` (see `ProtectedRoute`).

## Structure
```
src/
├── api/client.js           # axios instance, token storage, refresh interceptor
├── context/AuthContext.jsx # user state, login/register/logout, bootstrap /me
├── components/
│   └── ProtectedRoute.jsx
├── pages/
│   ├── LandingPage.jsx      # public dashboard
│   ├── LoginPage.jsx        # + shared AuthShell/Field
│   ├── RegisterPage.jsx
│   └── DashboardPage.jsx
└── App.jsx                  # routes
```

## Config
- `VITE_API_BASE` (see `.env.example`) — empty in dev (uses proxy); set to the
  API origin in production.

## Not yet (see ../task.md §2)
- Filters/search on tasks
- Richer role-aware navigation (per-role menus)
