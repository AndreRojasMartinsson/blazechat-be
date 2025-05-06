import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { HttpModule } from '@nestjs/axios';
import { EmailProcessor } from './email.processor';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [HttpModule, BullModule.registerQueue({
    name: "email",
  })],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService]
})
export class EmailModule { }
