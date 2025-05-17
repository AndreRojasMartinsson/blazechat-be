import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User.entity';
import { Server } from './Server.entity';
import { MemberRole } from './MemberRole.entity';
import { AuditLog } from './AuditLog.entity';
import { ThreadMessage } from './ThreadMessage.entity';

@Entity()
export class ServerMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.server_members)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Server, (server) => server.members)
  @JoinColumn()
  server: Server;

  @Index()
  @Column({ type: 'text' })
  nickname: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: false })
  timed_out: boolean;

  @OneToMany(() => MemberRole, (role) => role.member)
  roles: MemberRole[];

  @OneToMany(() => AuditLog, (log) => log.targeted_member)
  targeted_audit_logs: AuditLog[];

  @OneToMany(() => AuditLog, (log) => log.created_by)
  audit_logs: AuditLog[];

  @OneToMany(() => ThreadMessage, (message) => message.author)
  messages: ThreadMessage[];

  // Lowercased and preprocessed name for better indexing
  @Index()
  @Column({ type: 'text' })
  normalized_name: string;

  @BeforeInsert()
  @BeforeUpdate()
  normalizedName() {
    this.normalized_name = this.nickname.toLowerCase();
  }

  constructor(partial: Partial<ServerMember>) {
    Object.assign(this, partial);
  }
}
