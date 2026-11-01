import dotenv from 'dotenv';
dotenv.config();

import nodemailer, { Transporter } from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface WelcomeCredentialsParams {
  email: string;
  name: string;
  username: string;
  password: string;
  roleName: string;
  branchName?: string | null;
  restaurantName?: string | null;
  loginUrl?: string;
}

interface PasswordResetParams {
  email: string;
  name: string;
  username: string;
  newPassword: string;
  loginUrl?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  public isReady(): boolean {
    if (!this.isConfigured) {
      this.initTransporter();
    }
    return this.isConfigured;
  }

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    if (user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
          tls: {
            rejectUnauthorized: false, // Prevents self-signed cert blocks in dev/stage
          },
        });
        this.isConfigured = true;
        console.log(`[EmailService] SMTP transporter initialized with host: ${host}:${port} (${user})`);
      } catch (err) {
        console.warn('[EmailService] Failed to initialize nodemailer transporter. Fallback to simulation mode:', err);
        this.transporter = null;
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
      console.log('[EmailService] SMTP credentials not provided in .env. Running in console simulation mode.');
    }
  }

  public async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; simulated?: boolean; message: string }> {
    if (!this.isConfigured || !this.transporter) {
      this.initTransporter();
    }

    const from = process.env.EMAIL_FROM || '"Yoni Restaurant RMS" <yohanistesfa457@gmail.com>';

    if (!this.isConfigured || !this.transporter) {
      this.logSimulatedEmail(options.to, options.subject, options.text || options.html);
      return {
        success: true,
        simulated: true,
        message: 'SMTP not configured in .env. Email printed to server logs.',
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text || options.subject,
        html: options.html,
      });

      console.log(`[EmailService] Email successfully sent to ${options.to}. MessageId: ${info.messageId}`);
      return {
        success: true,
        simulated: false,
        message: `Email sent to ${options.to}`,
      };
    } catch (err: any) {
      console.error(`[EmailService] Failed to send email to ${options.to} via SMTP:`, err?.message || err);
      // Fallback: log to console so the admin/user is not stranded
      this.logSimulatedEmail(options.to, options.subject, options.text || options.html, true);
      return {
        success: false,
        simulated: true,
        message: `SMTP error: ${err?.message || 'Failed to dispatch email'}. Preview logged to server console.`,
      };
    }
  }

  private logSimulatedEmail(to: string, subject: string, content: string, wasFallback: boolean = false) {
    const divider = '━'.repeat(72);
    console.log('\n' + divider);
    console.log(`✉️  ${wasFallback ? '⚠️  [SMTP FALLBACK SIMULATION]' : '🚀 [EMAIL SIMULATION (DEV MODE)]'}`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Time:    ${new Date().toLocaleString()}`);
    console.log(divider);
    // Strip HTML tags for clean console display if text isn't separated
    const cleanText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(cleanText.slice(0, 400) + (cleanText.length > 400 ? '...' : ''));
    console.log(divider + '\n');
  }

  public async sendWelcomeCredentials(params: WelcomeCredentialsParams) {
    const loginUrl = params.loginUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    const restaurantName = params.restaurantName || 'Yoni Restaurant';
    const branchName = params.branchName || 'Main Branch';

    const subject = `Welcome to ${restaurantName} - Your Staff Portal Credentials`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Account Credentials</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 36px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
          ${restaurantName}
        </h1>
        <p style="color: #94a3b8; margin: 0; font-size: 14px; font-weight: 500;">
          Restaurant Management System
        </p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 36px;">
        <h2 style="color: #0f172a; font-size: 19px; margin-top: 0; margin-bottom: 12px;">
          Hello ${params.name},
        </h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
          Your staff account has been successfully created. You can now log in to the Restaurant Management System using the credentials below:
        </p>

        <!-- Credentials Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 28px;">
          <tr>
            <td style="padding: 20px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="6">
                <tr>
                  <td width="35%" style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Assigned Role:</td>
                  <td width="65%" style="color: #0f172a; font-size: 14px; font-weight: 600;">
                    <span style="background-color: #e0e7ff; color: #4338ca; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; display: inline-block;">
                      ${params.roleName}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Branch:</td>
                  <td style="color: #0f172a; font-size: 14px; font-weight: 500;">${branchName}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Email / Login:</td>
                  <td style="color: #0f172a; font-size: 14px; font-weight: 600;">${params.email}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Username:</td>
                  <td style="color: #0f172a; font-size: 14px; font-weight: 500;">${params.username}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Temporary Password:</td>
                  <td style="color: #0f172a; font-size: 14px; font-weight: 700;">
                    <code style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; color: #0284c7;">
                      ${params.password}
                    </code>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <a href="${loginUrl}" target="_blank" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.25);">
                Log In to Staff Portal &rarr;
              </a>
            </td>
          </tr>
        </table>

        <!-- Security Warning -->
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 4px; margin-top: 24px;">
          <p style="color: #b45309; font-size: 13px; line-height: 1.5; margin: 0;">
            <strong>Important Security Notice:</strong> For your security, please change your password after logging in for the first time via your profile settings. Do not share your temporary credentials with anyone.
          </p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 36px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0 0 4px 0;">This is an automated system notification from ${restaurantName} RMS.</p>
        <p style="margin: 0;">If you were not expecting this email, please contact your restaurant manager.</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Welcome to ${restaurantName} RMS!

Hello ${params.name},
Your staff account has been created.

Account Details:
- Role: ${params.roleName}
- Branch: ${branchName}
- Login Email: ${params.email}
- Username: ${params.username}
- Temporary Password: ${params.password}
- Login URL: ${loginUrl}

Please log in and update your password immediately.
    `.trim();

    return this.sendEmail({
      to: params.email,
      subject,
      html,
      text,
    });
  }

  public async sendPasswordResetLink(params: {
    email: string;
    name: string;
    resetUrl: string;
    expiresInMinutes?: number;
  }) {
    const subject = `Reset Your Password - Yoni Restaurant RMS`;
    const expiresIn = params.expiresInMinutes || 15;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 36px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">
          Yoni Restaurant
        </h1>
        <p style="color: #94a3b8; margin: 0; font-size: 14px;">
          Restaurant Management System
        </p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 36px;">
        <h2 style="color: #0f172a; font-size: 19px; margin-top: 0; margin-bottom: 12px;">
          Password Reset Request
        </h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 16px;">
          Hello ${params.name},
        </p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
          We received a request to reset the password for your staff account (<strong>${params.email}</strong>). Click the button below to choose a new password:
        </p>

        <!-- CTA Button -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
          <tr>
            <td align="center">
              <a href="${params.resetUrl}" target="_blank" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
                Reset Password &rarr;
              </a>
            </td>
          </tr>
        </table>

        <!-- Security Expiry Note -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-top: 24px;">
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">
            ⏳ <strong>Security Notice:</strong> This reset link is valid for <strong>${expiresIn} minutes</strong> and can only be used once. If you did not request this password reset, you can safely ignore this email — your password will not be changed.
          </p>
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; word-break: break-all;">
          If the button above does not work, copy and paste this link into your browser:<br/>
          <a href="${params.resetUrl}" style="color: #0284c7; text-decoration: underline;">${params.resetUrl}</a>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 36px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Yoni Restaurant Management System &bull; Automated Security Alert</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Password Reset Request - Yoni Restaurant RMS

Hello ${params.name},
We received a request to reset the password for your staff account (${params.email}).

Click or copy this link into your browser to reset your password:
${params.resetUrl}

This link is valid for ${expiresIn} minutes. If you did not request this, please ignore this email.
    `.trim();

    return this.sendEmail({
      to: params.email,
      subject,
      html,
      text,
    });
  }

  public async sendPasswordChangedAlert(params: { email: string; name: string }) {
    const subject = `Password Changed - Yoni Restaurant RMS`;
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Changed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
    <tr>
      <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Yoni Restaurant RMS</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Password Successfully Updated</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Hello ${params.name}, the password for your staff account was recently updated. You can now log in using your new credentials.
        </p>
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
          <p style="color: #b45309; font-size: 13px; margin: 0;">
            If you did not perform this action, please alert your restaurant manager or system administrator immediately.
          </p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${loginUrl}" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 10px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
            Sign In to Staff Portal &rarr;
          </a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return this.sendEmail({
      to: params.email,
      subject,
      html,
      text: `Hello ${params.name}, the password for your staff account was successfully changed. If you did not make this change, please contact your manager immediately.`,
    });
  }

  public async sendPasswordReset(params: PasswordResetParams) {
    const loginUrl = params.loginUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    const subject = `Your Password Has Been Reset - Yoni Restaurant RMS`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 36px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">
          Yoni Restaurant RMS
        </h1>
        <p style="color: #94a3b8; margin: 0; font-size: 14px;">
          Password Reset Notification
        </p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 36px;">
        <h2 style="color: #0f172a; font-size: 19px; margin-top: 0; margin-bottom: 12px;">
          Hello ${params.name},
        </h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
          Your account password has been reset by an administrator. You can now log in using the new temporary password below:
        </p>

        <!-- Credentials Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 28px;">
          <tr>
            <td style="padding: 20px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="6">
                <tr>
                  <td width="35%" style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Login Email:</td>
                  <td width="65%" style="color: #0f172a; font-size: 14px; font-weight: 600;">${params.email}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Username:</td>
                  <td style="color: #0f172a; font-size: 14px; font-weight: 500;">${params.username}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">New Password:</td>
                  <td style="color: #0f172a; font-size: 14px; font-weight: 700;">
                    <code style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; color: #0284c7;">
                      ${params.newPassword}
                    </code>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <a href="${loginUrl}" target="_blank" style="background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
                Log In Now &rarr;
              </a>
            </td>
          </tr>
        </table>

        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 4px; margin-top: 24px;">
          <p style="color: #991b1b; font-size: 13px; line-height: 1.5; margin: 0;">
            If you did not request this password reset, please notify your manager or system administrator immediately.
          </p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 36px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Yoni Restaurant Management System &bull; Automated Security Alert</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Yoni Restaurant RMS - Password Reset

Hello ${params.name},
Your account password has been reset.

Login Details:
- Email: ${params.email}
- Username: ${params.username}
- New Password: ${params.newPassword}
- Login URL: ${loginUrl}

Please log in and update your password.
    `.trim();

    return this.sendEmail({
      to: params.email,
      subject,
      html,
      text,
    });
  }

  public async sendPasswordResetLink(params: {
    email: string;
    name: string;
    resetUrl: string;
    expiresInMinutes?: number;
  }) {
    const subject = `Reset Your Password - Yoni Restaurant RMS`;
    const expiresIn = params.expiresInMinutes || 15;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 36px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">
          Yoni Restaurant
        </h1>
        <p style="color: #94a3b8; margin: 0; font-size: 14px;">
          Restaurant Management System
        </p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 36px;">
        <h2 style="color: #0f172a; font-size: 19px; margin-top: 0; margin-bottom: 12px;">
          Password Reset Request
        </h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 16px;">
          Hello ${params.name},
        </p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
          We received a request to reset the password for your staff account (<strong>${params.email}</strong>). Click the button below to choose a new password:
        </p>

        <!-- CTA Button -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
          <tr>
            <td align="center">
              <a href="${params.resetUrl}" target="_blank" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
                Reset Password &rarr;
              </a>
            </td>
          </tr>
        </table>

        <!-- Security Expiry Note -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-top: 24px;">
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">
            ⏳ <strong>Security Notice:</strong> This reset link is valid for <strong>${expiresIn} minutes</strong> and can only be used once. If you did not request this password reset, you can safely ignore this email — your password will not be changed.
          </p>
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; word-break: break-all;">
          If the button above does not work, copy and paste this link into your browser:<br/>
          <a href="${params.resetUrl}" style="color: #0284c7; text-decoration: underline;">${params.resetUrl}</a>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 36px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Yoni Restaurant Management System &bull; Automated Security Alert</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Password Reset Request - Yoni Restaurant RMS

Hello ${params.name},
We received a request to reset the password for your staff account (${params.email}).

Click or copy this link into your browser to reset your password:
${params.resetUrl}

This link is valid for ${expiresIn} minutes. If you did not request this, please ignore this email.
    `.trim();

    return this.sendEmail({
      to: params.email,
      subject,
      html,
      text,
    });
  }

  public async sendPasswordChangedAlert(params: { email: string; name: string }) {
    const subject = `Password Changed - Yoni Restaurant RMS`;
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Changed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
    <tr>
      <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Yoni Restaurant RMS</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Password Successfully Updated</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Hello ${params.name}, the password for your staff account was recently updated. You can now log in using your new credentials.
        </p>
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
          <p style="color: #b45309; font-size: 13px; margin: 0;">
            If you did not perform this action, please alert your restaurant manager or system administrator immediately.
          </p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${loginUrl}" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 10px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
            Sign In to Staff Portal &rarr;
          </a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return this.sendEmail({
      to: params.email,
      subject,
      html,
      text: `Hello ${params.name}, the password for your staff account was successfully changed. If you did not make this change, please contact your manager immediately.`,
    });
  }
}

export const emailService = new EmailService();
export default emailService;

