declare const process: {
  argv: string[];
  cwd(): string;
  stdout: { write(text: string): void };
  stderr: { write(text: string): void };
  exitCode?: number;
};

declare module "node:assert/strict" {
  const assert: {
    equal(actual: unknown, expected: unknown, message?: string): void;
  };
  export default assert;
}

declare module "node:test" {
  export default function test(name: string, fn: () => void | Promise<void>): void;
}

declare module "node:fs" {
  export const promises: {
    stat(path: string): Promise<{
      isFile(): boolean;
      isDirectory(): boolean;
    }>;
    readFile(path: string, encoding: "utf8"): Promise<string>;
    readdir(path: string, options: { withFileTypes: true }): Promise<Array<{
      name: string;
      isDirectory(): boolean;
      isFile(): boolean;
    }>>;
  };
}

declare module "node:path" {
  const path: {
    resolve(...parts: string[]): string;
    join(...parts: string[]): string;
    extname(filePath: string): string;
    relative(from: string, to: string): string;
    isAbsolute(filePath: string): boolean;
    sep: string;
  };
  export default path;
}
