
import { cn } from "@/lib/utils";
import chevronRightIcon, { ChevronRightIcon } from "lucide-react";
import { FileIcon } from "@react-symbols/icons/utils";
import { FolderIcon } from "@react-symbols/icons/utils";

import { useCreateFile, useCreateFolder, useFolderContents } from "../../hooks/use-files";
import { getItemPadding } from "./constants";
import { LoadingRow } from "./loading-row";
import { CreateInput } from "./create-input";

import { Id, Doc } from "../../../../../convex/_generated/dataModel";
import { useState } from "react";
import { useRenameFile } from "../../hooks/use-files";
import { useDeleteFile } from "../../hooks/use-files";
import { TreeItemWrapper } from "./tree-item-wrapper";
import { RenameInput } from "./rename-input";
import { useEditor } from "@/features/editor/hooks/use-editor";


export const Tree = ({
    item,
    level = 0,
    projectId
}: {
    item: Doc<"files">;
    level: number;
    projectId: Id<"projects">;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [isCreating, setIsCreating] = useState<"file" | "folder" | null>(null);
    


    const renameFile = useRenameFile();
    const deleteFile = useDeleteFile();
    const createFolder = useCreateFolder();
    const createFile = useCreateFile();
    const folderContents = useFolderContents({ projectId, parentId: item._id, enabled: item.type === "folder" && isOpen });

    const {openFile , closeTab , activeTabId} = useEditor(projectId);
    const filename = item.name;


    const handleCreate = (name: string) => {
        setIsCreating(null);
        if (isCreating === "file") {
            createFile({
                projectId,
                content: "",
                parentId: item._id,
                name,
            })
        } else {
            createFolder({
                projectId,
                parentId: item._id,
                name,
            })
        }
    }

    const handleRename = (newName: string) => {
        setIsRenaming(false);
        if(newName === filename){
            return;
        }
        renameFile({
            id: item._id,
            newName,
        })
    }


    const startCreating = (type: "file" | "folder") => {
        setIsCreating(type);
        setIsOpen(true);
    };

    if (item.type === "file") {
        const isActive = activeTabId === item._id;

        if(isRenaming){
            return (
                <RenameInput
                    type="file"
                    defaultValue={filename}
                    level={level}
                    onSubmit={handleRename}
                    onCancel={() => setIsRenaming(false)}
                />
            )
        }
        return (
            <TreeItemWrapper
                item={item}
                level={level}
                isActive={isActive}
                onClick={() => {
                    openFile(item._id , {pinned:false});
                }}
                onDoubleClick={() => {
                    openFile(item._id , {pinned:true});
                }}

                onRename={() => {
                    setIsRenaming(true);

                }}
                onDelete={() => {
                    closeTab(item._id);
                    deleteFile({
                        id: item._id
                    })
                }}

            >
                <FileIcon fileName={filename} autoAssign className="size-4" />
                <span className="text-sm truncate">{item.name}</span>
            </TreeItemWrapper>
        );
    }

    const folderName = item.name;
    const folderRender = (
        <>
            <div className="flex items-center gap-0.5">
                <ChevronRightIcon
                    className={cn("size-4 shrink-0 text-muted-foreground ", isOpen && "rotate-90")}

                />
                <FolderIcon
                    folderName={folderName}
                    className="size-4"
                />
                <span className="text-sm truncate">{folderName}</span>
            </div>
        </>
    )

    if(isCreating){
        return (
            <>
            <button
            onClick={() => setIsOpen((value) => !value)}

            className="group flex items-center gap-1 h-5.5 hover:bg-accent/30 w-full"
            style={{ paddingLeft: getItemPadding(level, false) }}
            >
                {folderRender}

            </button>
            {isOpen && (
                <>
                {folderContents === undefined && <LoadingRow level={level + 1} />}
                <CreateInput
                type={isCreating}
                level={level+1}
                onSubmit={handleCreate}
                onCancel={() => setIsCreating(null)}
                />

                {folderContents?.map((subitem) => (
                    <Tree
                        key={subitem._id}
                        item={subitem}
                        level={level + 1}
                        projectId={projectId}
                    />
                ))}
                </>
            )}
            </>
            
            
        )
    }



     if(isRenaming){
        return (
            <>
            <RenameInput
            type="folder"
            level={level}
            defaultValue={folderName}
            isOpen={isOpen}
            onSubmit={handleRename}
            onCancel={() => setIsRenaming(false)}
            />
            {isOpen && (
                <>
                {folderContents === undefined && <LoadingRow level={level + 1} />}
                

                {folderContents?.map((subitem) => (
                    <Tree
                        key={subitem._id}
                        item={subitem}
                        level={level + 1}
                        projectId={projectId}
                    />
                ))}
                </>
            )}
            </>
            
            
        )
    }

    return (
        <>
            <TreeItemWrapper
                item={item}
                level={level}
                isActive={false}
                onClick={() => {
                    setIsOpen((value) => !value);
                }}

                onRename={() => {
                    setIsRenaming(true);

                }}
                onDelete={() => {
                    //TODO Close tab 
                    deleteFile({
                        id: item._id
                    })
                }}

                onCreateFile={() => {
                    startCreating("file");
                }}
                onCreateFolder={() => {
                    startCreating("folder");
                }}

            >
                {folderRender}
            </TreeItemWrapper>

            {isOpen && (
                <>
                    {folderContents === undefined && <LoadingRow level={level + 1} />}
                    {folderContents?.map((subitem) => (
                        <Tree
                            key={subitem._id}
                            item={subitem}
                            level={level + 1}
                            projectId={projectId}
                        />
                    ))}
                </>
            )}
        </>
    );


}
