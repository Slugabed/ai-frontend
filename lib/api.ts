import { FileInfo, DeleteResponse, UploadResult, ScoredChunk, ImageInfo, ImageSearchResult, SystemHealth, PagedResponse } from "@/types";
import { getToken } from "./auth";

const API_BASE_URL = "/api";

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/ingest`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  const message = await response.text();
  return {
    success: response.ok,
    message,
    fileName: file.name,
  };
}

export async function uploadFiles(files: File[]): Promise<UploadResult[]> {
  return Promise.all(files.map(uploadFile));
}

export async function downloadFile(id: number): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/files/${id}/download`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to download file");
  }
  return response.blob();
}

export async function fetchFiles(): Promise<FileInfo[]> {
  const response = await fetch(`${API_BASE_URL}/files`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch files");
  }
  return response.json();
}

export async function deleteFileById(id: number): Promise<DeleteResponse> {
  const response = await fetch(`${API_BASE_URL}/files/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to delete file");
  }
  return response.json();
}

export async function deleteFilesByIds(ids: number[]): Promise<DeleteResponse> {
  const response = await fetch(`${API_BASE_URL}/files`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new Error("Failed to delete files");
  }
  return response.json();
}

export async function searchDocuments(question: string): Promise<ScoredChunk[]> {
  const response = await fetch(`${API_BASE_URL}/question`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "text/plain",
    },
    body: question,
  });
  if (!response.ok) {
    throw new Error("Search failed");
  }
  return response.json();
}

// Image API functions
export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/images`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  if (response.ok) {
    const data = await response.json();
    return {
      success: true,
      message: `Image uploaded: ${data.originalFileName}`,
      fileName: file.name,
    };
  } else {
    return {
      success: false,
      message: "Failed to upload image",
      fileName: file.name,
    };
  }
}

export async function uploadImages(files: File[]): Promise<UploadResult[]> {
  return Promise.all(files.map(uploadImage));
}

export async function fetchImages(): Promise<ImageInfo[]> {
  const response = await fetch(`${API_BASE_URL}/images`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch images");
  }
  const data: PagedResponse<ImageInfo> = await response.json();
  return data.content;
}

export async function fetchImagesPage(page: number = 0, size: number = 30): Promise<PagedResponse<ImageInfo>> {
  const response = await fetch(`${API_BASE_URL}/images?page=${page}&size=${size}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch images");
  }
  return response.json();
}

export async function downloadImage(id: number): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/images/${id}/download`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to download image");
  }
  return response.blob();
}

export async function deleteImageById(id: number): Promise<DeleteResponse> {
  const response = await fetch(`${API_BASE_URL}/images/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to delete image");
  }
  return response.json();
}

export async function deleteImagesByIds(ids: number[]): Promise<DeleteResponse> {
  const response = await fetch(`${API_BASE_URL}/images`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new Error("Failed to delete images");
  }
  return response.json();
}

export async function searchImages(query: string, limit: number = 10): Promise<ImageSearchResult[]> {
  const response = await fetch(`${API_BASE_URL}/images/search`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit }),
  });
  if (!response.ok) {
    throw new Error("Image search failed");
  }
  return response.json();
}

// Health API
export async function fetchSystemHealth(): Promise<SystemHealth> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch health status");
  }
  return response.json();
}
