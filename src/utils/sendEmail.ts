import { env } from '../config/environment.js';
import { HttpError } from './httpError.js';
import { createOtpEmailTemplate, type OtpEmailPurpose } from './emailTemplates.js';

interface EmailMessage {
  to: string;
  name: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME } = env;
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL || !BREVO_SENDER_NAME) {
    throw new HttpError('Email delivery is not configured.', 503, 'EMAIL_NOT_CONFIGURED');
  }

  let response: Response;
  try {
    response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
        to: [{ email: message.to, name: message.name }],
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text
      }),
      signal: AbortSignal.timeout(10_000)
    });
  } catch {
    throw new HttpError('The email provider could not be reached.', 502, 'EMAIL_DELIVERY_FAILED');
  }

  if (!response.ok) {
    throw new HttpError('The email provider rejected the message.', 502, 'EMAIL_DELIVERY_FAILED');
  }
}

export async function sendOtpEmail(
  recipient: { email: string; fullName: string },
  otp: string,
  purpose: OtpEmailPurpose
): Promise<void> {
  const template = createOtpEmailTemplate(recipient.fullName, otp, purpose);
  await sendEmail({
    to: recipient.email,
    name: recipient.fullName,
    ...template
  });
}
