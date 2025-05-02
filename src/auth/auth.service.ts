import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { HashService } from './hash.service';
import { UserRole } from 'src/enums/user-role.enum';
import { RegisterUserDto } from './dto/register-user.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashService: HashService,
  ) {}

  async registerUser(data: RegisterUserDto) {
    const hashedPassword = await this.hashService.hashPassword(data.password);

    return this.usersService.createUser({
      email: data.email,
      username: data.username,
      role: data.role,
      password: hashedPassword,
    });
  }

  async registerAdmin(data: AdminRegisterDto) {
    const hashedPassword = await this.hashService.hashPassword(data.password);
    return this.usersService.createUser({
      email: data.email,
      username: data.username,
      role: UserRole.ADMIN,
      password: hashedPassword,
    });
  }

  async validateUser(email: string, plainPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const passwordMatches = await this.hashService.verifyPassword(
      user.password,
      plainPassword,
    );

    return passwordMatches ? user : null;
  }
}
