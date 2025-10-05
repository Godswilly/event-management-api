import { AuthRequestUser } from 'src/auth/types/auth-request-user.type';

declare module 'express' {
  interface Request {
    user?: AuthRequestUser;
  }
}
