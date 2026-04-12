import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { OrderType } from "../../../src/generated/prisma/index.js";
import { StartCheckoutDto } from "./start-checkout.dto";

function buildDto(overrides: Partial<StartCheckoutDto> = {}) {
  return plainToInstance(StartCheckoutDto, {
    cartId: "550e8400-e29b-41d4-a716-446655440000",
    idempotencyKey: "checkout-key-123",
    orderKind: OrderType.collect,
    customerName: "Test Customer",
    ...overrides
  });
}

describe("StartCheckoutDto", () => {
  it("rejects invalid customerEmail values", async () => {
    const dto = buildDto({ customerEmail: "not-an-email" });

    const errors = await validate(dto);

    expect(errors.some(error => error.property === "customerEmail")).toBe(true);
  });

  it("accepts a valid customerEmail", async () => {
    const dto = buildDto({ customerEmail: "customer@example.com" });

    const errors = await validate(dto);

    expect(errors.some(error => error.property === "customerEmail")).toBe(false);
  });

  it("rejects delivery checkout without a delivery address", async () => {
    const dto = buildDto({ orderKind: OrderType.delivery });

    const errors = await validate(dto);

    expect(errors.some(error => error.property === "deliveryAddress")).toBe(true);
  });

  it("accepts delivery checkout with a complete delivery address", async () => {
    const dto = buildDto({
      orderKind: OrderType.delivery,
      deliveryAddress: {
        line1: "12 Market Street",
        line2: "Flat 3",
        city: "Dublin",
        postcode: "D02 XY12"
      }
    });

    const errors = await validate(dto);

    expect(errors.some(error => error.property === "deliveryAddress")).toBe(false);
  });
});
