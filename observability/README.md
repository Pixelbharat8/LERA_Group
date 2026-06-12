# LERA Observability — log shipping

Closes the "metrics/logs are emitted but nothing collects them" gap with **zero application
changes**. The 9 Spring Boot services already log lines tagged with `[traceId=…]` to stdout; an
**OpenTelemetry Collector** tails the Docker container logs and forwards them to any OTLP sink.

Vendor-neutral by design — only the exporter endpoint/headers change. Works with **Axiom**,
Grafana Cloud, Datadog, New Relic, or a self-hosted collector.

## Run it

```bash
cd observability

# point at your sink — Axiom example:
export OTEL_EXPORTER_OTLP_ENDPOINT=https://api.axiom.co
export OTLP_AUTH_HEADER="Bearer xaat-<your-axiom-api-token>"
export OTLP_DATASET=lera-prod          # Axiom dataset (ignored by non-Axiom sinks)
export LERA_ENV=prod

docker compose -f docker-compose.observability.yml up -d
```

If the env vars are unset the collector still runs and prints logs locally (the `debug`
exporter), so it is safe to start before a sink is configured.

## Sink cheat-sheet

| Sink | `OTEL_EXPORTER_OTLP_ENDPOINT` | `OTLP_AUTH_HEADER` | notes |
|------|-------------------------------|--------------------|-------|
| Axiom | `https://api.axiom.co` | `Bearer <api-token>` | also set `OTLP_DATASET` |
| Grafana Cloud | `https://otlp-gateway-<region>.grafana.net/otlp` | `Basic <base64 user:token>` | |
| Datadog (agent) | `http://datadog-agent:4318` | — | run the DD agent |
| Self-hosted | `http://your-collector:4318` | as needed | |

## Metrics

Each service also exposes `/actuator/prometheus` (auth-gated). To collect metrics too, add a
`prometheus` receiver to `otelcol-config.yaml` with a bearer token, or scrape with Prometheus +
Grafana. Logs (above) are the higher-value first step.

## Why a collector, not in-app appenders

The services run as containers and already emit structured, traceId-tagged logs to stdout. A
collector reading those is the standard, low-risk pattern — no per-service Logback/OTLP code to
add, version, and break across 9 independent services (and it stays vendor-neutral).
