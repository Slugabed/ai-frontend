export interface FileInfo {
  id: number;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  ownerEmail?: string;
  viewUrl?: string;
}

export interface User {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DeleteResponse {
  deleted: number;
  message: string;
}

export interface UploadResult {
  success: boolean;
  message: string;
  fileName: string;
}

export interface TextChunk {
  content: string;
  offsetInDocument: number;
}

export interface ScoredChunk {
  text: TextChunk;
  pdfMetadataId: number;
  fileName: string;
  score: number;
}

// Image types
export interface ImageInfo {
  id: number;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  contentType: string;
  width?: number;
  height?: number;
  uploadDate: string;
  ownerEmail?: string;
  viewUrl?: string;
  thumbnailUrl?: string;
}

export interface ImageSearchResult {
  id: number;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  contentType: string;
  uploadDate: string;
  score: number;
  viewUrl?: string;
  thumbnailUrl?: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Health status types
export interface ComponentHealth {
  status: string;
  url?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  status: string;
  components: Record<string, ComponentHealth>;
}
