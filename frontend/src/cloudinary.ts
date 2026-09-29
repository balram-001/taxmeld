import API from './api';
import { BACKEND_URL } from './config';

export type UploadedCloudFile = { fileUrl: string; publicId: string; originalFileName: string; mimeType: string };

export const resolveFileUrl = (fileUrl: string) => fileUrl.startsWith('http') ? fileUrl : `${BACKEND_URL}${fileUrl}`;

// Cloudinary normally opens a document in the browser. Its attachment flag
// forces a direct file save when the CA chooses Download.
export const resolveDownloadFileUrl = (fileUrl: string) => {
  const resolvedUrl = resolveFileUrl(fileUrl);
  return resolvedUrl.includes('res.cloudinary.com') && resolvedUrl.includes('/upload/')
    ? resolvedUrl.replace('/upload/', '/upload/fl_attachment/')
    : resolvedUrl;
};

export async function uploadFilesDirectly(files: File[], signaturePath: string, headers?: Record<string, string>): Promise<UploadedCloudFile[]> {
  const signature = (await API.post(signaturePath, {}, { headers })).data;
  return Promise.all(files.map(async (file) => {
    const body = new FormData();
    body.append('file', file);
    body.append('api_key', signature.apiKey);
    body.append('timestamp', String(signature.timestamp));
    body.append('folder', signature.folder);
    body.append('signature', signature.signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/raw/upload`, { method: 'POST', body });
    if (!response.ok) throw new Error('Cloud upload failed. Please try again.');
    const uploaded = await response.json();
    return { fileUrl: uploaded.secure_url, publicId: uploaded.public_id, originalFileName: file.name, mimeType: file.type || 'application/octet-stream' };
  }));
}
