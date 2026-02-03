import { memo, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@clawwatch/ui/components/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { formatCost, formatTokens } from "@/lib/utils";

export interface ModelBreakdownData {
  model: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  avgCostPerRequest: number;
  costPer1KTokens: number;
}

interface ModelComparisonTableProps {
  data: ModelBreakdownData[];
}

type SortKey = "model" | "requests" | "inputTokens" | "outputTokens" | "cost" | "avgCostPerRequest" | "costPer1KTokens";
type SortDir = "asc" | "desc";

export const ModelComparisonTable = memo(function ModelComparisonTable({
  data,
}: ModelComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("cost");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/50" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
        <p className="text-sm">No model data available</p>
      </div>
    );
  }

  return (
    <div className="max-h-[280px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:text-foreground"
              onClick={() => handleSort("model")}
            >
              Model <SortIcon column="model" />
            </TableHead>
            <TableHead
              className="cursor-pointer text-right hover:text-foreground"
              onClick={() => handleSort("requests")}
            >
              Reqs <SortIcon column="requests" />
            </TableHead>
            <TableHead
              className="cursor-pointer text-right hover:text-foreground"
              onClick={() => handleSort("inputTokens")}
            >
              In <SortIcon column="inputTokens" />
            </TableHead>
            <TableHead
              className="cursor-pointer text-right hover:text-foreground"
              onClick={() => handleSort("outputTokens")}
            >
              Out <SortIcon column="outputTokens" />
            </TableHead>
            <TableHead
              className="cursor-pointer text-right hover:text-foreground"
              onClick={() => handleSort("cost")}
            >
              Cost <SortIcon column="cost" />
            </TableHead>
            <TableHead
              className="cursor-pointer text-right hover:text-foreground"
              onClick={() => handleSort("costPer1KTokens")}
            >
              $/1K <SortIcon column="costPer1KTokens" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow key={row.model}>
              <TableCell className="text-xs font-medium">
                {row.model}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {row.requests}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {formatTokens(row.inputTokens)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {formatTokens(row.outputTokens)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {formatCost(row.cost)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {formatCost(row.costPer1KTokens)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
