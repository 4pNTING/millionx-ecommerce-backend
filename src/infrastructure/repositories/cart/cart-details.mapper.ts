import { DataSource, QueryRunner } from 'typeorm';
import {
  CartDetailsModel,
  CartItemDetailsModel,
  CartModel,
} from '../../../domain/models/cart.model';

export class CartDetailsMapper {
  constructor(private readonly dataSource: DataSource) {}

  async hydrateCart(cart: CartModel, runner?: QueryRunner): Promise<CartDetailsModel> {
    const executor = runner ? runner.manager : this.dataSource;
    const rawItems = await executor.query(
      `
      SELECT 
        ci._id AS "cartItemId",
        ci."cartId",
        ci."variantId",
        ci.quantity,
        ci."addedAt",
        ci."updatedAt",
        pv.sku,
        pv.name AS "variantName",
        pv.attributes,
        p._id AS "productId",
        p.name AS "productName",
        p.slug AS "productSlug",
        (
          SELECT pi.url 
          FROM ecommerce.product_images pi 
          WHERE pi."productId" = p._id 
          ORDER BY (pi."variantId" = pv._id) DESC, pi."sortOrder" ASC 
          LIMIT 1
        ) AS "imageUrl",
        pp.amount AS "unitPrice",
        pp."compareAtAmount" AS "compareAtPrice",
        pp.currency
      FROM ecommerce.cart_items ci
      JOIN ecommerce.product_variants pv ON pv._id = ci."variantId"
      JOIN ecommerce.products p ON p._id = pv."productId"
      LEFT JOIN LATERAL (
        SELECT amount, "compareAtAmount", currency
        FROM ecommerce.product_prices
        WHERE "variantId" = pv._id
          AND "isActive" = true
          AND ("startsAt" IS NULL OR "startsAt" <= now())
          AND ("endsAt" IS NULL OR "endsAt" > now())
        ORDER BY "createdAt" DESC
        LIMIT 1
      ) pp ON true
      WHERE ci."cartId" = $1
      ORDER BY ci."addedAt" ASC
      `,
      [cart._id],
    );

    let totalItems = 0;
    let subtotalNumeric = 0;
    let resolvedCurrency = 'LAK';

    const items: CartItemDetailsModel[] = rawItems.map((row: any) => {
      const quantity = Number(row.quantity) || 1;
      totalItems += quantity;
      const unitPriceNum = row.unitPrice ? parseFloat(row.unitPrice) : 0;
      const lineTotalNum = unitPriceNum * quantity;
      subtotalNumeric += lineTotalNum;
      if (row.currency) resolvedCurrency = row.currency;

      return {
        _id: row.cartItemId,
        cartId: row.cartId,
        variantId: row.variantId,
        quantity,
        addedAt: new Date(row.addedAt),
        updatedAt: new Date(row.updatedAt),
        sku: row.sku,
        variantName: row.variantName || null,
        attributes: row.attributes || {},
        productId: row.productId,
        productName: row.productName,
        productSlug: row.productSlug,
        imageUrl: row.imageUrl || null,
        unitPrice: row.unitPrice ? parseFloat(row.unitPrice).toFixed(2) : '0.00',
        compareAtPrice: row.compareAtPrice ? parseFloat(row.compareAtPrice).toFixed(2) : null,
        currency: row.currency || resolvedCurrency,
        lineTotal: lineTotalNum.toFixed(2),
      };
    });

    return {
      _id: cart._id,
      customerId: cart.customerId || null,
      sessionId: cart.sessionId || null,
      isActive: cart.isActive,
      totalItems,
      subtotal: subtotalNumeric.toFixed(2),
      currency: resolvedCurrency,
      items,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
