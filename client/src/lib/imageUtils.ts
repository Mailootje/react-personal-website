/**
 * Utility functions for handling images
 */

/**
 * Converts an image to WebP format with optional resizing
 * @param imageFile - The image file to convert
 * @param quality - The quality of the WebP image (0-1)
 * @param maxWidth - Maximum width of the resulting image (preserves aspect ratio)
 * @param maxHeight - Maximum height of the resulting image (preserves aspect ratio)
 * @returns Promise with base64 encoded WebP image and MIME type
 */
export async function convertToWebP(
  imageFile: File,
  quality = 0.8,
  maxWidth = 1600,
  maxHeight = 1200
): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Calculate dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        // Resize if needed
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // Create canvas with new dimensions
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw image to canvas with new dimensions
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to WebP
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          const base64Data = webpData.split(',')[1]; // Remove the data URL prefix
          resolve({ base64Data, mimeType: 'image/webp' });
        } catch (error) {
          // Fallback to original format if WebP is not supported
          try {
            const originalType = imageFile.type || 'image/jpeg';
            const originalData = canvas.toDataURL(originalType, quality);
            const base64Data = originalData.split(',')[1]; // Remove the data URL prefix
            resolve({ base64Data, mimeType: originalType });
          } catch (fallbackError) {
            reject(fallbackError);
          }
        }
      };
      
      img.onerror = reject;
    };
    
    reader.onerror = reject;
  });
}

/**
 * Converts a base64 string to a Blob
 * @param base64 - The base64 string to convert
 * @param mimeType - The MIME type of the data
 * @returns Blob of the converted data
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: mimeType });
}

/**
 * Create an object URL from base64 data
 * @param base64 - The base64 string
 * @param mimeType - The MIME type of the data
 * @returns Object URL
 */
export function createObjectURLFromBase64(base64: string, mimeType: string): string {
  const blob = base64ToBlob(base64, mimeType);
  return URL.createObjectURL(blob);
}