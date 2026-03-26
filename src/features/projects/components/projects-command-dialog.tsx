import { useRouter } from "next/navigation";

import { GlobeIcon } from "lucide-react"
import { CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command";

import { useProjects } from "../hooks/use-projects";



interface ProjectsCommandDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};


const getProjectIcon = () => {
    return <GlobeIcon className="size-4 text-muted-foreground" />
}


export const ProjectsCommandDialog = ({ open, onOpenChange }: ProjectsCommandDialogProps) => {
    const { data: projects } = useProjects()
    const router = useRouter()
    const handleSelect = (projectId: string) => {
        router.push(`/projects/${projectId}`)
        onOpenChange(false)
    }

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}
            title="Search Projects"
            description="Search and Navigate to your projects"
        >
            <CommandInput placeholder="Search projects..." />
            <CommandList>
                <CommandEmpty>
                    No projects found.
                </CommandEmpty>
                <CommandGroup heading="Projects">
                    {projects?.map((project) => (
                        <CommandItem
                            key={project.id}
                            value={`${project.name}-${project.id}`}
                            onSelect={() => {
                                handleSelect(project.id)
                            }}
                        >
                            {getProjectIcon()}
                            <span>{project.name}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}