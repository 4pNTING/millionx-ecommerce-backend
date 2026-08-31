import { QueryRunner } from 'typeorm';
import { SetCatalogProductPriceRequest } from '../../../../domain/models/product-price.model';
import { ProductPriceEntity } from '../../../entities/product-price.entity';
import { ValidatedCatalogPrice } from './setPrice.validation';

export class SetCatalogProductPriceAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(input: SetCatalogProductPriceRequest, validated: ValidatedCatalogPrice) {
    const repository = this.session.manager.getRepository(ProductPriceEntity);
    const now = new Date();
    await repository
      .createQueryBuilder()
      .update(ProductPriceEntity)
      .set({ isActive: false, endsAt: now })
      .where('"variantId" = :variantId', { variantId: input.variantId })
      .andWhere('currency = :currency', { currency: validated.currency })
      .andWhere('"isActive" = true')
      .andWhere('"endsAt" IS NULL')
      .execute();
    await repository.save(
      repository.create({
        variantId: input.variantId,
        currency: validated.currency,
        amount: input.amount.toFixed(2),
        compareAtAmount: input.compareAtAmount?.toFixed(2),
        startsAt: input.startsAt ?? now,
        isActive: true,
      }),
    );
    return { productId: validated.variant.productId, currency: validated.currency };
  }
}
