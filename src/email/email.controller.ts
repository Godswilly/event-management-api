import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  async sendTest(@Body('email') email: string) {
    await this.emailService.sendTestEmail(email);
    return { message: 'Test email sent successfully!' };
  }
}
