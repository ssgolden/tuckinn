import {
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import {
  AuthSessionStatus,
  RoleCode,
  UserStatus,
  type User
} from "../../src/generated/prisma/index.js";
import { PrismaService } from "../prisma/prisma.service";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from "./auth.constants";
import type { AuthenticatedUser, TokenPair } from "./auth.types";
import { CustomerRegisterDto } from "./dto/customer-register.dto";
import { LoginDto } from "./dto/login.dto";

const jwt: {
  sign: (payload: object, secret: string, options?: { expiresIn?: number }) => string;
  verify: (token: string, secret: string) => unknown;
} = require("jsonwebtoken");

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async registerCustomer(dto: CustomerRegisterDto, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() }
    });

    if (existing) {
      throw new ConflictException("Email already registered.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.ensureRole(RoleCode.customer);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        status: UserStatus.active,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone?.trim(),
        customerProfile: {
          create: {}
        },
        roles: {
          create: [
            {
              role: {
                connect: { code: RoleCode.customer }
              }
            }
          ]
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    const tokens = await this.createSession(user, this.extractRoles(user), ipAddress, userAgent);
    return {
      user: this.serializeUser(user),
      ...tokens
    };
  }

  async loginCustomer(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user || !this.extractRoles(user).includes(RoleCode.customer)) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    await this.assertPassword(user, dto.password);
    const tokens = await this.createSession(user, this.extractRoles(user), ipAddress, userAgent);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      user: this.serializeUser(user),
      ...tokens
    };
  }

  async loginStaff(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        staffProfile: true
      }
    });

    const roles = user ? this.extractRoles(user) : [];
    const staffRoles: RoleCode[] = [RoleCode.owner, RoleCode.admin, RoleCode.manager, RoleCode.staff];
    const isStaffRole = roles.some(role => staffRoles.includes(role));

    if (!user || !user.staffProfile || !isStaffRole) {
      throw new UnauthorizedException("Invalid staff credentials.");
    }

    await this.assertPassword(user, dto.password);
    const tokens = await this.createSession(user, roles, ipAddress, userAgent);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      user: this.serializeUser(user),
      ...tokens
    };
  }

  async refreshSession(refreshToken: string, ipAddress?: string, userAgent?: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    if (!session || session.status !== AuthSessionStatus.active || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Refresh session is invalid.");
    }

    const valid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!valid) {
      throw new UnauthorizedException("Refresh token is invalid.");
    }

    const tokens = await this.issueTokens({
      sub: session.user.id,
      email: session.user.email,
      roles: this.extractRoles(session.user),
      sessionId: session.id
    });

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: await bcrypt.hash(tokens.refreshToken, 12),
        userAgent: userAgent ?? session.userAgent,
        ipAddress: ipAddress ?? session.ipAddress
      }
    });

    return {
      user: this.serializeUser(session.user),
      ...tokens
    };
  }

  async logout(sessionId: string) {
    await this.prisma.authSession.update({
      where: { id: sessionId },
      data: {
        status: AuthSessionStatus.revoked,
        revokedAt: new Date()
      }
    });

    return { success: true };
  }

  private async createSession(
    user: Pick<User, "id" | "email" | "firstName" | "lastName" | "status"> & { phone?: string | null },
    roles: RoleCode[],
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenPair> {
    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: "pending",
        status: AuthSessionStatus.active,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000)
      }
    });

    const payload: AuthenticatedUser = {
      sub: user.id,
      email: user.email,
      roles,
      sessionId: session.id
    };

    const tokens = await this.issueTokens(payload);

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: await bcrypt.hash(tokens.refreshToken, 12)
      }
    });

    return tokens;
  }

  private async issueTokens(payload: AuthenticatedUser): Promise<TokenPair> {
    const accessSecret = this.configService.get<string>("JWT_ACCESS_SECRET") || "replace-me";
    const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET") || "replace-me";

    const [accessToken, refreshToken] = await Promise.all([
      Promise.resolve(
        jwt.sign(payload, accessSecret, {
          expiresIn: ACCESS_TOKEN_TTL_SECONDS
        })
      ),
      Promise.resolve(
        jwt.sign(payload, refreshSecret, {
          expiresIn: REFRESH_TOKEN_TTL_SECONDS
        })
      )
    ]);

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<AuthenticatedUser> {
    try {
      return jwt.verify(
        refreshToken,
        this.configService.get<string>("JWT_REFRESH_SECRET") || "replace-me"
      ) as AuthenticatedUser;
    } catch {
      throw new UnauthorizedException("Refresh token is invalid.");
    }
  }

  private async assertPassword(user: Pick<User, "passwordHash" | "status">, password: string) {
    if (user.status !== UserStatus.active) {
      throw new UnauthorizedException("User is not active.");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials.");
    }
  }

  private extractRoles(user: {
    roles: Array<{ role: { code: RoleCode } }>;
  }): RoleCode[] {
    return user.roles.map(entry => entry.role.code);
  }

  private serializeUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    status: UserStatus;
    roles?: Array<{ role: { code: RoleCode } }>;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? null,
      status: user.status,
      roles: user.roles?.map(entry => entry.role.code) ?? []
    };
  }

  private async ensureRole(code: RoleCode) {
    await this.prisma.role.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: code.charAt(0).toUpperCase() + code.slice(1)
      }
    });
  }
}
