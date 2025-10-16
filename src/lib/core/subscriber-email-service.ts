import { StoreSubscribersModel } from "../models/store-subscribers-model";
import { VirtualStore } from "../models/virtual-store";
import { VirtualStoreTypes } from "../types";
import { EmailTemplate, MessagingService } from "./messaging-services";

interface BulkEmailResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

export class SubscriberEmailService extends MessagingService {
  constructor() {
    super();
  }

  private get storeModel() {
    return new VirtualStore();
  }

  private get subscribersModel() {
    return new StoreSubscribersModel();
  }

  async sendWelcomeEmail(
    storeId: string,
    subscriberEmail: string
  ): Promise<boolean> {
    try {
      const store = await this.storeModel.findById(storeId, {});
      if (!store) return false;

      const template = this.getWelcomeEmailTemplate(store, subscriberEmail);

      return await this.sendViaResend(
        subscriberEmail,
        template.subject,
        template.html
      );
    } catch (error) {
      console.error("Error sending welcome email:", error);
      return false;
    }
  }

  async sendMarketingEmail(
    storeId: string,
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<BulkEmailResult> {
    const result: BulkEmailResult = {
      success: true,
      sent: 0,
      failed: 0,
      errors: [],
    };

    try {
      const subscribers = await this.subscribersModel.getStoreSubscribers(
        storeId,
        {
          activeOnly: true,
          limit: 100,
        }
      );

      const marketingSubscribers = subscribers.documents.filter(
        (sub) => sub.preferences?.marketing !== false
      );

      // Send emails in batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < marketingSubscribers.length; i += batchSize) {
        const batch = marketingSubscribers.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (subscriber) => {
            try {
              const htmlWithUnsubscribe = this.addUnsubscribeLink(
                htmlContent,
                storeId,
                subscriber.userId
              );

              // Use inherited sendViaResend method
              const success = await this.sendViaResend(
                subscriber.email,
                subject,
                htmlWithUnsubscribe
              );

              if (success) {
                result.sent++;
              } else {
                result.failed++;
                result.errors.push(`Failed to send to ${subscriber.email}`);
              }
            } catch (error) {
              result.failed++;
              result.errors.push(
                `Error sending to ${subscriber.email}: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`
              );
            }
          })
        );

        // Rate limiting delay between batches
        if (i + batchSize < marketingSubscribers.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      result.success = result.failed === 0;
      return result;
    } catch (error) {
      console.error("Error sending bulk marketing email:", error);
      result.success = false;
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error"
      );
      return result;
    }
  }

  async sendPromotionAnnouncement(
    storeId: string,
    promotionTitle: string,
    promotionDetails: string,
    discountCode?: string,
    expiryDate?: Date
  ): Promise<BulkEmailResult> {
    try {
      const store = await this.storeModel.findById(storeId, {});
      if (!store) {
        return {
          success: false,
          sent: 0,
          failed: 0,
          errors: ["Store not found"],
        };
      }

      const template = this.getPromotionEmailTemplate(
        store,
        promotionTitle,
        promotionDetails,
        discountCode,
        expiryDate
      );

      const subscribers = await this.subscribersModel.getStoreSubscribers(
        storeId,
        { activeOnly: true, limit: 100 }
      );

      const promotionSubscribers = subscribers.documents.filter(
        (sub) => sub.preferences?.promotions !== false
      );

      return await this.sendToSubscribers(
        storeId,
        promotionSubscribers.map((s) => ({ email: s.email, userId: s.userId })),
        template
      );
    } catch (error) {
      console.error("Error sending promotion announcement:", error);
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  private async sendToSubscribers(
    storeId: string,
    subscribers: Array<{ email: string; userId: string }>,
    template: EmailTemplate
  ): Promise<BulkEmailResult> {
    const result: BulkEmailResult = {
      success: true,
      sent: 0,
      failed: 0,
      errors: [],
    };

    const batchSize = 50;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (subscriber) => {
          try {
            const htmlWithUnsubscribe = this.addUnsubscribeLink(
              template.html,
              storeId,
              subscriber.userId
            );

            // Use inherited sendViaResend method
            const success = await this.sendViaResend(
              subscriber.email,
              template.subject,
              htmlWithUnsubscribe
            );

            if (success) {
              result.sent++;
            } else {
              result.failed++;
              result.errors.push(`Failed to send to ${subscriber.email}`);
            }
          } catch (error) {
            result.failed++;
            result.errors.push(
              `Error sending to ${subscriber.email}: ${
                error instanceof Error ? error.message : "Unknown"
              }`
            );
          }
        })
      );

      // Rate limiting
      if (i + batchSize < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    result.success = result.failed === 0;
    return result;
  }

  private getWelcomeEmailTemplate(
    store: VirtualStoreTypes,
    subscriberEmail: string
  ): EmailTemplate {
    return {
      subject: `Welcome to ${store.storeName}! 🎉`,
      html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px 8px 0 0; }
                        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
                        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to ${store.storeName}!</h1>
                        </div>
                        <div class="content">
                            <p>Hi there! 👋</p>
                            <p>Thank you for subscribing to ${
                              store.storeName
                            }. We're thrilled to have you as part of our community!</p>
                            ${
                              store.storeBio
                                ? `<p><em>${store.storeBio}</em></p>`
                                : ""
                            }
                            <p><strong>As a subscriber, you'll get:</strong></p>
                            <ul>
                                <li>🎁 Exclusive deals and promotions</li>
                                <li>🆕 Early access to new products</li>
                                <li>📦 Order updates and shipping notifications</li>
                                <li>💎 Special member-only offers</li>
                            </ul>
                            <center>
                                <a href="${
                                  process.env.NEXT_PUBLIC_APP_URL
                                }/store/${store.$id}" class="button">
                                    Start Shopping
                                </a>
                            </center>
                        </div>
                        <div class="footer">
                            <p>You're receiving this email because you subscribed to ${
                              store.storeName
                            }</p>
                            <p><a href="${
                              process.env.NEXT_PUBLIC_APP_URL
                            }/unsubscribe/${store.$id}">Unsubscribe</a></p>
                        </div>
                    </div>
                </body>
                </html>
            `,
      text: `Welcome to ${store.storeName}! Thank you for subscribing. Visit us at ${process.env.NEXT_PUBLIC_APP_URL}/store/${store.$id}`,
    };
  }

  private addUnsubscribeLink(
    html: string,
    storeId: string,
    userId: string
  ): string {
    const unsubscribeLink = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe/${storeId}?userId=${userId}`;
    return (
      html +
      `
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 12px; color: #666;">
                    Don't want these emails? <a href="${unsubscribeLink}">Unsubscribe</a>
                </p>
            </div>
        `
    );
  }

  private getPromotionEmailTemplate(
    store: VirtualStoreTypes,
    title: string,
    details: string,
    code?: string,
    expiry?: Date
  ): EmailTemplate {
    return {
      subject: `🎉 ${title} - ${store.storeName}`,
      html: `
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #667eea; border-radius: 8px;">
                        <h2 style="color: #667eea; text-align: center;">🎉 ${title}</h2>
                        <p>${details}</p>
                        ${
                          code
                            ? `
                            <div style="text-align: center; margin: 30px 0;">
                                <p style="font-size: 14px; margin-bottom: 10px;">Use code:</p>
                                <div style="display: inline-block; padding: 15px 30px; background: #f0f0f0; border: 2px dashed #667eea; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
                                    ${code}
                                </div>
                            </div>
                        `
                            : ""
                        }
                        ${
                          expiry
                            ? `<p style="text-align: center; color: #ff6b6b;"><strong>Expires: ${expiry.toLocaleDateString()}</strong></p>`
                            : ""
                        }
                        <center>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/store/${
        store.$id
      }" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                                Shop Now
                            </a>
                        </center>
                    </div>
                </body>
                </html>
            `,
    };
  }
}
