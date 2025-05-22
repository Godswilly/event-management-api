import { Role } from '@prisma/client';

export interface RequestWithUser extends Request {
  user: {
    id: number;
    role: Role | null;
  };
}
