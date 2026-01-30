"use client";

import { useEffect, useState, useCallback } from "react";
import { FileInfo } from "@/types";
import { fetchFiles } from "@/lib/api";
import { FilesTable } from "@/components/files-table";
import { FileUpload } from "@/components/file-upload";
import { SearchSection } from "@/components/search-section";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading, isAdmin, logout } = useAuth();

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFiles();
      setFiles(data);
    } catch (err) {
      setError("Failed to load files. Is the backend running?");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [loadFiles, user]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // User will be redirected by auth context if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with user info */}
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">RAG App</h1>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">PDF Files</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={loadFiles}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <FileUpload onUploadComplete={loadFiles} />

        <div className="mt-6">
          <SearchSection />
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4 mt-6">
            {error}
          </div>
        )}

        <div className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <FilesTable files={files} onRefresh={loadFiles} isAdmin={isAdmin} />
          )}
        </div>
      </div>
    </div>
  );
}
