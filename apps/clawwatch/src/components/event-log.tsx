import { Badge } from "@clawwatch/ui/components/badge";
import { Button } from "@clawwatch/ui/components/button";
import { Input } from "@clawwatch/ui/components/input";
import { Switch } from "@clawwatch/ui/components/switch";
import { cn } from "@clawwatch/ui/lib/utils";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import {
  type Cell,
  type ColumnDef,
  type ColumnFiltersState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type Header,
  type HeaderGroup,
  type Row,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { ChevronDown, ChevronUp, Radio, Search, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── Types ──

interface EventRecord {
  _id: string;
  _creationTime: number;
  agentId: string;
  agentName: string;
  type: string;
  summary: string;
  details?: Record<string, string | number | boolean | null>;
  sessionKey?: string;
  channel?: string;
}

type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

interface EventLogProps {
  agentId?: string;
  sessionKey?: string;
  limit?: number;
  showAgentColumn?: boolean;
}

// ── Helpers ──

const EVENT_TYPE_TO_LEVEL: Record<string, LogLevel> = {
  heartbeat: "DEBUG",
  message_sent: "INFO",
  message_received: "INFO",
  session_started: "INFO",
  session_ended: "INFO",
  tool_call: "INFO",
  alert_fired: "WARNING",
  error: "ERROR",
};

function getLevel(type: string): LogLevel {
  return EVENT_TYPE_TO_LEVEL[type] ?? "INFO";
}

const LEVEL_STYLES: Record<LogLevel, string> = {
  DEBUG: "bg-zinc-500/8 text-zinc-400 border-zinc-500/15",
  INFO: "bg-blue-500/8 text-blue-400 border-blue-500/15",
  WARNING: "bg-amber-500/8 text-amber-400 border-amber-500/15",
  ERROR: "bg-red-500/8 text-red-400 border-red-500/15",
  CRITICAL: "bg-red-600/12 text-red-500 border-red-600/20 font-bold",
};

const LEVEL_DOT: Record<LogLevel, string> = {
  DEBUG: "bg-zinc-400",
  INFO: "bg-blue-400",
  WARNING: "bg-amber-400",
  ERROR: "bg-red-400",
  CRITICAL: "bg-red-500",
};

const TIME_RANGES = [
  { label: "Past hour", value: 60 * 60 * 1000 },
  { label: "Past 6h", value: 6 * 60 * 60 * 1000 },
  { label: "Past 24h", value: 24 * 60 * 60 * 1000 },
  { label: "Past 7d", value: 7 * 24 * 60 * 60 * 1000 },
] as const;

const ALL_LEVELS: LogLevel[] = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatEventType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Column helper ──

const col = createColumnHelper<EventRecord>();

// ── Main Component ──

export const EventLog = memo(function EventLog({
  agentId,
  sessionKey,
  limit = 500,
  showAgentColumn = true,
}: EventLogProps) {
  const rawData = useQuery(
    api.activities.events,
    agentId ? { agentId: agentId as Id<"agents">, limit } : { limit },
  );

  // State
  const [isLive, setIsLive] = useState(true);
  const [singleLine, setSingleLine] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState(TIME_RANGES[0]?.value);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [frozenData, setFrozenData] = useState<EventRecord[] | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Freeze/unfreeze data when live toggles
  useEffect(() => {
    if (!isLive && rawData) {
      setFrozenData([...rawData] as EventRecord[]);
    } else {
      setFrozenData(null);
    }
  }, [isLive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply all client-side filters
  const filteredData = useMemo(() => {
    const source = (isLive ? rawData : frozenData) ?? [];
    const now = Date.now();
    const cutoff = now - timeRange;

    return source.filter((event: EventRecord) => {
      // Time range
      if (event._creationTime < cutoff) return false;

      // Session filter
      if (sessionKey && event.sessionKey !== sessionKey) return false;

      // Level filter
      if (levelFilter !== "all" && getLevel(event.type) !== levelFilter) return false;

      // Agent filter
      if (agentFilter !== "all" && event.agentName !== agentFilter) return false;

      // Type filter
      if (typeFilter !== "all" && event.type !== typeFilter) return false;

      // Global search
      if (globalFilter) {
        const q = globalFilter.toLowerCase();
        return (
          event.summary.toLowerCase().includes(q) ||
          event.agentName.toLowerCase().includes(q) ||
          event.type.toLowerCase().includes(q) ||
          formatTime(event._creationTime).includes(q)
        );
      }
      return true;
    });
  }, [
    rawData,
    frozenData,
    isLive,
    timeRange,
    levelFilter,
    agentFilter,
    typeFilter,
    globalFilter,
    sessionKey,
  ]);

  // Unique agents for dropdown
  const uniqueAgents = useMemo(() => {
    const source = rawData ?? [];
    const names = new Set<string>(source.map((e: EventRecord) => e.agentName));
    return Array.from(names).sort();
  }, [rawData]);

  // Unique types for dropdown
  const uniqueTypes = useMemo(() => {
    const source = rawData ?? [];
    const types = new Set<string>(source.map((e: EventRecord) => e.type));
    return Array.from(types).sort();
  }, [rawData]);

  // Toggle row expansion
  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Define columns
  const columns = useMemo((): ColumnDef<EventRecord, any>[] => {
    const cols: ColumnDef<EventRecord, any>[] = [
      col.accessor("_creationTime", {
        header: "Time",
        size: 100,
        cell: (info) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {formatTime(info.getValue())}
          </span>
        ),
      }),
      col.accessor("type", {
        header: "Level",
        size: 90,
        cell: (info) => {
          const level = getLevel(info.getValue());
          return (
            <Badge
              variant="outline"
              className={cn("text-[10px] font-mono uppercase px-1.5 py-0", LEVEL_STYLES[level])}
            >
              <span
                className={cn("inline-block h-1.5 w-1.5 rounded-full mr-1", LEVEL_DOT[level])}
              />
              {level}
            </Badge>
          );
        },
      }),
    ];

    if (showAgentColumn) {
      cols.push(
        col.accessor("agentName", {
          header: "Source",
          size: 110,
          cell: (info) => <span className="text-sm font-medium">{info.getValue()}</span>,
        }),
      );
    }

    cols.push(
      col.accessor("summary", {
        header: "Message",
        size: 999,
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="secondary" className="text-[10px] shrink-0 font-normal">
                {formatEventType(row.type)}
              </Badge>
              <span
                className={cn(
                  "text-sm",
                  singleLine ? "truncate" : "whitespace-pre-wrap break-words",
                )}
              >
                {info.getValue()}
              </span>
            </div>
          );
        },
      }),
    );

    return cols;
  }, [showAgentColumn, singleLine]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const hasActiveFilters =
    globalFilter || levelFilter !== "all" || agentFilter !== "all" || typeFilter !== "all";

  const clearFilters = () => {
    setGlobalFilter("");
    setLevelFilter("all");
    setAgentFilter("all");
    setTypeFilter("all");
  };

  // ── Render ──

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar row 1: Search + Time range + Live toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={globalFilter}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setGlobalFilter(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Time range pills */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5">
          {TIME_RANGES.map((tr) => (
            <button
              type="button"
              key={tr.value}
              onClick={() => setTimeRange(tr.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                timeRange === tr.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tr.label}
            </button>
          ))}
        </div>

        {/* Live toggle */}
        <button
          type="button"
          onClick={() => setIsLive((v) => !v)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
            isLive
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-border bg-muted/30 text-muted-foreground",
          )}
        >
          <span className="relative flex h-2 w-2">
            {isLive && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                isLive ? "bg-emerald-400" : "bg-muted-foreground",
              )}
            />
          </span>
          {isLive ? "Live" : "Paused"}
        </button>
      </div>

      {/* Toolbar row 2: Level, Agent, Type filters + Single line + Count */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Level filter */}
        <select
          value={levelFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setLevelFilter(e.target.value as LogLevel | "all")
          }
          className="rounded-md border bg-background px-3 py-1.5 text-xs h-8"
        >
          <option value="all">All Levels</option>
          {ALL_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        {/* Agent filter */}
        {showAgentColumn && (
          <select
            value={agentFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setAgentFilter(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-xs h-8"
          >
            <option value="all">All Agents</option>
            {uniqueAgents.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-xs h-8"
        >
          <option value="all">All Types</option>
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>
              {formatEventType(type)}
            </option>
          ))}
        </select>

        {/* Single line toggle */}
        <span className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <Switch checked={singleLine} onCheckedChange={setSingleLine} size="sm" />
          Single line
        </span>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}

        {/* Event count */}
        <div className="ml-auto text-xs text-muted-foreground">
          <Badge variant="secondary" className="font-mono text-[10px]">
            {filteredData.length.toLocaleString()}
          </Badge>{" "}
          events
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableContainerRef}
        className="rounded-lg border border-border/50 bg-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup: HeaderGroup<EventRecord>) => (
                <tr key={headerGroup.id} className="border-b bg-muted/30">
                  {headerGroup.headers.map((header: Header<EventRecord, unknown>) => (
                    <th
                      key={header.id}
                      className={cn(
                        "px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                        header.column.getCanSort() &&
                          "cursor-pointer select-none hover:text-foreground",
                      )}
                      style={{
                        width: header.getSize() < 999 ? header.getSize() : undefined,
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" && <ChevronUp className="h-3 w-3" />}
                        {header.column.getIsSorted() === "desc" && (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rawData === undefined ? (
                // Loading skeleton
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-3 py-2.5">
                      <div className="h-4 bg-muted rounded animate-pulse w-16" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="h-4 bg-muted rounded animate-pulse w-14" />
                    </td>
                    {showAgentColumn && (
                      <td className="px-3 py-2.5">
                        <div className="h-4 bg-muted rounded animate-pulse w-20" />
                      </td>
                    )}
                    <td className="px-3 py-2.5">
                      <div className="h-4 bg-muted rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={showAgentColumn ? 4 : 3} className="py-16 text-center">
                    <Radio className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No events match your filters</p>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={clearFilters}
                      >
                        Clear filters
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row: Row<EventRecord>) => {
                  const isExpanded = expandedRows.has(row.original._id);
                  return (
                    <EventRow
                      key={row.original._id}
                      row={row}
                      isExpanded={isExpanded}
                      onToggle={() => toggleRow(row.original._id)}
                      showAgentColumn={showAgentColumn}
                      isNew={isLive && row.index === 0}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

// ── Event Row ──

interface EventRowProps {
  row: Row<EventRecord>;
  isExpanded: boolean;
  onToggle: () => void;
  showAgentColumn: boolean;
  isNew: boolean;
}

const EventRow = memo(function EventRow({
  row,
  isExpanded,
  onToggle,
  showAgentColumn,
  isNew,
}: EventRowProps) {
  const event: EventRecord = row.original;
  const level = getLevel(event.type);

  return (
    <>
      <tr
        onClick={onToggle}
        className={cn(
          "border-b border-border/30 cursor-pointer transition-colors hover:bg-muted/30",
          isExpanded && "bg-muted/20",
          isNew && "animate-in fade-in-0 slide-in-from-top-1 duration-300",
        )}
      >
        {row.getVisibleCells().map((cell: Cell<EventRecord, unknown>) => (
          <td key={cell.id} className="px-3 py-2">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>

      {/* Expanded detail */}
      {isExpanded && (
        <tr className="bg-muted/10 border-b border-border/30">
          <td colSpan={showAgentColumn ? 4 : 3} className="px-4 py-3">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 md:grid-cols-4 text-xs">
              <EventDetail label="Type" value={formatEventType(event.type)} />
              <EventDetail label="Agent" value={event.agentName} />
              <EventDetail label="Time" value={new Date(event._creationTime).toLocaleString()} />
              <EventDetail label="Level" value={level} />
              {event.sessionKey && <EventDetail label="Session" value={event.sessionKey} mono />}
              {event.channel && <EventDetail label="Channel" value={event.channel} />}
            </div>

            {event.details && Object.keys(event.details).length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                  Details
                </p>
                <pre className="text-xs font-mono bg-muted/40 rounded-md p-3 overflow-x-auto text-muted-foreground">
                  {JSON.stringify(event.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-2 pt-2 border-t border-border/20">
              <p className="text-[10px] font-mono text-muted-foreground/60">ID: {event._id}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

function EventDetail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground/70 uppercase tracking-wider text-[10px]">{label}</p>
      <p className={cn("text-foreground/80", mono && "font-mono break-all")}>{value}</p>
    </div>
  );
}
