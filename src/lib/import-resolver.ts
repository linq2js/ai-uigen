/**
 * Finds which module path a given symbol is imported from.
 * Returns the module specifier string or null.
 */
export function findImportForSymbol(
  fileContent: string,
  symbolName: string
): string | null {
  const lines = fileContent.split("\n");

  // Join multi-line imports into single logical statements.
  // We walk through lines, accumulating when we see an `import` that
  // hasn't been closed (no `from` + quote yet).
  const importStatements: string[] = [];
  let buffer = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip single-line comments
    if (trimmed.startsWith("//")) continue;

    if (buffer) {
      buffer += " " + trimmed;
      if (trimmed.includes("from ")) {
        importStatements.push(buffer);
        buffer = "";
      }
    } else if (trimmed.startsWith("import ") && trimmed.includes("from ")) {
      importStatements.push(trimmed);
    } else if (trimmed.startsWith("import ") && !trimmed.includes("from ")) {
      buffer = trimmed;
    }
  }

  for (const stmt of importStatements) {
    const moduleMatch = stmt.match(/from\s+['"]([^'"]+)['"]/);
    if (!moduleMatch) continue;
    const modulePath = moduleMatch[1];

    // Extract the import clause (everything between `import` and `from`)
    const clauseMatch = stmt.match(/^import\s+([\s\S]+?)\s+from\s+/);
    if (!clauseMatch) continue;
    const clause = clauseMatch[1];

    // Check default import: `import Foo from ...`
    // The default import is the part before any `{` or `*`
    const defaultMatch = clause.match(/^([A-Za-z_$][\w$]*)/);
    if (defaultMatch && defaultMatch[1] === symbolName) {
      return modulePath;
    }

    // Check namespace import: `import * as name from ...`
    const nsMatch = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
    if (nsMatch && nsMatch[1] === symbolName) {
      return modulePath;
    }

    // Check named imports: `import { a, b as c } from ...`
    const namedMatch = clause.match(/\{([^}]+)\}/);
    if (namedMatch) {
      const names = namedMatch[1].split(",").map((s) => s.trim());
      for (const name of names) {
        // Handle `original as alias`
        const aliasMatch = name.match(
          /[A-Za-z_$][\w$]*\s+as\s+([A-Za-z_$][\w$]*)/
        );
        if (aliasMatch && aliasMatch[1] === symbolName) {
          return modulePath;
        }
        // Handle plain name
        if (name === symbolName) {
          return modulePath;
        }
      }
    }
  }

  return null;
}

const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];
const CODE_EXTENSIONS = new Set([
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".css",
  ".json",
  ".html",
  ".md",
]);

/**
 * Resolves an import path to an absolute VFS path.
 * `exists` is a function that checks if a path exists in the file system.
 * Returns the resolved path or null.
 */
export function resolveImportPath(
  currentFile: string,
  importPath: string,
  exists: (path: string) => boolean
): string | null {
  // Bare module specifiers (npm packages) — skip
  if (!importPath.startsWith(".") && !importPath.startsWith("@/")) {
    return null;
  }

  let basePath: string;

  if (importPath.startsWith("@/")) {
    basePath = "/" + importPath.slice(2);
  } else {
    // Relative path — resolve against current file's directory
    const currentDir = currentFile.substring(
      0,
      currentFile.lastIndexOf("/") || 1
    );
    basePath = normalizePath(currentDir + "/" + importPath);
  }

  // If the path already has a known extension, check it directly
  const lastDot = basePath.lastIndexOf(".");
  const lastSlash = basePath.lastIndexOf("/");
  if (lastDot > lastSlash) {
    const ext = basePath.substring(lastDot);
    if (CODE_EXTENSIONS.has(ext)) {
      return exists(basePath) ? basePath : null;
    }
  }

  // Try adding extensions
  for (const ext of EXTENSIONS) {
    const candidate = basePath + ext;
    if (exists(candidate)) return candidate;
  }

  // Try index files
  for (const ext of EXTENSIONS) {
    const candidate = basePath + "/index" + ext;
    if (exists(candidate)) return candidate;
  }

  return null;
}

/**
 * Finds the 1-based line number where a symbol is defined in file content.
 * Returns null if not found.
 */
export function findSymbolLine(
  fileContent: string,
  symbolName: string
): number | null {
  const lines = fileContent.split("\n");
  const escaped = symbolName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Patterns for direct export declarations (high priority)
  const directPatterns = [
    new RegExp(
      `^export\\s+(?:default\\s+)?(?:function|class)\\s+${escaped}\\b`
    ),
    new RegExp(
      `^export\\s+(?:const|let|var)\\s+${escaped}\\b`
    ),
    new RegExp(`^export\\s+(?:interface|type)\\s+${escaped}\\b`),
  ];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    for (const pattern of directPatterns) {
      if (pattern.test(trimmed)) return i + 1;
    }
  }

  // Check for `export { symbolName }` — then find the actual declaration
  const exportListRe = new RegExp(
    `export\\s*\\{[^}]*\\b${escaped}\\b[^}]*\\}`
  );
  if (exportListRe.test(fileContent)) {
    return findDeclarationLine(lines, symbolName);
  }

  // Check for `export default symbolName` — then find the declaration
  const exportDefaultRe = new RegExp(
    `^export\\s+default\\s+${escaped}\\s*;?\\s*$`
  );
  for (const line of lines) {
    if (exportDefaultRe.test(line.trimStart())) {
      return findDeclarationLine(lines, symbolName);
    }
  }

  // Fallback: look for any declaration of the symbol
  return findDeclarationLine(lines, symbolName);
}

function findDeclarationLine(
  lines: string[],
  symbolName: string
): number | null {
  const escaped = symbolName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const declPatterns = [
    new RegExp(`^(?:export\\s+)?(?:function|class)\\s+${escaped}\\b`),
    new RegExp(`^(?:export\\s+)?(?:const|let|var)\\s+${escaped}\\b`),
    new RegExp(`^(?:export\\s+)?(?:interface|type)\\s+${escaped}\\b`),
  ];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    for (const pattern of declPatterns) {
      if (pattern.test(trimmed)) return i + 1;
    }
  }

  return null;
}

function normalizePath(path: string): string {
  const parts = path.split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return "/" + resolved.join("/");
}
