import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto, organizerId: number) {
    return this.prisma.event.create({
      data: {
        ...createEventDto,
        organizerId,
      },
    });
  }

  async getAllEvents() {
    return this.prisma.event.findMany();
  }

  async getEventById(eventId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new NotFoundException('Event not found');

    return event;
  }

  async getEventsByOrganizer(organizerId: number) {
    return this.prisma.event.findMany({ where: { organizerId } });
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
