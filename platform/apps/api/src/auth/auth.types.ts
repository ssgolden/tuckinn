import type { RoleCode } from "../generated/prisma";

export type AuthenticatedUser = {
  sub: string;
  email: string;
  roles: RoleCode[];
  sessionId: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};
