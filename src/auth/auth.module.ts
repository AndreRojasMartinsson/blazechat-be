import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { EmailModule } from 'src/email/email.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from 'src/database/models/RefreshToken.entity';

@Module({
  imports: [UsersModule, EmailModule, TypeOrmModule.forFeature([RefreshToken])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
