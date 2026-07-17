# Auto QRA — Document Control and Architecture Review Brief

**Version:** 1.0  
**Classification:** Internal — Confidential  
**Date:** July 2026  
**Program:** Auto Quality Review Automation (Auto QRA)  
**Authors:** Product Management, Enterprise Architecture, AI Solution Architecture, Technical Program Management  

---

### Purpose

This brief orients architecture review boards and executive sponsors to the Auto QRA design package, approval questions, and decision checkpoints.

### Description

Auto QRA is an enterprise AI platform that audits customer conversations using a self-hosted LLM served by vLLM. It evaluates approximately 60,000 audits per month against 30 QA parameters, with human override, PII masking, SSO/RBAC, and full operational observability on Google Cloud Platform.

### Business Justification

The program expands QA coverage beyond sampling limits, improves scoring consistency, accelerates coaching loops, and strengthens compliance evidence while retaining human accountability for disputed or low-confidence outcomes.

### Technical Details

| Review Artifact | Location |
| --- | --- |
| Master index | [README.md](README.md) |
| Executive & business baseline | [01-executive-and-business.md](01-executive-and-business.md) |
| Requirements & workflows | [02-requirements-personas-flows.md](02-requirements-personas-flows.md) |
| Solution & AI architecture | [03-solution-architecture-ai.md](03-solution-architecture-ai.md) |
| Ops, security, capacity, cost | [04-ops-security-capacity.md](04-ops-security-capacity.md) |
| DevOps, APIs, schema, governance | [05-devops-apis-governance.md](05-devops-apis-governance.md) |

#### Architecture Review Decision Log Template

| Decision ID | Topic | Options | Recommendation | Status | Owner | Date |
| --- | --- | --- | --- | --- | --- | --- |
| ADR-001 | Model size | 3B vs 7B quantized | Benchmark then select | Open | AI/ML | TBD |
| ADR-002 | GPU class | L40 vs A100 | L40 N+1 if latency met | Open | Infra | TBD |
| ADR-003 | Automation threshold | Conservative vs aggressive | Conservative at launch | Proposed | Product / QA | TBD |
| ADR-004 | K8s timing | Docker-only MVP vs early K8s | Docker now, K8s-ready | Proposed | DevOps | TBD |
| ADR-005 | Retrieval depth | Rubric-only vs RAG policies | Light RAG with rubric + examples | Proposed | AI/ML | TBD |

#### Approval Checklist for Architecture Board

| # | Gate Question | Pass Criteria | Reference |
| --- | --- | --- | --- |
| 1 | Is business value clear? | Coverage, consistency, coaching cycle time | Sections 1–7 |
| 2 | Is scope bounded? | In/out of scope agreed | Sections 11–12 |
| 3 | Are NFRs measurable? | Latency, availability, agreement, hallucination | Sections 14, 58–60 |
| 4 | Is architecture fit for GCP enterprise? | Private networking, SSO, encryption, HA | Sections 20–24, 37–40 |
| 5 | Is AI risk controlled? | Confidence, override, eval framework | Sections 30–32, 52–54 |
| 6 | Is capacity/cost credible? | GPU math + monthly estimate ranges | Sections 41–45 |
| 7 | Is rollout gated? | Pilot → limited → GA with exit criteria | Section 47 |
| 8 | Is production readiness defined? | Checklist owners and sign-off | Section 63 |

### Best Practices

- Require recorded ADRs for model, prompt, automation threshold, and infrastructure class changes.
- Separate architecture approval from production go-live; both need independent gates.
- Keep executive one-pagers synchronized with the design package baseline numbers.

### Risks

- Partial reading of only the executive summary can understate AI quality and security dependencies.
- Approving capacity without benchmark evidence can lock in underperforming GPU choices.

### Recommendations

1. Approve the design package as the program baseline (Version 1.0).
2. Fund a benchmark sprint before final GPU/model purchase commitments.
3. Authorize Pilot under Section 47 gates with Security and Privacy sign-off.
4. Reconvene architecture board before Limited Production expansion.
