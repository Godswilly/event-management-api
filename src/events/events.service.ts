import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventFilterDto } from './dto/event-filter.dto';
import { Prisma } from '@prisma/client';

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
}
