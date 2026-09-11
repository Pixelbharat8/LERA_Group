# LERA Observability — metrics, alerts, and log shipping

Two independent pieces:

| | What | Where it runs | Data leaves the host? |
|---|---|---|---|
| **Metrics + alerts** | Prometheus scrapes all 9 services; Grafana renders them; alert rules cover down / 5xx / latency / heap / db-pool | part of `docker-compose.https.yml` | **no** |
| **Log shipping** | OpenTelemetry Collector tails container logs → any OTLP sink | separate, optional (below) | yes — see the localisation note |

## Metrics + alerts (runs with the production stack)

Nothing extra to start — `docker-compose.https.yml` brings up `prometheus` and `grafana`
alongside the services. Both bind to **127.0.0.1 only**, so neither is reachable from the
internet. Reach them over an SSH tunnel:

```bash
ssh -L 3300:127.0.0.1:3300 -L 9090:127.0.0.1:9090 user@your-server
# Grafana     http://localhost:3300   (admin / $GRAFANA_ADMIN_PASSWORD)
# Prometheus  http://localhost:9090   (/alerts shows what is firing)
```

Grafana is provisioned with the Prometheus datasource and a **LERA → Services** dashboard:
services up, firing alerts, requests/s, 5xx share, mean request time, JVM heap, and HikariCP
connections — the last one matters because the prod pool is capped at 10.

`observability/alert-rules.yml` defines: `ServiceDown` (2m), `High5xxRate` (>5% for 5m),
`SlowRequests` (mean >1s for 10m), `HeapNearFull` (>90%), `DbPoolExhausted` (any waiting
connection for 2m). They use only metrics Actuator emits with the current config — no
percentile histograms are assumed, so latency is `sum/count` (a mean, not a p95). If you want
p95s later, set `management.metrics.distribution.percentiles-histogram.http.server.requests=true`
and the rules can be sharpened.

**Alerts are visible, not yet delivered.** Firing alerts show in Prometheus and on the
dashboard. Emailing or Zalo-ing them needs an Alertmanager receiver, which needs the same SMTP
or Zalo credentials the application itself is still waiting on. Add Alertmanager when those
exist; until then someone has to look at the dashboard.

`/actuator/prometheus` is `permitAll()` — it is only reachable on the internal docker network,
because the production overlay publishes no service ports at all (only Caddy's 80/443). Do not
publish a service port without re-gating that endpoint.

---

# Log shipping (optional, separate)

> **Data localisation:** application logs carry student and parent names, emails and phone
> numbers. A sink outside Vietnam raises the same Nghị định 53/2022 question as hosting the
> database abroad — see `docs/GO_LIVE_CHECKLIST.md`. The Axiom example below is US-hosted.
> For the Vietnam path, either self-host the collector's backend or keep to the metrics stack
> above, which never leaves the machine.

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

Handled by the Prometheus + Grafana stack at the top of this file, not by the collector.

## Why a collector, not in-app appenders

The services run as containers and already emit structured, traceId-tagged logs to stdout. A
collector reading those is the standard, low-risk pattern — no per-service Logback/OTLP code to
add, version, and break across 9 independent services (and it stays vendor-neutral).
