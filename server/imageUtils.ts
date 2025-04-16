import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Ensure the upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'profiles');

export async function ensureUploadDirExists() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    throw error;
  }
}

/**
 * Converts an image buffer to WebP format and resizes it to 256x256
 * @param imageBuffer The buffer containing the image data
 * @returns A buffer containing the WebP image data
 */
export async function convertToWebP(imageBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(imageBuffer)
      .resize(256, 256, {
        fit: 'cover',      // Maintain aspect ratio and cover the entire area
        position: 'center' // Center the image
      })
      .webp({ quality: 80 }) // Convert to WebP with 80% quality (good balance between size and quality)
      .toBuffer();
  } catch (error) {
    console.error('Error converting image to WebP:', error);
    throw error;
  }
}

/**
 * Saves a WebP image to disk and returns the file path
 * @param webpBuffer The buffer containing the WebP image
 * @returns The URL path to the saved image
 */
export async function saveProfileImage(webpBuffer: Buffer): Promise<string> {
  await ensureUploadDirExists();
  
  // Generate a unique filename
  const filename = `${crypto.randomBytes(16).toString('hex')}.webp`;
  const filePath = path.join(UPLOAD_DIR, filename);
  
  // Save the file
  await fs.writeFile(filePath, webpBuffer);
  
  // Return the URL path (relative to the public directory)
  return `/uploads/profiles/${filename}`;
}

/**
 * Deletes an existing profile image
 * @param profilePicture The path to the profile picture
 */
export async function deleteProfileImage(profilePicture: string | null | undefined): Promise<void> {
  if (!profilePicture) return;
  
  try {
    // Extract the filename from the path
    const filename = profilePicture.split('/').pop();
    if (!filename) return;
    
    // Build the full file path
    const filePath = path.join(UPLOAD_DIR, filename);
    
    // Check if the file exists
    await fs.access(filePath);
    
    // Delete the file
    await fs.unlink(filePath);
  } catch (error) {
    // File may not exist or we don't have permissions
    console.error('Error deleting profile image:', error);
    // Don't throw so this doesn't interrupt the update process
  }
}

/**
 * Validates that a file is an image based on the MIME type
 * @param mimeType The MIME type of the file
 * @returns True if the file is an image, false otherwise
 */
export function isValidImageType(mimeType: string): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(mimeType);
}

/**
 * Checks if a file is too large
 * @param sizeInBytes The size of the file in bytes
 * @param maxSizeInMB The maximum allowed size in MB
 * @returns True if the file is too large, false otherwise
 */
export function isFileTooLarge(sizeInBytes: number, maxSizeInMB = 5): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes > maxSizeInBytes;
}