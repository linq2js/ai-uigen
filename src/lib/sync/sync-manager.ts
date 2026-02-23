/**
 * SyncManager — bidirectional, debounced, online-aware sync between
 * IndexedDB and PostgreSQL.
 *
 * Push: debounced per-project, paused while offline.
 * Pull: runs on startup and at a configurable interval, compares all
 *       local projects' syncedAt against server updatedAt in one batch.
 */

const PUSH_DEBOUNCE_MS = 5_000;
const PULL_INTERVAL_MS = 30_000; // 30 s

type PushFn = (projectId: string) => Promise<void>;
type PullAllFn = () => Promise<void>;

export class SyncManager {
  private pushTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private pushInflight = new Set<string>();
  private pullInterval: ReturnType<typeof setInterval> | null = null;
  private online: boolean;
  private pushFn: PushFn;
  private pullAllFn: PullAllFn;

  constructor(pushFn: PushFn, pullAllFn: PullAllFn) {
    this.pushFn = pushFn;
    this.pullAllFn = pullAllFn;
    this.online = typeof navigator !== "undefined" ? navigator.onLine : true;

    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /**
   * Run the initial pull (awaitable) and start the interval timer.
   * The returned promise resolves once the first pull completes (or fails),
   * so callers can block the UI until the initial sync is done.
   */
  async start(): Promise<void> {
    // Await the startup pull so the caller can show a loading indicator
    if (this.online) {
      try {
        await this.pullAllFn();
      } catch (err) {
        console.error("[SyncManager] initial pull failed:", err);
      }
    }

    if (!this.pullInterval) {
      this.pullInterval = setInterval(() => this.pullNow(), PULL_INTERVAL_MS);
    }
  }

  /** Clean up all timers and listeners. */
  destroy(): void {
    for (const timer of this.pushTimers.values()) clearTimeout(timer);
    this.pushTimers.clear();

    if (this.pullInterval) {
      clearInterval(this.pullInterval);
      this.pullInterval = null;
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
  }

  // -----------------------------------------------------------------------
  // Push (per-project, debounced)
  // -----------------------------------------------------------------------

  /** Enqueue a debounced push for the given project. */
  enqueue(projectId: string): void {
    const existing = this.pushTimers.get(projectId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.pushTimers.delete(projectId);
      this.flushPush(projectId);
    }, PUSH_DEBOUNCE_MS);

    this.pushTimers.set(projectId, timer);
  }

  private async flushPush(projectId: string): Promise<void> {
    if (!this.online || this.pushInflight.has(projectId)) {
      this.enqueue(projectId);
      return;
    }

    this.pushInflight.add(projectId);
    try {
      await this.pushFn(projectId);
    } catch (err) {
      console.error(`[SyncManager] push failed for ${projectId}:`, err);
      this.enqueue(projectId);
    } finally {
      this.pushInflight.delete(projectId);
    }
  }

  // -----------------------------------------------------------------------
  // Pull (batch, interval + on-demand)
  // -----------------------------------------------------------------------

  /** Trigger a pull cycle immediately (non-blocking). */
  pullNow(): void {
    if (!this.online) return;
    this.pullAllFn().catch((err) =>
      console.error("[SyncManager] pull failed:", err)
    );
  }

  // -----------------------------------------------------------------------
  // Network events
  // -----------------------------------------------------------------------

  private handleOnline = (): void => {
    this.online = true;
    // Flush all pending pushes
    for (const projectId of [...this.pushTimers.keys()]) {
      clearTimeout(this.pushTimers.get(projectId)!);
      this.pushTimers.delete(projectId);
      this.flushPush(projectId);
    }
    // And do a pull to pick up anything that happened while offline
    this.pullNow();
  };

  private handleOffline = (): void => {
    this.online = false;
  };
}
