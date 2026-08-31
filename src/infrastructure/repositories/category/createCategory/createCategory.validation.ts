import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateCatalogCategoryRequest } from '../../../../domain/models/category.model';
import { CategoryEntity } from '../../../entities/category.entity';

export class CreateCatalogCategoryValidation {
  constructor(private readonly repository: Repository<CategoryEntity>) {}

  async execute(input: CreateCatalogCategoryRequest): Promise<void> {
    if (input.parentId) {
      const parent = await this.repository.findOne({ where: { id: input.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }
    const duplicate = await this.repository.findOne({ where: { slug: input.slug } });
    if (duplicate) throw new ConflictException('Category slug already exists');
  }
}
