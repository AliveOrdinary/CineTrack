-- CineTrack Seed Data
-- This file orchestrates the loading of all seed data

-- Reset existing data (uncomment if needed)
-- TRUNCATE public.report_content CASCADE;
-- TRUNCATE public.watchlist CASCADE;
-- TRUNCATE public.users CASCADE;

-- Load seed data
\ir users.sql
\ir watchlist.sql
\ir reports.sql

-- Confirm data was loaded
SELECT 'Seed data loaded successfully!' AS status; 