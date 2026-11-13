import { DynamicModule, Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { DatabaseCheckoutRepository } from '../repositories/checkout/checkout.repository';
import { CreateCheckoutSessionUseCase } from '../../usecases/checkout/createCheckoutSession.usecase';
import { GetCheckoutSessionUseCase } from '../../usecases/checkout/getCheckoutSession.usecase';

@Module({ imports: [RepositoriesModule] })
export class CheckoutUsecasesProxyModule {
  static CREATE_CHECKOUT_SESSION_PROXY = 'CreateCheckoutSessionProxy';
  static GET_CHECKOUT_SESSION_PROXY = 'GetCheckoutSessionProxy';

  static register(): DynamicModule {
    const factory = (UseCase: new (repository: DatabaseCheckoutRepository) => unknown) => ({
      inject: [DatabaseCheckoutRepository],
      useFactory: (repository: DatabaseCheckoutRepository) => new UseCase(repository),
    });

    return {
      module: CheckoutUsecasesProxyModule,
      providers: [
        { provide: this.CREATE_CHECKOUT_SESSION_PROXY, ...factory(CreateCheckoutSessionUseCase) },
        { provide: this.GET_CHECKOUT_SESSION_PROXY, ...factory(GetCheckoutSessionUseCase) },
      ],
      exports: [this.CREATE_CHECKOUT_SESSION_PROXY, this.GET_CHECKOUT_SESSION_PROXY],
    };
  }
}
