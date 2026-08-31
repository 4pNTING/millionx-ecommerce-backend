import { Repository } from 'typeorm';
import { UserModel } from '../../../../domain/models/user.model';
import { UserEntity } from '../../../entities/user.entity';

export class FindUserByUsernameAction {
  constructor(private readonly repository: Repository<UserEntity>) {}

  async execute(username: string): Promise<UserModel | null> {
    return this.repository.findOne({ where: { username } });
  }
}
