import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@ObjectType()
export class WishlistItem {
  @Field()
  _id: string;

  @Field()
  wishlistId: string;

  @Field()
  productId: string;

  @Field()
  productName: string;

  @Field()
  productSlug: string;

  @Field({ nullable: true })
  brand?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  minPrice?: string;

  @Field({ nullable: true })
  currency?: string;

  @Field()
  addedAt: Date;
}

@ObjectType()
export class Wishlist {
  @Field()
  _id: string;

  @Field()
  customerId: string;

  @Field(() => [WishlistItem])
  items: WishlistItem[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class AddToWishlistDto {
  @Field()
  @IsUUID('4')
  @IsNotEmpty()
  productId: string;
}

@InputType()
export class RemoveFromWishlistDto {
  @Field()
  @IsUUID('4')
  @IsNotEmpty()
  productId: string;
}
