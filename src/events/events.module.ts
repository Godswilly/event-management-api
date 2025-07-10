import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventReminderService } from './event-reminder/event-reminder.service';
import { AppEmailModule } from 'src/email/email.module';

@Module({
  imports: [PrismaModule, AppEmailModule],
  controllers: [EventsController],
  providers: [EventsService, EventReminderService],
  exports: [EventsService],
})
export class EventsModule {}
