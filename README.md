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

ClawWatch is a local-first monitoring system for agentic AI agents. Connect your agents through a WebSocket gateway and track everything from a single pane of glass:

- 💸 **Real-time cost tracking** - Monitor spend across providers and models as it happens
- 🤖 **Multi-agent dashboard** - Unified view of all connected agents with live status and session breakdowns
- 🔔 **Smart alerting** - Rules for budget thresholds, offline detection, and anomalies
- 📡 **Live event stream** - Filterable log of agent activity
- 📊 **Token analytics** - Input/output/cache breakdowns with model comparisons
- 🏠 **Self-hosted or cloud** - Run locally with a self-hosted Convex backend or in Convex Cloud

# Quick Start

name: test

```bash
bun install

cp infra/.env.example .env.local
# Set at least VITE_CONVEX_URL and CONVEX_URL (local or cloud)

cd packages/core && npx convex dev

cd apps/clawwatch && bun run dev
```

Set `GATEWAY_URL` and `GATEWAY_TOKEN` to connect the WebSocket collector to your agent gateway.

CI note: the `test` workflow runs nix-based checks on every push/PR.

**Deployment Modes**

ClawWatch supports both Convex Cloud and self-hosted Convex.  
For most users, we recommend Convex Cloud with your own deploy key.  
Self-hosted is for teams who have the hardware and want full on-prem control.

**Cloud (Convex Cloud)**

1. Create a Convex Cloud deployment and grab your deployment URL + deploy key.
2. Set environment variables (example for `.env.local`):

```
VITE_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
```

3. Deploy the Convex schema:

```bash
cd packages/core
npx convex deploy --typecheck disable
```

**Cloud (Docker + Convex Cloud)**

```bash
cp infra/.env.example .env.cloud
# set VITE_CONVEX_URL, CONVEX_URL, GATEWAY_URL, GATEWAY_TOKEN
docker compose -f infra/docker-compose.cloud.yml --env-file .env.cloud up -d
```

Notes:
- `VITE_CONVEX_URL` is injected at runtime via `/config.js` in the webapp container.
- Use your Docker Hub namespace by setting `DOCKERHUB_NAMESPACE` in `.env.cloud`.

**Self-Hosting (Docker Compose)**

```bash
git clone https://github.com/0xdsqr/clawwatch.git
cd clawwatch/infra
cp .env.example .env
docker volume create clawwatch_convex-data
docker compose -f docker-compose.selfhosted.yml up -d
```

Edit `.env` with your gateway URL and token:

```
GATEWAY_URL=http://YOUR_HOST_IP:18789
GATEWAY_TOKEN=your_gateway_token_here
CONVEX_CLOUD_ORIGIN=http://YOUR_HOST_IP:3210
CONVEX_SITE_ORIGIN=http://YOUR_HOST_IP:3211
VITE_CONVEX_URL=http://YOUR_HOST_IP:3210
```

Use your machine’s IP (not `127.0.0.1`) if you access the dashboard from another device.

Single-command boot (after `.env` is set):

```bash
cd infra && docker compose -f docker-compose.selfhosted.yml up -d
```

Deploy the Convex schema:

```bash
docker compose -f docker-compose.selfhosted.yml exec convex-backend ./generate_admin_key.sh
cd ../packages/core
export CONVEX_SELF_HOSTED_URL=http://YOUR_HOST_IP:3210
export CONVEX_SELF_HOSTED_ADMIN_KEY=your_admin_key_here
npx convex dev --once
```

Open:

- ClawWatch UI: `http://YOUR_HOST_IP:5173`
- Convex Dashboard: `http://YOUR_HOST_IP:6791`

**Architecture**

Gateway → Collector → Convex → Dashboard.  
The collector ingests events and costs over WebSocket, writes into Convex, and the UI subscribes to real-time updates.

![ClawWatch Architecture](.github/assets/architecture.png)

**Development**

With Bun:

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

Formatting:

```bash
nix fmt .
# or
bun run format
```

**Stack**

- **Frontend**: React 19, TanStack Router, Tailwind CSS 4, Recharts
- **Backend**: Convex (real-time database + API)
- **Runtime**: Bun
- **Collector**: WebSocket + polling for live data ingestion

**License**

MIT — do whatever you want with it.
