import { ActiveStatus } from '../../../domain/enums/enum';
import { LoadPageDto } from '../../common/graphql/load-page.dto';
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

@ObjectType()
export class Category {
  @Field()
  _id: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  sortOrder: number;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class CategoryPage {
  @Field(() => [Category])
  items: Category[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}

@InputType()
export class LoadCategoryDto extends LoadPageDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @Field(() => ActiveStatus, { nullable: true, defaultValue: ActiveStatus.active })
  @IsOptional()
  @IsEnum(ActiveStatus)
  isActive?: ActiveStatus;

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
export class CreateCategoryDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @Field()
  @IsString()
  @MaxLength(150)
  name: string;

  @Field()
  @IsString()
  @MaxLength(180)
  slug: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

@InputType()
export class UpdateCategoryDto {
  @Field()
  @IsUUID()
  _id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
