import { Inject } from '@nestjs/common';
import { Args, Context, Field, InputType, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
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
import { RefreshCustomerTokenUseCase } from '../../../usecases/customer/refreshCustomerToken.usecase';
import { RefreshTokenInput } from '../auth/auth.model';
import { CustomerAuthUsecasesProxyModule } from '../../usecases-proxy/customer-auth-usecases-proxy.module';
import { AuthRateLimitService } from '../../common/auth-rate-limit.service';

interface GraphqlRequestContext {
  req?: {
    ip?: string;
    socket?: { remoteAddress?: string };
  };
}

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
    @Inject(CustomerAuthUsecasesProxyModule.REFRESH_CUSTOMER_TOKEN_PROXY)
    private readonly refreshCustomerTokenUseCase: RefreshCustomerTokenUseCase,
    private readonly authRateLimitService: AuthRateLimitService,
  ) {}

  @Mutation(() => CustomerAuthPayload)
  async registerCustomer(
    @Args('input') input: RegisterCustomerInput,
    @Context() context: GraphqlRequestContext,
  ): Promise<CustomerAuthResponse> {
    const identifier = input.email || input.phone || 'missing';
    const ip = this.authRateLimitService.clientIp(context.req);
    await this.authRateLimitService.consume('customer-register', ip, identifier);
    return this.registerCustomerUseCase.execute(input);
  }

  @Mutation(() => CustomerAuthPayload)
  async loginCustomer(
    @Args('input') input: CustomerLoginInput,
    @Context() context: GraphqlRequestContext,
  ): Promise<CustomerAuthResponse> {
    const ip = this.authRateLimitService.clientIp(context.req);
    await this.authRateLimitService.consume('customer-login', ip, input.identifier);

    const result = await this.loginCustomerUseCase.execute(input);
    await this.authRateLimitService.resetIdentity('customer-login', input.identifier);
    return result;
  }

  @Mutation(() => CustomerAuthPayload)
  refreshCustomerToken(@Args('input') input: RefreshTokenInput): Promise<CustomerAuthResponse> {
    return this.refreshCustomerTokenUseCase.execute(input.refreshToken);
  }
}
