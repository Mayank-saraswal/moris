import { ProjectIdLayout } from "@/features/projects/components/project-id-layout";
import { Id } from "../../../../convex/_generated/dataModel";

const ProjectLayout = async ({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ projectId: string }>;
}) => {
    const { projectId } = await params;

    return (
        <ProjectIdLayout projectId={projectId as Id<"projects">}>
            {children}
        </ProjectIdLayout>
    );
};

export default ProjectLayout;
