-- SQL to create group_members table for tracking who joined which group
-- Run this in your Supabase SQL editor after create_listings.sql

CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_display_name text,
  joined_at timestamptz DEFAULT now()
);

-- Add foreign keys
ALTER TABLE public.group_members 
ADD CONSTRAINT fk_listing_id 
FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE public.group_members 
ADD CONSTRAINT fk_member_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_members_listing_id ON public.group_members (listing_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members (user_id);

-- Enable Row Level Security
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can view group members
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
CREATE POLICY "Users can view group members"
ON public.group_members FOR SELECT
USING (true);

-- RLS Policy: Users can insert (join) their own membership
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups"
ON public.group_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete (leave) their own membership
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Users can leave groups"
ON public.group_members FOR DELETE
USING (auth.uid() = user_id);
