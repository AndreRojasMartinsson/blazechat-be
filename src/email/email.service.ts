import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { User } from 'src/database/models/User.entity';
import * as nodemailer from "nodemailer"

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  constructor(private configService: ConfigService, private httpService: HttpService) { }

  async parseTemplate(name: string, params: Record<string, string>): Promise<string> {
    const siteUrl = this.configService.getOrThrow<string>("secrets.site_url");

    const path = `${siteUrl}/templates/${name}.html`;
    const response = await firstValueFrom(this.httpService.get<string>(path).pipe(
      catchError((error: AxiosError) => {
        this.logger.error(error.response?.data);
        throw "An error occured!"
      })
    ));
    const templateSource = response.data;

    return templateSource.replace(/\{\{%(.+?)%\}\}/g, (_, rawKey: string) => {
      const key = rawKey.trim();

      return key in params ? params[key] : _
    })

  }

  @OnEvent("auth.emails.send_confirmation")
  async sendConfirmationEmail({ payload, redirect }: { payload: User, redirect: string }) {
    const siteUrl = this.configService.getOrThrow<string>("secrets.site_url");
    const verificationUrl = `${siteUrl}/auth/verify?t=${encodeURIComponent(payload.email_verification_token!)}&redirect=${redirect}`

    const src = await this.parseTemplate("confirm-email", { URL: verificationUrl, EMAIL: payload.email, USERNAME: payload.username })

    const transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>("email.host"),
      port: this.configService.getOrThrow<number>("email.port"),
      secure: true,
      auth: {
        user: this.configService.getOrThrow<string>("email.user"),
        pass: this.configService.getOrThrow<string>("email.pass"),
      }
    })

    await transporter.sendMail({
      from: '"BlazeChat - No Reply" <noreply@activework.se>',
      to: payload.email,
      subject: "Confirm your email - BlazeChat",
      html: src
    })
  }
}
