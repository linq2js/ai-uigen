import JSZip from "jszip";
import type { VirtualFileSystem } from "@/lib/file-system";
import { transformJSX } from "@/lib/transform/jsx-transformer";

export async function buildZipBlob(fs: VirtualFileSystem): Promise<Blob> {
  const zip = new JSZip();
  const files = fs.getAllFiles();

  for (const [path, content] of files) {
    const relativePath = path.startsWith("/") ? path.slice(1) : path;
    zip.file(relativePath, content);
  }

  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  downloadBlob(blob, filename);
}

export async function exportAsZip(
  fs: VirtualFileSystem,
  filename = "source-code.zip"
) {
  const blob = await buildZipBlob(fs);
  downloadBlob(blob, filename);
}

export function exportCompiledHtml(
  fs: VirtualFileSystem,
  filename = "app.html"
) {
  const html = buildCompiledHtml(fs);
  downloadText(html, filename, "text/html;charset=utf-8");
}

// ---------------------------------------------------------------------------
// Compiled HTML builder — produces a self-contained HTML file that uses
// data: URLs in the import map instead of blob: URLs so it works standalone.
// ---------------------------------------------------------------------------

const POSSIBLE_ENTRIES = [
  "/App.jsx",
  "/App.tsx",
  "/index.jsx",
  "/index.tsx",
  "/src/App.jsx",
  "/src/App.tsx",
];

function findEntryPoint(files: Map<string, string>): string | null {
  for (const entry of POSSIBLE_ENTRIES) {
    if (files.has(entry)) return entry;
  }
  const first = Array.from(files.keys()).find(
    (p) => p.endsWith(".jsx") || p.endsWith(".tsx")
  );
  return first ?? null;
}

function toDataUrl(code: string): string {
  return `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`;
}

function resolveRelativePath(fromDir: string, relativePath: string): string {
  const parts = fromDir.split("/").filter(Boolean);
  for (const part of relativePath.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return "/" + parts.join("/");
}

export function buildCompiledHtml(fs: VirtualFileSystem): string {
  const files = fs.getAllFiles();
  const entryPoint = findEntryPoint(files);

  if (!entryPoint) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><p>No components to render.</p></body></html>`;
  }

  const imports: Record<string, string> = {
    react: "https://esm.sh/react@19",
    "react-dom": "https://esm.sh/react-dom@19",
    "react-dom/client": "https://esm.sh/react-dom@19/client",
    "react/jsx-runtime": "https://esm.sh/react@19/jsx-runtime",
    "react/jsx-dev-runtime": "https://esm.sh/react@19/jsx-dev-runtime",
  };

  const existingFiles = new Set(files.keys());
  let collectedStyles = "";
  const errors: Array<{ path: string; error: string }> = [];

  for (const [path, content] of files) {
    const isScript =
      path.endsWith(".js") ||
      path.endsWith(".jsx") ||
      path.endsWith(".ts") ||
      path.endsWith(".tsx");

    if (isScript) {
      const { code, error, missingImports, cssImports } = transformJSX(
        content,
        path,
        existingFiles
      );

      if (error) {
        errors.push({ path, error });
        continue;
      }

      const dataUrl = toDataUrl(code);

      // Register all path variations so any import style resolves
      imports[path] = dataUrl;
      if (path.startsWith("/")) {
        imports[path.substring(1)] = dataUrl;
        imports["@" + path] = dataUrl;
        imports["@/" + path.substring(1)] = dataUrl;
      }
      const noExt = path.replace(/\.(jsx?|tsx?)$/, "");
      imports[noExt] = dataUrl;
      if (path.startsWith("/")) {
        imports[noExt.substring(1)] = dataUrl;
        imports["@" + noExt] = dataUrl;
        imports["@/" + noExt.substring(1)] = dataUrl;
      }

      // Third-party packages
      if (missingImports) {
        for (const imp of missingImports) {
          const isPackage =
            !imp.startsWith(".") &&
            !imp.startsWith("/") &&
            !imp.startsWith("@/");
          if (isPackage && !imports[imp]) {
            imports[imp] = `https://esm.sh/${imp}`;
          }
        }
      }

      // Track CSS imports so we can note them even though they're already
      // picked up as files below
      if (cssImports) {
        for (const cssPath of cssImports) {
          let resolved = cssPath;
          if (cssPath.startsWith("@/")) {
            resolved = cssPath.replace("@/", "/");
          } else if (cssPath.startsWith("./") || cssPath.startsWith("../")) {
            const dir = path.substring(0, path.lastIndexOf("/"));
            resolved = resolveRelativePath(dir, cssPath);
          }
          if (!files.has(resolved)) {
            collectedStyles += `/* ${cssPath} not found */\n`;
          }
        }
      }
    } else if (path.endsWith(".css")) {
      collectedStyles += `/* ${path} */\n${content}\n\n`;
    }
  }

  const importMap = JSON.stringify({ imports }, null, 2);

  let entryPointUrl = entryPoint;
  if (imports[entryPoint]) {
    entryPointUrl = imports[entryPoint];
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #root { width: 100vw; height: 100vh; }
    .error-boundary { color: red; padding: 1rem; border: 2px solid red; margin: 1rem; border-radius: 4px; background: #fee; }
  </style>
  ${collectedStyles ? `<style>\n${collectedStyles}</style>` : ""}
  <script type="importmap">
    ${importMap}
  <\/script>
</head>
<body>
  <div id="root"></div>
  ${
    errors.length > 0
      ? `<script>document.getElementById('root').innerHTML='<pre style="color:red;padding:1rem">${errors.map((e) => `${e.path}: ${e.error.replace(/'/g, "\\'")}`).join("\\n")}</pre>';<\/script>`
      : `<script type="module">
    import React from 'react';
    import ReactDOM from 'react-dom/client';

    class ErrorBoundary extends React.Component {
      constructor(props) { super(props); this.state = { hasError: false, error: null }; }
      static getDerivedStateFromError(error) { return { hasError: true, error }; }
      render() {
        if (this.state.hasError) {
          return React.createElement('div', { className: 'error-boundary' },
            React.createElement('h2', null, 'Something went wrong'),
            React.createElement('pre', null, this.state.error?.toString())
          );
        }
        return this.props.children;
      }
    }

    async function loadApp() {
      try {
        const module = await import('${entryPointUrl}');
        const App = module.default || module.App;
        if (!App) throw new Error('No default export found in ${entryPoint}');
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(ErrorBoundary, null, React.createElement(App)));
      } catch (error) {
        document.getElementById('root').innerHTML =
          '<div class="error-boundary"><h2>Failed to load app</h2><pre>' + error + '</pre></div>';
      }
    }

    loadApp();
  <\/script>`
  }
</body>
</html>`;
}
