import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

@ObjectType()
export class Inventory {
  @Field()
  _id: string;

  @Field()
  variantId: string;

  @Field(() => Int)
  onHand: number;

  @Field(() => Int)
  reserved: number;

  @Field(() => Int)
  available: number;

  @Field()
  updatedAt: Date;
}

@InputType()
export class AdjustStockDto {
  @Field()
  @IsUUID('4')
  variantId: string;

  @Field(() => Int)
  @IsInt()
  quantityDelta: number;

  @Field({ defaultValue: 'adjustment' })
  @IsString()
  @IsNotEmpty()
  type: string = 'adjustment';

  @Field({ defaultValue: 'manual_adjustment' })
  @IsString()
  @IsNotEmpty()
  referenceType: string = 'manual_adjustment';

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  note?: string;
}
