# DentalOS (Next.js + Supabase)

DentalOS is now fully implemented in **Next.js** with Supabase for authentication and PostgreSQL.

## Stack
- Next.js App Router (frontend + API routes)
- TypeScript + Tailwind + Recharts
- Supabase Auth (JWT)
- Supabase Postgres (tables + seed)
- OpenAI SDK (AI recommendation endpoint)

## Required Environment Variables
Create `frontend/.env` from `frontend/.env.example` and set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `OPENAI_API_KEY` (optional)

If you see `ENETUNREACH ... :5432`, your environment cannot reach IPv6 DB hosts.
Use Supabase **Connection pooling** `DATABASE_URL` (pooler host) from Supabase dashboard.
If your DB password contains `@`, encode it as `%40` in `DATABASE_URL`.

Node version: use Node `20+` (Node 18 may install with warnings and can fail at runtime).

## Run Entire Project
```bash
./start_project.sh
```

This command will:
1. Install Node dependencies
2. Initialize DB tables (`npm run db:init`)
3. Seed demo data and demo auth users (`npm run db:seed`)
4. Start Next.js app at `http://localhost:3001` (or `APP_PORT` if provided)

## Demo Login
- `admin@dentalos.dev / password123`
- `provider@dentalos.dev / password123`
- `frontdesk@dentalos.dev / password123`
- `patient@dentalos.dev / password123`

## Notes
- API endpoints are implemented under `src/app/api/*`.
- Supabase auth tokens are validated in Next API routes.
- SQL schema is in `supabase/schema.sql`.
- If needed, change port: `APP_PORT=3010 ./start_project.sh`
