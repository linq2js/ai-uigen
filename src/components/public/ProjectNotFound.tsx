import { GlobeLock } from "lucide-react";

export function ProjectNotFound() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center max-w-md px-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
          <GlobeLock className="h-8 w-8 text-neutral-400" />
        </div>
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">
          App Not Found
        </h1>
        <p className="text-sm text-neutral-500">
          This app either doesn&apos;t exist or hasn&apos;t been published yet.
        </p>
      </div>
    </div>
  );
}
