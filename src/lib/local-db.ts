import { openDB, type IDBPDatabase } from "idb";
import type { Skill } from "@/lib/types/skill";

const DB_NAME = "artifex";
const DB_VERSION = 1;

interface LocalProject {
  id: string;
  name: string;
  messages: any[];
  data: Record<string, any>;
  rules: string;
  skills: Skill[];
  published: false;
  messageCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

interface LocalCheckpoint {
  id: string;
  name: string;
  data: Record<string, any>;
  projectId: string;
  createdAt: Date;
}

function generateLocalId(): string {
  return `local_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("projects")) {
          const store = db.createObjectStore("projects", { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains("checkpoints")) {
          const store = db.createObjectStore("checkpoints", { keyPath: "id" });
          store.createIndex("projectId", "projectId");
        }
      },
    });
  }
  return dbPromise;
}

// --- Projects ---

export async function localCreateProject(input: {
  name: string;
  messages: any[];
  data: Record<string, any>;
}): Promise<LocalProject> {
  const db = await getDB();
  const now = new Date();
  const project: LocalProject = {
    id: generateLocalId(),
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
  const project: LocalProject | undefined = await db.get("projects", projectId);
  if (!project) return null;
  const dataStr = JSON.stringify(project.data);
  const messagesStr = JSON.stringify(project.messages);
  const dataSize = new Blob([dataStr, messagesStr]).size;
  return {
    id: project.id,
    name: project.name,
    messages: project.messages,
    data: project.data,
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
  await db.delete("projects", projectId);
  // Delete associated checkpoints
  const tx = db.transaction("checkpoints", "readwrite");
  const index = tx.store.index("projectId");
  let cursor = await index.openCursor(projectId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
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
}): Promise<LocalProject> {
  const db = await getDB();
  const source: LocalProject | undefined = await db.get("projects", input.sourceProjectId);
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
  const clone: LocalProject = {
    id: generateLocalId(),
    name: name?.trim() || `Copy of ${source.name}`,
    data: includeSourceCode ? structuredClone(source.data) : {},
    messages: includeMessages
      ? fromMessageIndex != null
        ? source.messages.slice(fromMessageIndex)
        : structuredClone(source.messages)
      : [],
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
  const project: LocalProject | undefined = await db.get("projects", projectId);
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
  const project: LocalProject | undefined = await db.get("projects", projectId);
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

// --- Checkpoints ---

const MAX_CHECKPOINTS_PER_PROJECT = 3;

export async function localCreateCheckpoint(
  projectId: string,
  name: string
): Promise<{ id: string; name: string; createdAt: Date }> {
  const db = await getDB();
  const project: LocalProject | undefined = await db.get("projects", projectId);
  if (!project) throw new Error("Project not found");

  // Enforce max checkpoints
  const tx = db.transaction("checkpoints", "readwrite");
  const index = tx.store.index("projectId");
  const existing: LocalCheckpoint[] = await index.getAll(projectId);
  existing.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  if (existing.length >= MAX_CHECKPOINTS_PER_PROJECT) {
    await tx.store.delete(existing[0].id);
  }
  await tx.done;

  const checkpoint: LocalCheckpoint = {
    id: generateLocalId(),
    name,
    data: structuredClone(project.data),
    projectId,
    createdAt: new Date(),
  };
  await db.put("checkpoints", checkpoint);
  return { id: checkpoint.id, name: checkpoint.name, createdAt: checkpoint.createdAt };
}

export async function localGetCheckpoints(
  projectId: string
): Promise<{ id: string; name: string; createdAt: Date }[]> {
  const db = await getDB();
  const index = db.transaction("checkpoints").store.index("projectId");
  const all: LocalCheckpoint[] = await index.getAll(projectId);
  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return all.map(({ id, name, createdAt }) => ({
    id,
    name,
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

  const project: LocalProject | undefined = await db.get("projects", checkpoint.projectId);
  if (!project) throw new Error("Project not found");

  project.data = structuredClone(checkpoint.data);
  project.updatedAt = new Date();
  await db.put("projects", project);

  return { projectId: checkpoint.projectId };
}
