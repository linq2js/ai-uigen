import { openDB, type IDBPDatabase } from "idb";
import type { Skill } from "@/lib/types/skill";

const DB_NAME = "artifex";
// v2: Split monolithic projects into 3 stores (projects, messages, projectData)
// to eliminate write amplification and race conditions between concurrent saves.
const DB_VERSION = 2;

// --- Interfaces ---

/** v2 metadata-only record in the `projects` store (no messages or file data). */
interface LocalProject {
  id: string;
  name: string;
  rules: string;
  skills: Skill[];
  published: false;
  messageCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  createdAt: Date;
  updatedAt: Date;
  /** PostgreSQL project ID — null if never synced to the server. */
  serverId?: string;
  /** Timestamp of the last successful sync to the server. */
  syncedAt?: number;
}

/** v1 monolithic record — projects store contains everything. */
interface LocalProjectV1 extends LocalProject {
  messages: any[];
  data: Record<string, any>;
}

/** Record in the `messages` store (v2 only). */
interface LocalMessages {
  id: string;
  messages: any[];
}

/** Record in the `projectData` store (v2 only). */
interface LocalProjectData {
  id: string;
  data: Record<string, any>;
}

/** Full project blob reconstructed from all 3 stores. Used by sync + return types. */
interface LocalProjectFull extends LocalProject {
  messages: any[];
  data: Record<string, any>;
}

interface LocalCheckpoint {
  id: string;
  name: string;
  type?: "manual" | "auto";
  data: Record<string, any>;
  projectId: string;
  createdAt: Date;
}

function generateLocalId(): string {
  return `local_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Whether the DB has the v2 normalized schema (separate messages + projectData
 * stores). When false, all data lives in the monolithic `projects` store (v1).
 * Set once when the DB opens — all functions branch on this.
 */
let normalized = false;

/** Create required object stores if they don't already exist. */
function ensureStores(db: IDBPDatabase): void {
  if (!db.objectStoreNames.contains("projects")) {
    const projectStore = db.createObjectStore("projects", { keyPath: "id" });
    projectStore.createIndex("updatedAt", "updatedAt");
  }
  if (!db.objectStoreNames.contains("messages")) {
    db.createObjectStore("messages", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("projectData")) {
    db.createObjectStore("projectData", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("checkpoints")) {
    const checkpointStore = db.createObjectStore("checkpoints", { keyPath: "id" });
    checkpointStore.createIndex("projectId", "projectId");
  }
}

/**
 * Migrate v1 → v2: extract messages and data from monolithic project records
 * into their own stores. Runs in a normal readwrite transaction (not the
 * upgrade transaction) to avoid auto-commit issues with async/await in idb.
 */
let v1Migrated = false;
async function migrateV1DataIfNeeded(db: IDBPDatabase): Promise<void> {
  if (v1Migrated) return;
  v1Migrated = true;

  if (!normalized) return;

  // Quick check: does any project record still have embedded messages/data?
  const sample: any = await db.getAll("projects").then((all) => all[0]);
  if (!sample || !("messages" in sample || "data" in sample)) return;

  console.log("[local-db] Migrating v1 data to normalized stores…");
  const all: any[] = await db.getAll("projects");
  const tx = db.transaction(["projects", "messages", "projectData"], "readwrite");

  for (const record of all) {
    if ("messages" in record || "data" in record) {
      tx.objectStore("messages").put({
        id: record.id,
        messages: record.messages ?? [],
      });
      tx.objectStore("projectData").put({
        id: record.id,
        data: record.data ?? {},
      });
      const { messages: _m, data: _d, ...metadata } = record;
      tx.objectStore("projects").put(metadata);
    }
  }

  await tx.done;
  console.log("[local-db] v1 → v2 migration complete.");
}

/** Delete the database entirely. Used as a last-resort recovery. */
function deleteDatabase(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => {
      console.warn("[local-db] deleteDatabase blocked by another connection.");
      resolve();
    };
  });
}

/**
 * Open the database with graceful recovery:
 * 1. Try opening at DB_VERSION — works for fresh installs and matching versions.
 * 2. On VersionError (existing DB is newer) — open without a version to
 *    connect at whatever version already exists (preserves data).
 * 3. On any other unrecoverable error — delete the DB and recreate from scratch.
 */
async function openDBWithRecovery(): Promise<IDBPDatabase> {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        ensureStores(db);
      },
      blocked(currentVersion, blockedVersion) {
        console.warn(
          `[local-db] Upgrade from v${currentVersion} to v${blockedVersion} blocked by another connection. Close other tabs to continue.`
        );
      },
      blocking(_currentVersion, _blockedVersion, event) {
        (event.target as IDBDatabase)?.close();
        dbPromise = null;
      },
      terminated() {
        dbPromise = null;
      },
    });

    normalized = db.objectStoreNames.contains("messages");
    await migrateV1DataIfNeeded(db);
    return db;
  } catch (err) {
    if (err instanceof DOMException && err.name === "VersionError") {
      console.warn(
        `[local-db] Existing DB is newer than v${DB_VERSION}. Opening at current version to preserve data.`
      );
      try {
        const db = await openDB(DB_NAME);
        normalized = db.objectStoreNames.contains("messages");
        return db;
      } catch (fallbackErr) {
        console.error(
          "[local-db] Fallback open also failed. Deleting DB.",
          fallbackErr
        );
      }
    } else {
      console.error("[local-db] Failed to open DB:", err);
    }

    // Nuclear option: delete and recreate.
    console.warn("[local-db] Deleting and recreating database.");
    await deleteDatabase();
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        ensureStores(db);
      },
    });
    normalized = db.objectStoreNames.contains("messages");
    return db;
  }
}

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDBWithRecovery();
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

// --- Projects ---

export async function localCreateProject(input: {
  name: string;
  messages: any[];
  data: Record<string, any>;
}): Promise<LocalProjectFull> {
  const db = await getDB();
  const now = new Date();
  const id = generateLocalId();

  if (normalized) {
    const project: LocalProject = {
      id,
      name: input.name,
      rules: "",
      skills: [],
      published: false,
      messageCount: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      createdAt: now,
      updatedAt: now,
    };

    const tx = db.transaction(["projects", "messages", "projectData"], "readwrite");
    tx.objectStore("projects").put(project);
    tx.objectStore("messages").put({ id, messages: input.messages } satisfies LocalMessages);
    tx.objectStore("projectData").put({ id, data: input.data } satisfies LocalProjectData);
    await tx.done;

    return { ...project, messages: input.messages, data: input.data };
  }

  // v1 fallback: monolithic record
  const project: LocalProjectV1 = {
    id,
    name: input.name,
    messages: input.messages,
    data: input.data,
    rules: "",
    skills: [],
    published: false,
    messageCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.put("projects", project);
  return project;
}

export async function localGetProjects(): Promise<
  { id: string; name: string; published: boolean; createdAt: Date; updatedAt: Date }[]
> {
  const db = await getDB();
  const all: LocalProject[] = await db.getAll("projects");
  all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return all.map(({ id, name, published, createdAt, updatedAt }) => ({
    id,
    name,
    published,
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
  }));
}

export async function localGetProject(projectId: string): Promise<{
  id: string;
  name: string;
  messages: any[];
  data: any;
  published: boolean;
  messageCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  dataSize: number;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  const db = await getDB();

  let project: LocalProject | undefined;
  let messages: any[];
  let data: Record<string, any>;

  if (normalized) {
    const tx = db.transaction(["projects", "messages", "projectData"], "readonly");
    const [p, m, d] = await Promise.all([
      tx.objectStore("projects").get(projectId) as Promise<LocalProject | undefined>,
      tx.objectStore("messages").get(projectId) as Promise<LocalMessages | undefined>,
      tx.objectStore("projectData").get(projectId) as Promise<LocalProjectData | undefined>,
    ]);
    await tx.done;
    project = p;
    messages = m?.messages ?? [];
    data = d?.data ?? {};
  } else {
    // v1 fallback: everything in one record
    const record: LocalProjectV1 | undefined = await db.get("projects", projectId);
    project = record;
    messages = record?.messages ?? [];
    data = record?.data ?? {};
  }

  if (!project) return null;

  const dataSize = new Blob([JSON.stringify(data), JSON.stringify(messages)]).size;

  return {
    id: project.id,
    name: project.name,
    messages,
    data,
    published: project.published,
    messageCount: project.messageCount,
    totalInputTokens: project.totalInputTokens,
    totalOutputTokens: project.totalOutputTokens,
    dataSize,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
  };
}

export async function localDeleteProject(projectId: string): Promise<void> {
  const db = await getDB();

  if (normalized) {
    const tx = db.transaction(["projects", "messages", "projectData", "checkpoints"], "readwrite");
    tx.objectStore("projects").delete(projectId);
    tx.objectStore("messages").delete(projectId);
    tx.objectStore("projectData").delete(projectId);
    const index = tx.objectStore("checkpoints").index("projectId");
    let cursor = await index.openCursor(projectId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  } else {
    await db.delete("projects", projectId);
    const tx = db.transaction("checkpoints", "readwrite");
    const index = tx.store.index("projectId");
    let cursor = await index.openCursor(projectId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }
}

export async function localRenameProject(projectId: string, name: string): Promise<string> {
  const db = await getDB();
  const project: LocalProject | undefined = await db.get("projects", projectId);
  if (!project) throw new Error("Project not found");
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name cannot be empty");
  project.name = trimmed;
  project.updatedAt = new Date();
  await db.put("projects", project);
  return trimmed;
}

export async function localCloneProject(input: {
  sourceProjectId: string;
  name?: string;
  includeSourceCode?: boolean;
  includeMessages?: boolean;
  includeSkills?: boolean;
  includeRules?: boolean;
  fromMessageIndex?: number;
}): Promise<LocalProjectFull> {
  const db = await getDB();

  let source: LocalProject | undefined;
  let sourceMessages: any[];
  let sourceData: Record<string, any>;

  if (normalized) {
    const readTx = db.transaction(["projects", "messages", "projectData"], "readonly");
    const [p, m, d] = await Promise.all([
      readTx.objectStore("projects").get(input.sourceProjectId) as Promise<LocalProject | undefined>,
      readTx.objectStore("messages").get(input.sourceProjectId) as Promise<LocalMessages | undefined>,
      readTx.objectStore("projectData").get(input.sourceProjectId) as Promise<LocalProjectData | undefined>,
    ]);
    await readTx.done;
    source = p;
    sourceMessages = m?.messages ?? [];
    sourceData = d?.data ?? {};
  } else {
    const record: LocalProjectV1 | undefined = await db.get("projects", input.sourceProjectId);
    source = record;
    sourceMessages = record?.messages ?? [];
    sourceData = record?.data ?? {};
  }

  if (!source) throw new Error("Project not found");

  const {
    name,
    includeSourceCode = true,
    includeMessages = true,
    includeSkills = true,
    includeRules = true,
    fromMessageIndex,
  } = input;

  const now = new Date();
  const id = generateLocalId();

  const clonedMessages = includeMessages
    ? fromMessageIndex != null
      ? sourceMessages.slice(fromMessageIndex)
      : structuredClone(sourceMessages)
    : [];

  const clonedData = includeSourceCode ? structuredClone(sourceData) : {};

  if (normalized) {
    const cloneProject: LocalProject = {
      id,
      name: name?.trim() || `Copy of ${source.name}`,
      rules: includeRules ? source.rules : "",
      skills: includeSkills ? structuredClone(source.skills) : [],
      published: false,
      messageCount: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      createdAt: now,
      updatedAt: now,
    };

    const writeTx = db.transaction(["projects", "messages", "projectData"], "readwrite");
    writeTx.objectStore("projects").put(cloneProject);
    writeTx.objectStore("messages").put({ id, messages: clonedMessages } satisfies LocalMessages);
    writeTx.objectStore("projectData").put({ id, data: clonedData } satisfies LocalProjectData);
    await writeTx.done;

    return { ...cloneProject, messages: clonedMessages, data: clonedData };
  }

  // v1 fallback
  const clone: LocalProjectV1 = {
    id,
    name: name?.trim() || `Copy of ${source.name}`,
    data: clonedData,
    messages: clonedMessages,
    rules: includeRules ? source.rules : "",
    skills: includeSkills ? structuredClone(source.skills) : [],
    published: false,
    messageCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.put("projects", clone);
  return clone;
}

export async function localSaveProjectData(projectId: string, data: string): Promise<void> {
  const db = await getDB();

  if (normalized) {
    const tx = db.transaction(["projectData", "projects"], "readwrite");
    tx.objectStore("projectData").put({ id: projectId, data: JSON.parse(data) });
    const project: LocalProject | undefined = await tx.objectStore("projects").get(projectId);
    if (project) {
      project.updatedAt = new Date();
      tx.objectStore("projects").put(project);
    }
    await tx.done;
    return;
  }

  // v1 fallback
  const project: LocalProjectV1 | undefined = await db.get("projects", projectId);
  if (!project) return;
  project.data = JSON.parse(data);
  project.updatedAt = new Date();
  await db.put("projects", project);
}

export async function localSaveProjectMessages(
  projectId: string,
  messages: any[],
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const db = await getDB();

  if (normalized) {
    const tx = db.transaction(["messages", "projects"], "readwrite");
    tx.objectStore("messages").put({ id: projectId, messages });
    const project: LocalProject | undefined = await tx.objectStore("projects").get(projectId);
    if (project) {
      project.messageCount = messages.filter(
        (m: any) => m.role === "user" || m.role === "assistant"
      ).length;
      project.totalInputTokens += inputTokens;
      project.totalOutputTokens += outputTokens;
      project.updatedAt = new Date();
      tx.objectStore("projects").put(project);
    }
    await tx.done;
    return;
  }

  // v1 fallback
  const project: LocalProjectV1 | undefined = await db.get("projects", projectId);
  if (!project) return;
  project.messages = messages;
  project.messageCount = messages.filter(
    (m: any) => m.role === "user" || m.role === "assistant"
  ).length;
  project.totalInputTokens += inputTokens;
  project.totalOutputTokens += outputTokens;
  project.updatedAt = new Date();
  await db.put("projects", project);
}

export async function localSaveProjectRules(projectId: string, rules: string): Promise<void> {
  const db = await getDB();
  const project: LocalProject | undefined = await db.get("projects", projectId);
  if (!project) return;
  project.rules = rules;
  project.updatedAt = new Date();
  await db.put("projects", project);
}

export async function localGetProjectRules(projectId: string): Promise<string> {
  const db = await getDB();
  const project: LocalProject | undefined = await db.get("projects", projectId);
  return project?.rules ?? "";
}

export async function localSaveProjectSkills(projectId: string, skills: Skill[]): Promise<void> {
  const db = await getDB();
  const project: LocalProject | undefined = await db.get("projects", projectId);
  if (!project) return;
  project.skills = skills;
  project.updatedAt = new Date();
  await db.put("projects", project);
}

export async function localGetProjectSkills(projectId: string): Promise<Skill[]> {
  const db = await getDB();
  const project: LocalProject | undefined = await db.get("projects", projectId);
  return project?.skills ?? [];
}

// --- Sync helpers ---

/** Return all local project IDs and their syncedAt timestamps. */
export async function localGetAllSyncMeta(): Promise<
  { id: string; syncedAt: number }[]
> {
  const db = await getDB();
  const all: LocalProject[] = await db.getAll("projects");
  return all.map((p) => ({ id: p.id, syncedAt: p.syncedAt ?? 0 }));
}

/** Get the full project blob (metadata + messages + data) from IndexedDB. Used by sync push. */
export async function localGetRawProject(projectId: string): Promise<LocalProjectFull | undefined> {
  const db = await getDB();

  if (normalized) {
    const tx = db.transaction(["projects", "messages", "projectData"], "readonly");
    const [project, messagesRecord, dataRecord] = await Promise.all([
      tx.objectStore("projects").get(projectId) as Promise<LocalProject | undefined>,
      tx.objectStore("messages").get(projectId) as Promise<LocalMessages | undefined>,
      tx.objectStore("projectData").get(projectId) as Promise<LocalProjectData | undefined>,
    ]);
    await tx.done;
    if (!project) return undefined;
    return {
      ...project,
      messages: messagesRecord?.messages ?? [],
      data: dataRecord?.data ?? {},
    };
  }

  // v1 fallback: project record already contains everything
  return db.get("projects", projectId);
}

/** Stamp a project with the current sync time after a successful server push. */
export async function localUpdateSyncedAt(projectId: string, syncedAt: number): Promise<void> {
  const db = await getDB();
  const project: LocalProject | undefined = await db.get("projects", projectId);
  if (!project) return;
  project.syncedAt = syncedAt;
  await db.put("projects", project);
}

/** Overwrite a local project with data pulled from the server. */
export async function localApplyPulledProject(pulled: {
  id: string;
  name: string;
  messages: any[];
  data: any;
  rules: string;
  skills: Skill[];
  messageCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  updatedAt: string;
}): Promise<void> {
  const db = await getDB();
  const existing: LocalProject | undefined = await db.get("projects", pulled.id);
  const now = new Date();

  if (normalized) {
    const project: LocalProject = {
      id: pulled.id,
      name: pulled.name,
      rules: pulled.rules,
      skills: pulled.skills,
      published: false,
      messageCount: pulled.messageCount,
      totalInputTokens: pulled.totalInputTokens,
      totalOutputTokens: pulled.totalOutputTokens,
      createdAt: existing?.createdAt ?? now,
      updatedAt: new Date(pulled.updatedAt),
      syncedAt: Date.now(),
    };

    const tx = db.transaction(["projects", "messages", "projectData"], "readwrite");
    tx.objectStore("projects").put(project);
    tx.objectStore("messages").put({ id: pulled.id, messages: pulled.messages } satisfies LocalMessages);
    tx.objectStore("projectData").put({ id: pulled.id, data: pulled.data } satisfies LocalProjectData);
    await tx.done;
    return;
  }

  // v1 fallback
  const project: LocalProjectV1 = {
    id: pulled.id,
    name: pulled.name,
    messages: pulled.messages,
    data: pulled.data,
    rules: pulled.rules,
    skills: pulled.skills,
    published: false,
    messageCount: pulled.messageCount,
    totalInputTokens: pulled.totalInputTokens,
    totalOutputTokens: pulled.totalOutputTokens,
    createdAt: existing?.createdAt ?? now,
    updatedAt: new Date(pulled.updatedAt),
    syncedAt: Date.now(),
  };
  await db.put("projects", project);
}

// --- Checkpoints ---

const MAX_CHECKPOINTS_PER_PROJECT = 3;

export async function localCreateCheckpoint(
  projectId: string,
  name: string,
  type: "manual" | "auto" = "manual"
): Promise<{ id: string; name: string; type: "manual" | "auto"; createdAt: Date }> {
  const db = await getDB();

  let projectData: Record<string, any>;
  if (normalized) {
    const dataRecord: LocalProjectData | undefined = await db.get("projectData", projectId);
    if (!dataRecord) throw new Error("Project not found");
    projectData = dataRecord.data;
  } else {
    const project: LocalProjectV1 | undefined = await db.get("projects", projectId);
    if (!project) throw new Error("Project not found");
    projectData = project.data;
  }

  // Enforce limits based on type
  const tx = db.transaction("checkpoints", "readwrite");
  const index = tx.store.index("projectId");
  const existing: LocalCheckpoint[] = await index.getAll(projectId);

  if (type === "auto") {
    // Delete ALL existing auto-checkpoints for this project (keep max 1)
    for (const cp of existing) {
      if ((cp.type ?? "manual") === "auto") {
        await tx.store.delete(cp.id);
      }
    }
  } else {
    // For manual: only count non-auto checkpoints toward the limit
    const manualCheckpoints = existing
      .filter((cp) => (cp.type ?? "manual") !== "auto")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (manualCheckpoints.length >= MAX_CHECKPOINTS_PER_PROJECT) {
      await tx.store.delete(manualCheckpoints[0].id);
    }
  }
  await tx.done;

  const checkpoint: LocalCheckpoint = {
    id: generateLocalId(),
    name,
    type,
    data: structuredClone(projectData),
    projectId,
    createdAt: new Date(),
  };
  await db.put("checkpoints", checkpoint);
  return { id: checkpoint.id, name: checkpoint.name, type: checkpoint.type!, createdAt: checkpoint.createdAt };
}

export async function localGetCheckpoints(
  projectId: string
): Promise<{ id: string; name: string; type: "manual" | "auto"; createdAt: Date }[]> {
  const db = await getDB();
  const index = db.transaction("checkpoints").store.index("projectId");
  const all: LocalCheckpoint[] = await index.getAll(projectId);
  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return all.map(({ id, name, type, createdAt }) => ({
    id,
    name,
    type: type ?? "manual",
    createdAt: new Date(createdAt),
  }));
}

export async function localDeleteCheckpoint(checkpointId: string): Promise<void> {
  const db = await getDB();
  await db.delete("checkpoints", checkpointId);
}

export async function localRestoreCheckpoint(checkpointId: string): Promise<{ projectId: string }> {
  const db = await getDB();
  const checkpoint: LocalCheckpoint | undefined = await db.get("checkpoints", checkpointId);
  if (!checkpoint) throw new Error("Checkpoint not found");

  if (normalized) {
    const tx = db.transaction(["projectData", "projects"], "readwrite");
    tx.objectStore("projectData").put({
      id: checkpoint.projectId,
      data: structuredClone(checkpoint.data),
    });
    const project: LocalProject | undefined = await tx.objectStore("projects").get(checkpoint.projectId);
    if (project) {
      project.updatedAt = new Date();
      tx.objectStore("projects").put(project);
    }
    await tx.done;
  } else {
    // v1 fallback
    const project: LocalProjectV1 | undefined = await db.get("projects", checkpoint.projectId);
    if (!project) throw new Error("Project not found");
    project.data = structuredClone(checkpoint.data);
    project.updatedAt = new Date();
    await db.put("projects", project);
  }

  return { projectId: checkpoint.projectId };
}
