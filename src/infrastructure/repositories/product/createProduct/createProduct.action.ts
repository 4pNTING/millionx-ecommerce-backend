import { QueryRunner } from 'typeorm';
import { CreateCatalogProductRequest } from '../../../../domain/models/product.model';
import { ProductEntity } from '../../../entities/product.entity';

export class CreateCatalogProductAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(input: CreateCatalogProductRequest): Promise<ProductEntity> {
    const repository = this.session.manager.getRepository(ProductEntity);
    return repository.save(repository.create(input));
  }
}
