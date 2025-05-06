import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';

@Injectable({ scope: Scope.REQUEST })
export class LoggerService {
  private readonly operationId: string;
  private readonly logger = new Logger();

  constructor(@Inject(REQUEST) private readonly request: FastifyRequest) {
    this.operationId = randomUUID();
    (this.request as any).operationId = this.operationId;
  }

  log(message: string): void;
  log(ctx: string, message: string): void;
  log(ctxOrMessage: string, message?: string): void {
    if (message) {
      return this.logger.log(
        `[${this.operationId}] [${ctxOrMessage}] ${message}`,
      );
    }

    return this.logger.log(`[${this.operationId}] ${ctxOrMessage}`);
  }
}
