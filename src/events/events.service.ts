import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventFilterDto } from './dto/event-filter.dto';
import {
  EventRegistration,
  EventStatus,
  Prisma,
  User,
  Event,
} from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(createEventDto: CreateEventDto, organizerId: number) {
    return this.prisma.event.create({
      data: {
        ...createEventDto,
        organizerId,
      },
    });
  }

  async getAllEvents(filter?: EventFilterDto) {
    const tagsToFilter = filter?.tags
      ?.map((t) => t.trim())
      .filter((t) => t.length > 0);

    const where: Prisma.EventWhereInput = {
      ...(filter?.title?.trim() && {
        title: {
          contains: filter.title.trim(),
          mode: 'insensitive',
        },
      }),

      ...(filter?.category?.trim() && {
        category: {
          contains: filter.category.trim(),
          mode: 'insensitive',
        },
      }),

      ...(tagsToFilter &&
        tagsToFilter.length > 0 && {
          tags: {
            hasSome: tagsToFilter,
          },
        }),

      ...(filter?.status && {
        status: filter.status,
      }),

      ...(filter?.organizerId && {
        organizerId: filter.organizerId,
      }),

      ...(filter?.startDateFrom || filter?.startDateTo
        ? {
            startDate: {
              ...(filter.startDateFrom && { gte: filter.startDateFrom }),
              ...(filter.startDateTo && { lte: filter.startDateTo }),
            },
          }
        : {}),

      ...(filter?.timeZone?.trim() && {
        timeZone: {
          equals: filter.timeZone.trim(),
        },
      }),

      ...(filter?.capacityMin !== undefined || filter?.capacityMax !== undefined
        ? {
            capacity: {
              ...(filter?.capacityMin !== undefined && {
                gte: filter.capacityMin,
              }),
              ...(filter?.capacityMax !== undefined && {
                lte: filter.capacityMax,
              }),
            },
          }
        : {}),
    };

    const skip = filter?.skip ?? 0;
    const take = filter?.take ?? 10;

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { startDate: 'asc' },
        skip,
        take,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: events,
      meta: {
        total,
        skip,
        take,
        page: Math.floor(skip / take) + 1,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getEventById(eventId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new NotFoundException('Event not found');

    return event;
  }

  async getEventsByOrganizer(organizerId: number) {
    return this.prisma.event.findMany({
      where: { organizerId },
      orderBy: { startDate: 'asc' },
    });
  }

  async isUserEventOwner(eventId: number, userId: number): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizerId !== userId) {
      throw new ForbiddenException('You do not own this event');
    }
  }

  async updateEvent(eventId: number, userId: number, data: UpdateEventDto) {
    await this.isUserEventOwner(eventId, userId);

    return this.prisma.event.update({
      where: { id: eventId },
      data,
    });
  }

  async deleteEvent(eventId: number, userId: number) {
    await this.isUserEventOwner(eventId, userId);

    return this.prisma.event.delete({
      where: { id: eventId },
    });
  }

  async registerForEvent(
    eventId: number,
    userId: number,
  ): Promise<EventRegistration> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true, status: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const allowedRegistrationStatuses: EventStatus[] = [EventStatus.SCHEDULED];

    if (!allowedRegistrationStatuses.includes(event.status)) {
      throw new BadRequestException(
        `This event is not currently open for registration. Current status: ${event.status}`,
      );
    }

    if (event.organizerId === userId) {
      throw new ForbiddenException(
        'Organizers cannot register for their own event',
      );
    }

    try {
      return this.prisma.eventRegistration.create({
        data: {
          eventId,
          userId,
        },
      });
    } catch (error) {
      if (
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes('eventId') &&
        error.meta.target.includes('userId')
      ) {
        throw new ForbiddenException(
          'You have already registered for this event',
        );
      }

      throw error;
    }
  }

  async getRegistrationsByUser(userId: number): Promise<
    (EventRegistration & {
      event: Pick<
        Event,
        'id' | 'title' | 'startDate' | 'endDate' | 'location' | 'status'
      >;
    })[]
  > {
    return this.prisma.eventRegistration.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getEventAttendees(
    eventId: number,
    userId: number,
  ): Promise<
    (EventRegistration & { user: Pick<User, 'id' | 'username' | 'email'> })[]
  > {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAdmin = user?.role === 'ADMIN';
    const isOrganizer = event.organizerId === userId;

    if (!isAdmin && !isOrganizer) {
      throw new ForbiddenException(
        'You are not authorized to view attendees for this event.',
      );
    }

    return this.prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async cancelRegistration(
    eventId: number,
    userId: number,
  ): Promise<EventRegistration> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { status: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    const disallowedStatuses: EventStatus[] = [
      EventStatus.COMPLETED,
      EventStatus.CANCELLED,
    ];

    if (disallowedStatuses.includes(event.status)) {
      throw new BadRequestException(
        `Cannot cancel registration for an event that is "${event.status}".`,
      );
    }

    try {
      return await this.prisma.eventRegistration.delete({
        where: {
          eventId_userId: { eventId, userId },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          'You are not registered for this event, or it has already been cancelled.',
        );
      }
      throw error;
    }
  }

  async isUserRegistered(eventId: number, userId: number): Promise<boolean> {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      select: { id: true },
    });
    return !!registration;
  }
}
