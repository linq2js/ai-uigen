"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface CloneProjectInput {
  sourceProjectId: string;
  name?: string;
  includeSourceCode?: boolean;
  includeMessages?: boolean;
  includeSkills?: boolean;
  includeRules?: boolean;
  fromMessageIndex?: number;
}

export async function cloneProject(input: CloneProjectInput) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const {
    sourceProjectId,
    name,
    includeSourceCode = true,
    includeMessages = true,
    includeSkills = true,
    includeRules = true,
    fromMessageIndex,
  } = input;

  const source = await prisma.project.findUnique({
    where: { id: sourceProjectId, userId: session.userId },
  });

  if (!source) throw new Error("Project not found");

  const project = await prisma.project.create({
    data: {
      name: name?.trim() || `Copy of ${source.name}`,
      userId: session.userId,
      data: includeSourceCode ? source.data : "{}",
      messages: includeMessages
        ? fromMessageIndex != null
          ? JSON.stringify(JSON.parse(source.messages ?? "[]").slice(fromMessageIndex))
          : source.messages
        : "[]",
      skills: includeSkills ? source.skills : "[]",
      rules: includeRules ? source.rules : "",
      published: false,
    },
  });

  return project;
}
