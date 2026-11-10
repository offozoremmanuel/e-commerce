export type OtpEmailPurpose = 'signup' | 'password-reset';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]!);
}

export function createOtpEmailTemplate(
  name: string,
  otp: string,
  purpose: OtpEmailPurpose
): EmailTemplate {
  const isSignup = purpose === 'signup';
  const heading = isSignup ? 'Verify your email address' : 'Reset your password';
  const action = isSignup ? 'complete your sign-up' : 'reset your password';
  const safeName = escapeHtml(name);
  const subject = isSignup ? 'Your email verification code' : 'Your password reset code';
  const text = `Hello ${name},\n\nYour one-time code to ${action} is ${otp}. It expires in 10 minutes and can only be used once. If you did not request this, you can ignore this email.\n\nDo not share this code with anyone.`;

  return {
    subject,
    text,
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b">
    <main style="max-width:520px;margin:0 auto;padding:32px;background:#fff;border-radius:12px">
      <h1 style="font-size:22px">${heading}</h1>
      <p>Hello ${safeName},</p>
      <p>Use this one-time code to ${action}:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:8px">${otp}</p>
      <p>This code expires in 10 minutes and can only be used once.</p>
      <p>If you did not request this, you can ignore this email. Do not share this code with anyone.</p>
    </main>
  </body>
</html>`
  };
}
