import { Request, Response } from 'express';
import { DocumentTask } from '../models/DocumentTask';
import { Client } from '../models/Client';
import { User } from '../models/User';
import { StoredFile } from '../models/StoredFile';
import { AuthRequest } from '../middleware/authMiddleware';
import fs from 'fs';
import path from 'path';
import { sendFinalAckEmail } from '../utils/emailService';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary';
import { getWorkspaceOwnerId } from '../utils/workspace';

type CloudFilePayload = { fileUrl: string; publicId: string; originalFileName: string; mimeType?: string };

const readCloudFiles = (value: unknown): CloudFilePayload[] => Array.isArray(value)
  ? value.filter((file: any) => file?.fileUrl && file?.publicId && file?.originalFileName)
  : [];

export const createClientUploadSignature = async (req: Request, res: Response): Promise<void> => {
  const client = await Client.findOne({ trackingToken: req.params.token });
  if (!client || !isCloudinaryConfigured) {
    res.status(400).json({ message: 'Secure upload is temporarily unavailable.' });
    return;
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `taxmeld/${client._id}/client`;
  res.json({ cloudName: process.env.CLOUDINARY_CLOUD_NAME, apiKey: process.env.CLOUDINARY_API_KEY, timestamp, folder, signature: cloudinary.utils.api_sign_request({ folder, timestamp }, process.env.CLOUDINARY_API_SECRET!) });
};

export const createCAUploadSignature = async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceOwnerId = req.user?.id ? await getWorkspaceOwnerId(req.user.id) : null;
  const client = workspaceOwnerId ? await Client.findOne({ _id: req.params.clientId, userId: workspaceOwnerId }) : null;
  if (!client || !isCloudinaryConfigured) {
    res.status(400).json({ message: 'Secure upload is temporarily unavailable.' });
    return;
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `taxmeld/${client._id}/final`;
  res.json({ cloudName: process.env.CLOUDINARY_CLOUD_NAME, apiKey: process.env.CLOUDINARY_API_KEY, timestamp, folder, signature: cloudinary.utils.api_sign_request({ folder, timestamp }, process.env.CLOUDINARY_API_SECRET!) });
};

// Helper function: Recalculate Stage 1, 2 & 3 status based on standard + custom requirements
const updateStage2Status = async (clientId: any, trackingToken: string) => {
  const client = await Client.findById(clientId);
  if (!client) return;

  const selectedServices = (client.serviceType || 'ITR Filing')
    .split(', ')
    .map((s) => s.trim())
    .filter(Boolean);

  const customReqNames = (client.customRequirements || []).map((r: any) => r.name.trim());
  
  // Total expected requirements list (Selected services + Custom requirements)
  const allExpectedCategories = Array.from(new Set([...selectedServices, ...customReqNames]));

  const docTasks = await DocumentTask.find({
    clientId: client._id,
    documentType: 'Client Document',
    'files.0': { $exists: true },
  });

  const uploadedCategories = new Set(docTasks.map((t) => t.serviceCategory));
  const uploadedCount = allExpectedCategories.filter((cat) => uploadedCategories.has(cat)).length;
  const totalCount = allExpectedCategories.length;

  if (uploadedCount === 0) {
    await DocumentTask.findOneAndUpdate(
      { clientId: client._id, title: 'Documents Requested' },
      { status: 'Pending', remarks: 'PAN & Form 16 requested' }
    );

    await DocumentTask.findOneAndUpdate(
      { clientId: client._id, title: 'Documents Uploaded' },
      { status: 'Pending', remarks: 'Client file upload stage' }
    );

    await DocumentTask.findOneAndUpdate(
      { clientId: client._id, title: 'Computation & Calculation', status: 'In Progress' },
      { status: 'Pending' }
    );
  } else if (uploadedCount < totalCount) {
    await DocumentTask.findOneAndUpdate(
      { clientId: client._id, title: 'Documents Requested' },
      { status: 'Completed' }
    );

    await DocumentTask.findOneAndUpdate(
      { clientId: client._id, title: 'Documents Uploaded' },
      { 
        status: 'In Progress', 
        remarks: `Partially Uploaded (${uploadedCount}/${totalCount} Requirements Submitted)` 
      }
    );

    await DocumentTask.findOneAndUpdate(
      { clientId: client._id, title: 'Computation & Calculation', status: 'Pending' },
      { status: 'In Progress' }
    );
  } else {
    await DocumentTask.findOneAndUpdate(
      { clientId: client._id, title: 'Documents Requested' },
      { status: 'Completed' }
    );

    await DocumentTask.findOneAndUpdate(
      { clientId: client._id, title: 'Documents Uploaded' },
      { 
        status: 'Completed', 
        remarks: `All Documents Submitted (${totalCount}/${totalCount} Completed)` 
      }
    );

    await DocumentTask.findOneAndUpdate(
      { clientId: client._id, title: 'Computation & Calculation', status: 'Pending' },
      { status: 'In Progress' }
    );
  }
};

// 1. Get Public Tasks for Client Tracking Page
export const getPublicTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;

    const client = await Client.findOne({ trackingToken: token });
    if (!client) {
      res.status(404).json({ message: 'Client not found or invalid token' });
      return;
    }

    const standardStages = [
      { title: 'Documents Requested', remarks: 'PAN & Form 16 requested', documentType: 'Stage Task' },
      { title: 'Documents Uploaded', remarks: 'Client file upload stage', documentType: 'Client Document' },
      { title: 'Computation & Calculation', remarks: 'Tax calculation stage', documentType: 'Stage Task' },
      { title: 'Tax Return Filed', remarks: 'Filing on portal', documentType: 'Stage Task' },
      { title: 'Acknowledgement Generated', remarks: 'Final stage & ITR-V download', documentType: 'ITR Acknowledgement' }
    ];

    const existingTasks = await DocumentTask.find({ clientId: client._id });

    for (const stage of standardStages) {
      const exists = existingTasks.find((t) => t.title === stage.title);
      if (!exists) {
        try {
          await DocumentTask.create({
            title: stage.title,
            documentType: stage.documentType,
            serviceCategory: 'General',
            clientId: client._id,
            caId: client.userId,
            token: token,
            status: 'Pending',
            remarks: stage.remarks,
            files: [],
          });
        } catch (err) {
          console.log(`Stage ${stage.title} creation fallback`);
        }
      }
    }

    // Always sync timeline status on load
    await updateStage2Status(client._id, token);

    const allTasks = await DocumentTask.find({ clientId: client._id });

    const sortedTimeline = standardStages
      .map((st) => allTasks.find((t) => t.title === st.title))
      .filter((t): t is NonNullable<typeof t> => Boolean(t));

    const docTasks = allTasks.filter((t) => t.documentType === 'Client Document' && t.serviceCategory !== 'General');

    const tasksMap = new Map();
    [...sortedTimeline, ...docTasks].forEach((t) => tasksMap.set(t._id.toString(), t));
    const combinedTasks = Array.from(tasksMap.values());

    res.status(200).json({ client, tasks: combinedTasks });
  } catch (error: any) {
    console.error('Error in getPublicTasks:', error);
    res.status(500).json({ message: 'Error fetching client tasks', error: error.message });
  }
};

// 2. Client Uploads Multiple Documents for a Specific Service Category
export const uploadClientDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;
    const serviceCategory = (req.body.serviceCategory as string) || 'General';
    const files = readCloudFiles(req.body.files);

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const client = await Client.findOne({ trackingToken: token });
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    let docTask = await DocumentTask.findOne({
      clientId: client._id,
      documentType: 'Client Document',
      serviceCategory: serviceCategory,
    });

    if (!docTask) {
      docTask = await DocumentTask.create({
        title: `Document - ${serviceCategory}`,
        documentType: 'Client Document',
        serviceCategory: serviceCategory,
        clientId: client._id,
        caId: client.userId,
        token: token,
        status: 'Completed',
        files: [],
      });
    }

    const storedFiles = await Promise.all(
      files.map(async (file) => file)
    );

    const newFilesList = storedFiles.map((storedFile) => ({
      fileUrl: storedFile.fileUrl,
      cloudinaryPublicId: storedFile.publicId,
      originalFileName: storedFile.originalFileName,
      mimeType: storedFile.mimeType || 'application/octet-stream',
      uploadedAt: new Date(),
    }));

    docTask.files.push(...newFilesList);
    docTask.status = 'Completed';
    await docTask.save();

    await updateStage2Status(client._id, token);

    res.status(200).json({ message: 'Files uploaded successfully', uploadedCount: files.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Client explicitly submits all uploaded documents to the CA after reviewing them.
export const submitClientDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;
    const client = await Client.findOne({ trackingToken: token });
    if (!client) {
      res.status(404).json({ message: 'Client not found.' });
      return;
    }
    const uploadedCount = await DocumentTask.countDocuments({ clientId: client._id, documentType: 'Client Document', 'files.0': { $exists: true } });
    if (uploadedCount === 0) {
      res.status(400).json({ message: 'Please upload at least one document before submitting.' });
      return;
    }
    client.lastClientUploadAt = new Date();
    await client.save();
    res.status(200).json({ message: 'Documents submitted to your CA successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Could not submit documents.' });
  }
};

// 3. Delete a Single Uploaded File from a Service Category
export const deleteClientDocumentFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;
    const taskId = req.params.taskId as string;
    const fileIndexStr = req.params.fileIndex as string;

    const client = await Client.findOne({ trackingToken: token });
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    const task = await DocumentTask.findById(taskId);
    if (!task) {
      res.status(404).json({ message: 'Task document record not found' });
      return;
    }

    const idx = parseInt(fileIndexStr, 10);
    if (isNaN(idx) || idx < 0 || idx >= task.files.length) {
      res.status(400).json({ message: 'Invalid file index' });
      return;
    }

    const targetFile = task.files[idx];
    if (targetFile?.storageId) await StoredFile.findByIdAndDelete(targetFile.storageId);

    task.files.splice(idx, 1);
    if (task.files.length === 0) {
      task.status = 'Pending';
    }
    await task.save();

    await updateStage2Status(client._id, token);

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete file', error: error.message });
  }
};

// 4. CA Uploads/Replaces Final ITR-V Acknowledgement
export const uploadFinalAcknowledgement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const appendFiles = req.body.mode === 'append';
    const files = readCloudFiles(req.body.files);

    if (files.length === 0) {
      res.status(400).json({ message: 'Select at least one final document.' });
      return;
    }

    const workspaceOwnerId = req.user?.id ? await getWorkspaceOwnerId(req.user.id) : null;
    const client = workspaceOwnerId ? await Client.findOne({ _id: clientId, userId: workspaceOwnerId }) : null;
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    // Update or Create Final Acknowledgement Task
    let ackTask = await DocumentTask.findOne({
      clientId: client._id,
      title: 'Acknowledgement Generated',
    });
    // Delivery state belongs in MongoDB, not Render's temporary uploads folder.
    // Legacy tasks with a previous file are treated as an existing delivery.
    const isReplacement = Boolean(
      (ackTask?.finalDeliveryVersion || 0) > 0 || ackTask?.files?.length
    );

    if (!ackTask) {
      ackTask = await DocumentTask.create({
        title: 'Acknowledgement Generated',
        documentType: 'ITR Acknowledgement',
        serviceCategory: 'General',
        clientId: client._id,
        caId: client.userId,
        token: client.trackingToken,
        status: 'Completed',
        remarks: 'Final ITR-V Generated & Ready for Download',
        files: [],
        finalDeliveryVersion: 1,
      });
    } else {
      ackTask.status = 'Completed';
      if (!appendFiles) {
        await Promise.all(
          ackTask.files
            .filter((file) => file.storageId)
            .map((file) => StoredFile.findByIdAndDelete(file.storageId))
        );
        ackTask.files = [];
      }
      ackTask.finalDeliveryVersion = (ackTask.finalDeliveryVersion || 0) + 1;
    }

    const newFileEntries = files.map((file) => ({
      fileUrl: file.fileUrl,
      cloudinaryPublicId: file.publicId,
      originalFileName: file.originalFileName,
      mimeType: file.mimeType || 'application/octet-stream',
      uploadedAt: new Date(),
    }));
    ackTask.files = appendFiles ? [...ackTask.files, ...newFileEntries] : newFileEntries;
    await ackTask.save();

    // A final delivery resolves the pending client-document notification.
    client.lastFinalDeliveryAt = new Date();
    await client.save();

    // Saare stages complete mark kar dein
    await DocumentTask.updateMany(
      { clientId: client._id },
      { status: 'Completed' }
    );

    // Auto-Send Final Acknowledgement Email to Client
    if (client.email) {
      const frontendBaseUrl = process.env.CLIENT_BASE_URL || 'https://taxmeld.vercel.app';
      const backendBaseUrl = process.env.PUBLIC_BACKEND_URL || 'https://taxmeld-backend.vercel.app';
      const trackingUrl = `${frontendBaseUrl}/track/${client.trackingToken}`;
      const downloadUrl = `${backendBaseUrl}/api/tasks/download/${client.trackingToken}/${ackTask._id}/0`;
      // Email attachments can take several seconds to reach Brevo. The CA
      // dashboard must not remain blocked after the files are safely saved.
      void (async () => {
        try {
          const ca = await User.findById(client.userId).select('name').lean();
          await sendFinalAckEmail(
            client.email!,
            client.name,
            client.panNumber,
            trackingUrl,
            client.serviceType,
            downloadUrl,
            [],
            isReplacement,
            ca?.name
          );
          console.log(`Final delivery email v${ackTask.finalDeliveryVersion} sent for client ${client._id}.`);
        } catch (emailError) {
          console.error('Background final acknowledgement email error:', emailError);
        }
      })();
    }

    res.status(200).json({ message: 'ITR-V uploaded and all stages completed', task: ackTask });
  } catch (error: any) {
    res.status(500).json({ message: 'Error uploading acknowledgement', error: error.message });
  }
};

// 5. Update Task Status Manually
export const updateTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id as string;
    const { status, remarks } = req.body;

    const task = await DocumentTask.findById(taskId);
    if (!task) {
      res.status(404).json({ message: 'Task stage not found' });
      return;
    }

    const workspaceOwnerId = req.user?.id ? await getWorkspaceOwnerId(req.user.id) : null;
    const client = workspaceOwnerId ? await Client.findOne({ _id: task.clientId, userId: workspaceOwnerId }) : null;
    if (!client) {
      res.status(403).json({ message: 'You do not have access to this workflow.' });
      return;
    }

    if (status) task.status = status;
    if (remarks !== undefined) task.remarks = remarks;

    await task.save();

    res.status(200).json({ message: 'Task status updated successfully', task });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update task status', error: error.message });
  }
};

// Public download link for a final document. The unguessable client tracking
// token is required, and the response always forces a file download.
export const downloadClientFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, taskId, fileIndex } = req.params;
    const index = Number(fileIndex);
    if (!Number.isInteger(index) || index < 0) {
      res.status(400).json({ message: 'This document link is invalid.' });
      return;
    }

    const task = await DocumentTask.findOne({ _id: taskId, token });
    const file = task?.files?.[index];
    if (!file) {
      res.status(404).json({ message: 'This document is no longer available.' });
      return;
    }
    if (file.fileUrl.startsWith('http')) {
      res.redirect(file.fileUrl);
      return;
    }

    if (file.storageId) {
      const storedFile = await StoredFile.findById(file.storageId);
      if (!storedFile) {
        res.status(404).json({ message: 'This document is no longer available.' });
        return;
      }
      res.setHeader('Content-Type', storedFile.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalFileName || storedFile.originalFileName)}"`);
      res.status(200).send(storedFile.data);
      return;
    }

    const storedFileName = path.basename(file.fileUrl);
    const absolutePath = path.resolve(process.cwd(), 'uploads', storedFileName);
    if (!fs.existsSync(absolutePath)) {
      res.status(404).json({ message: 'This document is no longer available.' });
      return;
    }

    res.download(absolutePath, file.originalFileName || storedFileName);
  } catch (error) {
    res.status(404).json({ message: 'This document link is invalid or has expired.' });
  }
};

export const getStoredFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, taskId, fileId } = req.params;
    const task = await DocumentTask.findOne({ _id: taskId, token });
    if (!task || !task.files.some((file) => String(file.storageId) === fileId)) {
      res.status(404).json({ message: 'This document is no longer available.' });
      return;
    }

    const storedFile = await StoredFile.findById(fileId);
    if (!storedFile) {
      res.status(404).json({ message: 'This document is no longer available.' });
      return;
    }

    res.setHeader('Content-Type', storedFile.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(storedFile.originalFileName)}"`);
    res.status(200).send(storedFile.data);
  } catch {
    res.status(404).json({ message: 'This document is no longer available.' });
  }
};
