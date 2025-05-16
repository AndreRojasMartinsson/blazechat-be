import { Controller, Get } from '@nestjs/common';
import * as client from 'prom-client';
import { Public } from 'src/auth/auth.guard';
import { AllowSuspended } from 'src/users/suspension.guard';

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

@Controller('metrics')
export class MetricsController {
  @Get()
  @AllowSuspended()
  @Public()
  getMetrics(): Promise<string> {
    return client.register.metrics();
  }
}
