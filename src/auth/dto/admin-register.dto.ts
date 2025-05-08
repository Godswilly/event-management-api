import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  IsEnum,
  Equals,
} from 'class-validator';
import { Role } from '@prisma/client';

export class AdminRegisterDto {
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

  // @IsEnum(UserRole)
  // @Equals(UserRole.ADMIN, { message: 'Only ADMIN role is allowed here' })
  // role: UserRole;

  @IsEnum(Role)
  @Equals(Role.ADMIN, { message: 'Only ADMIN role is allowed here' })
  role: Role;
}
