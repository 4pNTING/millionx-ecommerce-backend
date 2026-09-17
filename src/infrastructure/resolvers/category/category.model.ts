import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

@ObjectType()
export class Category {
  @Field() id: string;
  @Field({ nullable: true }) parentId?: string;
  @Field() name: string;
  @Field() slug: string;
  @Field({ nullable: true }) description?: string;
  @Field(() => Int) sortOrder: number;
  @Field() isActive: boolean;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
}

@ObjectType()
export class CategoryPage {
  @Field(() => [Category]) items: Category[];
  @Field(() => Int) total: number;
  @Field(() => Int) page: number;
  @Field(() => Int) limit: number;
}

@InputType()
export class CategoryFilterInput {
  @Field({ nullable: true }) @IsOptional() @IsUUID() parentId?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() keyword?: string;
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
  @Field({ nullable: true }) @IsOptional() @IsBoolean() isActive?: boolean;
  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean;
  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  rootOnly?: boolean;
  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  fetchAll?: boolean;
}

@InputType()
export class CreateCategoryInput {
  @Field({ nullable: true }) @IsOptional() @IsUUID() parentId?: string;
  @Field() @IsString() @MaxLength(150) name: string;
  @Field() @IsString() @MaxLength(180) slug: string;
  @Field({ nullable: true }) @IsOptional() @IsString() description?: string;
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

@InputType()
export class UpdateCategoryInput {
  @Field() @IsUUID() id: string;
  @Field({ nullable: true }) @IsOptional() @IsUUID() parentId?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(150) name?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(180) slug?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() description?: string;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @Field({ nullable: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}
