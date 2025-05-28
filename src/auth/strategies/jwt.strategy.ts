import {
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { AuthJwtPayload } from '../types/auth-jwt-payload.type.ts';
import { UsersService } from 'src/users/users.service';

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

  async validate(payload: AuthJwtPayload) {
    let user;
    try {
      user = await this.usersService.findUserById(payload.sub);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException(
          'Authentication failed: User not found or invalid token.',
        );
      }
      throw error;
    }

    const isOrganizer = await this.usersService.hasCreatedEvents(user.id);
    const isAttendee = await this.usersService.hasRegisteredForEvents(user.id);

    return {
      id: user.id,
      role: user.role,
      isOrganizer,
      isAttendee,
    };
  }
}
