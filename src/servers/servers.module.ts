import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerRole } from 'src/database/models/ServerRole.entity';
import { ServerMember } from 'src/database/models/ServerMember.entity';
import { Server } from 'src/database/models/Server.entity';
import { MemberRole } from 'src/database/models/MemberRole.entity';
import { UsersModule } from 'src/users/users.module';
import { LoggerModule } from 'src/logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServerRole, ServerMember, Server, MemberRole]),
    UsersModule,
    LoggerModule,
  ],
  exports: [ServersService],
  providers: [ServersService],
  controllers: [ServersController],
})
export class ServersModule {}
