import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User.entity';

@Entity()
export class Suspension {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column('timestamp with time zone')
  expire_at: Date;

  /* User Id of the user that was suspended */
  @ManyToOne(() => User, (user) => user.suspensions)
  @JoinColumn()
  user: User;

  /* User Id of the staff member that suspended user */
  @ManyToOne(() => User, (user) => user.suspensions_issued)
  @JoinColumn()
  staff: User;

  constructor(partial: Partial<Suspension>) {
    Object.assign(this, partial);
  }
}
