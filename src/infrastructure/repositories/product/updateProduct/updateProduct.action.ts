import { QueryRunner } from 'typeorm';
import { UpdateCatalogProductRequest } from '../../../../domain/models/product.model';
import { ProductEntity } from '../../../entities/product.entity';

export class UpdateCatalogProductAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(
    product: ProductEntity,
    input: UpdateCatalogProductRequest,
  ): Promise<ProductEntity> {
    Object.assign(product, input);
    return this.session.manager.getRepository(ProductEntity).save(product);
  }
}
