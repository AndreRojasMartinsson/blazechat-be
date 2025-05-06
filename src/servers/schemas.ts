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
import { Permission } from 'src/database/models/ServerRole.entity';

export class ServerRoleDTO {
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
  permissions: Permission;
}

export class ServerInDTO {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @IsNotEmpty()
  name: string;
}
