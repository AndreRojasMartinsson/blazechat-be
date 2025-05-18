import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { ServerThread } from './ServerThread.entity';
import { ServerMember } from './ServerMember.entity';

@Entity()
export class ThreadMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ServerThread, (thread) => thread.messages)
  @JoinColumn()
  thread: Relation<ServerThread>;

  @ManyToOne(() => ServerMember, (member) => member.messages)
  @JoinColumn()
  author: Relation<ServerMember>;

  @Column('text')
  message: string;

  @UpdateDateColumn()
  edited_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
