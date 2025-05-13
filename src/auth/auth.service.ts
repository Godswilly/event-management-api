import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { HashService } from './hash.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import { AuthJwtPayload } from './types/auth-jwt-payload.type.ts';
import refreshJwtConfig from './config/refresh-jwt.config';
import { ConfigType } from '@nestjs/config';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
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
    if (!user) throw new UnauthorizedException('Invalid Credentials');

    const passwordMatches = await this.hashService.verifyPassword(
      user.password,
      plainPassword,
    );
    if (!passwordMatches)
      throw new UnauthorizedException('Invalid Credentials');
    return user;
  }

  async login(user: User, ip?: string, userAgent?: string) {
    const payload: AuthJwtPayload = {
      sub: user.id,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
    });

    const refreshToken = await this.jwtService.signAsync(
      payload,
      this.refreshTokenConfig,
    );

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await this.refreshTokenService.storeRefreshToken(
      user,
      refreshToken,
      expiresAt,
      ip,
      userAgent,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      user,
    };
  }

  async refresh(
    user: { id: number; role: Role },
    currentRefreshToken: string,
    ip?: string,
    userAgent?: string,
  ) {
    const fullUser = await this.usersService.findOne(user.id);

    const storedRefreshToken = await this.refreshTokenService.findValidToken(
      fullUser.id,
      currentRefreshToken,
    );
    if (!storedRefreshToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.refreshTokenService.revokeTokenById(storedRefreshToken.id);

    const payload: AuthJwtPayload = {
      sub: fullUser.id,
      role: fullUser.role,
    };

    const newAccessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
    });
    const newRefreshToken = await this.jwtService.signAsync(
      payload,
      this.refreshTokenConfig,
    );
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await this.refreshTokenService.storeRefreshToken(
      fullUser,
      newRefreshToken,
      expiresAt,
      ip,
      userAgent,
    );

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      user: fullUser,
    };
  }

  async logout(user: User, refreshToken: string) {
    const stored = await this.refreshTokenService.findValidToken(
      user.id,
      refreshToken,
    );

    if (stored) {
      await this.refreshTokenService.revokeTokenById(stored.id);
    }

    return { message: 'Successfully logged out' };
  }

  async logoutAll(user: User) {
    await this.refreshTokenService.revokeAllTokensForUser(user.id);
    return { message: 'Logged out from all devices' };
  }
}
