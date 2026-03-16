import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  
  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // For production deployment, use the API URL from environment
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Ensure imagePath starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  const imageUrl = `${API_URL}${normalizedPath}`;
  
  // Log for debugging in development
  if (import.meta.env.DEV) {
    console.log('🖼️  Image URL:', { 
      original: imagePath, 
      normalized: normalizedPath,
      apiUrl: API_URL, 
      fullUrl: imageUrl 
    });
  }
  
  return imageUrl;
}
