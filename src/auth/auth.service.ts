import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { HashService } from './hash.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import { AuthJwtPayload } from './types/auth-jwt-payload.type.ts';
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(data: RegisterUserDto): Promise<User> {
    const hashedPassword = await this.hashService.hashPassword(data.password);

    return this.usersService.createUser({
      email: data.email,
      username: data.username,
      role: data.role,
      password: hashedPassword,
    });
  }

  async registerAdmin(data: AdminRegisterDto): Promise<User> {
    const hashedPassword = await this.hashService.hashPassword(data.password);
    return this.usersService.createUser({
      email: data.email,
      username: data.username,
      role: Role.ADMIN,
      password: hashedPassword,
    });
  }

  async validateUser(email: string, plainPassword: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not Found!');
    }

    const passwordMatches = await this.hashService.verifyPassword(
      user.password,
      plainPassword,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid Credentials');
    }
    return user;
  }

  async login(user: User) {
  
    const payload: AuthJwtPayload = {
      sub: user.id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      user: user,
    };
  }
}
