import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';

export function extractBearerTokenOrThrow(req: Request): string {
  const authHeader = req.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Invalid or missing Authorization header');
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    throw new UnauthorizedException('Bearer token is empty');
  }

  return token;
}
