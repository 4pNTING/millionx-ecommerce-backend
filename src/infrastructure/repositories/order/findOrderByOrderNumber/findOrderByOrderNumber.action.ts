import { DataSource } from 'typeorm';
import { OrderModel } from '../../../../domain/models/order.model';
import { OrderDetailsMapper } from '../order-details.mapper';

export class FindOrderByOrderNumberAction {
  private readonly mapper: OrderDetailsMapper;

  constructor(private readonly dataSource: DataSource) {
    this.mapper = new OrderDetailsMapper(dataSource);
  }

  async execute(orderNumber: string): Promise<OrderModel | null> {
    const [row] = await this.dataSource.query(
      `SELECT _id, "orderNumber", "customerId", "checkoutSessionId",
              subtotal, "discountAmount", "shippingAmount", "taxAmount",
              total, currency, status, "shippingAddress", "billingAddress", notes,
              "createdAt", "updatedAt"
       FROM ecommerce.orders
       WHERE "orderNumber" = $1`,
      [orderNumber],
    );

    if (!row) {
      return null;
    }

    return this.mapper.hydrateOrder(row);
  }
}
