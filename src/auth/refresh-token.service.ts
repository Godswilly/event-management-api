import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async storeRefreshToken(
    user: User,
    refreshToken: string,
    expiresAt: Date,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    const hashedToken = await argon2.hash(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
        ip,
        userAgent,
      },
    });
  }

  async findValidToken(userId: number, refreshToken: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revoked: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (tokens.length === 0) {
      throw new UnauthorizedException(
        'No valid refresh token found for this user.',
      );
    }

    for (const tokenRecord of tokens) {
      if (await argon2.verify(tokenRecord.token, refreshToken)) {
        return tokenRecord;
      }
    }

    return null;
  }

  async revokeTokenById(id: number): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revoked: true },
    });
  }

  async revokeAllTokensForUser(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });
  }
}
