"use client";

import { useEffect, useRef, useState } from "react";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import {
  createImportMap,
  createPreviewHTML,
} from "@/lib/transform/jsx-transformer";
import { AlertCircle, Monitor, Smartphone, Tablet, ChevronDown, RotateCw } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

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

  // Hydrate device state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("uigen-device");
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
          } else if (files.size > 0) {
            const firstJSX = Array.from(files.keys()).find(
              (path) => path.endsWith(".jsx") || path.endsWith(".tsx")
            );
            if (firstJSX) {
              foundEntryPoint = firstJSX;
              setEntryPoint(firstJSX);
            }
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
      localStorage.setItem("uigen-device", JSON.stringify({ deviceName, customWidth: w, customHeight: h, isRotated: rotated }));
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
                Welcome to UI Generator
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

  return (
    <div className="h-full flex flex-col">
      {deviceToolbar}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-neutral-800 flex items-start justify-center"
      >
        {isResponsive ? (
          <iframe
            ref={iframeRef}
            srcDoc={previewHTML}
            sandbox="allow-scripts allow-same-origin allow-forms"
            className="w-full h-full border-0 bg-white"
            title="Preview"
          />
        ) : (
          <div
            className="bg-white border border-neutral-700 my-4 mx-auto shrink-0"
            style={{
              width: displayWidth,
              height: displayHeight,
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={previewHTML}
              sandbox="allow-scripts allow-same-origin allow-forms"
              className="w-full h-full border-0"
              title="Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
