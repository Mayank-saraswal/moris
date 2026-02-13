import React from "react";
import { FileIcon } from "@react-symbols/icons/utils";


import { useFilePath } from "@/features/projects/hooks/use-files";
import { Id } from "../../../../convex/_generated/dataModel";
import { useEditor } from "../hooks/use-editor";

import { BreadcrumbPage, Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ifError } from "assert";

export const FileBreadcrumbs = ({ projectId }: { projectId: Id<"projects"> }) => {
    const { activeTabId } = useEditor(projectId);
    const filePath = useFilePath(activeTabId);

    if (filePath === undefined || !activeTabId) {
        return (
            <Breadcrumb className="p-2 bg-background pl-4 border-b">
                <BreadcrumbList className="sm:gap-0.5 gap-0.5">

                    <BreadcrumbItem className="text-sm">
                        <BreadcrumbPage>
                            &nbsp;</BreadcrumbPage>
                    </BreadcrumbItem>

                </BreadcrumbList>
            </Breadcrumb>
        );
    }

    return (
        <Breadcrumb className="p-2 bg-background pl-4 border-b">
            <BreadcrumbList className="sm:gap-0.5 gap-0.5">

                {filePath?.map((item, index) => {
                    const isLast = index === filePath.length - 1;
                    return (
                        <React.Fragment key={item._id}>
                            <BreadcrumbItem className="text-sm">
                                {isLast ? (
                                    <BreadcrumbPage className="flex items-center gap-1">
                                        <FileIcon fileName={item.name} autoAssign className="size-4" />
                                        {item.name}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href="#" className="flex items-center gap-1">
                                        <FileIcon fileName={item.name} autoAssign className="size-4" />
                                        {item.name}
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}

                        </React.Fragment>
                    )
                })}

            </BreadcrumbList>
        </Breadcrumb>
    );

};