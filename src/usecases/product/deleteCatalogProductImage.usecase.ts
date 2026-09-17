import { DeleteCatalogProductImageRequest } from '../../domain/models/product-image.model';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';

export class DeleteCatalogProductImageUseCase {
  constructor(private readonly repository: IProductRepository) {}

  execute(input: DeleteCatalogProductImageRequest) {
    return this.repository.deleteImage(input);
  }
}
