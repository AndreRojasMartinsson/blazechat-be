import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { User } from './User.entity';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  issued: Date;

  @Column({ nullable: true, type: 'timestamp' })
  invalidated?: Date;

  @Column({ type: 'text' })
  token: string;

  @ManyToOne(() => User, (user) => user.refresh_tokens)
  user: Relation<User>;

  constructor(partial: Partial<RefreshToken>) {
    Object.assign(this, partial);
  }
}
