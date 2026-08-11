-- ============================================================================
-- EXACT SQL TO RUN IN SUPABASE DASHBOARD
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- ============================================================================

-- Step 1: Add attachment columns to consultation_messages table
ALTER TABLE public.consultation_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER,
ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50);

-- Step 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_consultation_messages_room_id 
ON public.consultation_messages(room_id);

CREATE INDEX IF NOT EXISTS idx_consultation_messages_created_at 
ON public.consultation_messages(created_at);

-- ============================================================================
-- VERIFY THE CHANGES
-- ============================================================================
-- Run this query to verify columns were added:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'consultation_messages' ORDER BY ordinal_position;

-- ============================================================================
-- STORAGE BUCKET SETUP (Do this in Supabase Dashboard UI)
-- ============================================================================
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: consultation-attachments
-- 4. Toggle "Public bucket" ON
-- 5. Click "Create bucket"

-- ============================================================================
-- RLS POLICIES FOR STORAGE BUCKET (Run in SQL Editor)
-- ============================================================================

-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'consultation-attachments' 
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow public read access to files
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'consultation-attachments');

-- Policy 3: Allow users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'consultation-attachments' 
  AND auth.uid() = owner
);

-- ============================================================================
-- VERIFY SETUP
-- ============================================================================
-- Run these queries to verify everything is set up correctly:

-- Check if columns exist:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'consultation_messages' 
AND column_name IN ('attachment_url', 'attachment_name', 'attachment_size', 'attachment_type')
ORDER BY ordinal_position;

-- Check if indexes exist:
SELECT indexname FROM pg_indexes 
WHERE tablename = 'consultation_messages' 
AND indexname LIKE 'idx_consultation_messages%';

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Insert a test message with attachment:
INSERT INTO public.consultation_messages (
  room_id,
  sender_id,
  sender_name,
  sender_role,
  text,
  attachment_url,
  attachment_name,
  attachment_size,
  attachment_type
) VALUES (
  'test-room-123',
  '550e8400-e29b-41d4-a716-446655440000',
  'Test User',
  'advisor',
  '📎 Shared a file: test-document.pdf',
  'https://ygvcyoexgljhtgqkglkc.supabase.co/storage/v1/object/public/consultation-attachments/test-room-123/1704067200000_test-document.pdf',
  'test-document.pdf',
  2048576,
  'application/pdf'
);

-- ============================================================================
-- FINAL SCHEMA (After running all migrations)
-- ============================================================================
-- Your consultation_messages table will look like this:

/*
CREATE TABLE public.consultation_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  sender_id uuid,
  sender_name text NOT NULL,
  sender_role text NOT NULL,
  text text NOT NULL,
  attachment_url text,              -- NEW
  attachment_name text,             -- NEW
  attachment_size integer,          -- NEW
  attachment_type varchar(50),      -- NEW
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT consultation_messages_pkey PRIMARY KEY (id),
  CONSTRAINT consultation_messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);

CREATE INDEX idx_consultation_messages_room_id ON public.consultation_messages(room_id);
CREATE INDEX idx_consultation_messages_created_at ON public.consultation_messages(created_at);
*/

-- ============================================================================
-- TROUBLESHOOTING QUERIES
-- ============================================================================

-- Check all messages with attachments:
SELECT id, sender_name, attachment_name, attachment_url, created_at
FROM public.consultation_messages
WHERE attachment_url IS NOT NULL
ORDER BY created_at DESC;

-- Check messages by room:
SELECT id, sender_name, text, attachment_name, created_at
FROM public.consultation_messages
WHERE room_id = 'room-123'
ORDER BY created_at DESC;

-- Check attachment statistics:
SELECT 
  COUNT(*) as total_messages,
  COUNT(CASE WHEN attachment_url IS NOT NULL THEN 1 END) as messages_with_attachments,
  SUM(CASE WHEN attachment_size IS NOT NULL THEN attachment_size ELSE 0 END) as total_storage_bytes
FROM public.consultation_messages;

-- ============================================================================
-- CLEANUP (If needed - delete all attachments)
-- ============================================================================
-- WARNING: This will delete all attachment data!
-- UPDATE public.consultation_messages 
-- SET attachment_url = NULL, attachment_name = NULL, attachment_size = NULL, attachment_type = NULL;
