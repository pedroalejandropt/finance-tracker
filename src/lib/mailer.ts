import nodemailer from 'nodemailer';

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!isSmtpConfigured()) return;

  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: 'Reset your Financial Tracker password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
          Reset Password
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:13px;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  if (!isSmtpConfigured()) return;

  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: 'Verify your Financial Tracker email',
    html: `
      <p>Thanks for registering with Financial Tracker.</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours.</p>
      <p>If you did not create an account, you can safely ignore this email.</p>
    `,
    text: `Thanks for registering with Financial Tracker.\n\nPlease verify your email address by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you did not create an account, you can safely ignore this email.`,
  });
}
