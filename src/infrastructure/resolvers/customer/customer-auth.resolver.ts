import { Inject } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { CustomerAuthResponse } from '../../../domain/models/customer-auth.model';
import { LoginCustomerUseCase } from '../../../usecases/customer/loginCustomer.usecase';
import { RegisterCustomerUseCase } from '../../../usecases/customer/registerCustomer.usecase';
import { RefreshCustomerTokenUseCase } from '../../../usecases/customer/refreshCustomerToken.usecase';
import { SocialLoginCustomerUseCase } from '../../../usecases/customer/socialLoginCustomer.usecase';
import { RefreshTokenDto } from '../auth/auth.model';
import { CustomerAuthUsecasesProxyModule } from '../../usecases-proxy/customer-auth-usecases-proxy.module';
import { AuthRateLimitService } from '../../common/auth-rate-limit.service';
import {
  RegisterCustomerDto,
  CustomerLoginDto,
  SocialLoginCustomerDto,
  CustomerAuthPayload,
} from './customer-auth.model';

interface GraphqlRequestContext {
  req?: {
    ip?: string;
    socket?: { remoteAddress?: string };
  };
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
    @Inject(CustomerAuthUsecasesProxyModule.SOCIAL_LOGIN_CUSTOMER_PROXY)
    private readonly socialLoginCustomerUseCase: SocialLoginCustomerUseCase,
    private readonly authRateLimitService: AuthRateLimitService,
  ) {}

  @Mutation(() => CustomerAuthPayload)
  async registerCustomer(
    @Args('input') input: RegisterCustomerDto,
    @Context() context: GraphqlRequestContext,
  ): Promise<CustomerAuthResponse> {
    const identifier = input.email || input.phone || 'missing';
    const ip = this.authRateLimitService.clientIp(context.req);
    await this.authRateLimitService.consume('customer-register', ip, identifier);
    return this.registerCustomerUseCase.execute(input);
  }

  @Mutation(() => CustomerAuthPayload)
  async loginCustomer(
    @Args('input') input: CustomerLoginDto,
    @Context() context: GraphqlRequestContext,
  ): Promise<CustomerAuthResponse> {
    const ip = this.authRateLimitService.clientIp(context.req);
    await this.authRateLimitService.consume('customer-login', ip, input.identifier);

    const result = await this.loginCustomerUseCase.execute(input);
    await this.authRateLimitService.resetIdentity('customer-login', input.identifier);
    return result;
  }

  @Mutation(() => CustomerAuthPayload)
  async socialLoginCustomer(
    @Args('input') input: SocialLoginCustomerDto,
    @Context() context: GraphqlRequestContext,
  ): Promise<CustomerAuthResponse> {
    const ip = this.authRateLimitService.clientIp(context.req);
    await this.authRateLimitService.consume('customer-login', ip, input.provider);
    const result = await this.socialLoginCustomerUseCase.execute(input);
    await this.authRateLimitService.resetIdentity('customer-login', input.provider);
    return result;
  }

  @Mutation(() => CustomerAuthPayload)
  refreshCustomerToken(@Args('input') input: RefreshTokenDto): Promise<CustomerAuthResponse> {
    return this.refreshCustomerTokenUseCase.execute(input.refreshToken);
  }
}
