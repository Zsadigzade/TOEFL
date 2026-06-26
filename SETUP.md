# TOEFL Platform Setup Guide

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose region closest to your users (e.g. `eu-central-1` for Europe)
3. Wait ~2 min for provisioning

### Get API Keys
Settings → API → copy:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### Run Migration
SQL Editor → paste contents of `supabase/migrations/001_initial.sql` → Run

### Create Admin User
Authentication → Users → Add User → enter email + password
(This is your admin login — single account)

## 2. Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create Key
3. Copy to `ANTHROPIC_API_KEY` in `.env.local`

## 3. Fill `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

## 4. Run

```bash
cd platform
npm install
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login)

## 5. First Steps in Admin

1. **Admin → AI Settings** — review prompts, adjust if needed
2. **Admin → Generate** — pick section, topic, hit Generate
3. **Admin → Question Bank** — review generated questions, approve them
4. Change status from `draft` → `approved` → `active` to make questions available to users
