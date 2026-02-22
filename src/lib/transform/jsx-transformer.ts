import * as Babel from "@babel/standalone";

export interface TransformResult {
  code: string;
  error?: string;
  missingImports?: Set<string>;
  cssImports?: Set<string>;
}

// Helper to create a placeholder module
function createPlaceholderModule(componentName: string): string {
  return `
import React from 'react';
const ${componentName} = function() {
  return React.createElement('div', {}, null);
}
export default ${componentName};
export { ${componentName} };
`;
}


function resolveImportPath(fromFile: string, importPath: string): string {
  if (!importPath.startsWith("./") && !importPath.startsWith("../")) {
    return importPath;
  }
  const fromDir = fromFile.substring(0, fromFile.lastIndexOf("/")) || "/";
  const parts = fromDir.split("/").filter(Boolean);
  const relParts = importPath.split("/");

  for (const part of relParts) {
    if (part === "..") {
      parts.pop();
    } else if (part !== ".") {
      parts.push(part);
    }
  }

  // Return bare specifier (no leading /) so import maps can match
  // in about:srcdoc context where URL-like specifiers fail
  return parts.join("/");
}

function toBareSpecifier(specifier: string): string {
  if (specifier.startsWith("/")) return specifier.substring(1);
  return specifier;
}

function createResolveRelativeImportsPlugin(filename: string) {
  return function resolveRelativeImportsPlugin() {
    function rewrite(src: string): string {
      if (src.startsWith("./") || src.startsWith("../")) {
        return resolveImportPath(filename, src);
      }
      if (src.startsWith("/")) {
        return toBareSpecifier(src);
      }
      return src;
    }

    return {
      visitor: {
        ImportDeclaration(path: { node: { source: { value: string } } }) {
          const result = rewrite(path.node.source.value);
          if (result !== path.node.source.value) {
            path.node.source.value = result;
          }
        },
        ExportNamedDeclaration(path: { node: { source?: { value: string } | null } }) {
          if (path.node.source) {
            const result = rewrite(path.node.source.value);
            if (result !== path.node.source.value) {
              path.node.source.value = result;
            }
          }
        },
        ExportAllDeclaration(path: { node: { source: { value: string } } }) {
          const result = rewrite(path.node.source.value);
          if (result !== path.node.source.value) {
            path.node.source.value = result;
          }
        },
        CallExpression(path: { node: { callee: { type: string }; arguments: Array<{ type: string; value: string }> } }) {
          if (
            path.node.callee.type === "Import" &&
            path.node.arguments.length > 0 &&
            path.node.arguments[0].type === "StringLiteral"
          ) {
            const result = rewrite(path.node.arguments[0].value);
            if (result !== path.node.arguments[0].value) {
              path.node.arguments[0].value = result;
            }
          }
        },
      },
    };
  };
}

export function transformJSX(
  code: string,
  filename: string,
  existingFiles: Set<string>
): TransformResult {
  try {
    const isTypeScript = filename.endsWith(".ts") || filename.endsWith(".tsx");

    let processedCode = code;
    const importRegex =
      /import\s+(?:{[^}]+}|[^,\s]+)?\s*(?:,\s*{[^}]+})?\s+from\s+['"]([^'"]+)['"]/g;
    const imports = new Set<string>();
    const cssImports = new Set<string>();

    const cssImportRegex = /import\s+['"]([^'"]+\.css)['"]/g;
    let cssMatch;
    while ((cssMatch = cssImportRegex.exec(code)) !== null) {
      cssImports.add(cssMatch[1]);
    }

    processedCode = processedCode.replace(cssImportRegex, '');

    let match;
    while ((match = importRegex.exec(code)) !== null) {
      if (!match[1].endsWith('.css')) {
        let resolved = resolveImportPath(filename, match[1]);
        if (resolved.startsWith("/")) resolved = resolved.substring(1);
        imports.add(resolved);
      }
    }

    const result = Babel.transform(processedCode, {
      filename,
      presets: [
        ["react", { runtime: "automatic" }],
        ...(isTypeScript ? ["typescript"] : []),
      ],
      plugins: [createResolveRelativeImportsPlugin(filename)],
    });

    return {
      code: result.code || "",
      missingImports: imports,
      cssImports: cssImports,
    };
  } catch (error) {
    return {
      code: "",
      error: error instanceof Error ? error.message : "Unknown transform error",
    };
  }
}

export function createBlobURL(
  code: string,
  mimeType: string = "application/javascript"
): string {
  const blob = new Blob([code], { type: mimeType });
  return URL.createObjectURL(blob);
}

export interface ImportMapResult {
  importMap: string;
  styles: string;
  errors: Array<{ path: string; error: string }>;
}

export function createImportMap(files: Map<string, string>): ImportMapResult {
  const imports: Record<string, string> = {
    react: "https://esm.sh/react@19",
    "react-dom": "https://esm.sh/react-dom@19",
    "react-dom/client": "https://esm.sh/react-dom@19/client",
    "react/jsx-runtime": "https://esm.sh/react@19/jsx-runtime",
    "react/jsx-dev-runtime": "https://esm.sh/react@19/jsx-dev-runtime",
  };

  // Transform each file and create blob URLs
  const transformedFiles = new Map<string, string>();
  const existingFiles = new Set(files.keys());
  const allImports = new Set<string>();
  const allCssImports = new Set<{ from: string; cssPath: string }>();
  let collectedStyles = "";
  const errors: Array<{ path: string; error: string }> = [];

  // First pass: transform all files and collect imports
  for (const [path, content] of files) {
    if (
      path.endsWith(".js") ||
      path.endsWith(".jsx") ||
      path.endsWith(".ts") ||
      path.endsWith(".tsx")
    ) {
      const { code, error, missingImports, cssImports } = transformJSX(
        content,
        path,
        existingFiles
      );
      
      if (error) {
        // Track error for this file
        errors.push({ path, error });
        // Skip processing this file entirely
        continue;
      }
      
      // Normal successful transform
      const blobUrl = createBlobURL(code);
      transformedFiles.set(path, blobUrl);

      // Collect all imports (already resolved to bare specifiers)
      if (missingImports) {
        missingImports.forEach((imp) => {
          if (imports[imp]) return;

          const isLocalFile = imp.startsWith("@/") ||
            imp.startsWith("/") ||
            imp.includes("/") && existingFiles.has("/" + imp) ||
            imp.includes("/") && existingFiles.has("/" + imp + ".tsx") ||
            imp.includes("/") && existingFiles.has("/" + imp + ".ts") ||
            imp.includes("/") && existingFiles.has("/" + imp + ".jsx") ||
            imp.includes("/") && existingFiles.has("/" + imp + ".js");
          
          if (!isLocalFile) {
            imports[imp] = `https://esm.sh/${imp}`;
          } else {
            allImports.add(imp);
          }
        });
      }

      // Collect CSS imports
      if (cssImports) {
        cssImports.forEach((cssImport) => {
          allCssImports.add({ from: path, cssPath: cssImport });
        });
      }

      // Add to import map with absolute path
      imports[path] = blobUrl;

      // Also add without leading slash
      if (path.startsWith("/")) {
        imports[path.substring(1)] = blobUrl;
      }

      // Add @/ alias support - maps @/ to root directory
      if (path.startsWith("/")) {
        imports["@" + path] = blobUrl;
        imports["@/" + path.substring(1)] = blobUrl;
      }

      // Add entries without file extensions for all variations
      const pathWithoutExt = path.replace(/\.(jsx?|tsx?)$/, "");
      imports[pathWithoutExt] = blobUrl;

      if (path.startsWith("/")) {
        imports[pathWithoutExt.substring(1)] = blobUrl;
        imports["@" + pathWithoutExt] = blobUrl;
        imports["@/" + pathWithoutExt.substring(1)] = blobUrl;
      }
    } else if (path.endsWith(".css")) {
      // Collect CSS file content
      collectedStyles += `/* ${path} */\n${content}\n\n`;
    }
  }

  // Process CSS imports
  for (const { from, cssPath } of allCssImports) {
    // Resolve CSS path relative to the importing file
    let resolvedPath = cssPath;
    
    if (cssPath.startsWith("@/")) {
      // @/ alias points to root
      resolvedPath = cssPath.replace("@/", "/");
    } else if (cssPath.startsWith("./") || cssPath.startsWith("../")) {
      // Relative path
      const fromDir = from.substring(0, from.lastIndexOf("/"));
      resolvedPath = resolveRelativePath(fromDir, cssPath);
    }

    // Check if CSS file exists
    if (files.has(resolvedPath)) {
      // Already processed in the loop above
    } else {
      // CSS file not found
      collectedStyles += `/* ${cssPath} not found */\n`;
    }
  }

  // Second pass: create placeholder modules for missing imports
  for (const importPath of allImports) {
    if (imports[importPath] || importPath.startsWith("react")) {
      continue;
    }

    // Check if the import exists in any form (local files)
    // Import paths are now bare specifiers, so also check with leading /
    let found = false;
    const variations = [
      importPath,
      "/" + importPath,
      importPath + ".jsx",
      importPath + ".tsx",
      importPath + ".js",
      importPath + ".ts",
      "/" + importPath + ".jsx",
      "/" + importPath + ".tsx",
      "/" + importPath + ".js",
      "/" + importPath + ".ts",
      importPath.replace("@/", "/"),
      importPath.replace("@/", "/") + ".jsx",
      importPath.replace("@/", "/") + ".tsx",
    ];

    for (const variant of variations) {
      if (imports[variant] || files.has(variant)) {
        found = true;
        break;
      }
    }

    if (!found) {
      // Extract component name from path
      const match = importPath.match(/\/([^\/]+)$/);
      const componentName = match
        ? match[1]
        : importPath.replace(/[^a-zA-Z0-9]/g, "");

      // Create placeholder module
      const placeholderCode = createPlaceholderModule(componentName);
      const placeholderUrl = createBlobURL(placeholderCode);

      // Add all possible import variations
      imports[importPath] = placeholderUrl;
      if (importPath.startsWith("@/")) {
        imports[importPath.replace("@/", "/")] = placeholderUrl;
        imports[importPath.replace("@/", "")] = placeholderUrl;
      }
    }
  }

  return {
    importMap: JSON.stringify({ imports }, null, 2),
    styles: collectedStyles,
    errors
  };
}

// Helper function to resolve relative paths
function resolveRelativePath(fromDir: string, relativePath: string): string {
  const parts = fromDir.split("/").filter(Boolean);
  const relParts = relativePath.split("/");
  
  for (const part of relParts) {
    if (part === "..") {
      parts.pop();
    } else if (part !== ".") {
      parts.push(part);
    }
  }
  
  return "/" + parts.join("/");
}

export function createPreviewHTML(
  entryPoint: string,
  importMap: string,
  styles: string = "",
  errors: Array<{ path: string; error: string }> = [],
  title: string = "Preview"
): string {
  // Parse the import map to get the blob URL for the entry point
  let entryPointUrl = entryPoint;
  try {
    const importMapObj = JSON.parse(importMap);
    if (importMapObj.imports && importMapObj.imports[entryPoint]) {
      entryPointUrl = importMapObj.imports[entryPoint];
    }
  } catch (e) {
    console.error("Failed to parse import map:", e);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title.replace(/</g, "&lt;")}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #root {
      width: 100vw;
      height: 100vh;
    }
    .error-boundary {
      color: red;
      padding: 1rem;
      border: 2px solid red;
      margin: 1rem;
      border-radius: 4px;
      background: #fee;
    }
    .syntax-errors {
      background: #fef5f5;
      border: 2px solid #ff6b6b;
      border-radius: 12px;
      padding: 32px;
      margin: 24px;
      font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .syntax-errors h3 {
      color: #dc2626;
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .syntax-errors .error-item {
      margin: 16px 0;
      padding: 16px;
      background: #fff;
      border-radius: 8px;
      border-left: 4px solid #ff6b6b;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .syntax-errors .error-path {
      font-weight: 600;
      color: #991b1b;
      font-size: 15px;
      margin-bottom: 8px;
    }
    .syntax-errors .error-message {
      color: #7c2d12;
      margin-top: 8px;
      white-space: pre-wrap;
      line-height: 1.5;
      font-size: 13px;
    }
    .syntax-errors .error-location {
      display: inline-block;
      background: #fee0e0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 8px;
      color: #991b1b;
    }
  </style>
  ${styles ? `<style>\n${styles}</style>` : ''}
  <script type="importmap">
    ${importMap}
  </script>
</head>
<body>
  <script>
    (function() {
      var logs = [];
      function send(level, args) {
        var msg = Array.prototype.slice.call(args).map(function(a) {
          if (a instanceof Error) return a.message + '\\n' + (a.stack || '');
          if (typeof a === 'object') try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); }
          return String(a);
        }).join(' ');
        var entry = { level: level, message: msg, timestamp: Date.now(), source: 'client' };
        logs.push(entry);
        try { window.parent.postMessage({ type: '__PREVIEW_LOG__', log: entry }, '*'); } catch(e) {}
      }
      var origError = console.error;
      var origWarn = console.warn;
      console.error = function() { send('error', arguments); origError.apply(console, arguments); };
      console.warn = function() { send('warn', arguments); origWarn.apply(console, arguments); };
      window.onerror = function(msg, source, line, col, err) {
        send('error', [err || (msg + ' at ' + source + ':' + line + ':' + col)]);
      };
      window.addEventListener('unhandledrejection', function(e) {
        send('error', ['Unhandled Promise Rejection: ' + (e.reason instanceof Error ? e.reason.message + '\\n' + e.reason.stack : String(e.reason))]);
      });
    })();
  </script>
  ${errors.length > 0 ? `
    <div class="syntax-errors">
      <h3>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink: 0;">
          <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15h-2v-2h2v2zm0-4h-2V5h2v6z" fill="#dc2626"/>
        </svg>
        Syntax Error${errors.length > 1 ? 's' : ''} (${errors.length})
      </h3>
      ${errors.map(e => {
        const locationMatch = e.error.match(/\((\d+:\d+)\)/);
        const location = locationMatch ? locationMatch[1] : '';
        const cleanError = e.error.replace(/\(\d+:\d+\)/, '').trim();
        
        return `
        <div class="error-item">
          <div class="error-path">
            ${e.path}
            ${location ? `<span class="error-location">${location}</span>` : ''}
          </div>
          <div class="error-message">${cleanError.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      `;
      }).join('')}
    </div>
  ` : ''}
  <div id="root"></div>
  ${errors.length === 0 ? `<script type="module">
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }

      componentDidCatch(error, errorInfo) {
        console.error('React Error Boundary:', error, errorInfo?.componentStack || '');
      }

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
        
        if (!App) {
          throw new Error('No default export or App export found in ${entryPoint}');
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
          React.createElement(ErrorBoundary, null,
            React.createElement(App)
          )
        );
      } catch (error) {
        console.error('Failed to load app:', error);
        console.error('Import map:', ${JSON.stringify(importMap)});
        document.getElementById('root').innerHTML = '<div class="error-boundary"><h2>Failed to load app</h2><pre>' + error.toString() + '</pre></div>';
      }
    }

    loadApp();
  </script>` : ''}
</body>
</html>`;
}
