/**
 * SyncManager — debounced, online-aware background sync from IndexedDB → PostgreSQL.
 *
 * Each project gets at most one pending push at a time. Pushes are debounced
 * by 5 seconds and paused while the browser is offline.
 */

const DEBOUNCE_MS = 5_000;

type PushFn = (projectId: string) => Promise<void>;

export class SyncManager {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private inflight = new Set<string>();
  private online: boolean;
  private pushFn: PushFn;

  constructor(pushFn: PushFn) {
    this.pushFn = pushFn;
    this.online = typeof navigator !== "undefined" ? navigator.onLine : true;

    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  /** Enqueue a debounced push for the given project. */
  enqueue(projectId: string): void {
    // Clear any existing timer for this project
    const existing = this.timers.get(projectId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.timers.delete(projectId);
      this.flush(projectId);
    }, DEBOUNCE_MS);

    this.timers.set(projectId, timer);
  }

  /** Immediately push if online and not already in-flight. */
  private async flush(projectId: string): Promise<void> {
    if (!this.online || this.inflight.has(projectId)) {
      // Re-enqueue so it gets pushed when conditions change
      this.enqueue(projectId);
      return;
    }

    this.inflight.add(projectId);
    try {
      await this.pushFn(projectId);
    } catch (err) {
      console.error(`[SyncManager] push failed for ${projectId}:`, err);
      // Re-enqueue for retry
      this.enqueue(projectId);
    } finally {
      this.inflight.delete(projectId);
    }
  }

  private handleOnline = (): void => {
    this.online = true;
    // Flush all pending projects
    for (const projectId of this.timers.keys()) {
      clearTimeout(this.timers.get(projectId)!);
      this.timers.delete(projectId);
      this.flush(projectId);
    }
  };

  private handleOffline = (): void => {
    this.online = false;
  };

  /** Clean up event listeners. */
  destroy(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
  }
}
