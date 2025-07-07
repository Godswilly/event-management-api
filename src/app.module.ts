import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import config from './config';
import { validationSchema } from './config/validation.schema';
import { EventsModule } from './events/events.module';
import { AppEmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
      validationSchema,
      envFilePath: [
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
        '.env.local',
        '.env',
      ],
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    PrismaModule,
    EventsModule,
    AppEmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
