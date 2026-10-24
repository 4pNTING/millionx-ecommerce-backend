import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../../entities/product.entity';

export class LoadCatalogProductValidation {
  constructor(private readonly repository: Repository<ProductEntity>) {}

  async execute(_id?: string, slug?: string, currency?: string) {
    if (!_id && !slug) throw new BadRequestException('Provide product id or slug');
    const product = await this.repository.findOne({
      where: _id ? { _id, isActive: true } : { slug, isActive: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return { product, currency: currency?.trim().toUpperCase() };
  }
}
