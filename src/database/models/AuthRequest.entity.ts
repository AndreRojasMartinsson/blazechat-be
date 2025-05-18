import { IsBase64, IsUrl } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class AuthRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsUrl()
  redirectUri: string;

  @Column({ type: 'text' })
  @IsBase64({ urlSafe: true })
  codeChallenge: string;

  @Column()
  codeChallengeMethod: string;

  @Column('uuid')
  userId: string;

  constructor(partial: Partial<AuthRequest>) {
    Object.assign(this, partial);
  }
}
