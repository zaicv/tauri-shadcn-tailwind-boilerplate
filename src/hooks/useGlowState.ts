import { useEffect, useState } from "react";

// Mirror your backend GlowState types
export interface SystemState {
  cpu_usage: number;
  ram_usage: number;
  disk_free_gb: number;
  disk_used_gb?: number;
  disk_total_gb?: number;
  disk_read_mb_per_sec?: number;
  disk_write_mb_per_sec?: number;
  network_status: string;
  network_sent_mb?: number;
  network_recv_mb?: number;
  network_sent_mb_per_sec?: number;
  network_recv_mb_per_sec?: number;
  uptime_seconds: number;
  battery_percent?: number | null;
  battery_plugged?: boolean | null;
  cpu_temp_c?: number | null;
  running_apps?: string[];
  active_ports?: Array<{ port: number; protocol: string; pid?: number }>;
}

export interface RuntimeState {
  backend_running: boolean;
  ollama_running: boolean;
  plex_running: boolean;
  active_model: string | null;
  available_models: string[];
  persona: string | null;
  voice_mode: boolean;
  superpowers_loaded: string[];
  tokens_today: number;
}

export interface DeviceState {
  frontmost_app: string | null;
  frontmost_window?: string | null;
  selected_text: string | null;
  clipboard: string | null;
  disc_mounted: boolean;
  disc_path: string | null;
  downloads_recent: string[];
  recent_files?: Array<{ name: string; path: string; modified: number }>;
  screen_brightness?: number | null;
  audio_output_volume?: number | null;
}

export interface EnvironmentState {
  now: string; // ISO datetime string
  timezone: string;
}

export interface MemoryState {
  last_ingested_file: string | null;
  last_memory_added: string | null;
  memory_count: number;
}

export interface TaskInfo {
  id: string;
  type: string;
  status: string;
  progress: number;
  message: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface TasksState {
  active: TaskInfo[];
  recent: TaskInfo[];
}

export interface GlowState {
  system: SystemState;
  runtime: RuntimeState;
  device: DeviceState;
  environment: EnvironmentState;
  memory: MemoryState;
  tasks: TasksState;
  extra: Record<string, any>;
}

// Primary backend IP - use this for network access
const BACKEND_IP = "100.83.147.76";

// Get possible API URLs to try
const getApiUrls = () => {
  const urls: string[] = [];
  
  
  if (import.meta.env.VITE_API_URL) {
    urls.push(import.meta.env.VITE_API_URL);
  }
  
  const currentHost = window.location.hostname;
  const isHttps = window.location.protocol === "https:";
  const isTauriProtocol = window.location.protocol === 'tauri:' || window.location.hostname === 'tauri.localhost';
  const hasTauriGlobal = typeof (window as any).__TAURI__ !== 'undefined' || typeof (window as any).__TAURI_INTERNALS__ !== 'undefined';
  const isTauri = isTauriProtocol || hasTauriGlobal;
  
  // If in Tauri, ALWAYS try the Tailscale IP first
  if (isTauri) {
    urls.push(`https://${BACKEND_IP}:8003`);
    urls.push(`https://${BACKEND_IP}:8000`);
    urls.push(`http://${BACKEND_IP}:8003`);
    urls.push(`http://${BACKEND_IP}:8000`);
  }
  // Use the primary backend IP for network access
  else if (currentHost.match(/^\d+\.\d+\.\d+\.\d+$/) || isHttps) {
    // Try primary backend IP first
    if (isHttps) {
      urls.push(`https://${BACKEND_IP}:8003`);
      urls.push(`https://${BACKEND_IP}:8000`);
    }
    urls.push(`http://${BACKEND_IP}:8000`);
    urls.push(`http://${BACKEND_IP}:8003`);
    
    // Also try current host IP as fallback
    if (currentHost !== BACKEND_IP && currentHost.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      if (isHttps) {
        urls.push(`https://${currentHost}:8003`);
        urls.push(`https://${currentHost}:8000`);
      }
      urls.push(`http://${currentHost}:8000`);
      urls.push(`http://${currentHost}:8003`);
    }
  } else {
    // Localhost fallback
    urls.push("http://localhost:8000");
    urls.push("http://localhost:8003");
  }
  
  // Remove duplicates
  return [...new Set(urls)];
};

export interface DebugInfo {
  attemptedUrls: Array<{ url: string; error?: string; status?: string }>;
  currentUrl: string | null;
  environment: {
    hostname: string;
    protocol: string;
    viteApiUrl: string | undefined;
  };
}

export function useGlowState(pollMs = 5000) {
  const [state, setState] = useState<GlowState | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    attemptedUrls: [],
    currentUrl: null,
    environment: {
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      viteApiUrl: import.meta.env.VITE_API_URL,
    },
  });

  useEffect(() => {
    let cancelled = false;
    const apiUrls = getApiUrls();

    async function fetchState() {
      const attempted: Array<{ url: string; error?: string; status?: string }> = [];
      let lastError: Error | null = null;

      // Try each URL in sequence
      for (const url of apiUrls) {
        if (cancelled) return;
        
        const fullUrl = `${url}/glow/state`;
        attempted.push({ url: fullUrl });

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          console.log(`[GlowState] Attempting: ${fullUrl}`);
          const startTime = Date.now();
          
          const res = await fetch(fullUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          const duration = Date.now() - startTime;
          console.log(`[GlowState] Response from ${fullUrl}: ${res.status} (${duration}ms)`);

          if (!res.ok) {
            const errorText = await res.text().catch(() => `HTTP ${res.status}`);
            attempted[attempted.length - 1].error = `HTTP ${res.status}: ${errorText}`;
            attempted[attempted.length - 1].status = `Failed (${res.status})`;
            lastError = new Error(`HTTP ${res.status}: ${errorText}`);
            continue;
          }

          const json = await res.json();
          console.log(`[GlowState] Success! Connected to ${fullUrl}`);
          
          if (!cancelled) {
            setState(json);
            setError(null);
            setLoading(false);
            setDebugInfo({
              attemptedUrls: attempted,
              currentUrl: fullUrl,
              environment: {
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                viteApiUrl: import.meta.env.VITE_API_URL,
              },
            });
            return; // Success!
          }
        } catch (e) {
          clearTimeout(timeoutId);
          const errorMsg = e instanceof Error ? e.message : String(e);
          const errorName = e instanceof Error ? e.name : "UnknownError";
          console.error(`[GlowState] Failed ${fullUrl}:`, errorName, errorMsg);
          
          attempted[attempted.length - 1].error = `${errorName}: ${errorMsg}`;
          attempted[attempted.length - 1].status = "Failed";
          lastError = e instanceof Error ? e : new Error(String(e));
        }
      }

      // All URLs failed
      if (!cancelled) {
        console.error(`[GlowState] All ${apiUrls.length} URLs failed`);
        setError(
          new Error(
            `Cannot connect to backend. Tried ${apiUrls.length} URLs. Last error: ${lastError?.message || "Unknown"}`
          )
        );
        setLoading(false);
        setDebugInfo({
          attemptedUrls: attempted,
          currentUrl: null,
          environment: {
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            viteApiUrl: import.meta.env.VITE_API_URL,
          },
        });
      }
    }

    fetchState();
    const id = setInterval(fetchState, pollMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs]);

  return { state, error, loading, debugInfo };
}