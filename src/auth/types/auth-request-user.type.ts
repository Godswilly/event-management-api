import { UserRole } from '@prisma/client';

export interface AuthRequestUser {
  id: number;
  role: UserRole;
  isOrganizer: boolean;
  isAttendee: boolean;
  refresh_token_id: number;
}
