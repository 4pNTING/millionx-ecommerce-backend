import { Repository } from 'typeorm';
import { UserModel } from '../../../../domain/models/user.model';
import { UserEntity } from '../../../entities/user.entity';

export class FindUserByIdAction {
  constructor(private readonly repository: Repository<UserEntity>) {}

  async execute(_id: string): Promise<UserModel | null> {
    return this.repository.findOne({ where: { _id } });
  }
}
