-- Run once in Cloudflare D1 Console before deploying worker_v34.
-- If a column already exists, Cloudflare will show a duplicate-column error; ignore that line and continue.
ALTER TABLE Students ADD COLUMN school_name TEXT;
ALTER TABLE Championships ADD COLUMN organizer_name TEXT;
