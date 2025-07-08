/**
 * Secure file validation utilities
 */

// File signatures (magic bytes) for common file types
const FILE_SIGNATURES: Record<string, { signature: number[]; offset: number }[]> = {
  'image/jpeg': [
    { signature: [0xFF, 0xD8, 0xFF], offset: 0 }
  ],
  'image/png': [
    { signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 }
  ],
  'image/gif': [
    { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], offset: 0 }, // GIF87a
    { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], offset: 0 }  // GIF89a
  ],
  'image/webp': [
    { signature: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF
    { signature: [0x57, 0x45, 0x42, 0x50], offset: 8 }  // WEBP
  ],
  'video/mp4': [
    { signature: [0x66, 0x74, 0x79, 0x70], offset: 4 } // ftyp
  ],
  'video/webm': [
    { signature: [0x1A, 0x45, 0xDF, 0xA3], offset: 0 }
  ],
  'video/quicktime': [
    { signature: [0x66, 0x74, 0x79, 0x70, 0x71, 0x74], offset: 4 } // ftypqt
  ]
};

// Allowed extensions mapped to MIME types
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp'],
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
  'video/quicktime': ['mov']
};

// Maximum file sizes by type (in bytes)
const MAX_FILE_SIZES: Record<string, number> = {
  'image/jpeg': 10 * 1024 * 1024,     // 10MB
  'image/png': 10 * 1024 * 1024,      // 10MB
  'image/gif': 5 * 1024 * 1024,       // 5MB
  'image/webp': 10 * 1024 * 1024,     // 10MB
  'video/mp4': 100 * 1024 * 1024,     // 100MB
  'video/webm': 100 * 1024 * 1024,    // 100MB
  'video/quicktime': 100 * 1024 * 1024 // 100MB
};

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path separators
  let sanitized = filename.replace(/[\/\\]/g, '');
  
  // Remove any potentially dangerous characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Remove multiple dots to prevent double extensions
  sanitized = sanitized.replace(/\.{2,}/g, '.');
  
  // Ensure filename doesn't start with a dot
  sanitized = sanitized.replace(/^\./, '');
  
  // Limit filename length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = nameWithoutExt.substring(0, 250 - ext.length) + '.' + ext;
  }
  
  return sanitized || 'unnamed_file';
}

/**
 * Validate file extension against allowed types
 */
export function validateFileExtension(filename: string, allowedMimeTypes: string[]): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  
  for (const mimeType of allowedMimeTypes) {
    const allowedExts = ALLOWED_EXTENSIONS[mimeType];
    if (allowedExts && allowedExts.includes(ext)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check file signature (magic bytes) to verify file type
 */
export async function verifyFileSignature(file: File, expectedMimeType: string): Promise<boolean> {
  const signatures = FILE_SIGNATURES[expectedMimeType];
  if (!signatures || signatures.length === 0) {
    // If we don't have signatures for this type, skip verification
    return true;
  }
  
  // Read enough bytes to check all possible signatures
  const maxBytes = Math.max(...signatures.map(sig => sig.offset + sig.signature.length));
  const buffer = await file.slice(0, maxBytes).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // Check if any signature matches
  return signatures.some(({ signature, offset }) => {
    if (bytes.length < offset + signature.length) {
      return false;
    }
    
    return signature.every((byte, index) => bytes[offset + index] === byte);
  });
}

/**
 * Validate file size against type-specific limits
 */
export function validateFileSize(file: File, mimeType: string): boolean {
  const maxSize = MAX_FILE_SIZES[mimeType];
  if (!maxSize) {
    // If no specific limit, use a general limit of 50MB
    return file.size <= 50 * 1024 * 1024;
  }
  
  return file.size <= maxSize;
}

/**
 * Comprehensive file validation
 */
export async function validateFile(
  file: File,
  allowedMimeTypes: string[],
  customMaxSize?: number
): Promise<{ valid: boolean; error?: string }> {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  // Validate MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }
  
  // Validate file extension
  if (!validateFileExtension(file.name, allowedMimeTypes)) {
    return { valid: false, error: 'File extension does not match allowed types' };
  }
  
  // Validate file size
  const maxSize = customMaxSize || MAX_FILE_SIZES[file.type] || 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB` 
    };
  }
  
  // Verify file signature
  const validSignature = await verifyFileSignature(file, file.type);
  if (!validSignature) {
    return { valid: false, error: 'File content does not match its type' };
  }
  
  return { valid: true };
}

/**
 * Generate secure filename with timestamp and user ID
 */
export function generateSecureFilename(userId: string, originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const ext = sanitized.split('.').pop() || 'unknown';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return `${userId}/${timestamp}-${random}.${ext}`;
}

/**
 * Sanitize folder path to prevent directory traversal
 */
export function sanitizeFolderPath(folder: string): string {
  // Remove any path traversal attempts
  let sanitized = folder.replace(/\.\./g, '');
  
  // Remove leading/trailing slashes
  sanitized = sanitized.replace(/^\/+|\/+$/g, '');
  
  // Remove multiple consecutive slashes
  sanitized = sanitized.replace(/\/+/g, '/');
  
  // Only allow alphanumeric, hyphens, underscores, and single slashes
  sanitized = sanitized.replace(/[^a-zA-Z0-9\/_-]/g, '_');
  
  return sanitized;
}