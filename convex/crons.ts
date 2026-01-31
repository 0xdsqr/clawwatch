import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run data retention cleanup daily at 3:00 AM UTC
crons.daily(
  "cleanup old records",
  { hourUTC: 3, minuteUTC: 0 },
  internal.cleanup.cleanupOldRecords,
);

export default crons;
