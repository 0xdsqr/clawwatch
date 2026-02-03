import {
  Card,
  CardContent,
} from "@clawwatch/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
        <p className="text-muted-foreground">
          View and analyze agent conversation sessions
        </p>
      </div>

      <Card className="col-span-full">
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Sessions Coming Soon</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Session management and conversation analysis features are currently
            in development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}