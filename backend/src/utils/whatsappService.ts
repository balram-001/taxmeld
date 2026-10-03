/**
 * WhatsApp Cloud API connector. It only sends after Meta credentials and an
 * approved template are configured; until then email remains the live channel.
 */
export const sendWhatsAppDocumentReminder = async (phone: string | undefined, trackingUrl: string): Promise<boolean> => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const template = process.env.WHATSAPP_DOCUMENT_REMINDER_TEMPLATE?.trim();
  const recipient = String(phone || '').replace(/\D/g, '').slice(-10);
  if (!token || !phoneNumberId || !template || !recipient) return false;
  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: `91${recipient}`, type: 'template', template: { name: template, language: { code: 'en' }, components: [{ type: 'body', parameters: [{ type: 'text', text: trackingUrl }] }] } }),
  });
  if (!response.ok) throw new Error(`WhatsApp API rejected reminder (${response.status})`);
  return true;
};
