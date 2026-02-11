
import { ChevronRightIcon } from "lucide-react";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { useState, useRef } from "react";
import { getItemPadding } from "./constants";
import { cn } from "@/lib/utils";


export const RenameInput = ({
    type,
    level,
    defaultValue,
    isOpen,
    onCancel,
    onSubmit
}: {
    type: "file" | "folder";
    level: number;
    defaultValue: string;
    isOpen?: boolean;
    onCancel: () => void;
    onSubmit: (name: string) => void;
}) => {


    const [value, setValue] = useState(defaultValue);
    const handleSubmit = () => {
        const trimmedValue = value.trim() || defaultValue;
        if (trimmedValue) {
            onSubmit(trimmedValue);
        }

    }
    return (
        <div className="w-full flex items-center gap-1 h-5.5 bg-accent/30"
            style={{
                paddingLeft: getItemPadding(level, type === "file")
            }}
        >
            <div className="size-4 shrink-0 text-muted">
                {type === "folder" && (
                    <ChevronRightIcon className={cn("size-4 shrink-0 text-muted-foreground", isOpen && "rotate-90")} />
                )}
                {type === "file" && (
                    <FileIcon fileName={value} autoAssign className="size-4 " />
                )}
                {type === "folder" && (
                    <FolderIcon folderName={value} className="size-4 " />
                )}
            </div>
            <input

                autoFocus
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="flex bg-transparent text-sm outline-none focus:ring-1 focus:ring-inset focus:ring-ring"
            onBlur={handleSubmit}
            onKeyDown={(e)=>{
                if(e.key === "Enter"){
                        handleSubmit();
                    }
                if(e.key === "Escape"){
                        onCancel();
                    }
                }}

            onFocus={(e)=>{
                if(type === "folder"){
                        e.currentTarget.select();
                    }
                    else {
                        const value = e.currentTarget.value;
                        const lastDotIndex = value.lastIndexOf(".");
                        if (lastDotIndex > 0) {
                            e.currentTarget.setSelectionRange(0, lastDotIndex);
                        }
                        else {
                            e.currentTarget.select();
                        }
                    }
                }}
            />
        </div>
    )
}