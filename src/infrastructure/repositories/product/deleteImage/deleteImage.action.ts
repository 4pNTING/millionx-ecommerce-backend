import { QueryRunner } from 'typeorm';
import { ProductImageEntity } from '../../../entities/product-image.entity';

export class DeleteCatalogProductImageAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(image: ProductImageEntity): Promise<string> {
    await this.session.manager.getRepository(ProductImageEntity).remove(image);
    return image.productId;
  }
}
