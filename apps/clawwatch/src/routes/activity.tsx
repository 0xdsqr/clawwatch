import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clawwatch/ui/components/card";
import { api } from "@convex/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { MiniActivityFeed } from "@/components/mini-activity-feed";

export const Route = createFileRoute("/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const activities = useQuery(api.activities.recent, { limit: 100 });

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniActivityFeed activities={activities ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
