import type { ProjectStore, ProjectDetail } from "./types";
import { createLocalStore } from "./local-store";
import { SyncManager } from "@/lib/sync/sync-manager";
import {
  localUpdateSyncedAt,
  localApplyPulledProject,
  localGetAllSyncMeta,
  localGetRawProject,
} from "@/lib/local-db";
import type { Skill } from "@/lib/types/skill";

// ---------------------------------------------------------------------------
// Server helpers
// ---------------------------------------------------------------------------

/**
 * Push a single project's IndexedDB state to the server.
 * Stamps `syncedAt` on success.
 */
async function pushProject(projectId: string): Promise<void> {
  // Single read from all 3 stores for a transaction-consistent snapshot
  const project = await localGetRawProject(projectId);
  if (!project) return;

  const res = await fetch("/api/sync/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: projectId,
      name: project.name,
      messages: project.messages,
      data: project.data,
      rules: project.rules,
      skills: project.skills,
      messageCount: project.messageCount,
      totalInputTokens: project.totalInputTokens,
      totalOutputTokens: project.totalOutputTokens,
    }),
  });

  if (res.ok) {
    await localUpdateSyncedAt(projectId, Date.now());
  }
}

/**
 * Batch-check all server projects against local state:
 * 1. Fetch ALL server project timestamps (discovers projects from other devices).
 * 2. Pull any whose server `updatedAt` is newer than our local `syncedAt`,
 *    or that don't exist locally at all.
 */
async function pullAllStaleProjects(): Promise<void> {
  // Fetch all server projects for this user (no ids param = return all)
  const tsRes = await fetch("/api/sync");
  if (!tsRes.ok) return;

  const serverTimestamps: { id: string; updatedAt: string }[] =
    await tsRes.json();
  if (serverTimestamps.length === 0) return;

  const localMeta = await localGetAllSyncMeta();
  const localMap = new Map(localMeta.map((m) => [m.id, m.syncedAt]));

  const stalePulls = serverTimestamps
    .filter((s) => {
      const serverMs = new Date(s.updatedAt).getTime();
      const localSyncedAt = localMap.get(s.id);
      // Pull if: project doesn't exist locally, or server is newer
      return localSyncedAt === undefined || serverMs > localSyncedAt;
    })
    .map((s) => pullSingleProject(s.id));

  await Promise.allSettled(stalePulls);
}

/** Pull a single project from the server into IndexedDB. */
async function pullSingleProject(projectId: string): Promise<void> {
  const pullRes = await fetch("/api/sync/pull", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: projectId }),
  });
  if (!pullRes.ok) return;

  const pulled = await pullRes.json();
  await localApplyPulledProject(pulled);
}

// ---------------------------------------------------------------------------
// Synced store
// ---------------------------------------------------------------------------

export interface SyncedProjectStore extends ProjectStore {
  /** Start the background pull interval. Resolves after the initial pull. */
  startSync(): Promise<void>;
  /** Stop timers and clean up listeners. Call on unmount. */
  destroySync(): void;
}

/**
 * Local-first ProjectStore with background bidirectional sync.
 *
 * Reads  → always from IDB (instant, no server round-trip)
 * Writes → IDB first, then debounced push to server
 * Pull   → at startup, every 30s, and on reconnect (timestamp comparison)
 */
export function createSyncedStore(): SyncedProjectStore {
  const local = createLocalStore();
  const syncManager = new SyncManager(pushProject, pullAllStaleProjects);

  function enqueueSync(projectId: string): void {
    syncManager.enqueue(projectId);
  }

  return {
    isLocal: true,

    startSync() {
      return syncManager.start();
    },
    destroySync() {
      syncManager.destroy();
    },

    // --- Reads: purely local, no server calls ---
    getProjects: local.getProjects,
    getProject: local.getProject,
    getProjectRules: local.getProjectRules,
    getProjectSkills: local.getProjectSkills,
    getCheckpoints: local.getCheckpoints,

    // --- Writes: local first, then push to server ---
    async createProject(input) {
      const result = await local.createProject(input);
      enqueueSync(result.id);
      return result;
    },

    async deleteProject(id) {
      await local.deleteProject(id);
      // Best-effort server delete — don't block on failure
      fetch("/api/sync/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch((err) =>
        console.error(`[SyncedStore] server delete failed for ${id}:`, err)
      );
    },

    async renameProject(id, name) {
      const result = await local.renameProject(id, name);
      enqueueSync(id);
      return result;
    },

    async cloneProject(input) {
      const result = await local.cloneProject(input);
      enqueueSync(result.id);
      return result;
    },

    async saveProjectData(id, data) {
      await local.saveProjectData(id, data);
      enqueueSync(id);
    },

    async saveMessages(id, messages, inputTokens, outputTokens) {
      await local.saveMessages(id, messages, inputTokens, outputTokens);
      enqueueSync(id);
    },

    async saveProjectRules(id, rules) {
      await local.saveProjectRules(id, rules);
      enqueueSync(id);
    },

    async saveProjectSkills(id, skills: Skill[]) {
      await local.saveProjectSkills(id, skills);
      enqueueSync(id);
    },

    async createCheckpoint(projectId, name) {
      const result = await local.createCheckpoint(projectId, name);
      enqueueSync(projectId);
      return result;
    },

    async createAutoCheckpoint(projectId) {
      const result = await local.createAutoCheckpoint(projectId);
      enqueueSync(projectId);
      return result;
    },

    deleteCheckpoint: local.deleteCheckpoint,

    async restoreCheckpoint(checkpointId) {
      const result = await local.restoreCheckpoint(checkpointId);
      enqueueSync(result.projectId);
      return result;
    },

    async togglePublish() {
      return false;
    },
  };
}
