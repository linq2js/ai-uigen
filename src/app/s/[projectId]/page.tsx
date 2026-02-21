import { Metadata } from "next";
import { getPublicProject } from "@/actions/get-public-project";
import { StandaloneView } from "@/components/public/StandaloneView";
import { ProjectNotFound } from "@/components/public/ProjectNotFound";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectId } = await params;
  const project = await getPublicProject(projectId);
  return { title: project?.name ?? "Not Found" };
}

export default async function StandalonePage({ params }: PageProps) {
  const { projectId } = await params;
  const project = await getPublicProject(projectId);

  if (!project) {
    return <ProjectNotFound />;
  }

  return <StandaloneView project={project} />;
}
