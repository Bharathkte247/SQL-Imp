# Auto Quality Review Automation (Auto QRA)

Product & Technical Design Package

Version: 1.0  
Date: July 2026  
Scope: Sections 33-46

## 33. Monitoring Strategy

### Purpose

The purpose of the monitoring strategy is to define how Auto Quality Review Automation (Auto QRA) will be measured, operated, and governed in production. Auto QRA is expected to process 60,000 audits per month, with an average of approximately 2,000 audits per day. Each audit is estimated to consume 3,200 tokens, based on 2,500 input tokens and 700 output tokens. This produces an expected monthly inference volume of 192,000,000 tokens and a daily inference volume of approximately 6,400,000 tokens. Because the automation supports enterprise quality review decisions, monitoring must cover service health, inference performance, model behavior, data protection, workflow completion, cost, and human escalation.

### Description

The system will expose metrics from every major component. Application APIs will publish request counts, error rates, latency distributions, queue depth, audit state transitions, and dependency timing. vLLM workers will publish model throughput, GPU utilization, GPU memory consumption, batch size, prefill latency, decode latency, time to first token, and tokens per second. Redis will publish memory, eviction, latency, connected clients, blocked clients, and queue length. PostgreSQL will publish connection count, transaction latency, lock waits, deadlocks, replication lag where applicable, and table growth. Azure Blob Storage access will be monitored through storage metrics, object operation counts, and access logs. SSO, authorization, PII masking, and encryption events will be monitored through security and audit metrics.

Monitoring will be implemented as a layered program rather than a dashboard-only activity. The first layer is service-level monitoring, focused on availability, latency, error rate, throughput, and saturation. The second layer is workflow monitoring, focused on the audit lifecycle from ingestion to completion. The third layer is model and GPU monitoring, focused on inference throughput and hardware saturation. The fourth layer is security monitoring, focused on identity, access, data masking, and anomalous behavior. The fifth layer is business monitoring, focused on audit volume, automation coverage, reviewer escalations, and cost per audit.

### Business Justification

Auto QRA will be used to improve quality review consistency, throughput, and cost efficiency. Monitoring protects that investment by detecting failures before they become broad business disruption. A 99.9% availability target allows approximately 43.2 minutes of unplanned downtime per month. Without strong monitoring, a small issue such as a saturated Redis queue, an overloaded vLLM worker, or a failed PII masking step could silently delay audit processing or expose sensitive data. The business consequence would be missed review deadlines, loss of trust in automated decisions, increased manual work, and potential compliance risk.

### Technical Details

The monitoring architecture uses Prometheus-compatible instrumentation and exporters. Application services will expose `/metrics` endpoints. vLLM workers will expose inference metrics and GPU exporters will expose device-level metrics through NVIDIA DCGM Exporter. Redis and PostgreSQL will use managed service metrics and exporters where available. Grafana will read Prometheus time series and cloud provider metrics through configured data sources. Alertmanager will route alerts by severity and ownership.

The expected average audit arrival rate is:

| Formula | Result |
| --- | ---: |
| Monthly audits | 60,000 audits/month |
| Average daily audits | 60,000 / 30 = 2,000 audits/day |
| Average hourly audits | 2,000 / 24 = 83.3 audits/hour |
| Average per-minute audits | 83.3 / 60 = 1.39 audits/minute |
| Average per-second audits | 1.39 / 60 = 0.023 audits/second |
| Peak multiplier assumption | 3x average |
| Peak hourly audits | 83.3 x 3 = 250 audits/hour |
| Peak per-minute audits | 250 / 60 = 4.17 audits/minute |
| Peak per-second audits | 4.17 / 60 = 0.069 audits/second |

Prometheus metric catalog for platform health:

| Metric name | Type | Labels | Source | Purpose | Warning threshold | Critical threshold |
| --- | --- | --- | --- | --- | ---: | ---: |
| `auto_qra_api_requests_total` | Counter | `service`, `route`, `method`, `status` | API | Request volume and status mix | 5xx > 1% for 10m | 5xx > 5% for 5m |
| `auto_qra_api_request_duration_seconds` | Histogram | `service`, `route`, `method` | API | API latency | p95 > 2s for 15m | p95 > 5s for 5m |
| `auto_qra_audit_submitted_total` | Counter | `source`, `tenant` | Workflow | Audit intake volume | 30% below forecast | 60% below forecast |
| `auto_qra_audit_completed_total` | Counter | `tenant`, `model`, `result` | Workflow | Completed audits | Completion rate below intake for 30m | No completions for 10m |
| `auto_qra_audit_duration_seconds` | Histogram | `tenant`, `model`, `priority` | Workflow | End-to-end audit latency | p95 > 60s for 15m | p99 > 120s for 10m |
| `auto_qra_audit_queue_depth` | Gauge | `queue`, `priority` | Redis/App | Backlog monitoring | > 100 for 15m | > 500 for 10m |
| `auto_qra_audit_queue_age_seconds` | Gauge | `queue`, `priority` | Redis/App | Oldest queued item age | > 60s | > 300s |
| `auto_qra_dependency_duration_seconds` | Histogram | `dependency`, `operation` | App | Dependency latency | p95 > baseline x 2 | p95 > baseline x 5 |
| `auto_qra_dependency_errors_total` | Counter | `dependency`, `operation`, `error` | App | Dependency failures | > 1% for 15m | > 5% for 5m |
| `auto_qra_worker_active_jobs` | Gauge | `worker_pool`, `node` | Worker | Worker saturation | > 80% capacity | > 95% capacity |
| `auto_qra_worker_retries_total` | Counter | `worker_pool`, `reason` | Worker | Retry rate | > 3% audits | > 10% audits |
| `auto_qra_slo_audit_success_ratio` | Gauge | `window` | Recording rule | SLO tracking | < 99.5% | < 99.0% |

Prometheus metric catalog for vLLM and GPU health:

| Metric name | Type | Labels | Source | Purpose | Warning threshold | Critical threshold |
| --- | --- | --- | --- | --- | ---: | ---: |
| `vllm:num_requests_running` | Gauge | `model`, `instance` | vLLM | Active inference requests | > 80% configured limit | > 95% configured limit |
| `vllm:num_requests_waiting` | Gauge | `model`, `instance` | vLLM | Inference queue pressure | > 20 for 10m | > 100 for 5m |
| `vllm:prompt_tokens_total` | Counter | `model`, `instance` | vLLM | Input token volume | Forecast + 20% | Forecast + 50% |
| `vllm:generation_tokens_total` | Counter | `model`, `instance` | vLLM | Output token volume | Forecast + 20% | Forecast + 50% |
| `vllm:time_to_first_token_seconds` | Histogram | `model`, `instance` | vLLM | User-perceived inference start | p95 > 10s | p95 > 25s |
| `vllm:e2e_request_latency_seconds` | Histogram | `model`, `instance` | vLLM | Inference latency | p95 > 45s | p99 > 60s |
| `vllm:request_success_total` | Counter | `model`, `instance` | vLLM | Successful model calls | Drop > 20% | Drop > 50% |
| `vllm:request_failure_total` | Counter | `model`, `instance`, `reason` | vLLM | Failed model calls | > 1% | > 5% |
| `DCGM_FI_DEV_GPU_UTIL` | Gauge | `gpu`, `node` | DCGM | GPU utilization | < 30% or > 85% for 30m | > 95% for 10m |
| `DCGM_FI_DEV_FB_USED` | Gauge | `gpu`, `node` | DCGM | GPU memory used | > 85% | > 95% |
| `DCGM_FI_DEV_POWER_USAGE` | Gauge | `gpu`, `node` | DCGM | Power draw | > baseline + 20% | Hardware limit |
| `DCGM_FI_DEV_XID_ERRORS` | Counter | `gpu`, `node` | DCGM | GPU hardware faults | Any event | Repeated event |

Prometheus metric catalog for data and security controls:

| Metric name | Type | Labels | Source | Purpose | Warning threshold | Critical threshold |
| --- | --- | --- | --- | --- | ---: | ---: |
| `auto_qra_pii_masking_requests_total` | Counter | `tenant`, `result` | PII service | PII masking volume | Failure > 0.5% | Failure > 2% |
| `auto_qra_pii_unmasked_tokens_detected_total` | Counter | `tenant`, `field`, `severity` | DLP validation | Masking escape detection | Any medium event | Any high event |
| `auto_qra_auth_login_total` | Counter | `idp`, `result` | SSO | Authentication events | Failure spike x 3 | Failure spike x 10 |
| `auto_qra_authz_denied_total` | Counter | `role`, `resource`, `reason` | App | Authorization denials | Baseline x 3 | Baseline x 10 |
| `auto_qra_secret_rotation_age_days` | Gauge | `secret_type` | Security job | Secret age | > 60 days | > 90 days |
| `auto_qra_encryption_failures_total` | Counter | `component` | App/KMS | Encryption failures | Any event | Any repeated event |
| `auto_qra_audit_log_write_failures_total` | Counter | `component` | App | Audit log integrity | Any event | Repeated event |
| `auto_qra_policy_violation_total` | Counter | `policy`, `severity` | Policy engine | Zero-trust policy violations | Medium > 0 | High > 0 |

### Best Practices

Prometheus recording rules should be used for SLO calculations and expensive percentile queries. Grafana dashboards should distinguish real-time operations from executive reporting. On-call dashboards should prioritize latency, error rate, queue depth, and GPU health. Leadership dashboards should prioritize audit volume, automation coverage, SLO attainment, quality outcomes, and cost per audit. Alert thresholds should be reviewed after the first 30 days of production traffic, because forecasted rates may differ from actual enterprise usage patterns.

### Risks

The main risk is under-monitoring workflow failure modes. A system can appear healthy at the container level while audits are delayed in Redis, blocked on database locks, failing PII masking, or retrying inference. Another risk is high-cardinality metric design, which can increase monitoring cost and reduce Prometheus performance. GPU metrics can also be misleading if they are reviewed without vLLM queue metrics; high utilization can be healthy during batch inference, while low utilization can indicate either idle capacity or a bottleneck before inference.

### Recommendations

Implement monitoring as a required production readiness gate before any enterprise rollout. Configure Prometheus, Grafana, Alertmanager, DCGM Exporter, Redis exporter, PostgreSQL exporter, and application metrics in the first production environment. Establish SLO dashboards for audit completion within 60 seconds and API 5xx-free availability. Add synthetic audit probes that run every five minutes using a safe test payload with no PII, and verify the complete path through masking, queueing, vLLM, persistence, and Azure Blob Storage artifact retrieval.

## 34. Observability

### Purpose

The purpose of observability is to make Auto QRA diagnosable, explainable, and governable under real production conditions. Monitoring tells operators when known failure modes occur; observability allows engineers and support teams to investigate unknown or complex behavior. Auto QRA has several sources of operational complexity: asynchronous audit workflows, inference queues, GPU-backed model serving, enterprise identity, PII masking, encrypted storage, and structured quality outputs. Observability must connect these elements into a coherent view of each audit transaction.

### Description

Observability for Auto QRA is based on three pillars: metrics, logs, and traces. Metrics provide numerical indicators of health and performance. Logs provide structured event records for state changes, decisions, exceptions, and security-relevant actions. Traces connect distributed operations across services and dependencies. A fourth practical pillar, audit evidence, is also required because Auto QRA produces quality review decisions that may need to be explained to business stakeholders, internal auditors, and compliance teams.

### Business Justification

Enterprise users need confidence that Auto QRA decisions are repeatable and supportable. When a reviewer asks why an audit was delayed, escalated, or scored a certain way, the support team must be able to reconstruct the workflow without exposing protected data. Observability shortens mean time to detect and mean time to resolve incidents. It also reduces the amount of engineering time required to investigate production issues.

### Technical Details

OpenTelemetry should be used for distributed tracing across application services. Traces should include spans for API ingestion, authentication, authorization, PII masking, prompt construction, queue enqueue, worker pickup, vLLM request, post-processing, persistence, Azure Blob Storage write, notification, and UI retrieval. Span attributes should be carefully controlled. Safe attributes include environment, service name, model family, model size, quantization mode, tenant ID if approved for operational use, audit type, queue name, priority, token counts, and status codes. Unsafe attributes include raw prompt text, model output text, names, emails, phone numbers, addresses, account numbers, and free-form customer notes.

Recommended trace model:

| Span name | Parent | Key attributes | Error conditions |
| --- | --- | --- | --- |
| `audit.submit` | Root | `audit_id`, `tenant_id`, `source`, `priority` | Invalid payload, auth failure |
| `auth.sso.validate` | `audit.submit` | `idp`, `auth_method`, `role_count` | Token invalid, SSO timeout |
| `authz.policy.evaluate` | `audit.submit` | `resource`, `action`, `decision` | Denied, policy service unavailable |
| `pii.mask` | `audit.submit` | `masking_version`, `fields_masked`, `risk_level` | Masking failure, DLP hit |
| `prompt.build` | `audit.submit` | `prompt_version`, `input_tokens_estimated` | Template missing, token limit exceeded |
| `queue.enqueue` | `audit.submit` | `queue`, `priority`, `queue_depth` | Redis unavailable |
| `worker.process` | Root or linked | `attempt_id`, `worker_pool`, `node` | Worker timeout |
| `vllm.generate` | `worker.process` | `model`, `gpu_type`, `input_tokens`, `output_tokens` | Timeout, OOM, invalid response |
| `result.validate` | `worker.process` | `schema_version`, `validation_result` | JSON schema failure |
| `result.persist` | `worker.process` | `postgres_table`, `gcs_bucket`, `object_class` | DB or Azure Blob Storage write failure |
| `review.publish` | `worker.process` | `destination`, `notification_type` | Notification failure |

Grafana dashboard definitions should be managed as code and stored with the deployment configuration. Dashboards must support drill-down from executive status to service dependency and audit-level troubleshooting. The following dashboard set is recommended:

| Dashboard | Audience | Panels | Primary data sources | Refresh |
| --- | --- | --- | --- | --- |
| Auto QRA Executive Health | Product, Operations | Monthly audits, daily audits, SLO attainment, completion under 60s, escalations, cost per audit | Prometheus, billing export, PostgreSQL aggregate views | 15m |
| Auto QRA Operations Overview | On-call, SRE | API availability, p95/p99 latency, error rate, queue depth, oldest audit age, worker utilization | Prometheus | 1m |
| Audit Workflow Funnel | Support, Engineering | Submitted, masked, queued, processing, completed, failed, retried, escalated | Prometheus, PostgreSQL | 5m |
| vLLM Inference Health | ML Platform, SRE | Time to first token, request latency, tokens/sec, waiting requests, running requests, model errors | vLLM metrics, DCGM | 30s |
| GPU Fleet | ML Platform | GPU utilization, memory, temperature, power, XID errors, node status | DCGM, Azure metrics | 30s |
| Data Layer Health | DBAs, SRE | PostgreSQL CPU, connections, locks, deadlocks, slow queries, Redis memory, evictions | PostgreSQL exporter, Redis metrics | 1m |
| Security and Compliance | Security, Compliance | SSO failures, authorization denials, PII masking failures, DLP findings, audit log failures | App metrics, SIEM export | 5m |
| Capacity and Cost | FinOps, Platform | Token volume, GPU hours, cost per audit, utilization by model, storage growth | Prometheus, billing export | 1h |

Example Grafana dashboard-as-code definition summary:

| Field | Value |
| --- | --- |
| Dashboard UID | `auto-qra-ops-overview` |
| Title | Auto QRA Operations Overview |
| Tags | `auto-qra`, `production`, `slo`, `operations` |
| Variables | `environment`, `tenant`, `model`, `worker_pool`, `gpu_type` |
| Row 1 | SLO: audit completion under 60s, API availability, error budget burn |
| Row 2 | Intake: submitted audits, completed audits, failed audits, retry rate |
| Row 3 | Queues: queue depth, queue age, worker active jobs, worker saturation |
| Row 4 | Inference: vLLM latency, waiting requests, tokens/sec, GPU utilization |
| Row 5 | Dependencies: PostgreSQL latency, Redis latency, Azure Blob Storage errors, SSO errors |

### Best Practices

Sampling decisions must reflect business risk. High-volume low-risk spans can be sampled, but error traces, PII masking failures, authorization denials, schema validation failures, and audit result publication failures should be retained at or near 100%. Trace retention should be long enough to support incident review and customer support investigations, typically 30 days for detailed traces and 90 days for aggregated operational data.

### Risks

The primary observability risk is accidental data exposure through logs, traces, metric labels, dashboard variables, or support tools. A second risk is incomplete correlation, where services emit incompatible identifiers and support teams cannot reconstruct incidents. A third risk is dashboard sprawl.

### Recommendations

Adopt an observability contract for every service. The contract should define required metrics, required log fields, required trace attributes, safe labels, redacted fields, retention, and ownership. Add automated checks to prevent unsafe log keys and metric labels. Implement Grafana dashboards as version-controlled JSON or Jsonnet. Establish a weekly operational review during the first quarter to evaluate whether dashboards support real incidents and whether any recurring manual investigation should become a metric, alert, or support view.

## 35. Logging Strategy

### Purpose

The purpose of the logging strategy is to define what Auto QRA records, how it structures records, how long it retains them, and how it protects sensitive information. Logs must support production troubleshooting, auditability, security investigations, compliance reviews, cost analysis, and product improvement. Because Auto QRA processes potentially sensitive audit inputs and model outputs, logging must be structured, minimal, masked, and access-controlled.

### Description

Auto QRA will use structured JSON logs across all application services, workers, model gateway components, security controls, and administrative jobs. Logs will be emitted to standard output from containers, collected by the platform logging agent, and routed to a centralized log backend and SIEM integration. The application will never log raw prompts, raw model outputs, unmasked PII, authentication tokens, secrets, encryption keys, or full request bodies. Instead, it will log stable identifiers, status, timing, counts, versions, and policy outcomes.

### Business Justification

Enterprise customers expect transparent and controlled operation of automated decision systems. Logging provides the evidence required to answer support questions, investigate incidents, and demonstrate compliance with internal controls. Well-designed logs reduce incident duration because engineers can find the failed stage, dependency, and correlation ID quickly. They also reduce privacy risk because teams are not tempted to add ad hoc debugging statements that expose sensitive data.

### Technical Details

All application logs should follow a common schema. The schema should be enforced through shared logging libraries or middleware so services do not invent incompatible fields.

Core log schema:

| Field | Type | Required | Example | Notes |
| --- | --- | --- | --- | --- |
| `timestamp` | RFC3339 string | Yes | `2026-07-17T09:00:00Z` | UTC only |
| `severity` | Enum | Yes | `INFO`, `WARN`, `ERROR`, `SECURITY` | Mapped to backend severity |
| `service` | String | Yes | `audit-worker` | Stable service name |
| `environment` | String | Yes | `prod` | `dev`, `stage`, `prod` |
| `version` | String | Yes | `2026.07.1` | Application version |
| `correlation_id` | String | Yes | `corr_...` | Request or workflow chain |
| `audit_id` | String | Conditional | `aud_...` | Required for audit workflow events |
| `attempt_id` | String | Conditional | `att_...` | Required for retries and worker attempts |
| `tenant_id` | String | Conditional | `tenant_...` | Use approved non-PII tenant identifier |
| `user_id_hash` | String | Conditional | `sha256:...` | Hash only; no raw username or email |
| `event_name` | String | Yes | `audit.inference.completed` | Controlled vocabulary |
| `event_category` | Enum | Yes | `workflow`, `security`, `model`, `data` | Used for routing |
| `status` | Enum | Yes | `success`, `failure`, `denied` | Consistent status values |
| `duration_ms` | Number | Conditional | `1275` | Required for timed operations |
| `dependency` | String | Conditional | `postgres`, `redis`, `vllm`, `azure_blob` | For dependency events |
| `error_code` | String | Conditional | `VLLM_TIMEOUT` | Controlled error code |
| `error_class` | String | Conditional | `TimeoutError` | No full stack at INFO |
| `retryable` | Boolean | Conditional | `true` | For failures |
| `input_tokens` | Number | Conditional | `2500` | Model metadata only |
| `output_tokens` | Number | Conditional | `700` | Model metadata only |
| `model_name` | String | Conditional | `auto-qra-7b-q4` | No dynamic free text |
| `prompt_version` | String | Conditional | `quality-v12` | Supports model auditability |
| `masking_version` | String | Conditional | `pii-masker-v4` | Supports privacy auditability |
| `fields_masked` | Number | Conditional | `18` | Count only |
| `policy_decision` | Enum | Conditional | `allow`, `deny`, `step_up` | Authorization and security |
| `message` | String | Yes | `Audit inference completed` | No sensitive values |

Logging retention table:

| Log category | Examples | Retention hot | Retention archive | Storage target | Access model |
| --- | --- | ---: | ---: | --- | --- |
| Operational application logs | API events, worker events, dependency failures | 30 days | 180 days | Central logging, Azure Blob Storage archive | SRE, engineering support |
| Security logs | SSO failures, authorization denials, policy violations | 90 days | 1 year | SIEM, immutable Azure Blob Storage bucket | Security, compliance |
| Audit logs | User actions, system decisions, approvals, overrides | 1 year | 7 years where policy requires | PostgreSQL plus immutable Azure Blob Storage | Compliance, limited admins |
| Model operation logs | Model version, token counts, latency, validation result | 90 days | 1 year | Central logging, analytics tables | ML platform, SRE |
| Data access logs | Azure Blob Storage object access, DB administrative access | 90 days | 1 year | Cloud audit logs, SIEM | Security, platform |
| Debug logs | Temporary elevated diagnostics | 7 days | None unless incident attached | Central logging | Break-glass only |

Event taxonomy:

| Category | Event examples | Required controls |
| --- | --- | --- |
| Workflow | `audit.submitted`, `audit.masked`, `audit.queued`, `audit.completed`, `audit.failed` | Include correlation and state transition |
| Security | `auth.login.failed`, `authz.denied`, `policy.violation`, `secret.rotated` | Route to SIEM |
| Model | `inference.started`, `inference.completed`, `schema.validation.failed` | Include token counts and model version |
| Data | `result.persisted`, `azure_blob.object.written`, `db.query.slow` | No payload data |
| Admin | `config.changed`, `model.deployed`, `dashboard.updated` | Require actor hash and change ID |

### Best Practices

Logs should be deterministic and machine-readable. Free-form messages can exist for humans, but the operational meaning must be captured in structured fields. Every error should have a stable error code. Every retry should log the reason, attempt number, and next action. Every security denial should log the policy name and decision without logging sensitive resource values. Stack traces should be restricted to error logs and scrubbed for secrets.

### Risks

The highest logging risk is sensitive data leakage from prompts, outputs, or combined partial fields. Other risks are poor retention discipline and unstructured logs, which slow incident response and reduce confidence in automated alerting.

### Recommendations

Implement a shared logging package and schema validation in CI. Add automated tests that fail when unsafe log fields such as `prompt`, `raw_text`, `email`, `phone`, `token`, `secret`, or `authorization` are introduced. Route security and audit events to the SIEM and immutable Azure Blob Storage storage. Configure retention by log category rather than by service alone. Review log samples during production readiness to confirm that PII masking, token redaction, and correlation IDs are working.

## 36. Alerting

### Purpose

The purpose of alerting is to convert monitoring signals into timely, actionable operational response. Auto QRA must meet a target latency of less than 60 seconds and a target availability of 99.9%. Alerting must therefore detect conditions that threaten availability, audit completion, inference latency, data protection, and capacity before they produce large-scale business impact.

### Description

Alerting will use Prometheus Alertmanager integrated with incident management, chat operations, email distribution groups, and security tooling. Alerts will be grouped by service, tenant impact, severity, and environment. The alerting model will distinguish symptoms from causes so paging conditions reflect customer impact while early warnings become tickets.

### Business Justification

Effective alerting protects business operations without exhausting the teams responsible for the service. Over-alerting creates fatigue and causes real incidents to be missed. Under-alerting allows customer impact to continue silently. Auto QRA needs alerts that are tied to service outcomes and risk. Because the platform automates quality review work, delayed or failed audits can affect operational deadlines, customer commitments, and compliance reporting. Security alerts are even more important because PII masking failures or unauthorized access attempts require rapid investigation.

### Technical Details

Alert severity matrix:

| Severity | Definition | Examples | Response target | Notification |
| --- | --- | --- | --- | --- |
| Sev1 | Major production outage, data exposure, or broad inability to process audits | API unavailable, audit completion stopped, PII unmasked high finding, database unavailable | Acknowledge within 5 minutes, restore or mitigate within 60 minutes | Page primary and secondary on-call, incident bridge, leadership notification |
| Sev2 | Material customer-impacting degradation | p99 audit latency > 120s, vLLM failures > 5%, Redis queue age > 300s, one HA node down with load risk | Acknowledge within 15 minutes, mitigate within 4 hours | Page primary on-call, notify service channel |
| Sev3 | Elevated risk or partial degradation with limited impact | p95 audit latency > 60s, GPU memory > 85%, DB connections > 80%, retry rate > 3% | Acknowledge within business day or on-call policy | Ticket plus channel notification |
| Sev4 | Informational or trend-based alert | forecast overrun, low GPU utilization, upcoming certificate expiry | Review in weekly operations | Ticket or dashboard annotation |

Detailed alert threshold catalog:

| Alert name | Expression concept | Severity | Threshold | Duration | Runbook action |
| --- | --- | --- | --- | ---: | --- |
| `AutoQRAApiDown` | API health probe failure | Sev1 | Probe failures from 2 regions | 5m | Check ingress, deployment, auth gateway, rollback if needed |
| `AutoQRAHigh5xxRate` | 5xx / total requests | Sev2 | > 5% | 5m | Inspect release, dependencies, error logs |
| `AutoQRAAuditCompletionStopped` | Completed audit rate | Sev1 | Zero completions while intake > 0 | 10m | Inspect Redis, workers, vLLM, DB |
| `AutoQRAAuditLatencySLOBurn` | Audit duration p95 | Sev3 | p95 > 60s | 15m | Check queue age and inference latency |
| `AutoQRAAuditLatencyCritical` | Audit duration p99 | Sev2 | p99 > 120s | 10m | Scale workers or route traffic |
| `AutoQRAQueueBacklogCritical` | Oldest queued audit age | Sev2 | > 300s | 10m | Add workers, check Redis, check vLLM |
| `AutoQRAVLLMWaitingRequestsHigh` | vLLM waiting requests | Sev3 | > 20 | 10m | Check GPU saturation and batching |
| `AutoQRAVLLMFailureRateHigh` | vLLM failures / total | Sev2 | > 5% | 5m | Inspect model server logs and GPU errors |
| `AutoQRAGPUXidError` | DCGM XID error | Sev2 | Any repeated error | 1m | Drain node and replace GPU VM |
| `AutoQRAGPUMemoryCritical` | GPU memory used | Sev2 | > 95% | 5m | Reduce max batch or scale GPU workers |
| `AutoQRAPostgresUnavailable` | DB health check | Sev1 | Primary unavailable | 2m | Failover Azure Database for PostgreSQL, pause writes if needed |
| `AutoQRAPostgresConnectionSaturation` | Connections / max | Sev3 | > 80% | 15m | Check pool size and slow queries |
| `AutoQRARedisEvictions` | Redis evictions | Sev2 | > 0 in production queue DB | 5m | Increase memory, inspect key TTLs |
| `AutoQRAPIIMaskingFailure` | Masking failures / attempts | Sev1 | > 2% or any high-risk failure | 5m | Stop processing affected workflow and investigate |
| `AutoQRAAuditLogWriteFailure` | Audit log write errors | Sev1 | Any repeated event | 5m | Fail closed for regulated actions |
| `AutoQRASecretRotationOverdue` | Secret age | Sev4/Sev3 | > 60 days warning, > 90 days critical | 1d | Rotate secret |

Example Prometheus alert rule definitions:

| Rule | PromQL concept |
| --- | --- |
| Audit p95 latency | `histogram_quantile(0.95, sum(rate(auto_qra_audit_duration_seconds_bucket[5m])) by (le)) > 60` |
| API 5xx rate | `sum(rate(auto_qra_api_requests_total{status=~"5.."}[5m])) / sum(rate(auto_qra_api_requests_total[5m])) > 0.05` |
| Queue age critical | `max(auto_qra_audit_queue_age_seconds) > 300` |
| vLLM failure rate | `sum(rate(vllm:request_failure_total[5m])) / (sum(rate(vllm:request_failure_total[5m])) + sum(rate(vllm:request_success_total[5m]))) > 0.05` |
| GPU memory critical | `max(DCGM_FI_DEV_FB_USED / DCGM_FI_DEV_FB_TOTAL) > 0.95` |

### Best Practices

Alerts should be actionable, owned, and documented. Every paging alert should have a runbook, dashboard link, likely causes, mitigation steps, rollback guidance, and escalation path. Alert grouping should prevent storms during dependency failures, and maintenance windows should annotate dashboards through controlled change records.

### Risks

Alert fatigue is a significant risk. If GPU utilization, queue depth, or latency alerts are tuned too aggressively before real traffic is understood, on-call teams may ignore alerts. The opposite risk is thresholds that are too loose, allowing the 60-second latency target to be missed for many audits. Security alert handling carries additional risk because delayed response to PII masking failures can increase compliance exposure.

### Recommendations

Start with a small number of high-confidence paging alerts: API down, audit completion stopped, critical audit latency, database unavailable, Redis evictions, vLLM failure rate, PII masking failure, and audit log write failure. Add warning alerts for queue age, GPU saturation, connection saturation, and cost trend. Review alerts weekly for the first 60 days. Require every Sev1 and Sev2 incident to produce an alert quality review: did the alert fire, did it fire at the right time, was it actionable, and should it be changed?

## 37. Security Architecture

### Purpose

The purpose of the security architecture is to protect Auto QRA data, models, infrastructure, identities, and audit decisions. Auto QRA processes enterprise audit inputs, intermediate prompts, model outputs, quality scores, reviewer actions, and operational metadata. These assets may include PII and confidential business information. The architecture must enforce least privilege, zero trust, encryption, masking, auditability, and defense in depth.

### Description

Auto QRA security is built around identity-aware access, network segmentation, encrypted data paths, controlled model serving, PII masking, and immutable audit records. Users authenticate through enterprise SSO. Application services validate identity and authorization for each action. Service-to-service communication uses workload identity and mutual authentication where supported. The zero-trust model means no network location, service, user, or workload is trusted implicitly.

### Business Justification

Security is a prerequisite for enterprise adoption. Auto QRA is likely to handle regulated or sensitive operational data. A breach, PII exposure, or unauthorized model access would harm customers, create regulatory and contractual risk, and undermine confidence in automation. Strong security architecture also enables broader deployment because legal, compliance, security, and procurement teams can review clear controls rather than relying on informal operational practices.

### Technical Details

Security architecture:

```mermaid
flowchart LR
    User[Enterprise User] --> SSO[SSO / Identity Provider]
    SSO --> Gateway[Identity-Aware API Gateway]
    Gateway --> AuthZ[Policy and Authorization Service]
    AuthZ --> App[Auto QRA API Services]
    App --> Mask[PII Masking and DLP Validation]
    Mask --> Queue[Redis Private Queue]
    Queue --> Worker[Audit Worker Pool]
    Worker --> VLLM[vLLM Model Serving Tier]
    VLLM --> GPU[GPU Nodes: L40 or A100]
    Worker --> PG[(PostgreSQL / Azure Database for PostgreSQL)]
    Worker --> AzureBlobStorage[(Azure Blob Storage Encrypted Buckets)]
    App --> PG
    App --> AzureBlobStorage
    App --> Logs[Central Logs and SIEM]
    Worker --> Logs
    VLLM --> Metrics[Prometheus / Grafana]
    App --> Metrics
    KMS[Azure Key Vault] --> PG
    KMS --> AzureBlobStorage
    KMS --> App
    Admin[Privileged Admin] --> PAM[Privileged Access Workflow]
    PAM --> Gateway```

Security control matrix:

| Control domain | Required control | Implementation | Evidence |
| --- | --- | --- | --- |
| Identity | SSO required | SAML/OIDC through enterprise IdP | Login logs, IdP policy |
| Authorization | Least privilege RBAC/ABAC | Role and tenant scoped policies | Authorization decision logs |
| Service identity | Workload identity | Azure service accounts with minimal IAM | IAM inventory |
| Network | Private service access | VNet, firewall rules, private endpoints | Network policy export |
| Transport encryption | TLS everywhere | TLS 1.2+ external, mTLS or workload identity internal | TLS scan, config |
| At-rest encryption | Encrypted databases and buckets | Azure Key Vault-managed keys where required | KMS key policy |
| PII protection | Mask before inference | PII masking service and DLP validation | Masking metrics and logs |
| Secrets | Managed secrets | Azure Key Vault, no secrets in code | Secret access logs |
| Auditability | Immutable audit trail | PostgreSQL audit table plus Azure Blob Storage retention lock | Audit records |
| Model isolation | No direct model access | vLLM private endpoint only | Firewall and IAM |
| Admin access | Privileged access management | Just-in-time access, MFA, break-glass logs | PAM records |
| Monitoring | Security event routing | SIEM integration | Alert history |

Zero-trust recommendations:

| Principle | Auto QRA recommendation |
| --- | --- |
| Verify explicitly | Validate user identity, device posture where available, tenant authorization, service identity, and request policy on every action. |
| Use least privilege | Separate roles for reviewer, auditor, administrator, ML operator, SRE, and security investigator. Grant data access by tenant and purpose. |
| Assume breach | Segment vLLM, Redis, PostgreSQL, and Azure Blob Storage. Rotate credentials. Monitor anomalous access. Keep immutable audit records. |
| Minimize data | Mask PII before prompts, store only required evidence, and avoid sensitive data in logs or metrics. |
| Continuous evaluation | Route security events to SIEM, review access quarterly, and use automated policy checks in CI/CD. |

### Best Practices

Security design should fail closed for regulated or sensitive workflows. If PII masking fails, the audit should not proceed to model inference. If audit logging fails for an action that must be recorded, the action should be blocked or queued for controlled recovery. Encryption should use managed services and centralized key control, and secrets should be rotated rather than mounted broadly into containers.

### Risks

The largest security risk is PII entering the model or observability layers without masking. Another risk is excessive service account privileges, especially for workers that access queues, databases, buckets, and model endpoints. Misconfigured Azure Blob Storage permissions can expose stored review artifacts. Model-serving endpoints can become an exfiltration or abuse path if they are reachable outside the trusted worker tier. Logging systems can also become a secondary data exposure channel.

### Recommendations

Implement a security readiness checklist before production. Require threat modeling for the audit workflow, model serving path, data storage path, and administrative path. Deploy PII masking as a hard gate before inference. Use private networking for Redis, PostgreSQL, Azure Blob Storage access paths, and vLLM. Configure SSO, MFA, role-based access, and tenant scoping. Route security logs to SIEM and require quarterly access reviews. Add automated policy checks for IAM, bucket public access, encryption settings, and logging redaction.

## 38. Disaster Recovery

### Purpose

The purpose of disaster recovery is to define how Auto QRA will restore service after severe failures such as regional infrastructure outages, database corruption, accidental deletion, security incidents, failed deployments, or widespread dependency outages. Disaster recovery planning ensures that quality review operations can continue or resume within agreed business tolerances.

### Description

Auto QRA has a target availability of 99.9%, but disaster recovery addresses events that exceed normal high-availability mechanisms. DR planning covers recovery time objective, recovery point objective, failover process, backup restoration, data integrity verification, security validation, and business communication across application services, PostgreSQL, Redis, Azure Blob Storage, vLLM, observability, and audit logs.

### Business Justification

Quality review operations may be tied to customer commitments, regulatory workflows, and operational deadlines. A prolonged outage could force manual processing, delay decisions, and reduce trust in automation. Data loss would be more serious because it could compromise audit evidence, reviewer actions, and compliance records. DR planning reduces business interruption, defines recovery priorities, and provides confidence that the system can be restored under pressure.

### Technical Details

RTO/RPO table:

| Component | Business role | RTO target | RPO target | Recovery method | Priority |
| --- | --- | ---: | ---: | --- | --- |
| Public API and UI services | Intake and review access | 1 hour | 15 minutes for in-flight state | Redeploy to healthy zone/region using IaC | P1 |
| Audit workflow state in PostgreSQL | Source of truth for audits | 1 hour | <= 5 minutes | Azure Database for PostgreSQL PITR, HA failover, cross-region backup | P1 |
| Immutable audit logs | Compliance evidence | 4 hours | Near zero after write | Azure Blob Storage versioning, retention lock, replicated archive | P1 |
| Azure Blob Storage result artifacts | Stored model outputs and evidence | 4 hours | <= 15 minutes | Bucket versioning and replication | P1 |
| Redis queues | Work dispatch | 30 minutes | <= 15 minutes where persistence supported | Rebuild from PostgreSQL pending states | P2 |
| vLLM serving tier | Inference execution | 1 hour | None for stateless runtime | Recreate GPU nodes, reload model artifacts | P1 |
| Model artifacts | Required inference assets | 4 hours | <= 24 hours for model releases | Store in versioned Azure Blob Storage artifact bucket | P1 |
| Observability stack | Operations visibility | 4 hours | <= 1 hour | Managed metrics retention, dashboard-as-code restore | P2 |
| Billing and cost exports | Cost governance | 24 hours | <= 24 hours | Cloud billing export retention | P3 |
| Superset or analytics | Reporting and analysis | 24 hours | <= 24 hours | Database backups, IaC redeploy | P3 |

Disaster scenarios and response:

| Scenario | Expected impact | DR response |
| --- | --- | --- |
| Single zone outage | Reduced capacity, possible worker interruption | HA topology shifts workload to remaining zones; autoscaler replaces nodes |
| Regional outage | API, workers, GPU, and database in region unavailable | Activate regional DR runbook, restore services in secondary region, promote replicated data |
| Database corruption | Audit state unreliable | Stop writes, restore PITR to clean timestamp, reconcile Azure Blob Storage artifacts |
| Azure Blob Storage object deletion | Missing result artifacts | Restore object versions or replicated archive |
| Failed deployment | Elevated errors or stopped processing | Roll back application version and model config |
| Security incident | Potential data exposure | Isolate affected services, revoke credentials, preserve logs, restore from trusted images |
| GPU capacity shortage | Inference degraded | Shift to alternate GPU type, reduce model size, prioritize queues |

### Best Practices

DR must be tested, not just documented. At minimum, the team should conduct quarterly tabletop exercises and semiannual technical recovery tests covering PostgreSQL PITR, Azure Blob Storage object restore, vLLM redeployment, Redis queue reconstruction, and full synthetic audit processing in the recovered environment.

### Risks

The main DR risk is assuming managed service high availability is the same as disaster recovery. HA protects against many local failures, but it does not automatically solve accidental deletion, application-level corruption, bad deployments, or regional outages. Another risk is unrecoverable queue state if pending audits exist only in Redis. A third risk is model artifact drift, where the restored environment loads a different model or prompt version than the original workflow expected.

### Recommendations

Set formal DR targets of RTO 1 hour and RPO 5 minutes for PostgreSQL-backed audit state, RTO 4 hours and RPO 15 minutes for Azure Blob Storage artifacts, and RTO 1 hour for vLLM serving capacity. Persist audit state transitions in PostgreSQL before queue dispatch. Enable Azure Database for PostgreSQL high availability and point-in-time recovery. Enable Azure Blob Storage versioning and retention for audit artifacts. Keep deployment manifests, Grafana dashboards, Prometheus rules, and model-serving configuration in version control. Run a full DR exercise before production launch and repeat at least twice per year.

## 39. Backup Strategy

### Purpose

The purpose of the backup strategy is to preserve Auto QRA data, configuration, and evidence so the system can recover from data loss, corruption, accidental deletion, failed deployments, and compliance review needs. The backup strategy covers PostgreSQL databases, Azure Blob Storage artifacts, model artifacts, configuration, audit logs, dashboards, alert rules, and operational metadata.

### Description

Backups will use managed service backups, versioned object storage, infrastructure-as-code repositories, configuration exports, and immutable audit archives. PostgreSQL will use automated backups and point-in-time recovery. Azure Blob Storage buckets will use object versioning, lifecycle rules, and retention policies. Redis queue state will be reconstructable from PostgreSQL rather than treated as the primary durable store.

### Business Justification

Backups protect the continuity and integrity of quality review operations. Completed audits, reviewer decisions, and audit logs may be needed for contractual, compliance, or internal governance reasons. Losing these records could be more damaging than a temporary outage. Backups also protect the organization from operational mistakes such as accidental deletion, schema migration defects, or incorrect lifecycle policies.

### Technical Details

Backup schedule:

| Asset | Backup mechanism | Frequency | Retention | Encryption | Restore test |
| --- | --- | ---: | ---: | --- | --- |
| PostgreSQL primary database | Azure Database for PostgreSQL automated backup plus PITR | Continuous WAL, daily full | 35 days PITR, monthly snapshots 1 year | Azure Key Vault where required | Monthly PITR test |
| PostgreSQL logical export | `pg_dump` or managed export for selected schemas | Weekly | 13 weeks | Encrypted Azure Blob Storage bucket | Quarterly |
| Azure Blob Storage audit artifacts | Versioning, retention lock, optional cross-region replication | Continuous on write | 1-7 years by policy | CMEK where required | Quarterly object restore |
| Azure Blob Storage model artifacts | Versioned model registry bucket | On release | Keep all production releases, archive retired models | CMEK where required | Semiannual |
| Audit logs | Immutable Azure Blob Storage archive and SIEM retention | Continuous | 7 years where required | CMEK and retention lock | Quarterly sample retrieval |
| Redis operational queue | Reconstruct from PostgreSQL pending states | Not primary backup | Not applicable | Private encrypted service | Monthly queue rebuild drill |
| Grafana dashboards | Git repository JSON/Jsonnet | On change | Full Git history | Repository controls | On environment rebuild |
| Prometheus rules | Git repository YAML | On change | Full Git history | Repository controls | On environment rebuild |
| Secrets metadata | Azure Key Vault versions and rotation records | On change | Per security policy | Managed encryption | Quarterly access review |
| Infrastructure configuration | Terraform or equivalent IaC | On change | Full Git history | Repository controls | Semiannual rebuild |

Backup classification:

| Data class | Examples | Backup requirement | Restore restriction |
| --- | --- | --- | --- |
| Critical regulated data | Audit logs, reviewer actions, completed audit records | Immutable, long retention, access reviewed | Production or approved compliance environment only |
| Business operational data | Audit state, workflow metadata, reports | PITR and periodic snapshots | Mask before lower environment restore |
| Model assets | Quantized 3B/7B model files, tokenizer, prompt templates | Versioned and reproducible | Restore only approved versions |
| Observability data | Metrics, logs, traces | Retain per operational policy | Redacted access only |
| Configuration | Dashboards, alert rules, deployment manifests | Git history and release tags | Standard change management |

### Best Practices

Backups should be automated, monitored, and tested. Backup jobs should emit metrics for success, failure, duration, size, and age; restore tests should verify that applications can use the restored data correctly. Backup access must follow least privilege and restoration into lower environments should use masked or synthetic data.

### Risks

The main backup risk is silent failure. If backup failures are not monitored, the organization may discover missing backups only during an incident. Another risk is incomplete backup scope, especially missing dashboards, alert rules, model artifacts, prompt templates, or configuration needed to recreate production behavior. Sensitive backup exposure is also a major risk because backup stores often become broad-access convenience repositories if not governed.

### Recommendations

Adopt a backup control framework with defined asset owners, retention schedules, restore procedures, and test evidence. Enable Azure Database for PostgreSQL PITR, daily backups, and monthly retained snapshots. Enable Azure Blob Storage versioning and retention for audit artifacts. Store model artifacts in versioned Azure Blob Storage buckets. Treat Redis as reconstructable from durable audit state. Add backup age and success metrics to Prometheus and Grafana. Conduct monthly database restore tests and quarterly full workflow recovery tests.

## 40. High Availability

### Purpose

The purpose of high availability is to keep Auto QRA operational during common infrastructure failures such as node loss, zone degradation, application crashes, rolling deployments, and individual GPU worker failure. The target availability is 99.9%, which requires architecture choices that avoid single points of failure across API services, workers, queues, databases, storage, identity integration, and inference.

### Description

Auto QRA high availability is implemented through redundant stateless services, managed HA data services, durable workflow state, multiple worker replicas, N+1 GPU capacity, private networking, health checks, and controlled failover. API services and workers run across multiple zones, PostgreSQL uses Azure Database for PostgreSQL high availability, and vLLM GPU workers run as a pool with at least one spare unit above calculated peak requirement.

### Business Justification

Auto QRA supports operational quality processes that may have daily deadlines. Even though the average load is approximately 2,000 audits per day, enterprise traffic will not arrive evenly. Business users may submit batches during working hours, after upstream data loads, or near reporting deadlines. HA prevents routine infrastructure events from causing missed review windows. It also supports planned maintenance and deployments without requiring downtime.

### Technical Details

Recommended HA topology:

```mermaid
flowchart TB
    subgraph Region[Azure Primary Region]
        subgraph ZoneA[Zone A]
            APIA[API Pods]
            WorkA[Worker Pods]
            GPUA[vLLM GPU Node A]
        end
        subgraph ZoneB[Zone B]
            APIB[API Pods]
            WorkB[Worker Pods]
            GPUB[vLLM GPU Node B]
        end
        LB[Global / Regional Load Balancer]
        Redis[(Redis Azure Cache for Redis HA)]
        PG[(Azure Database for PostgreSQL PostgreSQL HA)]
        AzureBlobStorage[(Azure Blob Storage Buckets)]
        Prom[Prometheus]
        Graf[Grafana]
    end
    User[Users via SSO] --> LB
    LB --> APIA
    LB --> APIB
    APIA --> Redis
    APIB --> Redis
    WorkA --> Redis
    WorkB --> Redis
    WorkA --> GPUA
    WorkB --> GPUB
    APIA --> PG
    APIB --> PG
    WorkA --> PG
    WorkB --> PG
    WorkA --> AzureBlobStorage
    WorkB --> AzureBlobStorage
    GPUA --> Prom
    GPUB --> Prom
    Prom --> Graf```

HA design by component:

| Component | HA design | Failure behavior |
| --- | --- | --- |
| API services | Minimum 2 replicas across zones, readiness/liveness checks | Load balancer routes to healthy pods |
| Audit workers | Minimum 2 replicas across zones, idempotent processing | Failed job retried from durable state |
| vLLM GPU workers | N+1 GPU nodes, private endpoint, health probes | Scheduler routes to healthy model endpoint |
| Redis | Managed HA tier, persistence where applicable | Failover to replica; rebuild queue from PostgreSQL if needed |
| PostgreSQL | Azure Database for PostgreSQL HA primary/standby, PITR | Automated failover; application reconnects |
| Azure Blob Storage | Regional or dual-region bucket based on DR policy | Storage remains available through zone failures |
| SSO | Enterprise IdP plus token caching policy | Existing sessions continue within risk limits |
| Monitoring | Redundant collectors where feasible | Alerts on observability impairment |

Concurrency calculation for HA:

| Item | Formula | Result |
| --- | --- | ---: |
| Peak audit arrival rate | 2,000 audits/day x 3 / 24 / 60 | 4.17 audits/minute |
| Target completion time | Given | 60 seconds |
| Average concurrent audits at peak | 4.17 audits/minute x 1 minute | 4.17 audits |
| Retry and burst factor | Assumption | 2x |
| Design concurrent audit target | 4.17 x 2 | 8.34, rounded to 10 audits |
| HA requirement | Operate after losing one GPU node | N+1 |

The system should therefore be designed to process at least 10 concurrent audit workflows while still meeting the 60-second target. This is not a high application concurrency requirement, but GPU model serving and batch arrival behavior can create short bursts. The GPU sizing section provides detailed inference capacity calculations.

### Best Practices

HA should be tested through failure injection and controlled maintenance events. Application services should be stateless; workers should be idempotent; database writes should use transactions around state changes; and queue operations should be paired with durable state in PostgreSQL. Model rollouts should use canaries and avoid replacing all vLLM servers simultaneously.

### Risks

The main HA risk is hidden single points of failure. A single Redis instance, single GPU node, single NAT path, single service account, or single database connection pool can reduce practical availability. Another risk is retry amplification. If a dependency slows down, aggressive retries can increase load and make the outage worse. Model-serving HA has a special risk because GPU capacity is expensive; cost pressure can lead teams to run without N+1 headroom.

### Recommendations

Run at least two API replicas, two worker replicas, and two vLLM GPU nodes in production, even if average load could fit on one node. Use N+1 GPU capacity so the platform can absorb a single GPU node failure during peak. Use Azure Database for PostgreSQL HA, Redis HA, private networking, and Azure Blob Storage versioning. Implement idempotent workers and durable audit state. Conduct quarterly HA tests, including killing one application pod, draining one GPU node, simulating Redis failover, and validating Azure Database for PostgreSQL failover behavior.

## 41. Capacity Planning

### Purpose

The purpose of capacity planning is to translate business volume, token usage, latency targets, and availability requirements into compute, memory, storage, database, queue, network, and GPU capacity. Auto QRA must support 60,000 audits per month, approximately 2,000 audits per day, 192,000,000 tokens per month, and a latency target of less than 60 seconds per audit.

### Description

Capacity planning for Auto QRA uses average load, peak load, burst load, retry load, and HA headroom. The baseline assumption is a 3x peak over daily average, with a separate 2x burst and retry factor for concurrent workflow sizing. GPU capacity is sized using assumed throughput per GPU for quantized 3B and 7B models on L40 48GB and A100 80GB GPU instances on Azure.

### Business Justification

Capacity planning prevents under-provisioning that causes audit delays and over-provisioning that wastes GPU and database spend. Because GPU resources are the dominant cost driver, capacity planning must use explicit math, conservative assumptions, and N+1 HA headroom.

### Technical Details

Token and audit volume math:

| Metric | Formula | Result |
| --- | --- | ---: |
| Audits per month | Given | 60,000 |
| Average audits per day | 60,000 / 30 | 2,000 |
| Average audits per hour | 2,000 / 24 | 83.3 |
| Average audits per minute | 83.3 / 60 | 1.39 |
| Tokens per audit | 2,500 input + 700 output | 3,200 |
| Monthly tokens | 60,000 x 3,200 | 192,000,000 |
| Daily tokens | 2,000 x 3,200 | 6,400,000 |
| Hourly average tokens | 6,400,000 / 24 | 266,667 |
| Peak multiplier | Assumption | 3x |
| Peak hourly tokens | 266,667 x 3 | 800,000 |
| Peak minute tokens | 800,000 / 60 | 13,333 |
| Peak second tokens | 13,333 / 60 | 222 |

Concurrent audit math:

| Metric | Formula | Result |
| --- | --- | ---: |
| Peak audits/hour | 83.3 x 3 | 250 |
| Peak audits/minute | 250 / 60 | 4.17 |
| Target latency | Given | 60 seconds |
| Concurrent audits at target | 4.17 audits/min x 1 min | 4.17 |
| Burst/retry factor | Assumption | 2x |
| Design concurrency | 4.17 x 2 | 8.34 |
| Rounded workflow concurrency | Engineering target | 10 concurrent audits |
| Recommended queue buffer | 30 minutes at peak | 250 / 2 = 125 queued audits |
| Stress queue buffer | 2 hours at peak | 250 x 2 = 500 queued audits |

Storage capacity math:

| Item | Assumption | Monthly estimate | Annual estimate |
| --- | ---: | ---: | ---: |
| Audit metadata in PostgreSQL | 10 KB/audit | 60,000 x 10 KB = 600 MB | 7.2 GB |
| Structured model result | 25 KB/audit | 1.5 GB | 18 GB |
| Masked prompt and response artifact in Azure Blob Storage | 50 KB/audit | 3.0 GB | 36 GB |
| Audit logs and workflow events | 20 events x 1 KB x 60,000 | 1.2 GB | 14.4 GB |
| Trace/log overhead | 5 KB/audit sampled average | 300 MB | 3.6 GB |
| Index and database overhead | 2x data estimate | 4.2 GB/month effective DB growth | 50 GB/year effective |

Capacity sizing baseline:

| Layer | Baseline capacity | Production recommendation |
| --- | --- | --- |
| API | 2-4 vCPU, 8-16 GB RAM per replica | 2 replicas minimum, autoscale to 6 |
| Workers | 4-8 vCPU, 16-32 GB RAM per replica | 2 replicas minimum, autoscale to 8 |
| vLLM | 1 GPU per model-serving node | 2 GPU nodes minimum for N+1 |
| Redis | 5-10 GB memory | HA tier, no eviction for queues |
| PostgreSQL | 4-8 vCPU, 16-32 GB RAM | Azure Database for PostgreSQL HA, 100-250 GB SSD initial |
| Azure Blob Storage | Versioned bucket | Lifecycle to archive after retention window |
| Superset | 2-4 vCPU, 8-16 GB RAM | 2 replicas if business critical |
| Prometheus | 4 vCPU, 16 GB RAM | Retention tuned by cardinality |

### Best Practices

Capacity planning should be reviewed monthly during the first quarter and quarterly after traffic stabilizes. The review should compare forecasted audits, actual audits, token volume, p95 latency, GPU utilization, queue age, database growth, storage growth, and cost per audit. Production should target 50-70% average GPU utilization during business peaks when N+1 capacity is included.

### Risks

The main capacity risk is workload burstiness. Although the average rate is only 1.39 audits per minute, upstream batch submissions can produce higher short-term demand. Another risk is token creep. If prompt templates grow from 2,500 input tokens to 5,000 input tokens, monthly token volume nearly doubles. Retry storms can also multiply demand during dependency issues. Database growth can become a long-term risk if audit artifacts are stored in PostgreSQL rather than Azure Blob Storage.

### Recommendations

Use 3x average as the initial peak assumption and 2x additional factor for burst/retry concurrency. Size production for at least 10 concurrent audit workflows and 500 queued audits without degradation. Start with two GPU nodes for N+1 HA, two API replicas, two worker replicas, Redis HA, and Azure Database for PostgreSQL HA. Track actual tokens per audit and use it as a scaling input. Keep large artifacts in Azure Blob Storage and store structured metadata in PostgreSQL. Review capacity after 30, 60, and 90 days of production traffic.

## 42. Performance Estimation

### Purpose

The purpose of performance estimation is to predict whether Auto QRA can meet the target latency of less than 60 seconds per audit under average, peak, and failure-mode conditions. Performance estimation connects audit volume, token counts, queueing, inference throughput, database writes, storage operations, and post-processing into an end-to-end latency model.

### Description

Auto QRA performance is dominated by model inference but also includes PII masking, prompt assembly, queue wait time, result validation, database persistence, Azure Blob Storage writes, and notification. The baseline audit contains 2,500 input tokens and 700 output tokens, for 3,200 total tokens; vLLM improves throughput through batching, but latency still depends on model size, quantization, GPU type, batch shape, and concurrency.

### Business Justification

Performance directly affects user trust and operational adoption. If audits complete in less than 60 seconds, users can integrate Auto QRA into daily review workflows. If latency becomes unpredictable, teams may revert to manual review or create workarounds. Performance estimation also supports cost planning because larger models and lower latency targets often require more GPU capacity.

### Technical Details

End-to-end latency budget:

| Stage | Target p95 | Notes |
| --- | ---: | --- |
| API authentication and intake | 1.5s | Includes SSO token validation and request validation |
| PII masking and DLP validation | 5s | Depends on document length and detector configuration |
| Prompt construction and token estimation | 1s | Template and policy lookup |
| Queue wait | 5s | Should remain low under normal peak |
| vLLM inference | 40s | Dominant stage; varies by model and GPU |
| Result validation and scoring | 2s | JSON schema and business rules |
| PostgreSQL and Azure Blob Storage persistence | 3s | Includes audit state and artifact write |
| Notification or UI availability | 2s | Event publication and cache update |
| Total target | < 60s | p95 operating target |

Throughput assumptions for performance modeling:

| Model | GPU | Quantization | Assumed effective tokens/sec per GPU | Assumed audits/min per GPU | Basis |
| --- | --- | --- | ---: | ---: | --- |
| 3B | L40 48GB | 4-bit or 8-bit | 1,200-1,800 tok/s | 22.5-33.8 | Conservative sustained vLLM batching estimate |
| 3B | A100 80GB | 4-bit or 8-bit | 2,000-3,000 tok/s | 37.5-56.3 | Higher memory bandwidth and tensor throughput |
| 7B | L40 48GB | 4-bit or 8-bit | 500-900 tok/s | 9.4-16.9 | Conservative for longer prompts and decode |
| 7B | A100 80GB | 4-bit or 8-bit | 900-1,600 tok/s | 16.9-30.0 | Better batching and memory headroom |

The audits per minute calculation uses:

`audits_per_minute = (effective_tokens_per_second x 60) / 3,200 tokens_per_audit`

For the lowest assumed 7B L40 case:

| Formula | Result |
| --- | ---: |
| Effective tokens/sec | 500 |
| Tokens/min | 500 x 60 = 30,000 |
| Tokens/audit | 3,200 |
| Audits/min per GPU | 30,000 / 3,200 = 9.375 |
| Peak required audits/min | 4.17 |
| Headroom before HA | 9.375 / 4.17 = 2.25x |

Queueing estimate:

| Condition | Arrival rate | Service rate per GPU | Utilization with 1 GPU | Utilization with 2 GPUs |
| --- | ---: | ---: | ---: | ---: |
| Average load | 1.39 audits/min | 9.4 audits/min lowest case | 15% | 7% |
| 3x peak | 4.17 audits/min | 9.4 audits/min lowest case | 44% | 22% |
| 3x peak plus 2x burst | 8.34 audits/min | 9.4 audits/min lowest case | 89% | 44% |
| One node failed with 2-node N+1 | 4.17 audits/min | 9.4 audits/min remaining | 44% | Not applicable |

This math shows that even the conservative 7B-on-L40 assumption can satisfy the planned peak on one GPU, but a single GPU would not provide HA. Two GPU nodes provide N+1 availability and support burst/retry conditions with much lower queueing risk.

### Best Practices

Performance should be measured using realistic prompts, output constraints, and production-like batching. Tests should include short audits, average audits, long audits, and malformed inputs, and should report p50, p95, p99, queue wait, time to first token, total inference latency, output token count, schema validation failures, retry rate, and GPU utilization. Prompt and output governance should enforce maximum input length, structured output schemas, and concise responses.

### Risks

Performance estimates can be wrong if prompts change, quantization quality requires a larger model, output length grows, or traffic is burstier than expected. Database or Azure Blob Storage latency can also become visible as inference improves. GPU scale-to-zero is not acceptable because model loading can exceed the 60-second audit target.

### Recommendations

Do not scale production GPU serving to zero. Keep at least two warm GPU nodes. Use the 7B L40 conservative case for initial capacity planning because it is the lowest-throughput supported option. Benchmark both 3B and 7B quantized models on L40 and A100 using representative prompts before final hardware commitment. Set performance gates for each model release: p95 audit latency < 60 seconds, p99 inference latency < 60 seconds, schema validation failure < 1%, and retry rate < 3%.

## 43. GPU Sizing

### Purpose

The purpose of GPU sizing is to determine the number and type of GPU instances required to serve Auto QRA inference using vLLM with quantized 3B and 7B models on Azure. The sizing must meet the target latency of less than 60 seconds, support 60,000 audits per month, provide N+1 high availability, and leave headroom for peak traffic and retries.

### Description

Auto QRA inference will use vLLM and quantized 3B or 7B models. Candidate GPUs are L40 48GB and A100 80GB. L40 is cost-effective for moderate inference workloads, while A100 provides higher memory bandwidth, more memory headroom, and higher throughput. The initial recommendation is two L40 GPU nodes for production N+1 HA, with A100 reserved for stricter latency, larger models, or heavier concurrency.

### Business Justification

GPU sizing is the largest direct infrastructure cost decision for Auto QRA. Undersizing GPU capacity can cause missed latency targets and manual fallback, while over-sizing increases monthly spend. N+1 GPU capacity is justified because the service target is 99.9% availability and model serving is mission-critical to audit completion.

### Technical Details

Baseline workload:

| Item | Value |
| --- | ---: |
| Audits/month | 60,000 |
| Audits/day average | 2,000 |
| Tokens/audit | 3,200 |
| Tokens/month | 192,000,000 |
| Tokens/day | 6,400,000 |
| Peak multiplier | 3x |
| Peak audits/minute | 4.17 |
| Burst/retry design audits/minute | 8.34 |
| Target latency | < 60 seconds |

GPU throughput assumptions are deliberately conservative and represent effective end-to-end serving throughput under vLLM with quantized models, moderate batching, 3,200-token audits, and enterprise safety overhead. Actual throughput must be benchmarked before production commitment.

GPU sizing table:

| Model | GPU | Effective tok/s per GPU | Audits/min per GPU formula | Audits/min per GPU | GPUs for 3x peak | GPUs for 3x peak + burst | Recommended prod GPUs with N+1 |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: |
| 3B quantized | L40 48GB | 1,200 low / 1,800 high | tok/s x 60 / 3,200 | 22.5-33.8 | 1 | 1 | 2 |
| 3B quantized | A100 80GB | 2,000 low / 3,000 high | tok/s x 60 / 3,200 | 37.5-56.3 | 1 | 1 | 2 |
| 7B quantized | L40 48GB | 500 low / 900 high | tok/s x 60 / 3,200 | 9.4-16.9 | 1 | 1 | 2 |
| 7B quantized | A100 80GB | 900 low / 1,600 high | tok/s x 60 / 3,200 | 16.9-30.0 | 1 | 1 | 2 |

Detailed formula for required GPUs:

`required_gpus = ceil(required_audits_per_minute / audits_per_minute_per_gpu)`

For conservative 7B L40 at 3x peak:

| Step | Formula | Result |
| --- | --- | ---: |
| Required audits/min | 250 audits/hour / 60 | 4.17 |
| Per-GPU throughput | 500 tok/s x 60 / 3,200 | 9.375 audits/min |
| GPUs before HA | ceil(4.17 / 9.375) | 1 |
| N+1 production GPUs | 1 + 1 spare | 2 |

For conservative 7B L40 at 3x peak plus 2x burst/retry:

| Step | Formula | Result |
| --- | --- | ---: |
| Required audits/min | 4.17 x 2 | 8.34 |
| Per-GPU throughput | 9.375 audits/min | 9.375 |
| GPUs before HA | ceil(8.34 / 9.375) | 1 |
| N+1 production GPUs | 1 + 1 spare | 2 |
| Utilization with 2 GPUs | 8.34 / (9.375 x 2) | 44.5% |

Memory assumptions:

| Model | Quantization | Estimated model memory | KV/cache and overhead | L40 48GB fit | A100 80GB fit |
| --- | --- | ---: | ---: | --- | --- |
| 3B | 4-bit | 2-4 GB | 8-20 GB depending batch/context | Yes | Yes |
| 3B | 8-bit | 4-8 GB | 8-20 GB depending batch/context | Yes | Yes |
| 7B | 4-bit | 5-8 GB | 12-30 GB depending batch/context | Yes | Yes |
| 7B | 8-bit | 8-14 GB | 12-30 GB depending batch/context | Yes | Yes |

Recommended vLLM configuration starting points:

| Parameter | 3B L40 | 7B L40 | 3B A100 | 7B A100 |
| --- | ---: | ---: | ---: | ---: |
| `gpu_memory_utilization` | 0.80 | 0.80 | 0.85 | 0.85 |
| `max_model_len` | 4,096-8,192 | 4,096-8,192 | 8,192 | 8,192 |
| `max_num_seqs` | 16-32 | 8-16 | 32-64 | 16-32 |
| Initial replicas | 2 | 2 | 2 | 2 |
| Scale-out trigger | Waiting requests or p95 latency | Waiting requests or p95 latency | Waiting requests or p95 latency | Waiting requests or p95 latency |

### Best Practices

GPU sizing should be validated with representative performance tests using real prompt templates, expected output schemas, and production-like concurrency. GPU memory utilization should leave room for KV cache growth, request variance, and framework overhead. Keep minimum warm GPU capacity and scale additional GPU workers based on queue age, vLLM waiting requests, and latency.

### Risks

The main GPU sizing risk is relying on theoretical tokens per second. Real throughput can be lower because of prompt length, output constraints, safety validation, JSON retries, and batch inefficiency. Another risk is choosing L40 when A100 is needed, or choosing A100 before L40 benchmarks justify the cost.

### Recommendations

Use two L40 48GB GPU nodes for the initial production deployment if benchmark results confirm p95 audit latency below 60 seconds for the selected 7B quantized model. Keep A100 80GB as the performance upgrade path for larger models, heavier batch windows, or stricter latency. Maintain N+1 GPU capacity at all times. Revisit GPU sizing when monthly audits exceed 150,000, average tokens per audit exceed 5,000, p95 inference latency exceeds 40 seconds, or GPU utilization exceeds 70% during peak windows with N+1 included.


### Azure AKS GPU SKU Guidance

| Role | Azure approach | Notes |
| --- | --- | --- |
| Orchestration | AKS with dedicated GPU node pool | Taints/tolerations for vLLM only |
| GPU class (preferred validation) | NVIDIA A100-class Azure NC/ND SKUs where available | Use for 7B quantized headroom |
| GPU class (cost-optimized) | L40 / equivalent Azure GPU SKUs where region-available | Validate quota before commit |
| App/API/workers | Ddsv5 / Epdsv5-class CPU node pools | Separate from GPU pool |
| Images | Azure Container Registry (ACR) | Private link to AKS |
| Data plane | Azure Database for PostgreSQL + Azure Cache for Redis + Blob Storage | Private endpoints |

## 44. Infrastructure Sizing

### Purpose

The purpose of infrastructure sizing is to define the CPU, memory, disk, network, and managed service capacity required for Auto QRA beyond GPU inference. This includes application APIs, audit workers, Redis, PostgreSQL, Azure Blob Storage, Superset or analytics, observability, and supporting services.

### Description

Auto QRA has moderate transaction volume but strict reliability, security, and latency expectations. The non-GPU infrastructure must handle audit intake, PII masking, workflow orchestration, queueing, database persistence, object storage, reporting, monitoring, and administrative access under average traffic, 3x peak traffic, burst/retry conditions, and N+1 high availability.

### Business Justification

Infrastructure sizing ensures the platform does not become bottlenecked outside the model-serving layer. Balanced sizing prevents avoidable latency, reduces incident risk, and gives finance and platform teams a transparent starting point for monthly cost management.

### Technical Details

Recommended production infrastructure:

| Component | Minimum production size | Recommended initial size | Scale trigger | Notes |
| --- | --- | --- | --- | --- |
| API service pods | 2 replicas, 2 vCPU, 4 GB RAM | 2-3 replicas, 2 vCPU, 8 GB RAM | CPU > 60%, p95 API > 2s, request queueing | Stateless; autoscale to 6 |
| Audit worker pods | 2 replicas, 4 vCPU, 8 GB RAM | 2-4 replicas, 4 vCPU, 16 GB RAM | Queue age > 60s, active jobs > 80% | CPU-heavy masking and validation |
| PII masking service | 2 replicas, 4 vCPU, 8 GB RAM | 2-4 replicas, 4-8 vCPU, 16 GB RAM | Masking p95 > 5s | May need more CPU for DLP |
| vLLM GPU nodes | 2 nodes, 1 GPU each | 2 L40 nodes initially | vLLM waiting requests > 20 or p95 inference > 40s | N+1 HA |
| Redis Azure Cache for Redis | HA, 5 GB | HA, 10-16 GB | Memory > 70%, queue > 500, evictions > 0 | No eviction for queue keys |
| PostgreSQL Azure Database for PostgreSQL | HA, 4 vCPU, 16 GB RAM, 100 GB SSD | HA, 8 vCPU, 32 GB RAM, 250 GB SSD | CPU > 60%, connections > 70%, storage > 70% | PITR enabled |
| Azure Blob Storage buckets | Regional/dual-region | Versioned, lifecycle managed | Storage growth > forecast x 1.5 | Store artifacts outside DB |
| Superset | 1 replica, 2 vCPU, 8 GB RAM | 2 replicas, 4 vCPU, 16 GB RAM | Dashboard p95 > 5s | Can be lower priority |
| Prometheus | 2 vCPU, 8 GB RAM | 4 vCPU, 16 GB RAM, 200 GB disk | Query latency, disk > 70% | Cardinality controls |
| Grafana | 1 replica, 1 vCPU, 2 GB RAM | 2 replicas, 2 vCPU, 4 GB RAM | User demand | Dashboards as code |

Database sizing detail:

| Database concern | Initial recommendation | Rationale |
| --- | --- | --- |
| CPU | 8 vCPU | Supports workflow writes, reporting queries, indexes, and growth |
| RAM | 32 GB | Keeps hot indexes and recent audit records cached |
| Storage | 250 GB SSD | Allows first-year growth, indexes, WAL, and backup overhead |
| Connections | 200 max with pooling | Prevents connection storms from API and workers |
| Read replicas | Optional initially | Add if Superset/reporting impacts primary |
| PITR | 35 days | Supports operational recovery |
| Maintenance | Controlled windows | Avoid peak business hours |

Redis sizing detail:

| Redis concern | Initial recommendation | Rationale |
| --- | --- | --- |
| Memory | 10-16 GB HA | Queue data is small, but headroom prevents evictions |
| Eviction policy | No eviction for workflow queue DB | Audit dispatch must not lose items silently |
| Persistence | Managed HA capabilities plus durable PostgreSQL state | Redis is not the source of truth |
| Queue capacity | 500+ pending audits | Supports 2-hour peak backlog |
| Connection limit | Sized for workers, API, dashboards | Prevent connection exhaustion |

Superset sizing detail:

| Layer | Recommendation |
| --- | --- |
| Web workers | 2 replicas, 4 vCPU, 16 GB RAM |
| Metadata database | Use managed PostgreSQL or separate schema |
| Cache | Redis or managed cache, separate from production queue |
| Query model | Prefer aggregate tables over live operational tables |
| Access | SSO and role-based dashboard permissions |

### Best Practices

Separate operational workloads from analytical workloads. Superset dashboards should query aggregate tables or replicas, Redis queues should not be shared with analytics caches, Prometheus cardinality should be controlled, and PostgreSQL should use connection pooling. Infrastructure should be provisioned through code with resource requests, limits, and lifecycle policies.

### Risks

The main infrastructure risk is cross-workload interference. Reporting queries can slow audit writes. Shared Redis can evict queue keys. Excessive metrics cardinality can overload Prometheus. Another risk is scaling application pods without scaling database connections or GPU serving, which can create pressure on downstream systems without increasing actual throughput.

### Recommendations

Start with the recommended initial sizes rather than minimum sizes for production. Use Azure Database for PostgreSQL HA with 8 vCPU, 32 GB RAM, and 250 GB SSD. Use Redis Azure Cache for Redis HA with 10-16 GB. Run two L40 GPU nodes for vLLM. Keep API and worker services horizontally scalable. Isolate Superset and analytics from operational tables through replicas or aggregates. Review CPU, memory, disk, connection, and queue metrics monthly.

## 45. Cost Estimation

### Purpose

The purpose of cost estimation is to provide a transparent monthly Azure cost model for Auto QRA infrastructure. The estimate includes AKS GPU node pools, application compute, Azure Database for PostgreSQL/PostgreSQL, Redis Azure Cache for Redis, Azure Blob Storage, networking, monitoring, logging, and supporting services. Costs are presented as ranges because final pricing depends on region, committed use discounts, sustained use discounts, machine families, storage classes, logging volume, and operational policies.

### Description

Auto QRA cost is dominated by GPU serving. Even though monthly token volume is 192,000,000 tokens, the average throughput requirement is modest. The main cost decision is whether to keep two warm L40 nodes or two warm A100 nodes for N+1 HA. Application compute, Redis, PostgreSQL, Azure Blob Storage, and monitoring are smaller but still material. Logging and observability costs can grow if high-cardinality metrics or verbose logs are not controlled.

The estimates below assume continuous production operation for approximately 730 hours per month. They assume two warm GPU nodes, managed database and cache services, production observability, moderate log retention, and Azure Blob Storage storage for audit artifacts. Figures are planning ranges, not quotes.

### Business Justification

Cost estimation allows product, finance, and engineering stakeholders to evaluate the unit economics of Auto QRA. At 60,000 audits per month, a monthly infrastructure cost of $8,000 implies approximately $0.13 per audit; a monthly cost of $30,000 implies approximately $0.50 per audit. These unit economics may still be attractive compared with manual quality review, but the organization needs explicit assumptions to make informed decisions.

### Technical Details

Primary monthly cost estimate:

| Cost category | Assumption | Low monthly estimate | High monthly estimate | Notes |
| --- | --- | ---: | ---: | --- |
| AKS GPU node pools - L40 option | 2 L40 48GB nodes, 730 hrs, on-demand or discounted range | $3,500 | $9,000 | Dominant cost; region and machine type sensitive |
| AKS GPU node pools - A100 option | 2 A100 80GB nodes, 730 hrs, on-demand or discounted range | $8,000 | $20,000 | Use if L40 latency insufficient |
| Application AKS/VM compute | API, workers, PII service, support pods | $600 | $2,000 | Depends on node pool and HA |
| Azure Database for PostgreSQL PostgreSQL | HA, 8 vCPU, 32 GB RAM, 250 GB SSD, backups | $900 | $2,500 | Includes HA and storage range |
| Redis Azure Cache for Redis | HA, 10-16 GB | $300 | $1,000 | Tier and region dependent |
| Azure Blob Storage storage | Artifacts, backups, logs archive, versioning | $100 | $600 | Current volume is small; retention drives cost |
| Networking | Load balancing, egress, NAT, private connectivity | $200 | $1,000 | Higher if cross-region replication or egress |
| Monitoring and logging | Metrics, logs, traces, dashboards | $500 | $2,000 | Strongly affected by log volume and cardinality |
| Security services | KMS, Azure Key Vault, audit logs, DLP usage | $200 | $1,500 | DLP cost depends on scanning volume |
| Superset/analytics | Compute and metadata storage | $200 | $800 | Can be lower in early deployment |

Scenario totals:

| Scenario | Included GPU option | Estimated monthly total | Estimated cost per audit at 60,000/month |
| --- | --- | ---: | ---: |
| Cost-optimized production | 2 L40 nodes, conservative managed services | $6,500-$12,000 | $0.11-$0.20 |
| Balanced enterprise production | 2 L40 nodes, stronger observability and HA | $10,000-$18,000 | $0.17-$0.30 |
| Performance-oriented production | 2 A100 nodes, stronger headroom | $16,000-$32,000 | $0.27-$0.53 |
| Expanded production with DR warm standby | L40 or A100 plus partial secondary region | Add 30%-80% | Depends on standby design |

Token-based unit math:

| Item | Formula | Result |
| --- | --- | ---: |
| Monthly audits | Given | 60,000 |
| Monthly tokens | 60,000 x 3,200 | 192,000,000 |
| Cost per 1M tokens at $10,000/month | $10,000 / 192 | $52.08 |
| Cost per audit at $10,000/month | $10,000 / 60,000 | $0.17 |
| Cost per audit at $18,000/month | $18,000 / 60,000 | $0.30 |
| Cost per audit at $32,000/month | $32,000 / 60,000 | $0.53 |

Cost sensitivity table:

| Driver | Change | Cost impact | Operational impact |
| --- | --- | --- | --- |
| GPU type | L40 to A100 | Large increase | Higher throughput and memory headroom |
| Minimum GPU replicas | 2 to 3 | Large increase | More HA and burst capacity |
| Token count | 3,200 to 6,400 tokens/audit | GPU utilization roughly doubles | May require more GPUs or stricter prompts |
| Logging volume | 1 KB/event to 5 KB/event | Moderate increase | Better detail but higher cost and privacy risk |
| Retention | 30 days to 1 year hot logs | Moderate to large increase | Easier investigation but more exposure |
| Cross-region DR | Backup only to warm standby | Large increase | Lower regional RTO |
| Superset live queries | Aggregates to live primary DB | Possible DB cost increase | Operational risk if primary is loaded |

### Best Practices

Cost should be managed through explicit unit metrics. Grafana should show cost per audit, cost per 1 million tokens, GPU utilization, idle GPU hours, log ingestion volume, Azure Blob Storage growth, database storage growth, and retry cost. Use sampling for successful traces, retention tiers for logs, cardinality reviews for metrics, and lifecycle policies for older Azure Blob Storage objects where retention rules allow.

### Risks

The largest cost risk is paying for idle GPU capacity. N+1 HA requires spare capacity, but the team should still monitor utilization and consider whether one GPU node can serve active traffic while the second is maintained as warm standby. Another risk is prompt and output growth. Doubling tokens per audit doubles inference demand and can increase latency or require additional GPUs. Observability cost overruns are also common if raw payloads or high-cardinality labels are emitted.

### Recommendations

Budget the initial production deployment using the balanced L40 scenario: $10,000-$18,000 per month, or approximately $0.17-$0.30 per audit at 60,000 audits per month. Keep the A100 scenario as an approved upgrade path if benchmarks show L40 cannot meet p95 latency under the selected model. Implement FinOps dashboards before launch. Review cost after 30 days of production traffic and compare actual cost per audit with forecast. Use committed use discounts only after model choice, GPU type, and traffic shape stabilize.

## 46. Scaling Strategy

### Purpose

The purpose of the scaling strategy is to define how Auto QRA will increase or decrease capacity while preserving latency, availability, cost control, and security. Scaling must address application services, workers, Redis, PostgreSQL, vLLM GPU serving, observability, and storage. It must support average load, 3x peak load, burst/retry behavior, business growth, and node failure.

### Description

Auto QRA uses horizontal scaling for stateless application services and workers, managed scaling for data services, and controlled scaling for GPU-backed vLLM nodes. Application pods scale on CPU, request latency, and queue signals; workers scale on queue depth, queue age, and active job count; GPU nodes scale conservatively because model loading is slower and costs are high. Scaling must preserve N+1 HA.

### Business Justification

Scaling strategy protects service quality as adoption grows from 60,000 audits per month to additional teams, tenants, audit types, and stricter quality workflows. It allows capacity, cost, and operational readiness to be planned ahead of demand.

### Technical Details

Autoscaling strategy:

```mermaid
flowchart TD
    Metrics[Prometheus Metrics] --> HPA[Horizontal Pod Autoscaler]
    Metrics --> KEDA[KEDA Queue-Based Scaling]
    Metrics --> GPUScaler[GPU Node Pool Scaling Controller]
    HPA --> API[API Service Replicas]
    HPA --> Masking[PII Masking Replicas]
    KEDA --> Workers[Audit Worker Replicas]
    GPUScaler --> VLLM[vLLM GPU Replicas]
    Redis[Redis Queue Metrics] --> KEDA
    VLLMWaiting[vLLM Waiting Requests] --> GPUScaler
    Latency[Audit p95 Latency] --> GPUScaler
    DBMetrics[PostgreSQL Metrics] --> DBActions[Pool Tuning / Read Replica / Tier Upgrade]
    Cost[Cost and Utilization Metrics] --> FinOps[Monthly Capacity Review]
    Workers --> VLLM
    Workers --> PG[(PostgreSQL)]
    API --> Redis```

Scaling triggers:

| Layer | Scale-out trigger | Scale-in trigger | Minimum | Maximum initial |
| --- | --- | --- | ---: | ---: |
| API service | CPU > 60%, p95 API latency > 2s, request backlog | CPU < 30% and latency stable for 30m | 2 | 6 |
| PII masking | p95 masking > 5s, CPU > 60% | CPU < 30% and p95 < 2s | 2 | 8 |
| Audit workers | Queue age > 60s, queue depth > 100, active jobs > 80% | Queue age < 10s for 30m | 2 | 8 |
| vLLM GPU nodes | Waiting requests > 20, p95 inference > 40s, GPU util > 70% at peak | Sustained util < 25% outside minimum HA | 2 | 4 initially |
| Redis | Memory > 70%, latency > 5ms, evictions > 0 | Manual downsize only | HA 10 GB | 32 GB initial plan |
| PostgreSQL | CPU > 60%, connections > 70%, p95 query latency > baseline x 2 | Manual downsize only | HA 8 vCPU | 16 vCPU initial plan |
| Superset | Dashboard p95 > 5s, CPU > 60% | Low usage for 7 days | 1-2 | 4 |

Growth thresholds:

| Growth condition | Action |
| --- | --- |
| Monthly audits exceed 100,000 | Re-run capacity model and benchmark peak windows |
| Monthly audits exceed 150,000 | Consider third GPU node for N+1 if using 7B L40 |
| Tokens per audit exceed 5,000 | Review prompt governance and GPU throughput |
| p95 audit latency exceeds 60s for 3 days | Scale GPU or optimize model path |
| Queue age exceeds 60s during normal peak | Add workers or GPU capacity based on bottleneck |
| PostgreSQL storage exceeds 70% | Increase storage and review retention |
| Redis memory exceeds 70% | Increase tier and review queue TTLs |
| GPU utilization exceeds 70% at peak with N+1 | Add GPU node or move to A100 |

Scaling math for future growth:

| Scenario | Audits/month | Peak audits/min at 3x | Conservative 7B L40 capacity per GPU | GPUs before HA | GPUs with N+1 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Baseline | 60,000 | 4.17 | 9.375 audits/min | 1 | 2 |
| Growth 1 | 100,000 | 6.94 | 9.375 audits/min | 1 | 2 |
| Growth 2 | 150,000 | 10.42 | 9.375 audits/min | 2 | 3 |
| Growth 3 | 250,000 | 17.36 | 9.375 audits/min | 2 | 3 |
| Growth 4 | 500,000 | 34.72 | 9.375 audits/min | 4 | 5 |

The formula is:

`peak_audits_per_minute = (monthly_audits / 30 / 24 / 60) x 3`

`gpus_with_ha = ceil(peak_audits_per_minute / audits_per_minute_per_gpu) + 1`

### Best Practices

Autoscaling should be based on bottleneck-aware signals. Scaling workers does not improve throughput if vLLM is saturated, and scaling GPU nodes does not help if PII masking is the bottleneck. Scale-in should be conservative, especially for GPU nodes, and production should keep two warm GPU nodes with priority queues for urgent audits.

### Risks

The main scaling risk is reactive over-scaling without bottleneck analysis. This can increase cost without improving latency. Another risk is cold GPU startup. If the system scales from zero or from insufficient warm capacity, loading model weights can take longer than the audit latency target. Database scaling can also be slow compared with application scaling, so connection pooling and query efficiency are essential. Finally, scale-out can increase blast radius if security policies, secrets, and network controls are not applied automatically to new replicas.

### Recommendations

Implement phased autoscaling. Phase 1 should use fixed minimum production capacity with HPA for API and workers, plus manual GPU scale-out. Phase 2 should add KEDA-style queue-based worker scaling and alert-driven GPU scaling. Phase 3 should automate GPU node pool scaling with strict minimums, warm-up checks, and cost guardrails. Use the conservative 7B L40 throughput assumption for planning until benchmark data replaces it. Preserve N+1 capacity at every growth tier and review scaling thresholds monthly.
