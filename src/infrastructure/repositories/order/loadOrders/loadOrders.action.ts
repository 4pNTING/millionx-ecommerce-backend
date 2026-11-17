import { DataSource } from 'typeorm';
import {
  LoadOrdersRequest,
  OrderListResult,
  OrderModel,
} from '../../../../domain/models/order.model';
import { OrderDetailsMapper } from '../order-details.mapper';

export class LoadOrdersAction {
  private readonly mapper: OrderDetailsMapper;

  constructor(private readonly dataSource: DataSource) {
    this.mapper = new OrderDetailsMapper(dataSource);
  }

  async execute(input: LoadOrdersRequest): Promise<OrderListResult> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (input.customerId) {
      conditions.push(`"customerId" = $${pIdx++}`);
      params.push(input.customerId);
    }

    if (input.status) {
      conditions.push(`status = $${pIdx++}`);
      params.push(input.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT count(*)::int as count FROM ecommerce.orders ${whereClause}`;
    const [countRes] = await this.dataSource.query(countQuery, params);
    const total = Number(countRes?.count ?? 0);

    const dataQuery = `
      SELECT _id, "orderNumber", "customerId", "checkoutSessionId",
             subtotal, "discountAmount", "shippingAmount", "taxAmount",
             total, currency, status, "shippingAddress", "billingAddress", notes,
             "createdAt", "updatedAt"
      FROM ecommerce.orders
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;
    const rows = await this.dataSource.query(dataQuery, [...params, limit, offset]);

    const items: OrderModel[] = await Promise.all(
      rows.map((row: any) => this.mapper.hydrateOrder(row)),
    );

    return {
      items,
      total,
      page,
      limit,
    };
  }
}
