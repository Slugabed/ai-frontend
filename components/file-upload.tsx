"use client";

import { useState, useCallback } from "react";
import { Upload, X, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadQueue } from "@/contexts/upload-queue-context";

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const { queuedItems, enqueue, removeFromQueue, retryFailed } = useUploadQueue();

  const pdfItems = queuedItems.filter((i) => i.fileType === "pdf");
  const hasFailedItems = pdfItems.some((i) => i.status === "failed");

  const handleFiles = useCallback(
    async (files: File[]) => {
      const pdfFiles = files.filter((f) => f.type === "application/pdf");
      if (pdfFiles.length === 0) return;
      await enqueue(pdfFiles, "pdf");
    },
    [enqueue]
  );

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

  // Only show active (non-completed) items, or recently completed
  const visibleItems = pdfItems.filter(
    (i) =>
      i.status !== "completed" ||
      Date.now() - i.createdAt < 60 * 1000
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${
            isDragging
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

      {visibleItems.length > 0 && (
        <div className="space-y-2">
          {hasFailedItems && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={retryFailed}>
                <RotateCcw className="h-3 w-3 mr-2" />
                Retry failed
              </Button>
            </div>
          )}
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-muted rounded-md"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {(item.status === "uploading" || item.status === "queued") && (
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
                {item.status === "completed" && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {item.status === "failed" && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="truncate text-sm">{item.fileName}</span>
                {item.status === "queued" && (
                  <span className="text-xs text-muted-foreground">queued</span>
                )}
                {item.status === "failed" && item.errorMessage && (
                  <span className="text-xs text-destructive truncate">
                    {item.errorMessage}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeFromQueue(item.id)}
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
