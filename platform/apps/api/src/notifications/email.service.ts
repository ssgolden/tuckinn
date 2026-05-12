import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import sendgrid from "@sendgrid/mail";

export interface EmailTemplateData {
  [key: string]: string | number | boolean | undefined;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  templateId?: string;
  html?: string;
  text?: string;
  from?: string;
  fromName?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isDev: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("SENDGRID_API_KEY");
    this.fromEmail = this.configService.get<string>("FROM_EMAIL") || "noreply@tuckinn.local";
    this.fromName = this.configService.get<string>("FROM_NAME") || "Tuckinn Proper";
    this.isDev = this.configService.get<string>("NODE_ENV") !== "production";

    if (apiKey) {
      sendgrid.setApiKey(apiKey);
      this.logger.log("SendGrid initialized");
    } else {
      this.logger.warn("SENDGRID_API_KEY not set - emails will be logged only");
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const msg = {
      to: options.to,
      from: {
        email: options.from || this.fromEmail,
        name: options.fromName || this.fromName,
      },
      subject: options.subject,
      html: options.html,
      text: options.text,
      templateId: options.templateId,
      attachments: options.attachments,
    };

    if (this.isDev || !this.configService.get("SENDGRID_API_KEY")) {
      // In dev or without API key, just log
      this.logger.log(`[EMAIL] To: ${options.to}, Subject: ${options.subject}`);
      if (options.text) {
        this.logger.debug(`[EMAIL BODY] ${options.text.substring(0, 200)}...`);
      }
      return;
    }

    try {
      await sendgrid.send(msg);
      this.logger.log(`Email sent to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: "Welcome to Tuckinn Proper!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <header style="background: #b91c1c; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Tuckinn Proper</h1>
          </header>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>Welcome, ${firstName}! 🎉</h2>
            <p>Thanks for joining Tuckinn Proper. You're now part of our community of sandwich lovers.</p>
            <p>With your account, you can:</p>
            <ul>
              <li>Order faster with saved details</li>
              <li>View your order history</li>
              <li>Earn loyalty points with every order</li>
              <li>Get exclusive offers</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tuckinn.local" 
                 style="background: #b91c1c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Start Ordering
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Have questions? Reply to this email or contact us at support@tuckinn.local
            </p>
          </div>
          <footer style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>© 2026 Tuckinn Proper. All rights reserved.</p>
          </footer>
        </div>
      `,
      text: `Welcome to Tuckinn Proper, ${firstName}!\n\nThanks for joining. You can now order faster and earn loyalty points.\n\nVisit us at https://tuckinn.local`,
    });
  }

  async sendOrderConfirmation(email: string, orderDetails: {
    orderNumber: string;
    totalAmount: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    customerName: string;
  }): Promise<void> {
    const itemsHtml = orderDetails.items
      .map(item => `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${item.price.toFixed(2)}</td>
      </tr>`)
      .join("");

    await this.sendEmail({
      to: email,
      subject: `Order Confirmation #${orderDetails.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <header style="background: #b91c1c; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Order Confirmed! ✅</h1>
          </header>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hi ${orderDetails.customerName},</p>
            <p>Thanks for your order! We've received it and will start preparing it soon.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Order #${orderDetails.orderNumber}</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f5f5f5;">
                    <th style="padding: 8px; text-align: left;">Item</th>
                    <th style="padding: 8px; text-align: center;">Qty</th>
                    <th style="padding: 8px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr style="font-weight: bold; border-top: 2px solid #333;">
                    <td colspan="2" style="padding: 8px;">Total</td>
                    <td style="padding: 8px; text-align: right;">€${orderDetails.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              We'll notify you when your order is ready for pickup/delivery.
            </p>
          </div>
          <footer style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>© 2026 Tuckinn Proper. All rights reserved.</p>
          </footer>
        </div>
      `,
      text: `Order Confirmed #${orderDetails.orderNumber}!\n\nHi ${orderDetails.customerName},\n\nThanks for your order. Total: €${orderDetails.totalAmount.toFixed(2)}\n\nWe'll notify you when it's ready.`,
    });
  }

  async sendAbandonedCartEmail(email: string, firstName: string, cartLink: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: "You left something delicious behind... 🥪",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <header style="background: #b91c1c; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Still hungry? 🍽️</h1>
          </header>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hi ${firstName},</p>
            <p>Looks like you left some items in your cart. Don't worry, we've saved them for you!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${cartLink}" 
                 style="background: #b91c1c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Complete Your Order
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Your cart expires in 24 hours, so don't wait too long!
            </p>
          </div>
        </div>
      `,
      text: `Hi ${firstName},\n\nYou left items in your cart. Complete your order here: ${cartLink}`,
    });
  }

  async sendReviewRequest(email: string, firstName: string, orderNumber: string, reviewLink: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: "How was your Tuckinn Proper experience?",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <header style="background: #b91c1c; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">How was it? 🤔</h1>
          </header>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hi ${firstName},</p>
            <p>Thanks for ordering from Tuckinn Proper! We'd love to hear how everything was.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewLink}" 
                 style="background: #b91c1c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Leave a Review
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Your feedback helps us serve you better!
            </p>
          </div>
        </div>
      `,
      text: `Hi ${firstName},\n\nThanks for your order #${orderNumber}! Leave a review: ${reviewLink}`,
    });
  }
}
