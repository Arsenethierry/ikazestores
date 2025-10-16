"use server";

import { createSafeActionClient } from "next-safe-action";
import { SubscriberEmailService } from "../core/subscriber-email-service";
import { authMiddleware } from "./middlewares";
import z from "zod";
import { checkStoreAccess } from "../helpers/store-permission-helper";

const emailService = new SubscriberEmailService();

const action = createSafeActionClient({
  handleServerError: (error) => {
    console.error("Email campaign action error:", error);
    return error instanceof Error ? error.message : "Something went wrong";
  },
});

export const sendMarketingEmailAction = action
  .use(authMiddleware)
  .schema(
    z.object({
      storeId: z.string().min(1, "Store ID is required"),
      subject: z.string().min(1, "Subject is required").max(200),
      htmlContent: z.string().min(10, "Content is required"),
      textContent: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { storeId, subject, htmlContent, textContent } = parsedInput;
    const { user } = ctx;

    try {
      const hasPermission = await checkStoreAccess(
        user.$id,
        storeId,
        "marketing.send"
      );

      if (!hasPermission) {
        return {
          success: false,
          error:
            "You don't have permission to send marketing emails for this store",
        };
      }

      const result = await emailService.sendMarketingEmail(
        storeId,
        subject,
        htmlContent,
        textContent
      );

      if (!result.success) {
        return {
          success: false,
          error: `Failed to send emails. Sent: ${result.sent}, Failed: ${result.failed}`,
          details: result.errors,
        };
      }

      return {
        success: true,
        message: `Successfully sent ${result.sent} emails`,
        data: {
          sent: result.sent,
          failed: result.failed,
        },
      };
    } catch (error) {
      console.error("Error sending marketing email:", error);
      throw error;
    }
  });

export const sendPromotionAnnouncementAction = action
  .use(authMiddleware)
  .schema(
    z.object({
      storeId: z.string().min(1),
      promotionTitle: z.string().min(1, "Promotion title is required"),
      promotionDetails: z.string().min(1, "Promotion details are required"),
      discountCode: z.string().optional(),
      expiryDate: z.string().datetime().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const {
      storeId,
      promotionTitle,
      promotionDetails,
      discountCode,
      expiryDate,
    } = parsedInput;
    const { user } = ctx;

    try {
      const hasPermission = await checkStoreAccess(
        user.$id,
        storeId,
        "marketing.send"
      );

      if (!hasPermission) {
        return {
          success: false,
          error: "You don't have permission to send promotions for this store",
        };
      }

      const result = await emailService.sendPromotionAnnouncement(
        storeId,
        promotionTitle,
        promotionDetails,
        discountCode,
        expiryDate ? new Date(expiryDate) : undefined
      );

      if (!result.success) {
        return {
          success: false,
          error: `Failed to send promotions. Sent: ${result.sent}, Failed: ${result.failed}`,
        };
      }

      return {
        success: true,
        message: `Promotion sent to ${result.sent} subscribers`,
        data: {
          sent: result.sent,
          failed: result.failed,
        },
      };
    } catch (error) {
      console.error("Error sending promotion:", error);
      throw error;
    }
  });

export const sendWelcomeEmailAction = action
  .use(authMiddleware)
  .schema(
    z.object({
      storeId: z.string().min(1),
      subscriberEmail: z.string().email(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { storeId, subscriberEmail } = parsedInput;
    const { user } = ctx;

    try {
      const hasPermission = await checkStoreAccess(
        user.$id,
        storeId,
        "marketing.send"
      );

      if (!hasPermission) {
        return {
          success: false,
          error: "You don't have permission to send emails for this store",
        };
      }

      const success = await emailService.sendWelcomeEmail(
        storeId,
        subscriberEmail
      );

      if (!success) {
        return {
          success: false,
          error: "Failed to send welcome email",
        };
      }

      return {
        success: true,
        message: "Welcome email sent successfully",
      };
    } catch (error) {
      console.error("Error sending welcome email:", error);
      throw error;
    }
  });

export const previewEmailTemplateAction = action
  .use(authMiddleware)
  .schema(
    z.object({
      storeId: z.string().min(1),
      templateType: z.enum(["welcome", "newProduct", "promotion"]),
      data: z.record(z.any()).optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    // This would return HTML for preview in the dashboard
    // Implementation depends on your needs
    return {
      success: true,
      html: "<h1>Email Preview</h1><p>Coming soon...</p>",
    };
  });
