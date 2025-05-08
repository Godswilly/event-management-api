import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  IsEnum,
  IsIn,
} from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter and one number',
  })
  password: string;

  @IsEnum(Role)
  @IsIn([Role.ATTENDEE, Role.ORGANIZER], {
    message: 'Role must be either ATTENDEE or ORGANIZER',
  })
  role: Role;
}
