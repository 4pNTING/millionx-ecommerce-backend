import { Inject, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CustomerAccountGuard } from '../../common/customer-account.guard';
import { StaffCustomerReadGuard } from '../../common/staff-customer-read.guard';
import { CustomerUsecasesProxyModule } from '../../usecases-proxy/customer-usecases-proxy.module';
import { LoadCustomerProfileUseCase } from '../../../usecases/customer/loadCustomerProfile.usecase';
import { UpsertCustomerProfileUseCase } from '../../../usecases/customer/upsertCustomerProfile.usecase';
import { CreateCustomerAddressUseCase } from '../../../usecases/customer/createCustomerAddress.usecase';
import { UpdateCustomerAddressUseCase } from '../../../usecases/customer/updateCustomerAddress.usecase';
import { SetDefaultCustomerAddressUseCase } from '../../../usecases/customer/setDefaultCustomerAddress.usecase';
import { DeleteCustomerAddressUseCase } from '../../../usecases/customer/deleteCustomerAddress.usecase';
import { LoadCustomersUseCase } from '../../../usecases/customer/loadCustomers.usecase';
import {
  CreateCustomerAddressInput,
  CustomerFilterInput,
  CustomerPage,
  CustomerProfile,
  UpdateCustomerAddressInput,
  UpdateCustomerProfileInput,
} from './customer.model';

interface AuthenticatedContext {
  req: { user: { customerId: string } };
}

@Resolver(() => CustomerProfile)
export class CustomerResolver {
  constructor(
    @Inject(CustomerUsecasesProxyModule.LOAD_CUSTOMERS_PROXY)
    private readonly loadCustomersUseCase: LoadCustomersUseCase,
    @Inject(CustomerUsecasesProxyModule.LOAD_PROFILE_PROXY)
    private readonly loadProfileUseCase: LoadCustomerProfileUseCase,
    @Inject(CustomerUsecasesProxyModule.UPSERT_PROFILE_PROXY)
    private readonly upsertProfileUseCase: UpsertCustomerProfileUseCase,
    @Inject(CustomerUsecasesProxyModule.CREATE_ADDRESS_PROXY)
    private readonly createAddressUseCase: CreateCustomerAddressUseCase,
    @Inject(CustomerUsecasesProxyModule.UPDATE_ADDRESS_PROXY)
    private readonly updateAddressUseCase: UpdateCustomerAddressUseCase,
    @Inject(CustomerUsecasesProxyModule.SET_DEFAULT_ADDRESS_PROXY)
    private readonly setDefaultAddressUseCase: SetDefaultCustomerAddressUseCase,
    @Inject(CustomerUsecasesProxyModule.DELETE_ADDRESS_PROXY)
    private readonly deleteAddressUseCase: DeleteCustomerAddressUseCase,
  ) {}

  @Query(() => CustomerPage)
  @UseGuards(JwtAuthGuard, StaffCustomerReadGuard)
  customers(@Args('filter', { nullable: true }) filter?: CustomerFilterInput) {
    return this.loadCustomersUseCase.execute(filter);
  }

  @Query(() => CustomerProfile)
  @UseGuards(JwtAuthGuard, CustomerAccountGuard)
  myCustomerProfile(@Context() context: AuthenticatedContext) {
    return this.loadProfileUseCase.execute(context.req.user.customerId);
  }

  @Mutation(() => CustomerProfile)
  @UseGuards(JwtAuthGuard, CustomerAccountGuard)
  updateCustomerProfile(
    @Context() context: AuthenticatedContext,
    @Args('input') input: UpdateCustomerProfileInput,
  ) {
    return this.upsertProfileUseCase.execute(context.req.user.customerId, input);
  }

  @Mutation(() => CustomerProfile)
  @UseGuards(JwtAuthGuard, CustomerAccountGuard)
  createCustomerAddress(
    @Context() context: AuthenticatedContext,
    @Args('input') input: CreateCustomerAddressInput,
  ) {
    return this.createAddressUseCase.execute(context.req.user.customerId, input);
  }

  @Mutation(() => CustomerProfile)
  @UseGuards(JwtAuthGuard, CustomerAccountGuard)
  updateCustomerAddress(
    @Context() context: AuthenticatedContext,
    @Args('input') input: UpdateCustomerAddressInput,
  ) {
    return this.updateAddressUseCase.execute(context.req.user.customerId, input);
  }

  @Mutation(() => CustomerProfile)
  @UseGuards(JwtAuthGuard, CustomerAccountGuard)
  setDefaultCustomerAddress(
    @Context() context: AuthenticatedContext,
    @Args('addressId') addressId: string,
  ) {
    return this.setDefaultAddressUseCase.execute(context.req.user.customerId, addressId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, CustomerAccountGuard)
  deleteCustomerAddress(
    @Context() context: AuthenticatedContext,
    @Args('addressId') addressId: string,
  ) {
    return this.deleteAddressUseCase.execute(context.req.user.customerId, addressId);
  }
}
