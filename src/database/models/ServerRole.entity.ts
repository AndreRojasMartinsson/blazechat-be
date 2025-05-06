import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Server } from './Server.entity';
import { MemberRole } from './MemberRole.entity';

export enum Permission {
  EMPTY = 0,
  VIEW_THREADS = 1 << 0,
  MANAGE_THREADS = 1 << 1,
  MANAGE_ROLES = 1 << 2,
  VIEW_AUDIT_LOGS = 1 << 3,
  VIEW_SERVER_INSIGHTS = 1 << 4,
  MANAGE_WEBHOOKS = 1 << 5,
  MANAGE_SERVER = 1 << 6,
  CREATE_INVITE = 1 << 7,
  CHANGE_NICKNAME = 1 << 8,
  MANAGE_NICKNAME = 1 << 9,
  KICK_MEMBERS = 1 << 10,
  BAN_MEMBERS = 1 << 11,
  SEND_MESSAGES = 1 << 13,
  EMBED_LINKS = 1 << 14,
  ADD_REACTIONS = 1 << 15,
  MENTION_EVERYONE = 1 << 16,
  MANAGE_MESSAGES = 1 << 17,
  ADMINISTRATOR = 262143, // 262143 is the sum of all bitwise or's for all permissions, thus allowing the user everything
}

@Entity()
export class ServerRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Server, (server) => server.roles)
  @JoinColumn()
  server: Server;

  @Column()
  name: string;

  @Column()
  color: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({
    type: 'int8',
    default: Permission.EMPTY,
  })
  permissions: Permission;

  @OneToMany(() => MemberRole, (member_role) => member_role.role)
  members: MemberRole[];

  constructor(partial: Partial<ServerRole>) {
    Object.assign(this, partial);
  }
}
