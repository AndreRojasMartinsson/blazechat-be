import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServerMember } from './ServerMember.entity';
import { ServerRole } from './ServerRole.entity';

@Entity()
export class MemberRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ServerMember, (member) => member.roles)
  @JoinColumn()
  member: ServerMember;

  @ManyToOne(() => ServerRole, (role) => role.members)
  @JoinColumn()
  role: ServerRole;

  @CreateDateColumn()
  created_at: Date;

  constructor(partial: Partial<MemberRole>) {
    Object.assign(this, partial);
  }
}
