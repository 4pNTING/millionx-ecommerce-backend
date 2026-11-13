import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Staff and zone
import { UserEntity } from '../entities/user.entity';
import { ZoneEntity } from '../entities/zone.entity';
import { DatabaseUserRepository } from './user/user.repository';
import { DatabaseZoneRepository } from './zone/zone.repository';

// Catalog
import { CategoryEntity } from '../entities/category.entity';
import { ProductEntity } from '../entities/product.entity';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { ProductPriceEntity } from '../entities/product-price.entity';
import { ProductImageEntity } from '../entities/product-image.entity';
import { DatabaseCategoryRepository } from './category/category.repository';
import { DatabaseProductRepository } from './product/product.repository';

// Customer
import { CustomerEntity } from '../entities/customer.entity';
import { CustomerAccountEntity } from '../entities/customer-account.entity';
import { CustomerSocialAccountEntity } from '../entities/customer-social-account.entity';
import { AddressEntity } from '../entities/address.entity';
import { DatabaseCustomerRepository } from './customer/customer.repository';
import { DatabaseCustomerAuthRepository } from './customer/customer-auth.repository';

// Shopping (Phase 2)
import { CartEntity } from '../entities/cart.entity';
import { CartItemEntity } from '../entities/cart-item.entity';
import { CheckoutSessionEntity } from '../entities/checkout-session.entity';
import { WishlistEntity } from '../entities/wishlist.entity';
import { WishlistItemEntity } from '../entities/wishlist-item.entity';
import { DatabaseCartRepository } from './cart/cart.repository';
import { DatabaseCheckoutRepository } from './checkout/checkout.repository';
import { DatabaseWishlistRepository } from './wishlist/wishlist.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
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
      CustomerSocialAccountEntity,
      AddressEntity,
      // Shopping (Phase 2)
      CartEntity,
      CartItemEntity,
      CheckoutSessionEntity,
      WishlistEntity,
      WishlistItemEntity,
    ]),
  ],
  providers: [
    // Staff and zone
    DatabaseUserRepository,
    DatabaseZoneRepository,
    // Catalog
    DatabaseCategoryRepository,
    DatabaseProductRepository,
    // Customer
    DatabaseCustomerRepository,
    DatabaseCustomerAuthRepository,
    // Shopping (Phase 2)
    DatabaseCartRepository,
    DatabaseCheckoutRepository,
    DatabaseWishlistRepository,
  ],
  exports: [
    // Staff and zone
    DatabaseUserRepository,
    DatabaseZoneRepository,
    // Catalog
    DatabaseCategoryRepository,
    DatabaseProductRepository,
    // Customer
    DatabaseCustomerRepository,
    DatabaseCustomerAuthRepository,
    // Shopping (Phase 2)
    DatabaseCartRepository,
    DatabaseCheckoutRepository,
    DatabaseWishlistRepository,
  ],
})
export class RepositoriesModule {}
