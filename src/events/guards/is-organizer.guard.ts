import { Role } from '@prisma/client';
import { EventsService } from './../events.service';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class IsOrganizerGuard implements CanActivate {
  constructor(private readonly eventsService: EventsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id || !user?.role) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === Role.ADMIN) return true;

    const eventId = parseInt(request.params.id, 10);
    if (isNaN(eventId)) {
      throw new BadRequestException('Invalid event ID');
    }

    await this.eventsService.isUserEventOwner(eventId, user.id);

    return true;
  }
}
