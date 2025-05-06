import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User.entity';

@Entity()
export class PendingDeletion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  constructor(partial: Partial<PendingDeletion>) {
    Object.assign(this, partial);
  }
}
