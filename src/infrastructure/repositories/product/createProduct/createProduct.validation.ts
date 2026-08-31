import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateCatalogProductRequest } from '../../../../domain/models/product.model';
import { CategoryEntity } from '../../../entities/category.entity';
import { ProductEntity } from '../../../entities/product.entity';

export class CreateCatalogProductValidation {
  constructor(
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async execute(input: CreateCatalogProductRequest): Promise<void> {
    const category = await this.categoryRepository.findOne({ where: { id: input.categoryId } });
    if (!category) throw new NotFoundException('Category not found');
    const duplicate = await this.productRepository.findOne({ where: { slug: input.slug } });
    if (duplicate) throw new ConflictException('Product slug already exists');
  }
}
