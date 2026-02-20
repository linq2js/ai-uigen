import { describe, it, expect } from "vitest";
import {
  findImportForSymbol,
  resolveImportPath,
  findSymbolLine,
} from "@/lib/import-resolver";

describe("findImportForSymbol", () => {
  it("should find module path for a named import", () => {
    const code = `import { initDB, addTodo } from '@/utils/db';`;
    expect(findImportForSymbol(code, "initDB")).toBe("@/utils/db");
    expect(findImportForSymbol(code, "addTodo")).toBe("@/utils/db");
  });

  it("should find module path for a default import", () => {
    const code = `import Header from '@/components/organisms/Header';`;
    expect(findImportForSymbol(code, "Header")).toBe(
      "@/components/organisms/Header"
    );
  });

  it("should find module path for a namespace import", () => {
    const code = `import * as utils from './utils';`;
    expect(findImportForSymbol(code, "utils")).toBe("./utils");
  });

  it("should find module path for mixed default and named imports", () => {
    const code = `import React, { useState, useEffect } from 'react';`;
    expect(findImportForSymbol(code, "React")).toBe("react");
    expect(findImportForSymbol(code, "useState")).toBe("react");
    expect(findImportForSymbol(code, "useEffect")).toBe("react");
  });

  it("should handle multi-line imports", () => {
    const code = `import {
  initDB,
  addTodo,
  getTodos,
} from '@/utils/db';`;
    expect(findImportForSymbol(code, "initDB")).toBe("@/utils/db");
    expect(findImportForSymbol(code, "getTodos")).toBe("@/utils/db");
  });

  it("should handle aliased imports", () => {
    const code = `import { foo as bar } from './module';`;
    expect(findImportForSymbol(code, "bar")).toBe("./module");
  });

  it("should return null for symbols not found in any import", () => {
    const code = `import { foo } from './module';`;
    expect(findImportForSymbol(code, "notImported")).toBeNull();
  });

  it("should handle double-quoted module paths", () => {
    const code = `import { foo } from "@/utils/helpers";`;
    expect(findImportForSymbol(code, "foo")).toBe("@/utils/helpers");
  });

  it("should not match symbols inside comments or strings", () => {
    const code = `// import { foo } from './fake';
import { bar } from './real';`;
    expect(findImportForSymbol(code, "foo")).toBeNull();
    expect(findImportForSymbol(code, "bar")).toBe("./real");
  });
});

describe("resolveImportPath", () => {
  const makeExists = (paths: string[]) => (p: string) => paths.includes(p);

  it("should resolve @/ alias to root path with extension", () => {
    const exists = makeExists(["/utils/db.ts"]);
    expect(resolveImportPath("/App.jsx", "@/utils/db", exists)).toBe(
      "/utils/db.ts"
    );
  });

  it("should resolve @/ alias with .tsx extension", () => {
    const exists = makeExists(["/components/Button.tsx"]);
    expect(
      resolveImportPath("/App.jsx", "@/components/Button", exists)
    ).toBe("/components/Button.tsx");
  });

  it("should resolve relative paths", () => {
    const exists = makeExists(["/components/Button.tsx"]);
    expect(
      resolveImportPath("/components/Form.tsx", "./Button", exists)
    ).toBe("/components/Button.tsx");
  });

  it("should resolve ../ relative paths", () => {
    const exists = makeExists(["/utils/helpers.ts"]);
    expect(
      resolveImportPath("/components/Button.tsx", "../utils/helpers", exists)
    ).toBe("/utils/helpers.ts");
  });

  it("should resolve index files", () => {
    const exists = makeExists(["/components/ui/index.ts"]);
    expect(
      resolveImportPath("/App.jsx", "@/components/ui", exists)
    ).toBe("/components/ui/index.ts");
  });

  it("should try extensions in order: .tsx, .ts, .jsx, .js", () => {
    const exists = makeExists(["/utils/db.jsx"]);
    expect(resolveImportPath("/App.jsx", "@/utils/db", exists)).toBe(
      "/utils/db.jsx"
    );
  });

  it("should return the path as-is if it already has an extension and exists", () => {
    const exists = makeExists(["/styles/main.css"]);
    expect(
      resolveImportPath("/App.jsx", "@/styles/main.css", exists)
    ).toBe("/styles/main.css");
  });

  it("should return null for unresolvable paths", () => {
    const exists = makeExists([]);
    expect(resolveImportPath("/App.jsx", "@/missing", exists)).toBeNull();
  });

  it("should return null for bare module specifiers (npm packages)", () => {
    const exists = makeExists([]);
    expect(resolveImportPath("/App.jsx", "react", exists)).toBeNull();
    expect(resolveImportPath("/App.jsx", "lucide-react", exists)).toBeNull();
  });
});

describe("findSymbolLine", () => {
  it("should find exported function declaration", () => {
    const content = `import React from 'react';

export function initDB() {
  return db.open();
}`;
    expect(findSymbolLine(content, "initDB")).toBe(3);
  });

  it("should find exported const declaration", () => {
    const content = `const x = 1;

export const addTodo = (text) => {
  return db.add(text);
};`;
    expect(findSymbolLine(content, "addTodo")).toBe(3);
  });

  it("should find exported class declaration", () => {
    const content = `export class TodoService {
  add() {}
}`;
    expect(findSymbolLine(content, "TodoService")).toBe(1);
  });

  it("should find default exported function", () => {
    const content = `export default function Header() {
  return <header />;
}`;
    expect(findSymbolLine(content, "Header")).toBe(1);
  });

  it("should find default exported class", () => {
    const content = `export default class App {
  render() {}
}`;
    expect(findSymbolLine(content, "App")).toBe(1);
  });

  it("should find non-exported function used as default export", () => {
    const content = `function helper() {
  return 42;
}

export default helper;`;
    expect(findSymbolLine(content, "helper")).toBe(1);
  });

  it("should find exported let/var declaration", () => {
    const content = `export let count = 0;`;
    expect(findSymbolLine(content, "count")).toBe(1);
  });

  it("should find symbol in named export list", () => {
    const content = `function internal() {}
const value = 42;

export { internal, value };`;
    expect(findSymbolLine(content, "internal")).toBe(1);
  });

  it("should return null for symbols not found", () => {
    const content = `export function foo() {}`;
    expect(findSymbolLine(content, "missing")).toBeNull();
  });

  it("should find interface/type exports", () => {
    const content = `export interface FileNode {
  type: string;
}`;
    expect(findSymbolLine(content, "FileNode")).toBe(1);
  });

  it("should find type alias exports", () => {
    const content = `export type Status = 'active' | 'done';`;
    expect(findSymbolLine(content, "Status")).toBe(1);
  });
});
