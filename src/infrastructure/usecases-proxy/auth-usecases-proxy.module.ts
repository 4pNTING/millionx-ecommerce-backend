import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseUserRepository } from '../repositories/user/user.repository';
import { RepositoriesModule } from '../repositories/repositories.module';
import { LoginUseCase } from '../../usecases/auth/login.usecase';
import { AuthTokenService } from '../../usecases/auth/auth-token.service';
import { RefreshStaffTokenUseCase } from '../../usecases/auth/refreshStaffToken.usecase';

@Module({
  imports: [RepositoriesModule],
})
export class AuthUsecasesProxyModule {
  static LOGIN_PROXY = 'LoginProxy';
  static REFRESH_STAFF_TOKEN_PROXY = 'RefreshStaffTokenProxy';

  static register(): DynamicModule {
    return {
      module: AuthUsecasesProxyModule,
      providers: [
        {
          inject: [DatabaseUserRepository, ConfigService],
          provide: AuthUsecasesProxyModule.LOGIN_PROXY,
          useFactory: (repo: DatabaseUserRepository, config: ConfigService) =>
            new LoginUseCase(repo, this.createTokenService(config)),
        },
        {
          inject: [DatabaseUserRepository, ConfigService],
          provide: AuthUsecasesProxyModule.REFRESH_STAFF_TOKEN_PROXY,
          useFactory: (repo: DatabaseUserRepository, config: ConfigService) =>
            new RefreshStaffTokenUseCase(repo, this.createTokenService(config)),
        },
      ],
      exports: [
        AuthUsecasesProxyModule.LOGIN_PROXY,
        AuthUsecasesProxyModule.REFRESH_STAFF_TOKEN_PROXY,
      ],
    };
  }

  private static createTokenService(config: ConfigService): AuthTokenService {
    return new AuthTokenService(
      config.getOrThrow<string>('JWT_SECRET'),
      config.getOrThrow<string>('JWT_EXPIRATION'),
      config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      config.getOrThrow<string>('JWT_REFRESH_EXPIRATION'),
    );
  }
}
