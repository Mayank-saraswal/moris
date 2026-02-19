"use client";

import { useCallback } from "react";
import type { WebContainerProcess } from "@webcontainer/api";
import { InteractiveTerminal } from "./interactive-terminal";

interface TerminalTabProps {
    id: string;
    process: WebContainerProcess | null;
    onExit: (id: string) => void;
}

export const TerminalTab = ({ id, process, onExit }: TerminalTabProps) => {
    const handleExit = useCallback(
        (_code: number) => {
            onExit(id);
        },
        [id, onExit]
    );

    return <InteractiveTerminal process={process} onProcessExit={handleExit} />;
};
