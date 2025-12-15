-- SQL to create listings table for Study Buddy Finder
-- Run this in your Supabase SQL editor or psql

-- ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  group_size integer NOT NULL,
  location text NOT NULL,
  time text NOT NULL,
  description text,
  user_email text,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key to auth.users
ALTER TABLE public.listings 
ADD CONSTRAINT fk_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings (user_id);

-- Enable Row Level Security
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can view ALL listings
DROP POLICY IF EXISTS "Users can view all listings" ON public.listings;
CREATE POLICY "Users can view all listings"
ON public.listings FOR SELECT
USING (true);

-- RLS Policy: Users can insert their own listings
DROP POLICY IF EXISTS "Users can create listings" ON public.listings;
CREATE POLICY "Users can create listings"
ON public.listings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own listings
DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
CREATE POLICY "Users can update own listings"
ON public.listings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own listings
DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;
CREATE POLICY "Users can delete own listings"
ON public.listings FOR DELETE
USING (auth.uid() = user_id);
