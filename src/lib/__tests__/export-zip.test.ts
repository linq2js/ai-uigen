import { describe, it, expect, vi, beforeEach } from "vitest";
import JSZip from "jszip";
import { VirtualFileSystem } from "@/lib/file-system";
import { buildZipBlob, buildCompiledHtml } from "@/lib/export-zip";

describe("buildZipBlob", () => {
  let fs: VirtualFileSystem;

  beforeEach(() => {
    fs = new VirtualFileSystem();
  });

  it("should create a zip containing all files from the virtual file system", async () => {
    fs.createFile("/App.jsx", 'export default function App() { return <div>Hello</div>; }');
    fs.createFile("/styles.css", "body { margin: 0; }");

    const blob = await buildZipBlob(fs);
    const zip = await JSZip.loadAsync(blob);

    expect(Object.keys(zip.files)).toContain("App.jsx");
    expect(Object.keys(zip.files)).toContain("styles.css");

    const appContent = await zip.file("App.jsx")!.async("string");
    expect(appContent).toBe('export default function App() { return <div>Hello</div>; }');

    const cssContent = await zip.file("styles.css")!.async("string");
    expect(cssContent).toBe("body { margin: 0; }");
  });

  it("should preserve directory structure in the zip", async () => {
    fs.createFile("/src/components/Button.tsx", "export const Button = () => {};");
    fs.createFile("/src/utils/helpers.ts", "export const noop = () => {};");

    const blob = await buildZipBlob(fs);
    const zip = await JSZip.loadAsync(blob);

    const btnContent = await zip.file("src/components/Button.tsx")!.async("string");
    expect(btnContent).toBe("export const Button = () => {};");

    const helpersContent = await zip.file("src/utils/helpers.ts")!.async("string");
    expect(helpersContent).toBe("export const noop = () => {};");
  });

  it("should return an empty zip when the file system has no files", async () => {
    const blob = await buildZipBlob(fs);
    const zip = await JSZip.loadAsync(blob);

    const fileNames = Object.keys(zip.files).filter(
      (name) => !zip.files[name].dir
    );
    expect(fileNames).toHaveLength(0);
  });

  it("should handle files with empty content", async () => {
    fs.createFile("/empty.txt", "");

    const blob = await buildZipBlob(fs);
    const zip = await JSZip.loadAsync(blob);

    expect(Object.keys(zip.files)).toContain("empty.txt");
    const content = await zip.file("empty.txt")!.async("string");
    expect(content).toBe("");
  });

  it("should strip leading slashes from file paths", async () => {
    fs.createFile("/App.jsx", "content");

    const blob = await buildZipBlob(fs);
    const zip = await JSZip.loadAsync(blob);

    expect(zip.file("App.jsx")).not.toBeNull();
    expect(zip.file("/App.jsx")).toBeNull();
  });
});

describe("buildCompiledHtml", () => {
  let fs: VirtualFileSystem;

  beforeEach(() => {
    fs = new VirtualFileSystem();
  });

  it("should produce valid HTML with doctype and structure", () => {
    fs.createFile(
      "/App.jsx",
      'export default function App() { return <div>Hello</div>; }'
    );

    const html = buildCompiledHtml(fs);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain('id="root"');
    expect(html).toContain("</html>");
  });

  it("should include an import map with data URLs for local files", () => {
    fs.createFile(
      "/App.jsx",
      'export default function App() { return <div>Hello</div>; }'
    );

    const html = buildCompiledHtml(fs);

    expect(html).toContain('<script type="importmap">');
    expect(html).toContain("data:text/javascript;charset=utf-8,");
  });

  it("should reference React from esm.sh CDN", () => {
    fs.createFile(
      "/App.jsx",
      'export default function App() { return <div>Hello</div>; }'
    );

    const html = buildCompiledHtml(fs);

    expect(html).toContain("https://esm.sh/react@19");
    expect(html).toContain("https://esm.sh/react-dom@19");
  });

  it("should inline CSS files as style tags", () => {
    fs.createFile(
      "/App.jsx",
      'export default function App() { return <div>Hello</div>; }'
    );
    fs.createFile("/styles.css", "body { margin: 0; }");

    const html = buildCompiledHtml(fs);

    expect(html).toContain("body { margin: 0; }");
  });

  it("should include Tailwind CSS from CDN", () => {
    fs.createFile(
      "/App.jsx",
      'export default function App() { return <div>Hello</div>; }'
    );

    const html = buildCompiledHtml(fs);

    expect(html).toContain("cdn.tailwindcss.com");
  });

  it("should detect App.jsx as entry point", () => {
    fs.createFile(
      "/App.jsx",
      'export default function App() { return <div>Hello</div>; }'
    );

    const html = buildCompiledHtml(fs);

    expect(html).toContain("loadApp");
  });

  it("should handle nested component files", () => {
    fs.createFile(
      "/App.jsx",
      `import Button from './components/Button';
export default function App() { return <Button />; }`
    );
    fs.createFile(
      "/components/Button.jsx",
      'export default function Button() { return <button>Click</button>; }'
    );

    const html = buildCompiledHtml(fs);

    expect(html).toContain("data:text/javascript;charset=utf-8,");
    expect(html).toContain("/components/Button");
  });

  it("should return empty-state HTML when no files exist", () => {
    const html = buildCompiledHtml(fs);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("No components");
  });
});
