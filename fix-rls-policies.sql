-- Fix RLS Policies for Custom Scripts and Analytics
-- Execute this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own scripts" ON custom_scripts;
DROP POLICY IF EXISTS "Users can manage own analytics" ON analytics_data;

-- Disable RLS temporarily to allow our application to work
-- Since we're using custom JWT auth, not Supabase Auth
ALTER TABLE custom_scripts DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data DISABLE ROW LEVEL SECURITY;

-- Alternative: Create policies that work with service role
-- If you want to keep RLS enabled, use these policies instead:

-- Re-enable RLS with proper policies for service role access
-- ALTER TABLE custom_scripts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;

-- Create policies that allow service role to bypass RLS
-- CREATE POLICY "Service role can manage all scripts" ON custom_scripts
--   FOR ALL USING (true);

-- CREATE POLICY "Service role can manage all analytics" ON analytics_data
--   FOR ALL USING (true);

-- Note: Since we're using SUPABASE_SERVICE_KEY in our backend,
-- disabling RLS is the simplest solution for now.
-- Our application-level security handles user isolation.
