import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PendingDeletion } from 'src/database/models/PendingDeletion.entity';
import { Suspension } from 'src/database/models/Suspension.entity';
import { User } from 'src/database/models/User.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(PendingDeletion)
    private pendingDeletion: Repository<PendingDeletion>,
    @InjectRepository(Suspension)
    private suspension: Repository<Suspension>,
  ) {}

  async getAll(): Promise<User[]> {
    return this.users.find();
  }

  async findOne(id: string): Promise<User | null> {
    return this.users.findOne({
      where: { id },
      relations: { suspensions: true },
    });
  }

  async isSuspended(id: string): Promise<boolean> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException();

    return user.suspensions.some((suspension) => suspension.created_at);
  }

  async findByName(username: string): Promise<User | null> {
    return this.users.findOneBy({ username });
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.findOne(userId);
    if (user === null) throw new NotFoundException();

    const row = new PendingDeletion({
      user,
    });

    await this.pendingDeletion.insert(row);
  }

  async suspendUser(
    staff: User,
    userId: string,
    durationInSec: number,
  ): Promise<void> {
    const user = await this.findOne(userId);
    if (user === null) throw new NotFoundException();

    const row = new Suspension({
      user,
      staff,
      expire_at: new Date(Date.now() + durationInSec * 1000),
    });

    await this.suspension.insert(row);
  }
}
