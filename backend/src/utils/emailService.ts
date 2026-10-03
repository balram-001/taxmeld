import { sendTransactionalEmail } from './sendEmail';

// 1. Password Reset / OTP Email
export const sendOtpEmail = async (toEmail: string, otp: string) => {
  if (!toEmail) return;

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #059669;">TaxMeld Password Reset</h2>
        <p style="color: #475569; font-size: 14px;">Use the password-reset OTP below:</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `;

  try {
    await sendTransactionalEmail(toEmail, 'Your Password Reset OTP - TaxMeld', html, 'TaxMeld Security');
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    throw err;
  }
};

// 2. Client Creation Alert Mail
export const sendClientWelcomeEmail = async (
  toEmail: string,
  clientName: string,
  panNumber: string,
  trackingUrl: string,
  requiredServices: string[],
  caName?: string
) => {
  if (!toEmail) return;

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #059669; margin-bottom: 8px;">Your secure document portal is ready</h2>
        <p style="color: #475569; font-size: 14px;">
          Your CA has shared a secure TaxMeld portal for document upload and filing updates.
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${trackingUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Open Secure Portal
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
          For your protection, the portal will verify your name, PAN and mobile number before showing any filing details.
        </p>
        <p style="color: #475569; font-size: 13px;">Regards,<br/><strong>${caName || 'Your CA'}</strong><br/>TaxMeld CA Portal</p>
      </div>
    `;

  try {
    await sendTransactionalEmail(toEmail, 'Your secure TaxMeld document portal', html, `${caName || 'TaxMeld'} | CA Portal`);
    console.log(`Welcome email sent to ${toEmail}`);
  } catch (err) {
    console.error('Failed to send welcome email:', err);
    throw err;
  }
};

export const sendClientDocumentReminderEmail = async (
  toEmail: string,
  clientName: string,
  trackingUrl: string,
  caName?: string,
  reason?: string
) => {
  if (!toEmail) return;
  const heading = reason ? 'Your CA has requested a document re-upload' : 'Reminder: documents are still needed';
  const detail = reason
    ? `Your CA reviewed a document and requested an updated copy for this reason: <strong>${reason}</strong>`
    : 'Your CA is waiting for the documents needed to continue your filing.';
  await sendTransactionalEmail(toEmail, heading, `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:14px"><h2 style="color:#059669">${heading}</h2><p>Hello ${clientName},</p><p>${detail}</p><p>Please use the secure portal below to upload the requested document(s). You will verify your name, PAN and mobile number before opening it.</p><p style="text-align:center;margin:28px 0"><a href="${trackingUrl}" style="display:inline-block;background:#059669;color:#fff;padding:13px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Upload Documents Securely</a></p><p style="font-size:12px;color:#64748b">This is an automated reminder from ${caName || 'your CA'} through TaxMeld.</p></div>`, `${caName || 'TaxMeld'} | Document Reminder`);
};

export const sendInternalDocumentAlertEmail = async (toEmail: string, title: string, message: string, client: { name: string; panNumber: string }) => {
  if (!toEmail) return;
  await sendTransactionalEmail(toEmail, title, `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:14px"><h2 style="color:#0f172a">${title}</h2><p style="color:#475569">${message}</p><p style="font-size:13px;color:#64748b"><strong>Client:</strong> ${client.name}<br/><strong>PAN:</strong> ${client.panNumber}</p></div>`, 'TaxMeld Workflow');
};

// 3. Final ITR-V Deliverable Notification Mail
export const sendFinalAckEmail = async (
  toEmail: string,
  clientName: string,
  panNumber: string,
  trackingUrl: string,
  serviceType?: string,
  downloadUrl?: string,
  attachments?: { name: string; content: string }[],
  isReplacement = false,
  caName?: string
) => {
  if (!toEmail) return;

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
  const emailTitle = isReplacement ? `${docName} Updated` : title;

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #059669; margin-bottom: 8px;">${emailTitle}</h2>
        <p style="color: #475569; font-size: 14px;">
          Hello ${clientName}, ${isReplacement ? 'your updated final document is now available.' : 'your compliance work has been completed successfully.'}
        </p>

        <p style="color: #475569; font-size: 14px;">
          Your official <strong>${docName}</strong> is attached to this email and is also available through the secure client portal.
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${downloadUrl || trackingUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin: 4px;">
            Download ${docName}
          </a>
          <a href="${trackingUrl}" style="background-color: #ffffff; color: #047857; border: 1px solid #059669; padding: 11px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin: 4px;">
            Track Your Filing
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px;">If a button does not open, use the client portal: <a href="${trackingUrl}" style="color: #059669;">${trackingUrl}</a></p>

        <p style="color: #64748b; font-size: 12px;">
          PAN: <strong>${panNumber}</strong>
        </p>
        <p style="color: #475569; font-size: 13px;">Regards,<br/><strong>${caName || 'Your CA'}</strong><br/>TaxMeld CA Portal</p>
      </div>
    `;

  try {
    await sendTransactionalEmail(
      toEmail,
      `${emailTitle} (${panNumber}) - ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      html,
      `${caName || 'TaxMeld'} | CA Portal`,
      attachments
    );
    console.log(`Final Ack email sent to ${toEmail}`);
  } catch (attachmentError) {
    // Large or unsupported attachments can be rejected by an email provider.
    // Still send the completion/update notice so the client never misses it.
    console.error('Final document attachment could not be sent; sending notification without attachment:', attachmentError);
    try {
      await sendTransactionalEmail(
        toEmail,
        `${emailTitle} (${panNumber}) - ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
        html,
        `${caName || 'TaxMeld'} | CA Portal`
      );
      console.log(`Final Ack fallback notification sent to ${toEmail}`);
    } catch (notificationError) {
      console.error('Failed to send final acknowledgement notification:', notificationError);
      throw notificationError;
    }
  }
};
