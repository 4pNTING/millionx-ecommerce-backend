import { Inject } from '@nestjs/common';
import { Args, Field, InputType, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { CustomerAuthResponse } from '../../../domain/models/customer-auth.model';
import { LoginCustomerUseCase } from '../../../usecases/customer/loginCustomer.usecase';
import { RegisterCustomerUseCase } from '../../../usecases/customer/registerCustomer.usecase';
import { CustomerAuthUsecasesProxyModule } from '../../usecases-proxy/customer-auth-usecases-proxy.module';

@InputType()
class RegisterCustomerInput {
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(120) firstName?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(120) lastName?: string;
  @Field({ nullable: true })
  @ValidateIf((value) => !value.phone)
  @IsEmail()
  @MaxLength(320)
  email?: string;
  @Field({ nullable: true })
  @ValidateIf((value) => !value.email)
  @IsString()
  @MaxLength(40)
  phone?: string;
  @Field() @IsString() @MinLength(8) @MaxLength(72) password: string;
}

@InputType()
class CustomerLoginInput {
  @Field() @IsString() @IsNotEmpty() identifier: string;
  @Field() @IsString() @IsNotEmpty() password: string;
}

@ObjectType()
class CustomerAuthPayload {
  @Field() accountId: string;
  @Field() customerId: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) phone?: string;
  @Field() token: string;
  @Field() refreshToken: string;
}

@Resolver()
export class CustomerAuthResolver {
  constructor(
    @Inject(CustomerAuthUsecasesProxyModule.REGISTER_CUSTOMER_PROXY)
    private readonly registerCustomerUseCase: RegisterCustomerUseCase,
    @Inject(CustomerAuthUsecasesProxyModule.LOGIN_CUSTOMER_PROXY)
    private readonly loginCustomerUseCase: LoginCustomerUseCase,
  ) {}

  @Mutation(() => CustomerAuthPayload)
  registerCustomer(@Args('input') input: RegisterCustomerInput): Promise<CustomerAuthResponse> {
    return this.registerCustomerUseCase.execute(input);
  }

  @Mutation(() => CustomerAuthPayload)
  customerLogin(@Args('input') input: CustomerLoginInput): Promise<CustomerAuthResponse> {
    return this.loginCustomerUseCase.execute(input);
  }
}
