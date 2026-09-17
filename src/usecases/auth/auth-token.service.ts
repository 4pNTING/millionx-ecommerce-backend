import { UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';

export type AuthActorType = 'staff' | 'customer';

export interface AuthTokenIdentity {
  id: string;
  actorType: AuthActorType;
  role: string;
  username?: string;
  customerId?: string;
}

export interface VerifiedRefreshToken extends AuthTokenIdentity {
  tokenType: 'refresh';
}

export interface AuthTokenPair {
  token: string;
  refreshToken: string;
}

export class AuthTokenService {
  constructor(
    private readonly accessSecret: string,
    private readonly accessExpiration: string,
    private readonly refreshSecret: string,
    private readonly refreshExpiration: string,
  ) {}

  issue(identity: AuthTokenIdentity): AuthTokenPair {
    return {
      token: jwt.sign({ ...identity, tokenType: 'access' }, this.accessSecret, {
        algorithm: 'HS256',
        expiresIn: this.accessExpiration as jwt.SignOptions['expiresIn'],
        jwtid: randomUUID(),
      }),
      refreshToken: jwt.sign({ ...identity, tokenType: 'refresh' }, this.refreshSecret, {
        algorithm: 'HS256',
        expiresIn: this.refreshExpiration as jwt.SignOptions['expiresIn'],
        jwtid: randomUUID(),
      }),
    };
  }

  verifyRefreshToken(token: string, expectedActorType: AuthActorType): VerifiedRefreshToken {
    if (!token?.trim()) throw new UnauthorizedException('Refresh token is required');

    try {
      const payload = jwt.verify(token, this.refreshSecret, {
        algorithms: ['HS256'],
      });

      if (
        typeof payload === 'string' ||
        payload.tokenType !== 'refresh' ||
        payload.actorType !== expectedActorType ||
        typeof payload.id !== 'string' ||
        typeof payload.role !== 'string'
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      return payload as VerifiedRefreshToken;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
