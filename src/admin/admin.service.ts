import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAllEvents() {
    const events = await this.prisma.event.findMany({
      include: {
        _count: {
          select: { registrations: true },
        },
        organizer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
      capacity: event.capacity,
      registrations: event._count.registrations,
      organizer: event.organizer,
    }));
  }

  async getAllRegistrations() {
    const registrations = await this.prisma.eventRegistration.findMany({
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
        event: {
          select: { id: true, title: true, startDate: true, status: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return registrations.map((reg) => ({
      id: reg.id,
      createdAt: reg.createdAt,
      user: reg.user,
      event: reg.event,
      reminderSentAt: reg.reminderSentAt,
    }));
  }
}
