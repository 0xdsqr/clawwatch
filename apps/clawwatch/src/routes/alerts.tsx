import { createFileRoute, redirect } from "@tanstack/react-router";

// Redirect old /alerts route to /alerting
export const Route = createFileRoute("/alerts")({
  beforeLoad: () => {
    throw redirect({ to: "/alerting" });
  },
  component: () => null,
});
