# Check It — Frontend

React 18 + TypeScript + Vite single-page application for the Check It device registry platform.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 6
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS 3 + CSS Variables (dark/light theme)
- **State:** React Context (Auth, Theme, Toast)
- **Animations:** Framer Motion
- **Icons:** Lucide React, React Icons

## Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── admin/           # Admin-specific components
│   └── mobile/          # QR, NFC components
├── contexts/            # AuthContext, ThemeContext, ToastContext
├── lib/                 # ApiClient (fetch wrapper), client context
├── pages/               # 50+ page components
│   └── admin/           # Admin pages
├── services/            # Device fingerprint, geolocation, mobile bridge
├── types/               # TypeScript interfaces & type definitions
└── utils/               # Theme utilities
```

## Development

```bash
npm install
npm run dev        # Dev server on port 5173
npm run build      # Production build to dist/
npm run preview    # Preview production build
npm test           # Run Jest tests
```

## Environment

```env
VITE_API_URL=http://localhost:3006/api
VITE_API_BASE_URL=http://localhost:3006
```

The dev server proxies `/api` requests to the backend via Vite's proxy config.

## Pages

| Route | Page | Access |
|-------|------|--------|
| `/` | Landing | Public |
| `/login`, `/register` | Auth | Public |
| `/dashboard` | User dashboard | Auth |
| `/register-device` | Device registration | Auth |
| `/my-devices` | Device list | Auth |
| `/reports` | Report history | Auth |
| `/device-check` | Public device check | Public |
| `/marketplace/browse` | Browse listings | Public |
| `/marketplace/create-listing` | Create listing | Business |
| `/checkout` | Purchase flow | Auth |
| `/orders` | Buyer orders | Auth |
| `/business` | Seller dashboard | Business |
| `/admin` | Admin dashboard | Admin |
| `/user-management` | User management | Admin |
| `/admin/system-settings` | System config | Admin |
| `/admin/lea-management` | LEA directory | Admin |
| `/analytics` | Platform analytics | Admin |
| `/lea` | LEA portal | LEA |
| `/lea/cases` | Case management | LEA |

## Notes

- `lib/apiClient.ts` is the API client — connects to the Express backend via fetch
- All API calls use `fetch()` directly with JWT Bearer tokens
- Role gating via `Layout` component with `allowedRoles` prop
- See root `README.md` for full project documentation
