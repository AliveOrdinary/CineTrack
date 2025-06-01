# CineTrack Technical Requirements Document (Version 2.1)

## Executive Summary

CineTrack is a comprehensive web application designed for movie and TV show enthusiasts to track, review, and discover visual content. The platform leverages the TMDB API for rich content data while providing users with powerful tools to maintain watch histories, create custom lists, engage with a community of like-minded users, and receive personalized recommendations based on their preferences and activity. Built on a modern tech stack including Next.js 14, Supabase, and Tailwind CSS, CineTrack emphasizes performance, accessibility, and a seamless user experience across all devices, following a mobile-first design approach. This document outlines the technical specifications, feature set, implementation strategy, and development roadmap for the CineTrack platform.

## 1. Project Overview

CineTrack aims to be the definitive platform for users to manage their viewing habits, share opinions, and discover new movies and TV shows. It integrates deeply with The Movie Database (TMDB) for content information while providing a rich layer of user-generated data and social interaction.

## 2. Technology Stack

### Frontend
- **Framework**: React with Next.js (v14.0.0+)
  - App Router for routing and layouts.
  - Server Components for enhanced performance and data fetching.
  - API Routes for specific client-server interactions not directly handled by Server Components or Supabase client.
- **UI Components**: Tailwind CSS (v3.3.0+) with Shadcn UI component library.
  - Responsive design targeting all device sizes (mobile-first).
  - Theming support for Dark/Light modes.
  - Accessible components adhering to WCAG 2.1 Level AA standards.
- **State Management**: React Context API for global state (e.g., theme, user session) + TanStack Query (v5.0.0+) for server state management.
  - Efficient data fetching, caching, and synchronization with the backend.
  - Optimistic UI updates for a smoother user experience.
  - Realtime updates facilitated by Supabase Realtime subscriptions.

### Backend
- **Platform**: Supabase (latest stable version)
  - PostgreSQL database as the primary data store.
  - Supabase Auth for user authentication (Email/Password, Social Logins) and authorization (Row Level Security).
  - Supabase Storage for user-uploaded content (e.g., avatars, list banner images).
  - Supabase Realtime Subscriptions for live updates (e.g., notifications, activity feeds).
  - Supabase Edge Functions for custom server-side logic (e.g., complex queries, third-party integrations beyond TMDB).
- **API Integration**: The Movie Database (TMDB) API (v3)
  - Source for movie, TV show, cast, and crew data.
  - Provides images, videos, ratings, synopses, and release information.
  - Integration for fetching watch provider (streaming/rental) information.

## 3. Project Structure

```
cinetrack/
├── app/                    # Next.js App Router: pages, layouts, API routes
│   ├── (auth)/             # Routes related to authentication (login, signup)
│   ├── (dashboard)/        # Protected routes for authenticated users (profile, lists)
│   ├── (public)/           # Publicly accessible routes (home, content details)
│   ├── api/                # Serverless API routes (if needed beyond Supabase client)
│   └── layout.tsx          # Root application layout
├── components/             # Reusable React components
│   ├── ui/                 # Core UI primitives (from Shadcn UI)
│   ├── features/           # Components specific to application features (e.g., ReviewForm, MediaGrid)
│   └── layouts/            # Reusable layout structures (e.g., PageLayout, DashboardSidebar)
├── lib/                    # Shared libraries, utilities, and helpers
│   ├── supabase/           # Supabase client setup, helper functions, RLS policies reference
│   ├── tmdb/               # TMDB API client, data fetching logic, type definitions
│   └── utils/              # General utility functions (date formatting, validation, etc.)
├── hooks/                  # Custom React hooks (e.g., useAuth, useMediaQuery)
├── types/                  # Global TypeScript type definitions (shared types)
├── public/                 # Static assets (images, fonts, favicons)
├── styles/                 # Global CSS styles, Tailwind base configuration
├── supabase/               # Supabase project configuration
│   ├── migrations/         # Database schema migrations (SQL)
│   ├── functions/          # Edge Function code
│   ├── seed-data/          # Scripts for seeding initial database data
│   └── types/              # Auto-generated TypeScript types from Supabase schema
├── config/                 # Application-level configuration (constants, feature flags)
├── middleware.ts           # Next.js middleware (e.g., for auth checks, redirects)
├── .env.local              # Local environment variables (ignored by Git)
├── next.config.js          # Next.js configuration file
└── tailwind.config.js      # Tailwind CSS configuration file
```

## 4. Naming Conventions

### File and Directory Structure
- **camelCase** for non-component TypeScript/JavaScript files: `movieService.ts`, `authHelpers.ts`
- **kebab-case** for directories and Next.js route segments: `user-profile/`, `movie-details/`
- **PascalCase** for React component files: `MovieCard.tsx`, `WatchListPage.tsx`

### Code Conventions
- **camelCase** for variables, functions, and methods: `getUserRatings`, `movieDetails`
- **PascalCase** for React components, classes, interfaces, and types: `UserProfile`, `interface MovieDetails`, `type UserRole`
- **UPPER_SNAKE_CASE** for constants and enum members: `API_BASE_URL`, `DEFAULT_REGION`, `Role.ADMIN`
- **Prefix `$` for observables/streams (if applicable, e.g., with RxJS, though less common with TanStack Query):** `$userProfileChanges`

### API Endpoints (Internal API Routes if used)
- **kebab-case** for path segments: `/api/users/me`, `/api/reviews/:id/comments`
- **snake_case** for query parameters: `?sort_by=popularity&page=1`

### Database (Supabase/PostgreSQL)
- **snake_case** for tables, columns, functions, and constraints: `watched_content`, `user_id`, `created_at`, `fk_user_id`
- Plural names for tables representing collections: `users`, `reviews`, `custom_lists`
- Primary keys named `id` (UUID type preferred).
- Foreign keys named `{table_name_singular}_id`: `user_id`, `review_id`, `list_id`.
- Timestamps: `created_at`, `updated_at` (using `TIMESTAMPTZ`).

### CSS/Styling (Tailwind CSS)
- Utilize Tailwind utility classes primarily.
- For custom CSS classes (if needed), use **kebab-case**: `movie-card-glow`, `loading-spinner`.
- Adhere to BEM conventions if creating complex custom components outside of utility classes: `card__header--large`.

### Documentation (JSDoc)
- Use JSDoc syntax for documenting functions, components, hooks, and types.
- Include `@param`, `@returns`, `@throws`, `@example`, and clear descriptions.
- Document component props using `@param` or interface descriptions.

## 5. Core Features Implementation

*(Note: Authentication requirements are explicitly mentioned for clarity)*

### User Management
-   **Authentication**:
    -   User registration via email/password.
    -   Secure password handling (hashing via Supabase Auth).
    -   Option for social logins (e.g., Google, GitHub - configurable).
    -   Login/logout functionality.
    -   Password reset mechanism.
    -   **[Authentication Required for most actions]**
-   **Profile Management**:
    -   Users can view and edit their profile: display name, avatar, bio.
    -   View user's activity feed (reviews, ratings, lists created).
    -   **[Authentication Required]**
-   **Follow System**:
    -   Users can follow/unfollow other users.
    -   View follower/following lists on profiles.
    -   **[Authentication Required]**
-   **Preferences**:
    -   Set preferred region (for watch providers, release dates - defaults to 'US').
    -   Content language preferences.
    -   Notification settings (via `user_preferences` table).
    -   Theme settings (via `user_preferences` table).
    -   **[Authentication Required]**

### Content Discovery
-   **Homepage**:
    -   Sections for Trending (Movies/TV), Popular, Now Playing, Upcoming.
    -   Personalized recommendations (if logged in).
    -   **[No Authentication Required for browsing]**
-   **Search**:
    -   Search bar with autocomplete suggestions (movies, TV shows, people).
    -   Dedicated search results page.
    -   Advanced filtering (genre, release year range, cast/crew, rating range).
    -   **[No Authentication Required for browsing/searching]**
-   **Browsing**:
    -   Browse content by genre, network, keywords.
    -   Explore curated lists (e.g., "Best Sci-Fi of the 90s").
    -   View profiles of actors, directors, etc., with their filmography.
    -   **[No Authentication Required for browsing]**

### Content Details
-   **Information Display**:
    -   Dedicated pages for each movie and TV show.
    -   Display title, synopsis, poster, backdrop images, genres, release date, runtime, official rating.
    -   TMDB average rating and user count.
    -   Trailers and video clips (via TMDB).
    -   **[No Authentication Required]**
-   **Cast & Crew**:
    -   Detailed cast and crew lists with links to their profiles.
    -   **[No Authentication Required]**
-   **Watch Providers**:
    -   "Where to Watch" section showing streaming, rental, and purchase options based on user's region (requires TMDB API key permission).
    -   **[No Authentication Required]**
-   **Related Content**:
    -   Sections for "Similar Movies/Shows" and "Recommendations" based on TMDB data.
    -   **[No Authentication Required]**
-   **User Interactions Section**:
    -   Display user reviews for the content (respecting visibility).
    -   Show aggregate user rating from CineTrack users.
    -   Buttons for adding to Watched, Watchlist, or Custom Lists (prompts login if not authenticated).
    -   **[No Authentication Required for viewing, Authentication Required for interaction]**

### Enhanced List Management
-   **Watched Content Tracking**:
    -   Log movies and TV shows (including individual episodes) as watched via `watched_content` table.
    -   Record the date watched.
    -   Assign a personal rating (1-10 scale).
    -   Track rewatches (`is_rewatch`, `rewatch_count`).
    -   Add optional private notes/diary entry.
    -   Optionally, flag entry as basis for a public review (`posted_as_review`).
    -   Mark if notes/associated review contain spoilers (`contains_spoilers`).
    -   Set visibility (`public`, `followers`, `private`).
    -   **[Authentication Required]**
-   **Watchlist**:
    -   Add movies/TV shows to a personal watchlist (`watchlist_content` table).
    -   Set priority, add notes, set visibility.
    -   **[Authentication Required]**
-   **Custom Lists**:
    -   Create personalized lists (`custom_lists` table).
    -   Add movies/TV shows (`list_items` table).
    -   Add descriptions, set visibility, reorder items.
    -   Upload banner/cover images for custom lists.
    -   **[Authentication Required]**
-   **List Interaction**:
    -   Sort and filter items within Watched, Watchlist, and Custom Lists.
    -   View lists on user profiles (respecting visibility settings).
    -   Users can "like" or "clone" public/followers-only custom lists (requires interaction table, e.g. `list_likes`).
    -   **[Authentication Required for personal list management and liking/cloning]**

### TV Show Episode Tracking
-   **Granular Tracking**: Mark individual episodes as watched using `episode_tracking` table.
-   **Progress Visualization**: Display season progress bars based on tracked episodes vs total episodes (fetched from TMDB).
-   **Bulk Actions**: Option to mark entire seasons or shows as watched (creates multiple `episode_tracking` entries).
-   **Episode Details**: Allow episode-specific ratings and notes within `episode_tracking`.
-   **Up Next**: "Continue Watching" section suggesting the next unwatched episode based on `episode_tracking` data.
-   **[Authentication Required]**

### Enhanced Rating System
-   **Primary Rating**: Core 1-10 user rating stored in `watched_content` or `episode_tracking`.
-   **Detailed Ratings**: Store category-based ratings (`acting`, `story`, etc.) in `detailed_ratings` table, linked to `watched_content`.
-   **Emotional Reactions**: Store quick reactions (`loved`, `liked`, etc.) in `emotional_reactions` table, linked to `watched_content`.
-   **Rating History**: (Implicitly tracked via `updated_at` on `watched_content` if rating changes; explicit history table could be added if needed).
-   **[Authentication Required]**

### Social Features
-   **Reviews**:
    -   Write detailed reviews (`reviews` table), optionally linked to a `watched_content` entry.
    -   Include the 1-10 rating.
    -   Mark reviews containing spoilers (`is_spoiler`).
    -   Option to post anonymously (`is_anonymous`). Set visibility.
    -   **[Authentication Required]**
-   **Review Interaction**:
    -   Like/unlike reviews (`review_interactions` table).
    -   Comment on reviews (`review_interactions` table).
    -   **[Authentication Required]**
-   **Activity Feed**:
    -   Personalized feed showing activities from followed users (new ratings, reviews, list creations/updates - generated by querying relevant tables based on `follows`).
    -   Filter feed by activity type.
    -   **[Authentication Required]**
-   **Sharing**:
    -   Share links to content pages, reviews, or public lists on external platforms.
    -   "Recommend to a friend" feature (`content_recommendations` table).
    -   **[Authentication Required for recommending]**

### Content Reflection and Engagement
-   **Guided Prompts**: Store prompt/response pairs in `review_responses` table, linked to `reviews`.
-   **Social Watching Tags**: Track users watched together using `social_watching` table, linked to `watched_content`.
-   **[Authentication Required]**

### Privacy Controls
-   **Granular Settings**: Set default visibility via `user_preferences`.
-   **Per-Item Override**: `visibility` column present in `watched_content`, `watchlist_content`, `custom_lists`, `reviews`.
-   **Activity Sharing**: Control implicitly via item visibility settings.
-   **Profile Visibility**: (Could add a `profile_visibility` flag to `users` or `user_preferences` if needed beyond item-level controls).
-   **Anonymous Reviews**: `is_anonymous` flag in `reviews` table.
-   **[Authentication Required]**

### Personalization and Learning
-   **(Phase 2/3) Basic Recommendations**: Suggest content based on user's aggregated data from `watched_content`, `reviews`, `detailed_ratings`, `emotional_reactions`, `watchlist_content`.
-   **(Phase 3+) Taste Profile**: Analyze user data to show top genres, actors, directors.
-   **(Phase 3+) Alerts**: Notify users based on watchlist items matching new releases or streaming availability (requires background jobs/TMDB change monitoring).
-   **[Authentication Required]**

### Content Moderation and Reporting System
-   **User Reporting**: Users can report reviews (`review_reports` table).
-   **Moderation Queue**: Admins/Mods view reports filtered by `status='pending'`.
-   **Moderation Actions**: Admins/Mods update report `status`, `resolution_notes`, `moderator_id`. Actions may trigger updates to `reviews` table or user status.
-   **Notifications**: Use `notifications` table to inform users about report outcomes.
-   **[Authentication Required for Reporting, Admin/Mod Role Required for Moderation Actions]**

### Admin/Moderator Dashboard
-   **User Management**: Interface to query `users` table, update `role` or add a suspension flag/table.
-   **Content Moderation**: Interface to manage `review_reports`.
-   **Site Analytics**: Dashboards summarizing data from various tables (user counts, review counts, etc.).
-   **System Configuration**: Manage application-level settings (e.g., feature flags stored in config or a dedicated table).
-   **(Optional) Curated Content**: Interface to manage a `featured_content` table/mechanism.
-   **[Admin/Moderator Role Required]**

### Notifications System
-   **In-App Notifications**: Use `notifications` table.
-   **Notification Triggers**: Create entries in `notifications` table based on actions (likes, comments, follows, recommendations, moderation). Use Supabase Realtime to push updates.
-   **Management**: Update `is_read` / `read_at` fields in `notifications` table.
-   **[Authentication Required]**

### Data Export/Import
-   **Export**: Provide functionality to query user's data across relevant tables (`watched_content`, `reviews`, `lists`, etc.) and format as CSV/JSON.
-   **(Phase 3+) Import**: Parse uploaded files (CSV/JSON) and create corresponding entries in user's tables.
-   **Account Deletion**: Provide mechanism to delete user from `auth.users` and cascade deletes through `users` table and related data.
-   **[Authentication Required]**

## 6. Data Models (Finalized)

*These SQL definitions represent the finalized database schema incorporating all refinements. Assumes necessary extensions like `uuid-ossp` are enabled in PostgreSQL.*

**Key Considerations for Implementation:**

-   The `users.id` column should act as a foreign key referencing `auth.users.id` from Supabase Auth. Triggers or application logic should ensure synchronization.
-   Implement Row Level Security (RLS) policies extensively on these tables to enforce data access rules based on user authentication (`auth.uid()`) and roles (`users.role`).
-   Indexes provided are crucial for performance; add more based on specific query patterns identified during development.
-   Consider using database functions or triggers for managing denormalized counts (`likes_count`, `comments_count`) or complex calculations if needed.

---

**Users**

```sql
-- Enable UUID generation if not already enabled
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Should reference auth.users.id
  email TEXT UNIQUE NOT NULL, -- Potentially retrieved from auth.users
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  region TEXT DEFAULT 'US',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on role for admin queries
CREATE INDEX idx_users_role ON users(role);

-- Consider adding a trigger to sync with auth.users on signup/update
```

---

**Follows**

```sql
CREATE TABLE follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);
```

---

**Watched Content**

```sql
CREATE TABLE watched_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  watched_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_rating SMALLINT CHECK (user_rating BETWEEN 1 AND 10),
  is_rewatch BOOLEAN DEFAULT FALSE,
  rewatch_count INTEGER DEFAULT 0, -- Consider managing via trigger/logic
  notes TEXT,
  contains_spoilers BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  posted_as_review BOOLEAN DEFAULT FALSE, -- Might trigger review creation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, tmdb_id, media_type, watched_date) -- Allows multiple watches on different dates
);

-- Add index for finding watched content by user
CREATE INDEX idx_watched_content_user_id ON watched_content(user_id);
-- Add index for finding watched content by media
CREATE INDEX idx_watched_content_media ON watched_content(tmdb_id, media_type);
```

---

**Detailed Ratings**

```sql
CREATE TABLE detailed_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  watched_content_id UUID NOT NULL REFERENCES watched_content(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('acting', 'story', 'visuals', 'soundtrack', 'direction', 'enjoyment')),
  rating SMALLINT CHECK (rating BETWEEN 1 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (watched_content_id, category)
);
```

---

**Emotional Reactions**

```sql
CREATE TABLE emotional_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  watched_content_id UUID NOT NULL REFERENCES watched_content(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('loved', 'liked', 'mixed', 'disliked', 'hated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (watched_content_id)
);
```

---

**Episode Tracking**

```sql
CREATE TABLE episode_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL, -- Series ID
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  watched BOOLEAN DEFAULT TRUE,
  watched_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rating SMALLINT CHECK (rating BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, tmdb_id, season_number, episode_number)
);

-- Add index for finding episodes by series
CREATE INDEX idx_episode_tracking_series ON episode_tracking(user_id, tmdb_id);
-- Add index for finding episodes by season
CREATE INDEX idx_episode_tracking_season ON episode_tracking(user_id, tmdb_id, season_number);
```

---

**Watchlist Content**

```sql
CREATE TABLE watchlist_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  priority SMALLINT DEFAULT 0,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  UNIQUE (user_id, tmdb_id, media_type)
);

-- Add index for finding watchlist by user
CREATE INDEX idx_watchlist_user_id ON watchlist_content(user_id);
```

---

**Custom Lists**

```sql
CREATE TABLE custom_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  -- Add column for banner image URL
  banner_image_url TEXT NULL, -- Stores URL from Supabase Storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for finding lists by user
CREATE INDEX idx_custom_lists_user_id ON custom_lists(user_id);
-- Optional: Index for public lists potentially ordered by creation/update time if needed for discovery
CREATE INDEX idx_custom_lists_public_visibility ON custom_lists(visibility, updated_at DESC) WHERE visibility = 'public';
```

---

**List Items**

```sql
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES custom_lists(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  sort_order INTEGER NOT NULL, -- Ensure this is managed correctly
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (list_id, tmdb_id, media_type)
);

-- Add index for efficiently retrieving list contents
CREATE INDEX idx_list_items_list_id ON list_items(list_id);
```

---

**Reviews**

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  content TEXT NOT NULL,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 10),
  is_spoiler BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
  likes_count INTEGER DEFAULT 0, -- Consider managing via triggers/functions
  comments_count INTEGER DEFAULT 0, -- Consider managing via triggers/functions
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  watched_content_id UUID REFERENCES watched_content(id) ON DELETE SET NULL, -- Link to specific watch entry
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Enforce uniqueness for the user/item combination, regardless of anonymity
  UNIQUE (user_id, tmdb_id, media_type)
);

-- Add indexes for finding reviews by media or user
CREATE INDEX idx_reviews_media ON reviews(tmdb_id, media_type);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
-- Add index for finding reviews linked to watched content
CREATE INDEX idx_reviews_watched_content_id ON reviews(watched_content_id);
```

---

**Review Responses**

```sql
CREATE TABLE review_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL, -- Consider ENUM or linking to a prompts table
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for retrieving responses for a review
CREATE INDEX idx_review_responses_review_id ON review_responses(review_id);
```

---

**Review Interactions**

```sql
CREATE TABLE review_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'comment')),
  content TEXT, -- Only relevant for comments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Enforce only one 'like' per user per review
  UNIQUE (review_id, user_id, interaction_type) WHERE interaction_type = 'like'
);

-- Add index for finding interactions by review
CREATE INDEX idx_review_interactions_review_id ON review_interactions(review_id);
-- Add index for finding user's interactions
CREATE INDEX idx_review_interactions_user_id ON review_interactions(user_id);
```

---

**Social Watching**

```sql
CREATE TABLE social_watching (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  watched_content_id UUID NOT NULL REFERENCES watched_content(id) ON DELETE CASCADE,
  watched_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (watched_content_id, watched_with_user_id)
);
```

---

**Content Recommendations**

```sql
CREATE TABLE content_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'watched')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id, tmdb_id, media_type)
);

-- Add indexes for finding recommendations
CREATE INDEX idx_recommendations_to_user ON content_recommendations(to_user_id, status);
CREATE INDEX idx_recommendations_from_user ON content_recommendations(from_user_id);
```

---

**Review Reports**

```sql
CREATE TABLE review_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('inappropriate', 'spoilers', 'harassment', 'off_topic', 'misleading', 'spam')), -- Added spam
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'action_taken')),
  moderator_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User who handled the report
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (review_id, reporter_id) -- Prevent multiple reports by same user on same review
);

-- Add index for moderation queue (status first, then time)
CREATE INDEX idx_review_reports_status_created ON review_reports(status, created_at);
```

---

**Notifications**

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'recommendation', 'moderation', 'system', 'list_like', 'list_update', 'social_watch_tag')), -- Added more types
  content JSONB NOT NULL, -- Store relevant IDs (e.g., review_id, follower_id, list_id, watched_content_id)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Add index for retrieving user notifications efficiently (unread first)
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
-- Add index for retrieving all notifications for a user chronologically
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
```

---

**User Preferences**

```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_review_visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  default_list_visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  enable_recommendations BOOLEAN DEFAULT TRUE, -- If ML recommendations are implemented
  notification_preferences JSONB DEFAULT '{
      "email": { "follows": false, "comments": false, "likes": false, "recommendations": false, "moderation": false },
      "in_app": { "follows": true, "comments": true, "likes": true, "recommendations": true, "moderation": true, "list_like": true, "social_watch_tag": true }
    }'::jsonb, -- More granular example
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

**TMDB Cache (Optional)**

```sql
CREATE TABLE tmdb_cache (
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv', 'person')),
  language TEXT NOT NULL DEFAULT 'en-US', -- Add language to key if caching different languages
  data JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Add an expiry timestamp for proactive refresh
  PRIMARY KEY (tmdb_id, media_type, language) -- Updated primary key
);

-- Index for finding cache entries, potentially by expiry
CREATE INDEX idx_tmdb_cache_expiry ON tmdb_cache(expires_at);
```

---

## 7. API Endpoints (Consolidated)

*This list defines the logical API interactions required. Simple CRUD may use Supabase client directly; complex logic may require explicit `/api/...` routes.*
*`[Auth Required]` denotes user authentication needed.*
*`[Admin/Mod Required]` denotes specific role needed.*

---

### Authentication

*   `POST /api/auth/signup` - Register new user (Body: `email`, `password`, `displayName`)
*   `POST /api/auth/login` - Log in user (Body: `email`, `password` or provider details)
*   `POST /api/auth/logout` - Log out user `[Auth Required]`
*   `POST /api/auth/reset-password` - Request password reset
*   `POST /api/auth/update-password` - Update password
*   `GET /api/auth/me` - Get current user session/profile `[Auth Required]`
*   `POST /api/auth/refresh` - Refresh token (usually handled by client)

---

### TMDB Data Proxy / Integration (Server-Side Logic)

*(Internal functions/handlers, not usually direct `/api` routes)*
*   `GET /tmdb/search` - Params: `query`, `page`, `filters`
*   `GET /tmdb/discover/{media_type}` - Params: `sort_by`, `with_genres`, `year`, etc.
*   `GET /tmdb/trending/{media_type}/{time_window}`
*   `GET /tmdb/movie/{tmdbId}` - Params: `language`, `append_to_response`
*   `GET /tmdb/tv/{tmdbId}` - Params: `language`, `append_to_response`
*   `GET /tmdb/tv/{tmdbId}/season/{seasonNumber}`
*   `GET /tmdb/tv/{tmdbId}/season/{seasonNumber}/episode/{episodeNumber}`
*   `GET /tmdb/person/{personId}`
*   `GET /tmdb/{media_type}/{tmdbId}/watch/providers`
*   `GET /tmdb/genres/{media_type}/list`

---

### Users & Profiles

*   `GET /api/users/{userIdOrDisplayName}` - Get public user profile
*   `GET /api/users/me/profile` - Get current user's full profile `[Auth Required]`
*   `PATCH /api/users/me/profile` - Update current user's profile `[Auth Required]` (Body: `displayName`, `bio`, `avatar_url`)
*   `GET /api/users/me/preferences` - Get current user's preferences `[Auth Required]`
*   `PATCH /api/users/me/preferences` - Update current user's preferences `[Auth Required]` (Body: preference fields)
*   `GET /api/users/{userId}/activity` - Get user's public activity feed (Params: `page`, `filter`)

---

### Follows

*   `GET /api/users/{userId}/followers` - Get followers list
*   `GET /api/users/{userId}/following` - Get following list
*   `POST /api/users/{userId}/follow` - Follow user `[Auth Required]`
*   `DELETE /api/users/{userId}/follow` - Unfollow user `[Auth Required]`

---

### Watched Content & Tracking

*   `GET /api/users/{userId}/watched` - Get watched list (Params: `page`, `sort_by`, `media_type`, filters)
*   `POST /api/watched` - Log watched content `[Auth Required]` (Body: `tmdb_id`, `media_type`, `watched_date`, `user_rating`, etc.)
*   `GET /api/watched/{watchedId}` - Get specific watched entry details `[Auth Required]` (RLS check)
*   `PATCH /api/watched/{watchedId}` - Update watched entry `[Auth Required]` (RLS check)
*   `DELETE /api/watched/{watchedId}` - Delete watched entry `[Auth Required]` (RLS check)
*   `POST /api/watched/{watchedId}/watched-with` - Tag users watched with `[Auth Required]` (Body: `user_ids: [...]`)
*   `DELETE /api/watched/{watchedId}/watched-with/{userId}` - Remove tagged user `[Auth Required]`

*   **Episode Tracking:**
    *   `GET /api/users/{userId}/episodes/{seriesId}` - Get tracked episodes (Params: `season_number`)
    *   `POST /api/episodes/track` - Log watched episode(s) `[Auth Required]` (Body: `{ seriesId, seasonNumber, episodeNumber(s), ... }`)
    *   `PATCH /api/episodes/track/{trackingId}` - Update tracked episode `[Auth Required]` (RLS check)
    *   `DELETE /api/episodes/track/{trackingId}` - Untrack episode `[Auth Required]` (RLS check)
    *   `POST /api/episodes/track-season` - Mark season watched `[Auth Required]` (Body: `{ seriesId, seasonNumber, ... }`)

---

### Watchlist

*   `GET /api/users/{userId}/watchlist` - Get watchlist (Params: `page`, `sort_by`)
*   `POST /api/watchlist` - Add to watchlist `[Auth Required]` (Body: `tmdb_id`, `media_type`, `notes`, etc.)
*   `DELETE /api/watchlist/{watchlistItemId}` - Remove from watchlist `[Auth Required]` (RLS check)
*   `PATCH /api/watchlist/{watchlistItemId}` - Update watchlist item `[Auth Required]` (RLS check)

---

### Custom Lists & Items

*   `GET /api/users/{userId}/lists` - Get user's custom lists (Params: `page`)
*   `GET /api/lists/public` - Get public custom lists (Params: `page`, `sort_by`)
*   `POST /api/lists` - Create list `[Auth Required]` (Body: `name`, `description`, `visibility`)
*   `GET /api/lists/{listId}` - Get list details/items (RLS/visibility check)
*   `PATCH /api/lists/{listId}` - Update list details `[Auth Required]` (RLS check)
*   `DELETE /api/lists/{listId}` - Delete list `[Auth Required]` (RLS check)
*   `POST /api/lists/{listId}/items` - Add item `[Auth Required]` (RLS check) (Body: `tmdb_id`, `media_type`, `notes`)
*   `DELETE /api/lists/{listId}/items/{listItemId}` - Remove item `[Auth Required]` (RLS check)
*   `PATCH /api/lists/{listId}/items/reorder` - Reorder items `[Auth Required]` (RLS check) (Body: `ordered_item_ids: [...]`)
*   `POST /api/lists/{listId}/like` - Like list `[Auth Required]`
*   `DELETE /api/lists/{listId}/like` - Unlike list `[Auth Required]`
*   `POST /api/lists/{listId}/clone` - Clone list `[Auth Required]`
*   `POST /api/lists/{listId}/banner` - Upload banner image `[Auth Required]` (multipart/form-data)
*   `DELETE /api/lists/{listId}/banner` - Remove banner image `[Auth Required]`

---

### Reviews & Interactions

*   `GET /api/reviews` - Get reviews (Params: `tmdb_id`, `media_type`, `user_id`, `page`, `sort_by`)
*   `POST /api/reviews` - Create review `[Auth Required]` (Body: `tmdb_id`, `media_type`, `content`, `rating`, etc.)
*   `GET /api/reviews/{reviewId}` - Get specific review (Respects visibility)
*   `PATCH /api/reviews/{reviewId}` - Update review `[Auth Required]` (RLS check)
*   `DELETE /api/reviews/{reviewId}` - Delete review `[Auth Required]` (RLS check)

*   **Interactions:**
    *   `GET /api/reviews/{reviewId}/likes` - Get likers
    *   `POST /api/reviews/{reviewId}/like` - Like review `[Auth Required]`
    *   `DELETE /api/reviews/{reviewId}/like` - Unlike review `[Auth Required]`
    *   `GET /api/reviews/{reviewId}/comments` - Get comments (Params: `page`)
    *   `POST /api/reviews/{reviewId}/comments` - Add comment `[Auth Required]` (Body: `content`)
    *   `DELETE /api/comments/{commentId}` - Delete comment `[Auth Required]` (RLS or Mod check)
    *   `PATCH /api/comments/{commentId}` - Edit comment `[Auth Required]` (RLS check)

*   **Review Responses (Prompts):**
    *   `GET /api/reviews/{reviewId}/responses` - Get responses `[Auth Required]` (RLS check)
    *   `POST /api/reviews/{reviewId}/responses` - Add/update responses `[Auth Required]` (RLS check) (Body: `[{ prompt: "...", response: "..." }, ...]`)

---

### Recommendations

*   `GET /api/recommendations/received` - Get received recommendations `[Auth Required]` (Params: `status`, `page`)
*   `GET /api/recommendations/sent` - Get sent recommendations `[Auth Required]` (Params: `page`)
*   `POST /api/recommendations` - Send recommendation `[Auth Required]` (Body: `to_user_id`, `tmdb_id`, `media_type`, `message`)
*   `PATCH /api/recommendations/{recommendationId}` - Update status `[Auth Required]` (RLS check) (Body: `status`)
*   `DELETE /api/recommendations/{recommendationId}` - Delete recommendation `[Auth Required]` (RLS check)

---

### Notifications

*   `GET /api/notifications` - Get notifications `[Auth Required]` (Params: `page`, `is_read`, `type`)
*   `GET /api/notifications/count` - Get unread count `[Auth Required]`
*   `PATCH /api/notifications/{notificationId}/read` - Mark as read `[Auth Required]`
*   `POST /api/notifications/read-all` - Mark all as read `[Auth Required]`

---

### Reporting & Moderation

*   `POST /api/reports/review` - Report a review `[Auth Required]` (Body: `review_id`, `reason`, `details`)
*   `GET /api/moderation/reports` - Get reports list `[Admin/Mod Required]` (Params: `page`, `status`, `reason`)
*   `GET /api/moderation/reports/{reportId}` - Get report details `[Admin/Mod Required]`
*   `PATCH /api/moderation/reports/{reportId}` - Resolve report `[Admin/Mod Required]` (Body: `status`, `resolution_notes`)

---

### Admin

*   `GET /api/admin/users` - Get users list `[Admin Required]` (Params: `page`, `search`, `role`)
*   `GET /api/admin/users/{userId}` - Get user details `[Admin Required]`
*   `PATCH /api/admin/users/{userId}` - Update user role/status `[Admin Required]` (Body: `role`, `is_suspended`)
*   `GET /api/admin/analytics` - Get site analytics `[Admin Required]` (Params: `metric`, `period`)
*   `POST /api/admin/curated-content` - Manage featured content `[Admin Required]`

---

### Data Management

*   `GET /api/data/export` - Initiate data export `[Auth Required]` (Params: `format`)
*   `POST /api/data/import` - Initiate data import `[Auth Required]` (Body: `service` + File Data)
*   `DELETE /api/users/me/account` - Delete own account `[Auth Required]` (Requires confirmation)

## 8. Error Handling Strategy

### Standard Error Codes
- **400 Bad Request**: Invalid input, validation errors (`VALIDATION_ERROR`).
- **401 Unauthorized**: Authentication required or token invalid/expired (`AUTH_REQUIRED`, `AUTH_INVALID_TOKEN`).
- **403 Forbidden**: User authenticated but lacks permission for the action (`PERMISSION_DENIED`).
- **404 Not Found**: Requested resource does not exist (`RESOURCE_NOT_FOUND`).
- **409 Conflict**: Action cannot be completed due to current state (e.g., username already exists `RESOURCE_CONFLICT`, review already exists).
- **422 Unprocessable Entity**: Input format correct, but violates semantic rules (`SEMANTIC_ERROR`).
- **429 Too Many Requests**: Rate limit exceeded (`RATE_LIMIT_EXCEEDED`).
- **500 Internal Server Error**: Unexpected server-side error (`INTERNAL_ERROR`, `DATABASE_ERROR`, `TMDB_API_ERROR`).

### Error Response Format (for custom API routes)
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE", // e.g., "VALIDATION_ERROR"
    "message": "A human-readable summary of the error.",
    "details": { // Optional: Field-specific errors or additional context
      "field_name": "Specific error message for this field."
    }
  }
}
```
*Note: Supabase client errors might have their own structure, which should be handled and potentially normalized.*

### Error Code Catalog (Examples)
- `AUTH_INVALID_CREDENTIALS`: Login failed.
- `AUTH_EMAIL_ALREADY_EXISTS`: Registration failed.
- `VALIDATION_ERROR`: Input data failed validation rules.
- `RESOURCE_NOT_FOUND`: e.g., List or Review with the given ID not found.
- `PERMISSION_DENIED`: e.g., User trying to edit another user's review.
- `RATE_LIMIT_EXCEEDED`: Too many login attempts or API calls.
- `TMDB_API_ERROR`: Failure fetching data from TMDB.
- `RESOURCE_CONFLICT`: E.g., trying to create a review that already exists for the user/item.

### Error Handling Implementation
1.  **Input Validation**: Use libraries like Zod in Route Handlers and Server Actions to validate incoming data schemas.
2.  **Server-Side Handling**: Catch errors in API routes/server components, log them, and return standardized error responses. Use try/catch blocks around Supabase calls and TMDB API calls.
3.  **Client-Side Handling (TanStack Query)**: Utilize `onError` callbacks in TanStack Query hooks to handle failed requests, display user-friendly messages (e.g., using toast notifications), and manage UI state (e.g., revert optimistic updates).
4.  **Global Error Boundaries (React)**: Implement React Error Boundaries to catch rendering errors in specific parts of the UI and display fallback components.
5.  **Logging**: Integrate a logging service (e.g., Supabase Logs, Sentry, Logtail) to capture detailed error information (including stack traces) in staging and production environments. Avoid logging sensitive user data.
6.  **Monitoring & Alerting**: Set up alerts for high error rates or critical failures.

## 9. Security Considerations

### Authentication Security
- **Token Handling**: Utilize Supabase's built-in JWT handling (short-lived access tokens, longer-lived refresh tokens stored securely, potentially in HttpOnly cookies). Enable Refresh Token Rotation.
- **Password Policies**: Enforce minimum password complexity via Supabase Auth settings.
- **Rate Limiting**: Implement rate limiting on authentication endpoints (login, signup, password reset).
- **CSRF Protection**: Ensure framework-level CSRF protection if applicable (less critical with JWT header auth).

### Authorization Matrix
*(Simplified - detailed RLS policies are key)*
| Role      | Action                                         | Target        | Access Level      | Enforcement             |
| :-------- | :--------------------------------------------- | :------------ | :---------------- | :---------------------- |
| Public    | View Public Content/Lists/Reviews              | Public Data   | Read              | RLS (`visibility`)      |
| User      | CRUD Own Data                                  | Own Data      | CRUD              | RLS (`auth.uid()`)      |
| User      | Interact (Like, Follow, Comment)               | Other's Data  | Create/Delete     | RLS (`auth.uid()`)      |
| Moderator | Read Reports, Update Review Status             | Reviews/Users | Read/Update       | RLS (role check)        |
| Admin     | Manage Users, All Reports, Config              | All Data      | CRUD              | RLS (role check)        |

### Data Protection
- **Input Sanitization/Validation**: Sanitize user content server-side (e.g., `DOMPurify`) to prevent XSS. Validate schemas (Zod).
- **SQL Injection Prevention**: Use Supabase client libraries (parameterized queries).
- **Row Level Security (RLS)**: **Enable RLS on all tables** with user data. Define strict policies based on `auth.uid()` and roles.
- **HTTPS**: Enforce HTTPS (handled by Vercel/Supabase).
- **API Key Security**: Store TMDB API key securely (environment variable, server-side access only).
- **Supabase Storage**: Implement RLS policies for Storage buckets, especially for list banner images:
  - **Upload/Delete**: Verify the user owns the list before allowing upload/deletion to paths matching `list-banners/{listId}/*`
  - **Read**: Allow public read access for non-sensitive images like list banners

### Code Security
- **Dependency Management**: Regularly audit dependencies (`npm audit`, Dependabot).
- **Content Security Policy (CSP)**: Implement appropriate CSP headers via Next.js configuration.
- **Secure Headers**: Configure other security headers (HSTS, X-Frame-Options, etc.).

## 10. Responsive Design Strategy

### Mobile-First Approach
- Design and develop components starting from the smallest viewport (approx. 375px width).
- Ensure core functionality is easily accessible and usable on small touchscreens.
- Progressively enhance layouts and features for larger screens.

### Responsive Breakpoints (Tailwind Defaults)
- **sm**: 640px | **md**: 768px | **lg**: 1024px | **xl**: 1280px | **2xl**: 1536px

### Mobile-Specific UI/UX Considerations
- **Navigation**: Consider bottom tab bar on mobile (`sm` and below), sidebar/top navbar on larger screens.
- **Touch Targets**: Minimum tap target size of 44x44px.
- **Layouts**: Single-column feeds/forms on mobile, multi-column grids on tablets/desktops.
- **Information Density**: Prioritize essential info, use progressive disclosure.
- **Gestures**: Consider swipes for carousels, etc.

### Component Adaptation Examples
- **MediaGrid**: 1-2 columns (mobile), 3-4 (tablet), 5+ (desktop).
- **DetailsPage**: Stacked (mobile), multi-column (desktop).
- **Forms**: Full-width inputs stacked (mobile), multi-column/inline labels (desktop).
- **Custom Lists with Banners**: Full-width banner at top on mobile, potentially letterbox/widescreen format on larger devices.

### Testing Requirements
- Test across major breakpoints on emulators and real devices.
- Target browsers: Latest Chrome, Firefox, Safari (Desktop & Mobile iOS).
- Verify touch interactions and performance.

## 11. Accessibility Features

### WCAG 2.1 AA Compliance Standard
- Strive to meet all Level A and AA success criteria.

### Implementation Details
- **Semantic HTML**: Use correct HTML5 elements.
  - Use proper heading hierarchy (h1-h6).
  - Use buttons for interactive elements, anchors for navigation.
  - Use section, article, nav, main, aside appropriately.
  - Use figure/figcaption for media with descriptions.
- **Keyboard Navigation**: 
  - All interactive elements focusable/operable.
  - Logical focus order matches visual order.
  - Visible focus indicators with high contrast.
  - `Skip Navigation` links for bypassing repeated content.
  - Custom focus management for modals and popups.
- **Screen Reader Support**: 
  - Descriptive `alt` text for images; empty alt for decorative images.
  - ARIA attributes where HTML semantics are insufficient.
  - Dynamic content announcements for important UI changes.
  - Proper form labeling and error association.
  - Use aria-live regions for critical updates.
  - Text alternatives for non-text content (charts, graphs).
- **Visual Accessibility**: 
  - Sufficient color contrast (4.5:1 normal, 3:1 large text).
  - Text resizable to 200% without loss of content/function.
  - No reliance on color alone for conveying information.
  - Clear text on backgrounds (avoid text on busy images).
  - Zoom compatibility (no horizontal scrolling at 400% zoom).
- **Motion Sensitivity**: 
  - Respect `prefers-reduced-motion` media query.
  - Provide controls to pause/stop animations and carousels.
  - No flashing content that could trigger seizures.
- **Forms and Validation**:
  - Clear, persistent error messages.
  - Error identification without relying solely on color.
  - Descriptive labels and instructions for all inputs.
  - Sufficient time to complete forms with options to extend.

### Accessibility Testing
- **Automated Tools**: 
  - `axe-core` integration in development workflow.
  - Lighthouse accessibility audits in CI pipeline.
  - WAVE or similar for periodic full-site checks.
- **Manual Keyboard Testing**: 
  - Navigate entire application without a mouse.
  - Verify all interactive elements are reachable and operable.
  - Test modal/dialog trapping and escape functionality.
- **Screen Reader Testing**: 
  - Test critical flows with at least one screen reader (NVDA, VoiceOver).
  - Verify proper announcement of dynamic content changes.
  - Check for duplicate/redundant announcements.
- **Color Contrast Checks**: 
  - Browser developer tools contrast analyzers.
  - Dedicated color contrast checking plugins/tools.
  - Testing in various color modes (light/dark) and user themes.

## 12. Performance Optimization

### Performance Targets (Core Web Vitals & Load Times)
- **FCP (First Contentful Paint)**: < 1.8s
- **LCP (Largest Contentful Paint)**: < 2.5s
- **INP (Interaction to Next Paint)**: < 200ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTI (Time to Interactive)**: < 3.5s
- **Initial Bundle Size**: Aim < 500KB gzipped

### Optimization Strategies

#### Next.js Features
- **Server Components**: Use extensively to reduce client-side JavaScript.
- **`next/dynamic`**: Implement code splitting for large components.
- **`next/font`**: Utilize for optimized font loading.
- **`next/image`**: Implement for automatic image optimization.
- **App Router**: Leverage route-based code splitting.
- **Static Regeneration**: Use ISR where appropriate for TMDB data.

#### Efficient Data Fetching
- **TanStack Query**: 
  - Implement caching, deduping, and background refresh.
  - Use `keepPreviousData` for smoother pagination.
  - Set appropriate stale times based on data freshness needs.
- **Request Optimization**:
  - Fetch only needed fields from Supabase.
  - Implement pagination for all list views (Supabase `.range()`, TMDB `page`).
  - Aggregate queries where possible to reduce roundtrips.
- **Cache Strategies**:
  - Cache TMDB responses in `tmdb_cache` table with TTL.
  - Use browser caching with appropriate headers.
  - Consider Redis for frequently accessed data (future enhancement).

#### Bundle Size Reduction
- **Bundle Analysis**: Implement `@next/bundle-analyzer` for monitoring.
- **Dependencies**: 
  - Minimize external dependencies.
  - Prefer smaller alternatives when available.
  - Use modular imports (e.g., `lodash-es`).
- **Tree-Shaking**: Ensure effective tree-shaking via proper exports.
- **Tailwind**: Configure purging for production builds.
- **Code Splitting**: Route-based plus dynamic imports for large features.

#### Rendering Performance
- **Memoization**: 
  - `React.memo` for expensive components.
  - `useMemo` for costly computations.
  - `useCallback` for frequently used callbacks.
- **List Virtualization**: 
  - `TanStack Virtual` for long lists (e.g., episodes, activity feeds).
  - Implement for lists exceeding 50 items.
- **Animation Performance**: 
  - Use CSS transforms/opacity for animations.
  - Avoid layout-triggering properties (width/height) in animations.
  - Throttle scroll event handlers.

#### Network Optimization
- **CDNs**: 
  - Vercel's Edge Network for static assets.
  - TMDB's image CDN for media.
- **HTTP Caching**: 
  - Appropriate cache headers for static assets.
  - Immutable content with long cache times.
- **Prefetching**: 
  - Prefetch likely-to-be-visited routes.
  - Preconnect to third-party domains (TMDB).
- **Compression**: 
  - Enable Brotli/Gzip for all textual responses.
  - Optimize image formats (WebP/AVIF support).

#### Image Optimization
- **Responsive Images**: 
  - Serve appropriately sized images based on viewport.
  - Use Next.js Image component with sizes attribute.
- **Format Selection**: 
  - WebP/AVIF with PNG/JPEG fallbacks.
  - Choose formats based on image content type.
- **User Uploads**: 
  - Process uploaded images server-side to optimize (list banners).
  - Resize to reasonable dimensions (max 1920px width).
  - Compress to reasonable file sizes (< 500KB for banners).
- **Lazy Loading**: 
  - Implement for below-the-fold images.
  - Use placeholder strategies for important images.

### Monitoring and Improvement
- **Audits**: 
  - Regular Lighthouse audits (Performance, Accessibility, Best Practices, SEO).
  - WebPageTest for deeper analysis and real-world conditions.
- **RUM (Real User Monitoring)**: 
  - Implement Vercel Analytics or similar.
  - Collect Core Web Vitals from actual users.
  - Track by device type, connection speed, geography.
- **Performance Budgets**: 
  - Monitor in CI/CD pipeline.
  - Set bundle size limits and page load time thresholds.
  - Block deployments that exceed budgets significantly.
- **Continuous Optimization**: 
  - Regular performance review cycle.
  - Set up alerts for performance regressions.
  - Document optimization techniques for team knowledge sharing.

## 13. Timeline and Phases

*(Estimates based on features for a small to medium team)*

### Phase 1: Foundation & Core Content (4 weeks)
- **Week 1**: Project setup, repository structure, CI/CD pipeline
  - Initialize Next.js project with TypeScript
  - Set up Supabase project and base schema
  - Configure authentication flow
  - Establish coding standards and documentation
- **Week 2**: TMDB API integration
  - Build reusable TMDB client
  - Implement data mapping and type definitions
  - Create proxy endpoints for frontend consumption
- **Week 3-4**: Public browsing functionality
  - Homepage with trending/popular/upcoming sections
  - Search functionality with basic filters
  - Movie/TV show detail pages
  - Cast & crew information
  - "Where to watch" providers

### Phase 2: Personal Tracking & Lists (4 weeks)
- **Week 5-6**: Core user features
  - Profile management
  - Watched content tracking
  - Primary rating system implementation
  - Basic watchlist functionality
- **Week 7-8**: Custom lists & organization
  - Custom list creation, editing, and viewing
  - List banner image upload/management
  - Item management within lists
  - Priority/sorting controls
  - Privacy/visibility settings

### Phase 3: Social Features & Engagement (4 weeks)
- **Week 9-10**: Review system
  - Review creation/editing interface
  - Detailed ratings and reactions
  - Review display on content pages
  - Spoiler handling
- **Week 11-12**: Social connectivity
  - User follow system
  - Activity feed implementation
  - Review interactions (likes, comments)
  - Recommendation system between users
  - Content sharing functionality

### Phase 4: Advanced Tracking & Personalization (3 weeks)
- **Week 13**: TV Show episode tracking
  - Episode-level marking/rating
  - Season progress visualization
  - "Continue watching" suggestions
- **Week 14**: Advanced ratings & reactions
  - Category-based ratings
  - Emotional reactions
  - Guided review prompts
  - Social watching tags
- **Week 15**: Basic recommendations & export
  - Implement basic algorithmic recommendations
  - Data export functionality (CSV/JSON)
  - User preferences refinement

### Phase 5: Moderation, Admin & Polish (3 weeks)
- **Week 16**: Moderation system
  - Content reporting flow
  - Moderator review queue
  - Report resolution process
- **Week 17**: Admin dashboard & management
  - User management tools
  - Site analytics dashboards
  - System configuration interface
- **Week 18**: Refinement & optimization
  - Performance optimization
  - Accessibility audit & improvements
  - Cross-browser/device testing

### Phase 6: Launch & Iteration (Ongoing)
- **Pre-Launch**: Final QA and preparation
  - Comprehensive testing
  - Documentation completion
  - Marketing materials and landing page
- **Launch**: Production deployment
  - Phased rollout strategy
  - Monitoring for issues
  - Initial user onboarding
- **Post-Launch**: Ongoing improvement
  - Gather & analyze user feedback
  - Iterative feature development
  - Performance and stability improvements

## 14. Testing Strategy

### Test Types

#### Unit Testing
- **Framework**: Jest, React Testing Library
- **Coverage Target**: >80% for critical logic (services, utilities, hooks)
- **Focus Areas**:
  - Validation rules
  - Business logic functions
  - State transformations
  - API client methods
  - Custom hooks
- **Implementation**:
  - Test files co-located with source files
  - Naming convention: `*.test.ts(x)`
  - Mock external dependencies

#### Integration Testing
- **Framework**: Jest, React Testing Library, MSW (Mock Service Worker)
- **Coverage Target**: Key user flows and component interactions
- **Focus Areas**:
  - Form submissions
  - Complex component interactions
  - Data fetching and rendering
  - Authentication flows
  - Multi-step processes
- **Implementation**:
  - Mock API responses with MSW
  - Test component trees rather than isolated components
  - Verify state changes and UI updates

#### End-to-End (E2E) Testing
- **Framework**: Cypress
- **Coverage Target**: Critical user journeys
- **Focus Areas**:
  - Authentication/registration
  - Content discovery and detail viewing
  - Adding/rating watched content
  - List creation and management
  - Review writing and interactions
  - User profile management
- **Implementation**:
  - Use test data seeding
  - Realistic user behavior simulation
  - Test against staging environment

#### Performance Testing
- **Tools**: Lighthouse, WebPageTest, Bundle Analyzer
- **Metrics to Test**:
  - Core Web Vitals (LCP, CLS, INP)
  - Bundle size
  - API response times
  - Database query performance
- **Implementation**:
  - Automated in CI/CD pipeline
  - Regular manual audits
  - Performance budgets enforcement

#### Accessibility Testing
- **Tools**: Axe-core, manual testing
- **Standards**: WCAG 2.1 AA
- **Focus Areas**:
  - Screen reader compatibility
  - Keyboard navigation
  - Color contrast
  - Form accessibility
  - Focus management
- **Implementation**:
  - Automated checks in CI
  - Manual testing with assistive technologies
  - Regular accessibility audits

#### Visual Regression Testing
- **Tools**: Percy or similar
- **Coverage**: Critical UI components and pages
- **Implementation**:
  - Capture baseline screenshots
  - Compare against changes
  - Review visual differences

### Testing Environment & Process

#### Development Environment
- **Local Testing**:
  - Unit & integration tests run on pre-commit
  - Hot module reloading for rapid feedback
  - Mock APIs for frontend work
  - Local database for backend testing
- **Tools**:
  - Jest Watch Mode
  - React Testing Library
  - Supabase Local Development

#### CI (Pull Request) Environment
- **Automated Tests**:
  - Linting (ESLint, Prettier)
  - Type checking (TypeScript)
  - Unit & integration tests (Jest)
  - Basic E2E tests (subset of Cypress tests)
  - A11y tests (axe-core)
  - Bundle size checks
- **Process**:
  - Run on every PR against main/development
  - Block merge on test failures
  - Generate coverage reports
- **Preview Deployments**:
  - Vercel PR deployments
  - Ephemeral Supabase instance for PR testing

#### Staging Environment
- **Test Types**:
  - Full E2E test suite
  - Performance testing
  - Manual QA testing
  - Integration with production-like data
- **Process**:
  - Run after merge to development branch
  - Scheduled nightly regression tests
  - Manual exploratory testing
- **Configuration**:
  - Mirrors production but with test data
  - Separate Supabase project
  - Feature flags for beta testing

#### Production Environment
- **Test Types**:
  - Post-deployment smoke tests
  - Performance monitoring
  - Synthetic monitoring
  - Real User Monitoring (RUM)
- **Process**:
  - Canary deployments
  - Gradual rollout of features
  - Monitoring for regressions
- **Alerts**:
  - Error rate monitoring
  - Performance degradation alerts
  - Availability monitoring

### Testing Best Practices
- **Test Pyramid**: More unit tests, fewer E2E tests
- **Deterministic Tests**: Avoid flaky tests with proper setup/teardown
- **Test Isolation**: Tests shouldn't depend on each other
- **Realistic Data**: Use production-like test data
- **Test Readability**: Tests serve as documentation
- **Continuous Improvement**: Regular test review and refinement

## 15. Deployment and DevOps

### Environments

#### Development Environment
- **Purpose**: Individual developer work
- **Configuration**:
  - Local Next.js development server
  - Local environment variables (`.env.local`)
  - Connection to shared development Supabase or local instance
  - Development TMDB API key
- **Access**: Restricted to development team

#### Staging Environment
- **Purpose**: Integration testing, QA, demos
- **Configuration**:
  - Production-like setup on Vercel
  - Staging environment variables (`.env.staging`)
  - Separate Supabase project for staging
  - Staging TMDB API key with same permissions as production
- **Access**: Internal team, stakeholders, beta testers
- **Deployment Frequency**: On merge to development branch (multiple times per day)

#### Production Environment
- **Purpose**: Live user-facing application
- **Configuration**:
  - Vercel production deployment
  - Production environment variables (`.env.production`)
  - Production Supabase project with strict security
  - Production TMDB API key
- **Access**: Public (with authentication for protected features)
- **Deployment Frequency**: On release schedule (weekly or bi-weekly)

### CI/CD Pipeline (GitHub Actions)

#### On Pull Request
- **Steps**:
  1. Checkout code
  2. Install dependencies
  3. Lint (ESLint, Prettier)
  4. Type Check (TypeScript)
  5. Run Tests (Unit/Integration)
  6. Build application
  7. Optional E2E/A11y tests
  8. Preview Deployment on Vercel
- **Outcome**:
  - Status reported to GitHub PR
  - Preview URL in PR comments
  - Coverage report

#### On Merge to Development (Staging)
- **Steps**:
  1. Checkout code
  2. Install dependencies
  3. Build and deploy to Staging
  4. Run database migrations on Staging Supabase
  5. Run full E2E test suite against Staging
  6. Performance tests
- **Outcome**:
  - Updated Staging environment
  - Test reports
  - Notifications to team

#### On Release (Production)
- **Steps**:
  1. Create release branch
  2. Run final verification tests
  3. Create GitHub Release with changelog
  4. Deploy to Production
  5. Run database migrations on Production Supabase
  6. Run smoke tests
  7. Monitor error rates
- **Outcome**:
  - Updated Production environment
  - Release notes
  - Deployment notifications

### Infrastructure

#### Frontend Hosting (Vercel)
- **Configuration**:
  - Edge Network deployment
  - Automatic HTTPS
  - Serverless Functions for API routes
  - Continuous deployment
- **Scaling**:
  - Automatic scaling based on load
  - Global CDN for static assets
- **Monitoring**:
  - Vercel Analytics for performance
  - Integrated error tracking

#### Backend Services (Supabase)
- **Database**:
  - PostgreSQL database with RLS
  - Connection pooling for multiple connections
  - Daily backups
  - Point-in-time recovery enabled
- **Authentication**:
  - Supabase Auth with JWT
  - Social logins configuration
  - Custom email templates
- **Storage**:
  - Buckets for user avatars and list banners
  - RLS policies enforcing access control
  - CDN delivery of public assets
- **Realtime**:
  - Realtime subscriptions for notifications
  - Broadcast channels for activity updates
- **Edge Functions**:
  - Custom server-side logic
  - Scheduled jobs (if needed)
  - TMDB API integrations

#### File Storage
- **Supabase Storage**:
  - Separate buckets for different content types:
    - `avatars` - User profile images
    - `list-banners` - Custom list banner images
  - Size limits enforced (e.g., 5MB for images)
  - Image optimization via server-side processing
  - CDN distribution

#### Monitoring and Observability
- **Error Tracking**: Sentry
  - Source maps for readable stack traces
  - Error grouping and prioritization
  - Performance monitoring
- **Analytics**:
  - Vercel Analytics for performance
  - Custom analytics for user behavior
- **Logging**:
  - Supabase Logs for database/auth
  - Structured logging for Edge Functions
  - Log aggregation service (optional)
- **Alerts**:
  - Error spike notifications
  - Performance degradation alerts
  - Scheduled uptime checks

### Maintenance

#### Dependency Management
- **Regular Updates**:
  - Dependabot configuration
  - Weekly dependency review
  - Security vulnerabilities prioritized
- **Version Control**:
  - Lockfiles committed (yarn.lock/package-lock.json)
  - Major version upgrades planned and tested

#### Database Management
- **Backups**:
  - Automated daily backups (Supabase)
  - Manual backups before major migrations
  - Backup retention policy (30 days)
- **Migrations**:
  - Version-controlled migration files
  - Migration testing in staging
  - Rollback plans for each migration
- **Monitoring**:
  - Query performance tracking
  - Index usage analysis
  - Growth metrics and capacity planning

#### Security Audits
- **Regular Reviews**:
  - Quarterly security assessments
  - Dependency vulnerability scans
  - RLS policy audits
  - Authentication flow review
- **Penetration Testing**:
  - Annual security testing
  - Focus on authentication and data protection

#### Documentation Maintenance
- **Keep Updated**:
  - API documentation
  - Environment setup guides
  - Deployment procedures
  - Incident response playbooks

## 16. Internationalization and Localization (I18n / L10n)

### Language Support

#### Initial Launch
- **Primary Language**: English (en-US)
- **Interface**: All UI elements in English
- **Content**: User-generated content primarily English
- **TMDB Data**: Retrieved in English by default

#### Framework and Tools
- **Library**: `next-intl` for translations
- **File Structure**:
  - Locale files in `/locales/{locale}.json`
  - Namespace organization (e.g., `common`, `auth`, `profile`)
- **Implementation**:
  - Message extraction from codebase
  - Translation key management
  - Context-aware pluralization support

#### Future Expansion
- **Priority Languages** (Phase 2+):
  - Spanish (es)
  - French (fr)
  - German (de)
  - Portuguese (pt-BR)
  - Japanese (ja)
- **Implementation Plan**:
  - Professional translation of interface
  - Community translation platform for review
  - Beta testing with native speakers

### Localization Strategy

#### Text Translation
- **UI Elements**:
  - Store all user-facing strings in translation keys
  - Format: `{ "key": "translated text" }`
  - Support for variables: `{ "welcome": "Hello, {name}!" }`
- **Dynamic Content**:
  - Translatable templates for system-generated content
  - Error messages and notifications
  - Email templates

#### Date and Time Formatting
- **User Preference**:
  - Store user locale preference
  - Default to browser/system locale
- **Implementation**:
  - Use `date-fns` with locale support
  - Format based on user locale
  - Support for relative time ("2 days ago")
- **Examples**:
  - US: "May 15, 2023" vs. European: "15 May 2023"
  - 12-hour vs. 24-hour time format

#### Number Formatting
- **Currency**: Format using locale-appropriate symbols and separators
- **Ratings**: Consider cultural differences in rating scales
- **Large Numbers**: Format with appropriate thousand separators
- **Implementation**: Use `Intl.NumberFormat` API

#### TMDB Integration
- **Content Language**:
  - Request TMDB data using `language` parameter
  - Match to user's chosen language preference
  - Default to English when translations unavailable
- **Fallback Strategy**:
  - Display available language if preferred not available
  - Indicate when showing non-preferred language content

### Region-Specific Features

#### Watch Providers
- **Region Detection**:
  - Default based on IP geolocation
  - User override via preferences
- **Implementation**:
  - Fetch using TMDB `watch_region` parameter
  - Display region-specific streaming services
  - Clear indication of selected region

#### Release Dates
- **Regional Differences**:
  - Display regional release dates from TMDB
  - Highlight user's region release date
  - Show original release date for context
- **Implementation**:
  - Request with appropriate `region` parameter
  - Format dates according to locale

#### Content Ratings
- **Rating Systems**:
  - Display regional rating system (MPAA, BBFC, FSK, etc.)
  - Show rating explanation when available
- **Implementation**:
  - Use TMDB release_dates endpoint for ratings
  - Match to user's region

### Technical Implementation

#### URL Structure
- **Options**:
  - Locale prefix: `/en-US/movies/123`
  - Subdomain: `en-us.cinetrack.com`
  - Initial implementation with locale prefix
- **Language Detection**:
  - Browser language detection
  - User preference override
  - Persistent language selection

#### Performance Considerations
- **Bundle Size**:
  - Lazy-load non-active locale files
  - Only include active locale in initial bundle
- **Server-Side Rendering**:
  - Determine locale before render
  - Serve appropriate translated content
- **Static Generation**:
  - Generate pages for primary languages
  - Fallback to SSR for less common languages

#### SEO Strategy
- **Hreflang Tags**:
  - Signal language alternatives to search engines
  - Implement in page head for each translated page
- **Metadata**:
  - Translated meta titles and descriptions
  - Appropriate lang attributes on HTML

#### Testing and Quality Assurance
- **Automation**:
  - Test rendering in each supported locale
  - Verify translations don't break layouts
- **Manual Testing**:
  - Native speaker reviews
  - Context-appropriate translations
  - Cultural sensitivity checks

  ## 17. Future Considerations

### Potential Future Features

#### Native Mobile Apps
- **Platform**: React Native/Expo for code sharing with web
- **Feature Parity**: Core tracking, social, and discovery features
- **Native Features**:
  - Offline mode for logged content
  - Push notifications
  - Camera integration for scanning physical media
  - Mobile-specific UX optimizations
- **Timeline**: Consider after web platform stabilization (12+ months)

#### Advanced Social Features
- **Groups/Communities**:
  - User-created groups around genres, directors, etc.
  - Group watchlists and recommendations
  - Group discussions and watch-alongs
- **Watch Parties**:
  - Synchronized watching with chat
  - Integration with streaming platforms where possible
  - Scheduled events with notifications
- **Integration with External Platforms**:
  - Share to social media with rich previews
  - Import/sync with other services
  - OAuth integration with streaming services

#### ML Recommendations
- **Advanced Algorithms**:
  - Collaborative filtering based on user similarity
  - Content-based recommendations using detailed metadata
  - Hybrid approaches combining multiple signals
- **Personalization Improvements**:
  - Weight for recency of ratings/watches
  - Time-aware recommendations (seasonal, new releases)
  - Diversity parameters to avoid filter bubbles
- **Explainable Recommendations**:
  - Clear reasoning for why items are recommended
  - Feedback mechanisms to improve recommendations
  - Transparency in algorithm function

#### Import Integrations
- **Supported Services**:
  - Letterboxd, IMDb, Trakt.tv
  - Streaming service history where APIs allow
  - CSV formats for universal compatibility
- **Implementation**:
  - Service-specific parsers
  - Mapping of external IDs to TMDB
  - Duplicate detection and resolution
  - Preservation of original timestamps and ratings

#### Gamification
- **Badges and Achievements**:
  - Watching milestones (100 movies watched)
  - Genre exploration (horror aficionado)
  - Critic badges (most helpful reviews)
  - Completionist rewards (watched all films in a franchise)
- **Points and Levels**:
  - Activity-based points system
  - Level progression with perks
  - Leaderboards (optional, privacy-respecting)
- **Challenges**:
  - Curated challenges (watch 5 films from the 70s)
  - User-created challenges
  - Time-limited events (summer blockbusters)

#### Premium Tier
- **Potential Features**:
  - Advanced statistics and insights
  - Priority access to new features
  - Ad-free experience (if ads are introduced)
  - Enhanced customization options
  - Increased storage for lists/reviews
- **Implementation Considerations**:
  - Subscription vs. one-time purchase
  - Fair value proposition
  - Payment processing (Stripe integration)

#### Public API
- **Developer Access**:
  - OAuth authentication
  - Rate-limited endpoints
  - Developer documentation and examples
- **Potential Use Cases**:
  - Third-party mobile apps
  - Data visualization tools
  - Integration with other platforms
  - Browser extensions
- **Implementation Considerations**:
  - API versioning strategy
  - Security and rate limiting
  - Developer portal and documentation

#### Advanced List Customization
- **Themes and Layouts**:
  - Custom background colors/patterns
  - Multiple layout options (grid, list, showcase)
  - Custom sorting and filtering options
- **Rich Media**:
  - Video introductions
  - Custom thumbnail arrangements
  - Embedded content (YouTube videos, quotes)
- **Interactive Elements**:
  - Quizzes based on list content
  - Voting/ranking features for list items
  - User comment threads on lists

### Scalability Considerations

#### Database Optimization
- **Indexing Strategy**:
  - Review and optimize indexes based on query patterns
  - Consider partial indexes for common filters
  - Monitor index usage and performance
- **Query Optimization**:
  - Use EXPLAIN ANALYZE to identify slow queries
  - Implement query caching for common/expensive operations
  - Consider materialized views for complex aggregations
- **Scaling Options**:
  - Read replicas for scaling read operations
  - Sharding strategy if needed for extreme growth
  - Connection pooling optimization

#### API Rate Limiting
- **Implementation**:
  - Token bucket algorithm for fine-grained control
  - Different limits based on endpoint importance
  - User-based vs. IP-based rate limiting
- **Policies**:
  - Higher limits for authenticated users
  - Special consideration for critical paths
  - Graduated throttling vs. hard cutoffs
- **Monitoring**:
  - Track rate limit hits
  - Identify potential abuse patterns
  - Adjust limits based on usage data

#### Caching Strategy
- **CDN**:
  - Cache static assets with appropriate TTLs
  - Consider caching API responses for public data
  - Edge caching for global performance
- **Server**:
  - Redis/Memcached for frequently accessed data
  - Response caching with proper cache invalidation
  - Cache warming for anticipated high-demand content
- **Client**:
  - Browser caching of static assets
  - TanStack Query caching and stale-while-revalidate
  - Persistent caching for offline capability

#### Edge Functions for Performance
- **Use Cases**:
  - Personalization logic closer to users
  - Regional content adaptation
  - API proxying with transformation
- **Implementation**:
  - Leverage Supabase Edge Functions
  - Consider regional deployment for latency-sensitive operations
  - Balance between edge and central processing

#### Storage Scaling
- **Content Growth Planning**:
  - Monitor storage utilization trends
  - Implement size limits for user uploads
  - Consider tiered storage for different access patterns
- **Content Delivery**:
  - CDN distribution for user-uploaded content
  - Image processing pipeline optimization
  - Versioned URLs for cache invalidation
- **Backup Strategy**:
  - Regular backups with retention policy
  - Cross-region redundancy
  - Restore testing procedures

#### Load Testing and Capacity Planning
- **Methodology**:
  - Simulate realistic user behavior
  - Identify bottlenecks before they affect users
  - Establish baseline performance metrics
- **Targets**:
  - Support 10x current user load without degradation
  - Sub-second response times for critical operations
  - Graceful degradation under extreme load
- **Monitoring**:
  - Real-time metrics dashboard
  - Alerting on approaching capacity limits
  - Predictive analysis for growth planning

## 18. Documentation Requirements

### Developer Documentation

#### README
- **Setup Instructions**:
  - Prerequisites installation
  - Environment configuration
  - Local development setup
  - Database initialization
- **Workflow Guidelines**:
  - Branch naming convention
  - Commit message format
  - PR and review process
  - Release procedure
- **Stack Overview**:
  - Technology versions and dependencies
  - Architecture diagram
  - Key design decisions
  - Integration points

#### Architecture Overview
- **System Design**:
  - High-level architecture diagram
  - Component interactions
  - Data flow diagrams
  - Authentication and authorization flow
- **Design Patterns**:
  - Used patterns and their implementation
  - State management approach
  - Data fetching strategy
  - Component composition principles
- **Infrastructure**:
  - Deployment architecture
  - Environment configuration
  - Security implementation
  - Scaling strategy

#### API Documentation
- **Internal Routes**:
  - Complete endpoint catalog
  - Request/response formats
  - Authentication requirements
  - Error handling
- **Supabase Integration**:
  - Client setup and usage
  - Query patterns and examples
  - Storage integration
  - Realtime subscription usage
- **RLS Policies**:
  - Policy definitions for each table
  - Logic explanation and use cases
  - Testing and verification
  - Security considerations

#### Component Library
- **Tool**: Storybook or similar documentation
- **Content**:
  - Visual component catalog
  - Props documentation
  - Usage examples
  - Variants and states
- **Implementation**:
  - Interactive playground
  - Accessibility information
  - Design system integration
  - Component guidelines

#### Database Schema
- **Migration Files**:
  - Well-commented SQL scripts
  - Version history
  - Purpose of each migration
- **Entity-Relationship Diagrams**:
  - Visual representation of schema
  - Relationship documentation
  - Key constraints and indexes
  - Performance considerations
- **Naming Conventions**:
  - Consistent terminology
  - Field purpose explanation
  - Enumeration values

#### Contribution Guide
- **Style Guide**:
  - Coding standards
  - Formatting rules
  - ESLint/Prettier configuration
  - TypeScript usage guidelines
- **Commit Guidelines**:
  - Conventional Commits format
  - Scope definitions
  - Breaking change identification
- **PR Process**:
  - Template usage
  - Required reviewers
  - Test expectations
  - Documentation requirements

### User Documentation

#### Help Center / FAQ
- **Content Structure**:
  - Getting started guides
  - Feature explanations
  - Troubleshooting
  - Account management
- **Format**:
  - Searchable knowledge base
  - Clear categorization
  - Visual aids (screenshots, GIFs)
  - Step-by-step instructions
- **Integration**:
  - In-app help widget
  - Contextual help links
  - Feedback mechanism

#### Onboarding Tour
- **Implementation**:
  - Progressive feature introduction
  - Interactive tooltips
  - Skippable but resumable
  - Completion tracking
- **Content**:
  - Core feature highlights
  - Quick start actions
  - Personalization setup
  - Next steps guidance
- **Design**:
  - Non-intrusive
  - Responsive across devices
  - Accessible
  - On-brand visual style

### Maintenance Documentation

#### Deployment Guide
- **Environment Setup**:
  - Required credentials
  - Environment variables
  - Service dependencies
  - Configuration files
- **Deployment Steps**:
  - Staging procedures
  - Production deployment checklist
  - Verification steps
  - Rollback procedures
- **Special Considerations**:
  - Database migrations
  - Cache invalidation
  - DNS/domain management
  - SSL certificate renewal

#### Troubleshooting Guide
- **Common Issues**:
  - Authentication problems
  - API integration errors
  - Performance bottlenecks
  - Database connectivity
- **Diagnostic Procedures**:
  - Log inspection guidance
  - Monitoring tools usage
  - Error code interpretation
  - Test procedures
- **Recovery Steps**:
  - Service restart procedures
  - Database recovery
  - Emergency contacts
  - Incident response workflow

#### Backup/Recovery Procedures
- **Supabase Strategy**:
  - Backup schedule and retention
  - Point-in-time recovery process
  - Data export procedures
  - Recovery testing protocol
- **Application Data**:
  - User-generated content backup
  - Storage bucket backup
  - Asset preservation
  - Recovery verification

#### Monitoring and Alerting
- **Service Health**:
  - Uptime monitoring configuration
  - Performance thresholds
  - Error rate alerting
  - API availability checks
- **Resource Utilization**:
  - Database connection monitoring
  - Storage capacity alerts
  - Rate limit approach
  - Cost management
- **Alert Channels**:
  - Contact procedures
  - Escalation path
  - On-call rotation
  - Severity levels

## 19. Conclusion

This technical requirements document (Version 2.1) provides a comprehensive blueprint for the development of the CineTrack web application. It outlines the features, technology stack, architecture, design considerations, data models, API endpoints, development processes, and standards necessary to build a robust, scalable, performant, and user-friendly platform.

The document incorporates the latest enhancements, including the custom list banner images feature, to create visually appealing and personalized user experiences. This visual customization allows users to express themselves through their curated lists while making the platform more engaging and distinctive.

The technical approach prioritizes:

1. **Modern Architecture**: Leveraging Next.js 14 and Supabase for a performant and scalable foundation
2. **User-Centric Design**: Focusing on accessibility, responsiveness, and intuitive interactions
3. **Robust Data Model**: Creating a flexible and well-structured database schema
4. **Comprehensive API**: Defining clear endpoints with proper authentication and authorization
5. **Secure Implementation**: Incorporating security at all levels with Row Level Security
6. **Performance Optimization**: Ensuring fast load times and smooth interactions
7. **Maintainable Codebase**: Establishing coding standards and documentation practices
8. **Scalable Infrastructure**: Planning for growth with proper architecture decisions
9. **Phased Development**: Breaking the project into manageable phases with clear milestones
10. **Future-Ready Design**: Anticipating expansion with consideration for future features

Adherence to these requirements will guide the development team in creating a high-quality product that meets user needs while providing a solid foundation for future growth and iteration. The CineTrack platform aims to become the definitive destination for movie and TV enthusiasts to track, review, discover, and engage with visual content in a social context.

By following this technical roadmap, the development team can deliver a cohesive, feature-rich application that stands apart from competitors through its attention to detail, performance, and user experience.