import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { Job, Queue } from 'bullmq';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async parseTemplate(
    name: string,
    params: Record<string, string>,
  ): Promise<string> {
    const siteUrl = this.configService.getOrThrow<string>('secrets.site_url');

    const path = `${siteUrl}/templates/${name}.html`;
    const response = await firstValueFrom(
      this.httpService.get<string>(path).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response?.data);
          throw 'An error occured!';
        }),
      ),
    );
    const templateSource = response.data;

    return templateSource.replace(/\{\{%(.+?)%\}\}/g, (_, rawKey: string) => {
      const key = rawKey.trim();

      return key in params ? params[key] : _;
    });
  }

  async addToQueue(name: string, payload: any): Promise<Job> {
    return this.emailQueue.add(name, payload);
  }
}
