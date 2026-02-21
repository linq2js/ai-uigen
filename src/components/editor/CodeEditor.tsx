"use client";

import { useEffect, useRef, useCallback } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import { Code2 } from "lucide-react";
import {
  findImportForSymbol,
  resolveImportPath,
  findSymbolLine,
} from "@/lib/import-resolver";

interface PendingNavigation {
  lineNumber: number;
  column: number;
}

export function CodeEditor({ readOnly = false }: { readOnly?: boolean }) {
  const {
    selectedFile,
    setSelectedFile,
    getFileContent,
    updateFile,
    fileSystem,
    refreshTrigger,
  } = useFileSystem();

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const pendingNav = useRef<PendingNavigation | null>(null);
  const disposablesRef = useRef<any[]>([]);

  const exists = useCallback(
    (path: string) => fileSystem.exists(path),
    [fileSystem]
  );

  const navigateToDefinition = useCallback(
    (fromFile: string, symbolName: string): boolean => {
      const content = getFileContent(fromFile);
      if (!content) return false;

      const modulePath = findImportForSymbol(content, symbolName);
      if (!modulePath) return false;

      const targetFile = resolveImportPath(fromFile, modulePath, exists);
      if (!targetFile) return false;

      const targetContent = getFileContent(targetFile);
      if (targetContent === null) return false;

      const line = findSymbolLine(targetContent, symbolName);

      if (targetFile === fromFile) {
        if (line && editorRef.current) {
          editorRef.current.setPosition({ lineNumber: line, column: 1 });
          editorRef.current.revealLineInCenter(line);
        }
        return true;
      }

      pendingNav.current = line
        ? { lineNumber: line, column: 1 }
        : { lineNumber: 1, column: 1 };
      setSelectedFile(targetFile);
      return true;
    },
    [getFileContent, exists, setSelectedFile]
  );

  // Apply pending cursor position after file switch
  useEffect(() => {
    if (pendingNav.current && editorRef.current) {
      const nav = pendingNav.current;
      pendingNav.current = null;
      // Small delay to let Monaco update the model content
      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.setPosition({
            lineNumber: nav.lineNumber,
            column: nav.column,
          });
          editorRef.current.revealLineInCenter(nav.lineNumber);
          editorRef.current.focus();
        }
      });
    }
  }, [selectedFile]);

  const syncModels = useCallback(
    (monaco: Monaco) => {
      const allFiles = fileSystem.getAllFiles();

      for (const [path, content] of allFiles) {
        const uri = monaco.Uri.parse(`file://${path}`);
        let model = monaco.editor.getModel(uri);
        if (!model) {
          const lang = getLanguageFromPath(path);
          monaco.editor.createModel(content, lang, uri);
        } else {
          if (model.getValue() !== content) {
            model.setValue(content);
          }
        }
      }
    },
    [fileSystem]
  );

  // Sync Monaco models with VFS whenever files change
  useEffect(() => {
    if (monacoRef.current) {
      syncModels(monacoRef.current);
    }
  }, [refreshTrigger, syncModels]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const compilerOptions: Parameters<typeof monaco.languages.typescript.typescriptDefaults.setCompilerOptions>[0] = {
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      jsxImportSource: "react",
      esModuleInterop: true,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowJs: true,
      strict: false,
      noImplicitAny: false,
      strictNullChecks: false,
      typeRoots: [],
    };
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);

    // Disable semantic validation — the sandbox has no type definitions (packages
    // resolve via esm.sh at runtime), so all type-level diagnostics are false
    // positives. Syntax validation stays on to catch real parse errors.
    const diagnosticsOptions = {
      noSemanticValidation: true,
      noSyntaxValidation: false,
    };
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(diagnosticsOptions);
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(diagnosticsOptions);

    syncModels(monaco);

    // Register definition provider for JS/TS languages
    const defProvider = monaco.languages.registerDefinitionProvider(
      ["javascript", "typescript"],
      {
        provideDefinition(model, position) {
          const word = model.getWordAtPosition(position);
          if (!word) return null;

          const currentPath = selectedFileRef.current;
          if (!currentPath) return null;

          const fileContent = model.getValue();
          const symbolName = word.word;

          const modulePath = findImportForSymbol(fileContent, symbolName);
          if (!modulePath) return null;

          const targetFile = resolveImportPath(currentPath, modulePath, (p) =>
            fileSystem.exists(p)
          );
          if (!targetFile) return null;

          const targetContent = fileSystem.readFile(targetFile);
          if (targetContent === null) return null;

          const line = findSymbolLine(targetContent, symbolName) ?? 1;

          const targetUri = monaco.Uri.parse(`file://${targetFile}`);
          let targetModel = monaco.editor.getModel(targetUri);
          if (!targetModel) {
            const lang = getLanguageFromPath(targetFile);
            targetModel = monaco.editor.createModel(
              targetContent,
              lang,
              targetUri
            );
          }

          return {
            uri: targetUri,
            range: new monaco.Range(line, 1, line, 1),
          };
        },
      }
    );

    // Intercept when Monaco tries to open a different model (cross-file go-to-def)
    const editorOpener = monaco.editor.registerEditorOpener({
      openCodeEditor(_source, resource, selectionOrPosition) {
        const targetPath = resource.path;
        if (!targetPath) return false;

        const targetContent = fileSystem.readFile(targetPath);
        if (targetContent === null) return false;

        let line = 1;
        if (selectionOrPosition) {
          if ("startLineNumber" in selectionOrPosition) {
            line = selectionOrPosition.startLineNumber;
          } else if ("lineNumber" in selectionOrPosition) {
            line = selectionOrPosition.lineNumber;
          }
        }

        pendingNav.current = { lineNumber: line, column: 1 };
        setSelectedFile(targetPath);
        return true;
      },
    });

    // Ctrl+Click / Cmd+Click handler as fallback
    const mouseHandler = editor.onMouseDown((e: any) => {
      if (!(e.event.ctrlKey || e.event.metaKey)) return;
      if (e.target.type !== monaco.editor.MouseTargetType.CONTENT_TEXT) return;

      const position = e.target.position;
      if (!position) return;

      const model = editor.getModel();
      if (!model) return;

      const word = model.getWordAtPosition(position);
      if (!word) return;

      const currentPath = selectedFileRef.current;
      if (!currentPath) return;

      navigateToDefinition(currentPath, word.word);
    });

    disposablesRef.current = [defProvider, editorOpener, mouseHandler];
  };

  // Keep a ref to selectedFile so callbacks always have the latest value
  const selectedFileRef = useRef(selectedFile);
  useEffect(() => {
    selectedFileRef.current = selectedFile;
  }, [selectedFile]);

  // Cleanup disposables on unmount
  useEffect(() => {
    return () => {
      for (const d of disposablesRef.current) {
        d?.dispose?.();
      }
    };
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    if (selectedFile && value !== undefined) {
      updateFile(selectedFile, value);
    }
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Code2 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Select a file to edit</p>
          <p className="text-xs text-gray-600 mt-1">
            Choose a file from the file tree
          </p>
        </div>
      </div>
    );
  }

  const content = getFileContent(selectedFile) || "";
  const language = getLanguageFromPath(selectedFile);

  return (
    <Editor
      height="100%"
      language={language}
      value={content}
      path={selectedFile}
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: "on",
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly,
        automaticLayout: true,
        wordWrap: "on",
        padding: { top: 16, bottom: 16 },
        gotoLocation: {
          multiple: "goto",
          multipleDefinitions: "goto",
        },
      }}
    />
  );
}

function getLanguageFromPath(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "json":
      return "json";
    case "css":
      return "css";
    case "html":
      return "html";
    case "md":
      return "markdown";
    default:
      return "plaintext";
  }
}
