import { DynamicModule, Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { DatabaseCustomerRepository } from '../repositories/customer/customer.repository';
import { LoadCustomerProfileUseCase } from '../../usecases/customer/loadCustomerProfile.usecase';
import { UpsertCustomerProfileUseCase } from '../../usecases/customer/upsertCustomerProfile.usecase';
import { CreateCustomerAddressUseCase } from '../../usecases/customer/createCustomerAddress.usecase';
import { UpdateCustomerAddressUseCase } from '../../usecases/customer/updateCustomerAddress.usecase';
import { SetDefaultCustomerAddressUseCase } from '../../usecases/customer/setDefaultCustomerAddress.usecase';
import { DeleteCustomerAddressUseCase } from '../../usecases/customer/deleteCustomerAddress.usecase';
import { LoadCustomersUseCase } from '../../usecases/customer/loadCustomers.usecase';

@Module({ imports: [RepositoriesModule] })
export class CustomerUsecasesProxyModule {
  static LOAD_CUSTOMERS_PROXY = 'LoadCustomersProxy';
  static LOAD_PROFILE_PROXY = 'LoadCustomerProfileProxy';
  static UPSERT_PROFILE_PROXY = 'UpsertCustomerProfileProxy';
  static CREATE_ADDRESS_PROXY = 'CreateCustomerAddressProxy';
  static UPDATE_ADDRESS_PROXY = 'UpdateCustomerAddressProxy';
  static SET_DEFAULT_ADDRESS_PROXY = 'SetDefaultCustomerAddressProxy';
  static DELETE_ADDRESS_PROXY = 'DeleteCustomerAddressProxy';

  static register(): DynamicModule {
    const factory = (UseCase: new (repository: DatabaseCustomerRepository) => unknown) => ({
      inject: [DatabaseCustomerRepository],
      useFactory: (repository: DatabaseCustomerRepository) => new UseCase(repository),
    });
    return {
      module: CustomerUsecasesProxyModule,
      providers: [
        { provide: this.LOAD_CUSTOMERS_PROXY, ...factory(LoadCustomersUseCase) },
        { provide: this.LOAD_PROFILE_PROXY, ...factory(LoadCustomerProfileUseCase) },
        { provide: this.UPSERT_PROFILE_PROXY, ...factory(UpsertCustomerProfileUseCase) },
        { provide: this.CREATE_ADDRESS_PROXY, ...factory(CreateCustomerAddressUseCase) },
        { provide: this.UPDATE_ADDRESS_PROXY, ...factory(UpdateCustomerAddressUseCase) },
        { provide: this.SET_DEFAULT_ADDRESS_PROXY, ...factory(SetDefaultCustomerAddressUseCase) },
        { provide: this.DELETE_ADDRESS_PROXY, ...factory(DeleteCustomerAddressUseCase) },
      ],
      exports: [
        this.LOAD_CUSTOMERS_PROXY,
        this.LOAD_PROFILE_PROXY,
        this.UPSERT_PROFILE_PROXY,
        this.CREATE_ADDRESS_PROXY,
        this.UPDATE_ADDRESS_PROXY,
        this.SET_DEFAULT_ADDRESS_PROXY,
        this.DELETE_ADDRESS_PROXY,
      ],
    };
  }
}
