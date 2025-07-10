import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addHours, format } from 'date-fns';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventRegistration } from '@prisma/client';

type ReminderRegistration = EventRegistration & {
  user: { email: string; username: string };
  event: { title: string; startDate: Date; location: string };
};

@Injectable()
export class EventReminderService {
  private readonly logger = new Logger(EventReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleEventReminders() {
    this.logger.log('Starting event reminder scan...');

    try {
      const now = new Date();
      const windowStart = addHours(now, 23);
      const windowEnd = addHours(now, 25);

      this.logger.log(
        `Scanning for events between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`,
      );

      const registrations: ReminderRegistration[] =
        await this.prisma.eventRegistration.findMany({
          where: {
            reminderSentAt: null,
            event: {
              startDate: {
                gte: windowStart,
                lte: windowEnd,
              },
            },
          },
          include: {
            user: { select: { email: true, username: true } },
            event: { select: { title: true, startDate: true, location: true } },
          },
        });

      if (registrations.length === 0) {
        this.logger.log(
          'No registrations found needing reminders in this window.',
        );
        return;
      }

      this.logger.log(`Found ${registrations.length} registrations to remind.`);

      for (const registration of registrations) {
        await this.sendReminder(registration);
      }

      this.logger.log('Event reminder scan complete.');
    } catch (overallError) {
      this.logger.error(
        `Unhandled error during Event Reminder Cron Job: ${overallError.message}`,
        overallError.stack,
      );
    }
  }

  private async sendReminder(
    registration: ReminderRegistration,
  ): Promise<void> {
    const { user, event } = registration;

    if (
      !user?.email ||
      !user?.username ||
      !event?.title ||
      !event?.startDate ||
      !event?.location
    ) {
      this.logger.warn(
        `Skipping reminder for incomplete registration data (Registration ID: ${registration.id})`,
      );
      return;
    }

    try {
      await this.emailService.sendEmail(
        user.email,
        `Reminder: "${event.title}" is coming up`,
        'event-reminder',
        {
          name: user.username,
          eventTitle: event.title,
          eventDate: format(event.startDate, 'MMM dd, yyyy'),
          eventTime: format(event.startDate, 'HH:mm'),
          location: event.location,
        },
      );

      await this.prisma.eventRegistration.update({
        where: {
          eventId_userId: {
            eventId: registration.eventId,
            userId: registration.userId,
          },
        },
        data: { reminderSentAt: new Date() },
      });

      this.logger.log(
        `Sent reminder to ${user.email} for event "${event.title}".`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send reminder to ${user.email} for event "${event.title}": ${err.message}`,
        err.stack,
      );
    }
  }
}
