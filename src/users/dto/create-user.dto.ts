import {
  IsEmail,
  IsEnum,
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
} from 'class-validator';
import { UserRole } from 'src/enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter and one number',
  })
  password: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
