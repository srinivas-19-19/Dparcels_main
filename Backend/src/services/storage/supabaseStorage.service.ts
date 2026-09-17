import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { env } from '../../config/env';

export class StorageError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'StorageError';
    this.statusCode = statusCode;
  }
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

class SupabaseStorageService {
  private client: SupabaseClient | null = null;
  private bucket: string;

  constructor() {
    this.bucket = env.SUPABASE_AVATAR_BUCKET || 'customer-avatars';

    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } else {
      console.warn(
        '⚠️ Supabase Storage: SUPABASE_SERVICE_ROLE_KEY not configured. Storage operations will run in mock/test mode.'
      );
    }
  }

  /**
   * Validate image buffer and MIME type
   */
  validateImage(buffer: Buffer, mimeType: string) {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new StorageError(
        `Invalid image format (${mimeType}). Only JPEG, PNG, and WebP are allowed.`,
        400
      );
    }

    if (buffer.length > MAX_FILE_SIZE) {
      throw new StorageError(
        `File size exceeds 5 MB limit. Received: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB`,
        400
      );
    }

    // Additional magic byte inspection for security
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;
    const isWebp =
      buffer.length > 12 &&
      buffer.toString('utf8', 0, 4) === 'RIFF' &&
      buffer.toString('utf8', 8, 12) === 'WEBP';

    if (mimeType === 'image/jpeg' && !isJpeg) {
      throw new StorageError('Invalid JPEG file content', 400);
    }
    if (mimeType === 'image/png' && !isPng) {
      throw new StorageError('Invalid PNG file content', 400);
    }
    if (mimeType === 'image/webp' && !isWebp) {
      throw new StorageError('Invalid WebP file content', 400);
    }
  }

  /**
   * Extracts clean relative storage path from stored URL or path
   */
  extractRelativePath(pathOrUrl: string): string {
    if (!pathOrUrl) return '';

    // If full URL: https://[project].supabase.co/storage/v1/object/public/[bucket]/[userId]/[uuid].ext
    const urlMarker = `/storage/v1/object/public/${this.bucket}/`;
    if (pathOrUrl.includes(urlMarker)) {
      return pathOrUrl.split(urlMarker)[1];
    }

    // If starts with bucket name: customer-avatars/[userId]/[uuid].ext
    if (pathOrUrl.startsWith(`${this.bucket}/`)) {
      return pathOrUrl.replace(`${this.bucket}/`, '');
    }

    return pathOrUrl;
  }

  /**
   * Upload customer avatar to Supabase Storage
   */
  async uploadAvatar(
    userId: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<{ path: string; publicUrl: string }> {
    this.validateImage(buffer, mimeType);

    const ext = MIME_TO_EXT[mimeType] || 'jpg';
    const uniqueId = crypto.randomUUID();
    const relativePath = `${userId}/${uniqueId}.${ext}`;
    const storageKey = `${this.bucket}/${relativePath}`;

    if (this.client) {
      const { error } = await this.client.storage
        .from(this.bucket)
        .upload(relativePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        console.error('[SupabaseStorage] Upload error:', error);
        throw new StorageError(`Failed to upload avatar to Supabase: ${error.message}`, 500);
      }

      const { data } = this.client.storage.from(this.bucket).getPublicUrl(relativePath);
      return {
        path: storageKey,
        publicUrl: data.publicUrl,
      };
    }

    // Mock fallback when running locally/tests without active Supabase credentials
    const mockUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${storageKey}`;
    return {
      path: storageKey,
      publicUrl: mockUrl,
    };
  }

  /**
   * Delete an avatar object from Supabase Storage
   */
  async deleteAvatar(pathOrUrl: string): Promise<boolean> {
    if (!pathOrUrl) return true;

    const relativePath = this.extractRelativePath(pathOrUrl);
    if (!relativePath) return true;

    if (this.client) {
      const { error } = await this.client.storage
        .from(this.bucket)
        .remove([relativePath]);

      if (error) {
        console.warn(`[SupabaseStorage] Delete warning for ${relativePath}:`, error.message);
        return false;
      }
    }

    return true;
  }

  /**
   * Upload rider payment QR image to Supabase Storage
   */
  async uploadRiderQr(
    riderUserId: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<{ path: string; publicUrl: string }> {
    this.validateImage(buffer, mimeType);

    const ext = MIME_TO_EXT[mimeType] || 'jpg';
    const uniqueId = crypto.randomUUID();
    const relativePath = `rider-qrs/${riderUserId}/${uniqueId}.${ext}`;
    const storageKey = `${this.bucket}/${relativePath}`;

    if (this.client) {
      const { error } = await this.client.storage
        .from(this.bucket)
        .upload(relativePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        console.error('[SupabaseStorage] Rider QR upload error:', error);
        throw new StorageError(`Failed to upload rider QR to Supabase: ${error.message}`, 500);
      }

      const { data } = this.client.storage.from(this.bucket).getPublicUrl(relativePath);
      return {
        path: storageKey,
        publicUrl: data.publicUrl,
      };
    }

    // Mock fallback when running locally/tests without active Supabase credentials
    const mockUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${storageKey}`;
    return {
      path: storageKey,
      publicUrl: mockUrl,
    };
  }

  /**
   * Delete a rider payment QR image from Supabase Storage
   */
  async deleteRiderQr(pathOrUrl: string): Promise<boolean> {
    return this.deleteAvatar(pathOrUrl);
  }
}

export const supabaseStorageService = new SupabaseStorageService();
export default supabaseStorageService;
