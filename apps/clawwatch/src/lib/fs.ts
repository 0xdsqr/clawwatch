function getBunRuntime(): {
  file: (path: string) => { text: () => Promise<string> };
  write: (path: string, content: string) => Promise<number> | number;
} {
  const bun = (globalThis as { Bun?: unknown }).Bun;
  if (!bun) {
    throw new Error("Bun runtime is required for server file operations.");
  }
  return bun as {
    file: (path: string) => { text: () => Promise<string> };
    write: (path: string, content: string) => Promise<number> | number;
  };
}

export async function readText(path: string): Promise<string> {
  return await getBunRuntime().file(path).text();
}

export async function writeText(path: string, content: string): Promise<number> {
  return await getBunRuntime().write(path, content);
}
