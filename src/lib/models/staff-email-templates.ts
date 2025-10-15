import {
  EmailRecipient,
  EmailTemplate,
  MessagingService,
} from "../core/messaging-services";

export class StaffEmailService {
  private messagingService: MessagingService;

  constructor() {
    this.messagingService = new MessagingService();
  }

  async sendStaffInvitationEmail(params: {
    to: string;
    storeName: string;
    storeType: "physical" | "virtual";
    roleName: string;
    inviterName: string;
    invitationToken: string;
    expiresAt: Date;
    customMessage?: string;
  }): Promise<boolean> {
    const {
      to,
      storeName,
      storeType,
      roleName,
      inviterName,
      invitationToken,
      expiresAt,
      customMessage,
    } = params;

    const storeTypeLabel =
      storeType === "physical" ? "Physical Store" : "Virtual Store";
    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitationToken}`;
    const expiryDate = expiresAt.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const template: EmailTemplate = {
      subject: `You've been invited to join ${storeName}`,
      html: this.generateInvitationHTML(
        storeName,
        storeTypeLabel,
        roleName,
        inviterName,
        acceptUrl,
        expiryDate,
        customMessage
      ),
      text: this.generateInvitationText(
        storeName,
        storeTypeLabel,
        roleName,
        inviterName,
        acceptUrl,
        expiryDate,
        customMessage
      ),
    };

    const recipient: EmailRecipient = {
      email: to,
      name: undefined, // Name not available for invitations
      userId: undefined, // Will be looked up by MessagingService
    };

    try {
      const success = await this.messagingService.sendTransactionalEmail(
        [recipient],
        template
      );

      if (success) {
        console.log(`Staff invitation email sent successfully to ${to}`);
      } else {
        console.error(`Failed to send staff invitation email to ${to}`);
      }

      return success;
    } catch (error) {
      console.error("Error sending staff invitation email:", error);
      return false;
    }
  }

  async sendStaffWelcomeEmail(params: {
    to: string;
    userName: string;
    storeName: string;
    storeType: "physical" | "virtual";
    roleName: string;
    dashboardUrl: string;
  }): Promise<boolean> {
    const { to, userName, storeName, storeType, roleName, dashboardUrl } =
      params;
    const storeTypeLabel =
      storeType === "physical" ? "Physical Store" : "Virtual Store";

    const template: EmailTemplate = {
      subject: `Welcome to ${storeName}! 🎉`,
      html: `
<!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600;">
                        🎉 Welcome Aboard!
                      </h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; font-size: 18px; line-height: 1.6; color: #111827;">
                        Hi ${userName},
                      </p>
                      
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                        Welcome to the <strong>${storeName}</strong> team! We're excited to have you on board as our <strong>${roleName}</strong>.
                      </p>

                      <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #374151;">
                        You now have access to the store dashboard where you can start managing your responsibilities.
                      </p>

                      <!-- Getting Started Box -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 8px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 24px;">
                            <h2 style="margin: 0 0 16px; color: #1e40af; font-size: 20px;">Getting Started</h2>
                            <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                              <li style="margin-bottom: 12px; font-size: 15px;">Access your store dashboard</li>
                              <li style="margin-bottom: 12px; font-size: 15px;">Review your role permissions</li>
                              <li style="margin-bottom: 12px; font-size: 15px;">Familiarize yourself with store operations</li>
                              <li style="margin-bottom: 0; font-size: 15px;">Connect with your team members</li>
                            </ul>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
                              Go to Dashboard
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">
                        If you have any questions, don't hesitate to reach out to your store administrator.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                        © ${new Date().getFullYear()} IkazeStores. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
`,
      text: `
Welcome to ${storeName}!

Hi ${userName},

Welcome to the ${storeName} team! We're excited to have you on board as our ${roleName}.

You now have access to the store dashboard where you can start managing your responsibilities.

Getting Started:
- Access your store dashboard
- Review your role permissions
- Familiarize yourself with store operations
- Connect with your team members

Visit your dashboard: ${dashboardUrl}

If you have any questions, don't hesitate to reach out to your store administrator.
`,
    };

    const recipient: EmailRecipient = {
      email: to,
      name: userName,
    };

    return await this.messagingService.sendTransactionalEmail(
      [recipient],
      template
    );
  }

  async sendStaffRemovedEmail(params: {
    to: string;
    userName: string;
    storeName: string;
    reason?: string;
  }): Promise<boolean> {
    const { to, userName, storeName, reason } = params;

    const template: EmailTemplate = {
      subject: `Update regarding your role at ${storeName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background-color: #f3f4f6; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">
                        Role Update Notification
                      </h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                        Hi ${userName},
                      </p>
                      
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                        We wanted to inform you that your staff role at <strong>${storeName}</strong> has been updated, and you no longer have access to the store dashboard.
                      </p>

                      ${
                        reason
                          ? `
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
                          <tr>
                            <td style="padding: 16px;">
                              <p style="margin: 0; font-size: 14px; color: #92400e;">
                                <strong>Reason:</strong> ${reason}
                              </p>
                            </td>
                          </tr>
                        </table>
                      `
                          : ""
                      }

                      <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6; color: #374151;">
                        Thank you for your contributions to ${storeName}. If you have any questions about this change, please reach out to the store administrator.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                        © ${new Date().getFullYear()} IkazeStores. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        `,
      text: `
        Role Update Notification

Hi ${userName},

We wanted to inform you that your staff role at ${storeName} has been updated, and you no longer have access to the store dashboard.

${reason ? `Reason: ${reason}` : ""}

Thank you for your contributions to ${storeName}. If you have any questions about this change, please reach out to the store administrator.
        `,
    };

    const recipient: EmailRecipient = {
      email: to,
      name: userName,
    };

    return await this.messagingService.sendTransactionalEmail(
      [recipient],
      template
    );
  }

  async sendRoleChangeEmail(params: {
    to: string;
    userName: string;
    storeName: string;
    oldRoleName: string;
    newRoleName: string;
  }): Promise<boolean> {
    const { to, userName, storeName, oldRoleName, newRoleName } = params;

    const template: EmailTemplate = {
      subject: `Your role at ${storeName} has been updated`,
      html: `
      <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                        🔄 Role Updated
                      </h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                        Hi ${userName},
                      </p>
                      
                      <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #374151;">
                        Your role at <strong>${storeName}</strong> has been updated.
                      </p>

                      <!-- Role Change Box -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
                        <tr>
                          <td style="padding: 24px; text-align: center;">
                            <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">Previous Role</p>
                            <p style="margin: 0; font-size: 18px; color: #9ca3af; text-decoration: line-through;">${oldRoleName}</p>
                            
                            <div style="margin: 20px 0;">
                              <span style="font-size: 24px;">↓</span>
                            </div>
                            
                            <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">New Role</p>
                            <p style="margin: 0; font-size: 24px; color: #8b5cf6; font-weight: 600;">${newRoleName}</p>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #374151;">
                        Your permissions and responsibilities have been updated according to your new role. Please log in to review your new access level.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                        © ${new Date().getFullYear()} IkazeStores. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
Your role at ${storeName} has been updated

Hi ${userName},

Your role at ${storeName} has been updated.

Previous Role: ${oldRoleName}
New Role: ${newRoleName}

Your permissions and responsibilities have been updated according to your new role. Please log in to review your new access level.
      `,
    };

    const recipient: EmailRecipient = {
      email: to,
      name: userName,
    };

    return await this.messagingService.sendTransactionalEmail(
      [recipient],
      template
    );
  }

  private generateInvitationHTML(
    storeName: string,
    storeTypeLabel: string,
    roleName: string,
    inviterName: string,
    acceptUrl: string,
    expiryDate: string,
    customMessage?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                      🎉 You're Invited!
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                      Hi there,
                    </p>
                    
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                      <strong>${inviterName}</strong> has invited you to join <strong>${storeName}</strong> as a team member.
                    </p>

                    <!-- Invitation Details Box -->
                    <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280; font-weight: 600;">INVITATION DETAILS</p>
                      <p style="margin: 5px 0; font-size: 15px; color: #374151;"><strong>Store:</strong> ${storeName}</p>
                      <p style="margin: 5px 0; font-size: 15px; color: #374151;"><strong>Store Type:</strong> ${storeTypeLabel}</p>
                      <p style="margin: 5px 0; font-size: 15px; color: #374151;"><strong>Your Role:</strong> ${roleName}</p>
                      <p style="margin: 5px 0; font-size: 15px; color: #374151;"><strong>Invited By:</strong> ${inviterName}</p>
                    </div>

                    ${
                      customMessage
                        ? `
                    <!-- Custom Message -->
                    <div style="background-color: #eff6ff; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="margin: 0 0 10px; font-size: 14px; color: #1e40af; font-weight: 600;">MESSAGE FROM ${inviterName.toUpperCase()}</p>
                      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1e3a8a;">${customMessage}</p>
                    </div>
                    `
                        : ""
                    }

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 40px 0;">
                      <a href="${acceptUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        Accept Invitation
                      </a>
                    </div>

                    <!-- Expiry Warning -->
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #92400e;">
                        ⏰ <strong>Important:</strong> This invitation expires on <strong>${expiryDate}</strong>
                      </p>
                    </div>

                    <!-- Fallback Link -->
                    <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                      If you're unable to click the button above, copy and paste this link into your browser:
                    </p>
                    <p style="margin: 10px 0; font-size: 13px; color: #2563eb; word-break: break-all;">
                      ${acceptUrl}
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">
                      If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private generateInvitationText(
    storeName: string,
    storeTypeLabel: string,
    roleName: string,
    inviterName: string,
    acceptUrl: string,
    expiryDate: string,
    customMessage?: string
  ): string {
    return `
You've been invited to join ${storeName}

Hi there,

${inviterName} has invited you to join ${storeName} as a team member.

INVITATION DETAILS:
- Store: ${storeName}
- Store Type: ${storeTypeLabel}
- Your Role: ${roleName}
- Invited By: ${inviterName}

${
  customMessage
    ? `\nMESSAGE FROM ${inviterName.toUpperCase()}:\n${customMessage}\n`
    : ""
}

Accept your invitation by clicking this link:
${acceptUrl}

IMPORTANT: This invitation expires on ${expiryDate}

If you didn't expect this invitation, you can safely ignore this email.
    `.trim();
  }
}
