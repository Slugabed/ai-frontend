"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { FileInfo } from "@/types";
import { fetchFiles } from "@/lib/api";
import { FilesTable } from "@/components/files-table";
import { FileUpload } from "@/components/file-upload";
import { SearchSection } from "@/components/search-section";
import { ImagesTable } from "@/components/images-table";
import { ImageUpload } from "@/components/image-upload";
import { ImageSearchSection } from "@/components/image-search-section";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, Shield, FileText, Image as ImageIcon, Activity } from "lucide-react";
import { SystemStatus } from "@/components/system-status";
import { useAuth } from "@/contexts/auth-context";
import { useUploadQueue } from "@/contexts/upload-queue-context";

type TabType = "documents" | "images" | "status";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("documents");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading, isAdmin, logout } = useAuth();
  const { queuedItems } = useUploadQueue();

  const loadFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    setError(null);
    try {
      const data = await fetchFiles();
      setFiles(data);
    } catch (err) {
      setError("Failed to load files. Is the backend running?");
      console.error(err);
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [loadFiles, user]);

  // Auto-refresh file/image lists when uploads complete
  const prevCompletedRef = useRef(0);
  useEffect(() => {
    const completedCount = queuedItems.filter(
      (i) => i.status === "completed"
    ).length;
    if (completedCount > prevCompletedRef.current && prevCompletedRef.current >= 0) {
      const pdfCompleted = queuedItems.some(
        (i) => i.status === "completed" && i.fileType === "pdf"
      );
      const imageCompleted = queuedItems.some(
        (i) => i.status === "completed" && i.fileType === "image"
      );
      if (pdfCompleted) loadFiles();
      if (imageCompleted) setImageRefreshKey((k) => k + 1);
    }
    prevCompletedRef.current = completedCount;
  }, [queuedItems, loadFiles]);

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

  const isLoading = activeTab === "documents" ? isLoadingFiles : false;
  const handleRefresh = activeTab === "documents" ? loadFiles : () => {};
  const showRefreshButton = activeTab === "documents";

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
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex rounded-lg border p-1 bg-muted">
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "documents"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-4 w-4" />
              Documents
            </button>
            <button
              onClick={() => setActiveTab("images")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "images"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              Images
            </button>
            <button
              onClick={() => setActiveTab("status")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "status"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="h-4 w-4" />
              Status
            </button>
          </div>

          <div className="flex-1" />

          {showRefreshButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <>
            <h2 className="text-3xl font-bold mb-6">PDF Files</h2>

            <FileUpload />

            <div className="mt-6">
              <SearchSection />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4 mt-6">
                {error}
              </div>
            )}

            <div className="mt-6">
              {isLoadingFiles ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <FilesTable files={files} onRefresh={loadFiles} isAdmin={isAdmin} />
              )}
            </div>
          </>
        )}

        {/* Images Tab */}
        {activeTab === "images" && (
          <>
            <h2 className="text-3xl font-bold mb-6">Images</h2>

            <ImageUpload />

            <div className="mt-6">
              <ImageSearchSection />
            </div>

            <div className="mt-6">
              <ImagesTable onRefresh={() => {}} isAdmin={isAdmin} refreshKey={imageRefreshKey} />
            </div>
          </>
        )}

        {/* Status Tab */}
        {activeTab === "status" && <SystemStatus />}
      </div>
    </div>
  );
}
