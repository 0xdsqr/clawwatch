import { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@clawwatch/ui/components/table";
import { formatCost, formatTokens, timeAgo } from "@/lib/utils";

export interface SessionData {
  sessionKey: string;
  agentName: string;
  model: string;
  cost: number;
  tokens: number;
  requests: number;
  lastSeen: number;
}

interface TopSessionsTableProps {
  data: SessionData[];
}

function truncateSessionKey(key: string): string {
  if (key.length <= 16) return key;
  return `${key.slice(0, 8)}…${key.slice(-6)}`;
}

export const TopSessionsTable = memo(function TopSessionsTable({
  data,
}: TopSessionsTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
        <p className="text-sm">No session data available</p>
      </div>
    );
  }

  return (
    <div className="max-h-[280px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Session</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Tokens</TableHead>
            <TableHead className="text-right">When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((session) => (
            <TableRow key={session.sessionKey}>
              <TableCell className="font-mono text-xs">
                {truncateSessionKey(session.sessionKey)}
              </TableCell>
              <TableCell className="text-xs">
                {session.agentName}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {formatCost(session.cost)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {formatTokens(session.tokens)}
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {timeAgo(session.lastSeen)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
