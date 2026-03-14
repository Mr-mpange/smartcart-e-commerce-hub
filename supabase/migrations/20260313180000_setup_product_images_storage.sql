-- Create product-images storage bucket if it doesn't exist
-- This bucket stores product images uploaded by vendors

-- Note: Storage buckets are managed through the Supabase dashboard or API
-- This migration documents the expected bucket configuration

-- Expected bucket configuration:
-- Name: product-images
-- Public: true (to allow public access to images)
-- File size limit: 52428800 (50MB)

-- Storage RLS Policies (if using authenticated uploads):
-- 1. Allow vendors to upload images
-- 2. Allow public read access to all images
-- 3. Allow vendors to delete their own images

-- For now, we'll assume the bucket is created manually or via dashboard
-- The bucket should be public to allow unauthenticated users to view product images
