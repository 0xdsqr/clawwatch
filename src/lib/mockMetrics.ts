// Mock metrics data generator — simulates CloudWatch-style metrics
// Will be replaced with real gateway data once the WebSocket connector is built

function jitter(base: number, range: number): number {
  return base + (Math.random() - 0.5) * range * 2;
}

function spike(i: number, spikeAt: number[], magnitude: number): number {
  for (const s of spikeAt) {
    if (Math.abs(i - s) < 2) return magnitude * (1 - Math.abs(i - s) / 2);
  }
  return 0;
}

export interface MetricPoint {
  timestamp: number;
  value: number;
}

export interface LatencyMetrics {
  p50: MetricPoint[];
  p95: MetricPoint[];
  p99: MetricPoint[];
}

export function generateLatencyMetrics(hours: number = 24): LatencyMetrics {
  const now = Date.now();
  const points = hours * 4; // 15-min intervals
  const p50: MetricPoint[] = [];
  const p95: MetricPoint[] = [];
  const p99: MetricPoint[] = [];

  const spikePoints = [
    Math.floor(points * 0.3),
    Math.floor(points * 0.7),
    Math.floor(points * 0.85),
  ];

  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i) * 15 * 60 * 1000;
    const baseLatency = 200 + spike(i, spikePoints, 800);

    p50.push({ timestamp, value: Math.round(jitter(baseLatency, 50)) });
    p95.push({ timestamp, value: Math.round(jitter(baseLatency * 2.5, 200)) });
    p99.push({ timestamp, value: Math.round(jitter(baseLatency * 4, 500) + spike(i, spikePoints, 2000)) });
  }

  return { p50, p95, p99 };
}

export function generateRequestRate(hours: number = 24): MetricPoint[] {
  const now = Date.now();
  const points = hours * 4;
  const data: MetricPoint[] = [];

  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i) * 15 * 60 * 1000;
    const hour = new Date(timestamp).getHours();

    // Lower activity at night, peaks during day
    const dayMultiplier = hour >= 8 && hour <= 23 ? 1 : 0.2;
    const base = 15 * dayMultiplier;
    data.push({ timestamp, value: Math.round(jitter(base, 8)) });
  }

  return data;
}

export function generateErrorRate(hours: number = 24): MetricPoint[] {
  const now = Date.now();
  const points = hours * 4;
  const data: MetricPoint[] = [];
  const errorSpikes = [Math.floor(points * 0.45), Math.floor(points * 0.72)];

  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i) * 15 * 60 * 1000;
    const base = 0.5;
    const val = Math.max(0, jitter(base, 0.5) + spike(i, errorSpikes, 8));
    data.push({ timestamp, value: Math.round(val * 100) / 100 });
  }

  return data;
}

export function generateTokenThroughput(hours: number = 24): MetricPoint[] {
  const now = Date.now();
  const points = hours * 4;
  const data: MetricPoint[] = [];

  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i) * 15 * 60 * 1000;
    const hour = new Date(timestamp).getHours();
    const dayMultiplier = hour >= 8 && hour <= 23 ? 1 : 0.15;
    const base = 25000 * dayMultiplier;
    data.push({ timestamp, value: Math.round(jitter(base, 10000)) });
  }

  return data;
}

export function generateSessionCount(hours: number = 24): MetricPoint[] {
  const now = Date.now();
  const points = hours * 4;
  const data: MetricPoint[] = [];

  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i) * 15 * 60 * 1000;
    const hour = new Date(timestamp).getHours();
    const active = hour >= 8 && hour <= 23 ? Math.round(jitter(4, 2)) : Math.round(jitter(1, 0.5));
    data.push({ timestamp, value: Math.max(0, active) });
  }

  return data;
}

export function generateHeartbeatLatency(hours: number = 24): MetricPoint[] {
  const now = Date.now();
  const points = hours * 2; // 30-min intervals (heartbeat cadence)
  const data: MetricPoint[] = [];

  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i) * 30 * 60 * 1000;
    data.push({ timestamp, value: Math.round(jitter(1200, 400)) });
  }

  return data;
}
