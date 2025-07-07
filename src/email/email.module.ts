import { MailerModule as NestjsMailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [
    NestjsMailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProd = configService.get<string>('NODE_ENV') === 'production';

        return {
          transport: isProd
            ? {
                host: configService.get<string>('MAILGUN_SMTP_HOST'),
                port: configService.get<number>('MAILGUN_SMTP_PORT', 587),
                secure: configService.get<boolean>(
                  'MAILGUN_SMTP_SECURE',
                  false,
                ),
                auth: {
                  user: configService.get<string>('MAILGUN_SMTP_USER'),
                  pass: configService.get<string>('MAILGUN_SMTP_PASS'),
                },
              }
            : {
                service: 'gmail',
                auth: {
                  user: configService.get<string>('GMAIL_USER'),
                  pass: configService.get<string>('GMAIL_APP_PASS'),
                },
              },
          defaults: {
            from: '"Event Platform" <no-reply@eventapp.com>',
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class AppEmailModule {}
