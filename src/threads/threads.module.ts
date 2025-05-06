import { Module } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerThread } from 'src/database/models/ServerThread.entity';
import { Server } from 'src/database/models/Server.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServerThread, Server])],
  providers: [ThreadsService],
  exports: [ThreadsService],
})
export class ThreadsModule {}
