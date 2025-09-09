import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabaseStorageClient = createClient(supabaseUrl, supabaseKey);

export interface SupabaseImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

function dataUrlToBuffer(dataUrl: string): { buffer: ArrayBuffer; mime: string } {
  const [meta, base64] = dataUrl.split(',');
  const mimeMatch = /data:(.*?);base64/.exec(meta || '') || [];
  const mime = mimeMatch[1] || 'image/png';
  const binary = atob(base64 || '');
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return { buffer: bytes, mime };
}

export async function uploadDataUrlToSupabase(
  dataUrl: string,
  bucket: string,
  path: string
): Promise<SupabaseImageUploadResult> {
  try {
    const { buffer, mime } = dataUrlToBuffer(dataUrl);

    const { error } = await supabaseStorageClient.storage
      .from(bucket)
      .upload(path, buffer, { contentType: mime, upsert: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data } = supabaseStorageClient.storage.from(bucket).getPublicUrl(path);
    return { success: true, url: data.publicUrl };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}


