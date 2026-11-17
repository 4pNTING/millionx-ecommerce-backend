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
    const variant = await repository.save(
      repository.create({
        productId: input.productId,
        sku: input.sku,
        barcode: input.barcode,
        name: input.name,
        attributes,
      }),
    );

    // Ensure initial inventory is seeded for the newly created variant
    await this.session.manager.query(
      `INSERT INTO ecommerce.inventory (_id, "variantId", "onHand", reserved, available, "updatedAt")
       VALUES (gen_random_uuid(), $1, 100, 0, 100, now())
       ON CONFLICT ("variantId") DO NOTHING`,
      [variant._id],
    );

    return variant;
  }
}
