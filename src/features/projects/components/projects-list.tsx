import { Spinner } from "@/components/ui/spinner";
import { useProjectPartial } from "../hooks/use-projects";
import { Kbd } from "@/components/ui/kbd";

import Link from "next/link";
import { ArrowRightIcon, GlobeIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

const formatTimestamp = (timestamp: string | number) => {
    return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true
    })
}

interface ProjectPartial {
    id: string;
    name: string;
    language: string;
    updatedAt?: string;
}

const getProjectIcon = (_project: ProjectPartial) => {
    return <GlobeIcon className="size-3.5 text-muted-foreground" />
}

interface ProjectsListProps {
    onViewAll: () => void
}

const ContinueCard = ({ data }: { data: ProjectPartial }) => {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
                Last Updated
            </span>
            <Button
                variant="outline"
                className="h-auto items-start justify-start p-4 bg-background border rounded-none flex flex-col gap-2"
            >
                <Link href={`/projects/${data.id}`} className="group">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            {getProjectIcon(data)}
                            <span className="truncate font-medium">
                                {data.name}
                            </span>

                        </div>
                        <ArrowRightIcon className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />

                    </div>
                    {data.updatedAt && (
                        <span className="text-xs text-muted-foreground">
                            {formatTimestamp(data.updatedAt)}
                        </span>
                    )}
                </Link>
            </Button>

        </div>
    )
}

const ProjectItem = ({ data }: { data: ProjectPartial }) => {
    return (
        <Link href={`/project/${data.id}`} className="text-sm text-foreground/60 font-medium hover:text-foreground py-1 flex items-center justify-between w-full group">
            <div className="flex items-center gap-2">
                {getProjectIcon(data)}
                <span className="truncate">
                    {data.name}
                </span>
                {data.updatedAt && (
                    <span className="text-xs text-muted-foreground group-hover:text-foreground/60 transition-colors" >
                        {formatTimestamp(data.updatedAt)}
                    </span>
                )}
            </div>
        </Link>
    )
}

export const ProjectsList = ({ onViewAll }: ProjectsListProps) => {

    const { data: projects } = useProjectPartial(6)

    if (projects === undefined) {
        return <Spinner className="size-4 text-ring " />
    }


    const [mostRecent, ...rest] = projects


    return (


        <div className="flex flex-col gap-4 ">
            {mostRecent ? (
                <ContinueCard data={mostRecent} />
            ) : null}
            {rest.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                            Recent Projects
                        </span>
                        <button
                            onClick={onViewAll}
                            className="flex items-center gap-2 text-muted-foreground text-xs hover:text-foreground transition-colors" >
                            <span>
                                View All
                            </span>
                            <Kbd className="bg-accent border">
                                ⌘K
                            </Kbd>
                        </button>

                    </div>
                    <ul className="flex flex-col ">
                        {rest.map((project) => (
                            <ProjectItem key={project.id} data={project} />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}