"use client";

import { useState, useCallback } from "react";
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react";
import { uploadImages } from "@/lib/api";
import { UploadResult } from "@/types";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onUploadComplete: () => void;
}

interface UploadingFile {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  message?: string;
  preview?: string;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function ImageUpload({ onUploadComplete }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const handleFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter((f) => ACCEPTED_IMAGE_TYPES.includes(f.type));

    if (imageFiles.length === 0) {
      return;
    }

    const newUploadingFiles: UploadingFile[] = imageFiles.map((file) => ({
      file,
      status: "uploading" as const,
      preview: URL.createObjectURL(file),
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    const results = await uploadImages(imageFiles);

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
      setUploadingFiles((prev) => {
        prev.forEach((uf) => {
          if (uf.preview) URL.revokeObjectURL(uf.preview);
        });
        return prev.filter((uf) => uf.status === "uploading");
      });
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
    setUploadingFiles((prev) => {
      const fileToRemove = prev.find((uf) => uf.file.name === fileName);
      if (fileToRemove?.preview) URL.revokeObjectURL(fileToRemove.preview);
      return prev.filter((uf) => uf.file.name !== fileName);
    });
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
        <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">
          Drag & drop images here
        </p>
        <p className="text-xs text-muted-foreground mb-4">JPEG, PNG, GIF, WebP</p>
        <Button variant="outline" asChild>
          <label className="cursor-pointer">
            Browse images
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </Button>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {uploadingFiles.map((uf) => (
            <div
              key={uf.file.name}
              className="relative group rounded-lg overflow-hidden border bg-muted"
            >
              {uf.preview && (
                <img
                  src={uf.preview}
                  alt={uf.file.name}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                {uf.status === "uploading" && (
                  <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {uf.status === "success" && (
                  <CheckCircle className="h-8 w-8 text-green-400" />
                )}
                {uf.status === "error" && (
                  <AlertCircle className="h-8 w-8 text-red-400" />
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => removeUploadingFile(uf.file.name)}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="p-2">
                <p className="text-xs truncate">{uf.file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
