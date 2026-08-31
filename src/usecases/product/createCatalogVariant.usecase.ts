import { CreateCatalogVariantRequest } from '../../domain/models/product-variant.model';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';

export class CreateCatalogVariantUseCase {
  constructor(private readonly repository: IProductRepository) {}
  execute(input: CreateCatalogVariantRequest) {
    return this.repository.createVariant(input);
  }
}
