import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateCatalogVariantRequest } from '../../../../domain/models/product-variant.model';
import { ProductEntity } from '../../../entities/product.entity';
import { ProductVariantEntity } from '../../../entities/product-variant.entity';

export class CreateCatalogVariantValidation {
  constructor(
    private readonly productRepository: Repository<ProductEntity>,
    private readonly variantRepository: Repository<ProductVariantEntity>,
  ) {}

  async execute(
    input: CreateCatalogVariantRequest,
  ): Promise<{ attributes: Record<string, unknown> }> {
    const product = await this.productRepository.findOne({ where: { id: input.productId } });
    if (!product) throw new NotFoundException('Product not found');
    const duplicate = await this.variantRepository.findOne({ where: { sku: input.sku } });
    if (duplicate) throw new ConflictException('Variant SKU already exists');
    return { attributes: this.parseAttributes(input.attributesJson) };
  }

  private parseAttributes(attributesJson?: string): Record<string, unknown> {
    if (!attributesJson) return {};
    try {
      const value = JSON.parse(attributesJson);
      if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
      return value;
    } catch {
      throw new BadRequestException('attributesJson must be a valid JSON object');
    }
  }
}
