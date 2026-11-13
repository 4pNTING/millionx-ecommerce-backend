import { DataSource } from 'typeorm';
import {
  WishlistDetailsModel,
  WishlistItemDetailsModel,
  WishlistModel,
} from '../../../domain/models/wishlist.model';

export class WishlistDetailsMapper {
  constructor(private readonly dataSource: DataSource) {}

  async hydrateWishlist(wishlist: WishlistModel): Promise<WishlistDetailsModel> {
    const rawItems = await this.dataSource.query(
      `
      SELECT 
        wi._id AS "wishlistItemId",
        wi."wishlistId",
        wi."productId",
        wi."addedAt",
        p.name AS "productName",
        p.slug AS "productSlug",
        p.brand,
        (
          SELECT pi.url 
          FROM ecommerce.product_images pi 
          WHERE pi."productId" = p._id 
          ORDER BY pi."sortOrder" ASC 
          LIMIT 1
        ) AS "imageUrl",
        min_pp.amount AS "minPrice",
        min_pp.currency
      FROM ecommerce.wishlist_items wi
      JOIN ecommerce.products p ON p._id = wi."productId"
      LEFT JOIN LATERAL (
        SELECT pp.amount, pp.currency
        FROM ecommerce.product_prices pp
        JOIN ecommerce.product_variants pv ON pv._id = pp."variantId"
        WHERE pv."productId" = p._id
          AND pp."isActive" = true
          AND ("startsAt" IS NULL OR "startsAt" <= now())
          AND ("endsAt" IS NULL OR "endsAt" > now())
        ORDER BY pp.amount ASC
        LIMIT 1
      ) min_pp ON true
      WHERE wi."wishlistId" = $1
      ORDER BY wi."addedAt" DESC
      `,
      [wishlist._id],
    );

    const items: WishlistItemDetailsModel[] = rawItems.map((row: any) => ({
      _id: row.wishlistItemId,
      wishlistId: row.wishlistId,
      productId: row.productId,
      productName: row.productName,
      productSlug: row.productSlug,
      brand: row.brand || null,
      imageUrl: row.imageUrl || null,
      minPrice: row.minPrice ? parseFloat(row.minPrice).toFixed(2) : null,
      currency: row.currency || null,
      addedAt: new Date(row.addedAt),
    }));

    return {
      _id: wishlist._id,
      customerId: wishlist.customerId,
      items,
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt,
    };
  }
}
