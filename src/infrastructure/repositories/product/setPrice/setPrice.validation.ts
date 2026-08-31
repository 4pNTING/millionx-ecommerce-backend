import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SetCatalogProductPriceRequest } from '../../../../domain/models/product-price.model';
import { ProductVariantEntity } from '../../../entities/product-variant.entity';

export interface ValidatedCatalogPrice {
  variant: ProductVariantEntity;
  currency: string;
}

export class SetCatalogProductPriceValidation {
  constructor(private readonly repository: Repository<ProductVariantEntity>) {}

  async execute(input: SetCatalogProductPriceRequest): Promise<ValidatedCatalogPrice> {
    if (input.compareAtAmount != null && input.compareAtAmount < input.amount) {
      throw new BadRequestException('compareAtAmount must be greater than or equal to amount');
    }
    const variant = await this.repository.findOne({ where: { id: input.variantId } });
    if (!variant) throw new NotFoundException('Product variant not found');
    return { variant, currency: input.currency.trim().toUpperCase() };
  }
}
