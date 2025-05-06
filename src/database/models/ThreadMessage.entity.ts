import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
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
  thread: ServerThread;

  @ManyToOne(() => ServerMember, (member) => member.messages)
  @JoinColumn()
  author: ServerMember;

  @Column('text')
  message: string;

  @UpdateDateColumn()
  edited_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
