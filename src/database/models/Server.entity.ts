import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User.entity';
import { ServerMember } from './ServerMember.entity';
import { ServerRole } from './ServerRole.entity';
import { ServerThread } from './ServerThread.entity';

@Entity()
export class Server {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.ownedServers)
  @JoinColumn()
  owner: User;

  @Column()
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => ServerMember, (member) => member.server)
  members: ServerMember[];

  @OneToMany(() => ServerRole, (role) => role.server)
  roles: ServerRole[];

  @OneToMany(() => ServerThread, (thread) => thread.server)
  threads: ServerThread[];

  constructor(partial: Partial<Server>) {
    Object.assign(this, partial);
  }
}
