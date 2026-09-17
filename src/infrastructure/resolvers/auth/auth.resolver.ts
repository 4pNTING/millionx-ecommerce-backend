import { Inject } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { AuthUsecasesProxyModule } from '../../usecases-proxy/auth-usecases-proxy.module';
import { LoginUseCase } from '../../../usecases/auth/login.usecase';
import { RefreshStaffTokenUseCase } from '../../../usecases/auth/refreshStaffToken.usecase';
import { LoginResponse } from '../../../domain/models/user.model';
import { LoginInput, LoginPayload, RefreshTokenInput } from './auth.model';
import { AuthRateLimitService } from '../../common/auth-rate-limit.service';

interface GraphqlRequestContext {
  req?: {
    ip?: string;
    socket?: { remoteAddress?: string };
  };
}

@Resolver()
export class AuthResolver {
  constructor(
    @Inject(AuthUsecasesProxyModule.LOGIN_PROXY)
    private readonly loginUseCase: LoginUseCase,
    @Inject(AuthUsecasesProxyModule.REFRESH_STAFF_TOKEN_PROXY)
    private readonly refreshStaffTokenUseCase: RefreshStaffTokenUseCase,
    private readonly authRateLimitService: AuthRateLimitService,
  ) {}

  @Mutation(() => LoginPayload)
  async login(
    @Args('input') input: LoginInput,
    @Context() context: GraphqlRequestContext,
  ): Promise<LoginResponse> {
    const ip = this.authRateLimitService.clientIp(context.req);
    await this.authRateLimitService.consume('staff-login', ip, input.username);

    const result = await this.loginUseCase.execute(input);
    await this.authRateLimitService.resetIdentity('staff-login', input.username);
    return result;
  }

  @Mutation(() => LoginPayload)
  refreshStaffToken(@Args('input') input: RefreshTokenInput): Promise<LoginResponse> {
    return this.refreshStaffTokenUseCase.execute(input.refreshToken);
  }
}
