import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, CopyMinusIcon, FilePlusCornerIcon, FolderPlusIcon } from "lucide-react";
import { useState } from "react";

import { useProject } from "../../hooks/use-projects";
import { Button } from "@/components/ui/button";
import { useCreateFile, useCreateFolder } from "../../hooks/use-files";
import { CreateInput } from "./create-input";
import { useFolderContents } from "../../hooks/use-files";
import { LoadingRow } from "./loading-row";
import { Tree } from "./tree";

export const FileExplorer = ({ projectId }: { projectId: string }) => {
    const [isOpen, setIsOpen] = useState(true);
    const rootFiles = useFolderContents({ projectId, enabled: isOpen });
    const [collapseKey, setCollapseKey] = useState(0);
    const [creating, setCreating] = useState<"file" | "folder" | null>(null);
    const project = useProject(projectId);


    const createFile = useCreateFile();
    const createFolder = useCreateFolder();
    const handleCreate = (name: string) => {
        setCreating(null);
        if (creating === "file") {
            createFile.mutate({
                projectId,
                name,
                content: ""
            })
        }

        else {
            createFolder.mutate({
                projectId,
                name
            })
        }
    }
    return (


        <div className="h-full bg-sidebar">
            <ScrollArea className="h-full">
                <div
                    role="button"
                    onClick={() => setIsOpen((value) => !value)}
                    className="group/project cursor-pointer w-full text-left flex items-center gap-0.5 h-[22px]
                bg-accent font-bold
                "
                >
                    <ChevronRightIcon
                        className={cn(" size-4 shrink-0 text-muted-foreground ", isOpen && "rotate-90")}

                    />
                    <p className="text-sm uppercase line-clamp-1">
                        {project.data?.name ?? "Loading..."}
                    </p>
                    <div className="opacity-0 group-hover/project:opacity-100 transition-none duration-0 flex items-center gap-0.5 ml-auto">
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setIsOpen(true)
                                setCreating("file")


                            }}
                            variant="highlight"
                            size="icon-xs"


                        >
                            <FilePlusCornerIcon className="size-3.5" />

                        </Button>


                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setIsOpen(true)
                                setCreating("folder")


                            }}
                            variant="highlight"
                            size="icon-xs"


                        >
                            <FolderPlusIcon className="size-3.5" />

                        </Button>



                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setCollapseKey((prev) => prev + 1);



                            }}
                            variant="highlight"
                            size="icon-xs"


                        >
                            <CopyMinusIcon className="size-3.5" />

                        </Button>


                    </div>

                </div>
                {isOpen && (
                    <>
                        {rootFiles.data === undefined && <LoadingRow level={0} />}
                        {creating && (
                            <CreateInput
                                type={creating}
                                level={0}
                                onCancel={() => setCreating(null)}
                                onSubmit={handleCreate}
                            />
                        )}
                        {rootFiles.data?.map((item) => (
                            <Tree
                                key={`${item.id}-${collapseKey}`}
                                item={item}
                                level={0}
                                projectId={projectId}
                            />
                        ))}
                    </>
                )}
            </ScrollArea>
        </div>
    );
};