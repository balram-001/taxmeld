import { User } from '../models/User';

export const getWorkspaceOwnerId = async (userId: string) => {
  const user = await User.findById(userId).select('workspaceOwnerId role').lean();
  if (!user) return null;
  return String(user.workspaceOwnerId || userId);
};

export const isWorkspaceOwner = async (userId: string) => {
  const user = await User.findById(userId).select('role workspaceOwnerId').lean();
  return Boolean(user && user.role !== 'staff' && !user.workspaceOwnerId);
};
