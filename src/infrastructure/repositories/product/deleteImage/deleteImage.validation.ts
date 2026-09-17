import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DeleteCatalogProductImageRequest } from '../../../../domain/models/product-image.model';
import { ProductImageEntity } from '../../../entities/product-image.entity';

export class DeleteCatalogProductImageValidation {
  constructor(private readonly imageRepository: Repository<ProductImageEntity>) {}

  async execute(input: DeleteCatalogProductImageRequest): Promise<ProductImageEntity> {
    const image = await this.imageRepository.findOne({ where: { id: input.id } });
    if (!image) throw new NotFoundException('Product image not found');
    return image;
  }
}
