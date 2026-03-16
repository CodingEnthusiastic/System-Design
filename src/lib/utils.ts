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
  const imageUrl = `${API_URL}${imagePath}`;
  
  // Log for debugging
  if (import.meta.env.DEV) {
    console.log('Image URL constructed:', { imagePath, apiUrl: API_URL, fullUrl: imageUrl });
  }
  
  return imageUrl;
}
