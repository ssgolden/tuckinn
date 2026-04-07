import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AuthenticatedUser } from "./auth.types";

type RequestWithUser = {
  headers: {
    authorization?: string;
  };
  user?: AuthenticatedUser;
};

const jwt: {
  verify: (token: string, secret: string) => unknown;
} = require("jsonwebtoken");

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
        this.configService.get<string>("JWT_ACCESS_SECRET") || "replace-me"
      ) as AuthenticatedUser;
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid access token.");
    }
  }
}
