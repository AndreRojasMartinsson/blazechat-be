import { IsNotEmpty, IsNumber } from 'class-validator';

export class SuspendUserDTO {
  @IsNotEmpty()
  @IsNumber()
  durationInSec: number;
}
