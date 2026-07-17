# Appendix A — Auto QRA Quick Reference Card

**Version:** 1.0 | **Date:** July 2026

### Purpose

Provide a one-page operational quick reference for engineers, reviewers, and on-call staff.

### Description

| Item | Value |
| --- | --- |
| Product | Auto Quality Review Automation (Auto QRA) |
| Inference | Self-hosted vLLM |
| Models | 3B / 7B quantized |
| GPUs | L40 48GB or A100 80GB |
| Volume | 60,000 audits/month (~2,000/day) |
| Tokens/audit | 3,200 (2,500 in + 700 out) |
| QA parameters | 30 |
| Latency SLO | < 60 seconds |
| Availability SLO | 99.9% |
| Agreement KPI | > 90% |
| Hallucination KPI | < 5% |

### Business Justification

Use this card during incident bridges, pilot ops, and stakeholder syncs to keep baseline numbers consistent.

### Technical Details

| Layer | Technology |
| --- | --- |
| Cloud | GCP |
| Containers | Docker → Kubernetes ready |
| DB | PostgreSQL |
| Queue | Redis |
| Storage | GCS |
| BI | Apache Superset |
| Telemetry | Prometheus + Grafana |
| Security | SSO, RBAC, PII masking, encryption, audit logs |

Critical path:

`Ingest → PII Mask → Queue → Prompt/Retrieve → vLLM → Parse → Rules → Confidence → Persist/Override → Report`

### Best Practices

- Never send unmasked PII to the model.
- Prefer structured JSON outputs with evidence spans.
- Route low-confidence and compliance-critical audits to humans.

### Risks

- Quick-reference drift if not updated with ADR outcomes.
- On-call action without consulting alert runbooks.

### Recommendations

Update this card whenever model class, GPU class, automation thresholds, or SLOs change.
