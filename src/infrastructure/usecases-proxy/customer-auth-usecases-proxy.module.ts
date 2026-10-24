import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginCustomerUseCase } from '../../usecases/customer/loginCustomer.usecase';
import { RegisterCustomerUseCase } from '../../usecases/customer/registerCustomer.usecase';
import { RefreshCustomerTokenUseCase } from '../../usecases/customer/refreshCustomerToken.usecase';
import { SocialLoginCustomerUseCase } from '../../usecases/customer/socialLoginCustomer.usecase';
import { AuthTokenService } from '../../usecases/auth/auth-token.service';
import { SocialAuthService } from '../common/social-auth.service';
import { DatabaseCustomerAuthRepository } from '../repositories/customer/customer-auth.repository';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({ imports: [RepositoriesModule], providers: [SocialAuthService], exports: [SocialAuthService] })
export class CustomerAuthUsecasesProxyModule {
  static REGISTER_CUSTOMER_PROXY = 'RegisterCustomerProxy';
  static LOGIN_CUSTOMER_PROXY = 'LoginCustomerProxy';
  static REFRESH_CUSTOMER_TOKEN_PROXY = 'RefreshCustomerTokenProxy';
  static SOCIAL_LOGIN_CUSTOMER_PROXY = 'SocialLoginCustomerProxy';

  static register(): DynamicModule {
    const factory = (
      UseCase: new (
        repository: DatabaseCustomerAuthRepository,
        tokenService: AuthTokenService,
      ) => unknown,
    ) => ({
      inject: [DatabaseCustomerAuthRepository, ConfigService],
      useFactory: (repository: DatabaseCustomerAuthRepository, config: ConfigService) =>
        new UseCase(
          repository,
          new AuthTokenService(
            config.getOrThrow<string>('JWT_SECRET'),
            config.getOrThrow<string>('JWT_EXPIRATION'),
            config.getOrThrow<string>('JWT_REFRESH_SECRET'),
            config.getOrThrow<string>('JWT_REFRESH_EXPIRATION'),
          ),
        ),
    });

    const socialFactory = {
      inject: [DatabaseCustomerAuthRepository, ConfigService, SocialAuthService],
      useFactory: (
        repository: DatabaseCustomerAuthRepository,
        config: ConfigService,
        socialAuthService: SocialAuthService,
      ) =>
        new SocialLoginCustomerUseCase(
          repository,
          new AuthTokenService(
            config.getOrThrow<string>('JWT_SECRET'),
            config.getOrThrow<string>('JWT_EXPIRATION'),
            config.getOrThrow<string>('JWT_REFRESH_SECRET'),
            config.getOrThrow<string>('JWT_REFRESH_EXPIRATION'),
          ),
          socialAuthService,
        ),
    };

    return {
      module: CustomerAuthUsecasesProxyModule,
      providers: [
        SocialAuthService,
        { provide: this.REGISTER_CUSTOMER_PROXY, ...factory(RegisterCustomerUseCase) },
        { provide: this.LOGIN_CUSTOMER_PROXY, ...factory(LoginCustomerUseCase) },
        { provide: this.REFRESH_CUSTOMER_TOKEN_PROXY, ...factory(RefreshCustomerTokenUseCase) },
        { provide: this.SOCIAL_LOGIN_CUSTOMER_PROXY, ...socialFactory },
      ],
      exports: [
        SocialAuthService,
        this.REGISTER_CUSTOMER_PROXY,
        this.LOGIN_CUSTOMER_PROXY,
        this.REFRESH_CUSTOMER_TOKEN_PROXY,
        this.SOCIAL_LOGIN_CUSTOMER_PROXY,
      ],
    };
  }
}
