import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginCustomerUseCase } from '../../usecases/customer/loginCustomer.usecase';
import { RegisterCustomerUseCase } from '../../usecases/customer/registerCustomer.usecase';
import { DatabaseCustomerAuthRepository } from '../repositories/customer/customer-auth.repository';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({ imports: [RepositoriesModule] })
export class CustomerAuthUsecasesProxyModule {
  static REGISTER_CUSTOMER_PROXY = 'RegisterCustomerProxy';
  static LOGIN_CUSTOMER_PROXY = 'LoginCustomerProxy';

  static register(): DynamicModule {
    const factory = (
      UseCase: new (
        repository: DatabaseCustomerAuthRepository,
        jwtSecret: string,
        jwtExpiration: string,
      ) => unknown,
    ) => ({
      inject: [DatabaseCustomerAuthRepository, ConfigService],
      useFactory: (repository: DatabaseCustomerAuthRepository, config: ConfigService) =>
        new UseCase(
          repository,
          config.getOrThrow<string>('JWT_SECRET'),
          config.getOrThrow<string>('JWT_EXPIRATION'),
        ),
    });

    return {
      module: CustomerAuthUsecasesProxyModule,
      providers: [
        { provide: this.REGISTER_CUSTOMER_PROXY, ...factory(RegisterCustomerUseCase) },
        { provide: this.LOGIN_CUSTOMER_PROXY, ...factory(LoginCustomerUseCase) },
      ],
      exports: [this.REGISTER_CUSTOMER_PROXY, this.LOGIN_CUSTOMER_PROXY],
    };
  }
}
