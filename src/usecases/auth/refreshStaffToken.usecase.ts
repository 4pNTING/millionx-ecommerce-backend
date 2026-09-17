import { UnauthorizedException } from '@nestjs/common';
import { ActiveStatus } from '../../domain/enums/enum';
import { LoginResponse } from '../../domain/models/user.model';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AuthTokenService } from './auth-token.service';

export class RefreshStaffTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: AuthTokenService,
  ) {}

  async execute(refreshToken: string): Promise<LoginResponse> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken, 'staff');
    const user = await this.userRepository.findById(payload.id);

    if (!user || user.isActive !== ActiveStatus.active) {
      throw new UnauthorizedException('Staff account is inactive or no longer exists');
    }

    const tokens = this.tokenService.issue({
      id: user._id,
      username: user.username,
      role: user.role ?? 'staff',
      actorType: 'staff',
    });

    return {
      _id: user._id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      ...tokens,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
