import { ConflictException, NotFoundException } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { UpdateCatalogProductRequest } from '../../../../domain/models/product.model';
import { CategoryEntity } from '../../../entities/category.entity';
import { ProductEntity } from '../../../entities/product.entity';

export class UpdateCatalogProductValidation {
  constructor(
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async execute(input: UpdateCatalogProductRequest): Promise<ProductEntity> {
    const product = await this.productRepository.findOne({ where: { id: input.id } });
    if (!product) throw new NotFoundException('Product not found');
    if (input.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: input.categoryId } });
      if (!category) throw new NotFoundException('Category not found');
    }
    if (input.slug) {
      const duplicate = await this.productRepository.findOne({
        where: { slug: input.slug, id: Not(input.id) },
      });
      if (duplicate) throw new ConflictException('Product slug already exists');
    }
    return product;
  }
}
