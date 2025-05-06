import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
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
  targeted_member?: ServerMember;

  @ManyToOne(() => ServerMember, (member) => member.audit_logs)
  @JoinColumn()
  created_by: ServerMember;

  @ManyToOne(() => AuditLogAction, (action) => action.logs)
  @JoinColumn()
  action: AuditLogAction;
}
