import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  
  // Handle Google Drive URLs - use proxy endpoint to bypass CORS
  if (imagePath.includes('drive.google.com')) {
    const fileId = extractGoogleDriveFileId(imagePath);
    if (fileId) {
      // Use backend proxy to load Google Drive images
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${apiUrl}/api/proxy/gdrive/${fileId}`;
    }
    return '';
  }
  
  // Only return full URLs (http/https)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Reject local paths like /uploads/ - they don't exist anymore
  if (imagePath.startsWith('/')) {
    console.warn('⚠️  Rejected old server path:', imagePath);
    return '';
  }
  
  // Return empty for anything else
  return '';
}

function extractGoogleDriveFileId(url: string): string {
  // Format 1: https://drive.google.com/file/d/FILE_ID/view
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (match1) return match1[1];
  
  // Format 2: https://drive.google.com/open?id=FILE_ID
  const match2 = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (match2) return match2[1];
  
  // Format 3: Already in uc?export=view format - extract ID
  const match3 = url.match(/id=([a-zA-Z0-9-_]+)/);
  if (match3) return match3[1];
  
  return '';
}
