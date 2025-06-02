import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventFilterDto } from './dto/event-filter.dto';

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
    return this.prisma.event.findMany({
      where: {
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

        ...(filter?.tag?.trim() && {
          tag: {
            has: filter.tag.trim(),
          },
        }),

        ...(filter?.status && {
          status: filter.status,
        }),

        ...(filter?.organizerId && {
          organizerId: filter.organizerId,
        }),

        //If the client sends a startDateFrom or startDateTo filter,
        //use them to construct a range filter on the actual startDate field in the Event model.
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

        //If the client sends a capacityMin or capacityMax filter,
        //use them to construct a range filter on the actual capacity field in the Event model.
        ...(filter?.capacityMin || filter?.capacityMax
          ? {
              capacity: {
                ...(filter?.capacityMin != undefined && {
                  gte: filter.capacityMin,
                }),
                ...(filter?.capacityMax != undefined && {
                  lte: filter.capacityMax,
                }),
              },
            }
          : {}),
      },
      orderBy: {
        startDate: 'asc',
      },
    });
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

  async updateEvent(
    eventId: number,
    updateEventDto: UpdateEventDto,
    userId: number,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new NotFoundException('Event not found');

    if (event.organizerId != userId) {
      throw new ForbiddenException('You are not the organizer of this event');
    }
    return this.prisma.event.update({
      where: { id: eventId },
      data: updateEventDto,
    });
  }

  async deleteEvent(eventId: number, userId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new NotFoundException('Event not found');

    if (event.organizerId !== userId) {
      throw new ForbiddenException('You are not the organizer of this event');
    }

    return this.prisma.event.delete({ where: { id: eventId } });
  }
}
