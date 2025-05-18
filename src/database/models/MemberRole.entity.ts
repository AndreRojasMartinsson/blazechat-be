import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ServerMember } from './ServerMember.entity';
import { ServerRole } from './ServerRole.entity';

@Entity()
export class MemberRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ServerMember, (member) => member.roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  member: Relation<ServerMember>;

  @ManyToOne(() => ServerRole, (role) => role.members)
  @JoinColumn()
  role: Relation<ServerRole>;

  @CreateDateColumn()
  created_at: Date;

  constructor(partial: Partial<MemberRole>) {
    Object.assign(this, partial);
  }
}
