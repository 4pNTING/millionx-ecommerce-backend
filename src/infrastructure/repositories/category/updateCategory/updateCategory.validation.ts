import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { UpdateCatalogCategoryRequest } from '../../../../domain/models/category.model';
import { CategoryEntity } from '../../../entities/category.entity';

export class UpdateCatalogCategoryValidation {
  constructor(private readonly repository: Repository<CategoryEntity>) {}

  async execute(input: UpdateCatalogCategoryRequest): Promise<CategoryEntity> {
    const category = await this.repository.findOne({ where: { id: input.id } });
    if (!category) throw new NotFoundException('Category not found');
    if (input.parentId === input.id) {
      throw new BadRequestException('parentId cannot equal category id');
    }
    if (input.parentId) {
      const parent = await this.repository.findOne({ where: { id: input.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }
    if (input.slug) {
      const duplicate = await this.repository.findOne({
        where: { slug: input.slug, id: Not(input.id) },
      });
      if (duplicate) throw new ConflictException('Category slug already exists');
    }
    return category;
  }
}
