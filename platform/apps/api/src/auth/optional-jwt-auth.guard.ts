import {
  CanActivate,
  ExecutionContext,
  Injectable
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

/**
 * OptionalJwtAuthGuard validates the JWT token if one is present,
 * but does NOT block requests that lack a token.
 *
 * This is used for endpoints that both guests and authenticated
 * users can access (e.g. carts). If a valid token is present,
 * request.user is populated for downstream ownership checks.
 * If no token or an invalid token is present, the request
 * continues with request.user undefined.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      // No token — allow as anonymous
      return true;
    }

    const token = authHeader.slice("Bearer ".length);
    try {
      const payload = jwt.verify(
        token,
        getJwtSecret(this.configService, "JWT_ACCESS_SECRET")
      ) as AuthenticatedUser;
      request.user = payload;
    } catch {
      // Invalid/expired token — proceed as anonymous rather than rejecting.
      // This lets guest carts continue to work even if a stale token
      // is sent by a formerly-authenticated user.
    }

    return true;
  }
}