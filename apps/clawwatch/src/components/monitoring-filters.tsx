import { Badge } from "@clawwatch/ui/components/badge";
import { Button } from "@clawwatch/ui/components/button";
import { Filter, X } from "lucide-react";
import { memo } from "react";
import { type TimeRange, TimeRangeSelector } from "@/components/time-range-selector";

interface MonitoringFiltersProps {
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
  selectedModels: string[];
  onModelsChange: (models: string[]) => void;
  availableModels: string[];
  selectedAgents: string[];
  onAgentsChange: (agents: string[]) => void;
  availableAgents: { id: string; name: string }[];
}

export const MonitoringFilters = memo(function MonitoringFilters({
  timeRange,
  onTimeRangeChange,
  selectedModels,
  onModelsChange,
  availableModels,
  selectedAgents,
  onAgentsChange,
  availableAgents,
}: MonitoringFiltersProps) {
  const hasFilters = selectedModels.length > 0 || selectedAgents.length > 0;

  const toggleModel = (model: string) => {
    if (selectedModels.includes(model)) {
      onModelsChange(selectedModels.filter((m) => m !== model));
    } else {
      onModelsChange([...selectedModels, model]);
    }
  };

  const toggleAgent = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      onAgentsChange(selectedAgents.filter((a) => a !== agentId));
    } else {
      onAgentsChange([...selectedAgents, agentId]);
    }
  };

  const clearAll = () => {
    onModelsChange([]);
    onAgentsChange([]);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
      </div>

      {/* Model filter badges */}
      {availableModels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {availableModels.map((model) => (
            <Badge
              key={model}
              variant={selectedModels.includes(model) ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => toggleModel(model)}
            >
              {model}
            </Badge>
          ))}
        </div>
      )}

      {/* Agent filter badges */}
      {availableAgents.length > 0 && (
        <>
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-wrap items-center gap-1">
            {availableAgents.map((agent) => (
              <Badge
                key={agent.id}
                variant={selectedAgents.includes(agent.id) ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => toggleAgent(agent.id)}
              >
                {agent.name}
              </Badge>
            ))}
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground"
          onClick={clearAll}
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}

      {/* Time range selector */}
      <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
    </div>
  );
});
