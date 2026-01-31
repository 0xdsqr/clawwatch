# 🔍 ClawWatch

**PagerDuty for your AI agents**

ClawWatch is the operational backbone for your AI agents — monitor performance, track costs, set budgets, configure alerts, and see what your agents are doing in real-time.

Built for the [Clawdbot](https://github.com/clawdbot/clawdbot) and OpenClaw ecosystem but designed to work with any AI agent platform.

![ClawWatch Dashboard](./screenshot.png)
*Screenshot placeholder - ClawWatch monitoring dashboard*

---

## Quick Start

Get ClawWatch running in under 2 minutes:

```bash
# Clone the repository
git clone https://github.com/0xdsqr/clawwatch.git
cd clawwatch

# Configure your setup
cp .env.example .env
# Edit .env with your gateway URL and token

# Start everything with Docker
docker compose up -d

# Generate admin key for schema deployment
docker compose exec convex-backend ./generate_admin_key.sh

# Deploy the database schema
npx convex dev --once --url http://127.0.0.1:3210 --admin-key <your-admin-key>
```

Visit:
- **ClawWatch Dashboard**: http://localhost:5173
- **Convex Admin**: http://localhost:6791

---

## Configuration

### Environment Variables

ClawWatch requires connection to your Clawdbot gateway. Configure these in `.env`:

```bash
# Required: Gateway connection
GATEWAY_URL=http://127.0.0.1:18789
GATEWAY_TOKEN=your_gateway_token_here

# Optional: Session transcript location
SESSIONS_DIR=/home/moltbot/.clawdbot/agents

# Optional: Collector polling frequency
POLL_INTERVAL=30000
```

See `.env.example` for all available options.

### Gateway Connection

ClawWatch connects to your Clawdbot gateway to:
- Monitor agent status and health
- Track real-time cost and token usage
- Collect activity logs and session transcripts
- Receive heartbeat and status updates

Ensure your gateway is running and accessible at the configured URL.

---

## Features

### 📊 Dashboard
Get an overview of all your agents at a glance:
- **Agent Status**: Online/offline, active sessions, health metrics
- **Cost Summary**: Today's spend, token usage, request counts
- **Active Alerts**: Critical issues requiring attention
- **Recent Activity**: What your agents have been doing

### 💰 Cost Explorer
Track spending across all your agents:
- **Real-time Tracking**: Token and dollar costs per agent, session, and time period
- **Historical Data**: Hourly, daily, weekly, and monthly breakdowns
- **Budget Management**: Set spending limits with hard stops or alerts
- **Provider Breakdown**: Costs by AI provider (OpenAI, Anthropic, etc.)

### 📈 Metrics
CloudWatch-style monitoring for your agents:
- **Response Latency**: P50, P95, P99 percentiles with configurable alarms
- **Request Rate**: Invocations per time window
- **Error Rate**: Failed requests and exceptions
- **Token Throughput**: Tokens processed per time period
- **Active Sessions**: Concurrent agent sessions
- **Heartbeat Monitoring**: Agent connectivity and health

### 🚨 Alerts
Configurable monitoring and alerting:
- **Cost Thresholds**: Alert when agents exceed spending limits
- **Performance Issues**: High latency, error spikes, session loops
- **Agent Health**: Offline detection, heartbeat failures
- **Custom Metrics**: Define your own monitoring rules

### 📜 Activity Feed
"What did my agent do?" timeline:
- **Action History**: Tool calls, messages, decisions
- **Session Tracking**: Follow agent conversations and workflows  
- **Error Logging**: Exceptions and failure details
- **Performance Insights**: Response times and resource usage

### 🎯 Snitch Score™
A fun metric tracking how often your agents "tattle" or report issues:
- **Behavioral Tracking**: Safety refusals, permission requests, compliance reports
- **Leaderboards**: Which agent is the biggest tattletale?
- **Trend Analysis**: Changes in agent behavior over time

---

## Architecture

```
┌──────────────┐     HTTP API       ┌──────────────────┐
│  Clawdbot    │ ─────────────────▸ │ ClawWatch        │
│  Gateway     │   File System      │ Collector        │
└──────────────┘ ─────────────────▸ └────────┬─────────┘
                                             │
                                    Convex Mutations
                                             │
                                    ┌────────▼──────────┐
                                    │  Convex Backend   │
                                    │  (self-hosted)    │
                                    └────────┬──────────┘
                                             │
                                    Real-time Queries
                                             │
                                    ┌────────▼──────────┐
                                    │ ClawWatch         │
                                    │ Dashboard         │
                                    │ (React + Vite)    │
                                    └───────────────────┘
```

**Components:**

- **ClawWatch Collector**: Polls the Clawdbot gateway and session transcripts, feeds data into Convex
- **Convex Backend**: Self-hosted reactive database with real-time subscriptions
- **ClawWatch Dashboard**: React frontend with live updates and interactive charts

**Technology Stack:**

- **Frontend**: React + Vite + Tailwind CSS + Recharts
- **Backend**: [Convex](https://convex.dev) (self-hosted) — reactive database
- **Runtime**: Bun for performance, Node.js compatible
- **Deployment**: Docker Compose for easy orchestration

---

## Development

### Running Locally (without Docker)

```bash
# Install dependencies
bun install

# Start Convex backend
cd infra && docker compose up -d

# Generate admin key
docker compose exec backend ./generate_admin_key.sh

# Configure environment
cp .env.example .env.local
# Edit .env.local with your settings

# Deploy schema
npx convex dev --once

# Start frontend
bun run dev

# Start collector (in another terminal)
bun run collector/poll.ts
```

### Project Structure

```
clawwatch/
├── src/                  # React frontend source
├── convex/              # Database schema and functions
├── collector/           # Data collection service
├── public/              # Static assets
├── docker-compose.yml   # Production deployment
├── Dockerfile           # Webapp container
├── Dockerfile.collector # Collector container
└── .env.example        # Configuration template
```

### Building

```bash
# Build frontend
bun run build

# Build Docker images
docker build -t clawwatch-webapp .
docker build -f Dockerfile.collector -t clawwatch-collector .
```

---

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Built With

- [React](https://react.dev) - Frontend framework
- [Vite](https://vitejs.dev) - Build tool and dev server
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Convex](https://convex.dev) - Reactive backend database
- [Recharts](https://recharts.org) - Chart library
- [Bun](https://bun.sh) - Fast JavaScript runtime
- [Docker](https://docker.com) - Containerization

---

*Built with ❤️ for the AI agent community*
