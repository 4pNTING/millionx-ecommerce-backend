import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { UpdateCatalogCategoryRequest } from '../../../../domain/models/category.model';
import { CategoryEntity } from '../../../entities/category.entity';
import { categorySubtreeQuery } from '../category-subtree.query';

export class UpdateCatalogCategoryValidation {
  constructor(private readonly repository: Repository<CategoryEntity>) {}

  async execute(input: UpdateCatalogCategoryRequest): Promise<CategoryEntity> {
    const category = await this.repository.findOne({ where: { _id: input._id } });
    if (!category) throw new NotFoundException('Category not found');
    if (input.parentId === input._id) {
      throw new BadRequestException('parentId cannot equal category _id');
    }
    if (input.parentId) {
      const parent = await this.repository.findOne({ where: { _id: input.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
      const descendant = await this.repository
        .createQueryBuilder()
        .addCommonTableExpression(categorySubtreeQuery(this.repository), 'category_subtree', {
          recursive: true,
        })
        .select('candidate._id', '_id')
        .from('category_subtree', 'candidate')
        .where('candidate._id = :newParentId', { newParentId: input.parentId })
        .setParameter('subtreeRootId', input._id)
        .getRawOne();
      if (descendant) {
        throw new BadRequestException('parentId cannot be a descendant of this category');
      }
    }
    if (input.slug) {
      const duplicate = await this.repository.findOne({
        where: { slug: input.slug, _id: Not(input._id) },
      });
      if (duplicate) throw new ConflictException('Category slug already exists');
    }
    return category;
  }
}
