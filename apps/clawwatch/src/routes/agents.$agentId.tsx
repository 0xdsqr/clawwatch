import { Badge } from "@clawwatch/ui/components/badge";
import { Button } from "@clawwatch/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clawwatch/ui/components/card";
import { Input } from "@clawwatch/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@clawwatch/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@clawwatch/ui/components/tabs";
import { cn } from "@clawwatch/ui/lib/utils";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  DollarSign,
  Edit3,
  File,
  FileCode,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
  Hash,
  Loader2,
  Pencil,
  Save,
  Search,
  Settings,
  X,
  Zap,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { CostChart } from "@/components/cost-chart";
import { StatCard } from "@/components/stat-card";
import { formatCost, formatTokens, statusColor, timeAgo } from "@/lib/utils";
import { listFiles, readFileContents, writeFileContents } from "@/server/files";
import type { Session } from "@/types";

export const Route = createFileRoute("/agents/$agentId")({
  component: AgentDetailPage,
});

type SortField = "lastActivity" | "estimatedCost" | "totalTokens";
type SortDir = "asc" | "desc";

// ─── File icon helper ───

function fileIcon(name: string, isDirectory: boolean) {
  if (isDirectory) return <Folder className="h-4 w-4 text-blue-400" />;
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "md":
      return <FileText className="h-4 w-4 text-emerald-400" />;
    case "json":
      return <FileJson className="h-4 w-4 text-amber-400" />;
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
      return <FileCode className="h-4 w-4 text-blue-400" />;
    case "yaml":
    case "yml":
    case "toml":
      return <Settings className="h-4 w-4 text-purple-400" />;
    default:
      return <File className="h-4 w-4 text-muted-foreground" />;
  }
}

// ─── File tree types ───

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface TreeNode extends FileEntry {
  children?: TreeNode[];
  loaded?: boolean;
  expanded?: boolean;
}

// ─── File Tree Item ───

function FileTreeItem({
  node,
  depth,
  selectedPath,
  onSelect,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
}) {
  const isSelected = selectedPath === node.path;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (node.isDirectory) {
            onToggle(node.path);
          } else {
            onSelect(node.path);
          }
        }}
        className={cn(
          "w-full flex items-center gap-1.5 px-2 py-1 text-sm rounded-md transition-colors text-left",
          isSelected
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted/50 text-foreground",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.isDirectory ? (
          node.expanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {fileIcon(node.name, node.isDirectory)}
        <span className="truncate">{node.name}</span>
      </button>
      {node.isDirectory &&
        node.expanded &&
        node.children &&
        node.children.map((child) => (
          <FileTreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

// ─── Files Tab ───

function FilesTab({
  agentId,
  agentName,
  workspacePath,
}: {
  agentId: Id<"agents">;
  agentName: string;
  workspacePath: string | undefined;
}) {
  const updateWorkspacePath = useMutation(api.agents.updateWorkspacePath);
  const setDefaultPaths = useMutation(api.agents.setDefaultPaths);

  const [pathInput, setPathInput] = useState(() => workspacePath ?? `/home/moltbot/${agentName}`);
  const [saving, setSaving] = useState(false);

  // File tree state
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  // File viewer state
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{
    size: number;
    modified: string;
  } | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Editor state
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [fileSaving, setFileSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Set defaults on mount if no workspace path
  useEffect(() => {
    if (!workspacePath) {
      setDefaultPaths({});
    }
  }, [workspacePath, setDefaultPaths]);

  // Load root directory when workspace path changes
  useEffect(() => {
    if (!workspacePath) return;
    loadDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspacePath]);

  const loadDirectory = useCallback(
    async (subPath?: string) => {
      if (!workspacePath) return;
      if (!subPath) setTreeLoading(true);
      setTreeError(null);
      try {
        const entries = await listFiles({
          data: { workspacePath, subPath },
        });
        if (!subPath) {
          // Root — set top-level tree
          setTree(
            entries.map((e: FileEntry) => ({
              ...e,
              children: e.isDirectory ? [] : undefined,
              loaded: false,
              expanded: false,
            })),
          );
        } else {
          // Sub-directory — update tree in place
          setTree((prev) => updateTreeNode(prev, subPath, entries));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load files";
        if (!subPath) setTreeError(msg);
      } finally {
        if (!subPath) setTreeLoading(false);
      }
    },
    [workspacePath],
  );

  const updateTreeNode = (
    nodes: TreeNode[],
    targetPath: string,
    children: FileEntry[],
  ): TreeNode[] => {
    return nodes.map((node) => {
      if (node.path === targetPath) {
        return {
          ...node,
          expanded: true,
          loaded: true,
          children: children.map((e) => ({
            ...e,
            children: e.isDirectory ? [] : undefined,
            loaded: false,
            expanded: false,
          })),
        };
      }
      if (node.children && targetPath.startsWith(`${node.path}/`)) {
        return {
          ...node,
          children: updateTreeNode(node.children, targetPath, children),
        };
      }
      return node;
    });
  };

  const toggleDir = useCallback(
    (path: string) => {
      const findNode = (nodes: TreeNode[]): TreeNode | undefined => {
        for (const n of nodes) {
          if (n.path === path) return n;
          if (n.children) {
            const found = findNode(n.children);
            if (found) return found;
          }
        }
        return undefined;
      };

      const node = findNode(tree);
      if (!node) return;

      if (node.expanded) {
        // Collapse
        setTree((prev) => collapseNode(prev, path));
      } else if (node.loaded) {
        // Expand (already loaded)
        setTree((prev) => expandNode(prev, path));
      } else {
        // Load children
        loadDirectory(path);
      }
    },
    [tree, loadDirectory],
  );

  const collapseNode = (nodes: TreeNode[], path: string): TreeNode[] =>
    nodes.map((n) =>
      n.path === path
        ? { ...n, expanded: false }
        : n.children
          ? { ...n, children: collapseNode(n.children, path) }
          : n,
    );

  const expandNode = (nodes: TreeNode[], path: string): TreeNode[] =>
    nodes.map((n) =>
      n.path === path
        ? { ...n, expanded: true }
        : n.children
          ? { ...n, children: expandNode(n.children, path) }
          : n,
    );

  const selectFile = useCallback(
    async (filePath: string) => {
      if (!workspacePath) return;
      setSelectedFile(filePath);
      setFileLoading(true);
      setFileError(null);
      setEditing(false);
      setSaveSuccess(false);
      try {
        const result = await readFileContents({
          data: { workspacePath, filePath },
        });
        setFileContent(result.content);
        setFileMeta({ size: result.size, modified: result.modified });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to read file";
        setFileError(msg);
        setFileContent(null);
        setFileMeta(null);
      } finally {
        setFileLoading(false);
      }
    },
    [workspacePath],
  );

  const startEditing = useCallback(() => {
    if (fileContent !== null) {
      setEditContent(fileContent);
      setEditing(true);
      setSaveSuccess(false);
    }
  }, [fileContent]);

  const saveFile = useCallback(async () => {
    if (!workspacePath || !selectedFile) return;
    setFileSaving(true);
    setSaveSuccess(false);
    try {
      await writeFileContents({
        data: { workspacePath, filePath: selectedFile, content: editContent },
      });
      setFileContent(editContent);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      setFileError(msg);
    } finally {
      setFileSaving(false);
    }
  }, [workspacePath, selectedFile, editContent]);

  const handleSavePath = useCallback(async () => {
    setSaving(true);
    try {
      await updateWorkspacePath({ agentId, workspacePath: pathInput });
    } finally {
      setSaving(false);
    }
  }, [agentId, pathInput, updateWorkspacePath]);

  // ─── No workspace path — prompt to set one ───
  if (!workspacePath) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="max-w-md mx-auto text-center space-y-4">
            <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-muted flex items-center justify-center">
              <FolderOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Set Workspace Path</h3>
            <p className="text-sm text-muted-foreground">
              Configure the file system path for this agent&apos;s workspace to browse and edit
              files.
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={pathInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPathInput(e.target.value)}
                placeholder="/home/moltbot/agent-name"
                className="font-mono text-sm"
              />
              <Button onClick={handleSavePath} disabled={saving} size="sm">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── File browser ───
  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 min-h-[500px]">
      {/* Left panel — File Tree */}
      <Card className="overflow-hidden">
        <CardHeader className="py-3 px-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Files</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => loadDirectory()}
              title="Refresh"
            >
              <Loader2 className={cn("h-3.5 w-3.5", treeLoading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-1 overflow-y-auto max-h-[600px]">
          {treeLoading && tree.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : treeError ? (
            <div className="p-3 text-sm text-destructive">{treeError}</div>
          ) : tree.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">No files found</div>
          ) : (
            <div className="space-y-0.5 py-1">
              {tree.map((node) => (
                <FileTreeItem
                  key={node.path}
                  node={node}
                  depth={0}
                  selectedPath={selectedFile}
                  onSelect={selectFile}
                  onToggle={toggleDir}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right panel — File Viewer/Editor */}
      <Card className="overflow-hidden">
        {!selectedFile ? (
          <CardContent className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select a file to view</p>
              <p className="text-xs mt-1 opacity-60">Browse the tree on the left</p>
            </div>
          </CardContent>
        ) : (
          <>
            {/* File header */}
            <CardHeader className="py-3 px-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {fileIcon(selectedFile.split("/").pop() ?? "", false)}
                  <span className="text-sm font-mono truncate">{selectedFile}</span>
                  {fileMeta && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {fileMeta.size < 1024
                        ? `${fileMeta.size}B`
                        : `${(fileMeta.size / 1024).toFixed(1)}KB`}
                      {" · "}
                      {new Date(fileMeta.modified).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {saveSuccess && (
                    <span className="text-xs text-emerald-500 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Saved
                    </span>
                  )}
                  {editing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7"
                        onClick={() => setEditing(false)}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" className="h-7" onClick={saveFile} disabled={fileSaving}>
                        {fileSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <Save className="h-3.5 w-3.5 mr-1" />
                        )}
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      onClick={startEditing}
                      disabled={fileContent === null}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* File content */}
            <CardContent className="p-0 overflow-auto max-h-[550px]">
              {fileLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : fileError ? (
                <div className="p-4 text-sm text-destructive">{fileError}</div>
              ) : editing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-[500px] p-4 font-mono text-sm bg-transparent border-0 outline-none resize-none"
                  spellCheck={false}
                />
              ) : fileContent !== null ? (
                <MarkdownRenderer content={fileContent} isMarkdown={selectedFile.endsWith(".md")} />
              ) : null}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Basic markdown-aware renderer ───

function MarkdownRenderer({ content, isMarkdown }: { content: string; isMarkdown: boolean }) {
  if (!isMarkdown) {
    return (
      <pre className="p-4 font-mono text-sm whitespace-pre-wrap break-words leading-relaxed">
        {content}
      </pre>
    );
  }

  // Basic markdown highlighting
  const lines = content.split("\n");
  let inCodeBlock = false;

  return (
    <div className="p-4 font-mono text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("```")) {
          inCodeBlock = !inCodeBlock;
          return (
            <div key={i} className="text-muted-foreground text-xs">
              {line}
            </div>
          );
        }

        if (inCodeBlock) {
          return (
            <div key={i} className="bg-muted/40 px-2 -mx-2 text-emerald-400/80">
              {line || "\u00A0"}
            </div>
          );
        }

        if (line.startsWith("# ")) {
          return (
            <div key={i} className="font-bold text-base mt-4 mb-1">
              {line.slice(2)}
            </div>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <div key={i} className="font-bold text-sm mt-3 mb-1">
              {line.slice(3)}
            </div>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <div key={i} className="font-semibold text-sm mt-2 mb-0.5">
              {line.slice(4)}
            </div>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} className="pl-4">
              <span className="text-muted-foreground">•</span> {line.slice(2)}
            </div>
          );
        }
        if (line.startsWith("> ")) {
          return (
            <div
              key={i}
              className="border-l-2 border-muted-foreground/30 pl-3 text-muted-foreground italic"
            >
              {line.slice(2)}
            </div>
          );
        }

        return (
          <div key={i} className="whitespace-pre-wrap">
            {line || "\u00A0"}
          </div>
        );
      })}
    </div>
  );
}

// ─── Configuration Card (for Overview tab) ───

function ConfigurationCard({
  agentId,
  agent,
}: {
  agentId: Id<"agents">;
  agent: {
    gatewayUrl: string;
    config?: { model?: string; channel?: string };
    workspacePath?: string;
  };
}) {
  const updateWorkspacePath = useMutation(api.agents.updateWorkspacePath);
  const [editingPath, setEditingPath] = useState(false);
  const [pathValue, setPathValue] = useState(agent.workspacePath ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateWorkspacePath({ agentId, workspacePath: pathValue });
      setEditingPath(false);
    } finally {
      setSaving(false);
    }
  }, [agentId, pathValue, updateWorkspacePath]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Workspace Path */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Workspace Path</p>
            {editingPath ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Input
                  value={pathValue}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPathValue(e.target.value)}
                  className="h-7 text-xs font-mono"
                />
                <Button size="sm" className="h-7 px-2" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setEditingPath(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-mono truncate">{agent.workspacePath || "Not set"}</p>
                <button
                  type="button"
                  onClick={() => {
                    setPathValue(agent.workspacePath ?? "");
                    setEditingPath(true);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Gateway URL */}
        <div>
          <p className="text-xs text-muted-foreground">Gateway URL</p>
          <p className="text-sm font-mono truncate">{agent.gatewayUrl}</p>
        </div>

        {/* Model */}
        {agent.config?.model && (
          <div>
            <p className="text-xs text-muted-foreground">Model</p>
            <p className="text-sm">{agent.config.model}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───

function AgentDetailPage() {
  const { agentId } = Route.useParams();
  const navigate = useNavigate();

  // Session filters
  const [sessionSearch, setSessionSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("lastActivity");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const health = useQuery(api.agents.healthSummary, {
    agentId: agentId as Id<"agents">,
  });

  const agentCostSummary = useQuery(api.costs.summary, {
    agentId: agentId as Id<"agents">,
  });

  const agentTimeSeries = useQuery(api.costs.timeSeries, {
    hours: 24,
    agentId: agentId as Id<"agents">,
  });

  const sessions = useQuery(api.sessions.byAgent, {
    agentId: agentId as Id<"agents">,
    limit: 100,
  });

  const formattedAgentCost = useMemo(
    () => formatCost(agentCostSummary?.today.cost ?? 0),
    [agentCostSummary?.today.cost],
  );

  const formattedAgentTokens = useMemo(
    () =>
      formatTokens(
        (agentCostSummary?.today.inputTokens ?? 0) + (agentCostSummary?.today.outputTokens ?? 0),
      ),
    [agentCostSummary?.today.inputTokens, agentCostSummary?.today.outputTokens],
  );

  // Derive unique kinds/channels for filters
  const sessionKinds = useMemo(() => {
    if (!sessions) return [];
    const kinds = new Set(sessions.map((s: Session) => s.kind));
    return Array.from(kinds).sort();
  }, [sessions]);

  // Filtered + sorted sessions
  const filteredSessions = useMemo(() => {
    if (!sessions) return undefined;
    let result = sessions.filter((session: Session) => {
      const matchesSearch =
        !sessionSearch ||
        session.sessionKey.toLowerCase().includes(sessionSearch.toLowerCase()) ||
        session.channel?.toLowerCase().includes(sessionSearch.toLowerCase()) ||
        session.kind.toLowerCase().includes(sessionSearch.toLowerCase());
      const matchesKind = kindFilter === "all" || session.kind === kindFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && session.isActive) ||
        (statusFilter === "completed" && !session.isActive);
      return matchesSearch && matchesKind && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number);
    });

    return result;
  }, [sessions, sessionSearch, kindFilter, statusFilter, sortField, sortDir]);

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "desc" ? "asc" : "desc"));
      } else {
        setSortField(field);
        setSortDir("desc");
      }
    },
    [sortField],
  );

  if (!health) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const { agent, activeSessions, errorCount, isHealthy } = health;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "desc" ? (
      <ChevronDown className="h-3 w-3 inline ml-0.5" />
    ) : (
      <ChevronUp className="h-3 w-3 inline ml-0.5" />
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/agents" })}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3 flex-1">
          <Circle className={cn("h-3 w-3 fill-current", statusColor(agent.status))} />
          <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>

          {agent.config?.model && <Badge variant="secondary">{agent.config.model}</Badge>}

          <Badge variant={isHealthy ? "default" : "destructive"} className="ml-2">
            {isHealthy ? "Healthy" : "Issues Detected"}
          </Badge>

          <span className="text-sm text-muted-foreground ml-auto">
            Last heartbeat {timeAgo(agent.lastHeartbeat)}
          </span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">
            Sessions
            {sessions && (
              <span className="ml-1.5 text-xs text-muted-foreground">({sessions.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        {/* ─── OVERVIEW TAB ─── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Cost Today"
              value={formattedAgentCost}
              change={`${agentCostSummary?.today.requests ?? 0} requests`}
              icon={<DollarSign className="h-5 w-5 text-primary" />}
            />
            <StatCard
              label="Tokens Today"
              value={formattedAgentTokens}
              change="Input + Output"
              icon={<Zap className="h-5 w-5 text-amber-400" />}
            />
            <StatCard
              label="Active Sessions"
              value={activeSessions.toString()}
              change="Currently running"
              icon={<Activity className="h-5 w-5 text-blue-400" />}
            />
            <StatCard
              label="Errors (24h)"
              value={errorCount.toString()}
              change={errorCount === 0 ? "All clear" : "Needs attention"}
              changeType={errorCount === 0 ? "positive" : "negative"}
              icon={
                <AlertTriangle
                  className={cn(
                    "h-5 w-5",
                    errorCount > 0 ? "text-red-400" : "text-muted-foreground",
                  )}
                />
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost — Last 24 Hours</CardTitle>
              <CardDescription>Hourly cost breakdown for this agent</CardDescription>
            </CardHeader>
            <CardContent>
              <CostChart data={agentTimeSeries ?? []} />
            </CardContent>
          </Card>

          {/* Health details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      agent.status === "online" ? "bg-emerald-500/10" : "bg-red-500/10",
                    )}
                  >
                    <Circle className={cn("h-4 w-4 fill-current", statusColor(agent.status))} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                    <p className="text-lg font-semibold capitalize">{agent.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Total Sessions
                    </p>
                    <p className="text-lg font-semibold">{health.totalSessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Cost This Week
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCost(agentCostSummary?.week.cost ?? 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration card */}
          <ConfigurationCard agentId={agentId as Id<"agents">} agent={agent} />
        </TabsContent>

        {/* ─── SESSIONS TAB ─── */}
        <TabsContent value="sessions" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={sessionSearch}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSessionSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Kind filter */}
            <select
              value={kindFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setKindFilter(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm h-9"
            >
              <option value="all">All kinds</option>
              {sessionKinds.map((kind) => (
                <option key={kind as string} value={kind as string}>
                  {String(kind)}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5">
              {(["all", "active", "completed"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    statusFilter === s
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {(sessionSearch || kindFilter !== "all" || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={() => {
                  setSessionSearch("");
                  setKindFilter("all");
                  setStatusFilter("all");
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Sessions table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Session</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("lastActivity")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Last Activity
                        <SortIcon field="lastActivity" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("totalTokens")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Tokens
                        <SortIcon field="totalTokens" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("estimatedCost")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Cost
                        <SortIcon field="estimatedCost" />
                      </button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions === undefined ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-muted rounded animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredSessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        <Activity className="mx-auto mb-2 h-8 w-8 opacity-50" />
                        <p className="text-sm">No sessions found</p>
                        <p className="text-xs mt-1">
                          {sessions && sessions.length > 0
                            ? "Try adjusting your filters"
                            : "Sessions will appear when the agent starts processing requests"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSessions.map((session: Session) => (
                      <SessionRow
                        key={session._id}
                        session={session}
                        isExpanded={expandedSession === session._id}
                        onToggle={() =>
                          setExpandedSession(expandedSession === session._id ? null : session._id)
                        }
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── FILES TAB ─── */}
        <TabsContent value="files" className="space-y-6">
          <FilesTab
            agentId={agentId as Id<"agents">}
            agentName={agent.name}
            workspacePath={agent.workspacePath}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Session Row with expandable detail ───

interface SessionData {
  _id: string;
  sessionKey: string;
  kind: string;
  channel?: string;
  startedAt: number;
  lastActivity: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  messageCount: number;
  isActive: boolean;
}

const SessionRow = memo(function SessionRow({
  session,
  isExpanded,
  onToggle,
}: {
  session: SessionData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const duration = useMemo(() => {
    const ms = (session.isActive ? Date.now() : session.lastActivity) - session.startedAt;
    const mins = Math.floor(ms / 60000);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    return `${mins}m`;
  }, [session.startedAt, session.lastActivity, session.isActive]);

  return (
    <>
      <TableRow
        className={cn("cursor-pointer transition-colors", isExpanded && "bg-muted/30")}
        onClick={onToggle}
      >
        <TableCell className="font-mono text-xs">
          <span title={session.sessionKey}>
            {session.sessionKey.length > 20
              ? `${session.sessionKey.substring(0, 20)}…`
              : session.sessionKey}
          </span>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="text-xs font-normal">
            {session.kind}
          </Badge>
        </TableCell>
        <TableCell className="text-sm">{session.channel || "—"}</TableCell>
        <TableCell className="text-sm">{timeAgo(session.startedAt)}</TableCell>
        <TableCell className="text-sm">{timeAgo(session.lastActivity)}</TableCell>
        <TableCell className="text-sm font-medium">
          {formatTokens(session.totalTokens ?? 0)}
        </TableCell>
        <TableCell className="text-sm font-medium">
          {formatCost(session.estimatedCost ?? 0)}
        </TableCell>
        <TableCell>
          <Badge variant={session.isActive ? "default" : "secondary"}>
            {session.isActive ? "Active" : "Done"}
          </Badge>
        </TableCell>
      </TableRow>

      {/* Expanded detail row */}
      {isExpanded && (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={8} className="p-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4">
              <DetailItem
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Duration"
                value={duration}
              />
              <DetailItem
                icon={<Hash className="h-3.5 w-3.5" />}
                label="Messages"
                value={session.messageCount.toString()}
              />
              <DetailItem
                icon={<Zap className="h-3.5 w-3.5" />}
                label="Input Tokens"
                value={formatTokens(session.inputTokens)}
              />
              <DetailItem
                icon={<Zap className="h-3.5 w-3.5" />}
                label="Output Tokens"
                value={formatTokens(session.outputTokens)}
              />
              <DetailItem
                icon={<DollarSign className="h-3.5 w-3.5" />}
                label="Total Cost"
                value={formatCost(session.estimatedCost)}
              />
              <DetailItem
                icon={<Activity className="h-3.5 w-3.5" />}
                label="Avg Cost/Msg"
                value={
                  session.messageCount > 0
                    ? formatCost(session.estimatedCost / session.messageCount)
                    : "—"
                }
              />
              <DetailItem label="Kind" value={session.kind} />
              <DetailItem label="Channel" value={session.channel || "—"} />
            </div>
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground font-mono break-all">
                Key: {session.sessionKey}
              </p>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
});

function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default AgentDetailPage;
