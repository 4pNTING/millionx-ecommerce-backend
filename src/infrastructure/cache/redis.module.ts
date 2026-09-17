import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { AuthRateLimitService } from '../common/auth-rate-limit.service';

/**
 * RedisModule — Global module ที่ provide RedisService ให้ทุก module ใช้ได้ทันที
 * ไม่ต้อง import ซ้ำใน repositories.module.ts หรือ module อื่นๆ
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, AuthRateLimitService],
  exports: [RedisService, AuthRateLimitService],
})
export class RedisModule {}
