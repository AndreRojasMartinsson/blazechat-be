import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './models/AuditLog.entity';
import { AuditLogAction } from './models/AuditLogAction.entity';
import { Friendship } from './models/Friendship.entity';
import { MemberRole } from './models/MemberRole.entity';
import { PendingDeletion } from './models/PendingDeletion.entity';
import { Server } from './models/Server.entity';
import { ServerMember } from './models/ServerMember.entity';
import { ServerRole } from './models/ServerRole.entity';
import { ServerThread } from './models/ServerThread.entity';
import { Suspension } from './models/Suspension.entity';
import { ThreadMessage } from './models/ThreadMessage.entity';
import { User } from './models/User.entity';
import { AuthRequest } from './models/AuthRequest.entity';

export default TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.getOrThrow('database.host'),
    port: +configService.getOrThrow('database.port'),
    username: configService.getOrThrow('database.user'),
    password: configService.getOrThrow('database.password'),
    database: configService.getOrThrow('database.name'),
    entities: [
      AuditLog,
      AuditLogAction,
      Friendship,
      MemberRole,
      PendingDeletion,
      Server,
      ServerMember,
      ServerRole,
      ServerThread,
      Suspension,
      ThreadMessage,
      User,
      AuthRequest,
    ],
    // autoLoadEntities: true,

    synchronize: false,
    migrations: [__dirname + '/../migrations/*.{ts,js}'],
    migrationsRun: true,

    // ssl:
    //   configService.get<string>('secrets.env') !== 'production'
    //     ? false
    //     : {
    //         ca: readFileSync('prod-ca-2021.crt').toString(),
    //       },
    // synchronize: configService.get<string>('secrets.env') !== 'production',
  }),
  inject: [ConfigService],
});
