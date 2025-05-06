import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AuditLog } from './AuditLog.entity';

@Entity()
export class AuditLogAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => AuditLog, (log) => log.action)
  logs: AuditLog[];
}
