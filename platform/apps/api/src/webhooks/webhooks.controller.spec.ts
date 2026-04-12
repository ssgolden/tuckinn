import { WebhooksController } from "./webhooks.controller";

describe("WebhooksController", () => {
  it("passes rawBody and stripe-signature to PaymentsService", async () => {
    const paymentsService = {
      processStripeWebhook: jest.fn().mockResolvedValue({ received: true })
    } as any;

    const controller = new WebhooksController(paymentsService);
    const rawBody = Buffer.from("payload");

    await expect(
      controller.handleStripeWebhook({ rawBody }, "sig_123")
    ).resolves.toEqual({ received: true });

    expect(paymentsService.processStripeWebhook).toHaveBeenCalledWith(rawBody, "sig_123");
  });
});
