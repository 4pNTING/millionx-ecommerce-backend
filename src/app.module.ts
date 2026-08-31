import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnvironment } from './config/env.validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';

// Core infrastructure
import { RedisModule } from './infrastructure/cache/redis.module';
import { DateScalar } from './infrastructure/common/graphql/date.scalar';
import { JwtStrategy } from './infrastructure/common/jwt.strategy';
import { CatalogWriteGuard } from './infrastructure/common/catalog-write.guard';
import { CustomerAccountGuard } from './infrastructure/common/customer-account.guard';
import { RepositoriesModule } from './infrastructure/repositories/repositories.module';

// Use-case modules
import { AuthUsecasesProxyModule } from './infrastructure/usecases-proxy/auth-usecases-proxy.module';
import { ZoneUsecasesProxyModule } from './infrastructure/usecases-proxy/zone-usecases-proxy.module';
import { CategoryUsecasesProxyModule } from './infrastructure/usecases-proxy/category-usecases-proxy.module';
import { ProductUsecasesProxyModule } from './infrastructure/usecases-proxy/product-usecases-proxy.module';
import { CustomerUsecasesProxyModule } from './infrastructure/usecases-proxy/customer-usecases-proxy.module';
import { CustomerAuthUsecasesProxyModule } from './infrastructure/usecases-proxy/customer-auth-usecases-proxy.module';

// Controllers
import { AuthController } from './infrastructure/controllers/auth/auth.controller';
import { ZoneController } from './infrastructure/controllers/zone/zone.controller';

// Resolvers
import { AuthResolver } from './infrastructure/resolvers/auth/auth.resolver';
import { ZoneResolver } from './infrastructure/resolvers/zone/zone.resolver';
import { CategoryResolver } from './infrastructure/resolvers/category/category.resolver';
import { ProductResolver } from './infrastructure/resolvers/product/product.resolver';
import { CustomerResolver } from './infrastructure/resolvers/customer/customer.resolver';
import { CustomerAuthResolver } from './infrastructure/resolvers/customer/customer-auth.resolver';

// Entities
import { UserEntity } from './infrastructure/entities/user.entity';
import { ZoneEntity } from './infrastructure/entities/zone.entity';
import { AddressEntity } from './infrastructure/entities/address.entity';
import { CategoryEntity } from './infrastructure/entities/category.entity';
import { CustomerEntity } from './infrastructure/entities/customer.entity';
import { ProductEntity } from './infrastructure/entities/product.entity';
import { ProductImageEntity } from './infrastructure/entities/product-image.entity';
import { ProductPriceEntity } from './infrastructure/entities/product-price.entity';
import { ProductVariantEntity } from './infrastructure/entities/product-variant.entity';
import { CustomerAccountEntity } from './infrastructure/entities/customer-account.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
      envFilePath:
        process.env.ENV_FILE ||
        (process.env.NODE_ENV ? [`.env.${process.env.NODE_ENV}`, '.env'] : '.env'),
    }),
    RedisModule,

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      context: ({ req }) => ({ req }),
      sortSchema: false,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
      path: '/api-gateway',
      formatError: (error) => ({ message: error.message }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST') || 'localhost',
        port: config.get<number>('DB_PORT') || 5435,
        username: config.get<string>('DB_USER') || 'postgres',
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME') || 'millionx_ecommerce',
        extra: {
          options: '-c search_path=ecommerce,public',
        },
        entities: [
          // Staff and zone
          UserEntity,
          ZoneEntity,
          // Catalog
          CategoryEntity,
          ProductEntity,
          ProductVariantEntity,
          ProductPriceEntity,
          ProductImageEntity,
          // Customer
          CustomerEntity,
          CustomerAccountEntity,
          AddressEntity,
        ],
        autoLoadEntities: true,
        synchronize: false,
        logging: config.get<string>('DB_LOGGING') === 'true',
      }),
    }),

    RepositoriesModule,
    AuthUsecasesProxyModule.register(),
    ZoneUsecasesProxyModule.register(),
    CategoryUsecasesProxyModule.register(),
    ProductUsecasesProxyModule.register(),
    CustomerUsecasesProxyModule.register(),
    CustomerAuthUsecasesProxyModule.register(),
  ],
  controllers: [AuthController, ZoneController],
  providers: [
    DateScalar,
    AuthResolver,
    ZoneResolver,
    CategoryResolver,
    ProductResolver,
    CustomerResolver,
    CustomerAuthResolver,
    JwtStrategy,
    CatalogWriteGuard,
    CustomerAccountGuard,
  ],
})
export class AppModule {}
