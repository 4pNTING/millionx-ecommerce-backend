import { Controller, Inject, Post, Body, HttpException, HttpStatus, Req } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthUsecasesProxyModule } from '../../usecases-proxy/auth-usecases-proxy.module';
import { LoginUseCase } from '../../../usecases/auth/login.usecase';
import { LoginRequest, LoginResponse } from '../../../domain/models/user.model';
import { AuthRateLimitService } from '../../common/auth-rate-limit.service';

interface HttpRequestLike {
  ip?: string;
  socket?: { remoteAddress?: string };
}

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthUsecasesProxyModule.LOGIN_PROXY)
    private readonly loginUseCase: LoginUseCase,
    private readonly authRateLimitService: AuthRateLimitService,
  ) {}

  @GrpcMethod('AuthService', 'Login')
  async login(data: LoginRequest): Promise<any> {
    try {
      const result = await this.loginUseCase.execute(data);
      return {
        _id: result._id,
        role: result.role,
        is_active: result.isActive,
        username: result.username,
        token: result.token,
        created_at: result.createdAt,
        updated_at: result.updatedAt,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post('login')
  async loginRest(@Body() data: LoginRequest, @Req() request: HttpRequestLike): Promise<any> {
    try {
      const ip = this.authRateLimitService.clientIp(request);
      await this.authRateLimitService.consume('staff-login', ip, data.username);

      const result = await this.loginUseCase.execute(data);
      await this.authRateLimitService.resetIdentity('staff-login', data.username);
      return {
        user: {
          _id: result._id,
          username: result.username,
          role: result.role,
          isActive: result.isActive,
          token: result.token,
          refreshToken: result.refreshToken,
        },
      };
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
