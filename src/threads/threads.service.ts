import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateThreadPayload } from './payloads';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ServerThread } from 'src/database/models/ServerThread.entity';
import { Repository } from 'typeorm';
import { Server } from 'src/database/models/Server.entity';

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name);

  constructor(
    @InjectRepository(ServerThread)
    private serverThread: Repository<ServerThread>,
    @InjectRepository(Server)
    private servers: Repository<Server>,
  ) {}

  @OnEvent('channels.create')
  async handleCreateChannel(payload: CreateThreadPayload) {
    this.logger.debug(
      `Recieved 'channels.create' event with name '${payload.name}'`,
    );

    const server = await this.servers.findOneBy({ id: payload.server_id });
    if (!server) throw new NotFoundException();

    const row = new ServerThread({
      name: payload.name,
      server,
    });

    await this.serverThread.insert(row);
  }
}
