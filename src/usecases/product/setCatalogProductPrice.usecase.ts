import { SetCatalogProductPriceRequest } from '../../domain/models/product-price.model';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';

export class SetCatalogProductPriceUseCase {
  constructor(private readonly repository: IProductRepository) {}
  execute(input: SetCatalogProductPriceRequest) {
    return this.repository.setPrice(input);
  }
}
