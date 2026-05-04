import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AuthenticatedUser } from "./auth.types";
import { getJwtSecret } from "./jwt-secret.util";

type RequestWithUser = {
  headers: {
    authorization?: string;
  };
  user?: AuthenticatedUser;
};

import jwt from "jsonwebtoken";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    const token = authHeader.slice("Bearer ".length);
    try {
      const payload = jwt.verify(
        token,
        getJwtSecret(this.configService, "JWT_ACCESS_SECRET")
      ) as AuthenticatedUser;
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid access token.");
    }
  }
}
