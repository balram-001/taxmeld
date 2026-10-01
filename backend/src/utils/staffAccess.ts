import Task from '../models/Task';
import { TeamInvite } from '../models/TeamInvite';

/** True only when an active staff invitation has an assigned task for this client. */
export const isStaffAssignedToClient = async (staffUserId: string, clientId: string): Promise<boolean> => {
  const invite = await TeamInvite.findOne({ staffUserId, status: 'active' }).select('_id').lean();
  if (!invite) return false;
  return Boolean(await Task.exists({ assignedTo: invite._id, client: clientId }));
};
