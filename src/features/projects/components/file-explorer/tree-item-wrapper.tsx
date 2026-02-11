import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator, ContextMenuShortcut } from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";


import { getItemPadding } from "./constants";
import { Doc } from "../../../../../convex/_generated/dataModel";
import { CommandIcon } from "lucide-react";

export const TreeItemWrapper = ({
    item,
    isActive,
    level,
    children,
    onClick,
    onRename,
    onDelete,
    onDoubleClick,
    onCreateFile,
    onCreateFolder,
}: {

    item: Doc<"files">;
    isActive?: boolean;
    level: number;
    children: React.ReactNode;
    onClick?: () => void;
    onRename?: () => void;
    onDelete?: () => void;
    onDoubleClick?: () => void;
    onCreateFile?: () => void;
    onCreateFolder?: () => void;

}) => {
    return (
        <ContextMenu >
            <ContextMenuTrigger asChild>
                <button
                    onClick={onClick}
                    onDoubleClick={onDoubleClick}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onRename?.();
                        }

                    }}
                    className={cn(
                        "group flex items-center gap-1 w-full h-[22px] hover:bg-accent/30 outline-none focus:ring-1 focus:ring-inset focus:ring-ring",
                        isActive && "bg-accent/30",
                    )}
                    style={{ paddingLeft: getItemPadding(level, item.type === "file") }}
                >
                    {children}
                </button>
            </ContextMenuTrigger>

            <ContextMenuContent
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="w-64"
            >
                {item.type === "folder" && (
                    <>
                        <ContextMenuItem onClick={onCreateFile} className="text-sm">
                            New File...
                        </ContextMenuItem>
                        <ContextMenuItem onClick={onCreateFolder} className="text-sm">
                            New Folder...
                        </ContextMenuItem>



                        <ContextMenuSeparator />
                    </>
                )}

                <ContextMenuItem onClick={onRename} className="text-sm">
                    Rename
                    <ContextMenuShortcut> Enter </ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={onDelete} className="text-sm">
                    Delete Permanently
                    <ContextMenuShortcut> ⌘ Backspace </ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )

}

