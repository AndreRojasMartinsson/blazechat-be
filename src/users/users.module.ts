import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/models/User.entity';
import { PendingDeletion } from 'src/database/models/PendingDeletion.entity';
import { Suspension } from 'src/database/models/Suspension.entity';
import { Server } from 'src/database/models/Server.entity';
import { ServersModule } from 'src/servers/servers.module';

@Module({
  imports: [
    ServersModule,
    TypeOrmModule.forFeature([User, PendingDeletion, Suspension, Server]),
    // TODO: Add supabase import so we can use their storage
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
