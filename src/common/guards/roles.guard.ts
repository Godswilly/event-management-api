import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';
import { BehavioralRole } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndMerge<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    const { role: staticRole, isOrganizer, isAttendee } = user;

    // Check for static ADMIN role
    if (requiredRoles.includes(Role.ADMIN) && staticRole === Role.ADMIN) {
      return true;
    }

    // Check for behavioral roles
    if (requiredRoles.includes(BehavioralRole.ORGANIZER) && isOrganizer) {
      return true;
    }

    if (requiredRoles.includes(BehavioralRole.ATTENDEE) && isAttendee) {
      return true;
    }

    throw new ForbiddenException('Access denied: insufficient role');
  }
}
