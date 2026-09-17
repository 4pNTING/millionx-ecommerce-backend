import { BadRequestException } from '@nestjs/common';
import { CreateCatalogProductBundleRequest } from '../../../../domain/models/product.model';

export class CreateCatalogProductBundleValidation {
  execute(input: CreateCatalogProductBundleRequest): void {
    const skus = new Set<string>();

    for (const variant of input.variants ?? []) {
      const sku = variant.sku.trim();
      if (skus.has(sku)) {
        throw new BadRequestException(`Duplicate variant SKU in bundle: ${sku}`);
      }
      skus.add(sku);

      const currencies = new Set<string>();
      for (const price of variant.prices ?? []) {
        const currency = price.currency.trim().toUpperCase();
        if (currencies.has(currency)) {
          throw new BadRequestException(`Duplicate price currency for SKU`);
        }
        currencies.add(currency);

        if (price.compareAtAmount != null && price.compareAtAmount < price.amount) {
          throw new BadRequestException('compareAtAmount must be greater than or equal to amount');
        }
      }
    }
  }
}
