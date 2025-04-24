# CineTrack Seed Data

This directory contains SQL files to populate the database with test data for development and testing.

## Files

- `seed.sql` - Main entry point that orchestrates loading all seed data (uses \ir which may not work in all environments)
- `combined_seed.sql` - Combined seed file for direct execution
- `users.sql` - Sample user accounts
- `watchlist.sql` - Sample watchlist entries for different users
- `reports.sql` - Sample content reports for testing moderation features

## Usage

### Recommended Method - Supabase Studio

1. Start your local Supabase instance:
   ```bash
   cd /Users/nk/Desktop/code/CineTrack
   npm run supabase:local
   ```

2. Open Supabase Studio at http://127.0.0.1:54323

3. Go to the SQL Editor

4. Copy the contents of `backend/seed/combined_seed.sql` and paste it into the editor

5. Run the script

### Alternative Methods

If you have PostgreSQL client installed:

```bash
# From the project root
psql postgres://postgres:postgres@localhost:54322/postgres -f backend/seed/combined_seed.sql
```

Using Docker:

```bash
cd /Users/nk/Desktop/code/CineTrack
docker run --network=host -v "$(pwd)/backend/seed:/seed" postgres:14 psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f /seed/combined_seed.sql
```

## Test Users

The seed data includes several test users:

| Email | Description |
|-------|-------------|
| admin@example.com | Admin user with test content |
| john@example.com | User with movie watchlist |
| emma@example.com | User with TV show watchlist |
| sam@example.com | User with mixed content watchlist |
| olivia@example.com | User with classic films watchlist |

**Note:** These are just database entries and do not have actual Supabase Auth accounts. For testing with real authentication, you'll need to create accounts through Supabase Auth that match these UUIDs or adjust the UUIDs in the seed data to match newly created accounts. 