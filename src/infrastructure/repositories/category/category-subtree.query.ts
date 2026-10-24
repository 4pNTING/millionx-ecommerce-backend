import { Repository } from 'typeorm';
import { CategoryEntity } from '../../entities/category.entity';

/** IDs only + UNION (not UNION ALL) makes traversal terminate even for legacy cycles. */
export function categorySubtreeQuery(repository: Repository<CategoryEntity>): string {
  const root = repository
    .createQueryBuilder('category_root')
    .select('category_root._id', '_id')
    .where('category_root._id = :subtreeRootId');
  const children = repository
    .createQueryBuilder('category_child')
    .select('category_child._id', '_id')
    .innerJoin('category_subtree', 'subtree_parent', 'category_child.parentId = subtree_parent._id');

  // Entity query builders preserve the configured schema/table naming and quote parentId.
  return `${root.getQuery()} UNION ${children.getQuery()}`;
}
