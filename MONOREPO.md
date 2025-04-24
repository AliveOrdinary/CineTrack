# CineTrack Monorepo Setup

This project uses a monorepo structure with npm workspaces to manage multiple packages:

- `frontend`: Next.js web application
- `backend`: Supabase backend configuration
- `shared`: Common types and utilities used by both frontend and backend

## Project Structure

```
cinetrack/
├── frontend/           # Next.js application
│   ├── app/            # App router pages
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # External service integrations
│   └── ...
├── backend/            # Supabase configuration
│   ├── supabase/       # Supabase project files
│   │   ├── functions/  # Edge functions
│   │   ├── migrations/ # Database migrations
│   │   └── seed.sql    # Seed data
│   └── ...
├── shared/             # Shared code between frontend and backend
│   ├── types/          # TypeScript type definitions
│   └── ...
└── package.json        # Root package.json with workspace configuration
```

## Prerequisites

Before getting started, make sure you have the following installed:

- Node.js 18+ and npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required for Supabase local development)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (installed globally or via npx)

## Development Workflow

### Initial Setup

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd cinetrack
   ```

2. Install all dependencies and build shared packages:
   ```bash
   npm run setup
   ```

3. Set up environment variables:
   ```bash
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env.local
   ```

4. Initialize Supabase (if not already done):
   ```bash
   npm run init:backend
   ```

5. Generate Supabase types:
   ```bash
   npm run gen:types
   ```

### Running the Application

- Start both backend and frontend together:
  ```bash
  npm run dev:all
  ```

- Start only the frontend development server:
  ```bash
  npm run dev
  ```

- Start only the backend services:
  ```bash
  npm run dev:backend
  ```

- Run the frontend in production mode:
  ```bash
  npm run dev:prod
  ```

### Database Management

- Reset the database to apply migrations and seed data:
  ```bash
  npm run db:reset
  ```

- Generate TypeScript types from the database schema:
  ```bash
  npm run gen:types
  ```

- Create a new migration file:
  ```bash
  cd backend && npx supabase migration new <migration-name>
  ```

- Manually apply pending migrations:
  ```bash
  cd backend && npx supabase migration up
  ```

- View schema differences:
  ```bash
  cd backend && npx supabase db diff
  ```

### Building and Deployment

- Build the application:
  ```bash
  npm run build
  ```

- Start the production server:
  ```bash
  npm run start
  ```

- Deploy to production (after linking to a Supabase project):
  ```bash
  cd backend && npx supabase db push
  ```

### Maintenance and Cleanup

- Clean all node_modules:
  ```bash
  npm run clean
  ```

- Run linters across all packages:
  ```bash
  npm run lint
  ```

## Working with Packages

### Importing Shared Code

In frontend or backend code, you can import from the shared package using path aliases:

```typescript
// Import all types
import { UserProfile, WatchlistItem } from '@cinetrack/shared/types';

// Import Supabase types
import { Database } from '@cinetrack/shared/types/supabase';
```

### TypeScript Path Aliases

Path aliases are configured in each workspace's tsconfig.json:

- `@/*` - Imports from the current workspace
- `@cinetrack/shared/*` - Imports from specific folders in the shared package

Example:
```typescript
// Import using path aliases
import supabaseService from '@/services/supabase';
import { MediaType } from '@cinetrack/shared/types';
```

## Adding New Dependencies

To add dependencies to a specific workspace:

```bash
# Add to frontend
npm install some-package --workspace=frontend

# Add to backend
npm install some-package --workspace=backend

# Add to shared
npm install some-package --workspace=shared
```

To add a dependency to all workspaces:

```bash
npm install some-package -w
```

## Common Issues and Troubleshooting

### Supabase Related Issues

- If you encounter Docker-related errors when starting Supabase, ensure Docker Desktop is running.
- If port conflicts occur, you may need to stop other services using the same ports (Supabase uses ports 54321-54326).
- If database reset fails, try stopping Supabase first: `npm run supabase:stop` then `npm run db:reset`.

### TypeScript and Path Alias Issues

- If TypeScript cannot find modules using path aliases:
  1. Restart your TypeScript server (in VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server")
  2. Run `npm run clean` followed by `npm install`
  3. Check that your IDE's TypeScript version matches the project version

### Running Supabase Commands

You can run Supabase CLI commands from the backend directory:

```bash
cd backend
npx supabase <command>
```

### Next.js Issues

- If changes to environment variables don't take effect, restart the development server
- For build errors, check the console output for specific file paths and error messages

### Tailwind CSS Issues

- If styles aren't applied correctly, check that the Tailwind configuration includes all necessary paths
- Run `npm run dev` with the `--turbo` flag to see which CSS classes are being used
- Make sure the correct Tailwind configuration is being used by checking the postcss.config.js file 