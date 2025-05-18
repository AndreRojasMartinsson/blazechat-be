import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ServerMember } from './ServerMember.entity';
import { AuditLogAction } from './AuditLogAction.entity';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => ServerMember, (member) => member.targeted_audit_logs)
  @JoinColumn()
  targeted_member?: Relation<ServerMember>;

  @ManyToOne(() => ServerMember, (member) => member.audit_logs)
  @JoinColumn()
  created_by: Relation<ServerMember>;

  @ManyToOne(() => AuditLogAction, (action) => action.logs)
  @JoinColumn()
  action: Relation<AuditLogAction>;
}
