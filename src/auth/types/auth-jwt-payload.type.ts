import { UserRole } from '@prisma/client';

export type AuthJwtPayload = {
  sub: number;
  role: UserRole;
  refresh_token_id: number;
};
