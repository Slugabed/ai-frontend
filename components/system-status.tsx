"use client";

import { useEffect, useState, useCallback } from "react";
import { SystemHealth, ComponentHealth } from "@/types";
import { fetchSystemHealth } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Server, Database, Brain, Image as ImageIcon } from "lucide-react";

const COMPONENT_INFO: Record<string, { label: string; description: string; icon: React.ElementType }> = {
  ollama: {
    label: "Ollama",
    description: "Text embeddings (bge-m3)",
    icon: Brain,
  },
  sigLip: {
    label: "SigLIP",
    description: "Image embeddings",
    icon: ImageIcon,
  },
  qdrant: {
    label: "Qdrant",
    description: "Vector database",
    icon: Database,
  },
  minio: {
    label: "MinIO",
    description: "Object storage",
    icon: Server,
  },
  db: {
    label: "PostgreSQL",
    description: "Metadata database",
    icon: Database,
  },
  diskSpace: {
    label: "Disk Space",
    description: "Available storage",
    icon: Server,
  },
  ping: {
    label: "Backend",
    description: "API server",
    icon: Server,
  },
};

function StatusIcon({ status }: { status: string }) {
  if (status === "UP") {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  }
  if (status === "DOWN") {
    return <XCircle className="h-5 w-5 text-red-500" />;
  }
  return <AlertCircle className="h-5 w-5 text-yellow-500" />;
}

function StatusBadge({ status }: { status: string }) {
  const colorClass = status === "UP"
    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    : status === "DOWN"
    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
}

interface ComponentCardProps {
  name: string;
  health: ComponentHealth;
}

function ComponentCard({ name, health }: ComponentCardProps) {
  const info = COMPONENT_INFO[name] || {
    label: name.charAt(0).toUpperCase() + name.slice(1),
    description: "External service",
    icon: Server,
  };
  const Icon = info.icon;

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium">{info.label}</h3>
            <p className="text-sm text-muted-foreground">{info.description}</p>
          </div>
        </div>
        <StatusIcon status={health.status} />
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <StatusBadge status={health.status} />
        </div>

        {health.url && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">URL</span>
            <span className="font-mono text-xs truncate max-w-[200px]">{String(health.url)}</span>
          </div>
        )}

        {health.error && (
          <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs">
            {String(health.error)}
          </div>
        )}
      </div>
    </div>
  );
}

export function SystemStatus() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSystemHealth();
      setHealth(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Failed to fetch system health. Is the backend running?");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, [loadHealth]);

  const upCount = health
    ? Object.values(health.components).filter(c => c.status === "UP").length
    : 0;
  const totalCount = health ? Object.keys(health.components).length : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">System Status</h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={loadHealth} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {isLoading && !health ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading system status...</p>
        </div>
      ) : health ? (
        <>
          {/* Overall status */}
          <div className={`rounded-lg p-4 mb-6 ${
            health.status === "UP"
              ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
          }`}>
            <div className="flex items-center gap-3">
              <StatusIcon status={health.status} />
              <div>
                <h3 className="font-semibold">
                  {health.status === "UP" ? "All Systems Operational" : "Some Systems Down"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {upCount} of {totalCount} components healthy
                </p>
              </div>
            </div>
          </div>

          {/* Component grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(health.components).map(([name, componentHealth]) => (
              <ComponentCard key={name} name={name} health={componentHealth} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
