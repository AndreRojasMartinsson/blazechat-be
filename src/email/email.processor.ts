import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { User } from 'src/database/models/User.entity';

import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly siteUrl: string;
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    super();

    this.siteUrl = this.configService.getOrThrow<string>('secrets.api_url');
  }

  private async sendEmail(to: string, subject: string, src: string) {
    const transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('email.host'),
      port: this.configService.getOrThrow<number>('email.port'),
      secure: true,
      auth: {
        user: this.configService.getOrThrow<string>('email.user'),
        pass: this.configService.getOrThrow<string>('email.pass'),
      },
    });

    await transporter.sendMail({
      from: '"BlazeChat - No Reply" <noreply@blazechat.se>',
      to,
      subject,
      html: src,
    });

    this.logger.log(`Sent email to '${to}' with subject '${subject}'`);
  }

  private async parseTemplate(
    name: string,
    params: Record<string, string>,
  ): Promise<string> {
    const siteUrl = this.configService.getOrThrow<string>('secrets.api_url');

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

  private async sendConfirmEmail(payload: { user: User; redirect: string }) {
    const src = await this.parseTemplate('confirm-email', {
      URL: payload.redirect,
      EMAIL: payload.user.email,
      USERNAME: payload.user.username,
    });

    this.logger.debug(`${JSON.stringify(payload)}`);

    await this.sendEmail(
      payload.user.email,
      'Confirm your email - BlazeChat',
      src,
    );
  }

  async process(job: Job<any, any, string>) {
    this.logger.log(
      `Processing job in email queue with name '${job.name}' (id ${job.id})`,
    );

    switch (job.name) {
      case 'confirm-email': {
        await this.sendConfirmEmail(job.data);
        break;
      }
    }

    await job.updateProgress(100);
    this.logger.log(
      `Finished processing job in email queue with name '${job.name}' (id ${job.id})`,
    );
  }
}
