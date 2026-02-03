import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createServerFn } from "@tanstack/react-start";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".output",
  ".cache",
  ".bun",
  ".clawdbot",
  "dist",
  ".vinxi",
  ".next",
  "__pycache__",
]);

function assertSafePath(fullPath: string, basePath: string): void {
  const resolvedFull = resolve(fullPath);
  const resolvedBase = resolve(basePath);
  if (!resolvedFull.startsWith(resolvedBase)) {
    throw new Error("Path traversal not allowed");
  }
}

// List files in workspace directory
export const listFiles = createServerFn({ method: "GET" })
  .inputValidator(
    (d: unknown) => d as { workspacePath: string; subPath?: string },
  )
  .handler(async ({ data }) => {
    const basePath = data.workspacePath;
    const dirPath = data.subPath ? join(basePath, data.subPath) : basePath;

    assertSafePath(dirPath, basePath);

    const entries = await readdir(dirPath, { withFileTypes: true });

    const filtered = entries.filter((e) => !IGNORED_DIRS.has(e.name));

    return filtered
      .map((entry) => ({
        name: entry.name,
        path: data.subPath ? join(data.subPath, entry.name) : entry.name,
        isDirectory: entry.isDirectory(),
      }))
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  });

// Read file contents
export const readFileContents = createServerFn({ method: "GET" })
  .inputValidator(
    (d: unknown) => d as { workspacePath: string; filePath: string },
  )
  .handler(async ({ data }) => {
    const fullPath = join(data.workspacePath, data.filePath);
    assertSafePath(fullPath, data.workspacePath);

    const stats = await stat(fullPath);
    if (stats.size > 1024 * 1024) {
      throw new Error("File too large to display (>1MB)");
    }

    const content = await readFile(fullPath, "utf-8");
    return {
      content,
      size: stats.size,
      modified: stats.mtime.toISOString(),
    };
  });

// Write file contents
export const writeFileContents = createServerFn({ method: "POST" })
  .inputValidator(
    (d: unknown) =>
      d as { workspacePath: string; filePath: string; content: string },
  )
  .handler(async ({ data }) => {
    const fullPath = join(data.workspacePath, data.filePath);
    assertSafePath(fullPath, data.workspacePath);

    await writeFile(fullPath, data.content, "utf-8");
    return { success: true };
  });
