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
import { ThreadMessage } from './ThreadMessage.entity';

@Entity()
export class ServerThread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Server, (server) => server.threads)
  @JoinColumn()
  server: Server;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => ThreadMessage, (message) => message.thread)
  messages: ThreadMessage[];

  constructor(partial: Partial<ServerThread>) {
    Object.assign(this, partial);
  }
}
