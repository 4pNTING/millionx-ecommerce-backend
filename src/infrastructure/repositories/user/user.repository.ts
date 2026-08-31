import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserModel } from '../../../domain/models/user.model';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../entities/user.entity';
import { FindUserByIdAction } from './findById/findById.action';
import { FindUserByIdValidation } from './findById/findById.validation';
import { FindUserByUsernameAction } from './findByUsername/findByUsername.action';
import { FindUserByUsernameValidation } from './findByUsername/findByUsername.validation';

@Injectable()
export class DatabaseUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findByUsername(username: string): Promise<UserModel | null> {
    const normalized = new FindUserByUsernameValidation().execute(username);
    return new FindUserByUsernameAction(this.userRepository).execute(normalized);
  }

  async findById(_id: string): Promise<UserModel | null> {
    const id = new FindUserByIdValidation().execute(_id);
    return new FindUserByIdAction(this.userRepository).execute(id);
  }
}
