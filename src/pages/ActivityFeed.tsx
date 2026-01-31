import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card } from "@/components/Card";
import { MiniActivityFeed } from "@/components/MiniActivityFeed";

export function ActivityFeed() {
  const activities = useQuery(api.activities.recent, { limit: 100 });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Activity Feed</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Everything your agents have been doing
        </p>
      </div>

      <Card>
        <MiniActivityFeed activities={activities ?? []} />
      </Card>
    </div>
  );
}
