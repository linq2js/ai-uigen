import type { ProjectStore } from "./types";
import { createLocalStore } from "./local-store";
import { SyncManager } from "@/lib/sync/sync-manager";
import type { Skill } from "@/lib/types/skill";

/**
 * Push a single project's current IndexedDB state to the server via the sync API.
 */
async function pushProject(projectId: string): Promise<void> {
  const store = createLocalStore();
  const project = await store.getProject(projectId);
  if (!project) return;

  const rules = await store.getProjectRules(projectId);
  const skills = await store.getProjectSkills(projectId);

  await fetch("/api/sync/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: projectId,
      name: project.name,
      messages: project.messages,
      data: project.data,
      rules,
      skills,
      messageCount: project.messageCount,
      totalInputTokens: project.totalInputTokens,
      totalOutputTokens: project.totalOutputTokens,
    }),
  });
}

/**
 * Creates a local-first ProjectStore that also pushes changes to the server
 * in the background via SyncManager. All reads go to IndexedDB; writes
 * go to IndexedDB first, then enqueue a background server push.
 */
export function createSyncedStore(): ProjectStore {
  const local = createLocalStore();
  const syncManager = new SyncManager(pushProject);

  function enqueueSync(projectId: string): void {
    syncManager.enqueue(projectId);
  }

  return {
    isLocal: true, // Reads always go to IndexedDB
    getProjects: local.getProjects,
    getProject: local.getProject,
    async createProject(input) {
      const result = await local.createProject(input);
      enqueueSync(result.id);
      return result;
    },
    async deleteProject(id) {
      await local.deleteProject(id);
      // Optionally: call a server delete endpoint
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
    getProjectRules: local.getProjectRules,
    async saveProjectSkills(id, skills: Skill[]) {
      await local.saveProjectSkills(id, skills);
      enqueueSync(id);
    },
    getProjectSkills: local.getProjectSkills,
    getCheckpoints: local.getCheckpoints,
    async createCheckpoint(projectId, name) {
      const result = await local.createCheckpoint(projectId, name);
      enqueueSync(projectId);
      return result;
    },
    deleteCheckpoint: local.deleteCheckpoint,
    async restoreCheckpoint(checkpointId) {
      await local.restoreCheckpoint(checkpointId);
      // We don't know the projectId here, so skip sync for checkpoint restore
    },
    async togglePublish() {
      return false;
    },
  };
}
