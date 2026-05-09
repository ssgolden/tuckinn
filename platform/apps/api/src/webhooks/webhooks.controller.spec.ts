import { WebhooksController } from "./webhooks.controller";

describe("WebhooksController", () => {
  it("passes rawBody and x-sumup-signature to PaymentsService", async () => {
    const paymentsService = {
      processSumUpWebhook: jest.fn().mockResolvedValue({ received: true })
    } as unknown as import("../payments/payments.service").PaymentsService;

    const webhooksService = { getConfig: jest.fn(), updateConfig: jest.fn() } as never;
    const controller = new WebhooksController(paymentsService, webhooksService);
    const rawBody = Buffer.from(JSON.stringify({ event_type: "CHECKOUT_STATUS_CHANGED", id: "checkout_123" }));

    await expect(
      controller.handleSumUpWebhook({ rawBody }, "sig_123")
    ).resolves.toEqual({ received: true });

    expect(paymentsService.processSumUpWebhook).toHaveBeenCalledWith(rawBody, "sig_123");
  });
});
