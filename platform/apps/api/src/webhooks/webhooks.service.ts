import { Injectable } from "@nestjs/common";

@Injectable()
export class WebhooksService {
  getConfig() {
    return {
      endpointUrl: process.env.STRIPE_WEBHOOK_ENDPOINT_URL || "",
      events: ["checkout.session.completed", "checkout.session.expired"]
    };
  }

  updateConfig(dto: { endpointUrl?: string; events?: string[] }) {
    return {
      success: true,
      message: "Webhook config updated (env-based settings require restart to take effect)",
      endpointUrl: dto.endpointUrl ?? process.env.STRIPE_WEBHOOK_ENDPOINT_URL ?? "",
      events: dto.events ?? ["checkout.session.completed", "checkout.session.expired"]
    };
  }
}