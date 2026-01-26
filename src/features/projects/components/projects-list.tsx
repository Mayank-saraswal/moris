import { Spinner } from "@/components/ui/spinner";
import { useProjectPartial } from "../hooks/use-projects";
import { Kbd } from "@/components/ui/kbd";
import { Doc } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import { GlobeLockIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const formatTimestamp = (timestamp: number) => {
    return formatDistanceToNow( new Date(timestamp), {
        addSuffix: true
    })
}
interface ProjectsListProps {
    onViewAll: ()=>void
}

const ProjectItem = ({data}: {data: Doc<"projects">}) => {
    return (
      <Link href={`/project/${data._id}`} className="text-sm text-foreground/60 font-medium hover:text-foreground py-1 flex items-center justify-between w-full group">
      <div className="flex items-center gap-2">
        <GlobeLockIcon/>
        <span className="truncate">
            {data.name}
        </span>
        <span>
            {formatTimestamp(data.updatedAt)}
        </span>
      </div>
      </Link>
    )
}

export const ProjectsList = ({onViewAll}:ProjectsListProps) => {

    const projects = useProjectPartial(6)

    if ( projects === undefined ) {
        return <Spinner className="size-4 text-ring "/>
    }

    return (


        <div className="flex flex-col gap-4 ">
            {projects.length >0 &&(
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                            Recent Projects
                        </span>
                        <button className="flex items-center gap-2 text-muted-foreground text-xs hover:text-foreground transition-colors" >
                            <span>
                                View All
                            </span>
                            <Kbd className="bg-accent border">
                                ⌘K
                            </Kbd>
                        </button>

                    </div>
                        <ul className="flex flex-col ">
                            {projects.map((project)=>(
                                <ProjectItem key={project._id} data={project} />
                            ))}
                        </ul>
                </div>
            )}
        </div>
    );
}