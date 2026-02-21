"use client";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FileSystemProvider } from "@/lib/contexts/file-system-context";
import { ChatProvider } from "@/lib/contexts/chat-context";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { FileTree } from "@/components/editor/FileTree";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderActions } from "@/components/HeaderActions";

interface MainContentProps {
  user?: {
    id: string;
    email: string;
  } | null;
  project?: {
    id: string;
    name: string;
    messages: any[];
    data: any;
    published?: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  readOnly?: boolean;
}

export function MainContent({ user, project, readOnly = false }: MainContentProps) {
  const [activeView, setActiveView] = useState<"preview" | "code">("preview");

  return (
    <FileSystemProvider initialData={project?.data}>
      <ChatProvider projectId={project?.id} initialMessages={project?.messages}>
        <div className={`${readOnly ? "h-full w-full" : "h-screen w-screen"} overflow-hidden bg-neutral-900`}>
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {!readOnly && (
              <>
                <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                  <div className="h-full flex flex-col bg-neutral-900">
                    <div className="h-10 flex items-center px-4 border-b border-neutral-700/60">
                      <h1 className="text-lg font-semibold text-neutral-100 tracking-tight">UIGen</h1>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ChatInterface readOnly={readOnly} onSwitchToCode={() => setActiveView("code")} />
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle className="w-[1px] bg-neutral-700 hover:bg-neutral-600 transition-colors" />
              </>
            )}

            <ResizablePanel defaultSize={readOnly ? 100 : 65}>
              <div className="h-full flex flex-col bg-neutral-900">
                {/* Top Bar */}
                <div className="h-10 border-b border-neutral-700/60 px-4 flex items-center justify-between bg-neutral-900">
                  <Tabs
                    value={activeView}
                    onValueChange={(v) =>
                      setActiveView(v as "preview" | "code")
                    }
                  >
                    <TabsList className="bg-neutral-800 border border-neutral-700/60 p-0.5 h-9">
                      <TabsTrigger value="preview" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-100 text-neutral-400 px-4 py-1.5 text-sm font-medium transition-all">Preview</TabsTrigger>
                      <TabsTrigger value="code" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-100 text-neutral-400 px-4 py-1.5 text-sm font-medium transition-all">Code</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {!readOnly && <HeaderActions user={user} projectId={project?.id} published={project?.published} />}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-neutral-900">
                  {activeView === "preview" ? (
                    <div className="h-full bg-neutral-900">
                      <PreviewFrame />
                    </div>
                  ) : (
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full"
                    >
                      {/* File Tree */}
                      <ResizablePanel
                        defaultSize={30}
                        minSize={20}
                        maxSize={50}
                      >
                        <div className="h-full bg-neutral-800 border-r border-neutral-700">
                          <FileTree />
                        </div>
                      </ResizablePanel>

                      <ResizableHandle className="w-[1px] bg-neutral-700 hover:bg-neutral-600 transition-colors" />

                      {/* Code Editor */}
                      <ResizablePanel defaultSize={70}>
                        <div className="h-full bg-neutral-900">
                          <CodeEditor readOnly={readOnly} />
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </ChatProvider>
    </FileSystemProvider>
  );
}
