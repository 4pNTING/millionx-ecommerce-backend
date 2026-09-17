import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginCustomerUseCase } from '../../usecases/customer/loginCustomer.usecase';
import { RegisterCustomerUseCase } from '../../usecases/customer/registerCustomer.usecase';
import { RefreshCustomerTokenUseCase } from '../../usecases/customer/refreshCustomerToken.usecase';
import { AuthTokenService } from '../../usecases/auth/auth-token.service';
import { DatabaseCustomerAuthRepository } from '../repositories/customer/customer-auth.repository';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({ imports: [RepositoriesModule] })
export class CustomerAuthUsecasesProxyModule {
  static REGISTER_CUSTOMER_PROXY = 'RegisterCustomerProxy';
  static LOGIN_CUSTOMER_PROXY = 'LoginCustomerProxy';
  static REFRESH_CUSTOMER_TOKEN_PROXY = 'RefreshCustomerTokenProxy';

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

    return {
      module: CustomerAuthUsecasesProxyModule,
      providers: [
        { provide: this.REGISTER_CUSTOMER_PROXY, ...factory(RegisterCustomerUseCase) },
        { provide: this.LOGIN_CUSTOMER_PROXY, ...factory(LoginCustomerUseCase) },
        { provide: this.REFRESH_CUSTOMER_TOKEN_PROXY, ...factory(RefreshCustomerTokenUseCase) },
      ],
      exports: [
        this.REGISTER_CUSTOMER_PROXY,
        this.LOGIN_CUSTOMER_PROXY,
        this.REFRESH_CUSTOMER_TOKEN_PROXY,
      ],
    };
  }
}
