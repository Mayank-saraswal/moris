import { WebContainerProcess } from "@webcontainer/api";
import { create } from "zustand";

export interface TerminalInstance {
    id: string;
    title: string;
    process: WebContainerProcess | null;
    isRunning: boolean;
}

interface TerminalState {
    terminals: Map<string, TerminalInstance>;
    activeTerminalId: string | null;
    nextId: number;

    addTerminal: (process?: WebContainerProcess) => string;
    removeTerminal: (id: string) => void;
    setActiveTerminal: (id: string) => void;
    setProcess: (id: string, process: WebContainerProcess) => void;
    setRunning: (id: string, isRunning: boolean) => void;
    renameTerminal: (id: string, title: string) => void;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
    terminals: new Map(),
    activeTerminalId: null,
    nextId: 1,

    addTerminal: (process) => {
        const { nextId, terminals } = get();
        const id = `terminal-${nextId}`;
        const title = `Terminal ${nextId}`;
        const instance: TerminalInstance = {
            id,
            title,
            process: process ?? null,
            isRunning: true,
        };

        const newTerminals = new Map(terminals);
        newTerminals.set(id, instance);

        set({
            terminals: newTerminals,
            activeTerminalId: id,
            nextId: nextId + 1,
        });

        return id;
    },

    removeTerminal: (id) => {
        const { terminals, activeTerminalId } = get();
        const terminal = terminals.get(id);

        // Kill the process if still running
        if (terminal?.process) {
            terminal.process.kill();
        }

        const newTerminals = new Map(terminals);
        newTerminals.delete(id);

        // If we removed the active tab, switch to the last remaining one
        let newActive = activeTerminalId;
        if (activeTerminalId === id) {
            const keys = Array.from(newTerminals.keys());
            newActive = keys.length > 0 ? keys[keys.length - 1] : null;
        }

        set({ terminals: newTerminals, activeTerminalId: newActive });
    },

    setActiveTerminal: (id) => {
        set({ activeTerminalId: id });
    },

    setProcess: (id, process) => {
        const { terminals } = get();
        const terminal = terminals.get(id);
        if (!terminal) return;

        const newTerminals = new Map(terminals);
        newTerminals.set(id, { ...terminal, process });
        set({ terminals: newTerminals });
    },

    setRunning: (id, isRunning) => {
        const { terminals } = get();
        const terminal = terminals.get(id);
        if (!terminal) return;

        const newTerminals = new Map(terminals);
        newTerminals.set(id, { ...terminal, isRunning });
        set({ terminals: newTerminals });
    },

    renameTerminal: (id, title) => {
        const { terminals } = get();
        const terminal = terminals.get(id);
        if (!terminal) return;

        const newTerminals = new Map(terminals);
        newTerminals.set(id, { ...terminal, title });
        set({ terminals: newTerminals });
    },
}));
