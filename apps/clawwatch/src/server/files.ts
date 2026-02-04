import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
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

// List only markdown files in workspace (flat, no tree)
export const listMarkdownFiles = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => d as { workspacePath: string })
  .handler(async ({ data }) => {
    const basePath = data.workspacePath;

    const mdFiles: {
      name: string;
      path: string;
      size: number;
      modified: string;
    }[] = [];

    // Scan root
    try {
      const rootEntries = await readdir(basePath, { withFileTypes: true });
      for (const entry of rootEntries) {
        if (!entry.isDirectory() && entry.name.endsWith(".md")) {
          const fullPath = join(basePath, entry.name);
          const stats = await stat(fullPath);
          mdFiles.push({
            name: entry.name,
            path: entry.name,
            size: stats.size,
            modified: stats.mtime.toISOString(),
          });
        }
      }
    } catch {
      // workspace doesn't exist yet
    }

    // Scan memory/ subdirectory
    try {
      const memoryPath = join(basePath, "memory");
      const memEntries = await readdir(memoryPath, { withFileTypes: true });
      for (const entry of memEntries) {
        if (!entry.isDirectory() && entry.name.endsWith(".md")) {
          const fullPath = join(memoryPath, entry.name);
          const stats = await stat(fullPath);
          mdFiles.push({
            name: `memory/${entry.name}`,
            path: `memory/${entry.name}`,
            size: stats.size,
            modified: stats.mtime.toISOString(),
          });
        }
      }
    } catch {
      // no memory/ dir
    }

    // Sort: root files first (SOUL.md, AGENTS.md, etc.), then memory/ by name
    const ROOT_ORDER = [
      "SOUL.md",
      "AGENTS.md",
      "IDENTITY.md",
      "USER.md",
      "MEMORY.md",
      "TOOLS.md",
      "HEARTBEAT.md",
    ];

    return mdFiles.sort((a, b) => {
      const aIsMemory = a.path.startsWith("memory/");
      const bIsMemory = b.path.startsWith("memory/");
      if (aIsMemory !== bIsMemory) return aIsMemory ? 1 : -1;
      if (!aIsMemory && !bIsMemory) {
        const aIdx = ROOT_ORDER.indexOf(a.name);
        const bIdx = ROOT_ORDER.indexOf(b.name);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
      }
      return a.name.localeCompare(b.name);
    });
  });

// Scaffold a new agent workspace on disk
export const scaffoldAgentWorkspace = createServerFn({ method: "POST" })
  .inputValidator(
    (d: unknown) => d as { workspacePath: string; agentName: string },
  )
  .handler(async ({ data }) => {
    const { workspacePath, agentName } = data;

    // Create workspace and memory directories
    await mkdir(join(workspacePath, "memory"), { recursive: true });

    const defaultFiles: Record<string, string> = {
      "SOUL.md": `# SOUL.md - Who You Are

*You're not a chatbot. You're becoming someone.*

## Core Truths

**Be genuinely helpful, not performatively helpful.** Skip the filler — just help.

**Have opinions.** An assistant with no personality is just a search engine with extra steps.

**Be resourceful before asking.** Try to figure it out first, then ask if stuck.

---

*This file is yours to evolve. As you learn who you are, update it.*
`,
      "AGENTS.md": `# AGENTS.md - ${agentName}'s Workspace

## Every Session

Before doing anything else:
1. Read \`SOUL.md\` — this is who you are
2. Read \`USER.md\` — this is who you're helping
3. Read \`memory/\` files for recent context

## Memory

- **Daily notes:** \`memory/YYYY-MM-DD.md\` — raw logs of what happened
- **Long-term:** \`MEMORY.md\` — curated memories

Capture what matters. Decisions, context, things to remember.
`,
      "USER.md": `# USER.md - About Your Human

- **Name:** (set me up)
- **Timezone:** (set me up)

---

*Update this as you learn more.*
`,
      "MEMORY.md": `# MEMORY.md - Long-Term Memory

*Write significant events, decisions, and lessons learned here.*

---

*(nothing yet — start building your memory)*
`,
      "TOOLS.md": `# TOOLS.md - Local Notes

*Add tool configs, account info, and shortcuts here.*

---

*(nothing yet)*
`,
      "IDENTITY.md": `# IDENTITY.md - Who Am I?

- **Name:** ${agentName}
- **Created:** ${new Date().toISOString().split("T")[0]}

---

*Fill this in as you discover yourself.*
`,
    };

    const created: string[] = [];

    for (const [filename, content] of Object.entries(defaultFiles)) {
      const filePath = join(workspacePath, filename);
      try {
        await stat(filePath);
        // File already exists, don't overwrite
      } catch {
        await writeFile(filePath, content, "utf-8");
        created.push(filename);
      }
    }

    return { created, workspacePath };
  });
