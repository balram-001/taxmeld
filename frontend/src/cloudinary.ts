import API from './api';
import { BACKEND_URL } from './config';

export type UploadedCloudFile = { fileUrl: string; publicId: string; originalFileName: string; mimeType: string };

export const resolveFileUrl = (fileUrl: string) => fileUrl.startsWith('http') ? fileUrl : `${BACKEND_URL}${fileUrl}`;

export async function uploadFilesDirectly(files: File[], signaturePath: string): Promise<UploadedCloudFile[]> {
  const signature = (await API.post(signaturePath)).data;
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
