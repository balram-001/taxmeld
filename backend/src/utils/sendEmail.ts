import dotenv from 'dotenv';

dotenv.config();

const emailUser = process.env.EMAIL_USER?.trim();
const brevoApiKey = process.env.BREVO_API_KEY?.trim();

const getEmailConfig = () => {
  if (!emailUser || !brevoApiKey) {
    throw new Error('Email is not configured. Set EMAIL_USER and BREVO_API_KEY in the backend deployment environment.');
  }

  return { senderEmail: emailUser, apiKey: brevoApiKey };
};

export const isEmailConfigured = () => Boolean(emailUser && brevoApiKey);

export const sendTransactionalEmail = async (
  toEmail: string,
  subject: string,
  htmlContent: string,
  senderName: string,
  attachments?: { name: string; content: string }[]
): Promise<void> => {
  const { senderEmail, apiKey } = getEmailConfig();

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      // These are transactional service emails. Do not track a client's opens
      // or clicks, which also prevents Brevo's tracking redirect from wrapping
      // the document-download and portal links when consent mode is enabled.
      to: [{ email: toEmail, contactPixelTrackingConsent: false }],
      subject,
      htmlContent,
      ...(attachments?.length ? { attachment: attachments } : {}),
    }),
  });

  const responseBody = await response.text();
  if (!response.ok) {
    throw new Error(`Brevo API error (${response.status}): ${responseBody}`);
  }

  const { messageId } = JSON.parse(responseBody) as { messageId?: string };
  console.log(`Brevo accepted email for ${toEmail}. Message ID: ${messageId || 'not returned'}`);
};

// Compatibility wrapper for the existing client-notification helpers below.
// All emails still use the Brevo HTTPS API; no SMTP connection is made.
const getTransporter = async () => ({
  sendMail: async (mail: { to: string; subject: string; html: string }) =>
    sendTransactionalEmail(mail.to, mail.subject, mail.html, 'TaxMeld CA Portal'),
});

// 1. Password Reset / Registration OTP Email
export const sendOtpEmail = async (toEmail: string, otp: string): Promise<void> => {
  if (!toEmail) return;

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #059669; text-align: center;">TaxMeld Security</h2>
        <p style="color: #475569; font-size: 14px;">Use the verification or password-reset OTP below:</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `;

  try {
    await sendTransactionalEmail(toEmail, 'Your TaxMeld Verification OTP', html, 'TaxMeld Security');
  } catch (error: any) {
    console.error('OTP email delivery failed:', error?.message || error);
    throw new Error('Unable to send the OTP email. Please try again later.');
  }
};

export const sendTeamInviteEmail = async (toEmail: string, ownerName: string, inviteUrl: string): Promise<void> => {
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:14px"><h2 style="color:#059669">You've been invited to a TaxMeld team</h2><p style="color:#475569">${ownerName} has added you as a staff member. Use the secure link below and verify the OTP sent to this email to open the shared CA workspace.</p><p style="text-align:center;margin:28px 0"><a href="${inviteUrl}" style="display:inline-block;background:#059669;color:#fff;padding:13px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Open Team Workspace</a></p><p style="font-size:12px;color:#64748b">This invitation is for ${toEmail}. Do not forward this link.</p></div>`;
  await sendTransactionalEmail(toEmail, `Join ${ownerName}'s TaxMeld team`, html, 'TaxMeld Team');
};

// 2. Client Creation Alert Mail
export const sendClientWelcomeEmail = async (
  toEmail: string,
  clientName: string,
  panNumber: string,
  trackingUrl: string,
  requiredServices: string[]
): Promise<void> => {
  if (!toEmail) return;
  const transporter = await getTransporter();

  const docsListHtml = requiredServices.length > 0
    ? `<ul>${requiredServices.map((s) => `<li><strong>${s}</strong></li>`).join('')}</ul>`
    : '<p>Standard verification documents required.</p>';

  const mailOptions = {
    from: `"TaxMeld CA Portal" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Document Request & Tax Filing Tracker - ${panNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #059669; margin-bottom: 8px;">Welcome, ${clientName}</h2>
        <p style="color: #475569; font-size: 14px;">
          Your secure portal is ready. Please upload the requested documents and track your filing progress.
        </p>

        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0; font-size: 13px; color: #334155;"><strong>PAN Number:</strong> ${panNumber}</p>
          <p style="margin: 8px 0 4px 0; font-size: 13px; color: #334155;"><strong>Required Documents:</strong></p>
          ${docsListHtml}
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${trackingUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Upload Documents & Track Status
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
          If the button does not open, copy and paste this link into your browser:<br/>
          <a href="${trackingUrl}" style="color: #059669;">${trackingUrl}</a>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${toEmail}`);
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
};

// 3. Final ITR-V Deliverable Notification Mail
export const sendFinalAckEmail = async (
  toEmail: string,
  clientName: string,
  panNumber: string,
  trackingUrl: string,
  serviceType?: string
): Promise<void> => {
  if (!toEmail) return;
  const transporter = await getTransporter();

  const isGST = serviceType?.includes('GST');
  const isTDS = serviceType?.includes('TDS');

  const title = isGST 
    ? 'GST Return Filed Successfully!' 
    : isTDS 
    ? 'TDS Compliance Completed!' 
    : 'Tax Return Filed Successfully!';

  const docName = isGST 
    ? 'GSTR Filing Acknowledgement' 
    : isTDS 
    ? 'TDS Filing Receipt' 
    : 'ITR-V Acknowledgement Receipt';

  const mailOptions = {
    from: `"TaxMeld CA Portal" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${title} (${panNumber})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #059669; margin-bottom: 8px;">${title}</h2>
        <p style="color: #475569; font-size: 14px;">
          Hello ${clientName}, your compliance work has been completed successfully.
        </p>

        <p style="color: #475569; font-size: 14px;">
          Your official <strong>${docName}</strong> is available to download from the client portal:
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${trackingUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Download ${docName}
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px;">
          PAN: <strong>${panNumber}</strong>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Final Ack email sent to ${toEmail}`);
  } catch (err) {
    console.error('Failed to send final ack email:', err);
  }
};
