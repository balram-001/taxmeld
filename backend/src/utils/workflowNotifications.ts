import { Client } from '../models/Client';
import { Notification } from '../models/Notification';
import Task from '../models/Task';
import { TeamInvite } from '../models/TeamInvite';
import { User } from '../models/User';
import { sendInternalDocumentAlertEmail } from './emailService';

type NoticeType = 'client_upload' | 'document_reminder' | 'reupload_request' | 'final_delivery';

/** Save an auditable inbox notice for the CA and only staff assigned to this client. */
export const notifyClientWorkspace = async (
  client: any,
  type: NoticeType,
  title: string,
  message: string,
  options: { emailOwner?: boolean; emailStaff?: boolean } = {}
) => {
  const ownerId = String(client.userId);
  const staffInviteIds = await Task.find({ firmId: ownerId, client: client._id }).distinct('assignedTo');
  const staffInvites = staffInviteIds.length
    ? await TeamInvite.find({ _id: { $in: staffInviteIds }, status: 'active' }).select('staffUserId email').lean()
    : [];
  const staffUserIds = staffInvites.map((invite: any) => invite.staffUserId).filter(Boolean);
  const link = `/client/${client._id}`;
  await Notification.insertMany([
    { ownerId, clientId: client._id, type, title, message, link },
    ...staffUserIds.map((recipientUserId: any) => ({ ownerId, recipientUserId, clientId: client._id, type, title, message, link })),
  ]);

  if (!options.emailOwner && !options.emailStaff) return;
  const recipients: string[] = [];
  if (options.emailOwner) {
    const owner = await User.findById(ownerId).select('email').lean();
    if (owner?.email) recipients.push(owner.email);
  }
  if (options.emailStaff) recipients.push(...staffInvites.map((invite: any) => invite.email).filter(Boolean));
  await Promise.allSettled([...new Set(recipients)].map((email) => sendInternalDocumentAlertEmail(email, title, message, client)));
};
