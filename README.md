# CineTrack

A web application for tracking movies and TV shows, where users can maintain their watch history, create watchlists, create custom lists, write reviews, and interact with other users. The application uses TMDB API for movie/show data and focuses on creating a modern, responsive user experience.

## Technology Stack

### Frontend
- React with Next.js 14
- Tailwind CSS with Shadcn UI
- TanStack Query for data fetching

### Backend
- Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- TMDB API for movie and TV show data

## Project Structure

```
cinetrack/
├── frontend/          # Next.js application
│   ├── app/           # App router pages
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions and helpers
│   ├── services/      # External service integrations
│   └── types/         # TypeScript type definitions
├── backend/           # Supabase configuration
│   ├── functions/     # Edge functions
│   ├── migrations/    # Database migrations
│   └── seed/          # Seed data
├── shared/            # Shared code between frontend and backend
├── docs/              # Documentation
└── scripts/           # Build and deployment scripts
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase CLI
- TMDB API key

### Development Setup
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/cinetrack.git
   cd cinetrack
   ```

2. Install dependencies
   ```bash
   # Install all dependencies at once using workspaces
   npm install
   ```

3. Set up environment variables
   ```bash
   # In frontend directory
   cp frontend/.env.example frontend/.env.local
   # Edit .env.local with your API keys and Supabase URLs
   
   # In backend directory
   cp backend/.env.example backend/.env
   # Edit .env with your Supabase configuration
   ```

4. Start the development server
   ```bash
   # Start the frontend
   npm run dev
   
   # Or start the backend (in a separate terminal)
   npm run dev:backend
   ```

5. Set up Supabase
   ```bash
   # Initialize Supabase
   cd backend
   supabase start
   ```

## Core Features

1. User Registration and Login
   - Create an account to track movie/series watching habits
   - Log in to access watched list, future watchlist, and reviews

2. Watched List Management
   - Add movies/series to watched list
   - Rate and review watched content
   - View watching history

3. Future Watchlist Management
   - Add movies/series to future watchlist
   - Plan what to watch next

4. Reviews and Ratings
   - See reviews and ratings from other users
   - View detailed reviews for specific content

5. Social Features
   - Follow other users
   - See activity feed from followed users
   - Like and comment on reviews

6. Custom Lists
   - Create multiple themed watchlists
   - Share lists with other users

7. Admin Dashboard
   - User management
   - Content moderation
   - Analytics and reporting

## Documentation

For more detailed documentation, please refer to the [docs](./docs) directory:

- [Technical Requirements](./docs/technical-requirements.md)
- [API Documentation](./docs/api-docs.md)
- [Database Schema](./docs/database-schema.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Known Issues

- **Client-Side Authentication State:** There is a known issue where the client-side authentication state (managed by `useUser` hook and `@supabase/ssr`) may not immediately reflect the valid session after changing browser tabs/windows and returning focus. This can cause UI elements (like the header dropdown) to revert to a loading state or protected routes to become temporarily inaccessible. A manual page refresh correctly restores the state. The underlying cause seems related to client-side session re-validation/synchronization upon focus events, potentially within the `@supabase/ssr` library or its interaction with Next.js. Further investigation is needed.

## Development Notes

- **Component Library Usage:** Initial development saw some components (e.g., `movie-card`, `header`) created without fully utilizing the designated Shadcn UI library. These components are being progressively refactored to align with the project's technical requirements and ensure consistency in UI/UX and maintainability.

