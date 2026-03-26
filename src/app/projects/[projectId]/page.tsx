import { ProjectIdView } from "@/features/projects/components/project-id-view";

const ProjectPage = async ({ params }: { params: Promise<{ projectId: string }> }) => {
    const { projectId } = await params;
    return <ProjectIdView projectId={projectId} />;
};

export default ProjectPage;
