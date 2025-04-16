import sharp from 'sharp';
// File system imports and upload directory removed as we now store images directly in the database

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

// File-based image storage functions removed as we now store images directly in the database

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