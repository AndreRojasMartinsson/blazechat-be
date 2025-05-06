import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Suspension } from './Suspension.entity';
import { Exclude } from 'class-transformer';
import { Server } from './Server.entity';
import { ServerMember } from './ServerMember.entity';
import { Friendship } from './Friendship.entity';

export enum UserRole {
  ADMIN = 'admin',
  REGULAR = 'regular',
  ROOT = 'root',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  hashed_password: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.REGULAR,
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
