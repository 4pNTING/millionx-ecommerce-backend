import { DataSource, QueryRunner } from 'typeorm';
import {
  OrderItemModel,
  OrderModel,
  OrderStatusHistoryModel,
} from '../../../domain/models/order.model';

export class OrderDetailsMapper {
  constructor(private readonly dataSource: DataSource) {}

  async hydrateOrder(orderRow: any, runner?: QueryRunner): Promise<OrderModel> {
    const executor = runner ? runner.manager : this.dataSource;
    const orderId = orderRow._id;

    const [itemsRows, historyRows] = await Promise.all([
      executor.query(
        `SELECT _id, "orderId", "variantId", sku, "productName", "variantName", quantity, "unitPrice", subtotal, "createdAt"
         FROM ecommerce.order_items
         WHERE "orderId" = $1
         ORDER BY "createdAt" ASC`,
        [orderId],
      ),
      executor.query(
        `SELECT _id, "orderId", "fromStatus", "toStatus", note, "createdBy", "createdAt"
         FROM ecommerce.order_status_history
         WHERE "orderId" = $1
         ORDER BY "createdAt" ASC`,
        [orderId],
      ),
    ]);

    const items: OrderItemModel[] = itemsRows.map((row: any) => ({
      _id: row._id,
      orderId: row.orderId,
      variantId: row.variantId,
      sku: row.sku,
      productName: row.productName,
      variantName: row.variantName,
      quantity: Number(row.quantity),
      unitPrice: String(row.unitPrice),
      subtotal: String(row.subtotal),
      createdAt: new Date(row.createdAt),
    }));

    const statusHistory: OrderStatusHistoryModel[] = historyRows.map((row: any) => ({
      _id: row._id,
      orderId: row.orderId,
      fromStatus: row.fromStatus ?? null,
      toStatus: row.toStatus,
      note: row.note ?? null,
      createdBy: row.createdBy,
      createdAt: new Date(row.createdAt),
    }));

    return {
      _id: orderRow._id,
      orderNumber: orderRow.orderNumber,
      customerId: orderRow.customerId,
      checkoutSessionId: orderRow.checkoutSessionId ?? null,
      subtotal: String(orderRow.subtotal),
      discountAmount: String(orderRow.discountAmount),
      shippingAmount: String(orderRow.shippingAmount),
      taxAmount: String(orderRow.taxAmount),
      total: String(orderRow.total),
      currency: orderRow.currency,
      status: orderRow.status,
      shippingAddress:
        typeof orderRow.shippingAddress === 'string'
          ? JSON.parse(orderRow.shippingAddress)
          : orderRow.shippingAddress,
      billingAddress:
        orderRow.billingAddress
          ? typeof orderRow.billingAddress === 'string'
            ? JSON.parse(orderRow.billingAddress)
            : orderRow.billingAddress
          : null,
      notes: orderRow.notes ?? null,
      items,
      statusHistory,
      createdAt: new Date(orderRow.createdAt),
      updatedAt: new Date(orderRow.updatedAt),
    };
  }
}
