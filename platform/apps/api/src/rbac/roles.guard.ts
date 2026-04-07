import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { RoleCode } from "../generated/prisma";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<RoleCode[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass()
      ]) || [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { roles?: RoleCode[] } }>();
    const currentRoles = request.user?.roles || [];
    const allowed = requiredRoles.some(role => currentRoles.includes(role));

    if (!allowed) {
      throw new ForbiddenException("Insufficient role permissions.");
    }

    return true;
  }
}
