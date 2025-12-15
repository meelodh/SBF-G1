-- SQL to add date column to listings table
-- Run this in your Supabase SQL editor after create_listings.sql

ALTER TABLE public.listings ADD COLUMN meeting_date date;

-- Create index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_listings_meeting_date ON public.listings (meeting_date);
