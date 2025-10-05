import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { HashService } from './hash.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { JwtService } from '@nestjs/jwt';
import { UserRole, User } from '@prisma/client';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthJwtPayload } from './types/auth-jwt-payload.type';
import refreshJwtConfig from './config/refresh-jwt.config';
import { ConfigType } from '@nestjs/config';
import { RefreshTokenService } from './refresh-token.service';
import { randomBytes } from 'crypto';
import { RefreshToken } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly refreshTokenService: RefreshTokenService,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
  ) {}

  async registerUser(data: RegisterUserDto): Promise<User> {
    const hashedPassword = await this.hashService.hashPassword(data.password);
    return this.usersService.createUser({
      email: data.email,
      username: data.username,
      password: hashedPassword,
    });
  }

  async registerAdmin(data: AdminRegisterDto): Promise<User> {
    const hashedPassword = await this.hashService.hashPassword(data.password);
    return this.usersService.createUser({
      email: data.email,
      username: data.username,
      role: UserRole.ADMIN,
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
      refresh_token_id: 0,
    };

    const refreshToken = await this.jwtService.signAsync(
      payload,
      this.refreshTokenConfig,
    );

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const storedToken: { refreshTokenId: number; token: string } =
      await this.refreshTokenService.storeRefreshToken(
        user,
        refreshToken,
        expiresAt,
        ip,
        userAgent,
      );

    payload.refresh_token_id = storedToken.refreshTokenId;

    const newAccessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
    });

    return {
      access_token: newAccessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      user,
    };
  }

  async refresh(
    user: { id: number; role: UserRole; refresh_token_id: number },
    currentRefreshToken: string,
    ip?: string,
    userAgent?: string,
  ) {
    const fullUser = await this.usersService.findUserById(user.id);

    const storedRefreshToken: RefreshToken | null =
      await this.refreshTokenService.findValidToken(
        fullUser.id,
        currentRefreshToken,
      );
    if (!storedRefreshToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.refreshTokenService.revokeTokenById(storedRefreshToken.id);

    const payload: AuthJwtPayload = {
      sub: fullUser.id,
      role: user.role,
      refresh_token_id: 0,
    };

    const newRefreshToken = await this.jwtService.signAsync(
      payload,
      this.refreshTokenConfig,
    );
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const storedToken = await this.refreshTokenService.storeRefreshToken(
      fullUser,
      newRefreshToken,
      expiresAt,
      ip,
      userAgent,
    );

    payload.refresh_token_id = storedToken.refreshTokenId;

    const newAccessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      user: fullUser,
    };
  }

  async logout(user: { id: number; role: UserRole; refresh_token_id: number }) {
    if (!user.refresh_token_id) {
      throw new UnauthorizedException('Refresh token ID is missing');
    }
    await this.refreshTokenService.revokeTokenById(user.refresh_token_id);
    return { message: 'Successfully logged out' };
  }

  async logoutAll(user: { id: number; role: UserRole }) {
    await this.refreshTokenService.revokeAllTokensForUser(user.id);
    return { message: 'Logged out from all devices' };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) return;

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: { used: true },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    await this.emailService.sendEmail(
      user.email,
      'Password Reset Request',
      'password-reset',

      {
        username: user.username,
        resetLink: `http://localhost:3000/reset-password?token=${token}`,
        expires: expiresAt.toLocaleString(),
      },
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await this.hashService.hashPassword(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),

      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);
  }
}
