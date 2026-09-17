import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UpdateCatalogProductImageRequest } from '../../../../domain/models/product-image.model';
import { ProductImageEntity } from '../../../entities/product-image.entity';
import { ProductVariantEntity } from '../../../entities/product-variant.entity';

export class UpdateCatalogProductImageValidation {
  constructor(
    private readonly imageRepository: Repository<ProductImageEntity>,
    private readonly variantRepository: Repository<ProductVariantEntity>,
  ) {}

  async execute(input: UpdateCatalogProductImageRequest): Promise<ProductImageEntity> {
    const image = await this.imageRepository.findOne({ where: { id: input.id } });
    if (!image) throw new NotFoundException('Product image not found');

    const mutableFields: (keyof UpdateCatalogProductImageRequest)[] = [
      'variantId',
      'url',
      'altText',
      'sortOrder',
    ];
    if (!mutableFields.some((field) => Object.prototype.hasOwnProperty.call(input, field))) {
      throw new BadRequestException('Provide at least one product image field to update');
    }

    if (input.url !== undefined && !input.url.trim()) {
      throw new BadRequestException('Product image URL cannot be empty');
    }

    if (input.variantId) {
      const variant = await this.variantRepository.findOne({ where: { id: input.variantId } });
      if (!variant || variant.productId !== image.productId) {
        throw new BadRequestException('variantId does not belong to product image productId');
      }
    }

    return image;
  }
}
