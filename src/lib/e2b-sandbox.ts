import { Sandbox } from "e2b";

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Create a new E2B sandbox for code execution
 * Used for Pro users to get faster execution and multi-language support
 */
export async function createSandbox(
    timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Sandbox> {
    const apiKey = process.env.E2B_API_KEY;
    if (!apiKey) {
        throw new Error("Missing E2B_API_KEY environment variable");
    }

    return Sandbox.create({
        timeoutMs,
    });
}

/**
 * Run a command in an E2B sandbox and return output
 */
export async function runInSandbox(
    command: string,
    sandbox?: Sandbox
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const ownSandbox = !sandbox;
    const sb = sandbox ?? (await createSandbox());

    try {
        const result = await sb.commands.run(command);
        return {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
        };
    } finally {
        if (ownSandbox) {
            await sb.kill();
        }
    }
}

/**
 * Write files to sandbox, install deps, and run
 * This is the main entry for project preview
 */
export async function runProject(
    files: Record<string, string>,
    entryCommand: string,
    installCommand?: string
): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
    sandbox: Sandbox;
}> {
    const sandbox = await createSandbox();

    try {
        // Write all project files
        for (const [path, content] of Object.entries(files)) {
            await sandbox.files.write(`/code/${path}`, content);
        }

        // Install dependencies if specified
        if (installCommand) {
            await sandbox.commands.run(`cd /code && ${installCommand}`);
        }

        // Run the project
        const result = await sandbox.commands.run(
            `cd /code && ${entryCommand}`
        );

        return {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            sandbox, // Keep alive for further interaction
        };
    } catch (error) {
        await sandbox.kill();
        throw error;
    }
}

/**
 * Detect language and return appropriate run commands
 */
export function getLanguageConfig(files: Record<string, string>): {
    language: string;
    installCommand?: string;
    runCommand: string;
} {
    const filenames = Object.keys(files);

    if (filenames.some((f) => f === "package.json")) {
        return {
            language: "javascript",
            installCommand: "npm install",
            runCommand: "npm run dev || npm start",
        };
    }

    if (filenames.some((f) => f.endsWith(".py") || f === "requirements.txt")) {
        return {
            language: "python",
            installCommand: filenames.includes("requirements.txt")
                ? "pip install -r requirements.txt"
                : undefined,
            runCommand: `python3 ${filenames.find((f) => f.endsWith(".py")) ?? "main.py"}`,
        };
    }

    if (filenames.some((f) => f === "Cargo.toml")) {
        return {
            language: "rust",
            runCommand: "cargo run",
        };
    }

    if (filenames.some((f) => f === "go.mod")) {
        return {
            language: "go",
            runCommand: "go run .",
        };
    }

    if (filenames.some((f) => f.endsWith(".java"))) {
        const mainFile = filenames.find((f) => f.endsWith(".java")) ?? "Main.java";
        return {
            language: "java",
            runCommand: `javac ${mainFile} && java ${mainFile.replace(".java", "")}`,
        };
    }

    // Default to Node.js
    return {
        language: "javascript",
        runCommand: "node index.js",
    };
}
