import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ParseIdPipe } from 'src/pipes/parse-int-id.pipe';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { BehavioralRole } from 'src/common/enums/role.enum';
import { EventFilterDto } from './dto/event-filter.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  getAllEvents(@Query() filter: EventFilterDto) {
    return this.eventsService.getAllEvents(filter);
  }

  @Get(':id')
  getEventById(@Param('id', ParseIdPipe) id: number) {
    return this.eventsService.getEventById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, BehavioralRole.ORGANIZER)
  @Post()
  createEvent(@Request() req, @Body() createEventDto: CreateEventDto) {
    const userId = req.user.id;

    return this.eventsService.createEvent(createEventDto, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, BehavioralRole.ORGANIZER)
  @Patch(':id')
  updateEvent(
    @Param('id', ParseIdPipe) id: number,
    @Request() req,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    const userId = req.user.id;

    return this.eventsService.updateEvent(id, userId, updateEventDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, BehavioralRole.ORGANIZER)
  @Delete(':id')
  deleteEvent(@Param('id', ParseIdPipe) id: number, @Request() req) {
    const userId = req.user.id;

    return this.eventsService.deleteEvent(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/organizer/mine')
  getMyEvents(@Request() req) {
    const organizerId = req.user.id;

    return this.eventsService.getEventsByOrganizer(organizerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, BehavioralRole.ATTENDEE)
  @Post(':id/register')
  registerForEvent(@Param('id', ParseIdPipe) id: number, @Request() req) {
    const userId = req.user.id;
    return this.eventsService.registerForEvent(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/my-registrations')
  getMyRegistrations(@Request() req) {
    const userId = req.user.id;
    return this.eventsService.getRegistrationsByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:eventId/attendees')
  getEventAttendees(
    @Param('eventId', ParseIdPipe) eventId: number,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.eventsService.getEventAttendees(eventId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:eventId/registration/cancel')
  cancelMyRegistration(
    @Param('eventId', ParseIdPipe) eventId: number,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.eventsService.cancelRegistration(eventId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/is-registered')
  async checkUserRegistration(
    @Param('id', ParseIdPipe) eventId: number,
    @Request() req,
  ) {
    const userId = req.user.id;
    const isRegistered = await this.eventsService.isUserRegistered(
      eventId,
      userId,
    );
    return { registered: isRegistered };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/registration')
  getRegistrationDetails(
    @Param('id', ParseIdPipe) eventId: number,
    @Request() req,
  ) {
    return this.eventsService.getRegistrationDetails(eventId, req.user.id);
  }
}
