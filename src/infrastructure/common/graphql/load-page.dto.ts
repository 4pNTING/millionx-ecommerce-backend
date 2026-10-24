import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ActiveStatus } from '../../../domain/enums/enum';

/** Shared list-request contract; output/entity status remains a Boolean. */
@InputType({ isAbstract: true })
export abstract class LoadPageDto {
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

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(320)
  keyword?: string;

  @Field(() => ActiveStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ActiveStatus)
  isActive?: ActiveStatus;
}
