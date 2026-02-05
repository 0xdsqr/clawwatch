<div align="center">
<img src=".github/assets/clawwatch-wordmark.svg" alt="ClawWatch" width="200" />

<p>
  <a href="https://github.com/0xdsqr/clawwatch"><img src="https://img.shields.io/badge/github-clawwatch-blue?style=for-the-badge&logo=github" alt="GitHub" /></a>
  <a href="#"><img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/convex-ff6f61?style=for-the-badge&logo=convex&logoColor=white" alt="Convex" /></a>
  <a href="#"><img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="#"><img src="https://img.shields.io/badge/nix-%235277C3.svg?style=for-the-badge&logo=nixos&logoColor=white" alt="Nix" /></a>
</p>

**Self-hosted monitoring and cost management for AI agents.**

_Real-time visibility into costs, tokens, sessions, and system health from a single dashboard._

</div>

<p align="center">
  <img src=".github/assets/dashboard.png" alt="ClawWatch Dashboard" width="680" />
</p>

---

## ⇁ TOC

* [Quick Start](#quick-start)
* [Docker Compose](#docker-compose)
* [Self-Hosted Guide](#self-hosted-guide)
* [Convex Cloud Setup](#convex-cloud-setup)
* [Architecture](#architecture)
* [Development](#development)
* [Stack](#stack)
* [License](#license)

---

## Features

- 💸 **Real-time cost tracking** - Monitor spend across providers and models as it happens
- 🤖 **Multi-agent dashboard** - Unified view of all connected agents with live status and session breakdowns
- 🔬 **Agent X-Ray** - Interactive topology graph showing every integration — AI providers, external services, channels, memory, and cron jobs. Click any node to drill down into traces, sessions, cost breakdowns, and call history.
- 🔔 **Smart alerting** - Rules for budget thresholds, offline detection, and anomalies
- 📡 **Live event stream** - Filterable log of agent activity
- 📊 **Token analytics** - Input/output/cache breakdowns with model comparisons
- 🏠 **Self-hosted or cloud** - Run locally with Docker or deploy to Convex Cloud

---

## Quick Start

Pull the images and run:

```bash
docker pull daveved/clawwatch-webapp:latest
docker pull daveved/clawwatch-collector:latest

# Run the webapp (dashboard)
docker run -d -p 5173:3000 \
  -e VITE_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud \
  daveved/clawwatch-webapp:latest

# Run the collector (connects to your agent gateway)
docker run -d \
  -e GATEWAY_URL=http://YOUR_GATEWAY_IP:18789 \
  -e GATEWAY_TOKEN=your_token_here \
  -e CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud \
  daveved/clawwatch-collector:latest
```

That's it! Open `http://localhost:5173` to view the dashboard.

**Environment Variables:**

| Variable | Description |
|----------|-------------|
| `VITE_CONVEX_URL` | Your Convex deployment URL (webapp) |
| `CONVEX_URL` | Your Convex deployment URL (collector) |
| `GATEWAY_URL` | Agent gateway WebSocket URL |
| `GATEWAY_TOKEN` | Gateway authentication token |

---

## Docker Compose

For easier management, use the provided compose file:

```bash
# Create env file
cat > .env.cloud << EOF
VITE_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
GATEWAY_URL=http://YOUR_GATEWAY_IP:18789
GATEWAY_TOKEN=your_token_here
EOF

# Run
docker compose -f infra/docker-compose.cloud.yml --env-file .env.cloud up -d
```

---

## Self-Hosted Guide

Want to run everything locally including the Convex backend? This gives you full control but requires more setup.

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ or Bun
- ~4GB RAM for the Convex backend

### 1. Clone and Setup

```bash
git clone https://github.com/0xdsqr/clawwatch.git
cd clawwatch
bun install
```

### 2. Configure Environment

```bash
cp infra/.env.example infra/.env
```

Edit `infra/.env`:

```bash
GATEWAY_URL=http://YOUR_HOST_IP:18789
GATEWAY_TOKEN=your_gateway_token_here
CONVEX_CLOUD_ORIGIN=http://YOUR_HOST_IP:3210
CONVEX_SITE_ORIGIN=http://YOUR_HOST_IP:3211
VITE_CONVEX_URL=http://YOUR_HOST_IP:3210
```

> **Note:** Use your machine's IP (not `127.0.0.1`) if accessing from other devices.

### 3. Start Self-Hosted Convex

```bash
cd infra
docker volume create clawwatch_convex-data
docker compose -f docker-compose.selfhosted.yml up -d
```

### 4. Deploy Schema

```bash
# Get admin key
docker compose -f docker-compose.selfhosted.yml exec convex-backend ./generate_admin_key.sh

# Deploy schema
cd ../packages/core
export CONVEX_SELF_HOSTED_URL=http://YOUR_HOST_IP:3210
export CONVEX_SELF_HOSTED_ADMIN_KEY=your_admin_key_here
npx convex dev --once
```

### 5. Access

- **Dashboard:** `http://YOUR_HOST_IP:5173`
- **Convex Dashboard:** `http://YOUR_HOST_IP:6791`

---

## Convex Cloud Setup

If you prefer Convex Cloud (recommended for most users):

1. Create a deployment at [convex.dev](https://convex.dev)
2. Get your deployment URL (e.g., `https://xyz-123.convex.cloud`)
3. Deploy the schema:

```bash
cd packages/core
npx convex deploy --typecheck disable
```

4. Use the deployment URL in your environment variables

---

## Architecture

```
Gateway → Collector → Convex → Dashboard
```

The collector connects to your agent gateway via WebSocket, ingests events and cost data, writes to Convex, and the dashboard subscribes to real-time updates.

![ClawWatch Architecture](.github/assets/architecture.png)

---

## Development

```bash
bun install
cd packages/core && npx convex dev --once
cd apps/clawwatch && bun run dev
```

With Nix:

```bash
nix develop
bun install
```

CI: The `test` workflow runs nix-based checks on every push/PR.

---

## Stack

- **Frontend**: React 19, TanStack Router, Tailwind CSS 4, Recharts, React Flow
- **Backend**: Convex (real-time database + API)
- **Runtime**: Bun
- **Collector**: WebSocket + polling for live data ingestion

---

## License

MIT — do whatever you want with it.
