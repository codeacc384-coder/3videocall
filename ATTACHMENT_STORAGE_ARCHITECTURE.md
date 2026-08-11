# Attachment Storage & URL Architecture

## Answer to Your Question: "Is it going to any buckets and that URL need to be on table?"

**YES - Both:**
1. ✅ Files go to **Supabase Storage bucket** (`consultation-attachments`)
2. ✅ URL is stored in **database table** (`consultation_messages.attachment_url`)

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER UPLOADS FILE                             │
│                  (Clicks Paperclip Icon)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              uploadAttachment() Function Called                   │
│         (src/lib/uploadAttachment.ts)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         FILE UPLOADED TO SUPABASE STORAGE BUCKET                 │
│                                                                   │
│  Bucket: consultation-attachments                                │
│  Path: {room_id}/{timestamp}_{filename}                          │
│                                                                   │
│  Example:                                                         │
│  room-123/1704067200000_document.pdf                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         SUPABASE GENERATES PUBLIC URL                            │
│                                                                   │
│  https://ygvcyoexgljhtgqkglkc.supabase.co/storage/v1/object/    │
│  public/consultation-attachments/room-123/1704067200000_        │
│  document.pdf                                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│    MESSAGE CREATED IN DATABASE WITH ATTACHMENT METADATA          │
│                                                                   │
│  Table: consultation_messages                                    │
│  Columns:                                                         │
│  - id: uuid                                                       │
│  - room_id: text                                                  │
│  - sender_id: uuid                                                │
│  - sender_name: text                                              │
│  - sender_role: text                                              │
│  - text: text                                                     │
│  - attachment_url: TEXT ◄── PUBLIC URL STORED HERE              │
│  - attachment_name: TEXT ◄── "document.pdf"                     │
│  - attachment_size: INTEGER ◄── 2048576 (bytes)                 │
│  - attachment_type: VARCHAR(50) ◄── "application/pdf"           │
│  - created_at: timestamp                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│      REAL-TIME SUBSCRIPTION NOTIFIES ALL PARTICIPANTS            │
│                                                                   │
│  Supabase Channel: chat-{room_id}                                │
│  Event: INSERT on consultation_messages                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         ATTACHMENT DISPLAYED IN CHAT FOR ALL USERS               │
│                                                                   │
│  Shows:                                                           │
│  📎 document.pdf (clickable link)                                │
│                                                                   │
│  When clicked:                                                    │
│  Opens: https://ygvcyoexgljhtgqkglkc.supabase.co/storage/...    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Table Structure

### consultation_messages (After Migration)

```sql
CREATE TABLE public.consultation_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  sender_id uuid,
  sender_name text NOT NULL,
  sender_role text NOT NULL,
  text text NOT NULL,
  
  -- NEW COLUMNS FOR ATTACHMENTS:
  attachment_url text,              -- Public URL from storage bucket
  attachment_name text,             -- Original filename
  attachment_size integer,          -- File size in bytes
  attachment_type varchar(50),      -- MIME type (image/png, application/pdf, etc.)
  
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT consultation_messages_pkey PRIMARY KEY (id),
  CONSTRAINT consultation_messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
```

---

## Storage Bucket Structure

### Supabase Storage: consultation-attachments

```
consultation-attachments/
├── room-123/
│   ├── 1704067200000_document.pdf
│   ├── 1704067201000_image.png
│   └── 1704067202000_contract.docx
├── room-456/
│   ├── 1704067300000_proposal.pdf
│   └── 1704067301000_screenshot.jpg
└── room-789/
    └── 1704067400000_report.pdf
```

**File Path Format:**
```
{room_id}/{timestamp}_{original_filename}
```

**Public URL Format:**
```
https://ygvcyoexgljhtgqkglkc.supabase.co/storage/v1/object/public/consultation-attachments/{room_id}/{timestamp}_{filename}
```

---

## Code Implementation

### uploadAttachment.ts

```typescript
import { supabase } from '../../lib/supabase';

export async function uploadAttachment(
  file: File,
  roomId: string,
  senderId: string,
  senderName: string,
  senderRole: string
) {
  try {
    // 1. Upload file to storage bucket
    const fileName = `${roomId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('consultation-attachments')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('consultation-attachments')
      .getPublicUrl(fileName);

    // 3. Save message with attachment metadata to database
    const { error: insertError } = await supabase
      .from('consultation_messages')
      .insert({
        room_id: roomId,
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        text: `📎 Shared a file: ${file.name}`,
        attachment_url: publicUrl,        // ◄── URL STORED HERE
        attachment_name: file.name,
        attachment_size: file.size,
        attachment_type: file.type,
      });

    if (insertError) throw insertError;

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
```

### Chat Component Usage

```typescript
<label className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer">
  <input 
    type="file" 
    accept="image/*,.pdf,.doc,.docx" 
    className="hidden" 
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          // Calls uploadAttachment which:
          // 1. Uploads to storage bucket
          // 2. Gets public URL
          // 3. Saves message with URL to database
          await uploadAttachment(file, roomId, currentUserId, currentUserName, currentUserRole);
        } catch (err) { 
          console.error('Upload failed:', err); 
        }
      }
    }} 
  />
  <Paperclip className="w-4 h-4" />
</label>
```

### Display Attachment in Chat

```typescript
{msg.attachment_url && (
  <a 
    href={msg.attachment_url} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="text-blue-300 hover:underline text-[10px] flex items-center gap-1"
  >
    <Paperclip className="w-3 h-3" /> 
    {msg.attachment_name || 'Attachment'}
  </a>
)}
```

---

## Data Flow Summary

| Step | Location | Action |
|------|----------|--------|
| 1 | Frontend | User selects file |
| 2 | Frontend → Storage | File uploaded to `consultation-attachments` bucket |
| 3 | Storage | Supabase generates public URL |
| 4 | Frontend → Database | Message created with `attachment_url` |
| 5 | Database | Row inserted in `consultation_messages` |
| 6 | Database → Frontend | Real-time subscription triggers |
| 7 | Frontend | All participants see attachment link |
| 8 | User clicks link | Opens file from public URL |

---

## Example Database Record

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "room_id": "room-123",
  "sender_id": "user-456",
  "sender_name": "John Advisor",
  "sender_role": "advisor",
  "text": "📎 Shared a file: proposal.pdf",
  "attachment_url": "https://ygvcyoexgljhtgqkglkc.supabase.co/storage/v1/object/public/consultation-attachments/room-123/1704067200000_proposal.pdf",
  "attachment_name": "proposal.pdf",
  "attachment_size": 2048576,
  "attachment_type": "application/pdf",
  "created_at": "2024-01-01T12:00:00+00:00"
}
```

---

## Security & Access Control

### RLS Policies on Storage Bucket

**1. Upload Policy** - Only authenticated users can upload
```sql
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'consultation-attachments' 
  AND auth.role() = 'authenticated'
);
```

**2. Read Policy** - Public read access (anyone can view)
```sql
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'consultation-attachments');
```

**3. Delete Policy** - Users can delete their own files
```sql
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'consultation-attachments' 
  AND auth.uid() = owner
);
```

---

## Supported File Types

```
Images:    jpg, jpeg, png, gif, webp
Documents: pdf, doc, docx
```

Can be extended in file input `accept` attribute:
```html
<input type="file" accept="image/*,.pdf,.doc,.docx" />
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| File upload fails | Bucket doesn't exist | Create `consultation-attachments` bucket |
| URL not saving | Column missing | Run migration to add `attachment_url` column |
| File not accessible | Bucket not public | Make bucket public in Supabase dashboard |
| RLS error | Policies not set | Add RLS policies to storage bucket |
| URL returns 404 | File path incorrect | Check file path format: `{room_id}/{timestamp}_{filename}` |

