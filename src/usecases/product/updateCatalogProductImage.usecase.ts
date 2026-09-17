import { UpdateCatalogProductImageRequest } from '../../domain/models/product-image.model';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';

export class UpdateCatalogProductImageUseCase {
  constructor(private readonly repository: IProductRepository) {}

  execute(input: UpdateCatalogProductImageRequest) {
    return this.repository.updateImage(input);
  }
}
