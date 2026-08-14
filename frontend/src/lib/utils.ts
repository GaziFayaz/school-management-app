import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFileUrl(fileUrl: string | undefined | null): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  const cleanBase = apiBase.replace(/\/+$/, '');
  const serverOrigin = cleanBase.replace(/\/api$/, '');

  if (fileUrl.startsWith('/api/')) {
    return `${serverOrigin}${fileUrl}`;
  }

  return `${serverOrigin}/api${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}
