import { QueryRunner } from 'typeorm';
import { UpdateCatalogProductImageRequest } from '../../../../domain/models/product-image.model';
import { ProductImageEntity } from '../../../entities/product-image.entity';

export class UpdateCatalogProductImageAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(
    image: ProductImageEntity,
    input: UpdateCatalogProductImageRequest,
  ): Promise<string> {
    if (Object.prototype.hasOwnProperty.call(input, 'variantId')) {
      image.variantId = input.variantId ?? null;
    }
    if (input.url !== undefined) image.url = input.url.trim();
    if (Object.prototype.hasOwnProperty.call(input, 'altText')) {
      image.altText = input.altText?.trim() || null;
    }
    if (input.sortOrder !== undefined) image.sortOrder = input.sortOrder;

    await this.session.manager.getRepository(ProductImageEntity).save(image);
    return image.productId;
  }
}
