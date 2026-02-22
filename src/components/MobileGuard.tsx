"use client";

import { Monitor } from "lucide-react";

const MOBILE_BREAKPOINT = 768;

export function MobileGuard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mobile-warning">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted">
            <Monitor className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Desktop Only
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Artifex is designed for desktop browsers. Please open this app on
              a device with a screen width of at least {MOBILE_BREAKPOINT}px for
              the best experience.
            </p>
          </div>
        </div>
      </div>
      <div className="app-content">{children}</div>
    </>
  );
}
