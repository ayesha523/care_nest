# CareNest

CareNest is a role-based care marketplace where:
- Elderly users can browse and request companions.
- Companion users can review and accept targeted requests.

This project uses a **local MongoDB database** (no cloud DB dependency).

## Tech Stack
- Frontend: React + React Router
- Backend: Express + Mongoose
- Auth: JWT + role-based route protection

## Local Setup

1) Install dependencies

```bash
npm install
```

2) Make sure local MongoDB is running on default port

```bash
mongodb://127.0.0.1:27017
```

3) Create/update `.env`

```env
MONGO_URI=mongodb://127.0.0.1:27017/carenest
JWT_SECRET=change_this_to_a_long_random_secret_key
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

4) Run backend + frontend together

```bash
npm run dev
```

5) Open app

```text
http://localhost:3000
```

## Scripts
- `npm run dev` → runs backend + frontend
- `npm run server` → runs backend only
- `npm start` → runs frontend only
- `npm run build` → production build

## Security & Access
- Auth endpoints return JWT token on signup/login.
- Marketplace endpoints require Bearer token.
- Role rules:
	- Elderly: create care requests
	- Companion: fetch/accept assigned requests
	- Both roles: browse companion listings
