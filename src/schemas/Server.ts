import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PermissionType } from 'src/database/models/ServerRole.entity';

export class ServerInDto {
  @ApiProperty()
  @MinLength(1)
  @MaxLength(50)
  @IsNotEmpty()
  name: string;
}

export class ServerUpdateDto {
  @ApiProperty()
  @MinLength(1)
  @MaxLength(50)
  @IsNotEmpty()
  name: string;
}

export class ServerRoleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @Matches(/^#(?:[0-9a-fA-F]{3}){2}$/)
  @IsOptional()
  color?: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  permissions: PermissionType;
}
