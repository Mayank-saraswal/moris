"use client";

import { useCallback, useEffect, useRef } from "react";
import { PlusIcon, XIcon, TerminalSquareIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTerminalStore } from "../store/terminal-store";
import { TerminalTab } from "./terminal-tab";
import { spawnShell } from "../utils/spawn-shell";

export const TerminalPanel = () => {
    const terminals = useTerminalStore((s) => s.terminals);
    const activeTerminalId = useTerminalStore((s) => s.activeTerminalId);
    const addTerminal = useTerminalStore((s) => s.addTerminal);
    const removeTerminal = useTerminalStore((s) => s.removeTerminal);
    const setActiveTerminal = useTerminalStore((s) => s.setActiveTerminal);
    const setProcess = useTerminalStore((s) => s.setProcess);
    const setRunning = useTerminalStore((s) => s.setRunning);

    const hasInitialized = useRef(false);

    // Spawn default terminal on first mount
    useEffect(() => {
        if (hasInitialized.current || terminals.size > 0) return;
        hasInitialized.current = true;
        handleNewTerminal();
    }, []);

    const handleNewTerminal = useCallback(async () => {
        const id = addTerminal();
        try {
            const process = await spawnShell();
            setProcess(id, process);
        } catch (error) {
            console.error("Failed to spawn shell:", error);
        }
    }, [addTerminal, setProcess]);

    const handleCloseTerminal = useCallback(
        (e: React.MouseEvent, id: string) => {
            e.stopPropagation();
            removeTerminal(id);
        },
        [removeTerminal]
    );

    const handleProcessExit = useCallback(
        (id: string) => {
            setRunning(id, false);
        },
        [setRunning]
    );

    const terminalEntries = Array.from(terminals.entries());
    const activeTerminal = activeTerminalId
        ? terminals.get(activeTerminalId)
        : null;

    return (
        <div className="h-full flex flex-col bg-background border-t">
            {/* Tab bar */}
            <div className="h-8 flex items-center shrink-0 bg-sidebar border-b border-border/50 overflow-x-auto">
                {terminalEntries.map(([id, terminal]) => (
                    <button
                        key={id}
                        onClick={() => setActiveTerminal(id)}
                        className={cn(
                            "group flex items-center gap-1.5 h-full px-3 text-xs border-r border-border/30 transition-colors cursor-pointer",
                            "hover:bg-accent/30",
                            id === activeTerminalId
                                ? "bg-background text-foreground"
                                : "text-muted-foreground"
                        )}
                    >
                        <TerminalSquareIcon className="size-3 shrink-0" />
                        <span className="truncate max-w-[100px]">
                            {terminal.title}
                        </span>
                        {!terminal.isRunning && (
                            <span className="size-1.5 rounded-full bg-zinc-500 shrink-0" />
                        )}
                        <span
                            onClick={(e) => handleCloseTerminal(e, id)}
                            className="size-4 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity shrink-0"
                        >
                            <XIcon className="size-3" />
                        </span>
                    </button>
                ))}

                {/* New terminal button */}
                <button
                    onClick={handleNewTerminal}
                    className="flex items-center justify-center size-8 text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors cursor-pointer"
                    title="New Terminal"
                >
                    <PlusIcon className="size-3.5" />
                </button>
            </div>

            {/* Terminal content */}
            <div className="flex-1 min-h-0 relative">
                {terminalEntries.map(([id, terminal]) => (
                    <div
                        key={id}
                        className={cn(
                            "absolute inset-0",
                            id === activeTerminalId ? "visible" : "invisible"
                        )}
                    >
                        <TerminalTab
                            id={id}
                            process={terminal.process}
                            onExit={handleProcessExit}
                        />
                    </div>
                ))}

                {terminalEntries.length === 0 && (
                    <div className="size-full flex items-center justify-center text-muted-foreground">
                        <button
                            onClick={handleNewTerminal}
                            className="flex items-center gap-2 text-sm hover:text-foreground transition-colors cursor-pointer"
                        >
                            <PlusIcon className="size-4" />
                            New Terminal
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
