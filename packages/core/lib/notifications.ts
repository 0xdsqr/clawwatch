import type { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import type { Id } from "../convex/_generated/dataModel.js";

type AlertSeverity = "info" | "warning" | "critical";

interface PendingAlert {
  _id: Id<"alerts">;
  _creationTime: number;
  severity: AlertSeverity;
  title: string;
  message: string;
  channels: string[];
  notificationAttempts?: number;
}

interface NotificationChannel {
  _id: string;
  type: string;
  name: string;
  isActive: boolean;
  config: {
    webhookUrl?: string;
    severities?: AlertSeverity[];
  };
}

function severityColor(severity: AlertSeverity): number {
  switch (severity) {
    case "critical":
      return 0xed4245; // red
    case "warning":
      return 0xfee75c; // yellow
    case "info":
      return 0x5865f2; // blurple
  }
}

function shouldDeliver(channel: NotificationChannel, severity: AlertSeverity): boolean {
  const allowed = channel.config.severities ?? ["warning", "critical"];
  return allowed.includes(severity);
}

async function postDiscordWebhook(webhookUrl: string, alert: PendingAlert): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "ClawWatch",
      embeds: [
        {
          title: alert.title,
          description: alert.message,
          color: severityColor(alert.severity),
          fields: [
            { name: "Severity", value: alert.severity.toUpperCase(), inline: true },
            { name: "Triggered", value: new Date(alert._creationTime).toISOString(), inline: true },
          ],
          footer: { text: "ClawWatch Alert" },
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord webhook failed (${res.status}): ${body.slice(0, 300)}`);
  }
}

function computeRetryDelayMs(nextAttemptNumber: number): number {
  // 1m, 2m, 4m capped at 30m.
  return Math.min(60_000 * 2 ** Math.max(0, nextAttemptNumber - 1), 30 * 60_000);
}

export async function dispatchDiscordNotifications(
  convex: ConvexHttpClient,
  source: string,
): Promise<{ checked: number; delivered: number; retried: number }> {
  const pending = (await convex.query(api.alerting.listPendingNotifications, {
    limit: 100,
  })) as PendingAlert[];

  if (!pending || pending.length === 0) {
    return { checked: 0, delivered: 0, retried: 0 };
  }

  const channels = (await convex.query(api.notifications.list, {})) as NotificationChannel[];
  const discordChannels = channels.filter(
    (channel) => channel.isActive && channel.type === "discord" && !!channel.config.webhookUrl,
  );

  let delivered = 0;
  let retried = 0;

  for (const alert of pending) {
    const targetChannels = discordChannels.filter((channel) => shouldDeliver(channel, alert.severity));

    if (targetChannels.length === 0) {
      await convex.mutation(api.alerting.markNotificationSent, { id: alert._id });
      continue;
    }

    try {
      for (const channel of targetChannels) {
        await postDiscordWebhook(channel.config.webhookUrl!, alert);
      }
      await convex.mutation(api.alerting.markNotificationSent, { id: alert._id });
      delivered++;
      console.log(`[${source}] Delivered Discord alert "${alert.title}"`);
    } catch (err) {
      const attempts = (alert.notificationAttempts ?? 0) + 1;
      const nextAttemptAt = Date.now() + computeRetryDelayMs(attempts);
      await convex.mutation(api.alerting.markNotificationAttemptFailed, {
        id: alert._id,
        error: err instanceof Error ? err.message : String(err),
        nextAttemptAt,
      });
      retried++;
      console.error(`[${source}] Notification delivery failed for "${alert.title}":`, err);
    }
  }

  return { checked: pending.length, delivered, retried };
}
