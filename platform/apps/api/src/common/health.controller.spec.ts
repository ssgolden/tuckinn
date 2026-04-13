import { HttpException, HttpStatus } from "@nestjs/common";
import { HealthController, ReadinessController } from "./health.controller";

describe("HealthController", () => {
  it("returns ok when database is connected", async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }])
    };

    const controller = new HealthController(prisma as never);

    const result = await controller.getHealth();

    expect(result).toEqual({ status: "ok", database: "connected" });
  });

  it("returns error when database is disconnected", async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error("connection refused"))
    };

    const controller = new HealthController(prisma as never);

    const result = await controller.getHealth();

    expect(result).toEqual({ status: "error", database: "disconnected" });
  });
});

describe("ReadinessController", () => {
  it("returns ok when database is connected", async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }])
    };

    const controller = new ReadinessController(prisma as never);

    const result = await controller.getReadiness();

    expect(result).toEqual({ status: "ok", database: "connected" });
  });

  it("throws SERVICE_UNAVAILABLE when database is disconnected", async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error("connection refused"))
    };

    const controller = new ReadinessController(prisma as never);

    try {
      await controller.getReadiness();
      fail("Expected HttpException to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect((error as HttpException).getResponse()).toEqual({
        status: "error",
        database: "disconnected"
      });
    }
  });
});