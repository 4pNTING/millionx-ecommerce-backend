import { QueryRunner } from 'typeorm';
import { UpdateCatalogProductRequest } from '../../../../domain/models/product.model';
import { ProductEntity } from '../../../entities/product.entity';
import { ProductImageEntity } from '../../../entities/product-image.entity';
import { ProductPriceEntity } from '../../../entities/product-price.entity';
import { ProductVariantEntity } from '../../../entities/product-variant.entity';

export class UpdateCatalogProductAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(
    product: ProductEntity,
    input: UpdateCatalogProductRequest,
  ): Promise<ProductEntity> {
    const { variants = [], images = [], deleteImageIds = [], ...productInput } = input;
    Object.assign(product, productInput);
    const savedProduct = await this.session.manager.getRepository(ProductEntity).save(product);

    const variantRepository = this.session.manager.getRepository(ProductVariantEntity);
    const priceRepository = this.session.manager.getRepository(ProductPriceEntity);
    const imageRepository = this.session.manager.getRepository(ProductImageEntity);
    const variantIdsBySku = new Map<string, string>();

    for (const variantInput of variants) {
      const { prices = [], ...variantFields } = variantInput;
      const variant = variantInput.id
        ? await variantRepository.findOneOrFail({ where: { id: variantInput.id } })
        : variantRepository.create({ productId: product.id });

      variant.sku = variantFields.sku.trim();
      if (Object.prototype.hasOwnProperty.call(variantFields, 'barcode')) {
        variant.barcode = variantFields.barcode?.trim() || null;
      }
      if (Object.prototype.hasOwnProperty.call(variantFields, 'name')) {
        variant.name = variantFields.name?.trim() || null;
      }
      if (variantFields.attributesJson !== undefined) {
        variant.attributes = JSON.parse(variantFields.attributesJson || '{}');
      }
      if (variantFields.isActive !== undefined) variant.isActive = variantFields.isActive;
      const savedVariant = await variantRepository.save(variant);
      variantIdsBySku.set(savedVariant.sku, savedVariant.id);

      for (const priceInput of prices) {
        const price = priceInput.id
          ? await priceRepository.findOneOrFail({ where: { id: priceInput.id } })
          : priceRepository.create({ variantId: savedVariant.id });
        price.currency = priceInput.currency.trim().toUpperCase();
        price.amount = String(priceInput.amount);
        price.compareAtAmount =
          priceInput.compareAtAmount == null ? null : String(priceInput.compareAtAmount);
        price.startsAt = priceInput.startsAt ?? null;
        if (priceInput.isActive !== undefined) price.isActive = priceInput.isActive;
        await priceRepository.save(price);
      }
    }

    for (const imageInput of images) {
      const image = imageInput.id
        ? await imageRepository.findOneOrFail({ where: { id: imageInput.id } })
        : imageRepository.create({ productId: product.id });
      if (Object.prototype.hasOwnProperty.call(imageInput, 'variantId')) {
        image.variantId = imageInput.variantId ?? null;
      }
      if (imageInput.variantSku) {
        const variantSku = imageInput.variantSku.trim();
        let variantId = variantIdsBySku.get(variantSku);

        if (!variantId) {
          const variant = await variantRepository.findOneOrFail({
            where: { productId: product.id, sku: variantSku },
          });
          variantId = variant.id;
        }
        image.variantId = variantId;
      }
      if (imageInput.url !== undefined) image.url = imageInput.url.trim();
      if (Object.prototype.hasOwnProperty.call(imageInput, 'altText')) {
        image.altText = imageInput.altText?.trim() || null;
      }
      if (imageInput.sortOrder !== undefined) image.sortOrder = imageInput.sortOrder;
      await imageRepository.save(image);
    }

    if (deleteImageIds.length) {
      await imageRepository.delete(deleteImageIds);
    }

    return savedProduct;
  }
}
