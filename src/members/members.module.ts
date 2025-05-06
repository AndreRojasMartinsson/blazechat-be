import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberRole } from 'src/database/models/MemberRole.entity';
import { ServerRole } from 'src/database/models/ServerRole.entity';
import { ServerMember } from 'src/database/models/ServerMember.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MemberRole, ServerRole, ServerMember])],
  providers: [MembersService],
})
export class MembersModule {}
