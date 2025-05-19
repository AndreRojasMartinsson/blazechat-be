import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { AccessToken } from 'src/utils/request';
import { JwtUserPayload } from 'src/schemas/Auth';
import { File, FileInterceptor } from '@nest-lab/fastify-multer';

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @AccessToken() payload: JwtUserPayload,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /png|jpeg|webp/ })
        .addMaxSizeValidator({ maxSize: 8e6 })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: File,
  ) {
    await this.uploadService.uploadAvatar(payload.sub, file);
  }
}
