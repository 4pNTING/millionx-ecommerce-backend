import { In, Repository } from 'typeorm';
import { CatalogProductModel } from '../../../domain/models/product.model';
import { CatalogVariantModel } from '../../../domain/models/product-variant.model';
import { ProductEntity } from '../../entities/product.entity';
import { ProductImageEntity } from '../../entities/product-image.entity';
import { ProductPriceEntity } from '../../entities/product-price.entity';
import { ProductVariantEntity } from '../../entities/product-variant.entity';

export class CatalogProductMapper {
  constructor(
    private readonly variantRepository: Repository<ProductVariantEntity>,
    private readonly priceRepository: Repository<ProductPriceEntity>,
    private readonly imageRepository: Repository<ProductImageEntity>,
  ) {}

  async hydrateProducts(
    products: ProductEntity[],
    currency?: string,
  ): Promise<CatalogProductModel[]> {
    if (!products.length) return [];
    const productIds = products.map((product) => product.id);
    const variants = await this.variantRepository.find({
      where: { productId: In(productIds), isActive: true },
      order: { createdAt: 'ASC' },
    });
    const variantIds = variants.map((variant) => variant.id);
    const prices = variantIds.length
      ? await this.priceRepository
          .createQueryBuilder('price')
          .where('price.variantId IN (:...variantIds)', { variantIds })
          .andWhere('price.isActive = true')
          .andWhere('(price.startsAt IS NULL OR price.startsAt <= NOW())')
          .andWhere('(price.endsAt IS NULL OR price.endsAt > NOW())')
          .andWhere(currency ? 'price.currency = :currency' : '1=1', { currency })
          .orderBy('price.currency', 'ASC')
          .getMany()
      : [];
    const images = await this.imageRepository.find({
      where: { productId: In(productIds) },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return products.map((product) => ({
      ...product,
      variants: variants
        .filter((variant) => variant.productId === product.id)
        .map((variant) =>
          this.mapVariant(
            variant,
            prices.filter((price) => price.variantId === variant.id),
          ),
        ),
      images: images.filter((image) => image.productId === product.id),
    }));
  }

  mapVariant(variant: ProductVariantEntity, prices: ProductPriceEntity[]): CatalogVariantModel {
    return {
      ...variant,
      attributesJson: JSON.stringify(variant.attributes ?? {}),
      prices: prices.map((price) => ({
        ...price,
        amount: Number(price.amount),
        compareAtAmount: price.compareAtAmount == null ? undefined : Number(price.compareAtAmount),
      })),
    };
  }
}
