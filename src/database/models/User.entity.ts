import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Suspension } from './Suspension.entity';
import { Exclude } from 'class-transformer';
import { Server } from './Server.entity';
import { ServerMember } from './ServerMember.entity';
import { RefreshToken } from './RefreshToken.entity';

export type UserRole = 'root' | 'admin' | 'regular';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Exclude()
  email: string;

  @Column()
  @Exclude()
  hashed_password: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ default: false })
  email_confirmed: boolean;

  @Column({ nullable: true, type: 'text' })
  @Exclude()
  email_verification_token?: string;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refresh_tokens: RefreshToken[];

  @Column({
    type: 'enum',
    enum: ['root', 'admin', 'regular'],
    default: 'regular',
  })
  role: UserRole;

  @OneToMany(() => Suspension, (suspension) => suspension.user)
  suspensions: Suspension[];

  @OneToMany(() => Server, (server) => server.owner)
  ownedServers: Server[];

  @OneToMany(() => Suspension, (suspension) => suspension.staff)
  @Exclude()
  suspensions_issued: Suspension[];

  @OneToMany(() => ServerMember, (member) => member.user)
  server_members: ServerMember[];

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
