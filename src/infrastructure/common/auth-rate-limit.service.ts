import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { RedisService } from '../cache/redis.service';

export type AuthRateLimitAction = 'staff-login' | 'customer-login' | 'customer-register';

interface RequestLike {
  ip?: string;
  socket?: { remoteAddress?: string };
}

interface RateLimitCounter {
  count: number;
  expiresAt: number;
}

interface RateLimitRule {
  maxAttempts: number;
  windowSeconds: number;
  label: string;
}

@Injectable()
export class AuthRateLimitService {
  private readonly memoryCounters = new Map<string, RateLimitCounter>();
  private readonly rules: Record<AuthRateLimitAction, RateLimitRule>;

  constructor(
    private readonly redisService: RedisService,
    config: ConfigService,
  ) {
    const loginRule = {
      maxAttempts: this.positiveInteger(config, 'AUTH_LOGIN_RATE_LIMIT_MAX', 5),
      windowSeconds: this.positiveInteger(config, 'AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS', 60),
    };

    this.rules = {
      'staff-login': { ...loginRule, label: 'staff login' },
      'customer-login': { ...loginRule, label: 'customer login' },
      'customer-register': {
        maxAttempts: this.positiveInteger(config, 'AUTH_REGISTER_RATE_LIMIT_MAX', 3),
        windowSeconds: this.positiveInteger(
          config,
          'AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS',
          3600,
        ),
        label: 'customer registration',
      },
    };
  }

  clientIp(request?: RequestLike): string {
    return request?.ip || request?.socket?.remoteAddress || 'unknown';
  }

  async consume(action: AuthRateLimitAction, ip: string, identifier: string): Promise<void> {
    const rule = this.rules[action];
    const keys = [
      this.key(action, 'ip', ip),
      this.key(action, 'identity', identifier || 'missing'),
    ];
    const counters = await Promise.all(keys.map((key) => this.increment(key, rule.windowSeconds)));
    const blocked = counters.find((counter) => counter.count > rule.maxAttempts);

    if (blocked) {
      const message =
        `Too many ${rule.label} attempts. ` + `Try again in ${blocked.ttlSeconds} seconds`;
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message,
          retryAfterSeconds: blocked.ttlSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async resetIdentity(action: AuthRateLimitAction, identifier: string): Promise<void> {
    const key = this.key(action, 'identity', identifier || 'missing');
    this.memoryCounters.delete(key);
    await this.redisService.del(key);
  }

  private async increment(
    key: string,
    windowSeconds: number,
  ): Promise<{ count: number; ttlSeconds: number }> {
    const redisCounter = await this.redisService.incrementWithTtl(key, windowSeconds);
    if (redisCounter) return redisCounter;
    return this.incrementMemory(key, windowSeconds);
  }

  private incrementMemory(
    key: string,
    windowSeconds: number,
  ): { count: number; ttlSeconds: number } {
    const now = Date.now();
    const current = this.memoryCounters.get(key);
    const counter =
      !current || current.expiresAt <= now
        ? { count: 1, expiresAt: now + windowSeconds * 1000 }
        : { ...current, count: current.count + 1 };

    this.memoryCounters.set(key, counter);
    this.cleanupMemory(now);

    return {
      count: counter.count,
      ttlSeconds: Math.max(1, Math.ceil((counter.expiresAt - now) / 1000)),
    };
  }

  private cleanupMemory(now: number): void {
    if (this.memoryCounters.size < 1000) return;

    for (const [key, counter] of this.memoryCounters) {
      if (counter.expiresAt <= now) this.memoryCounters.delete(key);
    }

    while (this.memoryCounters.size > 10_000) {
      const oldestKey = this.memoryCounters.keys().next().value as string | undefined;
      if (!oldestKey) break;
      this.memoryCounters.delete(oldestKey);
    }
  }

  private key(action: AuthRateLimitAction, dimension: 'ip' | 'identity', value: string): string {
    const digest = createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
    return `auth:rate-limit:${action}:${dimension}:${digest}`;
  }

  private positiveInteger(config: ConfigService, key: string, fallback: number): number {
    const value = Number(config.get<string | number>(key) ?? fallback);
    return Number.isInteger(value) && value > 0 ? value : fallback;
  }
}
