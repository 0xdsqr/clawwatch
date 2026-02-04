/**
 * Application-level types derived from the Convex schema.
 *
 * The generated Convex API stubs are typed as `any`, so useQuery results are
 * untyped.  These interfaces give callback parameters concrete types until the
 * real codegen output is wired up.
 */

export interface Agent {
  _id: string;
  _creationTime: number;
  name: string;
  gatewayUrl: string;
  status: "online" | "offline" | "degraded";
  lastHeartbeat: number;
  lastSeen: number;
  config?: {
    model?: string;
    channel?: string;
  };
  workspacePath?: string;
  activeSessions?: number;
  costToday?: number;
}

export interface Session {
  _id: string;
  _creationTime: number;
  agentId: string;
  sessionKey: string;
  kind: string;
  displayName?: string;
  channel?: string;
  startedAt: number;
  lastActivity: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  messageCount: number;
  isActive: boolean;
}

export interface CostRecord {
  _id: string;
  _creationTime: number;
  agentId: string;
  sessionKey?: string;
  timestamp: number;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  cost: number;
  period: string;
}

export interface Budget {
  _id: string;
  _creationTime: number;
  agentId?: string;
  name: string;
  period: "hourly" | "daily" | "weekly" | "monthly";
  limitDollars: number;
  currentSpend: number;
  resetAt: number;
  hardStop: boolean;
  isActive: boolean;
}

export interface AlertRule {
  _id: string;
  _creationTime: number;
  name: string;
  agentId?: string;
  type:
    | "budget_exceeded"
    | "agent_offline"
    | "error_spike"
    | "cost_spike"
    | "high_token_usage"
    | "session_loop"
    | "channel_disconnect"
    | "custom_threshold";
  config: {
    threshold?: number;
    windowMinutes?: number;
    comparison?: "gt" | "lt" | "eq";
    metric?: string;
    hardStop?: boolean;
    percentageThreshold?: number;
  };
  severity?: "info" | "warning" | "critical";
  channels: ("discord" | "email" | "webhook")[];
  isActive: boolean;
  cooldownMinutes: number;
  lastTriggered?: number;
}

export interface Alert {
  _id: string;
  _creationTime: number;
  ruleId: string;
  agentId?: string;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  data?: Record<string, string | number | boolean | null>;
  acknowledgedAt?: number;
  resolvedAt?: number;
  channels: string[];
  notifiedAt?: number;
  notificationAttempts?: number;
  nextNotificationAttemptAt?: number;
  lastNotificationError?: string;
}

export interface Activity {
  _id: string;
  _creationTime: number;
  agentId: string;
  type:
    | "message_sent"
    | "message_received"
    | "tool_call"
    | "session_started"
    | "session_ended"
    | "error"
    | "heartbeat"
    | "alert_fired";
  summary: string;
  details?: Record<string, string | number | boolean | null>;
  sessionKey?: string;
  channel?: string;
  timestamp: number;
}

export interface HealthCheck {
  _id: string;
  _creationTime: number;
  agentId: string;
  timestamp: number;
  isHealthy: boolean;
  responseTimeMs?: number;
  activeSessionCount: number;
  totalTokensLastHour: number;
  costLastHour: number;
  errorCount: number;
}

export interface SnitchEvent {
  _id: string;
  _creationTime: number;
  agentId: string;
  type:
    | "alert_fired"
    | "safety_refusal"
    | "content_flag"
    | "budget_warning"
    | "permission_ask"
    | "proactive_warning"
    | "compliance_report"
    | "tattled_on_user";
  description: string;
  severity: "snitch" | "hall_monitor" | "narc";
  timestamp: number;
}

export interface NotificationChannel {
  _id: string;
  _creationTime: number;
  type: "discord" | "email" | "webhook";
  name: string;
  config: {
    webhookUrl?: string;
    email?: string;
    channelId?: string;
    severities?: ("info" | "warning" | "critical")[];
  };
  isActive: boolean;
}
