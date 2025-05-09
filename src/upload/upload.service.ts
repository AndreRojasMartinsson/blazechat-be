import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import { File } from '@nest-lab/fastify-multer';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UploadService {
  constructor(private readonly supabaseClient: SupabaseClient) {}

  async uploadAvatar(userId: string, file: File) {
    const optimizedFile = await sharp(file.buffer)
      .resize({
        height: 256,
        width: 256,
        background: { alpha: 1, r: 0, g: 0, b: 0 },
        withoutReduction: true,
        fit: 'fill',
      })
      .toFormat('jpeg', { compressionLevel: 10 })
      .toBuffer();

    await this.supabaseClient.storage
      .from('avatars')
      .upload(`avatar_${userId}.jpeg`, optimizedFile, {
        contentType: 'image/jpeg',
        upsert: true,
      });
  }
}
