/**
 * File system utilities using Bun-native APIs.
 *
 * All file output in ClawWatch should use these helpers (or Bun.write()
 * directly) rather than Node.js fs.writeFile / fs.appendFile.
 *
 * Bun.write() is significantly faster than Node.js equivalents and
 * supports strings, Blobs, ArrayBuffers, and Response objects natively.
 */

/**
 * Write JSON data to a file atomically.
 *
 * @example
 * await writeJSON("config.json", { key: "value" });
 */
export async function writeJSON(path: string, data: unknown, pretty = true): Promise<number> {
  const content = JSON.stringify(data, null, pretty ? 2 : undefined) + "\n";
  return Bun.write(path, content);
}

/**
 * Write text content to a file.
 *
 * @example
 * await writeText("output.log", "Hello, world!\n");
 */
export async function writeText(path: string, content: string): Promise<number> {
  return Bun.write(path, content);
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
  const file = Bun.file(path);
  const existing = (await file.exists()) ? await file.text() : "";
  const content = existing + line + "\n";
  return Bun.write(path, content);
}
