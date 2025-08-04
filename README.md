# JEFF-TEST Monorepo

A clean monorepo with Next.js web app, Expo React Native mobile app, and shared code.

## Structure

```
├── web/          # Next.js 15 web application
├── mobile/       # Expo 53 React Native mobile app
├── shared/       # Shared code (types, API clients, utilities)
└── package.json  # Root workspace configuration
```

## Quick Start

```bash
# Install all dependencies
npm install

# Build shared package first
npm run build:shared

# Run web app (localhost:3000)
npm run dev:web

# Run mobile app
npm run dev:mobile

# Run both apps concurrently
npm run dev:all
```

## Architecture

- **Web**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Mobile**: Expo 53 with React Native, TypeScript, NativeWind
- **Shared**: Common types, API clients, utilities
- **Backend**: Supabase (database, auth, storage)

## Features

- ✅ Authentication (login/signup)
- ✅ Expense management with photo uploads
- ✅ Real-time updates
- ✅ Data filtering and export
- ✅ Responsive design
- ✅ Type-safe shared code

## Development

Each workspace can be developed independently:

```bash
cd web && npm run dev          # Web development
cd mobile && npm run start     # Mobile development
cd shared && npm run dev       # Shared development (watch mode)
```

## Build

```bash
npm run build          # Build all workspaces
npm run build:web      # Build web app only
npm run build:shared   # Build shared package only
```

The mobile app uses Expo for builds - use `expo build:android` or `expo build:ios` for production builds.
