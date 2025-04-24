# CineTrack Technical Requirements Document

## 1. Project Overview

CineTrack is a web application for tracking movies and TV shows, allowing users to maintain watch histories, create watchlists, write reviews, and interact with other users. The application will leverage the TMDB API for comprehensive movie and TV show data.

## 2. Technology Stack

### Frontend
- **Framework**: React with Next.js 14
  - App Router for routing
  - Server Components for improved performance
  - API routes for backend functionality
- **UI Components**: Tailwind CSS with Shadcn UI
  - Responsive design for all device sizes
  - Dark/light mode support
  - Accessible components (WCAG 2.1 AA compliant)
- **State Management**: React Context API + TanStack Query
  - Efficient data fetching and caching
  - Optimistic UI updates
  - Realtime updates via Supabase subscriptions

### Backend
- **Platform**: Supabase
  - PostgreSQL database
  - Authentication and authorization
  - Storage for user uploads
  - Realtime subscriptions
  - Edge functions for custom logic
- **API Integration**: TMDB API
  - Movie and TV show data
  - Images and videos
  - Cast and crew information
  - Watch providers

## 3. Project Structure

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

## 4. Naming Conventions

### File and Directory Structure
- **camelCase** for JavaScript/TypeScript files: `movieService.ts`, `userProfile.ts`
- **kebab-case** for components and pages: `movie-card.tsx`, `watch-list-page.tsx`
- **PascalCase** for React components: `MovieCard.tsx`, `WatchListPage.tsx`
- **snake_case** for database tables and columns: `watched_content`, `user_id`

### Code Conventions
- **camelCase** for variables, functions, and methods: `getUserRatings()`, `movieDetails`
- **PascalCase** for classes, interfaces, and types: `UserProfile`, `MovieDetails`
- **UPPER_SNAKE_CASE** for constants: `API_BASE_URL`, `DEFAULT_REGION`
- **Prefix $ for observables/streams**: `$userProfile`, `$movieChanges`

### API Endpoints
- **kebab-case** for paths: `/api/movies/watch-providers`
- **snake_case** for query parameters: `?sort_by=popularity&page=1`

### Database
- Plural names for tables: `users`, `movies`, `reviews`
- Primary keys named `id`
- Foreign keys named `entity_id`: `user_id`, `movie_id`
- Timestamps: `created_at`, `updated_at`

### CSS/Styling
- **kebab-case** for class names: `movie-card`, `watch-list-item`
- BEM methodology: `movie-card__title`, `watch-list--active`

## 5. Core Features Implementation

### User Management
- User registration with email/password and social authentication
- Profile management with customization options
- Follow system for user connections
- Preference settings (region, content filters, etc.)

### Content Discovery
- Homepage with trending, popular, and personalized content
- Advanced search with filters (genre, year, cast, etc.)
- Recommendations based on watch history
- Browse by category, genre, actors, directors
- **No authentication required** for browsing and viewing content data

### Content Details
- Comprehensive movie/show information pages
- Cast and crew details with links to profiles
- "Where to Watch" section with streaming/rental options
- Similar and recommended content
- Trailers and videos
- **No authentication required** for viewing all TMDB-sourced content

### List Management
- Watched list with completion date and personal rating
- Watchlist for planning future viewing
- Custom lists with sharing options
- Sorting and filtering of lists
- **Authentication required** for creating and managing personal lists

### Social Features
- Reviews with ratings and text content
- Like and comment on reviews
- Activity feed from followed users
- Share lists and reviews
- **Authentication required** for social interactions
- **No authentication required** for viewing public reviews and lists

### Admin/Moderator Dashboard
- User management (view, suspend, assign roles)
- Content moderation (review reported content)
- Analytics and reporting
- System configuration
- Curated content management

## 6. Data Models

### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  region TEXT DEFAULT 'US',
  preferences JSONB DEFAULT '{}',
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Follows
```sql
CREATE TABLE follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);
```

### Watched Content
```sql
CREATE TABLE watched_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  watched_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_rating SMALLINT CHECK (user_rating BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, tmdb_id, media_type)
);
```

### Watchlist Content
```sql
CREATE TABLE watchlist_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  priority SMALLINT DEFAULT 0,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE (user_id, tmdb_id, media_type)
);
```

### Custom Lists
```sql
CREATE TABLE custom_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### List Items
```sql
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES custom_lists(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  sort_order INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (list_id, tmdb_id, media_type)
);
```

### Reviews
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  content TEXT NOT NULL,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 10),
  is_spoiler BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, tmdb_id, media_type)
);
```

### Review Interactions
```sql
CREATE TABLE review_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'comment')),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (review_id, user_id, interaction_type) WHERE interaction_type = 'like'
);
```

### TMDB Cache (Optional)
```sql
CREATE TABLE tmdb_cache (
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv', 'person')),
  data JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (tmdb_id, media_type)
);
```

## 7. API Endpoints

### Public Endpoints (No Authentication Required)
- `GET /tmdb/trending` - Get trending content
- `GET /tmdb/search` - Search for content
- `GET /tmdb/movie/:id` - Get movie details
- `GET /tmdb/tv/:id` - Get TV show details
- `GET /tmdb/watch-providers/:type/:id` - Get watch providers
- `GET /tmdb/person/:id` - Get person details
- `GET /reviews` - Get public reviews (filterable)
- `GET /reviews/:id` - Get public review details
- `GET /lists/public` - Get public custom lists
- `GET /lists/:id` - Get public list details (if public)

### Authentication
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Log in existing user
- `POST /auth/logout` - Log out user
- `GET /auth/me` - Get current user info

### Users
- `GET /users/:id` - Get user profile
- `PATCH /users/:id` - Update user profile
- `GET /users/:id/follows` - Get user's follows
- `POST /users/:id/follows` - Follow a user
- `DELETE /users/:id/follows/:followId` - Unfollow a user

### Watched Content
- `GET /users/:id/watched` - Get user's watched content
- `POST /users/:id/watched` - Add to watched content
- `DELETE /users/:id/watched/:contentId` - Remove from watched
- `PATCH /users/:id/watched/:contentId` - Update watched details

### Watchlist
- `GET /users/:id/watchlist` - Get user's watchlist
- `POST /users/:id/watchlist` - Add to watchlist
- `DELETE /users/:id/watchlist/:contentId` - Remove from watchlist
- `PATCH /users/:id/watchlist/:contentId` - Update watchlist item

### Custom Lists
- `GET /users/:id/lists` - Get user's custom lists
- `POST /users/:id/lists` - Create new custom list
- `GET /lists/:id` - Get list details
- `PATCH /lists/:id` - Update list details
- `DELETE /lists/:id` - Delete list
- `POST /lists/:id/items` - Add item to list
- `DELETE /lists/:id/items/:itemId` - Remove item from list
- `PATCH /lists/:id/items/:itemId` - Update list item

### Reviews
- `POST /reviews` - Create review
- `PATCH /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review
- `POST /reviews/:id/like` - Like review
- `DELETE /reviews/:id/like` - Unlike review
- `POST /reviews/:id/comments` - Comment on review
- `DELETE /reviews/:id/comments/:commentId` - Delete comment

### Admin
- `GET /admin/users` - Get all users
- `PATCH /admin/users/:id` - Update user role
- `GET /admin/reports` - Get reported content
- `PATCH /admin/reports/:id` - Handle reported content
- `GET /admin/analytics` - Get site analytics

## 8. TMDB API Integration

### Core Endpoints Utilized
- `/trending` - For homepage trending sections
- `/movie/[id]` and `/tv/[id]` - For detailed content pages
- `/movie/watch_providers` and `/tv/watch_providers` - For "Where to Watch"
- `/search` - For search functionality
- `/discover` - For filtered browsing
- `/person/[id]` - For actor/director pages

### Integration Strategy
1. **Server-side API calls**:
   - Fetch data on the server using Next.js server components
   - Cache responses to minimize API calls
   - Store only user-specific data in Supabase
   - **No authentication required** for accessing TMDB data

2. **Data synchronization**:
   - Use TMDB's `/changes` endpoints to keep data fresh
   - Implement a separate worker for periodic synchronization

3. **Rate limiting and error handling**:
   - Implement backoff strategies for API rate limits
   - Graceful degradation when API is unavailable

4. **Public Access Implementation**:
   - Separate TMDB routes from authenticated routes
   - Enable anonymous browsing of all content
   - Track anonymous sessions for personalization without login

## 9. User Interface Components

### Core UI Components
- `MovieCard` - Display movie/show with poster, title, year, rating
- `MediaGrid` - Responsive grid for displaying multiple movies/shows
- `ContentDetails` - Main component for movie/show details
- `CastCarousel` - Horizontal scrolling list of cast members
- `WatchProviders` - Display streaming options by region
- `RatingInput` - Star/number input for rating content
- `ReviewCard` - Display user reviews with interaction options
- `MediaList` - Display user lists with drag-and-drop support
- `SearchBar` - Search input with autocomplete
- `AuthPrompt` - Non-obtrusive authentication prompt for actions requiring login

### Page Templates
- `HomePage` - Landing page with various content sections
- `DetailsPage` - Full details for specific movie/show
- `ProfilePage` - User profile with activity and lists
- `SearchPage` - Advanced search with filters
- `ListPage` - Display and edit custom lists
- `AdminDashboard` - Admin interface for moderation

## 10. Non-Functional Requirements

### Performance
- Initial page load < 2 seconds
- Time to interactive < 3 seconds
- API response times < 500ms

### Scalability
- Support 10,000+ concurrent users
- Handle 1M+ movies and TV shows
- Support 100M+ user interactions

### Security
- HTTPS for all connections
- SQL injection protection
- XSS prevention
- CSRF protection
- Rate limiting for API endpoints
- Clear separation between public and authenticated routes

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast
- Alternative text for all images

### Monitoring
- Error tracking with Sentry
- Performance monitoring
- Usage analytics
- API quota tracking

## 11. Development Workflow

### Environment Setup
- Development environment with hot reloading
- Staging environment for testing
- Production environment for users

### CI/CD Pipeline
- GitHub Actions for automated testing
- Automated deployments to staging
- Manual promotion to production
- Database migration scripts

### Code Quality
- ESLint for JavaScript/TypeScript
- Prettier for code formatting
- Husky for pre-commit hooks
- Jest for unit testing
- Cypress for E2E testing

## 12. Deployment Strategy

### Frontend
- Deploy to Vercel for Next.js hosting
- Global CDN for static assets
- Automatic preview deployments for PRs

### Backend
- Supabase for database and authentication
- Edge functions for custom backend logic
- Database backups and disaster recovery

## 13. Timeline and Phases

### Phase 1: MVP (4 weeks)
- Basic user authentication
- Movie/TV show browsing (no auth required)
- Watched list and watchlist (auth required)
- Basic profile pages (auth required)
- Details pages with TMDB data (no auth required)

### Phase 2: Social Features (4 weeks)
- Reviews and ratings
- Follow system
- Activity feed
- Custom lists
- Enhanced profiles

### Phase 3: Advanced Features (4 weeks)
- Admin dashboard
- Recommendations
- Statistics and insights
- Enhanced search and filters
- Performance optimizations

### Phase 4: Polish and Launch (2 weeks)
- UI/UX refinements
- Accessibility improvements
- Final testing
- Marketing preparation
- Public launch

## 14. Future Considerations

- Mobile applications
- Offline support
- Personalized recommendations using ML
- Integration with smart TVs and streaming devices
- Premium features and monetization options 