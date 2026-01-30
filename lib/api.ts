import { FileInfo, DeleteResponse, UploadResult, ScoredChunk } from "@/types";
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

export function getDownloadUrl(id: number): string {
  const token = getToken();
  // For download links, we'll use a different approach since we can't add headers to <a> tags
  // We'll need to handle this in the component
  return `${API_BASE_URL}/files/${id}/download`;
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
