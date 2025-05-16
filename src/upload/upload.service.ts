import { Injectable } from '@nestjs/common';
import { rm } from 'node:fs/promises';
import * as sharp from 'sharp';
import { File } from '@nest-lab/fastify-multer';

@Injectable()
export class UploadService {
  // constructor(@Inject(MINIO_CONNECTION) private readonly minioClient: Client) {}

  async uploadAvatar(userId: string, file: File) {
    await sharp(file.buffer)
      .resize({
        height: 256,
        width: 256,
        background: { alpha: 1, r: 0, g: 0, b: 0 },
        withoutReduction: true,
        fit: 'fill',
      })
      .toFormat('jpeg', { compressionLevel: 10 })
      .toFile(`/tmp/avatar_${userId}.jpeg`);

    // const metaData = {
    //   'Content-Type': 'image/jpeg',
    // };

    // Upload avatar to supabase storage
    // await this.minioClient.fPutObject(
    //   'blazechat-avatars',
    //   `avatar_${userId}.jpeg`,
    //   `/tmp/avatar_${userId}.jpeg`,
    //   metaData,
    // );

    // Remove temporary avatar image
    await rm(`/tmp/avatar_${userId}.jpeg`);
  }
}
