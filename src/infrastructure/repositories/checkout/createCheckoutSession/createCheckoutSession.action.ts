import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import {
  CheckoutSessionModel,
  CreateCheckoutSessionRequest,
  PriceSnapshotItemModel,
} from '../../../../domain/models/checkout-session.model';
import { CartEntity } from '../../../entities/cart.entity';
import { CheckoutSessionEntity } from '../../../entities/checkout-session.entity';

export class CreateCheckoutSessionAction {
  constructor(
    private readonly session: QueryRunner,
    private readonly dataSource: DataSource,
  ) {}

  async execute(input: CreateCheckoutSessionRequest): Promise<CheckoutSessionModel> {
    const cartRepo = this.session.manager.getRepository(CartEntity);
    const checkoutRepo = this.session.manager.getRepository(CheckoutSessionEntity);

    // 1. Locate active cart
    let cart: CartEntity | null = null;
    if (input.cartId) {
      cart = await cartRepo.findOne({ where: { _id: input.cartId, isActive: true } });
    } else if (input.customerId) {
      cart = await cartRepo.findOne({ where: { customerId: input.customerId, isActive: true } });
    } else if (input.sessionId) {
      cart = await cartRepo.findOne({
        where: { sessionId: input.sessionId, isActive: true, customerId: undefined },
      });
    }

    if (!cart) {
      throw new NotFoundException('Active cart not found for checkout');
    }

    // 2. Fetch cart items with recalculated current prices and active variant check
    const itemsRaw = await this.dataSource.query(
      `
      SELECT 
        ci._id AS "cartItemId",
        ci."variantId",
        ci.quantity,
        pv.sku,
        pv.name AS "variantName",
        pv."isActive" AS "variantActive",
        p._id AS "productId",
        p.name AS "productName",
        p."isActive" AS "productActive",
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
      `,
      [cart._id],
    );

    if (!itemsRaw || itemsRaw.length === 0) {
      throw new BadRequestException('Cannot create checkout session for an empty cart');
    }

    let subtotalNum = 0;
    let resolvedCurrency = 'LAK';
    const priceSnapshot: PriceSnapshotItemModel[] = [];

    for (const row of itemsRaw) {
      if (!row.productActive || !row.variantActive) {
        throw new BadRequestException(`Product or variant for item ${row.sku} is no longer active`);
      }
      if (!row.unitPrice) {
        throw new BadRequestException(`No active price available for item ${row.sku}`);
      }

      const unitPriceNum = parseFloat(row.unitPrice);
      const quantity = Number(row.quantity) || 1;
      const lineSubtotal = unitPriceNum * quantity;
      subtotalNum += lineSubtotal;
      if (row.currency) resolvedCurrency = row.currency;

      priceSnapshot.push({
        variantId: row.variantId,
        sku: row.sku,
        productId: row.productId,
        productName: row.productName,
        variantName: row.variantName || null,
        quantity,
        unitPrice: unitPriceNum.toFixed(2),
        compareAtPrice: row.compareAtPrice ? parseFloat(row.compareAtPrice).toFixed(2) : null,
        currency: row.currency || resolvedCurrency,
        subtotal: lineSubtotal.toFixed(2),
      });
    }

    const discountAmountNum = input.discountAmount
      ? Math.max(0, parseFloat(input.discountAmount))
      : 0;
    const shippingAmountNum = input.shippingAmount
      ? Math.max(0, parseFloat(input.shippingAmount))
      : 0;
    const taxAmountNum = input.taxAmount ? Math.max(0, parseFloat(input.taxAmount)) : 0;
    const totalNum = Math.max(
      0,
      subtotalNum - discountAmountNum + shippingAmountNum + taxAmountNum,
    );

    // 30 minute expiry
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const sessionEntity = checkoutRepo.create({
      cartId: cart._id,
      customerId: cart.customerId || input.customerId || null,
      subtotal: subtotalNum.toFixed(2),
      discountAmount: discountAmountNum.toFixed(2),
      shippingAmount: shippingAmountNum.toFixed(2),
      taxAmount: taxAmountNum.toFixed(2),
      total: totalNum.toFixed(2),
      currency: resolvedCurrency,
      priceSnapshot,
      status: 'open',
      expiresAt,
    });

    return await checkoutRepo.save(sessionEntity);
  }
}
