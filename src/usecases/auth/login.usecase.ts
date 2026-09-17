import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { LoginRequest, LoginResponse } from '../../domain/models/user.model';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';
import { ActiveStatus } from '../../domain/enums/enum';

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: AuthTokenService,
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    if (!request || !request.username || !request.password) {
      throw new UnauthorizedException('Username and password are required');
    }

    const user = await this.userRepository.findByUsername(request.username);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (user.isActive !== ActiveStatus.active) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(request.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
      actorType: 'staff' as const,
    };

    const tokens = this.tokenService.issue(payload);

    return {
      _id: user._id,
      username: user.username,
      isActive: user.isActive,
      role: user.role,
      ...tokens,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
