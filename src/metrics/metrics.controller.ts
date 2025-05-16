import { Controller, Get } from '@nestjs/common';
import * as client from 'prom-client';

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

@Controller('metrics')
export class MetricsController {
  @Get()
  getMetrics(): Promise<string> {
    return client.register.metrics();
  }
}
