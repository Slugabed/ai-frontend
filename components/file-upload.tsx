"use client";

import { useState, useCallback } from "react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { uploadFiles } from "@/lib/api";
import { UploadResult } from "@/types";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onUploadComplete: () => void;
}

interface UploadingFile {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  message?: string;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const handleFiles = useCallback(async (files: File[]) => {
    const pdfFiles = files.filter((f) => f.type === "application/pdf");

    if (pdfFiles.length === 0) {
      return;
    }

    const newUploadingFiles: UploadingFile[] = pdfFiles.map((file) => ({
      file,
      status: "uploading" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    const results = await uploadFiles(pdfFiles);

    setUploadingFiles((prev) =>
      prev.map((uf) => {
        const result = results.find((r) => r.fileName === uf.file.name);
        if (result) {
          return {
            ...uf,
            status: result.success ? "success" : "error",
            message: result.message,
          };
        }
        return uf;
      })
    );

    onUploadComplete();

    // Clear completed uploads after 3 seconds
    setTimeout(() => {
      setUploadingFiles((prev) => prev.filter((uf) => uf.status === "uploading"));
    }, 3000);
  }, [onUploadComplete]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        handleFiles(files);
      }
      e.target.value = "";
    },
    [handleFiles]
  );

  const removeUploadingFile = (fileName: string) => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.file.name !== fileName));
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }
        `}
      >
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">
          Drag & drop PDF files here
        </p>
        <p className="text-sm text-muted-foreground mb-4">or</p>
        <Button variant="outline" asChild>
          <label className="cursor-pointer">
            Browse files
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </Button>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uf) => (
            <div
              key={uf.file.name}
              className="flex items-center justify-between p-3 bg-muted rounded-md"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {uf.status === "uploading" && (
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
                {uf.status === "success" && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {uf.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="truncate text-sm">{uf.file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeUploadingFile(uf.file.name)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
