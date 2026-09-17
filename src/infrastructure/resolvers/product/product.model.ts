import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

@ObjectType()
export class ProductPrice {
  @Field() id: string;
  @Field() variantId: string;
  @Field() currency: string;
  @Field(() => Float) amount: number;
  @Field(() => Float, { nullable: true }) compareAtAmount?: number;
  @Field({ nullable: true }) startsAt?: Date;
  @Field({ nullable: true }) endsAt?: Date;
  @Field() isActive: boolean;
}

@ObjectType()
export class ProductImage {
  @Field() id: string;
  @Field() productId: string;
  @Field({ nullable: true }) variantId?: string;
  @Field() url: string;
  @Field({ nullable: true }) altText?: string;
  @Field(() => Int) sortOrder: number;
}

@ObjectType()
export class ProductVariant {
  @Field() id: string;
  @Field() productId: string;
  @Field() sku: string;
  @Field({ nullable: true }) barcode?: string;
  @Field({ nullable: true }) name?: string;
  @Field() attributesJson: string;
  @Field() isActive: boolean;
  @Field(() => [ProductPrice]) prices: ProductPrice[];
}

@ObjectType()
export class Product {
  @Field() id: string;
  @Field() categoryId: string;
  @Field() name: string;
  @Field() slug: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) brand?: string;
  @Field() isActive: boolean;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
  @Field(() => [ProductVariant]) variants: ProductVariant[];
  @Field(() => [ProductImage]) images: ProductImage[];
}

@ObjectType()
export class ProductPage {
  @Field(() => [Product]) items: Product[];
  @Field(() => Int) total: number;
  @Field(() => Int) page: number;
  @Field(() => Int) limit: number;
}

@InputType()
export class ProductFilterInput {
  @Field({ nullable: true }) @IsOptional() @IsUUID() categoryId?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() keyword?: string;
  @Field({ nullable: true }) @IsOptional() @Length(3, 3) currency?: string;
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;
  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean;
}

@InputType()
export class CreateProductInput {
  @Field() @IsUUID() categoryId: string;
  @Field() @IsString() @MaxLength(200) name: string;
  @Field() @IsString() @MaxLength(220) slug: string;
  @Field({ nullable: true }) @IsOptional() @IsString() description?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(150) brand?: string;
}

@InputType()
export class CreateProductVariantInput {
  @Field() @IsUUID() productId: string;
  @Field() @IsString() @MaxLength(100) sku: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(100) barcode?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(160) name?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() attributesJson?: string;
}

@InputType()
export class SetProductPriceInput {
  @Field() @IsUUID() variantId: string;
  @Field() @Length(3, 3) currency: string;
  @Field(() => Float) @IsNumber() @Min(0) amount: number;
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtAmount?: number;
  @Field({ nullable: true }) @IsOptional() startsAt?: Date;
}

@InputType()
export class AddProductImageInput {
  @Field() @IsUUID() productId: string;
  @Field({ nullable: true }) @IsOptional() @IsUUID() variantId?: string;
  @Field() @IsString() url: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(250) altText?: string;
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

@InputType()
export class UpdateProductImageInput {
  @Field() @IsUUID() id: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() variantId?: string | null;
  @Field({ nullable: true }) @IsOptional() @IsString() @MinLength(1) url?: string;
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  altText?: string | null;
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

@InputType()
export class UpdateProductPriceInput {
  @Field({ nullable: true }) @IsOptional() @IsUUID() id?: string;
  @Field() @Length(3, 3) currency: string;
  @Field(() => Float) @IsNumber() @Min(0) amount: number;
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtAmount?: number | null;
  @Field(() => Date, { nullable: true }) @IsOptional() startsAt?: Date | null;
  @Field({ nullable: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}

@InputType()
export class UpdateProductVariantInput {
  @Field({ nullable: true }) @IsOptional() @IsUUID() id?: string;
  @Field() @IsString() @MaxLength(100) sku: string;
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string | null;
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string | null;
  @Field({ nullable: true }) @IsOptional() @IsString() attributesJson?: string;
  @Field({ nullable: true }) @IsOptional() @IsBoolean() isActive?: boolean;
  @Field(() => [UpdateProductPriceInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => UpdateProductPriceInput)
  prices?: UpdateProductPriceInput[];
}

@InputType()
export class UpdateProductBundleImageInput {
  @Field({ nullable: true }) @IsOptional() @IsUUID() id?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsUUID() variantId?: string | null;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(100) variantSku?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MinLength(1) url?: string;
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  altText?: string | null;
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

@InputType()
export class UpdateProductInput {
  @Field() @IsUUID() id: string;
  @Field({ nullable: true }) @IsOptional() @IsUUID() categoryId?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(200) name?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(220) slug?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() description?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(150) brand?: string;
  @Field({ nullable: true }) @IsOptional() @IsBoolean() isActive?: boolean;
  @Field(() => [UpdateProductVariantInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => UpdateProductVariantInput)
  variants?: UpdateProductVariantInput[];
  @Field(() => [UpdateProductBundleImageInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => UpdateProductBundleImageInput)
  images?: UpdateProductBundleImageInput[];
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  deleteImageIds?: string[];
}

@InputType()
export class DeleteProductImageInput {
  @Field() @IsUUID() id: string;
}

@InputType()
export class ProductBundlePriceInput {
  @Field() @Length(3, 3) currency: string;
  @Field(() => Float) @IsNumber() @Min(0) amount: number;
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtAmount?: number;
  @Field({ nullable: true }) @IsOptional() startsAt?: Date;
}

@InputType()
export class ProductBundleImageInput {
  @Field() @IsString() url: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(250) altText?: string;
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

@InputType()
export class ProductBundleVariantInput {
  @Field() @IsString() @MaxLength(100) sku: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(100) barcode?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(160) name?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() attributesJson?: string;
  @Field(() => [ProductBundlePriceInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ProductBundlePriceInput)
  prices?: ProductBundlePriceInput[];
  @Field(() => [ProductBundleImageInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ProductBundleImageInput)
  images?: ProductBundleImageInput[];
}

@InputType()
export class CreateProductBundleInput {
  @Field() @IsUUID() categoryId: string;
  @Field() @IsString() @MaxLength(200) name: string;
  @Field() @IsString() @MaxLength(220) slug: string;
  @Field({ nullable: true }) @IsOptional() @IsString() description?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(150) brand?: string;
  @Field(() => [ProductBundleVariantInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProductBundleVariantInput)
  variants?: ProductBundleVariantInput[];
  @Field(() => [ProductBundleImageInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProductBundleImageInput)
  images?: ProductBundleImageInput[];
}
