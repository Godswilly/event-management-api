import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { AuthJwtPayload } from '../types/auth-jwt-payload.type';
import { UsersService } from 'src/users/users.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    jwtConfiguration: ConfigType<typeof jwtConfig>,
    private usersService: UsersService,
  ) {
    const secret = jwtConfiguration.secret;
    if (!secret) {
      throw new Error('JWT secret is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: AuthJwtPayload): Promise<{
    id: number;
    role: UserRole;
    isOrganizer: boolean;
    isAttendee: boolean;
  }> {
    const user = await this.usersService.findUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException(
        'Authentication failed: User not found or Invalid token.',
      );
    }

    const [isOrganizer, isAttendee] = await Promise.all([
      this.usersService.hasCreatedEvents(user.id),
      this.usersService.hasRegisteredForEvents(user.id),
    ]);

    return {
      id: user.id,
      role: user.role,
      isOrganizer,
      isAttendee,
    };
  }
}
