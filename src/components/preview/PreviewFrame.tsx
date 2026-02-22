"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import {
  createImportMap,
  createPreviewHTML,
} from "@/lib/transform/jsx-transformer";
import { AlertCircle, Monitor, Smartphone, Tablet, ChevronDown, RotateCw, RefreshCw, Terminal, X, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

export interface LogEntry {
  level: "error" | "warn" | "info";
  message: string;
  timestamp: number;
  source: "client" | "build";
}

interface DevicePreset {
  name: string;
  width: number;
  height: number;
  icon: typeof Monitor;
  category: "phone" | "tablet" | "desktop";
}

const DEVICE_PRESETS: DevicePreset[] = [
  { name: "iPhone SE", width: 375, height: 667, icon: Smartphone, category: "phone" },
  { name: "iPhone 14 Pro", width: 393, height: 852, icon: Smartphone, category: "phone" },
  { name: "iPhone 14 Pro Max", width: 430, height: 932, icon: Smartphone, category: "phone" },
  { name: "Pixel 7", width: 412, height: 915, icon: Smartphone, category: "phone" },
  { name: "Galaxy S21", width: 360, height: 800, icon: Smartphone, category: "phone" },
  { name: "iPad Mini", width: 768, height: 1024, icon: Tablet, category: "tablet" },
  { name: "iPad Air", width: 820, height: 1180, icon: Tablet, category: "tablet" },
  { name: "iPad Pro 12.9\"", width: 1024, height: 1366, icon: Tablet, category: "tablet" },
  { name: "Laptop", width: 1366, height: 768, icon: Monitor, category: "desktop" },
  { name: "Desktop", width: 1920, height: 1080, icon: Monitor, category: "desktop" },
];

export function PreviewFrame() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getAllFiles, refreshTrigger } = useFileSystem();
  const [error, setError] = useState<string | null>(null);
  const [entryPoint, setEntryPoint] = useState<string>("/App.jsx");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [previewHTML, setPreviewHTML] = useState<string>("");

  // Device state: null = responsive (fill container)
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset | null>(null);
  const [customWidth, setCustomWidth] = useState(375);
  const [customHeight, setCustomHeight] = useState(667);
  const [isRotated, setIsRotated] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logsPanelHeight, setLogsPanelHeight] = useState(220);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev.slice(-499), entry]);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = logsPanelHeight;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = dragStartYRef.current - ev.clientY;
      const newHeight = Math.min(Math.max(dragStartHeightRef.current + delta, 80), window.innerHeight * 0.7);
      setLogsPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [logsPanelHeight]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "__PREVIEW_LOG__" && event.data.log) {
        addLog(event.data.log as LogEntry);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [addLog]);

  useEffect(() => {
    if (showLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, showLogs]);

  // Hydrate device state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("artifex-device");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.deviceName) {
          const device = DEVICE_PRESETS.find((d) => d.name === parsed.deviceName);
          if (device) setSelectedDevice(device);
        }
        if (parsed.customWidth) setCustomWidth(parsed.customWidth);
        if (parsed.customHeight) setCustomHeight(parsed.customHeight);
        if (parsed.isRotated) setIsRotated(parsed.isRotated);
      }
    } catch {
      // Ignore
    }
  }, []);

  const activeWidth = selectedDevice
    ? isRotated ? selectedDevice.height : selectedDevice.width
    : null;
  const activeHeight = selectedDevice
    ? isRotated ? selectedDevice.width : selectedDevice.height
    : null;

  useEffect(() => {
    const updatePreview = () => {
      try {
        const files = getAllFiles();

        if (files.size > 0 && error) {
          setError(null);
        }

        let foundEntryPoint = entryPoint;
        const possibleEntries = [
          "/App.jsx",
          "/App.tsx",
          "/index.jsx",
          "/index.tsx",
          "/src/App.jsx",
          "/src/App.tsx",
        ];

        if (!files.has(entryPoint)) {
          const found = possibleEntries.find((path) => files.has(path));
          if (found) {
            foundEntryPoint = found;
            setEntryPoint(found);
          }
        }

        if (files.size === 0) {
          if (isFirstLoad) {
            setError("firstLoad");
          } else {
            setError("No files to preview");
          }
          return;
        }

        if (isFirstLoad) {
          setIsFirstLoad(false);
        }

        if (!foundEntryPoint || !files.has(foundEntryPoint)) {
          setError(
            "No React component found. Create an App.jsx or index.jsx file to get started."
          );
          return;
        }

        const { importMap, styles, errors } = createImportMap(files);
        const previewHTML = createPreviewHTML(foundEntryPoint, importMap, styles, errors);

        if (errors.length > 0) {
          const now = Date.now();
          const buildLogs: LogEntry[] = errors.map((e) => ({
            level: "error" as const,
            message: `[${e.path}] ${e.error}`,
            timestamp: now,
            source: "build" as const,
          }));
          setLogs((prev) => [...prev.slice(-499 + buildLogs.length), ...buildLogs]);
        }

        setPreviewHTML(previewHTML);
        setError(null);
      } catch (err) {
        console.error("Preview error:", err);
        setError(err instanceof Error ? err.message : "Unknown preview error");
      }
    };

    updatePreview();
  }, [refreshTrigger, getAllFiles, entryPoint, error, isFirstLoad]);

  const persistDevice = (deviceName: string | null, w: number, h: number, rotated: boolean) => {
    try {
      localStorage.setItem("artifex-device", JSON.stringify({ deviceName, customWidth: w, customHeight: h, isRotated: rotated }));
    } catch {
      // Ignore
    }
  };

  const handleSelectDevice = (device: DevicePreset | null) => {
    setSelectedDevice(device);
    setIsRotated(false);
    if (device) {
      setCustomWidth(device.width);
      setCustomHeight(device.height);
      persistDevice(device.name, device.width, device.height, false);
    } else {
      persistDevice(null, customWidth, customHeight, false);
    }
    setPopoverOpen(false);
  };

  const handleWidthChange = (val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) {
      setCustomWidth(n);
      setSelectedDevice(null);
      persistDevice(null, n, customHeight, false);
    }
  };

  const handleHeightChange = (val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) {
      setCustomHeight(n);
      setSelectedDevice(null);
      persistDevice(null, customWidth, n, false);
    }
  };

  const handleRotate = () => {
    if (selectedDevice) {
      const newRotated = !isRotated;
      setIsRotated(newRotated);
      persistDevice(selectedDevice.name, selectedDevice.width, selectedDevice.height, newRotated);
    } else {
      // Swap custom dimensions
      setCustomWidth(customHeight);
      setCustomHeight(customWidth);
      persistDevice(null, customHeight, customWidth, false);
    }
  };

  const displayWidth = activeWidth ?? customWidth;
  const displayHeight = activeHeight ?? customHeight;
  const isResponsive = selectedDevice === null;
  const errorCount = logs.filter((l) => l.level === "error").length;

  const deviceToolbar = (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-neutral-700 bg-neutral-900 text-sm shrink-0">
      {/* Device selector */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-neutral-700 transition-colors text-neutral-300 font-medium">
            {selectedDevice ? (
              <>
                <selectedDevice.icon className="h-3.5 w-3.5 text-neutral-500" />
                <span>{selectedDevice.name}</span>
              </>
            ) : (
              <>
                <Monitor className="h-3.5 w-3.5 text-neutral-500" />
                <span>Responsive</span>
              </>
            )}
            <ChevronDown className="h-3 w-3 text-neutral-500" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-1.5">
          {/* Responsive option */}
          <button
            onClick={() => handleSelectDevice(null)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
              isResponsive
                ? "bg-blue-500/15 text-blue-400"
                : "hover:bg-neutral-700 text-neutral-300"
            }`}
          >
            <Monitor className="h-4 w-4" />
            <span className="font-medium">Responsive</span>
          </button>

          {/* Grouped devices */}
          {(["phone", "tablet", "desktop"] as const).map((category) => {
            const devices = DEVICE_PRESETS.filter((d) => d.category === category);
            const label = category === "phone" ? "Phones" : category === "tablet" ? "Tablets" : "Desktops";
            return (
              <div key={category}>
                <div className="px-2.5 pt-2.5 pb-1 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                  {label}
                </div>
                {devices.map((device) => {
                  const Icon = device.icon;
                  const isSelected = selectedDevice?.name === device.name;
                  return (
                    <button
                      key={device.name}
                      onClick={() => handleSelectDevice(device)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                        isSelected
                          ? "bg-blue-500/15 text-blue-400"
                          : "hover:bg-neutral-700 text-neutral-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left whitespace-nowrap">{device.name}</span>
                      <span className="text-[11px] text-neutral-500 font-mono tabular-nums">
                        {device.width}x{device.height}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </PopoverContent>
      </Popover>

      <div className="h-4 w-px bg-neutral-700" />

      {/* Dimensions display */}
      <div className="flex items-center gap-1.5 text-neutral-500">
        <input
          type="number"
          value={isResponsive ? customWidth : displayWidth}
          onChange={(e) => handleWidthChange(e.target.value)}
          className="w-12 px-1 py-0.5 text-center text-xs font-mono tabular-nums bg-neutral-800 border border-neutral-700 rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/50"
        />
        <span className="text-neutral-600 text-xs select-none">&times;</span>
        <input
          type="number"
          value={isResponsive ? customHeight : displayHeight}
          onChange={(e) => handleHeightChange(e.target.value)}
          className="w-12 px-1 py-0.5 text-center text-xs font-mono tabular-nums bg-neutral-800 border border-neutral-700 rounded text-neutral-300 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/50"
        />
      </div>

      {/* Rotate button */}
      <button
        onClick={handleRotate}
        className="p-1 rounded hover:bg-neutral-700 transition-colors text-neutral-500 hover:text-neutral-300"
        title="Rotate"
      >
        <RotateCw className="h-3.5 w-3.5" />
      </button>

      {/* Refresh button */}
      <button
        onClick={() => { setIframeKey((k) => k + 1); setLogs([]); }}
        className="p-1 rounded hover:bg-neutral-700 transition-colors text-neutral-500 hover:text-neutral-300"
        title="Refresh preview"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>

      <div className="flex-1" />

      {/* Logs button */}
      <button
        onClick={() => setShowLogs((v) => !v)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors text-xs font-medium ${
          showLogs
            ? "bg-neutral-700 text-neutral-200"
            : "hover:bg-neutral-700 text-neutral-500 hover:text-neutral-300"
        }`}
        title="Toggle error logs"
      >
        <Terminal className="h-3.5 w-3.5" />
        <span>Logs</span>
        {logs.length > 0 && (
          <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none ${
            errorCount > 0
              ? "bg-red-500/90 text-white"
              : "bg-neutral-600 text-neutral-200"
          }`}>
            {logs.length > 99 ? "99+" : logs.length}
          </span>
        )}
      </button>
    </div>
  );

  if (error) {
    if (error === "firstLoad") {
      return (
        <div className="h-full flex flex-col">
          {deviceToolbar}
          <div className="flex-1 flex items-center justify-center p-6 bg-neutral-900">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 mb-4">
                <svg
                  className="h-6 w-6 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-100 mb-2">
                Welcome to Artifex
              </h3>
              <p className="text-sm text-neutral-400 mb-3">
                Start building React components with AI assistance
              </p>
              <p className="text-xs text-neutral-500">
                Ask the AI to create your first component to see it live here
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        {deviceToolbar}
        <div className="flex-1 flex items-center justify-center p-6 bg-neutral-900">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-800 mb-4">
              <AlertCircle className="h-6 w-6 text-neutral-500" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-2">
              No Preview Available
            </h3>
            <p className="text-sm text-neutral-400">{error}</p>
            <p className="text-xs text-neutral-500 mt-2">
              Start by creating a React component using the AI assistant
            </p>
          </div>
        </div>
      </div>
    );
  }

  const logsPanel = showLogs && (
    <div className="border-t border-neutral-700 bg-neutral-950 flex flex-col shrink-0" style={{ height: logsPanelHeight }}>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="h-1.5 cursor-row-resize shrink-0 group flex items-center justify-center hover:bg-neutral-800 transition-colors"
      >
        <div className="w-8 h-0.5 rounded-full bg-neutral-700 group-hover:bg-neutral-500 transition-colors" />
      </div>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-800 shrink-0">
        <span className="text-xs font-medium text-neutral-400">
          Logs
          {logs.length > 0 && (
            <span className="ml-1.5 text-neutral-600">({logs.length})</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLogs([])}
            className="p-1 rounded hover:bg-neutral-800 transition-colors text-neutral-600 hover:text-neutral-400"
            title="Clear logs"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          <button
            onClick={() => setShowLogs(false)}
            className="p-1 rounded hover:bg-neutral-800 transition-colors text-neutral-600 hover:text-neutral-400"
            title="Close logs"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-600 text-xs">
            No logs yet
          </div>
        ) : (
          logs.map((entry, i) => (
            <div
              key={i}
              className={`flex gap-2 px-3 py-1.5 border-b border-neutral-900 ${
                entry.level === "error"
                  ? "bg-red-500/5 text-red-400"
                  : entry.level === "warn"
                  ? "bg-yellow-500/5 text-yellow-400"
                  : "text-neutral-400"
              }`}
            >
              <span className="shrink-0 text-neutral-600 tabular-nums select-none">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span
                className={`shrink-0 uppercase text-[10px] font-bold px-1 py-0.5 rounded leading-none ${
                  entry.level === "error"
                    ? "bg-red-500/20 text-red-400"
                    : entry.level === "warn"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {entry.level}
              </span>
              <span
                className={`shrink-0 text-[10px] px-1 py-0.5 rounded leading-none ${
                  entry.source === "build"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-neutral-700 text-neutral-500"
                }`}
              >
                {entry.source}
              </span>
              <span className="break-all whitespace-pre-wrap">{entry.message}</span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {deviceToolbar}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-neutral-800 flex items-start justify-center min-h-0"
      >
        <div
          className={isResponsive ? "w-full h-full" : "bg-white border border-neutral-700 my-4 mx-auto shrink-0"}
          style={isResponsive ? undefined : { width: displayWidth, height: displayHeight }}
        >
          <iframe
            key={iframeKey}
            ref={iframeRef}
            srcDoc={previewHTML}
            sandbox="allow-scripts allow-same-origin allow-forms"
            className={`w-full h-full border-0 ${isResponsive ? "bg-white" : ""}`}
            title="Preview"
          />
        </div>
      </div>
      {logsPanel}
    </div>
  );
}
