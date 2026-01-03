import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { AccessCodeValidation } from '../types';

export function useCreateStory() {
  const [submitting, setSubmitting] = useState(false);

  function friendly(message: string | undefined) {
    if (!message) return 'Something went wrong. Please try again.';
    const lower = message.toLowerCase();
    if (lower.includes('invalid access code')) return 'That access code is not valid.';
    if (lower.includes('usage limit')) return 'This access code has been used up.';
    if (lower.includes('expired')) return 'This access code has expired.';
    if (lower.includes('disabled')) return 'This access code is disabled.';
    if (lower.includes('profile not found')) return 'This map link is not available.';
    if (lower.includes('image too large') || lower.includes('max 5mb')) return 'Image is too large (max 5MB).';
    return message;
  }

  function extractError(err: any): string | undefined {
    if (!err) return undefined;
    console.log(err, err.context, err.context?.response);
    
    const ctx = err.context;
    const response = ctx?.response;
    const data = response?.data;
    if (data) {
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed?.error) return parsed.error;
          if (parsed?.message) return parsed.message;
        } catch {
          return data;
        }
      }
      if (typeof data === 'object') {
        if (data.error) return data.error;
        if (data.message) return data.message;
      }
    }
    if (ctx?.error) return ctx.error;
    if (response?.error) return response.error;
    if (response?.message) return response.message;
    if (typeof err.message === 'string') return err.message;
    return undefined;
  }

  async function compressImage(file: File, maxSizeKb = 5000): Promise<File> {
    // If already under the limit, return as-is to avoid quality loss
    if (file.size / 1024 <= maxSizeKb) {
      return file;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    const loadPromise = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
    });

    try {
      img.src = url;
      await loadPromise;
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const compressWithQuality = (quality: number) =>
        new Promise<Blob | null>((resolve) => {
          canvas.toBlob(
            (blob) => resolve(blob),
            'image/jpeg',
            quality
          );
        });

      let quality = 0.9;
      let blob = await compressWithQuality(quality);

      while (blob && blob.size / 1024 > maxSizeKb && quality > 0.1) {
        quality = Math.max(0.1, quality - 0.1);
        blob = await compressWithQuality(quality);
      }

      if (blob && blob.size / 1024 <= maxSizeKb) {
        return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
          type: 'image/jpeg'
        });
      }
    } catch {
      // Fall back to the original file
      return file;
    } finally {
      URL.revokeObjectURL(url);
    }

    return file;
  }

  const createStory = async (
    accessCode: string,
    authorCountryCode: string,
    authorCountryName: string,
    countryCode: string,
    countryName: string,
    authorName: string,
    story?: string | null,
    photoFile?: File,
    profileSlug = 'public'
  ): Promise<AccessCodeValidation> => {
    setSubmitting(true);

    try {
      let photoUrl: string | null = null;

      // Upload photo if provided
      if (photoFile) {
        try {
          const compressed = await compressImage(photoFile);
          // If still too large, fail fast with a clear message
          if (compressed.size / 1024 > 5000) {
            return { success: false, error: 'Image is too large after compression (max 5MB).' };
          }

          const { data: signedData, error: signedError } = await supabase.functions.invoke<{
            success: boolean;
            path?: string;
            token?: string;
            error?: string;
          }>('create-photo-upload', {
            body: {
              fileName: compressed.name,
              contentType: compressed.type || 'image/jpeg',
              size: compressed.size,
              profileSlug,
              accessCode
            }
          });

          if (signedError || !signedData?.success || !signedData.path || !signedData.token) {
            throw new Error(friendly(signedData?.error || signedError?.message));
          }

          const { error: uploadError } = await supabase.storage
            .from('story-photos')
            .uploadToSignedUrl(signedData.path, signedData.token, compressed, {
              contentType: compressed.type || 'image/jpeg'
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('story-photos')
            .getPublicUrl(signedData.path);

          photoUrl = publicUrl;
        } catch (uploadErr: any) {
          return { success: false, error: friendly(uploadErr?.message || 'Failed to upload image') };
        }
      }

      // Call Edge Function (runs with service role)
      const { data, error } = await supabase.functions.invoke<AccessCodeValidation>(`submit-story/${profileSlug}`, {
        body: {
          accessCode,
          authorCountryCode,
          authorCountryName,
          countryCode,
          countryName,
          authorName,
          story,
          photoUrl
        }
      });

      if (error) {
        const derived = extractError(error);
        return { success: false, error: friendly(derived) };
      }
      if (!data) return { success: false, error: friendly('No response from server') };

      if (!data.success) {
        return { success: false, error: friendly((data as any).error as string | undefined) };
      }

      return data;
    } catch (err: any) {
      const derived = extractError(err) || err?.message;
      return { success: false, error: friendly(derived || 'Failed to submit story') };
    } finally {
      setSubmitting(false);
    }
  };

  return { createStory, submitting };
}
