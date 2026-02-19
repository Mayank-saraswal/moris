"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import type { WebContainerProcess } from "@webcontainer/api";

import "@xterm/xterm/css/xterm.css";

interface InteractiveTerminalProps {
    process: WebContainerProcess | null;
    onProcessExit?: (exitCode: number) => void;
}

export const InteractiveTerminal = ({ process, onProcessExit }: InteractiveTerminalProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);
    const outputReaderRef = useRef<ReadableStreamDefaultReader<string> | null>(null);

    // Initialize xterm
    useEffect(() => {
        if (!containerRef.current || terminalRef.current) return;

        const terminal = new Terminal({
            convertEol: true,
            disableStdin: false,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
            theme: {
                background: "#0a0a0f",
                foreground: "#d4d4d8",
                cursor: "#a78bfa",
                cursorAccent: "#0a0a0f",
                selectionBackground: "#a78bfa33",
                black: "#18181b",
                red: "#f87171",
                green: "#4ade80",
                yellow: "#facc15",
                blue: "#60a5fa",
                magenta: "#c084fc",
                cyan: "#22d3ee",
                white: "#e4e4e7",
                brightBlack: "#3f3f46",
                brightRed: "#fca5a5",
                brightGreen: "#86efac",
                brightYellow: "#fde68a",
                brightBlue: "#93c5fd",
                brightMagenta: "#d8b4fe",
                brightCyan: "#67e8f9",
                brightWhite: "#fafafa",
            },
            cursorBlink: true,
            cursorStyle: "bar",
            scrollback: 5000,
            allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.open(containerRef.current);

        terminalRef.current = terminal;
        fitAddonRef.current = fitAddon;

        requestAnimationFrame(() => fitAddon.fit());

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => fitAddon.fit());
        });
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            terminal.dispose();
            terminalRef.current = null;
            fitAddonRef.current = null;
        };
    }, []);

    // Connect xterm to the WebContainer process
    useEffect(() => {
        const terminal = terminalRef.current;
        if (!terminal || !process) return;

        // Write user input to the process stdin
        const writer = process.input.getWriter();
        writerRef.current = writer;

        const onDataDisposable = terminal.onData((data) => {
            writer.write(data);
        });

        // Pipe process output to xterm
        const reader = process.output.getReader();
        outputReaderRef.current = reader;

        let cancelled = false;
        const readOutput = async () => {
            try {
                while (!cancelled) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    if (value) terminal.write(value);
                }
            } catch {
                // Stream closed or cancelled — expected on cleanup
            }
        };
        readOutput();

        // Listen for process exit
        process.exit.then((exitCode) => {
            if (!cancelled) {
                terminal.write(`\r\n\x1b[90m[Process exited with code ${exitCode}]\x1b[0m\r\n`);
                onProcessExit?.(exitCode);
            }
        });

        return () => {
            cancelled = true;
            onDataDisposable.dispose();
            reader.releaseLock();
            writer.releaseLock();
            writerRef.current = null;
            outputReaderRef.current = null;
        };
    }, [process, onProcessExit]);

    return (
        <div
            ref={containerRef}
            className="flex-1 min-h-0 px-2 py-1 [&_.xterm]:h-full! [&_.xterm-viewport]:h-full! [&_.xterm-screen]:h-full!"
            style={{ backgroundColor: "#0a0a0f" }}
        />
    );
};
