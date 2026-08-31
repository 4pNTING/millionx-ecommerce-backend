import { QueryRunner } from 'typeorm';
import { AddCatalogProductImageRequest } from '../../../../domain/models/product-image.model';
import { ProductImageEntity } from '../../../entities/product-image.entity';

export class AddCatalogProductImageAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(input: AddCatalogProductImageRequest): Promise<string> {
    const repository = this.session.manager.getRepository(ProductImageEntity);
    await repository.save(repository.create(input));
    return input.productId;
  }
}
