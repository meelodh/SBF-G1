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
  created_at timestamptz DEFAULT now()
);

-- optional index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings (user_id);
