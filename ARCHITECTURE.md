# Church Statistics App — Architecture & PRD

## Overview

A web application for church district leaders to submit weekly meeting statistics, track children/youth membership and attendance, record offering counts, and generate reports. Built with Next.js, Supabase, and Tailwind CSS.

## Problem Statement

Weekly church statistics are currently collected via scattered methods (spreadsheets, forms, messages). This creates:
- No role-based access — anyone can see/edit everything
- Data scattered across tools
- No membership tracking for children/youth
- Manual aggregation for reports
- No audit trail

## User Roles

| Role | Can Do |
|------|--------|
| **ADMIN** | Everything. Manage districts, users, pledge campaigns. View all data & reports. |
| **DISTRICT_LEADER** | Submit weekly stats for assigned district(s). Manage children/youth member lists. |
| **CHILDREN_COORDINATOR** | Manage children's member list & attendance for assigned district(s). |
| **YOUTH_COORDINATOR** | Manage youth member list & attendance for assigned district(s). |
| **ACCOUNTING** | Enter electronic offerings for any district. View offering reports. |

A user can hold **multiple roles** (stored as an array).

## Data Model

### Districts
Church is divided into districts/zones. Each district submits its own weekly statistics independently.

### Weekly Record
One record per district per week (Lord's Day date). Parent record that links to:
- Lord's Table Meeting stats
- Prophesying Meeting stats
- Small Group Meeting stats
- Children's Meeting attendance session
- Youth Meeting attendance session
- Offering records (4 standard categories)

### Meeting Types

| Meeting | Data Collected |
|---------|---------------|
| **Lord's Table** | Attendance count (high schooler age and above) |
| **Prophesying** | Number of prophecies given |
| **Small Group** | Separate counts: adults, high schoolers, children |
| **Children's Meeting** | Membership-based attendance checklist (name, age, school year) |
| **High Schoolers' Meeting** | Membership-based attendance checklist (name, age, school year) |

### Offerings (4 standard categories + special pledges)

| Category | Data |
|----------|------|
| General Offering | Envelope count + total amount |
| Building Project | Envelope count + total amount |
| Specific Purpose | Envelope count + total amount |
| Designated Offering | Envelope count + total amount |
| **Electronic Offerings** | Entered by accounting per district (amount + reference) |
| **Special Pledge Campaigns** | Admin creates campaigns; districts submit envelope count + amount per week |

### Events
Defined in this app for reporting purposes. Registration handled by external app.

## Database Schema (16 Tables)

```
districts
profiles
user_districts

weekly_records
  ├── lords_table_stats        (1:1 per weekly_record)
  ├── prophesying_stats        (1:1 per weekly_record)
  ├── small_group_stats        (1:1 per weekly_record)
  ├── meeting_sessions         (1 per meeting_type per weekly_record)
  │   └── attendance_records   (1 per member per session)
  └── offering_records         (1 per category per weekly_record)

members                        (roster for children & youth)
electronic_offerings           (entered by accounting)
pledge_campaigns
pledge_records

events
event_participation
```

## Security

- **Authentication**: Supabase Auth (email/password, bcrypt, JWT, HTTP-only cookies)
- **Route Protection**: Next.js middleware
- **Row Level Security**: Every table has RLS policies
  - Users can only see/submit data for their assigned districts
  - Accounting role can enter electronic offerings for any district
  - Only admins can manage districts, users, pledge campaigns
- **Data Integrity**: Foreign keys, check constraints, unique constraints, enums

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Hosting | Vercel (recommended) |

## App Routes

```
/                          → Redirect to dashboard or login
/auth/login                → Login page
/dashboard                 → Overview dashboard (role-aware)

/leader/dashboard          → District leader: select week & district, see submission status
/leader/lords-table        → Submit Lord's Table attendance
/leader/prophesying        → Submit prophesying count
/leader/small-group        → Submit small group counts
/leader/children-meeting   → Manage members & check attendance
/leader/youth-meeting      → Manage members & check attendance
/leader/offerings          → Submit offering envelope counts & amounts

/accounting/dashboard      → Accounting overview
/accounting/offerings      → Enter electronic offerings per district

/admin/dashboard           → Admin panel
/admin/districts           → Manage districts
/admin/users               → Manage users, roles, district assignments
/admin/offerings           → Manage pledge campaigns

/reports                   → Reports dashboard (attendance trends, offering summaries, event participation)
```

## Workflows

### Weekly Submission (District Leader)
1. Log in → Go to "Submit Stats"
2. Select district and week date
3. Fill in each meeting's stats (Lord's Table, prophesying, small group)
4. Check attendance for children's / youth meeting
5. Enter offering envelope counts and amounts
6. Done — data is saved immediately per section

### Attendance Check (Children's / Youth Coordinator)
1. Go to Children's Meeting or Youth Meeting page
2. See the member roster for the district
3. Check/uncheck each member as present/absent
4. Can add new members to the roster at any time
5. Save attendance

### Electronic Offerings (Accounting)
1. Go to Offerings page
2. Select district, week, category
3. Enter amount and bank reference
4. Save

### Reports (Admin / any viewer)
- View weekly summaries across all districts
- Attendance trends over time
- Offering totals by category, district, date range
- Event participation summaries

## Implementation Status

| Area | Status |
|------|--------|
| Database schema (16 tables) | ✅ Complete |
| RLS policies (all tables) | ✅ Complete |
| Auth system (login, session, middleware) | ✅ Complete |
| TypeScript types | ✅ Complete |
| Dashboard layout & navigation | ✅ Complete |
| Dashboard page (overview) | ✅ Complete |
| Leader submission dashboard | ✅ Complete |
| Admin panel (dashboard, districts, users) | ✅ Complete |
| Server actions (leader + admin) | ✅ Complete |
| Individual meeting form pages | 📋 Next up |
| Offering submission forms | 📋 Next up |
| Accounting electronic offering page | 📋 Next up |
| Reports | 📋 Planned |
| Member management UI (add/edit) | 📋 Next up |
| Attendance checklist UI | 📋 Next up |

## Estimated Remaining Work

| Feature | Estimate |
|---------|----------|
| Meeting stat forms (Lord's Table, prophesying, small group) | 2-3 hours |
| Offering submission form | 2-3 hours |
| Children's/Youth member management | 3-4 hours |
| Attendance checklist UI | 3-4 hours |
| Accounting electronic offerings page | 2-3 hours |
| Pledge campaign management | 2-3 hours |
| Reports dashboard | 6-8 hours |
| **Total** | **~20-28 hours** |
