import { EventStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class EventFilterDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsInt()
  organizerId?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDateFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDateTo?: Date;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacityMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacityMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;
}
