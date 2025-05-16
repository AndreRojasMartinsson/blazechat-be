import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    // TODO: Add supabase import so we can use their storage
  ],
  providers: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
