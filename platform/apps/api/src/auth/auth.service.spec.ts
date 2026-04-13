import { ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthSessionStatus, RoleCode, UserStatus } from "../../src/generated/prisma/index.js";
import { AuthService } from "./auth.service";

function makePrisma(overrides: Record<string, any> = {}) {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    authSession: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    },
    role: {
      upsert: jest.fn()
    },
    $transaction: jest.fn(),
    ...overrides
  };
}

function makeConfigService() {
  return {
    get: jest.fn((key: string) => {
      if (key === "JWT_ACCESS_SECRET") return "test-access-secret";
      if (key === "JWT_REFRESH_SECRET") return "test-refresh-secret";
      return null;
    })
  } as unknown as ConfigService;
}

function userWithRoles(overrides: Record<string, any> = {}) {
  return {
    id: "user-1",
    email: "test@example.com",
    passwordHash: "$2a$12$hashed",
    status: UserStatus.active,
    firstName: "Test",
    lastName: "User",
    phone: null,
    roles: [{ role: { code: RoleCode.customer } }],
    ...overrides
  };
}

describe("AuthService", () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  let configService: ConfigService;

  beforeEach(() => {
    prisma = makePrisma();
    configService = makeConfigService();
    service = new AuthService(prisma as never, configService);
  });

  describe("registerCustomer", () => {
    it("throws ConflictException if email already exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "existing-user" });

      await expect(
        service.registerCustomer({
          email: "taken@example.com",
          password: "password1",
          firstName: "A",
          lastName: "B"
        })
      ).rejects.toThrow(ConflictException);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "taken@example.com" }
      });
    });

    it("creates a user with hashed password, customer profile, and role, then returns tokens", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.upsert.mockResolvedValue({});
      const createdUser = userWithRoles({ roles: [{ role: { code: RoleCode.customer } }] });
      prisma.user.create.mockResolvedValue(createdUser);
      prisma.authSession.create.mockResolvedValue({ id: "session-1" });
      prisma.authSession.update.mockResolvedValue({});

      const result = await service.registerCustomer({
        email: "new@example.com",
        password: "password1",
        firstName: "New",
        lastName: "User"
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "new@example.com",
            status: UserStatus.active
          })
        })
      );

      // Password should be hashed, not stored plaintext
      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe("password1");

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("lowercases the email before storing", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.upsert.mockResolvedValue({});
      prisma.user.create.mockResolvedValue(userWithRoles());
      prisma.authSession.create.mockResolvedValue({ id: "session-1" });
      prisma.authSession.update.mockResolvedValue({});

      await service.registerCustomer({
        email: "MixedCase@Example.COM",
        password: "password1",
        firstName: "A",
        lastName: "B"
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "mixedcase@example.com" }
      });
    });
  });

  describe("loginCustomer", () => {
    it("throws UnauthorizedException if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.loginCustomer({ email: "noone@example.com", password: "password1" })
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException if user has no customer role", async () => {
      prisma.user.findUnique.mockResolvedValue(
        userWithRoles({ roles: [{ role: { code: RoleCode.staff } }] })
      );

      await expect(
        service.loginCustomer({ email: "staff@example.com", password: "password1" })
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException if password is wrong", async () => {
      const hash = await bcrypt.hash("correct-password", 4);
      prisma.user.findUnique.mockResolvedValue(
        userWithRoles({ passwordHash: hash })
      );

      await expect(
        service.loginCustomer({ email: "test@example.com", password: "wrong-password" })
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException if user is not active", async () => {
      const hash = await bcrypt.hash("password1", 4);
      prisma.user.findUnique.mockResolvedValue(
        userWithRoles({ passwordHash: hash, status: UserStatus.disabled })
      );

      await expect(
        service.loginCustomer({ email: "test@example.com", password: "password1" })
      ).rejects.toThrow("User is not active.");
    });

    it("returns user and tokens on successful login", async () => {
      const hash = await bcrypt.hash("password1", 4);
      const user = userWithRoles({ passwordHash: hash });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.authSession.create.mockResolvedValue({ id: "session-1" });
      prisma.authSession.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      const result = await service.loginCustomer({
        email: "test@example.com",
        password: "password1"
      });

      expect(result.user.email).toBe("test@example.com");
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: { lastLoginAt: expect.any(Date) }
        })
      );
    });
  });

  describe("loginStaff", () => {
    it("throws UnauthorizedException if user has no staff role", async () => {
      prisma.user.findUnique.mockResolvedValue(
        userWithRoles({
          roles: [{ role: { code: RoleCode.customer } }],
          staffProfile: null
        })
      );

      await expect(
        service.loginStaff({ email: "customer@example.com", password: "password1" })
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException if user has no staff profile", async () => {
      prisma.user.findUnique.mockResolvedValue(
        userWithRoles({
          roles: [{ role: { code: RoleCode.manager } }],
          staffProfile: null
        })
      );

      await expect(
        service.loginStaff({ email: "manager@example.com", password: "password1" })
      ).rejects.toThrow(UnauthorizedException);
    });

    it("returns tokens for valid staff login", async () => {
      const hash = await bcrypt.hash("password1", 4);
      prisma.user.findUnique.mockResolvedValue(
        userWithRoles({
          passwordHash: hash,
          roles: [{ role: { code: RoleCode.admin } }],
          staffProfile: { id: "sp-1" }
        })
      );
      prisma.authSession.create.mockResolvedValue({ id: "session-2" });
      prisma.authSession.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      const result = await service.loginStaff({
        email: "admin@example.com",
        password: "password1"
      });

      expect(result.accessToken).toBeDefined();
    });
  });

  describe("refreshSession", () => {
    it("throws UnauthorizedException for expired or invalid JWT", async () => {
      await expect(
        service.refreshSession("invalid-token")
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException if session is not active", async () => {
      const payload = { sub: "user-1", email: "test@example.com", roles: [RoleCode.customer], sessionId: "session-1" };
      const refreshToken = jwt.sign(payload, "test-refresh-secret", { expiresIn: "7d" });

      prisma.authSession.findUnique.mockResolvedValue({
        id: "session-1",
        status: AuthSessionStatus.revoked,
        expiresAt: new Date(Date.now() + 86400000),
        refreshTokenHash: await bcrypt.hash(refreshToken, 4),
        user: userWithRoles()
      });

      await expect(
        service.refreshSession(refreshToken)
      ).rejects.toThrow("Refresh session is invalid.");
    });

    it("throws UnauthorizedException if refresh token hash does not match", async () => {
      const payload = { sub: "user-1", email: "test@example.com", roles: [RoleCode.customer], sessionId: "session-1" };
      const refreshToken = jwt.sign(payload, "test-refresh-secret", { expiresIn: "7d" });

      prisma.authSession.findUnique.mockResolvedValue({
        id: "session-1",
        status: AuthSessionStatus.active,
        expiresAt: new Date(Date.now() + 86400000),
        refreshTokenHash: await bcrypt.hash("different-token", 4),
        user: userWithRoles()
      });

      await expect(
        service.refreshSession(refreshToken)
      ).rejects.toThrow("Refresh token is invalid.");
    });

    it("returns new tokens on valid refresh", async () => {
      const payload = { sub: "user-1", email: "test@example.com", roles: [RoleCode.customer], sessionId: "session-1" };
      const refreshToken = jwt.sign(payload, "test-refresh-secret", { expiresIn: "7d" });

      prisma.authSession.findUnique.mockResolvedValue({
        id: "session-1",
        status: AuthSessionStatus.active,
        expiresAt: new Date(Date.now() + 86400000),
        refreshTokenHash: await bcrypt.hash(refreshToken, 4),
        user: userWithRoles()
      });
      prisma.authSession.update.mockResolvedValue({});

      const result = await service.refreshSession(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(prisma.authSession.update).toHaveBeenCalled();
    });
  });

  describe("changePassword", () => {
    it("throws UnauthorizedException if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword("nonexistent", {
          currentPassword: "old",
          newPassword: "newpassword1"
        })
      ).rejects.toThrow("User not found");
    });

    it("throws UnauthorizedException if current password is wrong", async () => {
      const hash = await bcrypt.hash("correct-old-password", 4);
      prisma.user.findUnique.mockResolvedValue(
        userWithRoles({ passwordHash: hash })
      );

      await expect(
        service.changePassword("user-1", {
          currentPassword: "wrong-old-password",
          newPassword: "newpassword1"
        })
      ).rejects.toThrow("Current password is incorrect");
    });

    it("updates password and revokes all active sessions on success", async () => {
      const oldHash = await bcrypt.hash("oldpassword", 4);
      prisma.user.findUnique.mockResolvedValue(
        userWithRoles({ passwordHash: oldHash })
      );
      prisma.user.update.mockResolvedValue({});
      prisma.authSession.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.changePassword("user-1", {
        currentPassword: "oldpassword",
        newPassword: "newpassword1"
      });

      expect(result).toEqual({ success: true });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: { passwordHash: expect.any(String) }
        })
      );
      expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", status: AuthSessionStatus.active },
        data: { status: AuthSessionStatus.revoked }
      });

      // New hash should differ from old
      const newHash = prisma.user.update.mock.calls[0][0].data.passwordHash;
      expect(newHash).not.toBe(oldHash);
    });
  });

  describe("logout", () => {
    it("marks session as revoked", async () => {
      prisma.authSession.update.mockResolvedValue({});

      const result = await service.logout("session-1");

      expect(result).toEqual({ success: true });
      expect(prisma.authSession.update).toHaveBeenCalledWith({
        where: { id: "session-1" },
        data: {
          status: AuthSessionStatus.revoked,
          revokedAt: expect.any(Date)
        }
      });
    });
  });

  describe("forgotPassword / resetPassword", () => {
    it("forgotPassword returns success even for unknown emails (prevents enumeration)", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword("unknown@example.com");

      expect(result).toEqual({ success: true });
      expect(prisma.authSession.create).not.toHaveBeenCalled();
    });

    it("forgotPassword creates a reset session for known user", async () => {
      prisma.user.findUnique.mockResolvedValue(userWithRoles());
      prisma.authSession.create.mockResolvedValue({ id: "reset-session-id" });

      const result = await service.forgotPassword("test@example.com");

      expect(result).toEqual({ success: true });
      expect(prisma.authSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            userAgent: "password-reset",
            status: AuthSessionStatus.active
          })
        })
      );
    });

    it("resetPassword throws NotFoundException for invalid token", async () => {
      prisma.authSession.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword("bad-token", "newpassword1")
      ).rejects.toThrow(NotFoundException);
    });

    it("resetPassword throws if token was already used", async () => {
      prisma.authSession.findUnique.mockResolvedValue({
        id: "reset-1",
        userAgent: "password-reset",
        status: AuthSessionStatus.revoked,
        expiresAt: new Date(Date.now() + 3600000)
      });

      await expect(
        service.resetPassword("reset-1", "newpassword1")
      ).rejects.toThrow("Reset token has already been used.");
    });

    it("resetPassword throws if token has expired", async () => {
      prisma.authSession.findUnique.mockResolvedValue({
        id: "reset-1",
        userAgent: "password-reset",
        status: AuthSessionStatus.active,
        expiresAt: new Date(Date.now() - 1000)
      });

      await expect(
        service.resetPassword("reset-1", "newpassword1")
      ).rejects.toThrow("Reset token has expired.");
    });

    it("resetPassword updates password and revokes sessions on success", async () => {
      prisma.authSession.findUnique.mockResolvedValue({
        id: "reset-1",
        userId: "user-1",
        userAgent: "password-reset",
        status: AuthSessionStatus.active,
        expiresAt: new Date(Date.now() + 3600000)
      });

      const txOperations: any[] = [];
      prisma.$transaction = jest.fn(async (ops: any[]) => {
        // ops is an array of Prisma operations - just resolve them
        for (const op of ops) op;
        return {};
      });

      // Mock the individual operations used inside $transaction
      prisma.user.update.mockResolvedValue({});
      prisma.authSession.update.mockResolvedValue({});
      prisma.authSession.updateMany.mockResolvedValue({});

      // The service uses this.prisma.$transaction with an array of operations
      // We need to allow the array form to work
      const result = await service.resetPassword("reset-1", "newpassword1");

      expect(result).toEqual({ success: true });
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});