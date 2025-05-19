import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus } from '@prisma/client';
import { IsEndDateAfterStartDate } from '../validators/is-after-start-date.validator';
import { IsEndTimeAfterStartTime } from '../validators/is-after-start-time.validator';

export class CreateEventDto {
  @IsNotEmpty({ message: 'Title is required.' })
  @IsString({ message: 'Title must be a string.' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string.' })
  description?: string;

  @IsNotEmpty({ message: 'Location is required.' })
  @IsString({ message: 'Location must be a string.' })
  location: string;

  @IsNotEmpty({ message: 'Start date is required.' })
  @IsDateString(
    {},
    { message: 'Start date must be a valid ISO 8601 date string.' },
  )
  @Type(() => Date)
  startDate: string;

  @IsNotEmpty({ message: 'End date is required.' })
  @IsDateString(
    {},
    { message: 'End date must be a valid ISO 8601 date string.' },
  )
  @Type(() => Date)
  @Validate(IsEndDateAfterStartDate, {
    message: 'End date must be after the start date.',
  })
  endDate: string;

  @IsOptional()
  @IsString({ message: 'Start time must be a string in HH:mm format.' })
  startTime?: string;

  @IsOptional()
  @IsString({ message: 'End time must be a string in HH:mm format.' })
  @Validate(IsEndTimeAfterStartTime, {
    message: 'End time must be after the start time.',
  })
  endTime?: string;

  @IsOptional()
  @IsInt({ message: 'Capacity must be an integer.' })
  capacity?: number;

  @IsOptional()
  @IsString({ message: 'Category must be a string.' })
  category?: string;

  @IsOptional()
  @IsArray({ message: 'Tags must be an array of strings.' })
  @IsString({ each: true, message: 'Each tag must be a string.' })
  tags?: string[];

  @IsOptional()
  @IsString({ message: 'Image URL must be a string.' })
  imageUrl?: string;

  @IsOptional()
  @IsString({ message: 'Time zone must be a string (e.g., Africa/Lagos).' })
  timeZone?: string;

  @IsOptional()
  @IsEnum(EventStatus, {
    message: `Status must be one of: ${Object.values(EventStatus).join(', ')}.`,
  })
  status?: EventStatus;
}
