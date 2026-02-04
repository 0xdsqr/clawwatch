import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { EventLog } from "@/components/event-log";

export const Route = createFileRoute("/events")({
  component: EventsPage,
});

function EventsPage() {
  return (
    <div className="flex flex-1 flex-col gap-5 p-5">
      <div className="flex items-center gap-2.5 animate-fade-in">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Radio className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Events</h1>
          <p className="text-xs text-muted-foreground">Real-time activity feed across all agents</p>
        </div>
      </div>

      <EventLog showAgentColumn limit={500} />
    </div>
  );
}
