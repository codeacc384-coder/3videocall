# Video Call Updates - Setup Guide

## Issues Fixed

### 1. Role Display Bug
**Problem**: During 3-way video calls, participant roles were displayed incorrectly (customer shown as advisor/officer, etc.)

**Solution**: 
- Changed from hardcoded array indices to dynamic role mapping based on participant join order
- Each participant is now assigned a role: first = customer, second = advisor, third = officer
- Roles are correctly displayed in both video tiles and participants panel

**Files Modified**:
- `src/components/consultation/VideoConsultationRoom.tsx`

### 2. Chat File Attachment Feature
**Problem**: Chat only supported text messages, no file sharing capability

**Solution**:
- Added attachment icon (paperclip) in chat input area
- Users can upload images, PDFs, and documents
- Files are stored in Supabase storage bucket `consultation-attachments`
- Attachment URL and metadata saved to `consultation_messages` table
- All participants see shared attachments in real-time

**Files Created**:
- `src/lib/uploadAttachment.ts` - File upload handler
- `migrations/001_add_attachments.sql` - Database schema updates

## Architecture

### File Upload Flow
```
User selects file
    ↓
File uploaded to Supabase Storage (consultation-attachments bucket)
    ↓
Public URL generated
    ↓
Message created in consultation_messages table with:
  - attachment_url (public URL from bucket)
  - attachment_name (original filename)
  - attachment_size (file size)
  - attachment_type (MIME type)
    ↓
All participants see attachment link in chat
```

### Database Changes
Adding 4 columns to `consultation_messages` table:
- `attachment_url TEXT` - Public URL to file in storage bucket
- `attachment_name TEXT` - Original filename
- `attachment_size INTEGER` - File size in bytes
- `attachment_type VARCHAR(50)` - MIME type (image/png, application/pdf, etc.)

## Setup Instructions

### Step 1: Run Database Migration
Execute this SQL in your Supabase dashboard (SQL Editor):

```sql
ALTER TABLE public.consultation_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER,
ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_consultation_messages_room_id ON public.consultation_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_created_at ON public.consultation_messages(created_at);
```

### Step 2: Create Storage Bucket
In Supabase Dashboard → Storage:
1. Click "New bucket"
2. Name: `consultation-attachments`
3. Make it **Public** (toggle on)
4. Click "Create bucket"

### Step 3: Set RLS Policies on Storage Bucket
In Supabase Dashboard → Storage → consultation-attachments → Policies:

**Policy 1 - Allow Uploads**:
```sql
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'consultation-attachments' 
  AND auth.role() = 'authenticated'
);
```

**Policy 2 - Allow Public Read**:
```sql
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'consultation-attachments');
```

**Policy 3 - Allow Delete Own Files**:
```sql
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'consultation-attachments' 
  AND auth.uid() = owner
);
```

### Step 4: Verify Environment Variables
Your `.env` should have:
```
VITE_SUPABASE_URL=https://ygvcyoexgljhtgqkglkc.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## How It Works

### Role Assignment in Video Call
```typescript
// Participants assigned roles by join order
const roleMap: PortalRole[] = ['customer', 'advisor', 'officer'];
participantRoles[p.id] = roleMap[i] || 'customer';
```

### File Upload Process
1. User clicks paperclip icon in chat
2. Selects image/PDF/document
3. File uploaded to `consultation-attachments` bucket
4. Supabase generates public URL
5. Message created with attachment metadata
6. URL stored in `consultation_messages.attachment_url`
7. All participants see attachment link in real-time

### Attachment Display in Chat
- Shows paperclip icon + filename
- Clickable link to download/view file
- File path: `https://ygvcyoexgljhtgqkglkc.supabase.co/storage/v1/object/public/consultation-attachments/{room_id}/{timestamp}_{filename}`

## Database Schema After Migration

### consultation_messages table
```sql
CREATE TABLE public.consultation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  sender_id uuid REFERENCES public.profiles(id),
  sender_name text NOT NULL,
  sender_role text NOT NULL,
  text text NOT NULL,
  attachment_url text,              -- NEW: Public URL from storage
  attachment_name text,             -- NEW: Original filename
  attachment_size integer,          -- NEW: File size in bytes
  attachment_type varchar(50),      -- NEW: MIME type
  created_at timestamp DEFAULT now()
);
```

## Supported File Types
- Images: jpg, jpeg, png, gif, webp
- Documents: pdf, doc, docx
- Can be extended in `accept` attribute of file input

## Testing

### Test Role Display
1. Start video call with 3 participants
2. Verify each shows correct role (Customer/Advisor/Officer)
3. Check participants panel shows correct roles
4. Roles should match join order

### Test File Upload
1. In chat, click paperclip icon
2. Select an image or PDF
3. Verify file appears in chat with link
4. Click link to verify file downloads
5. Check Supabase Storage bucket shows file
6. Verify other participants see attachment

## Troubleshooting

### Files not uploading
- Check `consultation-attachments` bucket exists and is public
- Verify RLS policies are set correctly
- Check browser console for errors
- Ensure user is authenticated

### Attachment URL not saving
- Verify `attachment_url` column exists in `consultation_messages`
- Check Supabase storage bucket is public
- Verify file upload succeeded before saving message

### Roles showing incorrectly
- Ensure participants join in correct order
- Refresh page if roles appear wrong
- Check `participantRoles` mapping in browser console
- First to join = Customer, Second = Advisor, Third = Officer

### Files not visible to other participants
- Check storage bucket is public
- Verify RLS policy allows public read
- Ensure `attachment_url` is being saved to database
- Check real-time subscription is working

## File Storage Location
All files stored at:
```
https://ygvcyoexgljhtgqkglkc.supabase.co/storage/v1/object/public/consultation-attachments/{room_id}/{timestamp}_{filename}
```

Example:
```
https://ygvcyoexgljhtgqkglkc.supabase.co/storage/v1/object/public/consultation-attachments/room-123/1704067200000_document.pdf
```
