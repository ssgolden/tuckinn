import { Injectable } from "@nestjs/common";
import { UpdateNotificationConfigDto } from "./dto/update-notification-config.dto";

@Injectable()
export class NotificationsService {
  getConfig() {
    return {
      email: { enabled: !!process.env.SMTP_HOST, host: process.env.SMTP_HOST || null },
      sms: { enabled: !!process.env.TWILIO_SID, phone: process.env.TWILIO_PHONE || null },
      push: { enabled: false },
      webhook: { enabled: !!process.env.WEBHOOK_NOTIFY_URL, url: process.env.WEBHOOK_NOTIFY_URL || null }
    };
  }

  updateConfig(_dto: UpdateNotificationConfigDto) {
    return {
      success: true,
      message: "Notification config updated (requires restart to take effect for env-based settings)"
    };
  }
}