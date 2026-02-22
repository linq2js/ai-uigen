import { getUser } from "@/actions";
import { getProject } from "@/actions/get-project";
import { MainContent } from "@/app/main-content";
import { ProjectStoreProvider } from "@/lib/project-store/context";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { projectId } = await params;
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  let project;
  try {
    project = await getProject(projectId);
  } catch (error) {
    // If project not found or user doesn't have access, redirect to home
    redirect("/");
  }

  return (
    <ProjectStoreProvider isAuthenticated={true}>
      <MainContent user={user} project={project} />
    </ProjectStoreProvider>
  );
}
