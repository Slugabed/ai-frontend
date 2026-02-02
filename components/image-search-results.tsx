"use client";

import { Download, Image as ImageIcon } from "lucide-react";
import { ImageSearchResult } from "@/types";
import { downloadImage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ImageSearchResultsProps {
  results: ImageSearchResult[];
  isLoading: boolean;
  hasSearched: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 0.8) return "text-green-600 dark:text-green-400";
  if (score >= 0.5) return "text-yellow-600 dark:text-yellow-400";
  return "text-muted-foreground";
}

function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageSearchResults({ results, isLoading, hasSearched }: ImageSearchResultsProps) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (id: number, fileName: string) => {
    setDownloadingId(id);
    try {
      const blob = await downloadImage(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Searching...</p>
      </div>
    );
  }

  if (!hasSearched) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No images found</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground mb-3">
        Found {results.length} image{results.length !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {results.map((result) => (
          <div
            key={result.id}
            className="group relative rounded-lg overflow-hidden border bg-card hover:shadow-lg transition-shadow"
          >
            <div className="aspect-square bg-muted flex items-center justify-center">
              <img
                src={result.viewUrl}
                alt={result.originalFileName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement?.classList.add("flex", "items-center", "justify-center");
                }}
              />
              <ImageIcon className="h-12 w-12 text-muted-foreground hidden" />
            </div>

            {/* Overlay with score and download */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${getScoreColor(result.score)} bg-black/50 px-2 py-0.5 rounded`}>
                    {formatScore(result.score)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => handleDownload(result.id, result.originalFileName)}
                    disabled={downloadingId === result.id}
                  >
                    {downloadingId === result.id ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* File info */}
            <div className="p-2">
              <p className="text-sm font-medium truncate">{result.originalFileName}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(result.fileSize)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
