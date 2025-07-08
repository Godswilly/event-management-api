import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PasswordResetCleanupService {
  private readonly logger = new Logger(PasswordResetCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanup() {
    this.logger.log('Starting password reset token cleanup...');

    try {
      const result = await this.prisma.passwordResetToken.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: new Date() } }, { used: true }],
        },
      });
      this.logger.log(
        `Password reset cleanup complete. Deleted ${result.count} tokens.`,
      );
    } catch (error) {
      this.logger.error(
        `Error during password reset cleanup: ${error.message}`,
        error.stack,
      );
      this.logger.warn(`Retry or alert may be required: ${error.message}`);
    }
  }
}
