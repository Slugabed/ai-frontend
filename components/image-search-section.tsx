"use client";

import { useState, FormEvent } from "react";
import { Search, X, ImageIcon } from "lucide-react";
import { ImageSearchResult } from "@/types";
import { searchImages } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageSearchResults } from "@/components/image-search-results";

export function ImageSearchSection() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ImageSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await searchImages(query.trim(), 20);
      setResults(data);
    } catch (err) {
      setError("Image search failed. Please try again.");
      console.error(err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h2 className="text-lg font-semibold mb-4">Search Images by Text</h2>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Describe what you're looking for... (e.g., 'sunset on beach', 'cat playing')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </form>

      {error && (
        <div className="mt-4 bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <ImageSearchResults
        results={results}
        isLoading={isLoading}
        hasSearched={hasSearched}
      />
    </div>
  );
}
