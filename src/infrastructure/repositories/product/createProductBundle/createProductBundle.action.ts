import { QueryRunner } from 'typeorm';
import { CreateCatalogProductBundleRequest } from '../../../../domain/models/product.model';
import { CategoryEntity } from '../../../entities/category.entity';
import { ProductEntity } from '../../../entities/product.entity';
import { ProductVariantEntity } from '../../../entities/product-variant.entity';
import { AddCatalogProductImageAction } from '../addImage/addImage.action';
import { AddCatalogProductImageValidation } from '../addImage/addImage.validation';
import { CreateCatalogProductAction } from '../createProduct/createProduct.action';
import { CreateCatalogProductValidation } from '../createProduct/createProduct.validation';
import { CreateCatalogVariantAction } from '../createVariant/createVariant.action';
import { CreateCatalogVariantValidation } from '../createVariant/createVariant.validation';
import { SetCatalogProductPriceAction } from '../setPrice/setPrice.action';
import { SetCatalogProductPriceValidation } from '../setPrice/setPrice.validation';

export class CreateCatalogProductBundleAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(input: CreateCatalogProductBundleRequest): Promise<ProductEntity> {
    const categoryRepository = this.session.manager.getRepository(CategoryEntity);
    const productRepository = this.session.manager.getRepository(ProductEntity);
    const variantRepository = this.session.manager.getRepository(ProductVariantEntity);

    const productInput = {
      categoryId: input.categoryId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      brand: input.brand,
    };
    await new CreateCatalogProductValidation(categoryRepository, productRepository).execute(
      productInput,
    );
    const product = await new CreateCatalogProductAction(this.session).execute(productInput);

    for (const variantInput of input.variants ?? []) {
      const { prices = [], images = [], ...variantFields } = variantInput;
      const createVariantInput = { ...variantFields, productId: product.id };
      const validatedVariant = await new CreateCatalogVariantValidation(
        productRepository,
        variantRepository,
      ).execute(createVariantInput);
      const variant = await new CreateCatalogVariantAction(this.session).execute(
        createVariantInput,
        validatedVariant.attributes,
      );

      for (const priceInput of prices) {
        const setPriceInput = { ...priceInput, variantId: variant.id };
        const validatedPrice = await new SetCatalogProductPriceValidation(
          variantRepository,
        ).execute(setPriceInput);
        await new SetCatalogProductPriceAction(this.session).execute(setPriceInput, validatedPrice);
      }

      for (const imageInput of images) {
        await this.addImage({
          ...imageInput,
          productId: product.id,
          variantId: variant.id,
        });
      }
    }

    for (const imageInput of input.images ?? []) {
      await this.addImage({ ...imageInput, productId: product.id });
    }

    return product;
  }

  private async addImage(input: {
    productId: string;
    variantId?: string;
    url: string;
    altText?: string;
    sortOrder?: number;
  }): Promise<void> {
    await new AddCatalogProductImageValidation(
      this.session.manager.getRepository(ProductEntity),
      this.session.manager.getRepository(ProductVariantEntity),
    ).execute(input);
    await new AddCatalogProductImageAction(this.session).execute(input);
  }
}
