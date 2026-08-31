import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AddCatalogProductImageRequest } from '../../../../domain/models/product-image.model';
import { ProductEntity } from '../../../entities/product.entity';
import { ProductVariantEntity } from '../../../entities/product-variant.entity';

export class AddCatalogProductImageValidation {
  constructor(
    private readonly productRepository: Repository<ProductEntity>,
    private readonly variantRepository: Repository<ProductVariantEntity>,
  ) {}

  async execute(input: AddCatalogProductImageRequest): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id: input.productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (!input.variantId) return;
    const variant = await this.variantRepository.findOne({ where: { id: input.variantId } });
    if (!variant || variant.productId !== input.productId) {
      throw new BadRequestException('variantId does not belong to productId');
    }
  }
}
