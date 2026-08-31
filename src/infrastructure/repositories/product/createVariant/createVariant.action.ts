import { QueryRunner } from 'typeorm';
import { CreateCatalogVariantRequest } from '../../../../domain/models/product-variant.model';
import { ProductVariantEntity } from '../../../entities/product-variant.entity';

export class CreateCatalogVariantAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(
    input: CreateCatalogVariantRequest,
    attributes: Record<string, unknown>,
  ): Promise<ProductVariantEntity> {
    const repository = this.session.manager.getRepository(ProductVariantEntity);
    return repository.save(
      repository.create({
        productId: input.productId,
        sku: input.sku,
        barcode: input.barcode,
        name: input.name,
        attributes,
      }),
    );
  }
}
