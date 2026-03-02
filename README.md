# Church Statistics App

A web application for collecting and reporting weekly church meeting statistics, attendance tracking, and offering records across multiple districts.

## Features

- **Weekly Stats Submission**: District leaders submit Lord's Table attendance, prophesying counts, small group counts (adults/youth/children)
- **Membership Tracking**: Maintain rosters for Children's Meeting and High Schoolers' Meeting with weekly attendance checklists
- **Offering Records**: Track 4 offering categories (envelope counts + amounts), electronic offerings, and special pledge campaigns
- **Role-Based Access**: Admin, District Leader, Accounting, Children's/Youth Coordinator — each sees only what they need
- **District Isolation**: Users can only view/submit data for their assigned districts
- **Reports**: Attendance trends, offering summaries, event participation (planned)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend/DB**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Hosting**: Vercel (recommended)

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local` and fill in your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

### 3. Run Database Migrations
In your Supabase SQL Editor, run in order:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`

### 4. Start Development Server
```bash
npm run dev
```

### 5. Create First Admin User
1. Sign up via the app
2. In Supabase dashboard, update your profile's `roles` to `{ADMIN}`

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Full architecture, data model, security, and implementation status
