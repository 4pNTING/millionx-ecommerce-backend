import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }
  async validate(payload: any) {
    if (payload?.tokenType !== 'access') {
      throw new UnauthorizedException('Access token is required');
    }

    return {
      userId: payload.id,
      customerId: payload.customerId,
      username: payload.username,
      role: payload.role,
      actorType: payload.actorType || 'staff',
    };
  }
}
