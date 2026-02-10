
import { cn } from "@/lib/utils";
import chevronRightIcon from "lucide-react";
import {FileIcon} from "@react-symbols/icons/utils";
import {FolderIcon} from "@react-symbols/icons/utils";

import { useCreateFile , useCreateFolder, useFolderContents } from "../../hooks/use-files";
import { getItemPadding } from "./constants";
import { LoadingRow } from "./loading-row";
import { CreateInput } from "./create-input";

import { Id , Doc } from "../../../../convex/_generated/dataModel";


export const Tree = ({
    item,
    level = 0,
    projectId
}: {
    item: Doc<"files">;
    level: number;
    projectId: Id<"projects">;
})=>{
    
}