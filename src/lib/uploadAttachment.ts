import { supabase } from './supabase';

export async function uploadAttachment(
  file: File,
  roomId: string,
  senderId: string,
  senderName: string,
  senderRole: string
) {
  try {
    // Upload file to Supabase storage
    const fileName = `${roomId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('consultation-attachments')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('consultation-attachments')
      .getPublicUrl(fileName);

    // Save message with attachment metadata
    const { error: insertError } = await supabase
      .from('consultation_messages')
      .insert({
        room_id: roomId,
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        text: `📎 Shared a file: ${file.name}`,
        attachment_url: publicUrl,
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
