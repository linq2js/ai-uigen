import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * POST /api/sync/pull
 *
 * Return full project data for a given ID so the client can hydrate IndexedDB.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id } = body;
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id, userId: session.userId },
  });

  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    id: project.id,
    name: project.name,
    messages: JSON.parse(project.messages),
    data: JSON.parse(project.data),
    rules: project.rules,
    skills: JSON.parse(project.skills),
    messageCount: project.messageCount,
    totalInputTokens: project.totalInputTokens,
    totalOutputTokens: project.totalOutputTokens,
    published: project.published,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
}
