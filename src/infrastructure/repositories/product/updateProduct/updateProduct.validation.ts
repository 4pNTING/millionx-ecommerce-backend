import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { UpdateCatalogProductRequest } from '../../../../domain/models/product.model';
import { CategoryEntity } from '../../../entities/category.entity';
import { ProductEntity } from '../../../entities/product.entity';
import { ProductImageEntity } from '../../../entities/product-image.entity';
import { ProductPriceEntity } from '../../../entities/product-price.entity';
import { ProductVariantEntity } from '../../../entities/product-variant.entity';

export class UpdateCatalogProductValidation {
  constructor(
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly productRepository: Repository<ProductEntity>,
    private readonly variantRepository: Repository<ProductVariantEntity>,
    private readonly priceRepository: Repository<ProductPriceEntity>,
    private readonly imageRepository: Repository<ProductImageEntity>,
  ) {}

  async execute(input: UpdateCatalogProductRequest): Promise<ProductEntity> {
    const product = await this.productRepository.findOne({ where: { id: input.id } });
    if (!product) throw new NotFoundException('Product not found');
    if (input.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: input.categoryId } });
      if (!category) throw new NotFoundException('Category not found');
    }
    if (input.slug) {
      const duplicate = await this.productRepository.findOne({
        where: { slug: input.slug, id: Not(input.id) },
      });
      if (duplicate) throw new ConflictException('Product slug already exists');
    }

    const payloadSkus = new Set<string>();
    for (const variantInput of input.variants ?? []) {
      const sku = variantInput.sku.trim();
      if (!sku) throw new BadRequestException('Variant SKU cannot be empty');
      if (payloadSkus.has(sku)) {
        throw new BadRequestException(`Duplicate variant SKU in update: ${sku}`);
      }
      payloadSkus.add(sku);

      let variant: ProductVariantEntity | null = null;
      if (variantInput.id) {
        variant = await this.variantRepository.findOne({ where: { id: variantInput.id } });
        if (!variant || variant.productId !== product.id) {
          throw new BadRequestException('Variant does not belong to product');
        }
      }

      const duplicateSku = await this.variantRepository.findOne({
        where: variantInput.id ? { sku, id: Not(variantInput.id) } : { sku },
      });
      if (duplicateSku) throw new ConflictException(`Variant SKU already exists: ${sku}`);

      if (variantInput.attributesJson !== undefined) {
        this.parseAttributes(variantInput.attributesJson);
      }

      const payloadCurrencies = new Set<string>();
      for (const priceInput of variantInput.prices ?? []) {
        const currency = priceInput.currency.trim().toUpperCase();
        if (payloadCurrencies.has(currency)) {
          throw new BadRequestException(`Duplicate price currency for SKU ${sku}: ${currency}`);
        }
        payloadCurrencies.add(currency);
        if (priceInput.compareAtAmount != null && priceInput.compareAtAmount < priceInput.amount) {
          throw new BadRequestException('compareAtAmount must be greater than or equal to amount');
        }
        if (priceInput.id) {
          if (!variant) {
            throw new BadRequestException('A new variant cannot update an existing price');
          }
          const price = await this.priceRepository.findOne({ where: { id: priceInput.id } });
          if (!price || price.variantId !== variant.id) {
            throw new BadRequestException('Price does not belong to variant');
          }
        }
      }
    }

    for (const imageInput of input.images ?? []) {
      if (imageInput.variantId && imageInput.variantSku) {
        throw new BadRequestException('Use either image variantId or variantSku, not both');
      }
      if (imageInput.id) {
        const image = await this.imageRepository.findOne({ where: { id: imageInput.id } });
        if (!image || image.productId !== product.id) {
          throw new BadRequestException('Product image does not belong to product');
        }
      } else if (!imageInput.url?.trim()) {
        throw new BadRequestException('A new product image requires a URL');
      }
      if (imageInput.url !== undefined && !imageInput.url.trim()) {
        throw new BadRequestException('Product image URL cannot be empty');
      }
      if (imageInput.variantId) {
        const variant = await this.variantRepository.findOne({
          where: { id: imageInput.variantId },
        });
        if (!variant || variant.productId !== product.id) {
          throw new BadRequestException('Image variantId does not belong to product');
        }
      }
      if (imageInput.variantSku) {
        const variantSku = imageInput.variantSku.trim();
        const isVariantInPayload = (input.variants ?? []).some(
          (variantInput) => variantInput.sku.trim() === variantSku,
        );

        if (!variantSku) throw new BadRequestException('Image variantSku cannot be empty');
        if (!isVariantInPayload) {
          const variant = await this.variantRepository.findOne({
            where: { productId: product.id, sku: variantSku },
          });
          if (!variant)
            throw new BadRequestException('Image variantSku does not belong to product');
        }
      }
    }

    const updatedImageIds = new Set(
      (input.images ?? []).flatMap((imageInput) => (imageInput.id ? [imageInput.id] : [])),
    );
    const deletedImageIds = new Set<string>();

    for (const imageId of input.deleteImageIds ?? []) {
      if (deletedImageIds.has(imageId)) {
        throw new BadRequestException(`Duplicate image id in deleteImageIds: ${imageId}`);
      }
      if (updatedImageIds.has(imageId)) {
        throw new BadRequestException('A product image cannot be updated and deleted together');
      }

      const image = await this.imageRepository.findOne({ where: { id: imageId } });
      if (!image || image.productId !== product.id) {
        throw new BadRequestException('Product image does not belong to product');
      }
      deletedImageIds.add(imageId);
    }

    return product;
  }

  private parseAttributes(attributesJson: string): Record<string, unknown> {
    try {
      const value = JSON.parse(attributesJson || '{}');
      if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
      return value;
    } catch {
      throw new BadRequestException('attributesJson must be a valid JSON object');
    }
  }
}
