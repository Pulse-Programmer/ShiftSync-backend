import nodemailer from 'nodemailer';
import { config } from '../config';

const smtpConfigured = !!(config.smtp.host && config.smtp.user && config.smtp.pass);

let transporter: nodemailer.Transporter | null = null;

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    console.log(`[EMAIL FALLBACK] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, err);
  }
}

// --- Email templates ---

function wrapHtml(body: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
      ${body}
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="font-size: 12px; color: #888;">This email was sent by ShiftSync. Please do not reply directly.</p>
    </div>
  `;
}

export async function sendNotificationEmail(
  to: string,
  title: string,
  message: string
): Promise<void> {
  const html = wrapHtml(`
    <h2 style="margin: 0 0 8px; font-size: 18px;">${title}</h2>
    <p style="margin: 0; font-size: 14px; line-height: 1.5;">${message}</p>
  `);
  await sendEmail(to, `ShiftSync: ${title}`, html);
}

export async function sendInvitationEmail(
  to: string,
  role: string,
  token: string,
  expiresAt: Date
): Promise<void> {
  const inviteLink = `${config.corsOrigin}/accept-invite?token=${token}`;
  const html = wrapHtml(`
    <h2 style="margin: 0 0 12px; font-size: 18px;">You're Invited to ShiftSync</h2>
    <p style="margin: 0 0 8px; font-size: 14px;">You've been invited to join as a <strong>${role}</strong>.</p>
    <p style="margin: 0 0 20px; font-size: 14px;">Click the button below to accept your invitation and create your account:</p>
    <a href="${inviteLink}" style="display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Accept Invitation</a>
    <p style="margin: 16px 0 0; font-size: 12px; color: #888;">This invitation expires on ${expiresAt.toLocaleDateString()}.</p>
    <p style="margin: 8px 0 0; font-size: 12px; color: #888;">If the button doesn't work, copy this link: ${inviteLink}</p>
  `);
  await sendEmail(to, 'You\'re Invited to ShiftSync', html);
}
