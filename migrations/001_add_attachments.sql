-- Add attachment columns to consultation_messages table
ALTER TABLE public.consultation_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER,
ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_consultation_messages_room_id ON public.consultation_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_created_at ON public.consultation_messages(created_at);

-- Storage bucket setup (run in Supabase dashboard):
-- 1. Create bucket: consultation-attachments (public)
-- 2. Add RLS policies:

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'consultation-attachments' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to files
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'consultation-attachments');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'consultation-attachments' 
  AND auth.uid() = owner
);
