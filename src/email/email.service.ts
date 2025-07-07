import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestjsMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly emailService: NestjsMailerService) {}

  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, any>,
  ): Promise<void> {
    try {
      await this.emailService.sendMail({
        to,
        subject,
        template: templateName,
        context,
      });
      this.logger.log(
        `Email sent successfully to ${to} with template ${templateName}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to} with template ${templateName}:`,
        error.stack,
      );
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  async sendTestEmail(to: string): Promise<void> {
    await this.sendEmail(
      to,
      'Test Email from Event System',
      'test',
      {
        name: 'Test User',
        date: new Date().toDateString(),
      },
    );
  }
}
