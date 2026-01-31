"use client";

import { useState } from "react";
import { Trash2, Download, Image as ImageIcon } from "lucide-react";
import { ImageInfo } from "@/types";
import { deleteImageById, deleteImagesByIds, downloadImage, getImageDownloadUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ImagesTableProps {
  images: ImageInfo[];
  onRefresh: () => void;
  isAdmin?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ImagesTable({ images, onRefresh, isAdmin = false }: ImagesTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(images.map((img) => img.id)));
    }
  };

  const handleDownload = async (image: ImageInfo) => {
    setDownloadingId(image.id);
    try {
      const blob = await downloadImage(image.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = image.originalFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download image:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteOne = async (id: number) => {
    setIsDeleting(true);
    try {
      await deleteImageById(id);
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      onRefresh();
    } catch (error) {
      console.error("Failed to delete image:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      await deleteImagesByIds(Array.from(selectedIds));
      setSelectedIds(new Set());
      onRefresh();
    } catch (error) {
      console.error("Failed to delete images:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (images.length === 0) return;
    setIsDeleting(true);
    try {
      await deleteImagesByIds(images.map((img) => img.id));
      setSelectedIds(new Set());
      onRefresh();
    } catch (error) {
      console.error("Failed to delete all images:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No images uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Select All */}
      <div className="flex items-center gap-2 mb-4">
        <Checkbox
          checked={selectedIds.size === images.length && images.length > 0}
          onCheckedChange={toggleSelectAll}
        />
        <span className="text-sm text-muted-foreground">
          {selectedIds.size > 0
            ? `${selectedIds.size} of ${images.length} selected`
            : `Select all (${images.length} images)`}
        </span>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className={`group relative rounded-lg overflow-hidden border bg-card transition-all ${
              selectedIds.has(image.id) ? "ring-2 ring-primary" : ""
            }`}
          >
            {/* Checkbox */}
            <div className="absolute top-2 left-2 z-10">
              <Checkbox
                checked={selectedIds.has(image.id)}
                onCheckedChange={() => toggleSelect(image.id)}
                className="bg-white/80 border-gray-400"
              />
            </div>

            {/* Image */}
            <div className="aspect-square bg-muted">
              <img
                src={getImageDownloadUrl(image.id)}
                alt={image.originalFileName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/20 hover:bg-white/30 text-white"
                onClick={() => handleDownload(image)}
                disabled={downloadingId === image.id}
              >
                {downloadingId === image.id ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/20 hover:bg-red-500/80 text-white"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete image?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{image.originalFileName}&quot;? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteOne(image.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Info */}
            <div className="p-2">
              <p className="text-xs font-medium truncate">{image.originalFileName}</p>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatFileSize(image.fileSize)}</span>
                {isAdmin && image.ownerEmail && (
                  <span className="truncate ml-2">{image.ownerEmail}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="flex gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={selectedIds.size === 0 || isDeleting}
            >
              Delete Selected ({selectedIds.size})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete selected images?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedIds.size} selected image(s)? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSelected}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={images.length === 0 || isDeleting}
            >
              Delete All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all images?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete all {images.length} image(s)? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAll}>
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
