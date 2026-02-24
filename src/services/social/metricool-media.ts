/**
 * Metricool Media Upload Service
 *
 * Handles S3 presigned URL upload flow for media files.
 * Supports simple upload (<5MB) and multipart upload (>=5MB).
 */

import { metricoolClient } from './metricool-client';
import type {
  S3PresignedUploadRequest,
  S3UploadResponse,
  S3CompletedPart,
} from '@/types/social';

/**
 * Create an upload transaction. Returns presigned URLs for uploading.
 * - Files <5MB: returns a single presignedUrl for direct PUT
 * - Files >=5MB: returns multiple part URLs for multipart upload
 */
export async function createUploadTransaction(
  request: S3PresignedUploadRequest,
): Promise<S3UploadResponse> {
  return metricoolClient.put('/v2/media/s3/upload-transactions', request);
}

/**
 * Complete a multipart upload after all parts have been uploaded.
 */
export async function completeUpload(
  uploadId: string,
  key: string,
  parts: S3CompletedPart[],
  bucket?: string,
): Promise<unknown> {
  const params: Record<string, string> = { uploadId, key };
  if (bucket) params.bucket = bucket;
  return metricoolClient.post('/v2/media/s3/upload-transactions', { parts }, params);
}

/**
 * Abort a multipart upload. Cleans up any uploaded parts.
 */
export async function abortUpload(
  uploadId: string,
  key: string,
  bucket?: string,
): Promise<void> {
  const params: Record<string, string> = { uploadId, key };
  if (bucket) params.bucket = bucket;
  await metricoolClient.delete('/v2/media/s3/upload-transactions', params);
}

/**
 * Upload a file to Metricool's S3 storage.
 * Handles both simple and multipart uploads automatically.
 * Returns the file URL for use in scheduled posts.
 */
export async function uploadFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop() ?? '';

  // Step 1: Create upload transaction
  const transaction = await createUploadTransaction({
    contentType: file.type,
    size: file.size,
    fileExtension: extension,
  });

  if (transaction.uploadType === 'SIMPLE' && transaction.presignedUrl) {
    // Simple upload: PUT directly to presigned URL
    const response = await fetch(transaction.presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Simple upload failed: ${response.status}`);
    }
  } else if (transaction.uploadType === 'MULTIPART' && transaction.parts && transaction.uploadId) {
    // Multipart upload: upload each part
    const completedParts: S3CompletedPart[] = [];
    const buffer = await file.arrayBuffer();

    for (const part of transaction.parts) {
      const chunk = buffer.slice(part.startByte, part.endByte + 1);

      const response = await fetch(part.presignedUrl, {
        method: 'PUT',
        body: chunk,
      });

      if (!response.ok) {
        await abortUpload(transaction.uploadId, transaction.key, transaction.bucket);
        throw new Error(`Multipart upload failed on part ${part.partNumber}: ${response.status}`);
      }

      const etag = response.headers.get('ETag');
      if (!etag) {
        await abortUpload(transaction.uploadId, transaction.key, transaction.bucket);
        throw new Error(`Missing ETag for part ${part.partNumber}`);
      }

      completedParts.push({
        partNumber: part.partNumber,
        etag: etag.replace(/"/g, ''),
      });
    }

    // Complete multipart upload
    await completeUpload(
      transaction.uploadId,
      transaction.key,
      completedParts,
      transaction.bucket,
    );
  } else {
    throw new Error(`Unexpected upload type: ${transaction.uploadType}`);
  }

  // Return the file URL
  if (transaction.fileUrl) {
    return transaction.fileUrl;
  }

  // Construct URL from key if fileUrl not provided
  return `https://${transaction.bucket}.s3.amazonaws.com/${transaction.key}`;
}
