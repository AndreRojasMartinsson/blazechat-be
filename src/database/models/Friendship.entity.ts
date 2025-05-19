import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Relation,
} from 'typeorm';
import { User } from './User.entity';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

@Entity()
export class Friendship {
  @PrimaryColumn('uuid')
  user_id_1: string;

  @PrimaryColumn('uuid')
  user_id_2: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id_1' })
  user1: Relation<User>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id_2' })
  user2: Relation<User>;

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending',
  })
  status: FriendshipStatus;
}
