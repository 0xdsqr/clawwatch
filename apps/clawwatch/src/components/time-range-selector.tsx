import { Button } from "@clawwatch/ui/components/button";
import { memo } from "react";

export type TimeRange = "24h" | "7d" | "30d";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

const TIME_RANGE_OPTIONS = [
  { value: "24h" as const, label: "24h" },
  { value: "7d" as const, label: "7d" },
  { value: "30d" as const, label: "30d" },
];

export const TimeRangeSelector = memo(function TimeRangeSelector({
  value,
  onChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {TIME_RANGE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onChange(option.value)}
          className="h-7 px-3 text-xs"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
});