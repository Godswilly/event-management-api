import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigType } from '@nestjs/config';
import refreshJwtConfig from '../config/refresh-jwt.config';
import { RefreshTokenService } from '../refresh-token.service';
import { AuthJwtPayload } from '../types/auth-jwt-payload.type.ts';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
    private readonly refreshTokenService: RefreshTokenService,
  ) {
    const secret = refreshJwtConfiguration.secret;
    if (!secret) {
      throw new Error('JWT secret is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: AuthJwtPayload) {
    const refreshToken = req
      .get('Authorization')
      ?.replace('Bearer ', '')
      .trim();
    const ip = req.ip;
    const userAgent = req.get('user-agent') || '';

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const stored = await this.refreshTokenService.findValidToken(
      payload.sub,
      refreshToken,
    );

    if (!stored) {
      throw new UnauthorizedException('Refresh token is invalid or revoked');
    }

    return {
      id: payload.sub,
      role: payload.role,
      ip,
      userAgent,
    };
  }
}
