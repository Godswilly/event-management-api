import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  IsEnum,
  ValidateIf,
  IsIn,
} from 'class-validator';
import { UserRole } from 'src/enums/user-role.enum';

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

  @IsEnum(UserRole)
  @IsIn([UserRole.ATTENDEE, UserRole.ORGANIZER], {
    message: 'Role must be either ATTENDEE or ORGANIZER',
  })
  role: UserRole;
}
