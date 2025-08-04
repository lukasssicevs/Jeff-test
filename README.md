# Expense Tracker Monorepo

Full-stack expense tracking app with web and mobile clients.

## Setup

**Prerequisites:** Node.js 18+, npm 10+

```bash
# 1. Clone and install
git clone <repo-url>
cd expense-tracker
npm install

# 2. Create environment files
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key" > web/.env.local

echo "EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key" > mobile/.env

# 3. Build shared code
npm run build:shared

# 4. Verify setup
npm run verify

# 5. Start development
npm run dev:all  # Both apps
npm run dev:web  # Web only (localhost:3000)
npm run dev:mobile  # Mobile only
```

## Stack

- **Web:** Next.js 15 + React 19 + TypeScript + Tailwind
- **Mobile:** Expo 53 + React Native + TypeScript
- **Backend:** Supabase (auth, database, storage)
- **Shared:** Type-safe API clients and utilities

## Features

✅ Authentication • ✅ Expense tracking • ✅ Photo uploads  
✅ Real-time sync • ✅ Data export • ✅ Mobile responsive
