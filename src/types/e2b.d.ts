declare module "e2b" {
    export class Sandbox {
        static create(options?: { timeoutMs?: number }): Promise<Sandbox>;
        commands: {
            run(command: string): Promise<{
                stdout: string;
                stderr: string;
                exitCode: number;
            }>;
        };
        files: {
            write(path: string, content: string): Promise<void>;
        };
        kill(): Promise<void>;
    }
}
