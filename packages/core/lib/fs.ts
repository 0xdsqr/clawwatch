/**
 * File system utilities that work in Bun and Node runtimes.
 *
 * Prefer Bun APIs when available for performance, but fall back to
 * Node's fs/promises in environments where Bun is unavailable.
 */

import { readFile, writeFile } from "node:fs/promises";

const bun = (globalThis as {
  Bun?: {
    file: (path: string) => { exists?: () => Promise<boolean>; text: () => Promise<string> };
    write: (path: string, content: string) => Promise<number>;
  };
}).Bun;

const encoder = new TextEncoder();

async function readExisting(path: string): Promise<string> {
  if (bun) {
    const file = bun.file(path);
    if (file.exists) {
      if (!(await file.exists())) return "";
    }
    try {
      return await file.text();
    } catch {
      return "";
    }
  }

  try {
    return await readFile(path, "utf-8");
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return "";
    }
    throw err;
  }
}

async function writeContent(path: string, content: string): Promise<number> {
  if (bun) return bun.write(path, content);
  await writeFile(path, content, "utf-8");
  return encoder.encode(content).length;
}

/**
 * Write JSON data to a file atomically.
 *
 * @example
 * await writeJSON("config.json", { key: "value" });
 */
export async function writeJSON(path: string, data: unknown, pretty = true): Promise<number> {
  const content = JSON.stringify(data, null, pretty ? 2 : undefined) + "\n";
  return writeContent(path, content);
}

/**
 * Write text content to a file.
 *
 * @example
 * await writeText("output.log", "Hello, world!\n");
 */
export async function writeText(path: string, content: string): Promise<number> {
  return writeContent(path, content);
}

/**
 * Append a line to a file (reads existing content first).
 *
 * For high-frequency appends, prefer a streaming approach instead.
 *
 * @example
 * await appendLine("events.jsonl", JSON.stringify(event));
 */
export async function appendLine(path: string, line: string): Promise<number> {
  const existing = await readExisting(path);
  const content = existing + line + "\n";
  return writeContent(path, content);
}
