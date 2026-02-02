"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { ScoredChunk } from "@/types";
import { downloadFile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SearchResultsProps {
  results: ScoredChunk[];
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

function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function SearchResults({ results, isLoading, hasSearched }: SearchResultsProps) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (id: number, fileName: string) => {
    setDownloadingId(id);
    try {
      const blob = await downloadFile(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download file:", error);
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
        <p className="text-muted-foreground">No results found</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground mb-3">
        Found {results.length} result{results.length !== 1 ? "s" : ""}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File</TableHead>
            <TableHead className="w-1/2">Matched Text</TableHead>
            <TableHead className="w-24 text-center">Relevance</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => (
            <TableRow key={`${result.pdfMetadataId}-${index}`}>
              <TableCell className="font-medium">{result.fileName}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {truncateText(result.text.content)}
              </TableCell>
              <TableCell className={`text-center font-medium ${getScoreColor(result.score)}`}>
                {formatScore(result.score)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(result.pdfMetadataId, result.fileName)}
                  disabled={downloadingId === result.pdfMetadataId}
                >
                  {downloadingId === result.pdfMetadataId ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
