import { DataSource } from 'typeorm';
import { OrderModel } from '../../../../domain/models/order.model';
import { OrderDetailsMapper } from '../order-details.mapper';

export class LoadOrderByIdAction {
  private readonly mapper: OrderDetailsMapper;

  constructor(private readonly dataSource: DataSource) {
    this.mapper = new OrderDetailsMapper(dataSource);
  }

  async execute(orderId: string, customerId?: string): Promise<OrderModel | null> {
    const params: any[] = [orderId];
    let query = `
      SELECT _id, "orderNumber", "customerId", "checkoutSessionId",
             subtotal, "discountAmount", "shippingAmount", "taxAmount",
             total, currency, status, "shippingAddress", "billingAddress", notes,
             "createdAt", "updatedAt"
      FROM ecommerce.orders
      WHERE _id = $1
    `;

    if (customerId) {
      query += ` AND "customerId" = $2`;
      params.push(customerId);
    }

    const [row] = await this.dataSource.query(query, params);
    if (!row) {
      return null;
    }

    return this.mapper.hydrateOrder(row);
  }
}
