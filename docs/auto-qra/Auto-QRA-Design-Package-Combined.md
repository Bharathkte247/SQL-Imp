# Auto Quality Review Automation (Auto QRA)
## Complete Product and Technical Design Package

**Version:** 1.0  
**Classification:** Internal — Confidential  
**Date:** July 2026  
**Audience:** Executive Leadership, Product, Engineering, AI/ML, DevOps, Security, Infrastructure

---


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

Auto QRA is an enterprise AI platform that audits customer conversations using a self-hosted LLM served by vLLM. It evaluates approximately 60,000 audits per month against 30 QA parameters, with human override, PII masking, SSO/RBAC, and full operational observability on Microsoft Azure using Azure Kubernetes Service (AKS).

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
| ADR-004 | Kubernetes platform | AKS from day one vs deferred Kubernetes | Deploy on AKS from production | Proposed | DevOps | TBD |
| ADR-005 | Retrieval depth | Rubric-only vs RAG policies | Light RAG with rubric + examples | Proposed | AI/ML | TBD |

#### Approval Checklist for Architecture Board

| # | Gate Question | Pass Criteria | Reference |
| --- | --- | --- | --- |
| 1 | Is business value clear? | Coverage, consistency, coaching cycle time | Sections 1–7 |
| 2 | Is scope bounded? | In/out of scope agreed | Sections 11–12 |
| 3 | Are NFRs measurable? | Latency, availability, agreement, hallucination | Sections 14, 58–60 |
| 4 | Is architecture fit for Azure enterprise? | Private networking, SSO, encryption, HA | Sections 20–24, 37–40 |
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


---

## Azure / AKS Platform Decision

### Purpose

Record the approved platform decision to deploy Auto QRA on **Microsoft Azure** using **Azure Kubernetes Service (AKS)**.

### Description

Auto QRA production compute, networking, and orchestration will use AKS. Supporting Azure services replace the previous GCP-oriented baseline:

| Capability | Azure Service |
| --- | --- |
| Container orchestration | Azure Kubernetes Service (AKS) |
| Container images | Azure Container Registry (ACR) |
| Object storage | Azure Blob Storage |
| PostgreSQL | Azure Database for PostgreSQL (Flexible Server) |
| Redis | Azure Cache for Redis |
| Secrets / keys | Azure Key Vault |
| Identity / SSO | Microsoft Entra ID |
| Private networking | Azure VNet + Private Link |
| Ingress / WAF | Azure Application Gateway (WAF) |
| Observability (platform) | Azure Monitor + Prometheus/Grafana in-cluster |

### Business Justification

AKS provides enterprise Kubernetes operations, GPU node pool support for vLLM, private cluster networking, Entra ID integration, and a clear path for HA, scaling, and governed releases.

### Technical Details

- Use dedicated AKS node pools: system, API/app, workers, and GPU inference.
- Deploy with Helm charts and Azure Workload Identity for Blob/Key Vault access.
- Keep vLLM GPU workloads on isolated GPU node pools with taints/tolerations.
- Target NVIDIA GPU SKUs available on Azure (for example NC-series / A100-capable pools) sized to the 60,000 audits/month workload.

### Best Practices

- Private AKS cluster with Azure CNI / overlay networking as approved by security.
- Pull images only from ACR; scan images in CI before deploy.
- Separate non-prod and prod AKS clusters or strongly isolated namespaces with network policies.

### Risks

- GPU quota and SKU availability in the target Azure region can delay go-live.
- Misconfigured ingress or public endpoints can expose audit APIs.

### Recommendations

1. Treat **AKS on Azure** as the production standard (not deferred Kubernetes).
2. Validate GPU node pool availability in the selected region during the benchmark sprint.
3. Align SSO with Microsoft Entra ID and RBAC to AKS + application roles.


---

# Auto Quality Review Automation (Auto QRA)
## Product and Technical Design Package

| Field | Value |
| --- | --- |
| Document Title | Auto QRA Product and Technical Design Package |
| Version | 1.0 |
| Status | Architecture Review Ready |
| Classification | Internal — Confidential |
| Date | July 2026 |
| Target Cloud | Microsoft Azure |
| Inference | Self-hosted LLM via vLLM |
| Target Models | 3B or 7B Quantized |
| Container Platform | Azure Kubernetes Service (AKS) |

---

### Purpose

This package is the authoritative Product and Technical Design baseline for Auto QRA. It is written for executive sponsorship, architecture review boards, product management, engineering, AI/ML, DevOps, security, and infrastructure teams. The content is implementation-ready and suitable for gated delivery from pilot through production.

### Description

Auto QRA automatically audits customer conversations against a 30-parameter QA rubric using a self-hosted large language model. The platform replaces repetitive first-pass manual QA while preserving human override, governance, and auditability. The design prioritizes data control, predictable latency, measurable AI quality, and enterprise security.

### Business Justification

Manual QA typically reviews a small sample of interactions, creating coverage gaps, inconsistent scoring, and delayed coaching. At approximately 60,000 audits per month, Auto QRA enables scalable, consistent first-pass review with structured evidence, confidence scoring, and human-in-the-loop exception handling.

### Document Structure

| Part | File | Sections | Focus |
| --- | --- | --- | --- |
| 1 | [01-executive-and-business.md](01-executive-and-business.md) | 1–12 | Executive summary, strategy, scope, risks |
| 2 | [02-requirements-personas-flows.md](02-requirements-personas-flows.md) | 13–19 | Requirements, personas, stories, workflows |
| 3 | [03-solution-architecture-ai.md](03-solution-architecture-ai.md) | 20–32 | Architecture, AI pipeline, confidence, override |
| 4 | [04-ops-security-capacity.md](04-ops-security-capacity.md) | 33–46 | Monitoring, security, capacity, cost, scaling |
| 5 | [05-devops-apis-governance.md](05-devops-apis-governance.md) | 47–65 | DevOps, APIs, schema, KPIs, governance, appendix |

### How to Read This Package

| Audience | Start Here | Then Review |
| --- | --- | --- |
| Executive Leadership | Sections 1–7, 45, 58 | Sections 10, 47, 64 |
| Product Management | Sections 5–7, 13–19, 58 | Sections 31, 57, 64 |
| Engineering | Sections 20–26, 55–56 | Sections 48–51, 33–36 |
| AI/ML Teams | Sections 25–30, 52–54, 60 | Sections 27–28, 42–43 |
| DevOps / SRE | Sections 22–24, 33–36, 48–50 | Sections 40, 46, 63 |
| Security / Compliance | Sections 37, 61–62 | Sections 9–10, 35, 63 |
| Infrastructure | Sections 22–24, 41–46 | Sections 38–40 |

### Baseline Operating Parameters

| Parameter | Target / Assumption |
| --- | --- |
| Monthly audit volume | 60,000 |
| Daily average | ~2,000 |
| QA parameters per audit | 30 |
| Average input tokens | 2,500 |
| Average output tokens | 700 |
| Average total tokens | 3,200 |
| Monthly token volume | ~192,000,000 |
| Target latency | < 60 seconds |
| Target availability | 99.9% |
| Target human agreement | > 90% |
| Target hallucination rate | < 5% |
| GPU candidates | NVIDIA L40 48GB / A100 80GB |
| Data store | PostgreSQL |
| Queue / cache | Redis |
| Object storage | Azure Blob Storage |
| Reporting | Apache Superset |
| Monitoring | Prometheus + Grafana |
| AuthN / AuthZ | Microsoft Entra ID SSO + RBAC |
| Security controls | PII masking, encryption at rest/transit, audit logging |

### High-Level Solution View

```mermaid
flowchart LR
    A["Conversation Sources"] --> B["Ingestion API"]
    B --> C["PII Masking"]
    C --> D["Redis Queue"]
    D --> E["Audit Workers"]
    E --> F["Prompt + Retrieval"]
    F --> G["vLLM Self-Hosted LLM"]
    G --> H["Rules + Confidence"]
    H --> I{"Human Override?"}
    I -- "No / High Confidence" --> J["PostgreSQL Results"]
    I -- "Yes / Low Confidence" --> K["Reviewer Workbench"]
    K --> J
    J --> L["Superset Dashboards"]
    E --> M["Prometheus / Grafana"]
    J --> N["Azure Blob Storage Artifacts"]```

### Table of Contents — All 65 Sections

#### Part 1 — Executive and Business (Sections 1–12)

1. [Executive Summary](01-executive-and-business.md#1-executive-summary)
2. [Business Background](01-executive-and-business.md#2-business-background)
3. [Problem Statement](01-executive-and-business.md#3-problem-statement)
4. [Business Objectives](01-executive-and-business.md#4-business-objectives)
5. [Vision](01-executive-and-business.md#5-vision)
6. [Product Strategy](01-executive-and-business.md#6-product-strategy)
7. [Success Metrics](01-executive-and-business.md#7-success-metrics)
8. [Stakeholders](01-executive-and-business.md#8-stakeholders)
9. [Assumptions](01-executive-and-business.md#9-assumptions)
10. [Risks](01-executive-and-business.md#10-risks)
11. [Scope](01-executive-and-business.md#11-scope)
12. [Out of Scope](01-executive-and-business.md#12-out-of-scope)

#### Part 2 — Requirements, Personas, and Flows (Sections 13–19)

13. [Functional Requirements](02-requirements-personas-flows.md#13-functional-requirements)
14. [Non Functional Requirements](02-requirements-personas-flows.md#14-non-functional-requirements)
15. [User Personas](02-requirements-personas-flows.md#15-user-personas)
16. [User Stories](02-requirements-personas-flows.md#16-user-stories)
17. [Acceptance Criteria](02-requirements-personas-flows.md#17-acceptance-criteria)
18. [Process Flow](02-requirements-personas-flows.md#18-process-flow)
19. [Product Workflow](02-requirements-personas-flows.md#19-product-workflow)

#### Part 3 — Solution Architecture and AI Design (Sections 20–32)

20. [Solution Architecture](03-solution-architecture-ai.md#20-solution-architecture)
21. [Component Diagram](03-solution-architecture-ai.md#21-component-diagram)
22. [Infrastructure Architecture](03-solution-architecture-ai.md#22-infrastructure-architecture)
23. [Deployment Architecture](03-solution-architecture-ai.md#23-deployment-architecture)
24. [Networking Architecture](03-solution-architecture-ai.md#24-networking-architecture)
25. [AI Pipeline](03-solution-architecture-ai.md#25-ai-pipeline)
26. [Data Flow](03-solution-architecture-ai.md#26-data-flow)
27. [Prompt Engineering Strategy](03-solution-architecture-ai.md#27-prompt-engineering-strategy)
28. [Retrieval Strategy](03-solution-architecture-ai.md#28-retrieval-strategy)
29. [Business Rules Engine](03-solution-architecture-ai.md#29-business-rules-engine)
30. [Confidence Scoring](03-solution-architecture-ai.md#30-confidence-scoring)
31. [Human Override Workflow](03-solution-architecture-ai.md#31-human-override-workflow)
32. [Exception Handling](03-solution-architecture-ai.md#32-exception-handling)

#### Part 4 — Operations, Security, and Capacity (Sections 33–46)

33. [Monitoring Strategy](04-ops-security-capacity.md#33-monitoring-strategy)
34. [Observability](04-ops-security-capacity.md#34-observability)
35. [Logging Strategy](04-ops-security-capacity.md#35-logging-strategy)
36. [Alerting](04-ops-security-capacity.md#36-alerting)
37. [Security Architecture](04-ops-security-capacity.md#37-security-architecture)
38. [Disaster Recovery](04-ops-security-capacity.md#38-disaster-recovery)
39. [Backup Strategy](04-ops-security-capacity.md#39-backup-strategy)
40. [High Availability](04-ops-security-capacity.md#40-high-availability)
41. [Capacity Planning](04-ops-security-capacity.md#41-capacity-planning)
42. [Performance Estimation](04-ops-security-capacity.md#42-performance-estimation)
43. [GPU Sizing](04-ops-security-capacity.md#43-gpu-sizing)
44. [Infrastructure Sizing](04-ops-security-capacity.md#44-infrastructure-sizing)
45. [Cost Estimation](04-ops-security-capacity.md#45-cost-estimation)
46. [Scaling Strategy](04-ops-security-capacity.md#46-scaling-strategy)

#### Part 5 — DevOps, APIs, Governance, and Appendix (Sections 47–65)

47. [Production Rollout](05-devops-apis-governance.md#47-production-rollout)
48. [CI/CD Pipeline](05-devops-apis-governance.md#48-cicd-pipeline)
49. [DevOps Strategy](05-devops-apis-governance.md#49-devops-strategy)
50. [Release Management](05-devops-apis-governance.md#50-release-management)
51. [Testing Strategy](05-devops-apis-governance.md#51-testing-strategy)
52. [AI Evaluation Framework](05-devops-apis-governance.md#52-ai-evaluation-framework)
53. [Prompt Versioning](05-devops-apis-governance.md#53-prompt-versioning)
54. [Model Versioning](05-devops-apis-governance.md#54-model-versioning)
55. [API Specifications](05-devops-apis-governance.md#55-api-specifications)
56. [Database Schema](05-devops-apis-governance.md#56-database-schema)
57. [Reporting Dashboard Requirements](05-devops-apis-governance.md#57-reporting-dashboard-requirements)
58. [Product KPIs](05-devops-apis-governance.md#58-product-kpis)
59. [Operational KPIs](05-devops-apis-governance.md#59-operational-kpis)
60. [AI KPIs](05-devops-apis-governance.md#60-ai-kpis)
61. [Governance](05-devops-apis-governance.md#61-governance)
62. [Compliance](05-devops-apis-governance.md#62-compliance)
63. [Production Readiness Checklist](05-devops-apis-governance.md#63-production-readiness-checklist)
64. [Future Roadmap](05-devops-apis-governance.md#64-future-roadmap)
65. [Appendix](05-devops-apis-governance.md#65-appendix)

### Section Content Standard

Every section in this package includes:

| Subsection | Intent |
| --- | --- |
| Purpose | Why the section exists for the program |
| Description | What the topic covers in business and technical terms |
| Business Justification | Why investment or design choice matters |
| Technical Details | Implementation-ready specifics, formulas, schemas, configs |
| Best Practices | Industry and enterprise AI operating guidance |
| Risks | Residual and delivery risks |
| Recommendations | Decision-ready guidance for architecture and delivery |

### Diagram Inventory

The package includes Mermaid diagrams for:

- Vision / roadmap and stakeholder views
- Process flows, swimlanes, and product state machines
- Solution, component, infrastructure, networking, and deployment architectures
- Kubernetes-oriented deployment views
- AI pipeline, data-flow, and API sequence diagrams
- Confidence, override, and exception decision flows
- CI/CD, HA, security, and ER diagrams

### Size and Export Guidance

| Metric | Approximate Value |
| --- | --- |
| Total words (Parts 1–5) | 60,000+ |
| Estimated Microsoft Word pages @ ~350–400 words/page | 145–175+ pages |
| Numbered sections | 65 |
| Mermaid diagrams | 28+ |

### Microsoft Word Download

A professionally formatted Word document is available:

- **[`Auto-QRA-Design-Package.docx`](Auto-QRA-Design-Package.docx)** (~2.5 MB)
  - Cover page, table of contents, styled headings/tables
  - 29 rendered architecture/process diagrams
  - Headers, footers, and page numbers

Open in Microsoft Word and choose **Yes** if prompted to update fields (refreshes the table of contents and page numbers).

To export for Word/PDF review:

1. Use the prebuilt combined file: [Auto-QRA-Design-Package-Combined.md](Auto-QRA-Design-Package-Combined.md) (~67,000 words; ~170–190 Word pages).
2. Or regenerate with `bash docs/auto-qra/scripts/build-combined.sh`.
3. Render Mermaid diagrams (GitHub, Mermaid Live, or Pandoc + mermaid filter).
4. Apply corporate styles for headings, tables, and captioning.
5. Use [00-document-control.md](00-document-control.md) as front-matter for architecture board submission.

### Recommended Next Decisions

| Decision | Recommendation |
| --- | --- |
| Model class | Benchmark 3B vs 7B quantized on golden QA set; prefer quality-first if latency holds |
| GPU class | Start with L40 N+1 if benchmarks meet p95 < 60s; keep A100 as upgrade path |
| Rollout mode | Shadow → Assisted review → High-confidence automation |
| Automation policy | Auto-finalize only high-confidence, non-compliance-critical audits initially |
| Platform path | Production on Azure AKS with Helm charts, ACR, and GPU node pools |

### Document Control

| Version | Date | Change Summary | Owner |
| --- | --- | --- | --- |
| 1.0 | July 2026 | Initial complete Product and Technical Design Package | Product Management / Enterprise Architecture |

### Best Practices

- Treat this package as a living baseline; change via architecture decision records (ADRs).
- Gate production expansion on AI KPIs (agreement, hallucination, override rate) and operational SLOs.
- Keep prompt, model, and rubric versions independently releasable.
- Never bypass PII masking before LLM inference.

### Risks

- Architecture approval without golden-set AI evaluation can create false confidence.
- Scope creep into real-time coaching or multi-model orchestration before MVP stability.
- Cost and latency assumptions depend on measured vLLM throughput, not theoretical peaks.

### Recommendations

1. Use this package as the architecture review board submission packet.
2. Approve pilot scope against Sections 11–12 and rollout gates in Section 47.
3. Validate GPU and cost models in Sections 43–45 with a 2-week benchmark sprint.
4. Require production readiness checklist (Section 63) sign-off before GA.


---



---

# Auto Quality Review Automation (Auto QRA)

**Version:** 1.0
**Classification:** Internal
**Date:** July 2026
**Authors:** Product Management / Enterprise Architecture

## 1. Executive Summary

### Purpose

This section gives senior business, technology, risk, and operations leaders a concise view of the Auto Quality Review Automation program. Auto QRA is proposed as an enterprise AI platform that audits customer conversations using a self-hosted large language model served through vLLM. The platform is designed to increase audit coverage, improve consistency, accelerate coaching cycles, and preserve enterprise control over data, security, and model operations.

The purpose of this executive summary is to define why the initiative matters, what outcomes it should deliver, and how the technical design supports enterprise-grade operating expectations. It also establishes the baseline project facts that should remain consistent throughout the design package: approximately 60,000 audits per month, around 2,000 audits per day, 30 QA parameters per audit, 3,200 total tokens per audit, latency under 60 seconds, 99.9% availability, human agreement greater than 90%, and hallucination below 5%.

### Description

Auto QRA will automate quality review workflows for customer conversations by ingesting interaction records, masking sensitive data, evaluating each conversation against a defined QA rubric, generating structured audit outputs, and enabling human reviewers to override or calibrate the final result. The initial target deployment uses a self-hosted 3B or 7B quantized model deployed with vLLM on NVIDIA L40 48GB or A100 80GB GPUs. The target cloud platform is Microsoft Azure, with a Docker deployed on AKS architecture that uses PostgreSQL for transactional data, Azure Blob Storage for conversation and artifact storage, Redis for queueing and caching, Superset for analytics, and Prometheus/Grafana for observability.

Auto QRA is not positioned as a replacement for human judgment. It is positioned as an automation layer that performs first-pass review, prioritization, evidence extraction, scoring assistance, and reporting at production scale. Human override remains a core capability because enterprise QA relies on calibrated decision-making, policy interpretation, and exception handling. The system should therefore be designed as a controlled decision-support platform rather than an opaque autonomous adjudicator.

### Business Justification

Manual quality review typically samples a small percentage of total conversations, delays coaching, and produces inconsistency across reviewers, teams, and geographies. At the target volume of 60,000 audits per month, Auto QRA enables near-comprehensive or materially expanded audit coverage while reducing marginal review effort. The business value comes from earlier detection of customer experience issues, faster remediation of agent behavior, better compliance visibility, and more reliable management reporting.

The economic case is strongest where audit volume is high, QA rubrics are standardized, and operations leaders need measurable improvement in quality, customer trust, risk controls, and agent coaching. The program should be measured not only by cost avoidance but also by reduction in repeat defects, reduced escalation rates, improved first-contact resolution, more complete compliance evidence, and shorter time from conversation to coaching action.

| Executive priority | Auto QRA contribution | Business value |
| --- | --- | --- |
| Improve customer experience | Detect issues across a broader conversation population | Faster correction of poor service behaviors |
| Reduce QA operating cost | Automate first-pass audit and evidence extraction | Lower manual review effort per completed audit |
| Strengthen compliance | Apply a consistent 30-parameter rubric | Better evidence trail and exception visibility |
| Increase management insight | Centralize results in PostgreSQL and Superset | Trend reporting by team, topic, parameter, and risk |
| Preserve data control | Use self-hosted vLLM and enterprise security controls | Reduced dependency on external model APIs |

### Technical Details

The recommended high-level architecture includes conversation ingestion, preprocessing, PII masking, prompt orchestration, vLLM inference, result validation, persistence, review workflow, analytics, and monitoring. The model should be selected through a benchmark process comparing a 3B quantized option and a 7B quantized option against enterprise QA data. A 3B model may provide stronger throughput and lower GPU cost, while a 7B model may provide better reasoning fidelity and rubric adherence. The platform should be designed so model selection can change without rewriting the workflow.

The core sizing baseline is 60,000 audits per month. At 3,200 tokens per audit, the system processes roughly 192 million tokens per month. Daily demand is approximately 6.4 million tokens, excluding retries, calibration runs, and regression evaluations. With a latency objective under 60 seconds, the service must control queue depth, batch inference efficiently, and maintain headroom for spikes. GPU choice should be validated by throughput benchmarks for the selected quantized model, prompt template, max output length, and concurrency level.

| Baseline parameter | Target |
| --- | --- |
| Monthly audit volume | 60,000 audits |
| Daily audit volume | About 2,000 audits |
| QA parameters | 30 parameters per audit |
| Input tokens | About 2,500 per audit |
| Output tokens | About 700 per audit |
| Total tokens | About 3,200 per audit |
| Model serving | Self-hosted vLLM |
| Model target | 3B or 7B quantized model |
| GPU target | NVIDIA L40 48GB or A100 80GB |
| Latency | Less than 60 seconds per audit |
| Availability | 99.9% |
| Human agreement | Greater than 90% |
| Hallucination | Less than 5% |

### Best Practices

The platform should be built using a disciplined enterprise AI operating model. Prompts should be versioned, model outputs should be structured and schema-validated, audit results should include citations or evidence snippets, and every automated score should be traceable to source conversation content. Human override, calibration workflows, and reviewer feedback loops should be first-class product capabilities rather than afterthoughts.

Security and governance should be embedded from the start. Microsoft Entra ID SSO, RBAC, PII masking, encryption at rest, encryption in transit, audit logging, and least-privilege service accounts should be minimum production requirements. Model evaluation should include holdout sets, adversarial examples, ambiguous conversations, multilingual or code-switching samples if applicable, and periodic drift reviews. Production rollout should begin with shadow mode, move into assisted review, and only then expand to high-confidence automation.

### Risks

The key executive risks are model quality below business expectations, insufficient reviewer trust, throughput shortfalls under peak load, privacy exposure from mishandled conversation data, and unclear accountability for AI-assisted decisions. There is also a risk that business stakeholders interpret automation as full replacement of QA staff before the system has sufficient evidence of quality and stability.

Operational risk can also emerge if the 30-parameter rubric is not standardized, if historical QA labels are inconsistent, or if business teams expect the model to infer policy intent from vague criteria. Technical risks include GPU capacity constraints, prompt instability, hallucinated evidence, and brittle integrations with upstream conversation systems.

### Recommendations

Proceed with a phased implementation that separates executive approval, model benchmarking, controlled pilot, and production scale-up. Establish a cross-functional steering group with Product Management, QA Operations, Enterprise Architecture, Security, Legal/Privacy, Data Engineering, MLOps, and Customer Operations. Approve success criteria before build begins, including human agreement greater than 90%, hallucination below 5%, latency below 60 seconds, 99.9% availability, and measurable operational impact.

The recommended decision is to fund an MVP that supports ingestion, rubric execution, structured scoring, human review, analytics, monitoring, and security controls for a representative subset of queues. The MVP should run on Microsoft Azure using AKS, and benchmark both L40 and A100 GPU options before final production sizing.

## 2. Business Background

### Purpose

This section explains the business context in which Auto QRA will operate. It describes why customer conversation quality review is strategically important, why current operating models struggle at scale, and why enterprise AI is now practical for this workflow. The purpose is to align stakeholders around the business environment before narrowing into objectives, requirements, and scope.

### Description

Customer conversations are a primary source of operational truth. They reveal whether agents follow policy, resolve issues, communicate clearly, protect customer data, and represent the brand appropriately. In many enterprises, however, quality review remains sample-based and labor-intensive. Reviewers select a small subset of interactions, listen or read manually, score against a rubric, and document findings. This process provides valuable insight, but it is constrained by human capacity and often lags behind actual customer experience.

The growth of digital support channels, omnichannel contact centers, and conversational data has increased both the volume and complexity of quality assurance. A single audit may require review of tone, empathy, verification, compliance language, resolution accuracy, documentation quality, escalation handling, and policy adherence. With 30 QA parameters per audit, the review process is cognitively demanding and susceptible to inconsistency. Different reviewers may interpret parameters differently, and performance managers may receive delayed or incomplete signals.

AI-assisted review is now feasible because self-hosted LLMs can parse long conversations, apply rubrics, summarize evidence, and produce structured outputs. vLLM enables efficient serving and batching for transformer models, while quantized 3B and 7B models make private deployment more economical. The enterprise can therefore adopt an architecture that provides automation benefits without sending sensitive customer conversations to third-party hosted model APIs.

### Business Justification

The business case for Auto QRA rests on four forces: rising conversation volume, limited QA capacity, higher expectations for compliance evidence, and demand for faster coaching. At 60,000 audits per month, manual review at full scale would require a large dedicated workforce. Even if the organization already performs substantial QA, automation can shift human effort from repetitive evidence gathering to calibration, exception review, coaching, and continuous improvement.

The platform also supports management consistency. Executives and operations leaders need comparable metrics across teams and time periods. When each reviewer applies rubric criteria differently, trend analysis becomes less reliable. Auto QRA can standardize first-pass scoring logic, preserve prompt and rubric versions, and record evidence for every score. This creates a stronger foundation for performance governance.

| Current operating challenge | Business impact | Auto QRA response |
| --- | --- | --- |
| Low sample coverage | Defects remain undetected | Expand automated audit capacity |
| Delayed QA results | Coaching happens too late | Process conversations closer to real time |
| Reviewer inconsistency | Metrics lose credibility | Apply versioned rubric and calibration loop |
| Manual evidence collection | High effort per audit | Extract structured findings and snippets |
| Limited compliance traceability | Audit response is slower | Preserve logs, evidence, and override history |

### Technical Details

The background context implies a need for a platform that can integrate with existing customer interaction repositories, support asynchronous processing, and provide reliable downstream reporting. The technical design should assume conversation data may arrive from multiple channels, including voice transcripts, chat logs, email threads, and CRM case notes. The MVP may start with one or two sources, but the data model should anticipate channel, queue, language, agent, supervisor, customer segment, and policy metadata.

From an infrastructure perspective, Azure is preferred because it offers managed Kubernetes, Azure Blob Storage, IAM integration patterns, managed PostgreSQL options, and GPU-enabled compute. Docker and Kubernetes readiness allow the platform to run consistently across development, test, and production environments. Redis supports job queueing, cache coordination, and rate control. PostgreSQL supports audit workflow, score storage, rubric versions, override records, and operational metadata. Superset supports executive and operational dashboards, while Prometheus/Grafana supports application and infrastructure monitoring.

### Best Practices

Business background should be translated into measurable service design constraints. If QA results are needed for next-day coaching, the ingestion and processing windows must support that. If compliance evidence must be retained, storage and retention policies must be defined. If reviewers need to trust the output, explanations and evidence should be built into the product experience. If business units have different rubrics, the platform should manage rubric versions without fragmenting the core architecture.

It is also a best practice to distinguish between quality review, compliance review, and performance management. Auto QRA may support all three, but each has different governance requirements. Quality review focuses on service excellence, compliance review focuses on policy adherence and evidence, and performance management may affect employee outcomes. The more the system influences employee evaluation, the stronger the need for transparency, calibration, appeal, and human override.

### Risks

The most significant business-background risk is treating automation as purely a technology modernization effort. If operating model changes are ignored, the platform may produce scores that business teams do not use. Another risk is inconsistent source data. Poor transcript quality, missing metadata, inaccurate speaker labels, and incomplete conversations can reduce model agreement and undermine trust.

There is also a risk that different business units expect different definitions of quality. A sales support queue may value conversion and needs discovery, while a regulated service queue may prioritize identity verification and disclosure. Without clear taxonomy and rubric governance, the platform could become difficult to scale across the enterprise.

### Recommendations

Anchor Auto QRA in a business transformation narrative: broader coverage, faster coaching, stronger compliance visibility, and more consistent decision support. Define the initial domain carefully, select conversation sources with sufficient data quality, and choose a QA rubric that is stable enough for automation. Establish enterprise rubric governance before large-scale rollout.

For the first release, prioritize use cases where the organization already has a mature QA process, reliable transcripts, and active management demand for higher coverage. Avoid beginning with the most ambiguous or politically sensitive review areas. A successful first domain should demonstrate measurable value and create a reusable platform foundation.

## 3. Problem Statement

### Purpose

This section defines the business and technical problem that Auto QRA must solve. It clarifies pain points, establishes why the current state is insufficient, and frames the design challenge in measurable terms. A strong problem statement prevents solution drift and keeps the program focused on outcomes rather than technology novelty.

### Description

The enterprise lacks a scalable, consistent, secure, and timely mechanism to audit large volumes of customer conversations against a 30-parameter QA rubric. Current manual or semi-manual processes cannot economically review the desired volume of 60,000 audits per month while maintaining consistent interpretation, rapid turnaround, and robust evidence capture. As a result, quality defects may be discovered late, coaching may lag, compliance issues may be under-sampled, and leadership may lack a reliable view of customer experience quality.

The problem is not simply that manual QA is expensive. The deeper problem is that manual sampling creates blind spots. A small sample may not represent the true distribution of issues across teams, products, customer segments, or channels. Inconsistent scoring further reduces confidence in management reporting. When quality signals arrive days or weeks after the conversation, the enterprise loses the opportunity to correct behavior quickly.

Technically, the organization needs a platform that can automate the repetitive parts of audit execution while retaining human oversight. The solution must process long conversation text, apply a complex rubric, generate structured results, respect security and privacy controls, and operate within latency and availability targets. It must do this with self-hosted model infrastructure to preserve control over customer data.

### Business Justification

Solving this problem creates value by converting customer conversations from a partially sampled control activity into a scalable intelligence asset. Auto QRA can help leaders identify systemic service failures, training gaps, policy confusion, high-risk agent behaviors, and emerging customer pain points. By processing approximately 2,000 audits per day, the platform can provide a more complete view of operational quality than manual sampling alone.

The problem also has direct cost and risk dimensions. Manual audit growth requires additional reviewer capacity. Compliance misses can create remediation costs, customer harm, reputational damage, and regulatory exposure. Inconsistent QA can create employee relations concerns if scores are used for coaching or performance management. A controlled AI platform can reduce these pressures by improving consistency, traceability, and review throughput.

### Technical Details

The technical problem is a multi-step AI workflow problem rather than a single inference call. The system must ingest source conversation data, normalize the text, mask PII, identify conversation metadata, construct prompts, call a self-hosted vLLM endpoint, validate structured output, compute score states, persist results, expose review workflows, and monitor quality and performance. Each stage can fail independently and therefore requires explicit controls.

The token profile is central to the design. Each audit uses approximately 2,500 input tokens and 700 output tokens, resulting in 3,200 total tokens. With 60,000 monthly audits, raw monthly token demand is about 192 million tokens. Retries, calibration, benchmark suites, prompt experiments, and reviewer re-runs may increase this number. Queue management and GPU scheduling must therefore be designed with operational headroom, not only average daily volume.

| Problem dimension | Current-state pain | Required target state |
| --- | --- | --- |
| Coverage | Limited sampling | 60,000 audits per month |
| Speed | Delayed review cycles | Less than 60 seconds per audit once processing starts |
| Consistency | Reviewer variance | Greater than 90% human agreement |
| Accuracy | Incomplete or subjective evidence | Hallucination below 5% with evidence traceability |
| Reliability | Manual process dependencies | 99.9% service availability |
| Governance | Fragmented logs and decisions | RBAC, audit logging, overrides, rubric versioning |

### Best Practices

The problem should be decomposed into measurable product capabilities. Do not ask the LLM to solve governance, workflow, reporting, and model quality without surrounding system controls. The recommended best practice is to use deterministic software for orchestration, validation, storage, access control, and reporting, while using the LLM for language understanding, classification support, evidence extraction, and rubric-based reasoning.

Prompt outputs should be constrained through JSON schemas or equivalent structured formats. The platform should reject malformed outputs, mark uncertain results for review, and avoid presenting unsupported claims as final truth. Model behavior should be measured continuously against human-reviewed gold sets, with separate metrics for score agreement, evidence accuracy, false positives, false negatives, and hallucination.

### Risks

If the problem is framed too narrowly as "replace QA reviewers," the program may face adoption resistance and governance risk. If framed too broadly as "analyze all conversations for all purposes," the implementation may become too complex for a successful first release. There is also a technical risk that the selected 3B or 7B quantized model may not reach the required agreement level for all 30 parameters, especially if some parameters require policy interpretation or business context not present in the conversation.

Another risk is hidden dependency on source data quality. If transcripts include speaker errors, missing segments, poor punctuation, or inaccurate timestamps, the LLM may produce incorrect scores. This could be misinterpreted as model failure when the root cause is upstream data quality.

### Recommendations

Define the primary problem as scalable, explainable, AI-assisted QA review with human governance. Avoid positioning the solution as fully autonomous adjudication during initial phases. Build a measurable evaluation framework before production rollout and use it to determine which QA parameters are safe for automation, which require human confirmation, and which are out of scope until the model or source data improves.

Create a problem-to-control traceability matrix during detailed design. Each problem should map to a product feature, a technical control, and a metric. For example, reviewer inconsistency maps to versioned rubrics, calibration workflows, and human agreement; hallucinated evidence maps to schema validation, evidence citation, and hallucination audits; throughput limitations map to vLLM batching, GPU sizing, and queue monitoring.

## 4. Business Objectives

### Purpose

This section defines the measurable business outcomes Auto QRA must achieve. It translates the problem statement into objectives that can be governed, funded, implemented, and measured. The purpose is to give executives and delivery teams a shared definition of success.

### Description

Auto QRA has six primary business objectives. First, increase quality review coverage to support 60,000 audits per month. Second, reduce audit turnaround time so results are available quickly enough for operational action. Third, improve scoring consistency by using a versioned rubric and calibrated model outputs. Fourth, strengthen compliance and evidence capture through structured findings and audit logs. Fifth, improve coaching effectiveness by surfacing parameter-level insights and conversation evidence. Sixth, preserve enterprise control through self-hosted model infrastructure and strong security controls.

These objectives are mutually reinforcing. Higher coverage creates better insight, faster processing improves coaching relevance, consistent scoring builds trust, and security controls enable responsible enterprise adoption. The objectives should be managed as an integrated portfolio rather than isolated technology targets.

### Business Justification

Clear objectives reduce ambiguity and prevent the program from becoming a proof of concept with unclear adoption criteria. Enterprise AI programs often fail when success is defined only by model demonstration. Auto QRA should be judged by operational value: completed audits, trusted scores, useful findings, secure processing, and measurable improvement in quality management.

The objectives also help prioritize trade-offs. For example, a 7B model may deliver higher agreement but require more GPU resources. A 3B model may reduce cost and improve latency but may underperform on nuanced parameters. The business objective of human agreement greater than 90% should guide model selection more strongly than model size preference alone.

| Objective | Target | Executive owner | Evidence of achievement |
| --- | --- | --- | --- |
| Expand audit coverage | 60,000 audits/month | QA Operations | Completed audit records by period |
| Accelerate review | Less than 60s audit latency | Product and Engineering | Latency dashboards and SLO reports |
| Improve trust | Greater than 90% human agreement | QA Governance | Calibration study results |
| Reduce hallucination | Less than 5% unsupported findings | Risk and QA Governance | Evidence accuracy reviews |
| Sustain reliability | 99.9% availability | Enterprise Architecture / SRE | Uptime and incident reports |
| Protect data | SSO, PII masking, RBAC, encryption, audit logs | Security / Privacy | Control testing and audit evidence |

### Technical Details

Business objectives translate into explicit technical requirements. Coverage requires scalable asynchronous processing, GPU capacity planning, retry policies, and queue visibility. Turnaround time requires efficient preprocessing, prompt construction, vLLM serving, output parsing, and persistence. Human agreement requires evaluation tooling, gold datasets, reviewer calibration, and model monitoring. Hallucination control requires evidence grounding, validation rules, and review workflows. Availability requires resilient Kubernetes deployment, health checks, autoscaling where appropriate, backup and recovery, and observability.

The platform should treat each audit as a traceable workflow with a unique audit ID. Every workflow should preserve source references, prompt version, model version, rubric version, output schema version, inference timing, reviewer actions, override rationale, and final score. This design supports compliance, debugging, model evaluation, and business reporting.

### Best Practices

Objectives should follow a balanced scorecard model. Do not measure only throughput and cost. Include quality, trust, security, adoption, and operational impact. Metrics should be defined before pilot launch and baselined against current manual QA performance. Each objective should have an accountable owner, measurement method, target, review cadence, and escalation path.

The technical team should define service-level indicators and service-level objectives early. For example, latency should clarify whether it measures time from job submission to completion, model inference time only, or end-to-end ingestion-to-result time. Availability should define production API and worker availability, excluding planned maintenance if applicable. Human agreement should define the population, sampling method, and tie-breaking process.

### Risks

Objectives may conflict if not governed. Reducing latency can conflict with model quality if shorter prompts omit context. Increasing coverage can conflict with cost if GPU utilization is inefficient. Lowering hallucination can conflict with output completeness if the model becomes overly conservative. Security controls can slow implementation if not included in the architecture from the beginning.

Another risk is using aggregate targets without parameter-level visibility. The platform may reach greater than 90% overall agreement while underperforming on specific high-risk parameters. This would create hidden compliance exposure. Metrics must therefore be segmented by QA parameter, channel, queue, language, model version, and reviewer group where relevant.

### Recommendations

Approve the objectives as program-level success criteria and use them to guide funding, architecture, and rollout decisions. Establish an executive dashboard that reports coverage, latency, availability, agreement, hallucination, override rate, reviewer adoption, and business impact. Use phase gates so the platform cannot progress from pilot to scaled production unless objective evidence supports the move.

Recommended phase-gate decision table:

| Gate | Entry condition | Exit criteria | Decision owner |
| --- | --- | --- | --- |
| Discovery | Business sponsor approved | Source data, rubric, and success metrics confirmed | Product Management |
| MVP build | Architecture and security approach approved | End-to-end workflow operates in test | Enterprise Architecture |
| Shadow pilot | Model benchmark complete | Greater than 90% agreement on pilot set or mitigation plan approved | QA Governance |
| Assisted production | Human review workflow active | Stable latency, hallucination, and override metrics | Operations Steering Group |
| Scale-up | Pilot value demonstrated | Capacity, controls, and runbooks validated | Executive Sponsor |

## 5. Vision

### Purpose

This section describes the long-term product vision for Auto QRA. It provides a strategic north star that guides design decisions while keeping the first release practical. The purpose is to help stakeholders understand how the platform can evolve from automated audit assistance into an enterprise conversation intelligence capability.

### Description

The vision for Auto QRA is to create a trusted, secure, and scalable AI quality layer for customer operations. In the near term, the platform will automate first-pass QA review for selected conversation types. In the medium term, it will support broader channels, deeper analytics, model calibration workflows, and proactive coaching signals. In the long term, it can become a governed enterprise system for conversation quality intelligence, helping leaders detect emerging risks, identify training needs, monitor compliance themes, and improve customer experience systematically.

The vision depends on trust. Users must understand why a score was produced, what evidence supports it, and when human review is required. Reviewers must be able to override outputs and feed corrections back into the improvement cycle. Leaders must be able to rely on dashboards because data lineage, model versioning, and audit controls are in place. Security teams must be confident that sensitive conversation data remains within approved infrastructure.

```mermaid
flowchart LR
    A[Phase 0: Strategy and Governance] --> B[Phase 1: MVP Audit Automation]
    B --> C[Phase 2: Shadow and Assisted Review]
    C --> D[Phase 3: Production Scale]
    D --> E[Phase 4: Enterprise Conversation Intelligence]
    E --> F[Phase 5: Continuous Optimization]

    A1[Define rubric, controls, and success metrics] --> A
    B1[Ingest conversations, mask PII, run vLLM audits] --> B
    C1[Compare AI results with human QA and calibrate] --> C
    D1[Operate at 60,000 audits/month with 99.9% availability] --> D
    E1[Trend analysis, coaching insights, compliance themes] --> E
    F1[Model evaluation, prompt improvement, drift management] --> F```

### Business Justification

A clear vision creates continuity across releases and prevents narrow automation from becoming a throwaway tool. The enterprise can justify the investment because the same platform foundation supports multiple business outcomes: QA scale, coaching speed, compliance evidence, operational insight, and future analytics. Building the right foundation early reduces duplicate systems and makes later expansion more cost-effective.

The vision also supports workforce alignment. Human QA reviewers remain important, but their role shifts toward exception handling, calibration, root-cause analysis, and coaching enablement. This is a higher-value operating model than manual review of every parameter for every selected conversation.

### Technical Details

The vision requires modular architecture. Model serving should be decoupled from workflow orchestration. Rubric definitions should be versioned independently from application code. Prompt templates should be managed as controlled artifacts. Data storage should separate raw conversation artifacts in Azure Blob Storage from structured workflow and scoring data in PostgreSQL. Analytics should consume curated tables rather than raw model responses. Monitoring should include infrastructure, application, model, and business metrics.

The long-term platform should support multiple model versions, A/B evaluation, rollback, and parameter-level confidence thresholds. It should be possible to route certain audits to a 3B model for lower-risk parameters and a 7B model for more nuanced analysis if benchmarks support such a pattern. The system should also support batch processing and near-real-time processing where business need justifies it.

### Best Practices

The best practice is to design for a product lifecycle, not a one-time AI experiment. Every prompt, model, rubric, and output schema should have lifecycle management. Human feedback should be captured in a form that can support evaluation and improvement. Dashboards should be designed for action, not only visibility. Operational runbooks should cover latency incidents, model degradation, queue backlog, failed output validation, and security events.

Vision should also include responsible AI principles. The platform should be transparent about automated assistance, avoid unsupported claims, provide human override, maintain audit trails, and define acceptable use. If outputs influence employee coaching or evaluation, governance should ensure fairness, calibration, and appeal mechanisms.

### Risks

The vision may be diluted if the first release is built as a narrow script around model inference. Such an approach may work for a demonstration but fail when security, monitoring, workflow, and reporting are required. Conversely, the program may overbuild if it tries to deliver the full long-term vision in the first release.

Another risk is strategic dependency on a model that cannot be operated cost-effectively at scale. A 7B quantized model may produce better quality but require more expensive GPU capacity. A 3B model may be cheaper but may need stronger prompt engineering, additional validation, or narrower scope. The vision must remain model-flexible.

### Recommendations

Adopt a phased roadmap with explicit capability increments. The first release should prove the core loop: ingest, mask, audit, validate, review, persist, report, and monitor. Later releases should expand channels, analytics, calibration, and optimization. The architecture should be production-ready from the start in security and observability, but product features should be sequenced based on business value and risk.

Recommended vision principles:

| Principle | Meaning | Design implication |
| --- | --- | --- |
| Human-governed AI | AI assists decisions but humans can override | Reviewer workflow and override audit trail are mandatory |
| Evidence-first scoring | Scores require supporting conversation evidence | Output schema must include source-grounded rationale |
| Enterprise control | Sensitive data remains in approved infrastructure | Self-hosted vLLM, encryption, RBAC, and audit logging |
| Model flexibility | Model choice can evolve | Abstract inference layer and versioned evaluation |
| Operational scale | Platform runs reliably at target volume | Kubernetes, queue controls, monitoring, and runbooks |

## 6. Product Strategy

### Purpose

This section defines how Auto QRA should be delivered as a product. It outlines the target users, core capabilities, rollout approach, decision criteria, and product management priorities. The purpose is to turn the vision into an actionable strategy that delivery teams can implement and executives can govern.

### Description

The product strategy is to build Auto QRA as an enterprise workflow platform for AI-assisted quality review. The product should begin with a focused MVP for one or more high-value conversation queues where transcripts, rubric definitions, and reviewer workflows are mature. The MVP should include automated audit execution against 30 QA parameters, structured findings, reviewer override, dashboard reporting, security controls, and operational monitoring.

The product should support several user groups. QA reviewers need a queue of AI-generated audit results, evidence snippets, confidence indicators, and override controls. QA managers need calibration reports, parameter trends, and reviewer productivity views. Operations leaders need quality performance dashboards by team, queue, and time period. Security and compliance teams need audit logs, access control, data retention, and evidence of PII protection. Engineering and MLOps teams need observability, model evaluation, prompt versioning, and deployment controls.

### Business Justification

Product strategy matters because AI automation adoption depends on workflow fit. If Auto QRA only exposes an API or raw model output, business users may not trust or operationalize it. By delivering a product experience around the AI capability, the enterprise can embed the platform into daily QA operations and management routines.

The strategy also supports incremental value realization. A narrow MVP can prove value quickly while avoiding broad enterprise rollout risk. Once the MVP demonstrates agreement, latency, security, and user adoption, the platform can expand to additional queues and channels.

### Technical Details

The product architecture should be service-oriented. Key components include an ingestion service, preprocessing and PII masking service, audit orchestration service, vLLM inference service, output validation service, workflow API, reviewer UI or integration layer, PostgreSQL persistence, Azure Blob Storage artifact storage, Redis queueing, Superset semantic datasets, and Prometheus/Grafana monitoring. Kubernetes should manage service deployment, scaling, health checks, and resource isolation.

Product configuration should include rubric definitions, prompt templates, model endpoints, threshold rules, queue routing, retry settings, and retention policies. These should be environment-specific but governed through controlled configuration management. The platform should support dev, test, staging, and production environments, with production changes requiring approval and rollback plans.

Decision table for model and infrastructure strategy:

| Decision area | Option A | Option B | Preferred approach | Rationale |
| --- | --- | --- | --- | --- |
| Model size | 3B quantized | 7B quantized | Benchmark both | Optimize quality, latency, and GPU cost using evidence |
| GPU type | L40 48GB | A100 80GB | Benchmark both | L40 may reduce cost; A100 may improve headroom |
| Deployment | VM-based service | Kubernetes | Kubernetes-ready | Supports resilience, scaling, and enterprise operations |
| Cloud | Microsoft Azure | Other cloud | Azure preferred | Aligns with project preference and managed service fit |
| Review mode | Fully automated | Human override | Human override allowed | Preserves governance and trust |
| Storage | Single relational store | PostgreSQL plus Azure Blob Storage | PostgreSQL plus Azure Blob Storage | Separates workflow data from large artifacts |

### Best Practices

The product should be designed around user journeys. For QA reviewers, the journey begins with a queue of pending audits and ends with accepted, overridden, or escalated results. For managers, the journey begins with quality trends and ends with coaching action. For technical operators, the journey begins with service health and ends with incident resolution or optimization.

Product releases should be managed with feature flags or controlled rollout configuration. New rubric versions and prompt versions should be tested in shadow mode before they affect production reporting. Dashboards should distinguish AI-generated, human-confirmed, and overridden scores. This distinction is critical for trust and for interpreting trends during rollout.

### Risks

The product strategy may fail if the platform is built around model capability rather than business workflow. Users may reject outputs if they cannot see evidence, override decisions, or understand score rationale. A second risk is product complexity. Attempting to support every channel, rubric, and reporting dimension in the first release can slow delivery and increase risk.

There is also risk in underinvesting in configuration management. If prompts and rubrics are edited informally, reporting trends may become invalid because historical scores are no longer comparable. Similarly, if model versions change without controlled evaluation, agreement and hallucination metrics may shift unexpectedly.

### Recommendations

Prioritize an MVP that is complete across the end-to-end workflow but narrow in domain. It should not be a partial backend-only prototype. The MVP should include enough product surface for reviewers and managers to validate real operational usefulness. Establish a product council that reviews roadmap priority, rubric changes, dashboard adoption, and user feedback.

Recommended release strategy:

| Release | Product focus | Technical focus | Business outcome |
| --- | --- | --- | --- |
| R0 | Design and benchmark | Data profiling, model tests, security design | Confirm feasibility and target model |
| R1 | MVP workflow | Ingestion, masking, vLLM, validation, PostgreSQL | Complete first-pass audits |
| R2 | Assisted review | Reviewer UI, override, calibration dashboard | Build trust and collect feedback |
| R3 | Production scale | Kubernetes hardening, SLOs, Superset, monitoring | Operate 60,000 audits/month |
| R4 | Optimization | Prompt/model iteration, drift monitoring, advanced analytics | Improve quality and reduce cost |

## 7. Success Metrics

### Purpose

This section defines the metrics that will determine whether Auto QRA is successful. It provides a measurement framework for executives, product owners, QA leaders, engineering teams, and risk stakeholders. The purpose is to ensure the platform is evaluated using evidence rather than subjective impressions.

### Description

Auto QRA success should be measured across business impact, model quality, operational performance, user adoption, security, and financial efficiency. The mandatory headline metrics are 60,000 audits per month, latency below 60 seconds, availability of 99.9%, human agreement greater than 90%, and hallucination below 5%. These metrics should be expanded into a scorecard that includes parameter-level agreement, override rate, review throughput, coaching cycle time, compliance exception detection, and incident frequency.

Metrics should be reported at multiple levels. Executives need concise trend views and threshold status. QA managers need parameter, team, queue, and reviewer breakdowns. MLOps teams need model performance, validation failures, prompt versions, token counts, GPU utilization, and drift indicators. Security teams need access logs, PII masking outcomes, and control compliance.

### Business Justification

Metrics create accountability and enable phase-gate decisions. Without clear metrics, the enterprise may either overtrust the system too early or fail to recognize demonstrated value. A scorecard also protects against optimizing one dimension at the expense of another. For example, high throughput is not valuable if hallucination rises. High agreement is not sufficient if latency misses operational coaching windows. Low cost is not acceptable if data protection controls are weak.

The metrics should also support continuous improvement. Human override patterns can reveal rubric ambiguity, prompt weaknesses, model limitations, or reviewer training needs. Parameter-level disagreement can guide targeted improvements. Latency and token metrics can guide batching, quantization, and GPU utilization decisions.

### Technical Details

The metrics architecture should collect data from application services, workflow events, model inference logs, reviewer actions, and infrastructure telemetry. PostgreSQL should store business metrics and audit lifecycle events. Prometheus should collect service and infrastructure metrics. Grafana should visualize SLOs, queue depth, latency, error rates, GPU utilization, and model-serving health. Superset should provide business dashboards over curated datasets.

Each audit should emit structured events for ingestion received, preprocessing completed, PII masking completed, inference requested, inference completed, output validated, audit persisted, reviewer opened, reviewer accepted, reviewer overridden, and audit finalized. These events support operational measurement and root-cause analysis.

| Metric category | Metric | Target | Source | Review cadence |
| --- | --- | --- | --- | --- |
| Volume | Completed audits | 60,000/month | PostgreSQL workflow table | Daily and monthly |
| Throughput | Daily audits | About 2,000/day | Job queue and audit records | Daily |
| Latency | End-to-end audit processing | Less than 60s | Application traces | Hourly and daily |
| Availability | Production service uptime | 99.9% | Prometheus/Grafana | Monthly SLO review |
| Quality | Human agreement | Greater than 90% | Calibration dataset | Weekly during pilot, monthly after scale |
| Quality | Hallucination rate | Less than 5% | Evidence review sample | Weekly during pilot, monthly after scale |
| Adoption | Human override rate | Monitor by parameter | Reviewer workflow | Weekly |
| Security | Unauthorized access events | Zero tolerated | Audit logs / SIEM | Continuous |
| Efficiency | GPU utilization | Target band set after benchmark | vLLM and GPU telemetry | Daily |

### Best Practices

Metrics should have definitions, owners, thresholds, and actions. For example, if human agreement drops below 90% for a parameter, the action may be to route that parameter to mandatory human review, review prompt changes, update the rubric, or retrain calibration guidance. If hallucination exceeds 5%, the action may include disabling automated acceptance for affected parameters and conducting evidence-grounding analysis.

It is a best practice to distinguish leading indicators from lagging indicators. Queue depth, validation failures, and GPU utilization are leading operational indicators. Customer satisfaction, repeat contacts, escalations, and compliance findings are lagging business indicators. Both are needed. Model performance should also be monitored over time because conversation patterns, products, policies, and customer behavior can drift.

### Risks

Metrics can create false confidence if they are aggregated too broadly. Overall agreement may hide underperformance in critical parameters. Average latency may hide p95 or p99 delays. Monthly availability may hide repeated short incidents during business-critical windows. Hallucination measurement may be unreliable if reviewers do not consistently label unsupported evidence.

Another risk is metric gaming. If users learn that certain outputs are accepted automatically, they may under-review edge cases. If managers focus only on score improvement, agents may optimize behavior for measured parameters while neglecting unmeasured customer needs. Governance should therefore pair metrics with qualitative review and calibration.

### Recommendations

Implement a tiered metric scorecard with executive, operational, and technical views. Use p50, p95, and p99 latency rather than averages alone. Report human agreement and hallucination by parameter, queue, and model version. Separate AI-generated scores from human-finalized scores in reporting. Use override rate as a learning signal, not as an automatic failure indicator.

Recommended dashboard set:

| Dashboard | Primary audience | Key questions answered |
| --- | --- | --- |
| Executive value dashboard | Executives and sponsors | Are we achieving coverage, quality, reliability, and business value? |
| QA operations dashboard | QA managers | Which teams, queues, and parameters need attention? |
| Calibration dashboard | QA governance | Where does AI disagree with humans and why? |
| Model operations dashboard | MLOps and engineering | Is inference healthy, efficient, and stable? |
| Security dashboard | Security and compliance | Are access, PII controls, and audit logs operating correctly? |

## 8. Stakeholders

### Purpose

This section identifies the stakeholders who influence, operate, govern, or consume Auto QRA. It clarifies roles, responsibilities, decision rights, and communication needs. The purpose is to reduce ambiguity and ensure that the platform is delivered as an enterprise capability with appropriate ownership.

### Description

Auto QRA spans business operations, product management, technology delivery, AI governance, security, compliance, and end users. The primary business stakeholders are customer operations leaders, QA managers, QA reviewers, supervisors, and agents whose conversations may be reviewed. Product Management owns product direction, prioritization, adoption, and value realization. Enterprise Architecture owns alignment to technology standards and target-state architecture. Engineering and MLOps own platform implementation, model deployment, observability, and reliability. Security, Privacy, Legal, and Compliance own control requirements and acceptable-use boundaries.

Stakeholder alignment is particularly important because Auto QRA can influence how employee performance, customer experience, and compliance are interpreted. Governance must therefore include transparent communication about what the system does, how it is validated, how humans can override it, and how outputs are used.

```mermaid
flowchart TB
    Sponsor[Executive Sponsor] --> Product[Product Management]
    Sponsor --> Ops[Customer Operations]
    Sponsor --> Governance[AI / QA Governance]

    Product --> Reviewers[QA Reviewers]
    Product --> Managers[QA Managers]
    Product --> Engineering[Engineering]

    Engineering --> MLOps[MLOps and Platform]
    Engineering --> Data[Data Engineering]
    Engineering --> SRE[SRE / Operations]

    Governance --> Security[Security]
    Governance --> Privacy[Privacy and Legal]
    Governance --> Compliance[Compliance]

    Ops --> Supervisors[Supervisors]
    Supervisors --> Agents[Customer Service Agents]
    Managers --> Superset[Superset Dashboards]
    SRE --> Grafana[Prometheus / Grafana]```

### Business Justification

Stakeholder clarity is essential for adoption and risk management. QA reviewers must trust the tool enough to use it. Managers must understand how to interpret AI-assisted scores. Agents and supervisors need confidence that the system is fair, explainable, and subject to human review. Security and compliance teams need evidence that sensitive data is handled properly. Executives need a reliable view of value and risk.

The program will require decisions about model thresholds, rubric changes, data retention, access roles, override policy, and rollout timing. These decisions cannot be made by engineering alone. A RACI model provides a practical structure for enterprise governance.

### Technical Details

Stakeholder needs translate into access roles and product capabilities. SSO should authenticate users through the enterprise identity provider. RBAC should differentiate at least admin, QA manager, QA reviewer, auditor, operations viewer, model operator, security auditor, and system service roles. Audit logging should record user access, score changes, overrides, configuration changes, model version changes, and export activity.

The stakeholder model also affects data partitioning. Business users may only be allowed to view conversations for their queue, geography, or business unit. Security auditors may need cross-cutting access to logs but not full conversation content. MLOps teams may need model telemetry and anonymized samples but not unnecessary PII. These needs should be reflected in RBAC and data minimization.

### Best Practices

Define stakeholder responsibilities before pilot launch. Create a steering committee for major decisions and a working group for day-to-day delivery. Maintain a communications plan that explains rollout phases, limitations, and escalation paths. Provide training for reviewers on interpreting AI output, using override controls, and labeling hallucinations or disagreements.

The platform should support role-specific user experiences. Reviewers should not need to understand GPU utilization. Executives should not need to inspect raw JSON. MLOps teams should not rely on business dashboards for model health. Stakeholder-centered design improves adoption and reduces operational friction.

### Risks

Stakeholder misalignment can cause program delays or post-launch resistance. If QA reviewers feel automation threatens their role, adoption may suffer. If agents believe scores are final without appeal, employee relations risk increases. If security is engaged late, deployment may be blocked by control gaps. If executives expect immediate full automation, the program may be pressured to bypass necessary calibration.

There is also a risk of unclear ownership after launch. AI platforms require ongoing prompt management, model evaluation, data quality monitoring, incident response, and rubric governance. Without named owners, quality can degrade silently.

### Recommendations

Approve a stakeholder governance model with clear RACI assignments and operating cadences. Establish an Auto QRA Steering Committee for executive decisions and an Auto QRA Product Working Group for delivery execution. Assign named owners for rubric governance, model evaluation, security controls, data quality, platform reliability, and business adoption.

RACI matrix:

| Activity | Executive Sponsor | Product Mgmt | QA Ops | Enterprise Architecture | Engineering / MLOps | Security / Privacy | Compliance / Legal |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Program funding and strategic priority | A | R | C | C | C | C | C |
| Product roadmap | C | A/R | C | C | C | C | C |
| QA rubric governance | C | C | A/R | C | C | C | C |
| Architecture approval | C | C | C | A | R | C | C |
| Model deployment and monitoring | I | C | C | C | A/R | C | I |
| Security control approval | I | C | C | C | R | A | C |
| Privacy and acceptable use | C | C | C | I | C | A/R | A/R |
| Pilot go-live | A | R | R | C | R | C | C |
| Production scale-up | A | R | R | A/C | R | C | C |

## 9. Assumptions

### Purpose

This section documents the assumptions that shape the business case, product design, architecture, and delivery plan. The purpose is to make dependencies explicit so they can be validated, monitored, and revised as evidence emerges.

### Description

Auto QRA planning assumes the enterprise will deploy a self-hosted LLM using vLLM, select a 3B or 7B quantized model after benchmarking, and operate on NVIDIA L40 48GB or A100 80GB GPUs. It assumes Azure is the preferred cloud platform and that the solution should be Docker deployed on AKS. It assumes the initial target volume is 60,000 audits per month, about 2,000 per day, with each audit evaluating 30 QA parameters and consuming about 3,200 total tokens.

The plan also assumes the organization can provide access to representative historical conversations, current QA rubrics, human-reviewed labels or calibration data, and business subject matter experts. It assumes that PII masking can be implemented before model inference and that masked content remains sufficient for QA scoring. It assumes human override is allowed and expected.

### Business Justification

Assumptions help executives understand what must be true for the business case to hold. If source transcripts are unreliable, the model may not reach agreement targets. If GPU supply is constrained, latency may miss the business need. If human calibration data is inconsistent, the model benchmark may be inconclusive. If legal or privacy rules prohibit certain processing, scope may need to change.

By documenting assumptions early, the program can convert them into validation tasks. This reduces delivery risk and supports disciplined phase gates.

### Technical Details

Technical assumptions include availability of Kubernetes-compatible deployment environments, enterprise identity integration for SSO, network connectivity between source systems and the Auto QRA platform, PostgreSQL availability, Azure Blob Storage storage, Redis deployment, monitoring through Prometheus/Grafana, and analytics through Superset. The design assumes encryption at rest and in transit can be implemented using standard enterprise tooling and that audit logging can be integrated with centralized log management or SIEM where required.

Model assumptions include adequate performance from a quantized 3B or 7B model, support for the target context length, compatibility with vLLM, and sufficient structured-output reliability. Workload assumptions include average token counts of 2,500 input and 700 output tokens, stable daily volume around 2,000 audits, and manageable retry rates.

Assumption register:

| ID | Assumption | Validation approach | Owner | Status |
| --- | --- | --- | --- | --- |
| A1 | Representative conversation data is available | Data profiling and access review | Data Engineering | To validate |
| A2 | QA rubric is stable enough for automation | Rubric governance review | QA Operations | To validate |
| A3 | 3B or 7B quantized model can meet agreement targets | Benchmark against gold dataset | MLOps | To validate |
| A4 | L40 or A100 capacity can meet latency and volume targets | Load test with vLLM | Enterprise Architecture | To validate |
| A5 | PII masking preserves scoring-relevant context | Compare masked vs unmasked calibration results | Security / QA Governance | To validate |
| A6 | Human override is permitted and operationally staffed | Workflow and policy approval | QA Operations | Accepted in project facts |
| A7 | Azure is approved for target deployment | Cloud governance review | Enterprise Architecture | To validate |

### Best Practices

Assumptions should be treated as testable statements, not static notes. Each material assumption should have an owner, validation date, evidence, and impact rating. If an assumption fails, the program should update scope, timeline, budget, or technical design. Assumptions with high risk should be validated before major build investment.

It is best practice to separate business assumptions from technical assumptions. Business assumptions include audit volume, reviewer capacity, adoption readiness, and rubric stability. Technical assumptions include model performance, infrastructure availability, integration feasibility, and security control implementation. Both categories affect success.

### Risks

Invalid assumptions can cause major rework. If the model does not reach greater than 90% human agreement, the platform may require narrower scope, stronger human review, alternative models, or additional context retrieval. If hallucination cannot be kept below 5%, automated score acceptance may need to be limited. If source data is incomplete, the workflow may need data quality gates or exclusions.

Another risk is optimistic workload sizing. The baseline of 60,000 monthly audits excludes regression tests, reprocessing, retries, and ad hoc analytics. Production capacity should include headroom for these non-baseline loads.

### Recommendations

Create an assumption validation plan during discovery and close the highest-risk assumptions before MVP build completion. Specifically, validate transcript quality, rubric maturity, model agreement, hallucination rate, PII masking impact, GPU throughput, and integration feasibility. Update the business case after benchmark results are available.

Recommended decision table for assumptions:

| If validation shows... | Then the recommended action is... |
| --- | --- |
| 3B model meets quality and latency targets | Prefer 3B for cost-efficient production, with periodic rebenchmarking |
| 3B misses quality but 7B meets targets | Use 7B for production or route high-risk parameters to 7B |
| Both models miss quality targets | Narrow scope, revise rubric prompts, add retrieval/context, or keep human review mandatory |
| L40 meets throughput with headroom | Prefer L40 for cost efficiency |
| Only A100 meets throughput with headroom | Use A100 for production-critical workloads |
| PII masking reduces agreement materially | Refine masking strategy, preserve safe semantic placeholders, or add policy review |

## 10. Risks

### Purpose

This section identifies major business, technical, operational, security, and adoption risks for Auto QRA. It provides a risk register with mitigation actions and ownership. The purpose is to help leaders make informed decisions and ensure risk management is built into delivery.

### Description

Auto QRA introduces an AI-assisted decision-support capability into a sensitive business process. It handles customer conversations, applies quality and compliance rubrics, and may influence coaching or performance discussions. The risk profile includes model accuracy, hallucination, privacy, security, fairness, operational resilience, cost, source data quality, and stakeholder adoption.

The program should treat risk management as a design requirement. Controls such as human override, PII masking, RBAC, encryption, audit logging, versioning, and monitoring are not optional add-ons. They are necessary to operate the platform responsibly and preserve trust.

### Business Justification

Risk management protects the expected value of Auto QRA. A single privacy incident, materially inaccurate scoring pattern, or unexplainable model behavior can undermine business adoption. Conversely, visible controls can increase confidence and accelerate rollout. Executives should expect a risk-managed AI product to have slower initial rollout than a prototype, but much higher production durability.

Risk visibility also helps prioritize investment. For example, if hallucination risk is high, investment in evidence grounding and review workflows is justified. If throughput risk is high, GPU benchmarking and queue design are justified. If adoption risk is high, change management and reviewer training are justified.

### Technical Details

Risk controls should be implemented across layers. At the data layer, use PII masking, encryption, retention policies, and access partitioning. At the model layer, use benchmark datasets, versioning, structured outputs, validation, and hallucination checks. At the application layer, use RBAC, audit logging, human override, approval workflows, and configuration controls. At the infrastructure layer, use Kubernetes health checks, autoscaling where appropriate, backups, observability, and incident response runbooks.

Risk register:

| ID | Risk | Category | Impact | Likelihood | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | Model agreement below 90% | Model quality | High | Medium | Benchmark 3B/7B, calibrate prompts, route low-confidence items to humans | MLOps / QA Governance |
| R2 | Hallucination above 5% | Model quality | High | Medium | Require evidence snippets, validate outputs, sample review hallucinations | QA Governance |
| R3 | PII exposure | Security / privacy | Very high | Low to medium | PII masking, encryption, RBAC, audit logs, data minimization | Security / Privacy |
| R4 | GPU capacity insufficient | Technical operations | High | Medium | Load test L40/A100, reserve capacity, monitor queue depth | Enterprise Architecture |
| R5 | Latency exceeds 60s | Service performance | Medium to high | Medium | vLLM batching, queue tuning, prompt optimization, autoscaling strategy | Engineering / SRE |
| R6 | Reviewer adoption is low | Change management | High | Medium | Explainability, training, override workflow, feedback loops | Product / QA Ops |
| R7 | Rubric ambiguity reduces consistency | Business process | High | Medium | Rubric governance, calibration workshops, parameter definitions | QA Ops |
| R8 | Source transcripts are poor quality | Data quality | High | Medium | Data profiling, quality gates, exclusions, transcript improvement | Data Engineering |
| R9 | Cost exceeds business case | Financial | Medium | Medium | Benchmark model sizes, monitor GPU utilization, optimize batching | Product / Architecture |
| R10 | Audit logs incomplete | Compliance | High | Low | Define logging schema, test controls, integrate with log retention | Security / Engineering |

### Best Practices

Apply a defense-in-depth model. Do not rely on model behavior alone to manage risk. Combine technical controls, human workflow, governance, monitoring, and operating procedures. Establish risk thresholds and pre-approved actions. For example, if hallucination crosses threshold, affected parameters can be temporarily moved to mandatory human review while root cause is investigated.

Use risk-based rollout. Begin with shadow mode where AI outputs are compared with human reviews but do not affect production decisions. Move to assisted review when results are stable. Consider automated acceptance only for parameters and queues with strong evidence, low risk, and clear override mechanisms.

### Risks

The risk-management process itself can create delivery risk if it becomes too slow or ambiguous. Security, privacy, and compliance stakeholders should therefore define requirements early and participate in design reviews. Another risk is under-measuring residual risk after controls are implemented. Controls must be tested, not assumed.

There is also a risk that mitigation actions degrade user experience. For example, excessive access friction may reduce adoption, while overly conservative model thresholds may route too many audits to manual review. The program should balance risk controls with operational usability.

### Recommendations

Establish an AI risk governance cadence with monthly review during pilot and quarterly review after production stabilization. Maintain a living risk register, link risks to controls, and report residual risk to the steering committee. Require formal approval before expanding to new use cases that affect compliance, employee performance, or sensitive customer segments.

Recommended control priorities:

| Priority | Control | Why it matters |
| --- | --- | --- |
| 1 | PII masking before inference | Reduces privacy exposure in model processing |
| 2 | Human override with rationale | Preserves accountable decision-making |
| 3 | Evidence-grounded outputs | Reduces hallucination and improves trust |
| 4 | Prompt/model/rubric versioning | Supports auditability and reproducibility |
| 5 | SLO monitoring | Ensures production reliability and escalation |
| 6 | Calibration workflow | Sustains human agreement over time |

## 11. Scope

### Purpose

This section defines what Auto QRA will include. It establishes the implementation boundary for the executive and business design package and gives delivery teams a clear basis for planning. The purpose is to prevent ambiguity, manage expectations, and support phased execution.

### Description

The in-scope product is an AI-assisted quality review automation platform that processes customer conversations, masks PII, applies a 30-parameter QA rubric, produces structured audit results, supports human override, stores results and evidence, and provides operational and executive reporting. The target operating volume is 60,000 audits per month with approximately 2,000 audits per day. The platform should use a self-hosted vLLM deployment with a benchmarked 3B or 7B quantized model on NVIDIA L40 or A100 GPUs.

The in-scope technical foundation includes Azure-preferred deployment, Docker deployed on AKS services, PostgreSQL, Redis, Azure Blob Storage, Superset, Prometheus/Grafana, Microsoft Entra ID SSO, RBAC, encryption at rest and in transit, audit logging, and PII masking. The in-scope operating model includes human review, overrides, calibration, and phase-gated rollout.

### Business Justification

Clear scope ensures the first release can deliver meaningful business value without absorbing every possible conversation intelligence use case. The scope focuses on the core QA workflow because it is measurable, repeatable, and directly tied to business objectives. It includes enough security, workflow, and monitoring capability to support enterprise production rather than a disposable proof of concept.

Scope clarity also helps budget and timeline management. GPU infrastructure, model evaluation, reviewer workflow, and analytics each require effort. Defining scope prevents uncontrolled expansion into unrelated functions such as real-time agent assist, customer sentiment marketing, or workforce scheduling.

### Technical Details

Scope matrix:

| Capability | In scope for MVP | In scope for later phase | Notes |
| --- | --- | --- | --- |
| Conversation ingestion from approved source systems | Yes | Expand sources | Start with highest-quality source |
| PII masking before inference | Yes | Improve entity handling | Mandatory production control |
| 30-parameter QA scoring | Yes | Refine by queue/rubric | Parameter-level metrics required |
| Self-hosted vLLM serving | Yes | Multi-model routing | Benchmark 3B and 7B |
| L40/A100 GPU deployment | Yes | Autoscaling optimization | Validate throughput and cost |
| Human override workflow | Yes | Advanced calibration tooling | Required for governance |
| PostgreSQL audit store | Yes | Data mart optimization | Stores workflow and scores |
| Azure Blob Storage artifact storage | Yes | Retention tiering | Stores source artifacts and outputs |
| Superset dashboards | Yes | Advanced analytics | Business reporting layer |
| Prometheus/Grafana monitoring | Yes | SLO automation | Technical operations layer |
| SSO/RBAC/encryption/audit logging | Yes | Continuous control improvements | Mandatory controls |
| Real-time agent assist | No | Potential future | Separate product use case |

The MVP should include APIs or service interfaces for audit submission, status retrieval, result retrieval, reviewer action, configuration retrieval, and dashboard data publishing. The data model should support audit ID, conversation ID, source system, agent ID, queue, channel, timestamps, rubric version, prompt version, model version, score details, evidence snippets, confidence indicators if used, reviewer decision, override rationale, and final status.

### Best Practices

Scope should be organized around value increments. Each release should produce a usable capability, not only technical components. MVP scope should therefore include workflow and reporting, not just inference. Security and governance controls should be included in MVP because retrofitting them later is expensive and risky.

Use clear acceptance criteria for each scope item. For example, "PII masking" should specify entity types, test method, failure handling, and audit evidence. "Human override" should specify who can override, what fields can be changed, whether rationale is required, and how overrides appear in reporting. "Superset dashboards" should specify named dashboards and their source tables.

### Risks

Scope creep is a material risk. Stakeholders may ask to add sentiment analysis, knowledge-base recommendations, agent assist, churn prediction, or automated disciplinary recommendations. These may be valuable future capabilities, but adding them to the initial release would increase risk and delay delivery.

There is also a risk of under-scoping production readiness. If monitoring, audit logging, security, and human override are treated as later enhancements, the system may not be approved for production or trusted by stakeholders. The MVP must be narrow in business domain but complete in control posture.

### Recommendations

Approve the MVP scope as a controlled production-oriented pilot for AI-assisted QA review. Use a formal change-control process for additions. Evaluate scope changes against business value, risk, delivery impact, and alignment with the core objectives. Defer adjacent AI use cases until the platform has demonstrated stable QA automation.

Recommended scope decision criteria:

| Question | Include in MVP if answer is yes | Defer if answer is no |
| --- | --- | --- |
| Does it directly support 60,000 monthly QA audits? | Include | Defer |
| Is it required for security, privacy, or compliance approval? | Include | Defer only with formal risk acceptance |
| Is it required for human trust and override? | Include | Defer only if pilot is shadow-only |
| Can it be validated against success metrics? | Include | Defer until metric is defined |
| Does it introduce a separate product workflow? | Usually defer | Consider later roadmap |

## 12. Out of Scope

### Purpose

This section defines what Auto QRA will not deliver in the initial scope. The purpose is to protect delivery focus, avoid stakeholder misunderstanding, and separate future opportunities from committed capabilities.

### Description

The initial Auto QRA scope does not include fully autonomous employment decisions, real-time agent assist, automated customer communications, automatic disciplinary action, broad customer sentiment mining unrelated to QA, unrestricted ad hoc analysis of raw conversations, or replacement of established compliance investigation processes. It also does not include training a foundation model from scratch. The platform will benchmark and operate a self-hosted 3B or 7B quantized model through vLLM, but full model pretraining is outside scope.

The initial release does not commit to every conversation channel, every language, every business unit, or every possible QA rubric variant. Expansion should occur only after source data, rubric quality, model performance, security, and operational readiness have been validated for each additional domain.

### Business Justification

Out-of-scope clarity is essential for responsible AI adoption. Auto QRA should not be used as an opaque decision engine for employment actions or compliance conclusions without human review. Its value comes from scalable, evidence-supported audit assistance, not from removing accountability. Restricting scope also helps the enterprise deliver faster and learn from production evidence before expanding.

Excluding unrelated use cases protects the business case. Real-time agent assist, next-best-action recommendations, sentiment intelligence, workforce management, and automated customer outreach may require different latency, UX, governance, and integration patterns. Combining them with Auto QRA would create unnecessary complexity.

### Technical Details

Out-of-scope capabilities may still influence future architecture, but they should not drive MVP requirements. For example, the architecture can remain model-flexible and API-oriented without building real-time agent desktop integrations. It can store curated conversation metadata without enabling unrestricted raw data search. It can support future multi-model routing without implementing advanced model orchestration in the first release.

Out-of-scope matrix:

| Capability | Out-of-scope status | Reason | Future consideration |
| --- | --- | --- | --- |
| Fully autonomous final QA decisions with no human override | Out of scope | Governance and trust risk | Revisit only for low-risk parameters with strong evidence |
| Automated employee discipline | Out of scope | HR, legal, and fairness risk | Requires separate policy and governance |
| Real-time agent assist | Out of scope | Different latency and UX needs | Potential separate product roadmap |
| Customer-facing automated responses | Out of scope | Customer harm and brand risk | Requires separate controls |
| Foundation model pretraining | Out of scope | Cost and complexity | Use benchmarked self-hosted models |
| All channels and languages at launch | Out of scope | Data and model variability | Expand through phase gates |
| Unrestricted raw conversation search | Out of scope | Privacy and access risk | Provide governed analytics only |
| Replacement of compliance investigation | Out of scope | Human accountability required | Use as evidence triage support |

### Best Practices

Out-of-scope items should be documented in steering materials and stakeholder training. Product teams should maintain a backlog for future opportunities, but backlog inclusion should not imply approval. Each future use case should have its own business case, risk assessment, metrics, and design review.

The best practice is to state prohibited or restricted uses explicitly. Users should understand that Auto QRA provides AI-assisted quality review and that human override is allowed. If outputs are used in coaching, managers should be trained to consider context and override history. If outputs are used in compliance monitoring, compliance teams should define the required human review standard.

### Risks

The main out-of-scope risk is misuse. Once a platform produces structured scores, other teams may attempt to use those scores for purposes beyond the approved scope. This can create legal, privacy, fairness, and employee relations exposure. Another risk is expectation creep, where stakeholders assume the platform will solve adjacent problems that were never funded or designed.

There is also a technical risk that future out-of-scope use cases are informally added through data exports or dashboard workarounds. RBAC, audit logging, and data governance should prevent uncontrolled secondary use.

### Recommendations

Approve and communicate the out-of-scope boundaries before pilot launch. Include acceptable-use language in product training and governance documentation. Configure RBAC and data access so users can only perform approved actions. Require steering committee approval for any expansion into real-time assistance, employee-impacting automation, customer-facing automation, or broader conversation intelligence use cases.

Recommended expansion decision table:

| Expansion request | Required review before approval |
| --- | --- |
| New channel or language | Data quality, model benchmark, rubric validation, privacy review |
| New business unit | Stakeholder readiness, access model, dashboard needs, support model |
| Automated acceptance for selected parameters | Agreement evidence, hallucination evidence, risk approval, override process |
| Real-time use case | Separate architecture, latency design, UX research, safety review |
| Employee-impacting use | Legal, HR, fairness, auditability, appeal process, executive approval |

The recommended position is to keep Auto QRA focused on secure, explainable, human-governed QA automation until production evidence supports expansion. This focus gives the enterprise the highest probability of delivering measurable value while maintaining responsible AI controls.


---

# Auto QRA Design Package — Part 2, Version 1.0, July 2026

This document covers sections 13 through 19 of the Product and Technical Design Package for Auto Quality Review Automation (Auto QRA), an AI-assisted quality audit capability for customer conversations using a self-hosted LLM deployment. Auto QRA is designed for enterprise contact center, compliance, and customer experience teams that need consistent, scalable, auditable review of voice and text conversations while preserving human accountability, privacy controls, and operational transparency.

The target operating model assumes approximately 60,000 audits per month, about 2,000 audits per business day or equivalent rolling daily workload, with an average prompt footprint of approximately 2,500 input tokens and 700 output tokens per audit. Each audit evaluates up to 30 quality assurance parameters. The inference layer uses self-hosted vLLM with 3B or 7B quantized models on L40 or A100 GPU infrastructure. The platform runs on Azure using Docker and Kubernetes, PostgreSQL for transactional data, Redis for queues and caching, Azure Blob Storage for durable object storage, Superset for analytics, Prometheus and Grafana for observability, and standard enterprise controls including Microsoft Entra ID SSO, RBAC, PII masking, encryption, audit logs, and human override.

## 13. Functional Requirements

### Purpose

The purpose of the functional requirements is to define what Auto QRA must do for business users, operational teams, auditors, and platform administrators. These requirements translate the product vision into observable system behavior: ingesting customer conversations, preparing them for AI review, applying a consistent rubric, routing uncertain or risky outcomes to humans, reporting results, and maintaining a defensible record of every automated and manual action.

Functional requirements also establish a shared contract among product, engineering, security, operations, and quality stakeholders. Because Auto QRA is used to evaluate human-agent behavior and potentially influence coaching, compliance action, customer remediation, and operational reporting, the requirements must be explicit enough to support testing, model governance, access control design, and change management.

### Description

Auto QRA will automate review of customer interactions against configurable QA scorecards. The system will ingest approved conversation records, mask or tokenize PII before inference, construct prompts from approved templates and rubrics, call a self-hosted vLLM endpoint, parse structured scores and evidence, calculate outcomes, and store results for review, reporting, and downstream action.

The application must support automated review at scale while preserving human override, rationale capture, calibration feedback, threshold administration, model and prompt versioning, audit exports, and operational monitoring.

### Business Justification

Manual conversation QA is expensive, inconsistent, and limited in coverage. Auto QRA expands audit coverage while allowing scarce QA expertise to focus on exception handling, calibration, coaching, and continuous improvement.

The business justification is fourfold: automated audits reduce unit cost and make 60,000 monthly audits achievable; standardized scorecards reduce subjective variance; routing and override preserve human judgment for ambiguous or high-risk cases; and auditability connects quality performance with customer outcomes, compliance obligations, and training programs.

### Technical Details

The functional design assumes modular services. Ingestion receives metadata and transcripts from CRM, telephony, chat, or contact center platforms. Preprocessing normalizes speaker labels, timestamps, language, channel, transcript confidence, and metadata. PII masking applies deterministic and contextual rules before prompts are built. The orchestrator persists job state in PostgreSQL, queues work through Redis, and sends inference requests to vLLM.

The model response must be constrained by schema instructions and validated before scores are accepted. Results must include parameter ratings, evidence snippets, confidence, hallucination indicators, final score, routing decision, version metadata, source references, timestamps, and override fields. Results and artifacts should be stored in PostgreSQL and Azure Blob Storage; reporting datasets should be exposed to Superset through curated views.

### Functional Requirements Table

| ID | Requirement | Priority | MoSCoW | Details and Rationale |
|---|---|---:|---|---|
| FR-001 | The system shall ingest customer conversation transcripts from approved upstream systems. | P0 | Must | Auto QRA must accept conversations from supported sources such as CRM, contact center, telephony, chat, or batch file feeds. Ingestion must validate source identity, payload shape, required metadata, and duplicate conversation IDs. |
| FR-002 | The system shall support batch and near-real-time audit job creation. | P0 | Must | Daily volume requires scheduled batch runs for operational scale, while supervisors may need near-real-time review for escalations, complaints, or regulated interactions. |
| FR-003 | The system shall normalize transcript structure before audit execution. | P0 | Must | Speaker roles, timestamps, utterance sequence, channel, language, and transcript confidence must be normalized to give the model stable context and to support evidence traceability. |
| FR-004 | The system shall mask or tokenize PII before any prompt is sent to the LLM. | P0 | Must | Customer names, account numbers, phone numbers, email addresses, payment details, and other sensitive values must be protected before model inference, even though the LLM is self-hosted. |
| FR-005 | The system shall preserve a secure mapping from masked values to original values only when needed for authorized operational review. | P1 | Should | Some investigators may need re-identification under controlled access, but most users and model prompts should only see masked values. |
| FR-006 | The system shall apply configurable QA scorecards containing up to 30 audit parameters per conversation. | P0 | Must | The business target is 30 QA parameters. Parameters must include definitions, scoring options, evidence expectations, weight, applicability rules, and active status. |
| FR-007 | The system shall version QA scorecards, prompts, and model configurations. | P0 | Must | Audit results must be reproducible and defensible. Every result must identify the scorecard version, prompt version, model version, and inference configuration used. |
| FR-008 | The system shall construct prompts using approved prompt templates and structured conversation context. | P0 | Must | Prompt generation must be deterministic for a given input and version. Templates must include system instructions, scoring rubric, response schema, and hallucination controls. |
| FR-009 | The system shall call the self-hosted vLLM inference endpoint for automated scoring. | P0 | Must | Inference must remain within the enterprise-hosted environment using 3B or 7B quantized models on L40 or A100 GPUs. |
| FR-010 | The system shall parse LLM outputs into a strict structured audit result schema. | P0 | Must | Free-form model text is not sufficient for reporting or routing. The system must validate JSON or equivalent structured output before accepting scores. |
| FR-011 | The system shall reject, retry, or route malformed model responses according to configurable policy. | P0 | Must | Parser failures must not silently create inaccurate results. Retrying may resolve transient formatting issues; persistent failures should move to human review or technical exception queues. |
| FR-012 | The system shall calculate parameter-level and total QA scores. | P0 | Must | Each parameter should produce a rating, evidence, rationale, confidence, and weighted contribution to the final audit score. |
| FR-013 | The system shall support parameter applicability rules. | P1 | Should | Some QA parameters are not relevant to every channel, queue, product, or conversation type. Non-applicable parameters must be excluded from scoring without penalizing agents. |
| FR-014 | The system shall identify evidence spans from the transcript for each scored parameter. | P0 | Must | Human reviewers need traceable evidence to assess agreement, investigate failures, and coach agents. Evidence should refer to utterance IDs or timestamp ranges, not only copied text. |
| FR-015 | The system shall produce an audit confidence signal. | P0 | Must | Confidence is required for routing decisions and quality governance. It may combine model confidence, response consistency, transcript quality, missing context, and parser validation outcomes. |
| FR-016 | The system shall detect and flag potential hallucination or unsupported rationale. | P0 | Must | The target hallucination rate is below 5%. Any score explanation lacking transcript support must be flagged and routed according to policy. |
| FR-017 | The system shall route audit results to auto-pass, auto-fail, or human review queues. | P0 | Must | Routing enables scale while preserving human oversight. The decision must consider score thresholds, confidence, risk tags, regulated topics, hallucination flags, transcript quality, and sampling rules. |
| FR-018 | The system shall support human review of routed audits. | P0 | Must | QA analysts must view the transcript, AI scores, evidence, rationale, routing reason, and prior versions before confirming or overriding the result. |
| FR-019 | The system shall allow authorized users to override AI-generated parameter scores and final outcomes. | P0 | Must | Human override is required for accountable use of AI and for resolving false positives, false negatives, and edge cases. |
| FR-020 | The system shall require override rationale for all human changes. | P0 | Must | Override rationale supports auditability, calibration, model evaluation, coaching, and dispute resolution. |
| FR-021 | The system shall capture reviewer identity, timestamp, changed fields, and before/after values for overrides. | P0 | Must | Complete audit logs are required for governance, regulatory readiness, and internal trust. |
| FR-022 | The system shall support calibration workflows comparing AI results with human reviewer results. | P1 | Should | Calibration is required to maintain greater than 90% human agreement and to detect prompt or model drift. |
| FR-023 | The system shall support configurable sampling of auto-passed and auto-failed audits for quality verification. | P1 | Should | Sampling allows ongoing measurement of agreement, hallucination, and bias without manually reviewing every audit. |
| FR-024 | The system shall provide dashboards for audit volume, scores, routing distribution, agreement, overrides, and SLA performance. | P0 | Must | Leaders and operations teams need visibility into adoption, quality trends, process bottlenecks, and reliability. |
| FR-025 | The system shall provide exportable audit records for authorized users. | P1 | Should | Business users may need CSV, BI extracts, or secure data files for review packs, compliance evidence, and coaching workflows. |
| FR-026 | The system shall enforce role-based access control across audit records, configuration, dashboards, and administration. | P0 | Must | Access must align with job responsibilities and least privilege. Supervisors should not automatically receive platform administration rights. |
| FR-027 | The system shall integrate with enterprise SSO. | P0 | Must | SSO simplifies access management, supports centralized identity governance, and enables deprovisioning through the identity provider. |
| FR-028 | The system shall maintain immutable audit logs for system, model, user, configuration, and data access events. | P0 | Must | Audit logs are mandatory for enterprise governance and investigation of score changes, exports, access, failures, and configuration updates. |
| FR-029 | The system shall expose operational metrics for ingestion, queue depth, inference, parsing, routing, and review workload. | P0 | Must | Prometheus and Grafana require metric emission to monitor throughput, latency, availability, GPU utilization, and exception rates. |
| FR-030 | The system shall allow administrators to configure routing thresholds without code deployment. | P1 | Should | Business teams need to adjust thresholds after calibration cycles, compliance changes, or operational policy updates. |
| FR-031 | The system shall support reprocessing an audit with a selected scorecard, prompt, or model version. | P1 | Should | Reprocessing is needed for backtesting, incident remediation, model comparison, and governance review. |
| FR-032 | The system shall record model input and output artifacts in secure storage according to retention policy. | P0 | Must | Governance teams need evidence for disputed audits, investigations, and model validation. Storage must use encryption and access controls. |
| FR-033 | The system shall support conversation exclusion rules. | P1 | Should | Certain records may be excluded due to consent, retention, legal hold, missing transcript quality, ongoing dispute, or source system restrictions. |
| FR-034 | The system shall tag audits with business dimensions needed for reporting. | P0 | Must | Queue, product, region, language, agent, supervisor, channel, and issue category dimensions are essential for actionability and trend analysis. |
| FR-035 | The system shall provide a reviewer work queue with filters, sorting, assignment, and status tracking. | P0 | Must | Human review must be operationally manageable at volume, with clear ownership and progress visibility. |
| FR-036 | The system shall support administrative disablement of automated inference by queue, scorecard, or model version. | P0 | Must | Kill-switch controls are needed if a model version, prompt, or data feed creates unacceptable risk. |

### Best Practices

Functional delivery should follow a thin-slice pattern: start with one or two high-value queues, a stable scorecard, and the minimum workflow for scoring, human review, and reporting. Each increment should preserve traceability from source conversation to prompt, model output, structured result, routing decision, and reviewer action.

Treat prompt templates and scorecards as versioned production assets. Store, review, test, and release them through controlled change management. Use schema-first output validation, require evidence by utterance or timestamp, and route unsupported rationale to human review.

### Risks

The most material risk is confident but unsupported scoring rationale, which can reduce reviewer trust, harm coaching, or create unfair assessments. Other risks include over-automation, configuration sprawl, poor transcript quality, missing speaker labels, mixed-language conversations, incomplete metadata, upstream schema changes, and delayed source files.

### Recommendations

Implement the scope in three release bands. Release 1 should include ingestion, normalization, PII masking, scorecard execution, structured output, routing, human review, and core dashboards for one pilot queue. Release 2 should add calibration, sampling, export, richer administration, multi-queue support, and reprocessing. Release 3 should add advanced notifications and optimization workflows.

For every production release, publish a model use policy stating which outcomes may be automated, which require human confirmation, and which must be excluded. Maintain a golden test set and require cross-functional approval for changes that materially affect routing, scoring, or reviewer workload.

## 14. Non Functional Requirements

### Purpose

The purpose of the non-functional requirements is to define the quality attributes Auto QRA must satisfy in production. These requirements describe performance, availability, scalability, reliability, security, privacy, observability, maintainability, and governance expectations. For an AI audit platform, non-functional requirements are not secondary; they are central to whether the solution can be trusted, operated, and defended in an enterprise setting.

The system must process high daily volume, respond within the target latency, remain available to users and batch processes, protect sensitive customer data, and provide enough observability for engineering and operations teams to diagnose failures. It must also be maintainable as scorecards, prompts, and models evolve.

### Description

Auto QRA must support 60,000 audits per month with a typical daily operating target of about 2,000 audits. Each audit may include roughly 2,500 input tokens, 700 output tokens, and up to 30 QA parameters. Target latency is under 60 seconds per audit under normal operating conditions. Service availability target is 99.9%. Model quality targets include greater than 90% agreement with human reviewers and less than 5% hallucination or unsupported rationale rate.

The infrastructure baseline is Azure with Docker and Kubernetes for deployment, vLLM for self-hosted inference on L40 or A100 GPUs, PostgreSQL for system of record data, Redis for queueing and cache support, Azure Blob Storage for artifacts, Superset for business reporting, and Prometheus/Grafana for telemetry. Security controls include Microsoft Entra ID SSO, RBAC, encryption, PII masking, audit logs, and human override.

### Business Justification

Non-functional requirements protect the investment in automation. A scoring engine that is accurate but slow cannot support daily operating workflows. A fast system without auditability cannot support compliance review. A system that works only for a pilot queue but cannot scale to monthly volume will fail when adoption expands. Similarly, a platform that lacks observability will be costly to support because operations teams will not know whether failures are caused by source data, queues, GPU capacity, model behavior, or downstream reporting.

These requirements also set realistic expectations. The business can accept some automation uncertainty if it is visible, routed, measured, and improved. It cannot accept hidden error modes, uncontrolled access to customer data, or unexplained score changes.

### Technical Details

Performance sizing should consider token throughput, queue concurrency, GPU memory, model quantization, prompt size, output schema length, and retry rates. A 7B quantized model on A100 GPUs may provide stronger reasoning than a 3B model, while L40 deployments may optimize cost for predictable volume.

Kubernetes should run separate workload classes for APIs, workers, inference gateway, reporting refresh, and background jobs. Redis buffers execution tasks. PostgreSQL stores job, result, configuration, review, and audit log data. Azure Blob Storage stores large artifacts. Prometheus collects application, infrastructure, GPU, and model metrics. Grafana exposes operational dashboards and alerts. Superset exposes governed business metrics.

### Non-Functional Requirements Table

| ID | Requirement | Priority | MoSCoW | Target / Measurement | Details and Rationale |
|---|---|---:|---|---|---|
| NFR-001 | Audit latency shall be less than 60 seconds for standard automated audits. | P0 | Must | P95 under 60 seconds excluding upstream transcript generation delays. | The business workflow depends on timely audit results. Latency includes queue wait, prompt build, inference, parsing, scoring, and persistence. |
| NFR-002 | The platform shall support at least 60,000 completed audits per month. | P0 | Must | Monthly completed audit count from system metrics. | This is the core volume requirement and must include retries and exception routing without falling behind daily work. |
| NFR-003 | The platform shall support at least 2,000 audits per day under normal operations. | P0 | Must | Daily throughput measured by completed audits. | Daily capacity must absorb normal workload and predictable peaks from batch ingestion. |
| NFR-004 | The service shall meet 99.9% availability for user-facing and audit execution functions. | P0 | Must | Monthly uptime using agreed service definitions. | Availability must include APIs, worker orchestration, inference endpoint availability, and review UI access. |
| NFR-005 | The system shall achieve greater than 90% agreement with approved human reviewer baseline. | P0 | Must | Calibration set agreement by parameter and overall outcome. | Human agreement is the principal quality metric for audit trust. It must be monitored by scorecard, queue, language, and model version. |
| NFR-006 | The system shall keep hallucination or unsupported rationale rate below 5%. | P0 | Must | Sampled audits with unsupported claims divided by reviewed audits. | Unsupported rationale undermines fairness and defensibility. Evidence validation and human routing are required controls. |
| NFR-007 | PII shall be masked before model inference. | P0 | Must | 100% of model prompts pass PII masking checks for configured entity classes. | Self-hosting reduces exposure but does not remove the need for data minimization. |
| NFR-008 | Data at rest shall be encrypted. | P0 | Must | Encryption enabled for PostgreSQL, Azure Blob Storage, Redis persistence if used, backups, and logs containing sensitive data. | Enterprise security requires encryption across storage layers. |
| NFR-009 | Data in transit shall be encrypted. | P0 | Must | TLS for all external and internal service calls where supported. | Conversations, prompts, model outputs, and user actions must not traverse plaintext links. |
| NFR-010 | Access shall use SSO and role-based authorization. | P0 | Must | 100% interactive users authenticate through enterprise IdP; authorization checked per protected action. | Centralized identity and least privilege are mandatory for governance. |
| NFR-011 | Audit logs shall be retained according to enterprise policy and protected from unauthorized modification. | P0 | Must | Retention policy compliance and immutability controls. | Score changes, exports, overrides, and configuration updates must be traceable. |
| NFR-012 | The platform shall expose operational metrics to Prometheus. | P0 | Must | Metrics available for ingestion, queues, inference, parsing, routing, review, errors, and GPU usage. | Operations teams need metrics to meet SLA and diagnose incidents. |
| NFR-013 | Grafana dashboards shall provide service health and SLA visibility. | P1 | Should | Dashboards for latency, throughput, availability, error rates, GPU utilization, and backlog. | Dashboards reduce time to detect and time to resolve operational problems. |
| NFR-014 | Business reporting shall be available through governed Superset datasets. | P1 | Should | Superset views reflect approved definitions and access rules. | Business users need self-service analytics without direct access to raw sensitive data. |
| NFR-015 | The system shall support horizontal scaling of worker services. | P0 | Must | Worker replicas can increase without code changes or data inconsistency. | Audit workload will vary by day, queue, and campaign. |
| NFR-016 | The inference tier shall support controlled concurrency and backpressure. | P0 | Must | Queue depth, GPU utilization, and request limits are enforced. | Without backpressure, spikes can create timeouts, GPU contention, and cascading failures. |
| NFR-017 | The platform shall tolerate transient failures through retry and dead-letter handling. | P0 | Must | Failed jobs have retry count, reason, state, and final disposition. | External feeds, inference calls, and parsers can fail transiently; failures must be recoverable or visible. |
| NFR-018 | Configuration changes shall be auditable and reversible through versioned records. | P0 | Must | Scorecard, prompt, threshold, and model config versions stored with change history. | Quality governance requires knowing exactly what changed and when. |
| NFR-019 | The system shall support disaster recovery aligned with enterprise RPO and RTO. | P1 | Should | RPO/RTO targets defined during production readiness; backup restore tested. | Audit history and configuration are business-critical records. |
| NFR-020 | The system shall provide secure export controls. | P1 | Should | Exports require authorization, purpose, audit logging, and retention controls. | Audit exports may contain sensitive or performance-related data. |
| NFR-021 | The system shall preserve historical audit reproducibility. | P0 | Must | Historical result includes source references, prompt version, model version, scorecard version, and output artifact reference. | Reproducibility supports investigations, disputes, and model governance. |
| NFR-022 | The system shall separate production, staging, and development environments. | P0 | Must | Environment-specific credentials, data access, and deployment controls. | Prevents accidental production data exposure and unsafe testing. |
| NFR-023 | The system shall minimize raw PII exposure in logs. | P0 | Must | Log scans and code review confirm no raw transcript or unmasked PII in standard logs. | Debugging must not create hidden privacy leaks. |
| NFR-024 | The review UI and APIs shall remain usable under normal human review workload. | P1 | Should | P95 page and API response targets defined by UX and operations. | Human reviewers must be able to clear queues during peak review periods. |
| NFR-025 | The system shall support model and prompt drift monitoring. | P1 | Should | Agreement, override, score distribution, and hallucination trends tracked by version. | Drift can reduce trust even when infrastructure remains healthy. |
| NFR-026 | The system shall provide clear error classifications. | P1 | Should | Errors classified as ingestion, validation, masking, inference, parsing, routing, persistence, or review errors. | Error classification improves triage and stakeholder communication. |
| NFR-027 | The system shall support accessibility expectations for enterprise web applications. | P1 | Should | Review UI follows WCAG-aligned design and keyboard navigation for primary tasks. | QA review work may be repetitive and should be inclusive and efficient. |
| NFR-028 | The platform shall maintain data retention and deletion controls. | P0 | Must | Retention schedules applied to transcripts, prompts, outputs, exports, and logs as agreed. | Conversation data may be subject to contractual, privacy, or regulatory retention limits. |
| NFR-029 | The system shall support secure secrets management. | P0 | Must | Credentials stored in managed secret systems and never committed to source control. | Secrets protect database, storage, inference, and identity integrations. |

### Best Practices

Design around measurable service level indicators. Track latency by stage: validation, normalization, PII masking, prompt construction, queue wait, inference, parsing, persistence, and routing. Each stage should emit metrics and structured errors.

Treat model quality as an operational metric. Human agreement, override rate, hallucination rate, missing evidence rate, score distribution drift, and parameter-level disagreement should be available in dashboards. Capacity planning should include headroom for retries, long transcripts, reprocessing, batch peaks, model fallback, and calibration sampling.

### Risks

The primary risk is underestimating inference capacity. Token throughput varies by model size, quantization, hardware, prompt length, output length, concurrency, and decoding settings. Security risk is also significant because transcripts may contain sensitive personal, financial, medical, or contractual details. Availability risk can arise from tight coupling between ingestion, inference, and reporting.

### Recommendations

Run performance tests using representative token sizes, realistic parameter counts, expected output schemas, and a mix of normal and long conversations. Test both 3B and 7B quantized models on target hardware and define gates for P95 latency, daily throughput, parser success rate, retry rate, GPU utilization, and backlog recovery.

Establish a quality operations cadence covering agreement, hallucination, override reasons, routing distribution, parameter disagreement, and complaint-driven cases. Implement privacy controls early and require security review before expanding to new sources or regulated queues.

## 15. User Personas

### Purpose

The purpose of the personas is to describe the people who will use, operate, govern, and be affected by Auto QRA. Personas help translate requirements into workflow design, permissions, reporting, and success metrics. They also keep the product grounded in the reality that automated audit scores influence coaching, operational improvement, compliance evidence, and trust between frontline teams and management.

### Description

Auto QRA serves multiple user groups. Some users interact with the platform daily to review audits or manage quality workflows. Others consume dashboards, maintain infrastructure, configure scorecards, or govern risk. The personas below cover the minimum expected stakeholder set and include goals, pain points, jobs to be done, access needs, success measures, and design implications.

### Business Justification

Clear personas prevent the platform from optimizing only for one audience. For example, a QA analyst needs efficient evidence review, while a compliance officer needs traceability and defensible records. A customer experience leader needs trend insight, while a platform engineer needs observability and operational controls. If the design does not account for all roles, adoption will stall or governance risk will increase.

Persona-based design also helps define RBAC. Users who need audit trend dashboards do not necessarily need access to raw transcripts. Users who configure scorecards should not necessarily administer infrastructure. Users who can override scores must have clear training, accountability, and audit logging.

### Technical Details

Personas map to application roles, permissions, data scopes, workflow queues, dashboards, and notification policies. The identity provider should supply user identity and group membership through SSO. The application should translate those groups into roles such as QA Analyst, QA Manager, CX Leader, Compliance Reviewer, System Administrator, Model Operations Analyst, and Read-Only Executive Viewer. Where necessary, business-unit scoping should restrict access by queue, region, product, or vendor.

| Persona | Primary Goals | Pain Points | Job To Be Done (JTBD) | Access Needs | Success Measures |
|---|---|---|---|---|---|
| QA Analyst | Review AI-routed audits, confirm or override scores, document rationale, support coaching accuracy. | Manual audits are repetitive; finding evidence is slow; inconsistent score interpretation creates disputes. | When an audit needs human judgment, I need to quickly inspect evidence and decide whether the AI score is fair so that coaching and reporting remain accurate. | Human review queue, transcript with masked PII, AI rationale, evidence spans, override tools, calibration tasks. | Review throughput, override quality, agreement with senior reviewers, queue SLA, low rework rate. |
| QA Manager | Manage QA operations, calibrate scorecards, monitor reviewer workload, approve policy changes. | Limited coverage makes trends unreliable; calibration is time-consuming; manual sampling misses high-risk interactions. | When quality performance changes, I need reliable audit data and exception visibility so that I can target coaching and improve consistency. | Dashboards, queue management, sampling controls, scorecard configuration, reviewer assignments, calibration reports. | Coverage, agreement rate, review backlog, coaching impact, reduction in repeat defects. |
| Customer Experience Operations Leader | Understand quality drivers across queues, regions, products, and channels. | Traditional QA reports lag behind operations; sample sizes are too small; root causes are hard to compare. | When customer experience trends shift, I need timely and consistent audit insights so that I can prioritize operational improvements. | Aggregated dashboards, trend analysis, exportable summaries, drill-down by business dimensions, limited transcript access. | Improved QA scores, reduced escalations, better first-contact resolution, faster issue detection. |
| Compliance Officer | Verify that regulated interactions follow required disclosures, handling rules, and evidence standards. | Compliance review requires defensible records; manual checks are slow; audit trails are often fragmented. | When a regulated conversation is audited, I need traceable evidence and immutable history so that I can support internal and external review. | Compliance-specific dashboards, audit logs, export approvals, selected transcripts, override history, retention reports. | Complete evidence records, low unsupported rationale rate, timely remediation, successful audit sampling. |
| Platform Engineer | Operate the Auto QRA platform, maintain availability, manage deployments, and troubleshoot incidents. | AI workloads are resource-intensive; GPU bottlenecks are opaque; failures can occur across many services. | When audit processing slows or fails, I need stage-level metrics and logs so that I can restore service quickly and prevent backlog. | Grafana, Prometheus, Kubernetes logs, deployment controls, feature flags, inference health, job replay tools. | Availability, latency, backlog recovery, low error rate, controlled deployment success. |
| Model Operations Analyst | Monitor model performance, compare prompt and model versions, and support quality governance. | Model quality can drift; business users may not distinguish model error from transcript or rubric ambiguity. | When agreement or hallucination changes, I need versioned performance data so that I can isolate root cause and recommend action. | Calibration datasets, model/version dashboards, sampled audit comparisons, prompt metadata, reprocessing controls. | Agreement improvement, hallucination reduction, stable score distributions, successful release gates. |

### Best Practices

Design for the highest-frequency tasks first. QA analysts need fast review and clear evidence presentation because small usability issues multiply across thousands of audits. The review screen should prioritize routing reason, AI score, evidence spans, transcript navigation, override rationale, and save actions. It should avoid forcing analysts to search long transcripts manually.

Design dashboards around decisions, not just metrics. QA managers need to know which queues are deteriorating, which parameters have high disagreement, which reviewers are overloaded, and where routing thresholds may need adjustment. CX leaders need trend context and business dimensions. Compliance officers need evidence completeness and audit history.

Platform and model operations users need instrumentation that reflects the real audit lifecycle. Metrics should show whether an issue is caused by ingestion, masking, prompt construction, inference, parsing, routing, database writes, or review backlog. Model operations users should have access to quality measures without unnecessary exposure to raw PII.

### Risks

Persona misalignment can create adoption risk. If QA analysts feel the system adds work rather than reducing low-value manual review, they may resist using it or override inconsistently. If agents and supervisors do not trust the evidence, they may dispute scores and weaken the value of automation. If compliance officers cannot retrieve defensible records, the system may be treated as an informal tool rather than a trusted control.

There is also a risk of excessive privilege. Leaders may request broad drill-down access even when aggregated reporting would satisfy their business need. Engineers may need logs but not customer identifiers. Reviewers may need masked transcripts but not configuration administration. Overly broad roles increase privacy exposure and complicate audit review.

### Recommendations

Validate personas during discovery and pilot. Observe real QA review sessions, calibration meetings, compliance evidence requests, and operational incident triage. Use those observations to refine screens, dashboards, and permissions. Treat personas as living design assets, not static documentation.

Create role-specific onboarding. QA analysts should be trained on evidence review, override policy, and hallucination recognition. Managers should be trained on calibration and threshold governance. Compliance users should be trained on audit trail retrieval and export controls. Platform engineers should be trained on inference operations, GPU metrics, and job recovery.

## 16. User Stories

### Purpose

The purpose of the user stories is to describe desired capabilities from the perspective of the people who will use or operate Auto QRA. Stories connect functional requirements to user value and provide a basis for backlog planning, acceptance criteria, and release sequencing. They also reveal where the workflow needs human accountability, transparency, and governance.

### Description

The stories below use both "As a / I want / so that" and Given/When/Then formats. Each story is linked to one or more personas and can be traced to acceptance criteria in Section 17. The story set covers ingestion, automated scoring, review, override, dashboards, administration, security, operations, model governance, and reporting. The stories are written at a product delivery level rather than as engineering tasks; implementation teams can decompose them into epics, features, and technical stories.

### Business Justification

Stories help stakeholders agree on the difference between a model demo and an enterprise product. A demo can score a transcript. A product must route work, protect data, support review, show evidence, handle failures, expose metrics, and preserve audit history. By describing value through user stories, the delivery team can prioritize features that create operational adoption and governance confidence.

### Technical Details

Stories should be managed in the delivery backlog with links to requirements, design artifacts, test cases, and release gates. Each story should identify impacted services, data entities, permissions, telemetry, and audit log events. For AI-specific stories, acceptance should include model output schema validation, evidence traceability, routing logic, and calibration measurement where applicable.

### User Story Catalog

| Story ID | Persona | User Story |
|---|---|---|
| US-001 | QA Manager | As a QA Manager, I want the system to ingest approved conversation transcripts automatically so that audit coverage is not limited by manual file handling. |
| US-002 | Platform Engineer | Given a transcript arrives from an upstream source, when required metadata is missing or invalid, then the system should reject the record with a clear error classification and not create an incomplete audit. |
| US-003 | QA Analyst | As a QA Analyst, I want transcripts to show normalized speakers and timestamps so that I can quickly verify the evidence used for each score. |
| US-004 | Compliance Officer | Given a transcript contains customer PII, when the audit prompt is built, then PII must be masked before the model receives the conversation. |
| US-005 | QA Manager | As a QA Manager, I want configurable scorecards with parameter definitions and weights so that the automation reflects current QA policy. |
| US-006 | Model Operations Analyst | As a Model Operations Analyst, I want each audit to record model, prompt, and scorecard versions so that I can compare performance across releases. |
| US-007 | QA Analyst | Given the AI completes an audit, when I open the review screen, then I should see the final score, parameter scores, confidence, evidence, rationale, and routing reason. |
| US-008 | QA Analyst | As a QA Analyst, I want to override a parameter score with a required rationale so that I can correct AI decisions that do not match the transcript. |
| US-009 | Compliance Officer | Given a human override occurs, when the audit record is viewed later, then the system should show who changed the result, what changed, when it changed, and why. |
| US-010 | QA Manager | As a QA Manager, I want routing thresholds for auto-pass, auto-fail, and human review so that human effort is focused on the most important audits. |
| US-011 | CX Operations Leader | As a CX Operations Leader, I want dashboards for QA trends by queue, product, channel, and region so that I can identify systemic customer experience issues. |
| US-012 | Platform Engineer | Given inference latency increases, when GPU utilization or queue depth crosses thresholds, then Grafana should alert operations before the audit backlog breaches SLA. |
| US-013 | Model Operations Analyst | As a Model Operations Analyst, I want to monitor human agreement and hallucination rates by model and prompt version so that I can detect quality drift. |
| US-014 | QA Manager | Given a new prompt version is proposed, when it is tested against the golden dataset, then the release should show agreement, hallucination, and score distribution changes before activation. |
| US-015 | Compliance Officer | As a Compliance Officer, I want secure export of selected audit records with approval and logging so that I can support internal or external review without uncontrolled data sharing. |
| US-016 | Platform Engineer | Given an audit job fails due to a transient inference error, when retry policy allows retries, then the job should be retried with the same versioned inputs and an updated attempt count. |
| US-017 | QA Analyst | As a QA Analyst, I want my human review queue to support filters and assignment so that I can prioritize high-risk or SLA-sensitive audits. |
| US-018 | QA Manager | Given auto-passed audits are sampled for verification, when a sampled audit disagrees with human review, then the result should contribute to calibration metrics. |
| US-019 | System Administrator | As a System Administrator, I want user access to be governed by SSO groups and RBAC roles so that permissions are centrally managed and least privilege is enforced. |
| US-020 | Compliance Officer | Given a user views, exports, or modifies an audit, when the action completes, then the system should create an immutable audit log entry. |
| US-021 | QA Manager | As a QA Manager, I want to exclude certain conversations from automated audit based on configured rules so that legally restricted or low-quality records are not processed. |
| US-022 | Platform Engineer | Given a model version is producing unacceptable errors, when an administrator disables that model profile, then new jobs should stop using it while existing records remain traceable. |
| US-023 | CX Operations Leader | As a CX Operations Leader, I want executive summaries of quality performance so that I can communicate trends without exposing unnecessary customer details. |
| US-024 | QA Analyst | Given a model rationale cites evidence, when I click the evidence reference, then the transcript should navigate to the associated utterance or timestamp. |
| US-025 | Model Operations Analyst | As a Model Operations Analyst, I want to reprocess selected historical audits with a candidate prompt or model version so that I can compare outcomes before release. |
| US-026 | QA Manager | Given human review workload exceeds a threshold, when the queue remains above SLA risk for a configured period, then supervisors should receive a workload alert. |
| US-027 | Compliance Officer | As a Compliance Officer, I want retention status for audit artifacts so that I can confirm records are kept or deleted according to policy. |
| US-028 | Platform Engineer | Given the reporting refresh fails, when Superset datasets are stale, then operations should see a stale-data indicator and an actionable error reason. |
| US-029 | QA Manager | As a QA Manager, I want to compare override rates by parameter so that I can identify ambiguous rubric language or model weakness. |
| US-030 | QA Analyst | Given the AI confidence is low or evidence is unsupported, when the audit is routed to me, then the review screen should clearly identify why human judgment is required. |

### Best Practices

Stories should be written with testable outcomes and observable evidence. For example, "the system should be transparent" is not sufficient; "the reviewer can see routing reason, evidence spans, model confidence, and prompt version" is testable. Stories involving AI output should include what happens when the model response is malformed, unsupported by evidence, or below confidence threshold.

Use story slicing that delivers production-like workflow early. A valuable early slice is: ingest one source, mask PII, run one scorecard, store structured results, route exceptions, allow human override, and show a basic dashboard. This is more useful than a broad set of disconnected features because it validates the full audit lifecycle.

### Risks

The story backlog may become too UI-heavy if it does not include operations, governance, and data quality stories. Conversely, it may become too platform-heavy if it does not capture the daily experience of QA analysts and managers. Another risk is accepting model outputs without building stories for rejected outputs, low-confidence results, malformed responses, or unsupported evidence.

### Recommendations

Prioritize stories that prove the end-to-end workflow and risk controls. The first release should include stories US-001 through US-010, US-012, US-017, US-019, US-020, US-024, and US-030. These establish ingestion, scoring, privacy, review, routing, identity, and auditability. Add dashboard expansion, reprocessing, calibration automation, export controls, and retention features as the pilot matures.

## 17. Acceptance Criteria

### Purpose

The purpose of the acceptance criteria is to define how stakeholders will determine whether Auto QRA capabilities are complete and acceptable. Acceptance criteria convert requirements and user stories into verifiable outcomes. They also support test planning, release readiness, governance approval, and operational handover.

### Description

The acceptance criteria are organized into matrices covering ingestion and preparation, AI audit execution, routing and human review, reporting and governance, security and privacy, and operations. Each criterion references one or more user stories and identifies the expected outcome, evidence, and validation approach. The criteria should be refined into detailed test cases during delivery, but the matrix establishes the minimum acceptance baseline for the product design.

### Business Justification

Acceptance criteria reduce ambiguity and prevent premature acceptance of an AI prototype as a production product. In an enterprise QA context, it is not enough for the model to produce a plausible score. The system must prove that it used approved inputs, protected PII, applied the correct versioned scorecard, generated structured and evidence-backed results, routed decisions correctly, allowed human override, and retained audit history.

Acceptance criteria also help align business and technical stakeholders. QA leaders can validate workflow and scorecard behavior, compliance officers can validate evidence and logs, platform engineers can validate reliability and observability, and model operations analysts can validate agreement and hallucination controls.

### Technical Details

Acceptance testing should combine automated tests, integration tests, calibration evaluation, security testing, load testing, and user acceptance testing. Automated tests should cover schema validation, routing decisions, access rules, audit logging, and configuration versioning. Integration tests should run representative transcripts through the full pipeline. Calibration tests should compare AI results to human-labeled benchmarks. Load tests should validate latency and throughput at target token counts. UAT should include QA analysts and managers reviewing real or production-like conversations with masked PII.

### Acceptance Criteria Matrix: Ingestion and Preparation

| AC ID | Linked Stories | Acceptance Criteria | Validation Method | Evidence Required |
|---|---|---|---|---|
| AC-001 | US-001, US-002 | Valid source transcripts with required metadata create audit jobs in pending state. | Integration test with approved source payloads. | Job records in PostgreSQL with source ID, conversation ID, metadata, and creation timestamp. |
| AC-002 | US-002 | Invalid payloads are rejected with clear error classification and do not create active audit jobs. | Negative integration tests. | Error record showing validation failure reason and no corresponding active audit. |
| AC-003 | US-003 | Normalized transcript includes ordered utterances, speaker roles, timestamps where available, channel, language, and transcript confidence. | Data validation test and reviewer inspection. | Normalized transcript artifact in Azure Blob Storage and database metadata. |
| AC-004 | US-004 | Configured PII classes are masked before prompt construction completes. | PII test corpus and prompt inspection. | Masked prompt artifact with no raw configured PII values. |
| AC-005 | US-021 | Exclusion rules prevent prohibited conversations from entering inference and record the exclusion reason. | Rule-based test cases. | Exclusion record with rule ID, reason, timestamp, and source conversation reference. |
| AC-006 | US-001, US-006 | Duplicate prevention blocks duplicate active audit jobs for the same source conversation and scorecard version unless reprocessing is explicitly requested. | Integration test with repeated payload. | Duplicate handling log and single active audit record. |

### Acceptance Criteria Matrix: AI Audit Execution

| AC ID | Linked Stories | Acceptance Criteria | Validation Method | Evidence Required |
|---|---|---|---|---|
| AC-007 | US-005, US-006 | Audit execution uses the active approved scorecard, prompt template, model version, and inference profile. | Pipeline integration test. | Audit result contains scorecard version, prompt version, model version, and inference settings. |
| AC-008 | US-007 | The model response is parsed into parameter scores, rationale, evidence references, confidence, and final score. | Parser unit and integration tests. | Structured audit result matching the approved schema. |
| AC-009 | US-007, US-024 | Evidence references resolve to transcript utterances or timestamps. | Evidence resolution test. | Reviewer can navigate from result evidence to source utterance. |
| AC-010 | US-004, US-007 | Model prompts and stored outputs do not expose unmasked configured PII classes to unauthorized users. | Security and privacy test. | Masking scan results and RBAC-protected artifact access. |
| AC-011 | US-013, US-014 | Calibration tests show greater than 90% agreement on approved benchmark set before production activation. | Calibration evaluation. | Agreement report by parameter, scorecard, model, and prompt version. |
| AC-012 | US-013, US-014 | Hallucination or unsupported rationale rate is below 5% on benchmark and sampled production review. | Human review and evidence validation. | Unsupported rationale report with sample methodology. |
| AC-013 | US-016 | Transient inference failures are retried according to policy and persistent failures move to exception state. | Fault injection test. | Attempt count, error reason, final state, and retry timestamps. |
| AC-014 | US-022 | Disabled model profiles are not selected for new audit jobs. | Administrative configuration test. | New job metadata shows alternate active model profile or blocked state. |

### Acceptance Criteria Matrix: Routing and Human Review

| AC ID | Linked Stories | Acceptance Criteria | Validation Method | Evidence Required |
|---|---|---|---|---|
| AC-015 | US-010, US-030 | Routing decision follows configured thresholds for auto-pass, auto-fail, and human review. | Routing unit tests and integration tests. | Routing decision record with rule inputs and selected outcome. |
| AC-016 | US-030 | Low-confidence, hallucination-flagged, regulated, or poor-transcript audits route to human review unless explicitly configured otherwise. | Decision table tests. | Human review queue record with routing reason. |
| AC-017 | US-017 | Review queues support filtering, sorting, assignment, status tracking, and SLA visibility. | UAT with QA analysts. | Screen evidence and database records for assignment and status changes. |
| AC-018 | US-007, US-024 | Reviewer screen displays AI result, evidence, transcript, rationale, confidence, routing reason, and version metadata. | UAT and UI verification. | Reviewer acceptance sign-off and screen capture. |
| AC-019 | US-008 | Authorized reviewers can override parameter scores and final outcome only with required rationale. | RBAC and workflow tests. | Override record with changed fields, rationale, and reviewer identity. |
| AC-020 | US-009, US-020 | Override audit history shows before and after values, user identity, timestamp, and reason. | Audit log inspection. | Immutable audit log entry and visible history in record. |
| AC-021 | US-018 | Sampled auto-pass and auto-fail reviews update calibration metrics when human review disagrees. | Sampling workflow test. | Calibration report includes sampled review outcomes and disagreement tags. |
| AC-022 | US-026 | Workload alerts trigger when review queue SLA thresholds are breached. | Alert test with simulated backlog. | Alert record, notification evidence, and Grafana panel. |

### Acceptance Criteria Matrix: Reporting, Governance, and Administration

| AC ID | Linked Stories | Acceptance Criteria | Validation Method | Evidence Required |
|---|---|---|---|---|
| AC-023 | US-011, US-023 | Superset dashboards show audit volume, scores, trends, routing distribution, overrides, and key business dimensions. | Dashboard UAT. | Published dashboard screenshots and data validation extract. |
| AC-024 | US-015 | Authorized exports require permission, include selected fields only, and create audit log entries. | Export workflow and RBAC tests. | Export file, export request metadata, and audit log event. |
| AC-025 | US-025 | Reprocessing creates a new versioned result without overwriting historical audit records. | Reprocessing integration test. | Original and reprocessed result records with separate version metadata. |
| AC-026 | US-029 | Override dashboards show parameter-level override rates and trends. | Reporting validation. | Superset chart and source query comparison. |
| AC-027 | US-014, US-025 | Candidate prompt or model releases cannot be activated until required benchmark metrics are captured. | Release workflow test. | Release approval record with agreement and hallucination metrics. |
| AC-028 | US-027 | Retention status is visible for artifacts and retention jobs process eligible records according to policy. | Retention job test. | Retention report, deletion marker, and audit log entry. |

### Acceptance Criteria Matrix: Security, Privacy, and Operations

| AC ID | Linked Stories | Acceptance Criteria | Validation Method | Evidence Required |
|---|---|---|---|---|
| AC-029 | US-019 | SSO-authenticated users receive application permissions based on mapped RBAC roles. | Identity integration test. | User session role claims and authorization test results. |
| AC-030 | US-019 | Users cannot access audit records outside assigned business scope. | Negative RBAC tests. | Access denied records and audit log events. |
| AC-031 | US-020 | View, export, override, configuration, and administrative actions create audit log events. | Audit event tests. | Audit log entries with action, actor, object, timestamp, and outcome. |
| AC-032 | US-012, US-028 | Prometheus metrics and Grafana dashboards expose latency, throughput, errors, queue depth, GPU utilization, and stale reporting indicators. | Observability validation. | Metrics scrape output and dashboard panels. |
| AC-033 | US-012 | Alerting triggers before backlog or latency breaches agreed SLA thresholds. | Alert simulation. | Alert notification, alert rule, and metric history. |
| AC-034 | US-016 | Dead-lettered jobs are visible with failure reason and can be safely replayed by authorized operators. | Operations workflow test. | Dead-letter queue record and replay audit trail. |
| AC-035 | US-028 | Reporting stale-data indicators appear when dataset refresh fails or exceeds freshness threshold. | Reporting fault test. | Stale indicator in Superset or companion status panel. |

### Best Practices

Acceptance criteria should be written before implementation begins and reviewed during backlog refinement. For AI-related criteria, include both deterministic technical checks and human evaluation checks. A parser test can prove that JSON is valid, but it cannot prove that the rationale is fair or supported. A human-labeled benchmark is needed to validate agreement and hallucination controls.

Acceptance should use production-like data with masking. Synthetic data is useful for edge cases, but it often misses the ambiguity, noise, and operational variation of real conversations. The test set should include short and long transcripts, multiple channels, speaker label issues, regulated topics, low-quality transcripts, escalations, complaints, and routine successful interactions.

### Risks

Acceptance may fail if criteria are too abstract or if no one owns the evidence. For example, "dashboard works" is insufficient because it does not define freshness, metrics, access scope, or source reconciliation. Another risk is validating only happy paths. AI audit systems need strong acceptance coverage for malformed model output, low confidence, unsupported evidence, duplicate ingestion, excluded conversations, disabled model profiles, and unauthorized access.

There is also risk in overfitting acceptance to a narrow benchmark set. If the benchmark does not represent production queues, human agreement may appear strong during testing and deteriorate after rollout. Acceptance criteria should therefore include both pre-release benchmarks and sampled production monitoring.

### Recommendations

Create a release acceptance checklist that maps every P0 functional and non-functional requirement to test evidence. No production release should proceed without evidence for PII masking, structured output validation, routing correctness, human override, audit logging, RBAC, latency, throughput, and baseline agreement. For pilot rollout, require daily review of exceptions and weekly review of quality metrics.

Maintain acceptance evidence in a controlled repository or quality management system. Include test run IDs, dataset versions, scorecard versions, model versions, prompt versions, dashboard screenshots, load test results, and approval records. This evidence will support internal audit, stakeholder sign-off, and future model governance.

## 18. Process Flow

### Purpose

The purpose of the process flow section is to describe how work moves through Auto QRA from source conversation to completed audit, reporting, and continuous improvement. The process flow clarifies responsibilities across systems and users, identifies control points, and shows where automation ends and human judgment begins.

### Description

The Auto QRA process begins when an eligible customer conversation becomes available from an approved upstream source. The system validates and normalizes the record, masks sensitive data, constructs a versioned prompt, executes inference through the self-hosted LLM, validates the output, calculates scores, and routes the audit. Straightforward high-confidence results may be auto-passed or auto-failed according to policy. Low-confidence, high-risk, malformed, hallucination-flagged, sampled, or regulated cases move to human review. Final results feed dashboards, exports, coaching, compliance review, and model governance.

The process is intentionally designed with checkpoints. Validation protects data quality. PII masking protects privacy. Schema validation protects downstream reporting. Evidence verification reduces hallucination risk. Routing protects human accountability. Override logging protects auditability. Calibration sampling protects long-term quality.

### Business Justification

The process flow ensures that scale does not come at the expense of control. Without a clear process, the organization may receive a large number of AI-generated scores but lack confidence in their meaning. With a well-defined process, stakeholders can understand how records enter the system, how scores are produced, why some audits are routed to humans, and how final outcomes are used.

The flow also supports operational accountability. If daily audit volume drops, leaders can identify whether the issue is upstream ingestion, validation failure, queue backlog, inference capacity, parsing error, or review workload. If score quality declines, model operations can trace the issue to scorecard changes, prompt changes, source data quality, or model behavior.

### Technical Details

The process uses event-driven orchestration backed by durable state. PostgreSQL stores job state transitions and authoritative results. Redis queues decouple ingestion from processing and support retry and backpressure. Azure Blob Storage stores large artifacts. The vLLM inference endpoint receives masked prompts only. The parser validates structured model output and evidence references before routing. Metrics are emitted at every major step.

#### BPMN-Style Process Flow

```mermaid
flowchart TD
    A([Conversation completed]) --> B[Upstream source publishes transcript and metadata]
    B --> C{Source approved?}
    C -- No --> C1[Reject record and log source error]
    C -- Yes --> D[Validate required metadata and payload schema]
    D --> E{Valid payload?}
    E -- No --> E1[Reject record and classify validation error]
    E -- Yes --> F[Normalize transcript: speakers, timestamps, language, channel]
    F --> G{Exclusion rule applies?}
    G -- Yes --> G1[Mark excluded with reason and retain policy record]
    G -- No --> H[Mask PII and create protected prompt context]
    H --> I{PII masking passed?}
    I -- No --> I1[Block inference and route to privacy exception]
    I -- Yes --> J[Build versioned prompt using active scorecard]
    J --> K[Queue audit job in Redis]
    K --> L[Worker sends request to self-hosted vLLM]
    L --> M{Inference success?}
    M -- No, retryable --> M1[Retry with attempt count and backoff]
    M1 --> L
    M -- No, terminal --> M2[Move to technical exception queue]
    M -- Yes --> N[Parse structured model output]
    N --> O{Schema valid and evidence resolvable?}
    O -- No --> O1[Retry or route to human review by policy]
    O -- Yes --> P[Calculate scores, confidence, hallucination flags]
    P --> Q{Routing decision}
    Q -- Auto-pass --> R[Finalize automated pass]
    Q -- Auto-fail --> S[Finalize automated fail or queue if policy requires confirmation]
    Q -- Human review --> T[Create human review task]
    T --> U[Reviewer confirms or overrides with rationale]
    U --> V[Finalize reviewed audit]
    R --> W[Publish reporting dataset]
    S --> W
    V --> W
    W --> X[Dashboards, exports, coaching, compliance, calibration]
    X --> Y([Continuous improvement feedback loop])```

#### Audit Lifecycle Sequence

```mermaid
sequenceDiagram
    participant Source as Upstream Source
    participant API as Ingestion API
    participant Prep as Preprocessing Service
    participant Mask as PII Masking Service
    participant Orch as Audit Orchestrator
    participant Redis as Redis Queue
    participant Worker as Audit Worker
    participant VLLM as vLLM Endpoint
    participant DB as PostgreSQL
    participant Azure Blob Storage as Azure Blob Storage Artifacts
    participant Review as Human Review UI
    participant BI as Superset

    Source->>API: Submit transcript and metadata
    API->>DB: Create ingestion record
    API->>Prep: Validate and normalize
    Prep->>Mask: Request PII masking
    Mask->>Azure Blob Storage: Store masked transcript artifact
    Prep->>Orch: Create audit job with version context
    Orch->>DB: Persist pending audit job
    Orch->>Redis: Enqueue audit execution
    Worker->>Redis: Dequeue audit job
    Worker->>Azure Blob Storage: Load masked transcript artifact
    Worker->>VLLM: Submit prompt to self-hosted LLM
    VLLM-->>Worker: Return structured candidate response
    Worker->>Worker: Parse, validate, score, and route
    Worker->>DB: Persist audit result and routing decision
    Worker->>Azure Blob Storage: Store prompt and output artifacts
    alt Human review required
        Review->>DB: Load queued audit
        Review->>DB: Save confirmation or override with rationale
    end
    DB->>BI: Expose governed reporting view```

### Decision Table: Audit Routing

| Condition | Auto-Pass | Auto-Fail | Human Review | Rationale |
|---|---:|---:|---:|---|
| Final score above pass threshold, confidence high, no hallucination flag, transcript quality acceptable, no regulated topic, not sampled | Yes | No | No | Low-risk, high-confidence result can be finalized automatically. |
| Final score below fail threshold, confidence high, no hallucination flag, policy permits auto-fail | No | Yes | No | Clear failure can be finalized if business policy allows automated fail outcomes. |
| Final score below fail threshold but policy requires human confirmation for fail outcomes | No | No | Yes | Some organizations may require human review before negative agent impact. |
| Score is within gray zone between pass and fail thresholds | No | No | Yes | Borderline cases need human judgment and calibration signal. |
| Any critical compliance parameter fails | No | Conditional | Yes | Regulated or high-impact failures should receive human confirmation unless policy explicitly permits auto-fail. |
| Confidence below configured threshold | No | No | Yes | Low confidence reduces trust in automation. |
| Evidence reference missing or not resolvable | No | No | Yes | Unsupported scoring rationale may indicate hallucination or parser issue. |
| Hallucination flag present | No | No | Yes | Hallucination control requires human review. |
| Transcript quality below threshold | No | No | Yes | Poor source quality can make automated scoring unreliable. |
| Conversation is selected by random or stratified sampling | No | No | Yes | Sampling supports ongoing calibration even for otherwise auto-routable audits. |
| Model response malformed after allowed retries | No | No | Yes or Technical Exception | Business-readable review may be possible if partial output exists; otherwise technical exception. |
| Source or privacy exception present | No | No | No | The record should not proceed to audit until the exception is resolved. |

### Best Practices

Keep process states explicit and durable. Each audit should have a clear state such as pending, preprocessing, masked, queued, inferencing, parsing, routed, in human review, finalized, failed, excluded, or archived. Hidden implicit states make incident response and reporting reconciliation difficult.

Design routing as policy-driven logic rather than hard-coded logic. Business thresholds will change after calibration, compliance review, and operational learning. Routing should be transparent to QA managers and auditors, and each routing decision should include the rule inputs that led to the outcome.

Use dead-letter queues and replay tools for technical exceptions. Failed jobs should not disappear into logs. Operators should be able to inspect failure reason, source payload, version context, retry history, and replay eligibility. Replay must create audit trail events and must not overwrite historical finalized results.

### Risks

The largest process risk is loss of traceability across handoffs. A conversation may pass through source systems, preprocessing, masking, inference, review, and reporting. If identifiers are inconsistent or artifacts are not linked, it becomes difficult to explain a final score or troubleshoot a missing audit.

Another risk is review queue overload. If routing thresholds are too conservative, too many audits require human review and the system fails to deliver the expected efficiency. If thresholds are too aggressive, questionable audits may be finalized automatically. The right balance should be established through pilot data and revisited regularly.

### Recommendations

Implement process observability from the first production pilot. Dashboards should show count and latency by state, failure reason, routing outcome, review backlog, and stale reporting status. Include drill-down from aggregate metrics to representative job records for operations users.

Start with a conservative routing policy. During pilot, route borderline, low-confidence, regulated, hallucination-flagged, and sampled records to humans. Once agreement and hallucination metrics stabilize, consider expanding auto-pass and conditional auto-fail rules for low-risk queues.

## 19. Product Workflow

### Purpose

The purpose of the product workflow section is to define how users experience Auto QRA through application states, screens, decisions, and collaboration points. While the process flow describes operational movement across services, the product workflow describes how people configure, review, override, monitor, and act on audit outcomes.

### Description

The product workflow has five primary product areas: configuration, audit execution visibility, human review, analytics, and governance. Configuration includes scorecards, prompts, model profiles, routing thresholds, exclusion rules, and RBAC mappings. Execution visibility includes job states, error queues, latency, and workload metrics. Human review includes task assignment, transcript review, evidence navigation, override, and finalization. Analytics includes Superset dashboards for QA performance, routing, agreement, and trends. Governance includes audit logs, calibration reports, model release evidence, export control, and retention.

The user experience should make AI decisions explainable without overwhelming reviewers. Every audit should answer five user questions: What did the AI decide? Why did it decide that? What evidence supports it? How confident is the system? What can a human do next?

### Business Justification

Product workflow design determines whether Auto QRA becomes a trusted operating system for quality or remains a technical experiment. QA analysts need a workflow that reduces effort. Managers need controls and reporting that improve decision-making. Compliance officers need evidence and auditability. Engineers need operational clarity. The workflow must support both daily production use and exceptional governance events.

Good workflow design also reduces change resistance. Human override, evidence visibility, calibration sampling, and transparent routing show that the system augments judgment rather than replacing it blindly. This is especially important because QA results may affect coaching, performance discussions, and compliance action.

### Technical Details

The product workflow should be implemented through role-aware UI modules backed by API services. The review UI should retrieve audit result data, transcript artifacts, evidence references, routing reason, and version metadata through controlled APIs. Configuration screens should write versioned records and require appropriate permissions. Dashboards should use governed reporting tables rather than direct raw operational tables where possible. Audit log events should be emitted from both UI and API layers for protected actions.

#### Product Workflow State Machine

```mermaid
stateDiagram-v2
    [*] --> DraftConfiguration
    DraftConfiguration --> ApprovedConfiguration: QA and governance approval
    ApprovedConfiguration --> ActiveConfiguration: scheduled or manual activation
    ActiveConfiguration --> AuditPending: eligible conversation received
    AuditPending --> Preprocessing: validation started
    Preprocessing --> Excluded: exclusion rule matched
    Preprocessing --> PrivacyException: PII masking failed
    Preprocessing --> QueuedForInference: masking and prompt build passed
    QueuedForInference --> Inferencing: worker starts audit
    Inferencing --> TechnicalException: terminal inference failure
    Inferencing --> ParsingAndScoring: model output received
    ParsingAndScoring --> TechnicalException: malformed output after retry
    ParsingAndScoring --> RoutedAutoPass: high score and high confidence
    ParsingAndScoring --> RoutedAutoFail: low score and policy allows auto-fail
    ParsingAndScoring --> RoutedHumanReview: gray zone, risk, sample, low confidence, or unsupported evidence
    RoutedAutoPass --> Finalized: automated finalization
    RoutedAutoFail --> Finalized: automated finalization
    RoutedHumanReview --> InReview: analyst opens task
    InReview --> ReviewConfirmed: analyst confirms AI result
    InReview --> ReviewOverridden: analyst changes result with rationale
    ReviewConfirmed --> Finalized
    ReviewOverridden --> Finalized
    Finalized --> Reported: available in dashboards and exports
    Reported --> CalibrationSampled: selected for quality monitoring
    CalibrationSampled --> ImprovementBacklog: disagreement, drift, or hallucination finding
    ImprovementBacklog --> DraftConfiguration: scorecard, prompt, or model change proposed
    Finalized --> Archived: retention lifecycle complete```

#### Swimlane: Human Override Workflow

```mermaid
flowchart LR
    subgraph Analyst["QA Analyst"]
        A1[Open assigned review task]
        A2[Inspect transcript, AI score, evidence, confidence]
        A3{Agree with AI?}
        A4[Confirm AI result]
        A5[Edit parameter or outcome]
        A6[Enter required override rationale]
        A7[Submit review]
    end

    subgraph System["Auto QRA Application"]
        S1[Load masked transcript and audit result]
        S2[Validate reviewer permission]
        S3[Validate changed fields and rationale]
        S4[Save final result]
        S5[Create immutable audit log entry]
        S6[Update calibration and reporting datasets]
    end

    subgraph Manager["QA Manager"]
        M1[Monitor queue and override trends]
        M2[Review high-impact overrides]
        M3[Update coaching or calibration actions]
    end

    A1 --> S1
    S1 --> S2
    S2 --> A2
    A2 --> A3
    A3 -- Yes --> A4
    A4 --> A7
    A3 -- No --> A5
    A5 --> A6
    A6 --> A7
    A7 --> S3
    S3 --> S4
    S4 --> S5
    S5 --> S6
    S6 --> M1
    M1 --> M2
    M2 --> M3```

### Decision Table: Product Routing and User Actions

| Audit State | Visible To | Primary User Action | Allowed System Action | Required Audit Log |
|---|---|---|---|---|
| Excluded | QA Manager, Platform Engineer, Compliance Officer where scoped | Review exclusion reason if needed. | Retain exclusion record; do not infer. | Exclusion rule applied. |
| Privacy Exception | Platform Engineer, Security, Privacy-approved users | Investigate masking failure or source data issue. | Block inference; create exception. | Privacy exception created and resolved. |
| Technical Exception | Platform Engineer, QA Manager summary view | Replay, cancel, or escalate after diagnosis. | Retry, dead-letter, or replay under policy. | Failure, replay, and final disposition. |
| Routed Auto-Pass | QA Manager, CX Leader, sampled QA Analyst | Monitor result or review if sampled. | Finalize and publish to reporting. | Automated finalization and sample selection if applicable. |
| Routed Auto-Fail | QA Manager, QA Analyst if confirmation required | Confirm, override, or monitor by policy. | Finalize or create human review task. | Automated or human finalization. |
| Routed Human Review | QA Analyst, QA Manager | Review, confirm, or override. | Assign, prioritize, and track SLA. | Task assignment and status changes. |
| Finalized | Scoped business users | View, report, export if authorized. | Publish to dashboards and retention workflow. | View, export, and retention events. |
| Calibration Finding | QA Manager, Model Operations Analyst | Decide whether to update rubric, prompt, or training. | Add to improvement backlog. | Finding creation and resolution. |

### Decision Table: Configuration Governance

| Change Type | Initiator | Required Review | Activation Rule | Rollback / Disablement |
|---|---|---|---|---|
| Scorecard parameter definition | QA Manager | QA leadership and compliance if regulated. | New scorecard version; applies to future audits after approval. | Revert active version for future jobs; historical results remain unchanged. |
| Parameter weight or threshold | QA Manager | QA leadership and model operations. | New version or threshold record with effective date. | Restore prior threshold version. |
| Prompt template | Model Operations Analyst | QA Manager, compliance for regulated language, platform review for output schema impact. | Benchmark agreement and hallucination report required before activation. | Disable prompt version and route to prior approved version. |
| Model profile | Platform Engineer / Model Operations Analyst | Platform, security, QA governance. | Load, latency, agreement, hallucination, and cost evidence required. | Disable model profile and drain or reroute new jobs. |
| Routing policy | QA Manager | QA leadership, compliance for high-impact outcomes. | Effective-dated policy with simulation report. | Restore prior routing policy or force human review. |
| Export field set | Compliance Officer / Data Owner | Privacy, security, business owner. | Approved field set and RBAC control. | Disable export template and revoke access. |

### Best Practices

Make the review workflow evidence-first. The reviewer should not need to read the entire transcript before understanding the AI recommendation. The screen should show the final outcome, parameter exceptions, cited evidence, confidence, hallucination flags, and routing reason. From there, the reviewer can expand context around cited utterances.

Separate configuration drafting from activation. Scorecard, prompt, model, and routing changes should be editable in draft state, reviewed with appropriate stakeholders, tested against representative data, and activated with an effective date. Activation should not rewrite historical audits. The workflow should make it easy to compare current and candidate versions before release.

Use product states to reduce ambiguity. A job that failed inference is not the same as a job awaiting human review. A sampled auto-pass is not the same as a low-confidence human review. The UI, APIs, dashboards, and metrics should use consistent state names so operations, QA, and compliance teams speak the same language.

### Risks

The product workflow may become too complex if every exception is exposed to every user. Users should see the states and actions relevant to their role. For example, QA analysts need review tasks, not GPU scheduling details. Platform engineers need technical exceptions, not coaching summaries. Compliance officers need evidence and audit trails, not general queue assignment controls.

Another risk is hidden policy impact. A small threshold change can significantly increase human review volume or auto-fail rate. A prompt change can alter score distributions. A model profile change can improve latency but reduce agreement. Product workflow must therefore include simulation, approval, and monitoring for high-impact configuration changes.

Human override also carries risk. Overrides are necessary, but inconsistent override behavior can undermine calibration. Reviewers may apply personal interpretations of the rubric unless guidance, examples, and manager review are built into the workflow. Override rationale should be structured enough for analysis while allowing free-text explanation when needed.

### Recommendations

Build the product workflow around role-specific home pages. QA analysts should land on assigned reviews and SLA priorities. QA managers should land on operational quality dashboards and queue health. Compliance officers should land on regulated audit coverage, evidence completeness, and export controls. Platform engineers should land on service health, backlog, and exception queues. Model operations analysts should land on agreement, hallucination, drift, and release comparison views.

Implement a configuration release workflow before broad rollout. Require version creation, test run attachment, approval, activation, monitoring, and rollback options for scorecard, prompt, model, and routing changes. This workflow should be lightweight enough for business use but strict enough to prevent uncontrolled changes.

Use the pilot to refine workflow details. Track reviewer time per audit, override reasons, evidence navigation usage, queue backlog, dashboard adoption, and stakeholder disputes. These operational signals will identify where the product should simplify screens, adjust routing, clarify rubric definitions, or improve model prompts.


---

# Auto Quality Review Automation (Auto QRA) - Solution Architecture and AI Design

Version 1.0 July 2026

## 20. Solution Architecture

### Purpose

This section defines the overall solution architecture for Auto Quality Review Automation, referred to as Auto QRA. The purpose is to show how application services, AI services, data stores, queues, review workflows, security controls, and reporting capabilities work together to automate quality audits at enterprise scale. The architecture is designed for 60,000 audits per month, approximately 30 QA parameters per audit, self-hosted LLM inference through vLLM, strict PII masking, SSO/RBAC access control, and a target audit latency below 60 seconds for normal workloads.

### Description

Auto QRA is a distributed audit automation platform. It ingests audit candidates from enterprise systems, normalizes the input, masks personally identifiable information, retrieves the applicable quality rubric and policy references, calls a self-hosted LLM served by vLLM, applies deterministic business rules, calculates confidence, stores audit outputs, and routes low-confidence or policy-sensitive decisions to human reviewers. The design separates orchestration, AI inference, rule evaluation, storage, and reporting so that each layer can scale and evolve independently.

The solution uses Docker-packaged services deployed to **Azure Kubernetes Service (AKS)** as the production orchestration platform. Production architecture uses AKS node pools with NVIDIA L40 48GB or A100 80GB-class GPUs for vLLM model serving, CPU node pools for API and worker services, Azure Database for PostgreSQL for relational audit data, Azure Cache for Redis for asynchronous work queues, and Azure Blob Storage for transcripts, evidence payloads, model artifacts, policy files, prompt versions, batch exports, and immutable audit attachments.

The platform intentionally combines probabilistic AI outputs with deterministic controls. The LLM proposes parameter-level ratings, evidence citations, and explanations. The business rules engine enforces contractual rules, compliance rules, escalation rules, and score caps. The confidence scoring layer assesses model confidence, retrieval confidence, rule confidence, data completeness, and disagreement signals. The human override workflow provides accountable review for low-confidence, high-impact, or exception cases.

```mermaid
flowchart TB
    subgraph Users["Enterprise Users"]
        QA["QA Analysts"]
        Managers["Operations Managers"]
        Admins["QRA Admins"]
    end

    subgraph Access["Access Layer"]
        SSO["SSO Provider"]
        RBAC["RBAC Policy"]
        Portal["Auto QRA Web Portal"]
        API["Public/API Gateway"]
    end

    subgraph App["Application Layer"]
        Ingest["Ingestion Service"]
        Orchestrator["Audit Orchestrator"]
        PII["PII Masking Service"]
        Rules["Business Rules Engine"]
        Confidence["Confidence Service"]
        Review["Human Review Service"]
        Reporting["Reporting Service"]
    end

    subgraph Data["Data Layer"]
        Redis["Redis Queue"]
        PG["PostgreSQL"]
        AzureBlobStorage["Azure Blob Storage"]
        Vector["pgvector Optional"]
    end

    subgraph AI["AI Layer"]
        Prompt["Prompt Builder"]
        Retrieval["Retrieval Service"]
        VLLM["vLLM Inference Server"]
        Model["3B/7B Quantized Model"]
    end

    QA --> Portal
    Managers --> Portal
    Admins --> Portal
    Portal --> SSO
    SSO --> RBAC
    Portal --> API
    API --> Ingest
    Ingest --> PII
    PII --> Redis
    Redis --> Orchestrator
    Orchestrator --> Retrieval
    Retrieval --> AzureBlobStorage
    Retrieval --> Vector
    Orchestrator --> Prompt
    Prompt --> VLLM
    VLLM --> Model
    VLLM --> Orchestrator
    Orchestrator --> Rules
    Rules --> Confidence
    Confidence --> PG
    Confidence --> Review
    Review --> PG
    Reporting --> PG
    Reporting --> AzureBlobStorage```

### Business Justification

Auto QRA improves audit throughput, consistency, and traceability. Manual quality reviews are expensive, difficult to calibrate across sites, and slow to respond to changing compliance policies. At 60,000 audits per month, a purely manual model creates operational bottlenecks and inconsistent scoring. Auto QRA automates the first-pass review and reserves human effort for overrides, exceptions, calibration, policy changes, and quality disputes.

Self-hosted LLM inference is justified by enterprise data sensitivity, predictable cost control, and governance. Running 3B or 7B quantized models on vLLM allows the business to avoid sending sensitive audit content to external hosted APIs while still gaining AI-assisted reasoning and natural-language evidence extraction. PII masking further reduces exposure and makes audit artifacts safer to retain, analyze, and share.

The architecture supports measurable business outcomes: reduced cycle time, lower cost per audit, consistent application of the 30 QA parameters, improved manager visibility, and stronger audit defensibility. The architecture also supports phased adoption. Teams can begin with AI-assisted recommendations, then enable auto-scoring for high-confidence cases, and later expand to more policy domains as calibration evidence accumulates.

### Technical Details

The core transaction begins when an audit candidate is submitted through an API, batch job, or integration connector. The ingestion service validates schema, assigns a correlation ID, writes raw references to Azure Blob Storage when needed, and creates a normalized audit request. The PII masking service replaces names, phone numbers, account numbers, email addresses, and other configured identifiers with reversible or irreversible placeholders based on policy. Masked text and metadata are stored separately from restricted raw artifacts.

Redis queues separate ingestion from processing. The audit orchestrator consumes queued work, resolves the active rubric version, retrieves policy snippets or few-shot examples, builds prompts, calls the vLLM server, validates the response schema, applies business rules, computes confidence, and writes results to PostgreSQL. Azure Blob Storage stores large objects, prompt snapshots, masked transcripts, source evidence, generated reports, and export files.

The AI inference tier uses vLLM because it provides efficient continuous batching, paged attention, OpenAI-compatible serving patterns, and strong GPU utilization. Quantized 3B or 7B models are appropriate for the latency target when prompts are controlled, retrieval is compact, and output schemas are bounded. L40 48GB GPUs provide a practical cost-performance balance for 7B quantized inference. A100 80GB GPUs are reserved for higher concurrency, larger context windows, calibration runs, or future model upgrades.

### Best Practices

- Keep the LLM isolated behind an internal service boundary and do not expose vLLM directly to external clients.
- Treat prompts, rubric versions, business rules, and model versions as auditable configuration artifacts.
- Store raw, masked, and derived data in clearly separated domains with explicit access policies.
- Use idempotent queue processing and correlation IDs across logs, database records, and object storage.
- Require structured JSON output from the model and validate it before applying rules or persisting scores.
- Use deterministic business rules to cap, override, or escalate LLM recommendations when policies require consistency.
- Track per-parameter confidence and decision reasons rather than only an aggregate score.
- Design every service for AKS scheduling, probes, resource requests/limits, and horizontal scaling from day one.

### Risks

The primary risk is overreliance on AI outputs without adequate controls. LLMs can hallucinate evidence, misunderstand policy context, or produce inconsistent interpretations when prompts drift. Another risk is GPU capacity contention, especially during batch peaks or when prompts grow beyond expected token budgets. Data privacy risk is also material because audit inputs may include customer, employee, or account information.

Operationally, Redis queue backlogs could push latency beyond the 60-second target. PostgreSQL can become a bottleneck if parameter-level results, logs, and reporting queries are not indexed and partitioned. Model upgrades may change scoring behavior in subtle ways, creating calibration drift. Retrieval failures may cause the model to score with incomplete policy context.

### Recommendations

Implement Auto QRA as a controlled automation system rather than a single AI service. Start with a reliable orchestration path, strict response validation, high-quality audit logs, and conservative auto-approval thresholds. Establish golden audit sets for regression testing before production rollout. Use L40 GPUs for baseline production inference and reserve A100 capacity for high-volume windows, larger models, or calibration experiments.

Adopt a versioned architecture for rubrics, prompts, retrieval bundles, rules, and models from the beginning. This allows the business to explain exactly why an audit received a score at a specific point in time. Build observability around queue time, inference time, total latency, GPU utilization, confidence distribution, human override rates, and parameter-level disagreement.

## 21. Component Diagram

### Purpose

This section identifies the major software components in Auto QRA and describes their responsibilities, interfaces, dependencies, and operational boundaries. The goal is to support implementation planning, ownership assignment, testing, and production support.

### Description

Auto QRA is decomposed into services that align with business capabilities. The web portal supports administrative configuration, audit review, reporting, and human override. The API gateway centralizes authentication, rate limiting, and request routing. The ingestion service accepts audit candidates from upstream systems. The PII masking service protects sensitive data before AI processing. The audit orchestrator coordinates queue consumption, retrieval, prompting, inference, rules, confidence, and persistence.

The AI subsystem consists of the retrieval service, prompt builder, vLLM inference server, and model registry. The deterministic subsystem consists of the business rules engine, confidence service, exception manager, and human review workflow. Storage components include PostgreSQL, Redis, Azure Blob Storage, and optionally pgvector for semantic retrieval. Observability components include structured logging, metrics, tracing, audit events, and operational dashboards.

```mermaid
flowchart LR
    subgraph Client["Client and Integration Components"]
        Web["Web Portal"]
        Batch["Batch Upload"]
        APIClient["Enterprise API Client"]
    end

    subgraph Core["Core Services"]
        Gateway["API Gateway"]
        Authz["Auth/RBAC Adapter"]
        Ingest["Ingestion Service"]
        Mask["PII Masking Service"]
        QueueProducer["Queue Producer"]
        Worker["Audit Worker"]
        Orchestrator["Audit Orchestrator"]
    end

    subgraph Intelligence["AI and Decision Components"]
        Rubric["Rubric Service"]
        Retrieval["Retrieval Service"]
        Prompt["Prompt Builder"]
        LLM["vLLM Client"]
        Rules["Rules Engine"]
        Conf["Confidence Service"]
        Exceptions["Exception Manager"]
    end

    subgraph ReviewOps["Review and Reporting"]
        Review["Human Review Service"]
        Report["Report Generator"]
        Export["Export Service"]
        Notify["Notification Service"]
    end

    subgraph Platforms["Platform Services"]
        Redis["Redis"]
        Postgres["PostgreSQL"]
        AzureBlobStorage["Azure Blob Storage"]
        VLLM["vLLM Server"]
        Registry["Model/Prompt Registry"]
        Metrics["Metrics and Logs"]
    end

    Web --> Gateway
    Batch --> Gateway
    APIClient --> Gateway
    Gateway --> Authz
    Gateway --> Ingest
    Ingest --> Mask
    Mask --> QueueProducer
    QueueProducer --> Redis
    Redis --> Worker
    Worker --> Orchestrator
    Orchestrator --> Rubric
    Orchestrator --> Retrieval
    Orchestrator --> Prompt
    Prompt --> LLM
    LLM --> VLLM
    VLLM --> Registry
    Orchestrator --> Rules
    Rules --> Conf
    Conf --> Exceptions
    Exceptions --> Review
    Conf --> Postgres
    Review --> Postgres
    Report --> Postgres
    Report --> AzureBlobStorage
    Export --> AzureBlobStorage
    Notify --> Web
    Core --> Metrics
    Intelligence --> Metrics
    ReviewOps --> Metrics```

### Business Justification

The component model allows the business to scale audit throughput without turning the system into a monolith. Each capability has a clear control point. Security teams can review the masking boundary. Compliance teams can review rules and exception workflows. AI governance teams can review prompt and model registries. Operations teams can scale workers independently from GPU inference.

This separation also supports phased delivery. A minimal viable release can include ingestion, masking, queueing, orchestration, vLLM inference, scoring, and reporting. Later releases can add richer retrieval, pgvector, calibration dashboards, advanced override workflows, and finer-grained AKS autoscaling without rewriting the whole system.

### Technical Details

The API gateway should validate authentication tokens from the enterprise SSO provider, apply tenant and role checks, assign request IDs, and route traffic to internal services. The ingestion service should expose synchronous endpoints for small submissions and asynchronous batch endpoints for large audit loads. The PII masking service should run before queue publication so downstream workers never require raw PII for normal scoring.

The audit worker should be stateless and horizontally scalable. It should claim jobs from Redis, obtain idempotency locks, execute orchestration, update job status, and publish retry or dead-letter events when needed. The orchestrator should not embed all scoring logic directly. It should call domain services for rubric resolution, retrieval, prompt construction, inference, rule evaluation, confidence scoring, and exception handling.

The vLLM client should implement request timeouts, retry limits for transient transport failures, token budget controls, schema validation, and circuit-breaker behavior. The vLLM server should be deployed on GPU-capable infrastructure with model artifacts loaded from a controlled model registry or Azure Blob Storage bucket. PostgreSQL should store normalized audit entities, parameter results, override records, rule execution traces, confidence metrics, and reporting dimensions.

### Best Practices

- Define stable service contracts using OpenAPI or protobuf-compatible schemas.
- Make every asynchronous job idempotent by audit ID, source event ID, and prompt version.
- Use clear ownership for components: platform, AI, workflow, reporting, and governance.
- Keep the prompt builder deterministic and testable.
- Store model responses exactly as received, after validation and redaction, to support audits.
- Emit structured events for every major state transition.
- Implement bulkhead limits between ingestion, workers, and GPU inference to avoid cascade failure.
- Keep review workflow changes isolated from core scoring services whenever possible.

### Risks

Component boundaries can create operational complexity if observability is weak. A failed audit may involve API logs, queue state, worker logs, vLLM metrics, database records, and object storage artifacts. Without correlation IDs and dashboards, support teams may struggle to troubleshoot. Another risk is excessive network chatter between small services. Latency must remain below 60 seconds, so service calls should be purposeful and batched where appropriate.

The PII masking component is especially sensitive. False negatives can expose PII to the AI layer. False positives can remove context required for accurate scoring. The rules engine can become difficult to maintain if business users request one-off exceptions without governance.

### Recommendations

Implement components with clear contracts and a shared event model. Establish a central audit execution timeline that records timestamps for ingestion, masking, queue enqueue, queue dequeue, retrieval, prompt build, inference start, inference end, rules, confidence, persistence, and report generation. This timeline should be queryable for each audit and aggregated for operational dashboards.

Start with a small number of independently deployable services: API, worker, vLLM, portal, and reporting. Keep internal domain modules separate even if they initially deploy together. This gives the team implementation speed now and a clean path to split services later when scaling pressure justifies it.

## 22. Infrastructure Architecture

### Purpose

This section defines the target cloud infrastructure for Auto QRA on Microsoft Azure. It explains how compute, GPU resources, storage, networking, secrets, observability, and future Kubernetes resources support a secure and scalable audit automation platform.

### Description

Auto QRA runs on Microsoft Azure with containerized workloads deployed to **AKS**. Application services and vLLM GPU inference run as Kubernetes workloads. The infrastructure is arranged into separate layers for ingress (Application Gateway), application processing, AI inference, data persistence, object storage, and operations. Container images, configuration, service boundaries, health checks, Azure Key Vault secrets, resource requests, and stateless workers are designed for AKS from the first production release.

The AI inference layer uses NVIDIA L40 48GB or A100 80GB GPUs. L40 GPUs are suitable for cost-efficient 3B and 7B quantized model inference with controlled prompt size. A100 GPUs provide additional memory and throughput headroom for larger batches, bigger context windows, and future model growth. vLLM runs close to the worker tier in private networking to minimize latency and avoid exposing model endpoints to the public internet.

```mermaid
flowchart TB
    subgraph Azure["Azure Project"]
        subgraph VNet["Private Azure VNet"]
            subgraph PublicSubnet["Public Subnet"]
                LB["HTTPS Load Balancer"]
                NAT["Azure NAT Gateway"]
            end

            subgraph AppSubnet["Application Subnet"]
                API["API Containers"]
                Portal["Web Portal Containers"]
                Workers["Audit Worker Containers"]
                Reports["Reporting Containers"]
            end

            subgraph AISubnet["AI/GPU Subnet"]
                VLLM1["vLLM GPU Node L40"]
                VLLM2["vLLM GPU Node A100 Optional"]
            end

            subgraph DataSubnet["Data Subnet"]
                Redis["Redis Queue"]
                PG["PostgreSQL"]
                PrivateEndpoint["Azure Private Link"]
            end
        end

        AzureBlobStorage["Azure Blob Storage Buckets"]
        Secrets["Azure Key Vault"]
        IAM["IAM and Azure Workload Identity"]
        Logs["Azure Monitor Logs"]
        Metrics["Azure Monitor"]
        Registry["Azure Container Registry (ACR)"]
    end

    Internet["Enterprise Network/Internet"] --> LB
    LB --> Portal
    LB --> API
    API --> Workers
    Workers --> Redis
    Workers --> PG
    Workers --> VLLM1
    Workers --> VLLM2
    Workers --> AzureBlobStorage
    Workers --> Secrets
    VLLM1 --> AzureBlobStorage
    VLLM2 --> AzureBlobStorage
    AppSubnet --> NAT
    Registry --> AppSubnet
    Registry --> AISubnet
    Logs --> Metrics```

### Business Justification

Azure provides the GPU availability, storage durability, private networking, and operational tooling required by Auto QRA. Using self-hosted GPUs gives the business direct control over model runtime, data residency, cost, and latency. Azure Blob Storage supports low-cost, durable retention of large audit artifacts. PostgreSQL supports strong transactional integrity for audit decisions and review workflows. Redis supports burst absorption and asynchronous processing.

The infrastructure architecture balances delivery speed with enterprise scale by standardizing on AKS. Helm-based releases, rolling deployments, HPA/KEDA scaling, GPU node-pool isolation, and network policies provide the operating model required for 99.9% availability and controlled growth beyond 60,000 audits per month.

### Technical Details

The recommended infrastructure separates environments into development, staging, and production projects or folders. Each environment should have isolated networks, databases, buckets, Redis instances, secrets, and service accounts. Production should use private subnets for application, data, and AI services. Public ingress should terminate at an HTTPS load balancer or approved enterprise ingress layer. Backend services should communicate over private IP.

PostgreSQL may be implemented with Azure Database for PostgreSQL or a managed PostgreSQL service approved by the enterprise. It should use private IP connectivity, automated backups, point-in-time recovery, high availability for production, and read replicas if reporting load becomes material. Redis may be implemented with Azure Cache for Redis or a containerized Redis for early lower-risk environments; production should prefer managed Redis for availability and operational support.

Azure Blob Storage buckets should be separated by data class. Recommended buckets include raw-audit-ingest, masked-audit-artifacts, policy-rubric-content, model-artifacts, generated-reports, and operational-exports. Each bucket should use lifecycle policies, uniform bucket-level access, CMEK where required, and object versioning for policies and prompts.

### Best Practices

- Use private IP for PostgreSQL, Redis, vLLM, and internal application service communication.
- Store container images in Azure Container Registry (ACR) and scan them before production deployment.
- Use Azure Key Vault for database credentials, SSO secrets, signing keys, and service tokens.
- Assign least-privilege service accounts per workload.
- Use CMEK for regulated storage classes when enterprise policy requires it.
- Enable Azure Monitor Logs, Azure Monitor, uptime checks, alerting, and audit logs.
- Place GPU workloads in dedicated nodes or instances with explicit capacity planning.
- Maintain separate staging infrastructure for model, prompt, and rules regression testing.

### Risks

GPU supply may be constrained in some Azure regions. The architecture must account for regional availability of L40 and A100 instances. GPU cost can grow quickly if vLLM servers are overprovisioned or left idle during low traffic periods. Azure Database for PostgreSQL and Redis sizing may be underestimated if the design stores high-cardinality parameter-level records and detailed traces without partitioning.

Another risk is inconsistent environment configuration. If development, staging, and production differ significantly, prompt behavior, timeout behavior, and queue behavior may diverge. Security risk increases if service accounts have broad permissions to all buckets or if object storage is not separated by data class.

### Recommendations

Start infrastructure sizing with expected monthly volume, peak concurrency, and latency budgets. For 60,000 audits per month, average volume is modest, but business hours and batch uploads can create peaks. Size Redis and worker concurrency for peaks rather than averages. Size vLLM for the 95th percentile prompt and output token budget.

Use infrastructure as code for networks, service accounts, buckets, databases, Redis, monitoring, and firewall rules. Document approved regions and GPU fallback options. Build staging so it mirrors production topology even if it uses smaller instances. This gives the team a trustworthy place to test model upgrades, prompt changes, and rules before release.

## 23. Deployment Architecture

### Purpose

This section explains how Auto QRA is packaged, released, deployed, and operated on **Azure Kubernetes Service (AKS)**. The purpose is to ensure first production release and subsequent scale use the same AKS operating model.

### Description

Production deployment uses Docker container images for the web portal, API service, audit worker, reporting service, and vLLM inference, orchestrated on AKS. Application containers are built from versioned source code and pushed to Azure Container Registry (ACR). vLLM containers are built with GPU runtime support and configured with approved quantized model artifacts. CI/CD promotes images from development to staging to production AKS clusters or namespaces.

In AKS, CPU workloads run in general/app node pools and GPU workloads run in dedicated node pools with NVIDIA drivers and the device plugin. Managed Azure Database for PostgreSQL and Azure Cache for Redis remain outside the cluster. Worker pods scale horizontally based on Redis queue depth and processing latency (HPA/KEDA). vLLM pods scale more conservatively because GPU capacity is expensive and model load time is significant. Readiness probes, liveness probes, resource limits, node selectors, taints, tolerations, and pod disruption budgets are required production controls.

```mermaid
flowchart LR
    subgraph Build["Container Build (Docker Images)"]
        DockerAPI["api container"]
        DockerPortal["portal container"]
        DockerWorker["worker container"]
        DockerReport["reporting container"]
        DockerVLLM["vLLM GPU container"]
        DockerRedis["Redis"]
        DockerPG["PostgreSQL"]
    end

    subgraph Pipeline["CI/CD Pipeline"]
        Build["Build Images"]
        Scan["Security Scan"]
        Test["Automated Tests"]
        Promote["Promote Image Tags"]
        Deploy["Deploy Release"]
    end

    subgraph Deploy["AKS Production Deployment"]
        Ingress["Ingress Controller"]
        APIDeploy["API Deployment"]
        PortalDeploy["Portal Deployment"]
        WorkerDeploy["Worker Deployment"]
        ReportDeploy["Reporting Deployment"]
        VLLMDeploy["vLLM GPU Deployment"]
        RedisSvc["Managed Redis Service"]
        PGSvc["Managed PostgreSQL"]
    end

    DockerAPI --> Build
    DockerPortal --> Build
    DockerWorker --> Build
    DockerReport --> Build
    DockerVLLM --> Build
    Build --> Scan
    Scan --> Test
    Test --> Promote
    Promote --> Deploy
    Deploy --> Target```

```mermaid
flowchart TB
    subgraph AKS["AKS Production Cluster"]
        subgraph System["System Node Pool"]
            Ingress["Ingress"]
            Metrics["Metrics Agents"]
        end

        subgraph CPU["CPU Node Pool"]
            APIPod1["api pod"]
            APIPod2["api pod"]
            Worker1["worker pod"]
            Worker2["worker pod"]
            WorkerN["worker pod"]
            ReportPod["reporting pod"]
            ReviewPod["review pod"]
        end

        subgraph GPU["GPU Node Pool"]
            VLLMPod1["vLLM pod - L40"]
            VLLMPod2["vLLM pod - A100 optional"]
        end

        HPA["Horizontal Pod Autoscaler"]
        KEDA["KEDA Redis Scaler"]
        Secrets["Kubernetes Secrets/External Secrets"]
        Config["ConfigMaps"]
    end

    Ingress --> APIPod1
    Ingress --> APIPod2
    KEDA --> Worker1
    KEDA --> Worker2
    KEDA --> WorkerN
    Worker1 --> VLLMPod1
    Worker2 --> VLLMPod1
    WorkerN --> VLLMPod2
    HPA --> APIPod1
    HPA --> APIPod2
    Secrets --> APIPod1
    Secrets --> Worker1
    Config --> VLLMPod1```

### Business Justification

Docker-first deployment reduces initial implementation friction and supports early production rollout. Kubernetes readiness protects the business from operational limits as usage grows. Auto QRA has a mixed workload profile: APIs require low-latency request handling, workers require queue-driven scaling, reporting requires scheduled or ad hoc batch processing, and vLLM requires GPU-aware scheduling. Kubernetes is well suited for this workload once the system reaches the right scale.

Controlled deployment also supports compliance. Because audit decisions may affect performance management, customer experience, regulatory evidence, or operational scorecards, releases must be traceable. Every production decision should be explainable in terms of code version, model version, prompt version, rubric version, rules version, and deployment version.

### Technical Details

Container images should be immutable and tagged with commit SHA, semantic release version, and environment promotion metadata. Configuration should be externalized through environment variables, mounted files, or Kubernetes ConfigMaps. Secrets should never be baked into images. vLLM containers should load model artifacts from a controlled path, with checksum validation before serving traffic.

The Docker deployment should include health endpoints for API, worker, reporting, and vLLM services. Worker containers should support graceful shutdown by finishing or returning current jobs to the queue. vLLM containers should expose readiness only after the model is loaded and a small validation request succeeds. Deployment automation should use rolling releases for stateless application services and controlled replacement for GPU inference services.

In Kubernetes, API services should use Deployments with multiple replicas. Workers should use Deployments or Jobs depending on workload pattern, with scaling based on Redis queue depth. vLLM should use GPU node selectors and tolerations. A PodDisruptionBudget should protect minimum inference capacity. Readiness probes should prevent traffic to cold or unhealthy model pods. NetworkPolicy should restrict direct access to vLLM to approved worker and orchestration namespaces.

### Best Practices

- Use immutable image tags and prohibit mutable production tags such as latest.
- Promote the same image across environments rather than rebuilding per environment.
- Run smoke tests after deployment and before increasing traffic.
- Separate application configuration from release artifacts.
- Apply blue-green or canary deployment for model and prompt changes when feasible.
- Keep rollback procedures for code, prompts, rules, and models.
- Validate vLLM readiness with a schema-constrained test prompt.
- Document production runbooks for queue backlog, GPU saturation, and database pressure.

### Risks

The largest deployment risk is treating model changes like ordinary code changes. A model or prompt update can change scoring behavior even when the application remains healthy. Another risk is underestimating vLLM startup time. Model loading can take long enough to cause failed readiness windows or temporary capacity loss. Kubernetes GPU scheduling also introduces operational complexity, including driver compatibility, GPU plugin health, and node pool upgrades.

Docker-based production deployments can become fragile if they rely on manual steps, host-specific configuration, or inconsistent environment variables. If Redis and PostgreSQL are also self-managed in Docker for production, availability and backup obligations increase.

### Recommendations

Use Docker for initial controlled deployment, but implement all services as if they will run in Kubernetes. Add health checks, graceful shutdown, structured logs, resource configuration, and stateless worker behavior immediately. For model updates, use a separate release approval path that includes regression testing on golden audits, confidence distribution comparison, and human review sampling.

Define deployment gates: unit tests, integration tests, prompt schema tests, security scan, image provenance, staging smoke test, model checksum validation, and production canary. Maintain a release manifest that records code image, model artifact, prompt bundle, rubric version, rules version, and migration version.

## 24. Networking Architecture

### Purpose

This section defines how Auto QRA services communicate securely across Azure network boundaries, enterprise ingress, private service endpoints, and internal service paths. The purpose is to protect sensitive audit data while preserving low-latency processing between workers, databases, queues, Azure Blob Storage, and vLLM inference.

### Description

Auto QRA uses a private-first networking model. User and integration traffic enters through an enterprise-approved HTTPS endpoint, such as a Azure HTTPS load balancer or corporate ingress gateway. After ingress termination and authentication, service-to-service traffic remains inside the private VNet. PostgreSQL, Redis, and vLLM are not exposed publicly. Azure Blob Storage access is controlled through IAM and private access patterns where available.

The recommended network topology includes a public ingress subnet, application subnet, AI/GPU subnet, data subnet, and operations subnet. Firewall rules and future Kubernetes NetworkPolicies restrict traffic to required paths. The API can reach ingestion, reporting, and review services. Workers can reach Redis, PostgreSQL, Azure Blob Storage, retrieval services, rules services, and vLLM. vLLM only accepts requests from the orchestration or worker tier. Admin access uses bastion, identity-aware proxy, or approved private connectivity.

```mermaid
flowchart TB
    Internet["Enterprise Users and Systems"] --> WAF["WAF / HTTPS LB"]
    WAF --> IngressSubnet["Public Ingress Subnet"]

    subgraph VNet["Auto QRA Azure VNet"]
        IngressSubnet --> API["API Gateway"]

        subgraph AppSubnet["Application Subnet"]
            API --> Portal["Portal Service"]
            API --> Ingest["Ingestion Service"]
            API --> Report["Reporting Service"]
            Worker["Audit Workers"]
            Review["Review Service"]
        end

        subgraph AISubnet["AI/GPU Subnet"]
            VLLM["vLLM Private Endpoint"]
            GPU["GPU Nodes L40/A100"]
        end

        subgraph DataSubnet["Data Subnet"]
            Redis["Redis Private IP"]
            PG["PostgreSQL Private IP"]
            PSC["Azure Private Link"]
        end

        subgraph OpsSubnet["Operations Subnet"]
            Bastion["Bastion/IAP"]
            Monitoring["Monitoring Agents"]
        end
    end

    Worker --> Redis
    Worker --> PG
    Worker --> VLLM
    VLLM --> GPU
    Worker --> PSC
    PSC --> AzureBlobStorage["Azure Blob Storage APIs"]
    Bastion --> AppSubnet
    Monitoring --> AppSubnet
    Monitoring --> AISubnet
    Monitoring --> DataSubnet```

### Business Justification

Network isolation is required because Auto QRA processes audit evidence that may contain customer information, employee information, transaction details, coaching notes, and business-sensitive performance data. A private-first model reduces exposure and supports enterprise compliance reviews. It also keeps inference traffic inside controlled infrastructure, which reinforces the decision to self-host LLMs.

The network design supports operational reliability. By separating ingress, application, AI, and data subnets, the organization can apply specific controls and scaling policies to each tier. For example, GPU nodes can be isolated from public internet traffic, data stores can be restricted to application service accounts, and reporting access can be controlled through the API rather than direct database connections.

### Technical Details

Inbound traffic should use HTTPS with TLS 1.2 or higher. The load balancer should integrate with WAF rules, request size limits, and IP allowlists if enterprise policy requires them. API gateway routes should enforce authentication and authorization before requests reach business services. SSO integration should use OIDC or SAML through an enterprise identity provider, with roles mapped to Auto QRA permissions.

Internal traffic should use private DNS names and private IP addresses. Database and Redis ports should only be open to approved application and worker service accounts or network tags. vLLM should listen on an internal interface only. If the vLLM server exposes an OpenAI-compatible endpoint, it must still be treated as private infrastructure and protected with network controls and service authentication.

Azure Blob Storage access should use service accounts and IAM. When supported by enterprise Azure configuration, private Google access or Azure Private Link should be used so traffic to Google APIs does not require public egress. Azure NAT Gateway can support controlled outbound access for package updates or external integrations, but production runtime dependencies should be minimized and allowlisted.

### Best Practices

- Deny direct public access to vLLM, PostgreSQL, Redis, and internal services.
- Use private DNS for service discovery and avoid hard-coded IP addresses.
- Apply firewall rules by service identity or network tag, not broad CIDR ranges alone.
- Restrict worker-to-vLLM traffic to the minimum required ports and protocols.
- Use mTLS or signed service tokens for high-sensitivity internal calls where required.
- Enable VNet flow logs for production subnets with an appropriate sampling rate.
- Use separate subnets for GPU workloads to simplify cost, access, and capacity controls.
- Periodically test firewall rules and network policies through security validation.

### Risks

Misconfigured firewall rules can expose sensitive services or block critical processing paths. Azure Blob Storage access can become a hidden public egress path if private access is not configured. Overly restrictive network rules may break deployment, image pulls, observability, or model artifact downloads. Conversely, overly permissive rules can undermine the security value of self-hosting the LLM.

Latency can be affected by poor placement of GPU nodes, workers, and data stores. If vLLM runs in a different region or zone from workers, inference calls may consume part of the 60-second latency budget unnecessarily. Network timeouts can create duplicate queue processing if idempotency is weak.

### Recommendations

Use a documented network matrix that lists every approved source, destination, port, protocol, identity, and reason. Treat the matrix as part of release governance. Keep workers, Redis, PostgreSQL, and vLLM in the same region and preferably in low-latency zones. Use private endpoints for managed services wherever available.

For Kubernetes, implement NetworkPolicies from the first AKS release. The default namespace posture should deny ingress and allow only explicitly approved service communication. Include vLLM access tests, database connectivity tests, Redis queue tests, and Azure Blob Storage access tests in deployment smoke checks.

## 25. AI Pipeline

### Purpose

This section defines the end-to-end AI pipeline that converts an audit input into parameter-level quality findings, scores, explanations, confidence values, and review actions. The purpose is to make the AI behavior implementation-ready, testable, governable, and aligned with enterprise risk controls.

### Description

The AI pipeline is not a single prompt call. It is a sequence of controlled stages: input validation, PII masking, rubric resolution, retrieval, prompt construction, token budgeting, vLLM inference, response parsing, schema validation, evidence verification, business rule application, confidence scoring, persistence, and human review routing. Each stage has a defined output and failure behavior.

The model evaluates 30 QA parameters. Each parameter has a name, definition, scoring scale, evidence requirements, policy references, disqualifying conditions, and examples. The LLM is asked to return structured JSON containing parameter ID, rating, evidence spans, rationale, uncertainty notes, and suggested coaching text. The rules engine then enforces deterministic constraints, such as mandatory fails, compliance escalations, score caps, and auto-review thresholds.

```mermaid
flowchart TD
    A["Audit candidate received"] --> B["Validate schema and source eligibility"]
    B --> C["Mask PII and classify sensitive fields"]
    C --> D["Resolve rubric version and 30 QA parameters"]
    D --> E["Retrieve policy snippets and few-shot examples"]
    E --> F["Build bounded prompt with output schema"]
    F --> G["Check token budget and truncation policy"]
    G --> H["Call vLLM self-hosted model"]
    H --> I["Parse model JSON response"]
    I --> J{"Schema valid?"}
    J -- "No" --> K["Repair prompt or retry once"]
    K --> L{"Valid after retry?"}
    L -- "No" --> X["Route to exception queue"]
    L -- "Yes" --> M["Evidence and consistency checks"]
    J -- "Yes" --> M
    M --> N["Apply business rules"]
    N --> O["Compute confidence score"]
    O --> P{"Confidence threshold met?"}
    P -- "High" --> Q["Auto-finalize eligible result"]
    P -- "Medium" --> R["Sample or targeted review"]
    P -- "Low" --> S["Human review required"]
    Q --> T["Persist score and report"]
    R --> T
    S --> T
    X --> T```

### Business Justification

The pipeline approach makes Auto QRA defensible. Business stakeholders need more than a score; they need evidence, rationale, consistency, and recourse. A structured pipeline gives compliance teams a way to inspect each step. It allows operations leaders to trust high-confidence automation while preserving human judgment for uncertain or high-risk cases.

Using a self-hosted 3B or 7B quantized model provides a practical balance between cost, latency, and data control. The latency target is below 60 seconds, so the pipeline must keep prompts compact and retrieval focused. The model should not read every enterprise policy document on every audit. Instead, it should receive only the active rubric, relevant policy snippets, and examples needed for the audit type.

### Technical Details

The pipeline input should include audit ID, source system, audit type, channel, language, transcript or evidence payload, metadata, and optional existing human labels. Input validation should reject malformed payloads, unsupported channels, missing required fields, or payloads that exceed configured size limits. PII masking should run before any LLM prompt construction.

Rubric resolution should select the effective rubric by tenant, line of business, audit type, date, region, and language. The retrieval service should fetch policy documents, QA rubric sections, and few-shot examples from Azure Blob Storage or pgvector. Retrieval output should be compact and ranked. Prompt construction should assemble system instructions, task instructions, rubric definitions, retrieved context, masked audit content, output schema, and guardrails.

The vLLM request should use deterministic or low-temperature generation for scoring tasks. Recommended settings include temperature between 0.0 and 0.2, bounded max output tokens, stop sequences when supported, and JSON-constrained output if the serving stack supports it. The response parser should reject non-JSON, missing parameter results, invalid score values, unsupported parameter IDs, and explanations without evidence.

### Best Practices

- Use one canonical prompt builder and avoid hand-built prompts in worker code.
- Keep prompt sections ordered consistently across all audit types.
- Use deterministic generation settings for scoring and reserve higher temperature for optional coaching text only.
- Validate that all 30 QA parameters are returned exactly once.
- Require evidence references for non-pass, compliance, and low-score decisions.
- Log token counts, model latency, retry count, schema validity, and confidence inputs.
- Regression test prompts against golden audit sets before release.
- Separate model recommendation from final governed score.

### Risks

The model may produce plausible but unsupported rationales. It may overfit to examples, miss domain-specific exceptions, or assign scores inconsistently across similar audits. Prompt length may grow as teams add policy context, threatening the latency target. Retrieval failures can silently reduce scoring quality if the pipeline does not detect missing context.

Quantized smaller models may struggle with long transcripts or nuanced policy interpretation. A 3B model may meet latency goals but require stricter retrieval and simpler scoring prompts. A 7B model may improve reasoning but consume more GPU memory and inference time. Pipeline retries can protect reliability but also increase tail latency.

### Recommendations

Implement the pipeline as explicit stages with recorded intermediate metadata. Do not store unnecessary raw PII in prompt logs. Maintain a benchmark suite with representative audits, edge cases, compliance failures, and historically disputed audits. Evaluate 3B and 7B quantized models against the same benchmark using accuracy, agreement with expert reviewers, latency, GPU cost, schema validity, and confidence calibration.

Use conservative auto-finalization at launch. For example, only high-confidence audits with no compliance triggers and no major retrieval gaps should be finalized without human review. Expand automation thresholds after monitoring override rates and calibration drift.

## 26. Data Flow

### Purpose

This section documents how data moves through Auto QRA from ingestion through masking, queueing, AI processing, scoring, storage, reporting, and human review. The purpose is to support engineering implementation, privacy review, operational troubleshooting, and auditability.

### Description

Auto QRA data flow is event-driven and traceable. Every audit receives a correlation ID at ingestion. Raw source references, masked artifacts, queue messages, LLM prompt versions, response payloads, business rule traces, confidence metrics, human overrides, and reports are linked by audit ID. The system should be able to reconstruct what happened without exposing raw PII to users who do not need it.

The normal path is ingestion to PII mask to Redis queue to worker orchestration to retrieval to vLLM inference to rule evaluation to score persistence to report generation. Human review and exception flows branch from the confidence and exception stages. Reporting reads governed results from PostgreSQL and large artifacts from Azure Blob Storage.

```mermaid
sequenceDiagram
    autonumber
    participant Source as Source System
    participant API as API Gateway
    participant Ingest as Ingestion Service
    participant Mask as PII Masking
    participant Azure Blob Storage as Azure Blob Storage
    participant Redis as Redis Queue
    participant Worker as Audit Worker
    participant Retrieval as Retrieval Service
    participant VLLM as vLLM
    participant Rules as Rules Engine
    participant DB as PostgreSQL
    participant Report as Reporting

    Source->>API: Submit audit candidate
    API->>Ingest: Authenticated request with correlation ID
    Ingest->>Azure Blob Storage: Store raw artifact reference if required
    Ingest->>Mask: Send content for PII masking
    Mask->>Azure Blob Storage: Store masked artifact
    Mask->>Redis: Enqueue audit job
    Redis->>Worker: Dequeue job
    Worker->>Retrieval: Request rubric, policy, examples
    Retrieval->>Azure Blob Storage: Load policy and rubric content
    Retrieval-->>Worker: Return ranked context
    Worker->>VLLM: Submit masked prompt
    VLLM-->>Worker: Return structured model output
    Worker->>Rules: Apply deterministic rules
    Rules-->>Worker: Return governed result
    Worker->>DB: Store scores, confidence, traces
    Report->>DB: Read audit results
    Report->>Azure Blob Storage: Write generated report```

```mermaid
sequenceDiagram
    autonumber
    participant Worker as Audit Worker
    participant DB as PostgreSQL
    participant Review as Human Review Service
    participant Analyst as QA Analyst
    participant AuditLog as Audit Event Log
    participant Report as Reporting Service

    Worker->>DB: Store low-confidence result with review_required status
    Worker->>Review: Create review task
    Review->>Analyst: Present masked evidence, model rationale, rules trace
    Analyst->>Review: Approve, edit, or reject recommendation
    Review->>DB: Persist override decision and reason
    Review->>AuditLog: Record actor, timestamp, before/after values
    Report->>DB: Read final governed score```

### Business Justification

Traceable data flow is essential for enterprise adoption. Quality scores may influence coaching, incentives, compliance remediation, customer experience reporting, and vendor performance. Stakeholders must be able to answer who submitted the audit, what data was used, how PII was handled, what model and prompt were used, which rules changed the score, why confidence was high or low, and who overrode the decision if applicable.

The data flow also supports operational scalability. Redis absorbs bursts from batch ingestion. Workers process asynchronously so source systems are not blocked by GPU inference. PostgreSQL provides reliable records for reporting and workflow. Azure Blob Storage stores large artifacts without overloading the relational database.

### Technical Details

Data should be classified into raw source data, masked processing data, model input data, model output data, governed decision data, review data, and reporting data. Raw source data should have the most restrictive access and shortest feasible retention. Masked processing data can be used for AI scoring and reviewer workflows. Governed decision data is the system of record for audit outcomes.

Queue messages should be small and contain references rather than full transcripts. A recommended Redis job payload includes audit ID, tenant ID, source event ID, masked artifact URI, rubric version, priority, retry count, creation timestamp, and idempotency key. The worker should fetch large content from Azure Blob Storage as needed. This prevents Redis memory pressure and simplifies retry behavior.

PostgreSQL should store normalized tables such as audits, audit_inputs, parameter_results, rule_executions, confidence_scores, review_tasks, overrides, exception_events, prompt_runs, model_runs, and report_exports. Large text blobs should be stored in Azure Blob Storage with URIs referenced by PostgreSQL. Sensitive fields should be encrypted or tokenized according to enterprise data policy.

### Best Practices

- Assign a correlation ID at the first touchpoint and propagate it everywhere.
- Store queue messages as references and metadata, not large payloads.
- Separate raw PII storage from masked AI processing storage.
- Use immutable prompt and model run records for auditability.
- Keep parameter-level results normalized for reporting and analytics.
- Apply retention policies based on data class.
- Make report generation read from governed final results, not raw model outputs.
- Log state transitions as events, not only final outcomes.

### Risks

Data leakage can occur if raw content is accidentally included in prompts, logs, queue messages, or reports. Incomplete lineage can make it impossible to defend a score. Queue retries may duplicate work if idempotency is not enforced. Large audit payloads can cause Redis memory pressure or slow worker startup if stored directly in queue messages.

Reporting teams may request direct database access, which can bypass application-level RBAC and expose sensitive fields. Another risk is retaining raw data longer than necessary because retention classes are not defined early.

### Recommendations

Create a data classification and retention matrix before production. Enforce storage boundaries in code and infrastructure. Provide reporting views or APIs that expose only governed and authorized fields. Implement idempotency at ingestion and processing. Add automated checks that prevent raw PII fields from entering prompt logs or model request records.

For operational support, build an audit trace page visible to authorized admins. It should show the end-to-end data flow timeline without exposing restricted content. This page will reduce support time and improve confidence during compliance reviews.

## 27. Prompt Engineering Strategy

### Purpose

This section defines how prompts are designed, versioned, tested, governed, and executed for the 30 QA parameters used by Auto QRA. The purpose is to make model behavior consistent, explainable, and maintainable across audit types, policy changes, and model upgrades.

### Description

The prompt strategy uses structured, versioned templates. Each prompt includes system instructions, role framing, audit task, active rubric, retrieved policy context, masked audit evidence, parameter definitions, scoring constraints, output schema, and uncertainty instructions. The prompt should not rely on implicit model behavior. It should explicitly tell the model to score only from provided evidence, cite evidence spans, avoid guessing, and return uncertainty when evidence is incomplete.

Prompt engineering for Auto QRA must support all 30 QA parameters without creating unbounded prompts. The template should include concise parameter definitions and retrieve only the most relevant policy and few-shot examples. Parameters can be grouped by domain, such as greeting, verification, compliance, issue diagnosis, resolution quality, communication quality, documentation, escalation, empathy, closure, and process adherence. The output must include one object per parameter.

### Prompt Template Structure for 30 QA Parameters

```text
SYSTEM:
You are Auto QRA, an enterprise quality review assistant. Score the audit using only the masked audit evidence, active QA rubric, retrieved policy context, and examples provided. Do not infer facts that are not supported by evidence. Return valid JSON only.

MODEL AND GOVERNANCE CONTEXT:
- model_version: {{model_version}}
- prompt_version: {{prompt_version}}
- rubric_version: {{rubric_version}}
- tenant_id: {{tenant_id}}
- audit_type: {{audit_type}}
- channel: {{channel}}
- language: {{language}}

TASK:
Evaluate the interaction against exactly 30 QA parameters. For each parameter, provide:
- parameter_id
- rating: pass | fail | partial | not_applicable
- raw_score
- max_score
- evidence: array of cited masked spans or event references
- rationale: concise explanation grounded in evidence
- uncertainty: none | low | medium | high
- policy_refs: array of provided policy reference IDs
- coaching_note: optional short coaching guidance

RUBRIC:
{{rubric_summary}}

PARAMETERS:
1. {{P01_definition}}
2. {{P02_definition}}
...
30. {{P30_definition}}

RETRIEVED POLICY CONTEXT:
{{ranked_policy_snippets}}

FEW-SHOT EXAMPLES:
{{few_shot_examples}}

MASKED AUDIT EVIDENCE:
{{masked_transcript_or_evidence}}

SCORING RULES:
- Use not_applicable only when the rubric explicitly permits it.
- Use fail when required evidence is absent for a mandatory parameter.
- Do not award points for unsupported behavior.
- Cite evidence for every fail, partial, or compliance-sensitive pass.
- If evidence conflicts, mark uncertainty at least medium.
- If policy context is missing for a policy-dependent parameter, mark uncertainty high.

OUTPUT:
Return JSON matching this schema:
{
  "audit_id": "{{audit_id}}",
  "overall_summary": "string",
  "parameter_results": [
    {
      "parameter_id": "P01",
      "rating": "pass|fail|partial|not_applicable",
      "raw_score": 0,
      "max_score": 0,
      "evidence": [{"span_id": "string", "quote": "string"}],
      "rationale": "string",
      "uncertainty": "none|low|medium|high",
      "policy_refs": ["string"],
      "coaching_note": "string"
    }
  ],
  "global_uncertainty_notes": ["string"],
  "potential_exceptions": ["string"]
}
```

### Business Justification

Prompt consistency directly affects scoring consistency. Without standardized prompts, two audits with similar evidence may receive different scores because instructions, examples, or policy context differ. Versioned templates allow the business to manage prompt changes like controlled product changes. This is especially important when audit scores affect coaching, vendor scorecards, or compliance monitoring.

The prompt template also supports explainability. Parameter-level evidence and rationale help QA analysts understand why the system reached a conclusion. Uncertainty fields help the workflow route ambiguous cases to human review rather than hiding weak model confidence behind a numeric score.

### Technical Details

Prompts should be assembled by a prompt builder service or module, not directly inside business logic. The builder should accept structured inputs: audit metadata, masked content, rubric version, parameter definitions, retrieved context, examples, output schema, and token budget. It should produce a prompt package containing the rendered prompt, prompt hash, token estimate, source references, and truncation decisions.

Prompt versions should be stored in a registry with effective dates, owners, approval state, compatible model versions, compatible rubric versions, and regression test results. Prompt changes should run against golden audits before production release. The prompt builder should fail closed if the active prompt version, rubric version, or output schema is missing.

The 30 QA parameters should be represented as structured configuration rather than hard-coded prose. Each parameter should include ID, name, description, scoring scale, evidence requirements, applicability rules, policy references, and examples. This allows prompt generation, UI display, reporting, and rules to use the same source of truth.

### Best Practices

- Use low-temperature inference for scoring tasks.
- Require valid JSON and validate the response against a schema.
- Keep the output schema stable and versioned.
- Include only relevant retrieved context to protect latency.
- Use concise few-shot examples that demonstrate scoring boundaries.
- Include explicit uncertainty instructions.
- Use prompt hashes to prove which prompt generated each result.
- Run prompt regression tests before any production prompt promotion.

### Risks

Prompt drift can introduce scoring drift. Business users may ask to add more instructions, examples, and policy snippets until the prompt becomes too long or contradictory. Few-shot examples can bias the model toward patterns that do not apply to the current audit. If prompt versions are not tied to results, historical scores may become difficult to explain.

Another risk is prompt injection through audit content. A transcript may contain text that looks like instructions to the model. The prompt must clearly identify audit evidence as data, not instructions. The parser and rules engine must reject output that does not match the requested schema.

### Recommendations

Create a prompt governance process with owners from QA operations, compliance, AI engineering, and product. Treat prompt changes as controlled releases. Maintain a prompt test suite with passing, failing, partial, not applicable, compliance, multilingual, noisy transcript, and edge-case audits. Measure schema validity, score agreement, evidence quality, latency, and confidence calibration for each prompt release.

Keep parameter definitions modular. If the 30 parameters differ by business line, resolve them through rubric configuration rather than separate prompt code. Use a prompt injection test set that includes malicious or confusing transcript content and verify that the model ignores it as instruction.

## 28. Retrieval Strategy

### Purpose

This section defines how Auto QRA retrieves QA rubrics, policy documents, reference procedures, and few-shot examples to support accurate model scoring. The purpose is to provide the LLM with enough context to make grounded decisions while maintaining latency, governance, and explainability.

### Description

The retrieval strategy is intentionally lightweight at first and extensible over time. The baseline implementation retrieves structured QA rubric content and policy snippets from Azure Blob Storage based on audit metadata. Optional semantic retrieval with pgvector can be added when policy volume, audit variety, or example matching requires more flexible search. Retrieval output should be ranked, bounded, versioned, and cited in model outputs.

Auto QRA should not send an entire policy library to the model. Instead, it should resolve the active rubric and retrieve the minimum relevant context for the audit type, channel, region, tenant, and parameter set. Few-shot examples should be curated and approved. They should demonstrate boundary cases, such as pass versus partial, partial versus fail, not applicable conditions, and compliance-sensitive failures.

```mermaid
flowchart TD
    A["Audit metadata"] --> B["Resolve tenant, LOB, channel, region"]
    B --> C["Load active rubric manifest"]
    C --> D["Identify parameter policy refs"]
    D --> E{"Retrieval mode"}
    E -- "Manifest lookup" --> F["Fetch rubric and policy snippets from Azure Blob Storage"]
    E -- "Semantic optional" --> G["Search pgvector embeddings"]
    F --> H["Rank and deduplicate context"]
    G --> H
    H --> I["Select few-shot examples"]
    I --> J["Apply token budget"]
    J --> K["Return retrieval package with references"]```

### RAG/Retrieval Approach

The recommended release-one approach is manifest-based retrieval. A rubric manifest maps audit type and parameter IDs to approved policy snippets, examples, and scoring notes. Each snippet has a stable reference ID, version, effective date, owner, and source URI. The retrieval service reads the manifest, fetches the relevant snippets from Azure Blob Storage, and returns a bounded retrieval package.

The release-two approach can add pgvector. Policy snippets and few-shot examples are embedded and stored in PostgreSQL with pgvector. Retrieval can then combine metadata filters with vector similarity. For example, it can filter by tenant, channel, language, effective date, and parameter IDs, then rank semantically similar snippets based on the audit issue type or transcript summary. This hybrid approach keeps governance while improving context matching.

Azure Blob Storage remains the source of truth for approved documents, rubrics, examples, and prompt bundles. pgvector stores derived embeddings and searchable chunks. Each retrieved chunk must reference the source document version in Azure Blob Storage so model outputs can be traced to approved content.

### Business Justification

Retrieval improves quality by grounding the model in current enterprise policy rather than relying on general model knowledge. This is critical because QA standards vary by product, region, channel, customer segment, and time. A policy that was correct last quarter may be wrong after an operational change. Retrieval also helps smaller 3B or 7B models perform better by placing the relevant policy in context.

A lightweight retrieval design avoids unnecessary complexity at launch. Manifest-based retrieval is easier to govern and explain. pgvector can be introduced when evidence shows that static mappings are not enough.

### Technical Details

The retrieval package should include rubric summary, parameter definitions, policy snippets, example snippets, source IDs, document versions, effective dates, and confidence metadata. Retrieval should reject expired policy content unless explicitly requested for historical audits. Historical audits should use the policy and rubric versions effective at the time of the audited interaction.

Chunks should be concise and parameter-scoped. A target chunk size of 200 to 600 tokens is reasonable for policy snippets. Few-shot examples should be shorter than full transcripts and should focus on the decision boundary. Retrieval should deduplicate overlapping snippets and apply a maximum context budget before prompt construction.

If pgvector is used, embeddings should be generated through an approved internal embedding model or controlled service. Embedding refresh jobs should run when source documents change. The vector table should include source_uri, source_hash, chunk_id, parameter_ids, tenant_id, language, effective_start, effective_end, approval_status, and embedding_version.

### Best Practices

- Keep Azure Blob Storage as the governed source of truth for policy and rubric artifacts.
- Use metadata filters before vector similarity search.
- Version every retrieved document and include references in audit records.
- Bound retrieval output by token budget.
- Curate few-shot examples through QA governance, not ad hoc developer selection.
- Exclude draft or unapproved policy content from production retrieval.
- Use historical effective dates for historical audit reprocessing.
- Monitor retrieval misses and policy reference usage by parameter.

### Risks

Poor retrieval can be worse than no retrieval. If irrelevant snippets are included, the model may follow the wrong policy. If required snippets are missing, the model may guess or mark uncertainty. Vector search may retrieve semantically similar but policy-inapplicable content unless metadata filters are strict. Stale embeddings can point to outdated policy.

Few-shot examples can create hidden bias. If examples overrepresent certain failure types, the model may become too strict. If examples include PII or unapproved content, they can create privacy and governance risk.

### Recommendations

Begin with manifest-based retrieval for the first production release. Add retrieval telemetry: snippets retrieved, snippets cited, retrieval latency, missing references, token budget truncation, and parameter-level policy coverage. Use this telemetry to decide where pgvector adds value.

When pgvector is introduced, use hybrid retrieval with strict metadata filters and source version references. Build an approval workflow for policy chunks and few-shot examples. Include retrieval regression tests that verify expected snippets are returned for representative audit types.

## 29. Business Rules Engine

### Purpose

This section defines the deterministic business rules engine that governs final Auto QRA outcomes after the LLM produces recommendations. The purpose is to ensure contractual, compliance, scoring, escalation, and workflow requirements are enforced consistently.

### Description

The business rules engine is the deterministic control layer between model recommendation and final audit result. It applies rules that should not depend on probabilistic interpretation. Examples include mandatory fail conditions, compliance escalation, score caps, not-applicable restrictions, evidence requirements, audit eligibility, sampling requirements, human review routing, and finalization constraints.

The rules engine should be versioned and auditable. Every rule execution should record rule ID, version, input facts, output action, reason, and whether it changed the model recommendation. Rules should be configured in structured form where possible and reviewed through governance. The engine can be implemented with code-based rules for release one and evolve toward a decision table or rules DSL as business complexity grows.

### Business Rules Decision Tables

| Rule Area | Condition | Deterministic Action | Review Impact | Example Rule ID |
| --- | --- | --- | --- | --- |
| Mandatory compliance | Compliance parameter fails with cited evidence | Set compliance_flag true and require human review | Required review | BR-COMP-001 |
| Missing evidence | Required evidence absent for mandatory parameter | Cap parameter score at zero | Review if confidence below medium | BR-EVID-002 |
| Not applicable | Model returns not_applicable for non-eligible parameter | Replace with fail or partial per rubric | Required review | BR-NA-003 |
| Score cap | Critical process step failed | Cap overall score at configured maximum | Review if cap changes grade | BR-CAP-004 |
| PII masking | Masking service reports unresolved PII risk | Block LLM processing and route exception | Exception review | BR-PII-005 |
| Retrieval gap | Required policy reference not retrieved | Disable auto-finalization | Human review | BR-RET-006 |
| Low confidence | Aggregate confidence below threshold | Create review task | Required review | BR-CONF-007 |
| High-value audit | Account or interaction marked high impact | Require review sample even if high confidence | Sampled review | BR-RISK-008 |
| Duplicate source | Same source event already processed | Return existing result or reject duplicate | No review | BR-IDEM-009 |
| Language unsupported | Audit language outside approved model/rubric support | Route exception | Exception review | BR-LANG-010 |

| Finalization Decision | Required Conditions | Final Status |
| --- | --- | --- |
| Auto-finalize | High confidence, no compliance trigger, no unresolved exception, complete rubric, schema valid, retrieval sufficient | final_auto |
| Targeted review | Medium confidence, score cap applied, sampled high-impact audit, or moderate disagreement | pending_review |
| Mandatory review | Low confidence, compliance trigger, missing required evidence, unsupported not_applicable, or reviewer dispute | pending_review_required |
| Exception | PII risk, model unavailable after retry, invalid schema after retry, unsupported language, corrupt input | exception_open |

```mermaid
flowchart TD
    A["Model parameter results"] --> B["Normalize facts"]
    B --> C["Apply eligibility rules"]
    C --> D["Apply parameter rules"]
    D --> E["Apply compliance rules"]
    E --> F["Apply score caps"]
    F --> G["Apply retrieval and evidence rules"]
    G --> H["Apply workflow routing rules"]
    H --> I["Record rule trace"]
    I --> J["Governed result"]```

### Business Justification

The business rules engine protects the enterprise from inconsistent or noncompliant AI decisions. Some QA outcomes must follow policy exactly. For example, a mandatory verification failure may require a fail regardless of the model's overall positive assessment. A compliance trigger may require review even when confidence is high. Deterministic rules make these outcomes consistent and auditable.

Rules also help build business trust. Managers and QA leaders can see which rules changed a recommendation and why. This makes the system easier to calibrate and easier to defend during disputes.

### Technical Details

The rules engine should consume structured facts: audit metadata, model parameter results, evidence completeness, retrieval metadata, PII status, confidence inputs, historical flags, and tenant configuration. It should output governed parameter results, score adjustments, flags, review routing, and rule execution traces.

Rules should be executed in a defined order. Eligibility and blocking rules run first. Parameter normalization rules run second. Compliance and mandatory failure rules run third. Score caps and aggregate scoring rules run fourth. Workflow routing rules run last. This order prevents downstream scoring from acting on invalid or blocked inputs.

Rule definitions should include ID, name, description, owner, version, effective date, priority, condition, action, and severity. Rule execution traces should be persisted in PostgreSQL. If a rule changes a model recommendation, both before and after values should be stored.

### Best Practices

- Keep rules deterministic and side-effect free during evaluation.
- Version rules and store rule execution traces.
- Use decision tables for business review.
- Define rule priority and conflict resolution explicitly.
- Separate scoring rules from workflow routing rules.
- Test rules with boundary cases and historical disputes.
- Provide admin read-only visibility into active rules.
- Require governance approval for production rule changes.

### Risks

Rules can become overly complex if every exception is encoded as a special case. Conflicting rules can create unexpected outcomes. Business teams may request immediate rule changes without understanding scoring impact. If rule traces are incomplete, reviewers may see a final score but not understand why it differs from the model recommendation.

Another risk is duplicating rubric logic in both prompts and rules. The model should understand the rubric, while the rules engine should enforce deterministic constraints. When the same logic exists in two places, drift can occur.

### Recommendations

Start with a small, high-value rule set focused on compliance, eligibility, evidence, confidence routing, and score caps. Expand only when there is a clear business need. Maintain a rules catalog and require impact analysis for changes. Include rule regression tests in CI and staging.

Build a rule trace viewer for QA admins. It should show model recommendation, applied rules, score changes, final result, and review routing. This improves transparency and shortens dispute resolution.

## 30. Confidence Scoring

### Purpose

This section defines how Auto QRA calculates confidence for parameter-level and audit-level outcomes. The purpose is to decide which audits can be auto-finalized, which require human review, and which should be treated as exceptions or calibration candidates.

### Description

Confidence scoring combines multiple signals. It should not rely only on the LLM's self-reported uncertainty. The confidence model should include schema validity, model response quality, evidence coverage, retrieval quality, rule impact, parameter uncertainty, transcript completeness, PII masking quality, historical agreement, and disagreement between model output and deterministic rules.

Confidence is calculated at two levels. Parameter confidence evaluates whether a specific QA parameter result is trustworthy. Audit confidence aggregates parameter confidence, weighting compliance-sensitive and high-value parameters more heavily. The confidence service produces a score from 0 to 1, a threshold band, review routing recommendation, and explanatory factors.

### Confidence Score Formula and Thresholds

Recommended audit-level formula:

```text
audit_confidence =
  (0.25 * model_output_quality) +
  (0.20 * evidence_coverage) +
  (0.15 * retrieval_quality) +
  (0.15 * parameter_consistency) +
  (0.10 * rule_alignment) +
  (0.10 * data_completeness) +
  (0.05 * historical_calibration)

blocking_adjustments:
- subtract 0.20 if required policy context is missing
- subtract 0.15 if any mandatory parameter has high uncertainty
- subtract 0.10 if prompt truncation removed relevant evidence
- set max confidence to 0.60 if schema required repair
- set max confidence to 0.50 if unresolved PII masking warning exists
- set max confidence to 0.40 if model/rule disagreement affects final grade
```

| Band | Score Range | Automation Decision | Human Review Requirement |
| --- | --- | --- | --- |
| High | 0.85 to 1.00 | Eligible for auto-finalization | No review unless sampled or compliance-triggered |
| Medium | 0.70 to 0.84 | Governed result can be prepared | Targeted review or sampling |
| Low | 0.50 to 0.69 | Not eligible for auto-finalization | Human review required |
| Critical | 0.00 to 0.49 | Unreliable automation result | Exception or mandatory review |

```mermaid
flowchart TD
    A["Validated model response"] --> B["Calculate model output quality"]
    A --> C["Calculate evidence coverage"]
    A --> D["Calculate retrieval quality"]
    A --> E["Calculate parameter consistency"]
    A --> F["Calculate rule alignment"]
    A --> G["Calculate data completeness"]
    A --> H["Apply historical calibration"]
    B --> I["Weighted confidence formula"]
    C --> I
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I
    I --> J["Apply blocking adjustments"]
    J --> K{"Confidence band"}
    K -- ">= 0.85" --> L["Auto-finalize eligible"]
    K -- "0.70-0.84" --> M["Targeted review/sample"]
    K -- "0.50-0.69" --> N["Human review required"]
    K -- "< 0.50" --> O["Exception or mandatory review"]```

### Business Justification

Confidence scoring enables risk-based automation. The business does not need every audit to be manually reviewed if the system can identify reliable cases. At the same time, the business should not auto-finalize uncertain or high-risk cases merely to increase automation rates. Confidence bands create a transparent operating model for balancing efficiency and quality.

Confidence metrics also support continuous improvement. If confidence is low because retrieval quality is weak, the team can improve retrieval. If confidence is low because evidence is incomplete, upstream integrations can be improved. If confidence is low because model/rule disagreement is frequent, the prompt, rubric, or rules may need calibration.

### Technical Details

Model output quality includes schema validity, completeness of all 30 parameters, valid score ranges, rationale quality, and absence of unsupported fields. Evidence coverage measures whether required parameters include cited evidence, whether evidence spans are present in the masked transcript, and whether fail or partial ratings are supported. Retrieval quality measures required policy availability, snippet relevance, citation coverage, and token truncation impact.

Parameter consistency measures contradictions across parameter results. For example, a transcript cannot both fully satisfy and completely fail the same required verification behavior without explanation. Rule alignment measures whether deterministic rules substantially changed the model recommendation. Data completeness measures transcript availability, metadata completeness, channel support, language support, and PII masking status. Historical calibration compares model predictions to known reviewer agreement for similar audits, if available.

The confidence service should return detailed factors, not only a number. Example fields include score, band, auto_finalization_eligible, review_required, top_negative_factors, parameter_confidence, threshold_version, and calibration_version.

### Best Practices

- Use confidence as a routing tool, not a claim of objective truth.
- Combine model, retrieval, evidence, rule, and data quality signals.
- Cap confidence when critical control failures occur.
- Store confidence factors for every audit.
- Calibrate thresholds using human-reviewed audit sets.
- Track override rates by confidence band.
- Review confidence drift after model, prompt, rubric, or rule changes.
- Keep launch thresholds conservative and adjust with evidence.

### Risks

The confidence score can create false reassurance if poorly calibrated. A high score does not guarantee correctness. If the formula is too complex, stakeholders may not understand routing decisions. If thresholds are too aggressive, automation may finalize bad audits. If thresholds are too conservative, the business may not realize efficiency benefits.

Historical calibration can encode past human inconsistency. If prior reviews were biased or poorly calibrated, using them as a confidence factor may reinforce errors. Model self-reported uncertainty should be treated as one weak signal among stronger objective checks.

### Recommendations

Launch with conservative thresholds and mandatory review for compliance-sensitive cases. Use a calibration period where high-confidence auto decisions are shadow-reviewed to measure actual agreement. Adjust formula weights only through governance and with measured impact. Report confidence distribution, override rate, false auto-finalization rate, and parameter-level disagreement monthly.

Design the UI to explain confidence clearly. Reviewers should see why an audit was routed: missing policy, weak evidence, schema repair, model/rule disagreement, or low parameter confidence. This improves trust and gives teams actionable improvement signals.

## 31. Human Override Workflow

### Purpose

This section defines how humans review, approve, edit, reject, override, and audit Auto QRA recommendations. The purpose is to preserve accountable human judgment where automation is uncertain, high impact, disputed, or compliance-sensitive.

### Description

The human override workflow begins when confidence scoring, business rules, sampling policy, or exception handling routes an audit to review. A QA analyst or authorized reviewer sees the masked audit evidence, model recommendation, parameter-level scores, evidence citations, rationale, rule trace, confidence factors, and prior reviewer notes if available. The reviewer can approve the recommendation, edit parameter results, change final score within policy, mark the audit not applicable, request more information, or escalate.

All overrides must be reason-coded and auditable. The system records reviewer identity from SSO, role, timestamp, original model output, governed pre-review result, final reviewer decision, reason code, free-text explanation, and any attachments. Overrides can be sampled for calibration and used to improve prompts, retrieval, rules, or training data only after privacy and governance review.

```mermaid
sequenceDiagram
    autonumber
    participant Conf as Confidence Service
    participant Review as Review Service
    participant Queue as Review Queue
    participant Analyst as QA Analyst
    participant Rules as Rules Engine
    participant DB as PostgreSQL
    participant Notify as Notification Service

    Conf->>Review: Create review_required task
    Review->>Queue: Place task by priority and skill
    Queue->>Analyst: Assign next task
    Analyst->>Review: Open audit with masked evidence
    Review->>DB: Load model output, rules trace, confidence factors
    Analyst->>Review: Approve, edit, reject, escalate, or request info
    Review->>Rules: Validate override against policy
    Rules-->>Review: Override allowed or blocked
    Review->>DB: Persist final decision and audit trail
    Review->>Notify: Notify manager or downstream system if required```

```mermaid
stateDiagram-v2
    [*] --> PendingReview
    PendingReview --> InReview: reviewer_claims
    InReview --> Approved: approve_recommendation
    InReview --> Edited: edit_scores
    InReview --> Rejected: reject_recommendation
    InReview --> Escalated: escalate_case
    InReview --> InfoRequested: request_more_info
    InfoRequested --> PendingReview: info_received
    Escalated --> Approved: senior_approval
    Escalated --> Edited: senior_edit
    Approved --> Finalized
    Edited --> Finalized
    Rejected --> Finalized
    Finalized --> [*]```

### Business Justification

Human override is essential for trust and regulatory defensibility. Auto QRA should reduce manual workload, not remove accountability. Reviewers provide judgment in ambiguous cases, protect against AI mistakes, and create feedback for continuous improvement. A structured override workflow also helps the organization manage disputes and demonstrate that automation is governed.

Human review capacity can be focused where it matters most. High-confidence, low-risk audits can be finalized automatically or sampled. Low-confidence, compliance-triggered, high-impact, or disputed audits receive human attention. This improves efficiency while maintaining quality.

### Technical Details

Review tasks should include audit ID, priority, required reviewer role, due time, reason for review, confidence band, exception flags, and assignment status. Task priority can be calculated from compliance flags, customer impact, SLA age, confidence score, and source priority. RBAC should restrict who can view raw or masked artifacts, who can override scores, and who can approve escalated decisions.

The review UI should show parameter-level model output and final governed output side by side. Reviewers should see evidence citations and be able to jump to masked transcript spans. If raw PII access is necessary for a limited role, it should be separately permissioned, logged, and avoided by default. Override actions should be validated against rules. For example, a reviewer may not remove a mandatory compliance flag without senior approval and a required reason code.

Override records should be immutable. Corrections should create a new version rather than modifying history. Downstream reports should read the latest finalized decision while audit history remains available to authorized users.

### Best Practices

- Require reason codes for every override.
- Show model recommendation, rule changes, and confidence factors transparently.
- Enforce RBAC for review, senior approval, and raw PII access.
- Use assignment queues based on skill, tenant, language, and priority.
- Prevent silent edits by preserving before and after values.
- Use reviewer overrides for calibration only through approved governance.
- Track reviewer agreement and override rates by parameter.
- Provide escalation paths for compliance-sensitive changes.

### Risks

Reviewers may rubber-stamp AI recommendations if the UI encourages fast approval without evidence review. Conversely, reviewers may distrust automation and override too often, reducing business value. Inconsistent human overrides can create calibration noise. If override reason codes are too vague, improvement teams cannot learn from them.

There is also privacy risk if review screens expose raw PII unnecessarily. Workflow backlogs can occur if too many audits route to review or if staffing does not match peak ingestion.

### Recommendations

Design the review experience to encourage evidence-based decisions. Require reviewers to inspect cited evidence for certain actions, especially compliance changes and score increases. Monitor review queue age, override rate, reviewer agreement, and reason code distribution. Use these metrics to tune confidence thresholds and identify prompt or rubric weaknesses.

Implement a calibration program. Sample auto-finalized audits, medium-confidence audits, and reviewer overrides. Review findings monthly with QA leadership, compliance, and AI engineering. Feed approved lessons into prompt examples, retrieval content, rules, and training benchmarks.

## 32. Exception Handling

### Purpose

This section defines how Auto QRA detects, classifies, routes, retries, resolves, and reports exceptions. The purpose is to protect audit integrity, prevent silent failures, meet operational service levels, and give support teams clear remediation paths.

### Description

Exception handling covers failures that prevent reliable automated scoring or finalization. Exceptions may occur during ingestion, validation, PII masking, queueing, retrieval, prompt building, vLLM inference, schema parsing, rules evaluation, confidence scoring, persistence, reporting, or human review. Each exception should have a taxonomy, severity, owner, retry policy, user-visible status, and remediation path.

Auto QRA should fail closed for privacy and compliance-sensitive conditions. For example, unresolved PII masking risk should block LLM processing. Missing required policy context should block auto-finalization. Invalid model output after retry should route to exception review. The system should distinguish transient infrastructure failures from business-data exceptions.

### Exception Taxonomy Table

| Category | Example | Severity | Retry Policy | Owner | User Status |
| --- | --- | --- | --- | --- | --- |
| Ingestion validation | Missing audit type or corrupt payload | Medium | No retry until corrected | Integration team | rejected_input |
| PII masking | Unresolved account number or name detected | High | No LLM retry; manual privacy review | Privacy/QA ops | privacy_exception |
| Queue processing | Redis timeout or worker crash | Medium | Retry with backoff | Platform team | processing_delayed |
| Retrieval | Required rubric or policy missing | High | Retry after config refresh, then review | QA governance | policy_exception |
| Prompt build | Token budget exceeded with no safe truncation | Medium | Retry with summarization if approved | AI engineering | prompt_exception |
| vLLM inference | GPU unavailable or request timeout | Medium/High | Retry limited; failover if available | Platform/AI ops | ai_processing_delayed |
| Model response | Invalid JSON or missing parameters | Medium | One repair retry, then exception | AI engineering | model_output_exception |
| Rules engine | Rule conflict or missing rule version | High | No auto-finalization | QA governance | rule_exception |
| Confidence | Confidence formula version unavailable | High | No auto-finalization | AI engineering | confidence_exception |
| Persistence | PostgreSQL write failure | High | Retry idempotently | Platform team | persistence_delayed |
| Reporting | Report export failed | Low/Medium | Retry scheduled job | Reporting team | report_delayed |
| Review workflow | No eligible reviewer or SLA breach | Medium | Escalate queue | QA operations | review_delayed |

```mermaid
stateDiagram-v2
    [*] --> Processing
    Processing --> Completed: success
    Processing --> RetryableException: transient_failure
    Processing --> NonRetryableException: validation_or_policy_failure
    Processing --> PrivacyException: pii_risk
    Processing --> ModelException: invalid_model_output
    RetryableException --> Processing: retry_backoff
    RetryableException --> ExceptionOpen: retries_exhausted
    NonRetryableException --> ExceptionOpen: route_to_owner
    PrivacyException --> ExceptionOpen: block_llm
    ModelException --> Processing: repair_retry
    ModelException --> ExceptionOpen: repair_failed
    ExceptionOpen --> UnderReview: owner_claims
    UnderReview --> Resolved: fixed_or_accepted
    UnderReview --> Cancelled: invalid_audit
    Resolved --> Processing: resume_if_applicable
    Resolved --> Completed: manually_finalized
    Cancelled --> [*]
    Completed --> [*]```

```mermaid
flowchart TD
    A["Exception detected"] --> B["Classify category and severity"]
    B --> C{"Privacy or compliance risk?"}
    C -- "Yes" --> D["Block auto-processing"]
    C -- "No" --> E{"Transient infrastructure issue?"}
    E -- "Yes" --> F["Retry with exponential backoff"]
    F --> G{"Retry succeeded?"}
    G -- "Yes" --> H["Resume processing"]
    G -- "No" --> I["Open exception case"]
    E -- "No" --> I
    D --> I
    I --> J["Assign owner and SLA"]
    J --> K["Record audit event"]
    K --> L["Resolve, cancel, or manually finalize"]```

### Business Justification

Exception handling protects the credibility of Auto QRA. Users will trust automation only if failures are visible, explainable, and recoverable. Silent scoring failures, hidden privacy issues, or untracked retries can damage confidence and create compliance exposure. A clear exception taxonomy allows operations teams to manage workload and service levels.

Exception metrics also guide investment. Frequent retrieval exceptions may indicate governance process gaps. Frequent vLLM timeouts may indicate GPU undercapacity. Frequent schema failures may indicate prompt or model issues. Frequent PII exceptions may indicate masking rules need improvement.

### Technical Details

Every exception should be represented as a structured record with exception ID, audit ID, category, severity, message, root cause code, retryable flag, retry count, next retry time, owner group, SLA due time, status, and resolution. Exception records should link to logs, rule traces, model run records, and queue attempts through correlation ID.

Retry policies should be category-specific. Redis timeouts, vLLM transport errors, and PostgreSQL transient failures can be retried with exponential backoff and jitter. Invalid input, unsupported language, unresolved PII, missing required rubric, and rule conflicts should not be retried blindly. Model response repair should be limited, typically one retry with a stricter repair instruction, because repeated retries can consume latency and GPU capacity without solving the issue.

Dead-letter handling should preserve enough context for diagnosis without storing raw PII in unsafe locations. Dead-letter queues should be monitored with alerts. Exception dashboards should show open exceptions by category, age, owner, severity, and affected audit volume.

### Best Practices

- Fail closed for privacy, compliance, and governance exceptions.
- Use category-specific retry policies.
- Add jitter to retries to avoid retry storms.
- Preserve idempotency across retries.
- Route unrecoverable exceptions to named owner groups.
- Record user-visible statuses that are understandable but do not leak sensitive details.
- Alert on exception rates, not only individual failures.
- Include exception scenarios in integration and disaster recovery testing.

### Risks

Poor exception handling can create duplicate audits, lost audits, delayed reports, or unreviewed compliance cases. Aggressive retries can overload vLLM, Redis, or PostgreSQL. Weak classification can route issues to the wrong team. User-facing error messages may expose sensitive internal details if not designed carefully.

Another risk is exception backlog normalization. If teams become accustomed to large open backlogs, exceptions stop functioning as quality signals. SLA breaches in review or exception queues can undermine the 60-second processing target for normal cases and create operational debt.

### Recommendations

Implement exception handling as a first-class workflow rather than log-only behavior. Define exception owners and SLAs before production. Build dashboards for exception volume, retry success rate, mean time to resolution, and top root causes. Include exception cases in release smoke tests, especially PII block, missing policy, invalid model JSON, vLLM timeout, Redis retry, and PostgreSQL idempotent write.

Use exception trends as product feedback. A mature Auto QRA program should reduce exceptions over time by improving integrations, masking, retrieval, prompt design, model serving, rules governance, and reviewer staffing. Treat unresolved privacy and compliance exceptions as launch blockers for affected audit domains.


---

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


---

# Auto Quality Review Automation (Auto QRA) Product & Technical Design Package

**Document:** 05 - DevOps, APIs, and Governance
**Version:** 1.0
**Date:** July 2026
**Scope:** Sections 47-65
**Platform facts:** Self-hosted vLLM on Azure, 3B/7B quantized models, Docker to Kubernetes, PostgreSQL, Redis, Superset, Azure Blob Storage, Microsoft Entra ID SSO, RBAC, PII controls, human override, 60,000 audits per month, 30 QA parameters, target latency under 60 seconds, 99.9% availability, greater than 90% human agreement, and less than 5% hallucination rate.

---

## 47. Production Rollout

### Purpose

The purpose of the production rollout section is to define how Auto QRA moves from a controlled internal validation environment into broad operational use without interrupting quality operations, exposing sensitive customer data, or eroding trust in audit outcomes. The rollout strategy converts the product promise into a governed adoption path that gives operations, quality leaders, compliance owners, engineers, and frontline supervisors clear decision gates. It also ensures that model behavior, prompt behavior, latency, availability, dashboard accuracy, and human override workflows are all proven before general availability.

### Description

Auto QRA will be rolled out in three phases: Pilot, Limited Availability, and General Availability. Each phase expands the user population, audit volume, conversation sources, and automation authority. The Pilot phase validates the technical path with a small set of queues and a high level of human review. Limited Availability expands to multiple business units and introduces operational dashboards, supervisor calibration, and role-based workflows. General Availability makes the platform the standard review assistance system for eligible conversations while preserving human override as the final control for disputed outcomes.

The rollout must treat the AI score as an operational recommendation during early phases, not as an irreversible judgment. Human QA reviewers remain accountable for final decisions until agreement, hallucination, latency, security, and reporting gates are consistently met. Rollout decisions are made by a cross-functional readiness council composed of Product, QA Operations, Engineering, Security, Legal, Data Governance, Support, and SRE.

### Business Justification

The business value of Auto QRA depends on increasing audit coverage and consistency without sacrificing explainability. A phased rollout protects the business from broad propagation of incorrect scores, prompt instability, reporting misalignment, or privacy incidents. It allows leaders to quantify benefit in stages: faster review cycles, better coverage across the 60,000 monthly audit workload, improved coaching insights, more consistent application of 30 QA parameters, and lower manual effort per reviewed conversation.

The staged approach also supports change management. QA teams need time to compare human and AI judgments, managers need time to learn new dashboards, and compliance teams need evidence that personally identifiable information and regulated data are protected. By gating expansion on measured outcomes, the organization can show that automation is being introduced responsibly.

### Technical Details

| Phase | Scope | Volume | Human Review Mode | Entry Criteria | Exit Gates |
|---|---:|---:|---|---|---|
| Pilot | 1-2 queues, selected reviewers, non-regulatory reporting | Up to 5% of monthly audits | 100% human verification of AI output | Security design approved, model hosted in non-production-like controlled environment, golden set ready | p95 latency under 60s, availability over 99.5%, agreement over 85%, hallucination under 8%, zero critical privacy defects |
| Limited Availability | 3-5 business units, supervisor dashboard, override workflow | 20%-40% of monthly audits | Human verification for sampled and disputed audits | Pilot exit gates met for two consecutive weeks | p95 latency under 60s, availability over 99.9%, agreement over 90%, hallucination under 5%, dashboard reconciliation within 1% |
| General Availability | Eligible production queues and standard reporting | Up to 60,000 audits per month | Human override, exception sampling, calibration reviews | LA exit gates met for four consecutive weeks | Sustained SLO compliance, documented operating model, DR tested, compliance sign-off |

Rollout traffic will be controlled using feature flags at tenant, queue, and role levels. Kubernetes deployment strategies will use canary releases for API and worker services, with model-serving capacity scaled separately from application services. Redis will support queueing and short-lived state. PostgreSQL will remain the system of record for audits, scores, overrides, users, roles, and version metadata. Azure Blob Storage will store raw conversation artifacts, redacted evidence bundles, generated explanations, and evaluation snapshots according to retention rules.

### Best Practices

Rollout should begin with audit categories where the business rules are stable, the risk of severe customer harm is low, and sufficient historical human-scored data exists. Every phase should include calibration sessions where QA reviewers compare AI recommendations with human judgments and record the reason for disagreement. Dashboards should separate AI-generated scores, human-confirmed scores, and overridden scores so that leaders do not misinterpret experimental output as finalized operating performance.

Operational readiness should include playbooks for model degradation, queue backlog, failed inference, malformed conversation payloads, SSO failure, and dashboard reconciliation issues. Each phase should use a written go/no-go decision with measurable evidence and named accountable owners. The team should avoid silent expansion of automation scope; each new queue, language, region, or product line should be explicitly onboarded.

### Risks

The main rollout risks are premature trust, hidden data quality issues, uneven reviewer adoption, score drift, and compliance gaps. If managers treat AI scores as final before agreement is proven, employees may receive unfair coaching. If conversation data is inconsistent, prompts may produce low-quality reasoning even when the model is healthy. If rollout metrics are averaged across queues, serious issues in a specific queue can be masked by better performance elsewhere.

There is also a capacity risk. Self-hosted vLLM serving quantized 3B and 7B models on Azure can meet latency targets only if concurrency, token budgets, batching, and GPU capacity are managed. A sudden move from pilot traffic to full production traffic can exhaust inference capacity, increase queue backlog, and cause audit completion delays.

### Recommendations

Use a formal rollout gate document for each phase, signed by Product, QA Operations, SRE, Security, and Compliance. Start with shadow-mode scoring during the Pilot, where AI produces scores but human QA reviewers remain the official source. Promote to decision-support mode only after agreement and hallucination thresholds are met. Maintain a rollback plan that can disable AI scoring by tenant or queue without disabling manual audit workflows. For GA, require weekly operational reviews for the first eight weeks and monthly reviews afterward.

---

## 48. CI/CD Pipeline

### Purpose

The purpose of the CI/CD pipeline is to provide a repeatable, auditable, and secure path from source code and prompt changes to production deployment. Auto QRA includes application code, database migrations, infrastructure manifests, prompts, model metadata, evaluation datasets, dashboards, and API contracts. The pipeline must validate all of these assets before they affect production users or audit outcomes.

### Description

The CI/CD process will be implemented as a gated pipeline that builds Docker images, runs automated tests, performs security and dependency scans, evaluates prompts and models against golden datasets, packages Kubernetes manifests, applies database migrations, and deploys progressively to development, staging, canary, and production environments. The pipeline should treat prompt and model changes as first-class release artifacts, not as informal configuration changes.

The pipeline will produce immutable build artifacts: container images, migration bundles, OpenAPI specifications, prompt manifests, model manifests, evaluation reports, and SBOMs. Every production deployment must be traceable to a Git commit, prompt version, model version, dataset version, and approval record.

### Business Justification

Quality review automation directly influences coaching, performance management, compliance monitoring, and customer experience analysis. A weak delivery process can create inconsistent scoring, introduce security vulnerabilities, or break audit reporting. A mature pipeline lowers release risk, speeds response to defects, and creates evidence for SOC2-ready change management.

The business also benefits from faster iteration. Prompt improvements, model upgrades, and dashboard enhancements can be delivered more often when automated checks prevent regressions. CI/CD also supports controlled experimentation, allowing the organization to compare prompt and model candidates before promoting them.

### Technical Details

```mermaid
flowchart LR
    A[Developer Commit] --> B[Static Checks]
    B --> C[Build Docker Images]
    C --> D[Unit and Contract Tests]
    D --> E[Database Migration Test]
    E --> F[Security Scan]
    F --> G[SBOM and Image Signing]
    G --> H[AI Evaluation Suite]
    H --> I[Package Kubernetes Manifests]
    I --> J[Deploy to Dev]
    J --> K[Integration and Smoke Tests]
    K --> L[Deploy to Staging]
    L --> M[Load and Failover Tests]
    M --> N[Approval Gate]
    N --> O[Canary Deploy]
    O --> P[Production Progressive Rollout]
    P --> Q[Post Deploy Monitoring]```

Core pipeline stages:

| Stage | Required Checks | Output | Blocking Criteria |
|---|---|---|---|
| Source validation | formatting, linting, dependency lock validation | clean branch report | any syntax or policy failure |
| Build | Docker image build for API, worker, scheduler, evaluator | image digest | image build failure |
| Test | unit, integration, API contract, migration dry run | test report | failed required tests |
| Security | SAST, dependency scan, container scan, IaC scan, secret scan | security report and SBOM | critical vulnerabilities or secrets |
| AI evaluation | golden set, agreement test, hallucination probes, regression diff | evaluation report | failure against promotion threshold |
| Deploy | Helm/Kustomize package, manifest validation, rollout | deployment record | readiness probe failure |
| Verify | smoke test, health check, synthetic audit, dashboard query | release verification | SLO or smoke failure |

### Best Practices

Separate infrastructure deployment, database migration, and model deployment into independently observable steps while keeping them linked by release metadata. Use immutable container image digests rather than mutable tags for production. Require peer review for application changes, prompt changes, and schema migrations. Run migration tests against anonymized production-like schemas. Store AI evaluation outputs in Azure Blob Storage with references in PostgreSQL so each release can be audited later.

Use progressive deployment for the API and workers. For vLLM model servers, prefer blue-green model pool deployment because model warmup and GPU memory allocation can be expensive and slow. Use readiness probes that verify the loaded model version, not only the HTTP process status. Block production release if the API can reach a healthy model pool but that pool is serving an unapproved model version.

### Risks

Pipeline risk comes from incomplete test coverage, excessive manual approvals, and treating AI assets as configuration outside the release process. If prompt changes bypass CI/CD, scoring behavior can shift without traceability. If database migrations are not backward compatible with workers still processing old jobs, audits may fail mid-rollout. If image scans are advisory only, vulnerable dependencies may reach production.

Another risk is false confidence from narrow AI evaluation. A golden set that is too small, too clean, or not representative of active queues may pass while production accuracy declines. Performance tests must include realistic conversation length, concurrent audit submissions, and Redis queue pressure.

### Recommendations

Implement branch protection that requires code tests, OpenAPI diff checks, migration checks, security scans, and AI evaluation for any change that affects scoring. Create a release manifest that captures image digest, Git SHA, prompt version, model version, dataset version, migration ID, and approvers. Use automatic rollback for failed readiness and smoke tests. Use manual approval only where judgment is required: promotion to production, model changes, high-risk prompt changes, and breaking API or schema changes.

---

## 49. DevOps Strategy

### Purpose

The DevOps strategy defines how Auto QRA will be built, deployed, monitored, scaled, recovered, and improved as a production platform. It aligns engineering practices with the operational needs of a quality automation system that must process 60,000 audits per month while meeting strict latency, availability, security, and accuracy targets.

### Description

Auto QRA will run on Azure using containerized services deployed to Kubernetes. Application components include REST API services, audit orchestration workers, prompt rendering services, evaluation services, dashboard extract jobs, and administrative services. AI inference will run through self-hosted vLLM serving quantized 3B and 7B models. PostgreSQL will provide transactional persistence. Redis will handle queues, idempotency windows, short-lived locks, and transient workflow state. Azure Blob Storage will hold conversation payloads, redacted artifacts, generated explanations, evaluation files, and long-term report exports. Superset will provide operational and product dashboards.

The DevOps operating model should be product-aligned rather than infrastructure-only. The team must own SLOs for audit creation, scoring completion, report availability, override workflow reliability, inference health, and evaluation quality. Production behavior will be observed through metrics, traces, logs, audit logs, dashboard reconciliation, and business KPIs.

### Business Justification

DevOps maturity is essential because Auto QRA sits at the intersection of automation, people operations, compliance, and customer interaction data. An outage delays QA cycles and can affect coaching or compliance commitments. Poor observability can conceal model degradation. Weak deployment discipline can cause inconsistent scoring. A clear DevOps strategy lowers operational risk and improves confidence in the platform.

The strategy also supports cost management. Self-hosted vLLM can be cost-effective versus external API calls, but only if GPU utilization, batching, autoscaling, and token budgets are actively managed. Kubernetes and Azure provide the control plane needed to balance availability, latency, and spend.

### Technical Details

Recommended service architecture:

| Service | Responsibility | Scaling Signal | Data Stores |
|---|---|---|---|
| API service | REST endpoints, SSO context, RBAC, validation | request rate, p95 latency | PostgreSQL, Redis |
| Audit worker | scoring orchestration, retries, prompt execution | queue depth, job age | PostgreSQL, Redis, Azure Blob Storage, vLLM |
| Evaluation worker | golden set and regression evals | evaluation queue depth | PostgreSQL, Azure Blob Storage, vLLM |
| Model gateway | routing to vLLM pools, token limits, timeout policy | inference latency, GPU utilization | Redis, vLLM |
| Admin service | prompt/model version promotion, RBAC admin | admin request rate | PostgreSQL |
| Reporting extractor | aggregates for Superset datasets | schedule duration | PostgreSQL, Azure Blob Storage |

Kubernetes namespaces should separate development, staging, and production. Production should use dedicated node pools for API workloads, worker workloads, and GPU inference workloads. Workload identity should be used for Azure Blob Storage access. Secrets should be managed through Azure Key Vault or an approved secrets operator. Network policies should restrict lateral movement between services.

### Best Practices

Design for idempotency at API and worker boundaries. Every `POST /audits` request should support an idempotency key to prevent duplicate audit creation during retries. Workers should persist intermediate states so failed inference calls can be retried without losing traceability. Use structured logs with correlation IDs across API, workers, model gateway, and dashboard extract jobs.

For observability, establish golden signals for each service: latency, traffic, errors, saturation, and data quality. For AI-specific operations, include model load state, prompt version distribution, token consumption, agreement trends, hallucination probe failure rate, and override reason distribution. Use on-call rotations with clear escalation paths for platform, data, model, security, and reporting incidents.

### Risks

Operational risks include GPU capacity exhaustion, Redis queue accumulation, PostgreSQL lock contention, dashboard extract lag, SSO outage, Azure Blob Storage permission misconfiguration, and vLLM model crash loops. AI-specific risks include drift, increased hallucination, prompt regression, model version mismatch, and non-deterministic scoring changes caused by sampling configuration changes.

There is also a cultural risk: if AI quality is treated as separate from production operations, incidents may be routed too late or to the wrong owner. Model degradation should be handled with the same urgency and discipline as API degradation when it affects business outcomes.

### Recommendations

Adopt an SRE-style operating model with product-aware SLOs. Define runbooks for audit backlog, inference timeout, scoring disagreement spike, hallucination threshold breach, data ingestion failure, dashboard lag, and authorization failure. Use capacity planning based on expected audit volume, average conversation length, prompt token count, and model throughput. Review cost and performance weekly during rollout and monthly after GA.

---

## 50. Release Management

### Purpose

Release management governs how changes to Auto QRA are planned, approved, communicated, deployed, monitored, and, when needed, rolled back. Because Auto QRA produces audit scores and recommendations, release management must control not only application code but also prompts, model versions, evaluation data, QA parameter definitions, dashboard definitions, and database schemas.

### Description

Releases will follow a regular cadence with emergency paths for critical defects. Standard releases may include API improvements, worker changes, dashboard updates, prompt adjustments, model routing changes, and schema migrations. High-risk releases include changes that alter scoring logic, change QA parameter definitions, introduce a new model, modify PII handling, or affect role permissions.

Each release will have a release owner, change summary, risk classification, test evidence, rollback plan, monitoring plan, and stakeholder communication. Release notes must distinguish between user-facing product changes, scoring behavior changes, administrative changes, security changes, and operational changes.

### Business Justification

Release management protects the credibility of QA outcomes. A scoring change without explanation can create confusion among managers and agents. A dashboard metric change without communication can break operational reviews. A schema change without coordination can delay audits. Controlled release management helps the business adopt improvements while preserving trust and accountability.

Release records also support auditability. For SOC2-ready controls, the organization must show that changes are reviewed, tested, approved, and traceable. For AI governance, the organization must show when a prompt or model changed, why it changed, and what evaluation evidence supported promotion.

### Technical Details

Release types:

| Type | Examples | Approval | Deployment Window | Rollback |
|---|---|---|---|---|
| Standard application | API validation, worker retry logic, dashboard filters | Engineering and Product | weekly | previous image digest |
| Prompt release | wording, rubric clarification, JSON schema instructions | Product, QA Ops, AI owner | weekly or biweekly | prior prompt version |
| Model release | new quantized model, new serving configuration | AI owner, SRE, Security, Product | scheduled | prior model pool |
| Schema release | table/index migration, new column | Engineering and DBA | scheduled | forward fix or reversible migration |
| Emergency fix | security patch, outage fix, critical data defect | Incident commander | immediate | incident-specific |

Release artifacts must include Git SHA, image digest, OpenAPI version, migration ID, prompt version, model version, evaluator version, dataset version, and approval ticket. A release calendar should avoid peak business reporting periods unless an urgent fix is required.

### Best Practices

Use semantic versioning for services and independent semantic-like versioning for prompts and model manifests. Keep backward compatibility for API clients and active workers during rolling deploys. Deploy database additive changes before application changes that depend on them. Remove deprecated fields only after client adoption evidence is available.

For prompt and model releases, require offline evaluation and limited online observation before broad promotion. Record expected metric movement, such as improved agreement for empathy scoring or reduced hallucination for policy citations. Update user-facing release notes when scoring interpretation changes, even if the API contract does not change.

### Risks

The greatest release risk is behavioral opacity. A technically successful release may still be harmful if it changes score distribution unexpectedly. Other risks include failed migrations, incompatible worker versions, broken dashboard datasets, accidental exposure of admin functions, model cold-start latency, and incomplete rollback for prompt/model changes.

Rollback can be complicated when a release writes new data. For example, if a prompt version changes the shape of generated evidence, dashboards and review screens must still render older outputs. Release management must therefore account for data compatibility, not only service uptime.

### Recommendations

Create a release readiness checklist specific to Auto QRA. Require release notes for every production deployment and a score distribution comparison for scoring changes. Maintain separate rollback levers for application version, prompt version, model version, and traffic routing. After each high-risk release, run a post-release review covering SLOs, agreement, hallucination probes, override volume, and support tickets.

---

## 51. Testing Strategy

### Purpose

The testing strategy defines how Auto QRA will verify functional correctness, reliability, security, data integrity, AI quality, and user workflow integrity before changes reach production. It must cover traditional software testing and AI-specific evaluation because the platform combines deterministic services with probabilistic model behavior.

### Description

Testing will use a layered pyramid model. Unit tests validate small functions and deterministic logic. Integration tests validate service-to-service flows, database behavior, queue behavior, and storage interactions. Contract tests validate REST API compatibility. End-to-end tests validate complete audit workflows from conversation ingestion to score generation, override, and reporting. Performance and resilience tests validate service behavior under production-like volume. AI evaluation tests validate scoring agreement, hallucination risk, rubric adherence, prompt regressions, and model regressions.

```mermaid
flowchart TD
    A[Manual Exploratory and Calibration Testing] --> B[End-to-End Workflow Tests]
    B --> C[Integration and Contract Tests]
    C --> D[Unit Tests]
    E[AI Evaluation Layer] --> B
    E --> C
    E --> D```

The AI evaluation layer is shown alongside the pyramid because it applies to multiple levels. A prompt renderer may be unit tested, while a full golden-set evaluation is closer to an integration or system test.

### Business Justification

Testing protects operational trust. Auto QRA must produce timely and explainable scores for 30 QA parameters, support human override, and meet accuracy thresholds. Defects can lead to incorrect coaching, compliance misses, wasted reviewer time, and reduced adoption. AI-specific tests are required because conventional unit tests cannot prove whether the system agrees with human QA reviewers or avoids unsupported claims.

Strong testing also reduces release cycle time. When teams can trust automated tests and evaluation gates, they can ship improvements without prolonged manual rechecking of every workflow.

### Technical Details

| Test Level | Scope | Examples | Frequency | Owner |
|---|---|---|---|---|
| Unit | deterministic functions | scoring aggregation, RBAC predicates, prompt variable validation | every commit | Engineering |
| Integration | services and data stores | audit worker with PostgreSQL, Redis retries, Azure Blob Storage artifact writes | every PR and nightly | Engineering |
| Contract | API compatibility | OpenAPI request/response schema, error codes | every PR | Engineering |
| E2E | full workflow | create audit, run model, score parameters, override, report | staging and release | QA Automation |
| Performance | scale and latency | 60k monthly equivalent load, p95 completion under 60s | release and quarterly | SRE |
| Security | vulnerabilities and access | SAST, DAST, secret scan, RBAC tests | every PR and monthly | Security |
| AI evaluation | model and prompt quality | golden set, agreement tests, hallucination probes | prompt/model PR and nightly | AI Owner |

Critical test data sets include anonymized production conversations, synthetic edge cases, adversarial prompts, short and long conversations, multilingual samples if supported, regulatory-policy examples, and known disagreement cases. Test data must be versioned and stored securely in Azure Blob Storage with metadata in PostgreSQL.

### Best Practices

Use deterministic seeds and decoding settings for evaluation where feasible. Keep a small fast golden set for PR checks and a larger representative set for nightly and pre-release gates. Include negative tests for malformed payloads, unauthorized access, invalid override reasons, missing conversation artifacts, unsupported QA parameters, timeout handling, and duplicate idempotency keys.

Manual testing remains important for reviewer workflows. QA users should periodically validate that explanations are understandable, override flows match real practice, and dashboards answer operational questions. Calibration sessions should be treated as testing evidence, not informal feedback.

### Risks

The main testing risk is overreliance on unit tests. A system can pass deterministic tests while producing low-quality AI judgments. Another risk is stale golden data that no longer reflects current business policies or conversation patterns. Performance tests that omit realistic token lengths can understate latency and cost. Security tests that focus only on APIs may miss data leakage in prompts, logs, or generated explanations.

There is also risk in using production data for evaluation. Even anonymized data can carry re-identification risk if not governed. Test fixtures must avoid unnecessary PII and follow retention rules.

### Recommendations

Make AI evaluation a required gate for prompt and model releases. Maintain three evaluation sets: a fast smoke set, a release golden set, and a drift-monitoring set sampled from recent human-reviewed audits. Track test coverage by workflow, not only by code lines. Use automated reconciliation tests to confirm Superset datasets match source tables. Add quarterly disaster recovery and failover exercises to the test calendar.

---

## 52. AI Evaluation Framework

### Purpose

The AI evaluation framework defines how Auto QRA measures whether model outputs are accurate, grounded, consistent, explainable, and operationally safe. It provides the evidence needed to promote prompts and models while controlling hallucination and disagreement risk.

### Description

The framework will evaluate each scoring candidate across golden-set agreement, per-parameter accuracy, hallucination probes, rubric adherence, output schema validity, explanation quality, latency, token usage, bias indicators, and override likelihood. Evaluations will run offline before release and online through sampled monitoring after release. Human-labeled audits serve as the primary reference, with reviewer consensus used for high-risk categories.

Evaluation must be conducted at multiple levels: model-only capability, prompt/model pair behavior, full audit orchestration behavior, and production monitoring. Auto QRA should never promote a model version without evaluating it with the intended prompt version and QA parameter catalog.

### Business Justification

The business target is greater than 90% agreement with human QA and less than 5% hallucination. These are not infrastructure metrics; they require domain-specific evaluation. Without a rigorous framework, the organization may ship a model that looks strong on general benchmarks but fails internal QA rubrics. Evaluation protects employees from unfair scoring and protects the organization from inaccurate compliance conclusions.

The framework also improves continuous learning. Disagreement analysis reveals ambiguous rubric language, training needs, data quality issues, and model limitations. It helps decide whether improvement should come from prompt updates, QA parameter clarification, model changes, or human process changes.

### Technical Details

AI evaluation dimensions:

| Dimension | Metric | Method | Target |
|---|---|---|---|
| Agreement | percentage of audit outcomes matching human reference | exact and tolerance-based comparison | greater than 90% |
| Parameter agreement | match rate per QA parameter | per-parameter confusion matrix | threshold by risk |
| Hallucination | unsupported claim rate | human review plus automated evidence matching | less than 5% |
| Schema validity | valid JSON and required fields | parser validation | 99.5% or higher |
| Grounding | cited evidence exists in conversation | quote matching and reviewer validation | 95% or higher |
| Latency | audit completion time | timed end-to-end evaluation | p95 under 60s |
| Stability | variance across repeated runs | repeated deterministic test | low variance |
| Calibration | score confidence versus correctness | calibration plot | improving trend |

Golden-set design should include at least: balanced pass/fail examples, all 30 QA parameters, edge cases, policy-sensitive interactions, very short conversations, long conversations near token limits, conversations with conflicting evidence, known reviewer disagreement, and samples from every rollout queue. Hallucination probes should include conversations where a policy criterion is absent, ambiguous, contradicted, or mentioned by a customer rather than an agent.

### Best Practices

Use stratified sampling so evaluation does not overrepresent high-volume easy cases. Maintain a frozen release golden set for promotion and a rotating recent set for drift detection. Require two or more human reviewers for disputed or high-risk labels. Store evaluation output with enough metadata to reproduce the run: prompt version, model version, decoding settings, vLLM configuration, dataset version, QA parameter version, code version, and timestamp.

Failure analysis should categorize errors as prompt ambiguity, model reasoning error, missing context, bad source transcript, rubric mismatch, unsupported claim, schema failure, timeout, or reviewer disagreement. This taxonomy helps route fixes to the right owner.

### Risks

Evaluation can be gamed if teams tune prompts only to a known golden set. It can also be misleading if human labels are inconsistent. A single aggregate agreement number can hide serious failures in low-volume but high-risk QA parameters. Automated hallucination detection can miss subtle unsupported conclusions because it cannot fully understand operational context.

Another risk is evaluation-production mismatch. If offline tests run with smaller token budgets, different decoding parameters, or different prompt templates than production, evaluation results will not reflect live behavior.

### Recommendations

Create an evaluation review board with Product, QA Operations, AI Engineering, and Compliance. Require promotion packets for prompt/model changes that include metric tables, representative failures, risk assessment, and rollback plan. Use holdout data that prompt authors cannot inspect in detail. Monitor online agreement through sampled human reviews and trigger rollback or investigation when agreement drops below threshold or hallucination probes exceed limits.

---

## 53. Prompt Versioning

### Purpose

Prompt versioning ensures every AI-generated audit score can be traced to the exact prompt template, rubric instructions, variable schema, output format, and approval record used at the time of scoring. It prevents silent prompt drift and supports rollback, comparison, reproducibility, compliance review, and incident investigation.

### Description

Auto QRA prompts will be stored as governed artifacts with semantic version identifiers, status, owner, changelog, evaluation evidence, and promotion state. A prompt version includes the system prompt, scoring rubric, QA parameter definitions, output JSON schema, examples if used, refusal rules, PII handling instructions, model compatibility constraints, and token budget assumptions. Prompt changes follow the same review rigor as code changes because they can alter scoring behavior.

Production audits will persist the prompt version ID used for each score. Reports and dashboards will allow filtering by prompt version so score distribution changes can be analyzed after release. Archived prompt versions must remain available for audit reconstruction.

### Business Justification

Prompt changes can materially affect employee performance scores and compliance findings. Without versioning, the organization cannot explain why an audit was scored a certain way, reproduce a disputed result, or evaluate whether a change improved outcomes. Versioning also enables controlled experimentation, where candidate prompts can be compared on golden data before promotion.

Prompt versioning supports governance. Compliance and QA leaders need assurance that rubric changes are approved, documented, and applied consistently. It also reduces operational confusion when support teams investigate issues.

### Technical Details

Prompt version schema:

```json
{
  "prompt_version_id": "pv_2026_07_001",
  "name": "auto-qra-core-rubric",
  "semantic_version": "1.4.0",
  "status": "candidate",
  "qa_parameter_catalog_version": "qa-2026.07",
  "compatible_model_versions": ["mv_2026_07_7b_q4"],
  "template_hash": "sha256:examplehash",
  "json_schema_hash": "sha256:schemahash",
  "token_budget": 12000,
  "temperature": 0.0,
  "top_p": 1.0,
  "created_by": "ai-platform-owner",
  "approved_by": null,
  "created_at": "2026-07-17T00:00:00Z",
  "promotion_rules": {
    "minimum_agreement": 0.90,
    "maximum_hallucination": 0.05,
    "minimum_schema_validity": 0.995,
    "requires_compliance_review": true
  }
}
```

Recommended status model:

| Status | Meaning | Production Eligible |
|---|---|---|
| draft | being authored, no formal evaluation | no |
| candidate | ready for automated evaluation | no |
| evaluated | passed offline checks, awaiting approval | no |
| approved | approved for controlled rollout | limited |
| production | default production prompt | yes |
| deprecated | replaced but retained for replay | no new audits |
| retired | retained for historical reference only | no |

Promotion rules must require code review, QA owner review, evaluation pass, hallucination probe pass, output schema compatibility check, and release approval. Major versions should be used for rubric changes or output schema changes. Minor versions should be used for scoring instruction changes. Patch versions should be used for clarifications that do not alter intended scoring semantics.

### Best Practices

Store prompt source in Git and store prompt metadata in PostgreSQL. Compute hashes for prompt text and output schema to detect unauthorized modification. Use pull requests for prompt changes with rendered prompt previews and evaluation summaries. Avoid embedding unreviewed business logic in ad hoc prompt strings inside application code. Keep examples representative but limited, since examples can bias outputs.

Use prompt compatibility tests to confirm that output fields still map to `audit_scores`, that parameter IDs match the active catalog, and that PII handling instructions remain present. Prompt authors should write changelog entries that explain the intended behavioral change in plain language.

### Risks

Prompt changes may improve aggregate agreement while worsening a high-risk parameter. Prompt authors may overfit to known golden examples. Long prompts may increase latency or context truncation risk. Ambiguous prompt instructions can produce inconsistent explanations, and overly strict prompts may refuse valid scoring tasks. If prompt versions are not persisted with each audit, disputes become difficult to resolve.

There is also a governance risk if prompts include confidential policies or internal examples that should not be exposed in logs or error traces.

### Recommendations

Make prompt version immutable after approval. Create a new version for every change, however small. Require per-parameter evaluation reporting for promotions. Maintain a prompt registry UI or admin API that shows status, owner, changelog, evaluation results, and production usage. Use automated checks to block production promotion when prompt/model compatibility is not explicitly declared.

---

## 54. Model Versioning

### Purpose

Model versioning defines how self-hosted vLLM models are identified, configured, evaluated, promoted, monitored, and retired. It ensures that production audit outcomes are traceable to the exact 3B or 7B quantized model artifact and serving configuration used for inference.

### Description

Auto QRA will use self-hosted quantized models served by vLLM on Azure. Model versions include base model identifier, quantization method, artifact URI, tokenizer version, serving configuration, GPU profile, context window, safety constraints, compatible prompt versions, and evaluation results. Because model behavior can change with quantization, tokenizer changes, decoding parameters, and vLLM runtime versions, model versioning must include more than the base model name.

Model promotion will follow a controlled path from imported, benchmarked, evaluated, approved, canary, production, deprecated, and retired states. Production model pools should be immutable for a given model version. New versions should be deployed to separate pools and receive traffic through the model gateway after approval.

### Business Justification

The model is a core determinant of audit quality. A model upgrade can improve reasoning and reduce latency, but it can also introduce new failure modes, different score distributions, or higher hallucination risk. Versioning enables the business to compare candidates, explain outcomes, rollback degraded models, and comply with AI governance expectations.

Self-hosting provides data control and cost predictability, but it transfers operational responsibility to the organization. Model versioning creates the discipline needed to operate self-hosted AI safely.

### Technical Details

Model version schema:

```json
{
  "model_version_id": "mv_2026_07_7b_q4",
  "base_model": "enterprise-approved-7b-instruct",
  "model_size": "7B",
  "quantization": "Q4_K_M",
  "artifact_uri": "gs://auto-qra-models/2026-07/7b-q4/",
  "tokenizer_hash": "sha256:tokenizerhash",
  "vllm_version": "0.x",
  "status": "candidate",
  "context_window": 32768,
  "gpu_profile": "aks-ncadsa100-or-ncas-t4-v3-nodepool",
  "max_concurrency_per_replica": 8,
  "default_temperature": 0.0,
  "default_top_p": 1.0,
  "compatible_prompt_versions": ["pv_2026_07_001"],
  "evaluation_dataset_version": "golden-2026.07",
  "agreement": 0.918,
  "hallucination_rate": 0.037,
  "p95_latency_seconds": 48.2
}
```

Promotion rules:

| Rule | Requirement |
|---|---|
| Artifact integrity | model artifact hash verified and stored |
| Security review | source and license approved for enterprise use |
| Evaluation | agreement greater than 90%, hallucination less than 5% |
| Latency | p95 end-to-end audit completion under 60s |
| Compatibility | approved prompt versions explicitly listed |
| Canary | limited production traffic with no SLO breach |
| Rollback | prior production model pool remains warm during canary |

### Best Practices

Treat model artifacts as immutable. Store model metadata in PostgreSQL and artifacts in Azure Blob Storage with restricted access. Use signed artifacts or checksums to detect tampering. Maintain separate vLLM deployments for candidate and production versions. Record serving parameters and runtime versions because they affect outputs and latency.

Use shadow evaluation before routing production decisions to a new model. Compare score distributions, parameter-level agreement, refusal patterns, token usage, and explanation length. For 3B models, use cases should be limited to lower complexity or latency-sensitive flows unless evaluation proves sufficient agreement. For 7B models, capacity planning must account for GPU memory, batching, and context length.

### Risks

Risks include quantization-related accuracy loss, tokenizer mismatch, model artifact corruption, GPU memory pressure, cold-start delays, license restrictions, insufficient context window, and unexpected behavior under long conversations. A model can pass a narrow benchmark but fail domain-specific QA evaluation. A vLLM runtime upgrade can change performance characteristics even with the same model.

There is also a supply chain risk if model artifacts are fetched from unapproved sources or if licenses are not compatible with enterprise use.

### Recommendations

Maintain a model registry integrated with release management. Keep the current production model and previous approved model available during canary. Require evaluation packets for all model promotions. Monitor production by model version and alert on latency, timeout, agreement, hallucination probe failures, and override rate. Do not mix untracked model runtime changes with prompt changes in the same release unless necessary and explicitly approved.

---

## 55. API Specifications

### Purpose

The API specifications define the external and internal REST contracts used to submit audits, retrieve audit status and results, record human overrides, access reports, check health, and administer governed resources. Clear API contracts allow product interfaces, batch ingestion, reporting jobs, and administrative tools to integrate reliably with Auto QRA.

### Description

Auto QRA exposes JSON REST APIs over HTTPS. All production endpoints require SSO-authenticated identity, RBAC authorization, tenant or business-unit scoping, request correlation IDs, and audit logging. APIs must support idempotency for audit creation and override submission. Responses must identify prompt and model versions where relevant so that downstream systems can preserve auditability.

OpenAPI should be generated from source or kept as a required artifact in the release pipeline. Breaking changes require versioning and migration plans. The initial API namespace should use `/api/v1`.

### Business Justification

APIs are the foundation for scale. They allow conversation sources to submit audits, QA tools to display outcomes, supervisors to record overrides, dashboards to retrieve aggregates, and administrators to manage prompts and models. Strong API design reduces integration cost and prevents inconsistent access patterns. It also supports compliance because access, changes, and overrides can be centrally logged.

The API contract must be precise because audit outcomes can influence coaching and compliance reporting. Ambiguous status values or error codes can cause downstream teams to misreport results.

### Technical Details

Common headers:

| Header | Required | Description |
|---|---|---|
| `Authorization` | yes | bearer token from SSO-integrated identity provider |
| `X-Correlation-Id` | yes | caller-generated request trace ID |
| `Idempotency-Key` | for mutating POST | caller-generated key to prevent duplicate writes |
| `X-Tenant-Id` | yes for multi-tenant deployment | tenant or business unit scope |

Common error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "conversation_id is required",
    "correlation_id": "corr-123",
    "details": [
      {
        "field": "conversation_id",
        "reason": "missing"
      }
    ]
  }
}
```

#### POST /api/v1/audits

Creates an audit request for a conversation.

```http
POST /api/v1/audits
Content-Type: application/json
Authorization: Bearer <token>
X-Correlation-Id: corr-20260717-001
Idempotency-Key: audit-conv-998877-v1
```

Request:

```json
{
  "conversation_id": "conv_998877",
  "conversation_uri": "gs://auto-qra-conversations/2026/07/conv_998877.json",
  "queue_id": "billing-support",
  "agent_id": "agent_12345",
  "language": "en-US",
  "qa_parameter_set": "qa-2026.07",
  "priority": "normal",
  "metadata": {
    "channel": "chat",
    "region": "US",
    "case_id": "case_456"
  }
}
```

Response `202 Accepted`:

```json
{
  "audit_id": "aud_01J2QRA7Z6W8",
  "status": "queued",
  "created_at": "2026-07-17T10:00:00Z",
  "estimated_completion_seconds": 45,
  "links": {
    "self": "/api/v1/audits/aud_01J2QRA7Z6W8"
  }
}
```

#### GET /api/v1/audits/{id}

Retrieves audit status, scores, evidence, versions, and override state.

```http
GET /api/v1/audits/aud_01J2QRA7Z6W8
Authorization: Bearer <token>
X-Correlation-Id: corr-20260717-002
```

Response `200 OK`:

```json
{
  "audit_id": "aud_01J2QRA7Z6W8",
  "conversation_id": "conv_998877",
  "status": "completed",
  "overall_score": 92.5,
  "agreement_required": false,
  "prompt_version_id": "pv_2026_07_001",
  "model_version_id": "mv_2026_07_7b_q4",
  "completed_at": "2026-07-17T10:00:41Z",
  "scores": [
    {
      "parameter_id": "greeting",
      "parameter_name": "Proper Greeting",
      "score": 1,
      "max_score": 1,
      "confidence": 0.94,
      "rationale": "The agent greeted the customer and offered assistance.",
      "evidence": [
        {
          "speaker": "agent",
          "quote": "Hello, thank you for contacting support. How may I help?"
        }
      ]
    }
  ],
  "override": null
}
```

#### POST /api/v1/audits/{id}/override

Records a human override for one or more scores or the overall audit.

```http
POST /api/v1/audits/aud_01J2QRA7Z6W8/override
Content-Type: application/json
Authorization: Bearer <token>
X-Correlation-Id: corr-20260717-003
Idempotency-Key: override-aud-01J2QRA7Z6W8-001
```

Request:

```json
{
  "reason_code": "AI_MISINTERPRETED_POLICY",
  "comment": "The agent complied with the refund policy after identity verification.",
  "overall_score": 96.0,
  "score_overrides": [
    {
      "parameter_id": "policy_compliance",
      "score": 1,
      "max_score": 1,
      "rationale": "Human reviewer confirmed policy was followed."
    }
  ]
}
```

Response `200 OK`:

```json
{
  "override_id": "ovr_01J2QRA9H1",
  "audit_id": "aud_01J2QRA7Z6W8",
  "status": "accepted",
  "overridden_by": "user_789",
  "created_at": "2026-07-17T10:10:00Z",
  "effective_overall_score": 96.0
}
```

#### GET /api/v1/reports/audit-summary

Returns aggregate audit performance metrics for dashboards or authorized consumers.

```http
GET /api/v1/reports/audit-summary?from=2026-07-01&to=2026-07-17&queue_id=billing-support
Authorization: Bearer <token>
X-Correlation-Id: corr-20260717-004
```

Response `200 OK`:

```json
{
  "from": "2026-07-01",
  "to": "2026-07-17",
  "queue_id": "billing-support",
  "audit_count": 2140,
  "average_score": 91.2,
  "ai_human_agreement": 0.913,
  "override_rate": 0.046,
  "hallucination_rate": 0.031,
  "p95_latency_seconds": 47.6
}
```

#### GET /api/v1/reports/parameter-performance

Returns per-parameter score and disagreement trends.

```json
{
  "from": "2026-07-01",
  "to": "2026-07-17",
  "parameters": [
    {
      "parameter_id": "policy_compliance",
      "average_score": 0.88,
      "failure_count": 121,
      "override_rate": 0.071,
      "agreement": 0.897
    }
  ]
}
```

#### GET /api/v1/health

Basic process health for load balancers.

```json
{
  "status": "ok",
  "service": "auto-qra-api",
  "version": "1.0.0",
  "timestamp": "2026-07-17T10:15:00Z"
}
```

#### GET /api/v1/health/ready

Readiness health for dependencies.

```json
{
  "status": "ready",
  "checks": {
    "postgresql": "ok",
    "redis": "ok",
    "azure_blob": "ok",
    "model_gateway": "ok",
    "active_prompt_version": "pv_2026_07_001",
    "active_model_version": "mv_2026_07_7b_q4"
  }
}
```

#### Admin endpoints

| Endpoint | Method | Purpose | Required Role |
|---|---|---|---|
| `/api/v1/admin/prompt-versions` | GET | list prompt versions | Prompt Admin |
| `/api/v1/admin/prompt-versions/{id}/promote` | POST | promote approved prompt | Prompt Admin and QA Approver |
| `/api/v1/admin/model-versions` | GET | list model versions | Model Admin |
| `/api/v1/admin/model-versions/{id}/promote` | POST | promote approved model | Model Admin and SRE Approver |
| `/api/v1/admin/users/{id}/roles` | PUT | manage user roles | Security Admin |
| `/api/v1/admin/audit-logs` | GET | search audit logs | Compliance Auditor |

Admin promotion request:

```json
{
  "target_status": "production",
  "change_ticket": "CHG-2026-0717-001",
  "approval_notes": "Passed July golden set and limited canary gates."
}
```

### Best Practices

Use OpenAPI validation in CI and generate SDKs or typed clients where needed. Ensure every mutating endpoint writes to `audit_logs`. Use consistent pagination for list endpoints. Use least-privilege scopes and deny access by default. Include response fields for version IDs and status transitions. Avoid returning raw PII in API responses unless explicitly authorized and needed for the user's role.

### Risks

API risks include duplicate audit submission, unauthorized access to sensitive conversations, inconsistent status transitions, incomplete audit logging, and breaking changes to reporting clients. Overly broad admin endpoints can become a governance weakness. Report APIs can leak sensitive group performance information if RBAC and aggregation thresholds are not enforced.

### Recommendations

Publish the OpenAPI specification as a release artifact. Require contract tests for every endpoint. Enforce idempotency keys for mutating operations. Apply row-level or tenant-level authorization consistently. Rate limit ingestion and admin endpoints. Add explicit aggregation suppression rules for reports where small group sizes could expose personal performance data.

---

## 56. Database Schema

### Purpose

The database schema defines the transactional foundation for audits, scores, QA parameters, conversations, overrides, prompt versions, model versions, users, roles, and audit logs. It must support traceability, reporting, security, replay, and governance.

### Description

PostgreSQL is the system of record for Auto QRA. The schema must store audit lifecycle state, score details for up to 30 QA parameters per audit, conversation metadata, human overrides, prompt and model metadata, user and role assignments, and immutable audit logs. Large conversation artifacts and generated evidence bundles should be stored in Azure Blob Storage, with PostgreSQL storing URIs and metadata.

The schema must preserve historical context. If a QA parameter changes later, past audits must still be interpretable. If a prompt or model is retired, its version record must remain. If a user leaves the company, override and audit log records must remain attributable through stable identifiers and governed retention rules.

### Business Justification

Reliable data design protects operational reporting, compliance reviews, and dispute resolution. QA leaders need accurate score trends. Compliance teams need immutable logs. Product teams need adoption and workflow metrics. AI teams need model and prompt performance by version. Poor schema design can make these analyses unreliable or impossible.

### Technical Details

Entity relationship diagram:

```mermaid
erDiagram
    conversations ||--o{ audits : "has"
    audits ||--o{ audit_scores : "contains"
    qa_parameters ||--o{ audit_scores : "defines"
    audits ||--o{ overrides : "may_have"
    prompt_versions ||--o{ audits : "used_by"
    model_versions ||--o{ audits : "used_by"
    users ||--o{ overrides : "creates"
    users ||--o{ audit_logs : "acts"
    roles ||--o{ users : "assigned_to"
    audits ||--o{ audit_logs : "referenced_by"```

Core DDL:

```sql
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_subject VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(320) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(role_id),
    business_unit VARCHAR(100),
    status VARCHAR(40) NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE prompt_versions (
    prompt_version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    semantic_version VARCHAR(50) NOT NULL,
    status VARCHAR(40) NOT NULL,
    template_uri TEXT NOT NULL,
    template_hash VARCHAR(128) NOT NULL,
    json_schema_uri TEXT NOT NULL,
    json_schema_hash VARCHAR(128) NOT NULL,
    qa_parameter_catalog_version VARCHAR(100) NOT NULL,
    compatible_model_versions JSONB NOT NULL DEFAULT '[]'::jsonb,
    token_budget INTEGER NOT NULL,
    decoding_config JSONB NOT NULL,
    evaluation_summary JSONB,
    created_by UUID REFERENCES users(user_id),
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE model_versions (
    model_version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_key VARCHAR(100) NOT NULL UNIQUE,
    base_model VARCHAR(255) NOT NULL,
    model_size VARCHAR(20) NOT NULL,
    quantization VARCHAR(80) NOT NULL,
    artifact_uri TEXT NOT NULL,
    artifact_hash VARCHAR(128) NOT NULL,
    tokenizer_hash VARCHAR(128) NOT NULL,
    vllm_version VARCHAR(80) NOT NULL,
    status VARCHAR(40) NOT NULL,
    context_window INTEGER NOT NULL,
    gpu_profile VARCHAR(120) NOT NULL,
    serving_config JSONB NOT NULL,
    compatible_prompt_versions JSONB NOT NULL DEFAULT '[]'::jsonb,
    evaluation_summary JSONB,
    created_by UUID REFERENCES users(user_id),
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE qa_parameters (
    parameter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parameter_key VARCHAR(100) NOT NULL,
    catalog_version VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    max_score NUMERIC(8,2) NOT NULL DEFAULT 1,
    weight NUMERIC(8,4) NOT NULL DEFAULT 1,
    risk_level VARCHAR(40) NOT NULL DEFAULT 'standard',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (parameter_key, catalog_version)
);

CREATE TABLE conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_conversation_id VARCHAR(255) NOT NULL UNIQUE,
    conversation_uri TEXT NOT NULL,
    redacted_conversation_uri TEXT,
    channel VARCHAR(80) NOT NULL,
    language VARCHAR(20) NOT NULL,
    queue_id VARCHAR(120) NOT NULL,
    agent_external_id VARCHAR(255) NOT NULL,
    customer_region VARCHAR(80),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    pii_classification VARCHAR(80) NOT NULL DEFAULT 'restricted',
    retention_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audits (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(conversation_id),
    status VARCHAR(40) NOT NULL DEFAULT 'queued',
    qa_parameter_catalog_version VARCHAR(100) NOT NULL,
    prompt_version_id UUID REFERENCES prompt_versions(prompt_version_id),
    model_version_id UUID REFERENCES model_versions(model_version_id),
    requested_by UUID REFERENCES users(user_id),
    priority VARCHAR(40) NOT NULL DEFAULT 'normal',
    overall_score NUMERIC(8,2),
    effective_overall_score NUMERIC(8,2),
    confidence NUMERIC(8,4),
    hallucination_flag BOOLEAN NOT NULL DEFAULT false,
    error_code VARCHAR(120),
    error_message TEXT,
    queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    latency_ms INTEGER,
    idempotency_key VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (idempotency_key)
);

CREATE TABLE audit_scores (
    audit_score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(audit_id) ON DELETE CASCADE,
    parameter_id UUID NOT NULL REFERENCES qa_parameters(parameter_id),
    score NUMERIC(8,2) NOT NULL,
    max_score NUMERIC(8,2) NOT NULL,
    weighted_score NUMERIC(8,2),
    confidence NUMERIC(8,4),
    rationale TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    hallucination_flag BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (audit_id, parameter_id)
);

CREATE TABLE overrides (
    override_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(audit_id),
    overridden_by UUID NOT NULL REFERENCES users(user_id),
    reason_code VARCHAR(120) NOT NULL,
    comment TEXT,
    previous_overall_score NUMERIC(8,2),
    new_overall_score NUMERIC(8,2),
    score_overrides JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(40) NOT NULL DEFAULT 'accepted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    idempotency_key VARCHAR(255),
    UNIQUE (idempotency_key)
);

CREATE TABLE audit_logs (
    audit_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES users(user_id),
    actor_type VARCHAR(60) NOT NULL DEFAULT 'user',
    action VARCHAR(120) NOT NULL,
    resource_type VARCHAR(120) NOT NULL,
    resource_id UUID,
    audit_id UUID REFERENCES audits(audit_id),
    correlation_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    before_state JSONB,
    after_state JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_completed_at ON audits(completed_at);
CREATE INDEX idx_audits_conversation_id ON audits(conversation_id);
CREATE INDEX idx_audit_scores_audit_id ON audit_scores(audit_id);
CREATE INDEX idx_overrides_audit_id ON overrides(audit_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_conversations_queue_created ON conversations(queue_id, created_at);
```

### Best Practices

Use UUID primary keys and stable external identifiers. Apply database constraints for status enums through check constraints or reference tables in implementation. Use JSONB for flexible evidence and metadata, but keep high-value reporting dimensions as typed columns. Partition high-volume tables such as `audit_logs` by time if growth requires it. Encrypt storage at rest and restrict direct database access.

Database migrations should be backward compatible during rolling deployments. Add columns before using them, backfill asynchronously, and remove deprecated structures only after all consumers have migrated. Use read replicas or materialized reporting tables if Superset queries begin to affect transactional performance.

### Risks

Schema risks include unbounded audit log growth, slow report queries, loss of historical parameter meaning, inconsistent override application, and accidental storage of unredacted PII in fields intended for metadata. JSONB flexibility can become a reporting problem if important fields are not standardized.

There is also a risk of referential gaps if external conversation systems delete or change records. Auto QRA must preserve enough metadata and artifact references to support audit reconstruction while respecting retention rules.

### Recommendations

Create a data dictionary and migration policy before GA. Add row-level security or application-enforced tenant scoping where multi-tenant needs exist. Build reporting views that expose approved fields to Superset instead of connecting dashboards directly to all transactional tables. Implement retention jobs for conversation artifacts, audit logs, and evaluation artifacts according to compliance policy.

---

## 57. Reporting Dashboard Requirements

### Purpose

Reporting dashboard requirements define what QA leaders, supervisors, product owners, SREs, compliance teams, and AI owners need to see in Superset to manage Auto QRA. The dashboards must support operational control, quality improvement, adoption tracking, governance, and incident response.

### Description

Superset will provide dashboards backed by governed PostgreSQL views or reporting tables. Dashboards will separate finalized human-effective scores from raw AI scores, show override trends, reveal per-parameter performance, monitor latency and backlog, and track AI quality metrics. Users should see data according to SSO/RBAC permissions and aggregation suppression rules.

Dashboards should be designed for decision-making. Executives need concise KPI summaries. QA managers need drilldowns by queue, parameter, agent group, and reviewer. AI owners need prompt/model version comparisons. SREs need latency, throughput, error, and capacity views.

### Business Justification

The platform's value is realized when leaders can act on insights. Dashboards help identify coaching opportunities, policy compliance gaps, process defects, model degradation, and adoption issues. They also provide transparency during rollout by showing whether gates are being met. Without reliable dashboards, users may export data manually, create inconsistent metrics, or mistrust automation.

### Technical Details

Superset dashboard requirements:

| Dashboard | Audience | Key Metrics | Filters | Refresh | Notes |
|---|---|---|---|---|---|
| Executive Quality Overview | executives, QA leadership | audit count, average effective score, agreement, override rate, hallucination rate | date, business unit, queue | daily and on demand | high-level trend and rollout gate view |
| QA Parameter Performance | QA managers | score by parameter, failure rate, top failure drivers, disagreement | date, queue, parameter, agent group | hourly | supports coaching and rubric tuning |
| Audit Operations | supervisors, operations | queue depth, audit status, completion latency, failed audits | date, queue, priority, status | 5 minutes | operational triage |
| AI Quality Monitor | AI owner, QA calibration | agreement, hallucination probes, schema validity, drift, prompt/model comparison | prompt, model, dataset, queue | hourly and per eval run | core AI governance dashboard |
| Override Analytics | QA managers, compliance | override rate, reason codes, reviewer distribution, overturned parameters | date, reviewer, reason, queue | hourly | detects model and process issues |
| Release Health | Product, SRE | post-release score distribution, errors, latency, traffic by version | release, prompt, model | 5 minutes during release | used for canary and rollback |
| Compliance and Access | compliance, security | admin actions, access events, role changes, audit log searches | date, actor, action, resource | daily | SOC2-ready evidence |
| Cost and Capacity | SRE, Finance | GPU utilization, token usage, cost per audit, model throughput | date, model, node pool | hourly | supports self-hosted model economics |

### Best Practices

Define KPI logic centrally in approved semantic views, not separately in each chart. Clearly label whether a score is AI-generated, human-confirmed, or human-overridden. Provide data freshness indicators on every dashboard. Use drilldowns sparingly and consistently. Apply aggregation thresholds to avoid exposing individual performance where not allowed.

Dashboard definitions should be version controlled where possible. Every metric should have an owner, definition, calculation, target, and known limitations. Superset access should be mapped to enterprise roles through SSO groups. Dashboard changes that affect executive reporting should go through release management.

### Risks

Dashboard risks include metric inconsistency, stale data, unauthorized visibility, slow queries, and misinterpretation of experimental data. If dashboards combine pilot and GA traffic without labels, leaders may draw incorrect conclusions. If Superset connects directly to transactional tables with broad permissions, it can create performance and security issues.

There is also a risk that users focus only on average score and miss systemic model failures, parameter-level regressions, or reviewer disagreement.

### Recommendations

Build a certified Superset dataset layer with approved definitions. Add dashboard QA tests that reconcile counts and aggregates to PostgreSQL source tables. Include prompt and model version filters on AI quality dashboards. Add data freshness and data quality banners. Create dashboard training materials for QA leaders and supervisors before Limited Availability.

---

## 58. Product KPIs

### Purpose

Product KPIs define whether Auto QRA is delivering business value to users and stakeholders. They measure adoption, coverage, workflow efficiency, user trust, and quality improvement enabled by the product.

### Description

Product KPIs focus on the outcome of the platform rather than only the health of the infrastructure or model. They answer whether more audits are completed, whether QA teams save time, whether supervisors use the outputs, whether human reviewers trust recommendations, and whether the platform improves coaching and compliance visibility.

Product KPIs should be reviewed in rollout gates, monthly business reviews, and quarterly roadmap planning. They must be segmented by queue, business unit, language, product line, and rollout phase to avoid hiding uneven adoption.

### Business Justification

The investment in Auto QRA is justified only if it improves the quality review operating model. Product KPIs create accountability for measurable value. They help leaders decide whether to expand rollout, adjust workflows, invest in model improvements, or provide additional training.

### Technical Details

| KPI | Formula | Owner | Target | Frequency |
|---|---|---|---|---|
| Audit coverage | automated or assisted audits completed / eligible conversations | Product Owner | phase-specific growth toward approved coverage | weekly |
| QA cycle time reduction | baseline manual cycle time minus Auto QRA cycle time | QA Operations | 30% reduction by GA stabilization | monthly |
| Reviewer adoption | active reviewers using Auto QRA / eligible reviewers | Product Owner | 80% in enabled groups | weekly |
| Supervisor dashboard adoption | supervisors viewing dashboards weekly / eligible supervisors | QA Leadership | 75% by Limited Availability exit | weekly |
| Override workflow utilization | audits with appropriate override action / disputed audits | QA Operations | 95% of disputes captured in system | weekly |
| User satisfaction | average reviewer and supervisor survey score | Product Owner | 4.0 of 5 or higher | monthly |
| Coaching action rate | audits leading to documented coaching / finalized audits | QA Leadership | baseline plus 15% | monthly |
| Time to insight | audit completion to dashboard availability | Product Analytics | under 2 hours for standard reporting | daily |
| Feature reliability perception | users rating system reliable / surveyed users | Product Owner | 85% positive | monthly |
| Business unit readiness | rollout gate items completed / required items | Program Manager | 100% before expansion | per phase |

### Best Practices

Pair quantitative KPIs with qualitative feedback. A high adoption number can hide frustration if reviewers feel overrides are cumbersome. Track product KPIs by cohort, because early adopters may behave differently from later groups. Use baselines measured before rollout so improvement claims are credible.

Avoid vanity metrics such as total page views unless they connect to a decision. Each KPI should have an owner who can act when the metric moves. Keep targets realistic during Pilot and raise them as training, dashboards, and model quality improve.

### Risks

Product KPI risks include optimizing for volume over accuracy, misinterpreting adoption as trust, ignoring segments with lower performance, and failing to adjust baselines when workflow scope changes. If KPI owners are not named, metrics may be reported but not managed.

Another risk is pressure to expand rollout based on productivity gains while AI quality gates are not yet met. Product KPIs should never override safety and governance gates.

### Recommendations

Review Product KPIs weekly during rollout and monthly after GA. Include commentary with metrics, especially for segments below target. Use KPI movement to prioritize roadmap investments such as better explanations, reviewer workflow improvements, dashboard refinements, and additional integrations. Combine Product KPIs with Operational and AI KPIs in executive reviews.

---

## 59. Operational KPIs

### Purpose

Operational KPIs define whether Auto QRA is reliable, performant, scalable, and supportable in production. They measure service health, audit throughput, latency, availability, backlog, cost, and incident performance.

### Description

Operational KPIs are owned by SRE, Engineering, and Operations. They ensure the platform can process 60,000 audits per month while meeting p95 audit completion latency under 60 seconds and 99.9% availability. They also provide early warning when Redis queues, PostgreSQL, Azure Blob Storage, API services, or vLLM model servers are approaching limits.

Operational KPIs must be reviewed at different cadences. Real-time metrics support alerting and incident response. Weekly metrics support capacity planning. Monthly metrics support cost and reliability governance.

### Business Justification

If Auto QRA is unavailable or slow, audit operations stall and users lose trust. Operational KPIs protect service commitments and help manage self-hosted AI costs. They also provide evidence for production readiness, release gates, and SOC2-ready availability controls.

### Technical Details

| KPI | Formula | Owner | Target | Frequency |
|---|---|---|---|---|
| API availability | successful health checks / total health checks | SRE | 99.9% monthly | real time and monthly |
| Audit p95 latency | 95th percentile completed_at minus queued_at | SRE | under 60 seconds | 5 minutes |
| Audit completion success | completed audits / submitted audits | Engineering | 99% or higher | hourly |
| Queue backlog age | age of oldest queued audit | SRE | under 5 minutes standard priority | 5 minutes |
| Worker error rate | failed worker jobs / total worker jobs | Engineering | under 1% | 5 minutes |
| Model timeout rate | timed out inference calls / total inference calls | AI Platform | under 2% | 5 minutes |
| PostgreSQL saturation | max CPU, connections, lock wait indicators | DBA/SRE | below alert thresholds | real time |
| Redis queue health | queue depth and memory usage | SRE | within capacity plan | 5 minutes |
| Dashboard freshness | latest dashboard extract age | Data Engineering | under 2 hours standard, 15 minutes ops | hourly |
| Cost per audit | infrastructure cost / completed audits | FinOps/SRE | target established after pilot | monthly |
| Incident MTTA | alert acknowledgement time | SRE | under 10 minutes | per incident |
| Incident MTTR | incident resolution time | SRE | severity-specific | per incident |

### Best Practices

Define SLOs and error budgets before GA. Use alert thresholds that are actionable and tied to user impact. Monitor both request latency and end-to-end audit latency because users care about completed scores, not only API response time. Include synthetic audits to verify the full path from submission to scoring.

Capacity tests should model monthly volume, peak concurrency, long conversations, and retry storms. Dashboards should show model-serving capacity separately from application capacity. Use structured incident reviews to improve runbooks and reduce repeat failures.

### Risks

Operational KPI risks include measuring the wrong layer, alert fatigue, hidden backlog, cost surprises, and insufficient GPU capacity. A healthy API can still produce poor user experience if workers are delayed or model inference is timing out. A low average latency can hide p95 or p99 failures.

Another risk is incomplete dependency monitoring. Azure Blob Storage errors, SSO failures, and Superset extract failures may not appear as API errors but still impair business workflows.

### Recommendations

Implement service-level dashboards with drilldowns by dependency. Define paging alerts for availability, p95 latency, backlog age, inference timeout, and failed audit rate. Define ticket alerts for dashboard freshness, cost anomalies, and non-critical error trends. Review error budget burn weekly during rollout. Use load testing before each major traffic expansion.

---

## 60. AI KPIs

### Purpose

AI KPIs measure the quality, safety, consistency, and efficiency of model and prompt behavior. They determine whether Auto QRA meets its AI targets: greater than 90% agreement with human QA and less than 5% hallucination.

### Description

AI KPIs combine offline evaluation metrics and online monitoring metrics. Offline metrics are measured against controlled datasets before release. Online metrics are measured through sampled human review, override patterns, hallucination probes, and production telemetry. AI KPIs must be segmented by prompt version, model version, QA parameter, queue, language, and conversation type.

AI KPIs are used for promotion gates, rollout gates, model monitoring, prompt tuning, and incident response. They should be interpreted with context because disagreement can reflect model error, human reviewer inconsistency, ambiguous rubrics, or missing conversation context.

### Business Justification

AI quality determines whether Auto QRA can be trusted. High agreement reduces manual rework. Low hallucination protects employees and customers from unsupported conclusions. Per-parameter visibility helps the business know which QA dimensions are ready for automation support and which require human attention or rubric refinement.

### Technical Details

| KPI | Formula | Owner | Target | Frequency |
|---|---|---|---|---|
| Human agreement | AI score matches human reference within defined tolerance / reviewed audits | AI Owner and QA Ops | greater than 90% | release and weekly |
| Hallucination rate | outputs with unsupported claims / reviewed AI outputs | AI Owner | less than 5% | release and weekly |
| Parameter-level agreement | parameter matches / reviewed parameter scores | AI Owner | risk-tiered thresholds | release and weekly |
| Schema validity | valid parseable outputs / total model outputs | Engineering | 99.5% or higher | real time |
| Evidence grounding | rationales with valid supporting quotes / reviewed rationales | QA Calibration | 95% or higher | weekly |
| Override rate | audits overridden / completed audits | QA Ops | monitored; target depends on maturity | weekly |
| High-risk false pass rate | high-risk failures missed by AI / human-confirmed high-risk failures | Compliance and AI Owner | near zero, threshold approved by governance | release |
| Drift score | current distribution divergence from baseline | AI Owner | below alert threshold | weekly |
| Prompt regression count | failed golden cases versus prior prompt | Prompt Owner | zero critical regressions | per prompt PR |
| Model efficiency | completed audits per GPU hour | AI Platform/SRE | improves or stays within cost target | weekly |

### Best Practices

Always pair aggregate agreement with parameter-level and segment-level analysis. Use confidence values only after calibration testing proves they are meaningful. Track hallucination both through explicit probes and reviewer annotations. Create an error taxonomy and review representative failures, not only metric totals.

AI KPIs should appear in release packets and Superset dashboards. Production monitoring should compare new prompt/model combinations against baseline. For low-volume parameters, use accumulated windows and human review rather than unstable daily percentages.

### Risks

AI KPI risks include noisy human labels, sample bias, overfitting to golden data, under-detection of hallucinations, and false stability from aggregate averages. A model may maintain overall agreement while failing a specific policy parameter. Override rate may increase because users are more engaged, not only because AI quality declined.

Another risk is treating AI KPIs as static. Business policies, customer behavior, and conversation channels change. Evaluation data and thresholds must evolve with the operating environment.

### Recommendations

Establish an AI KPI review forum. Use a balanced scorecard for promotion: agreement, hallucination, schema validity, latency, grounding, and high-risk false pass rate. Add automatic alerts for hallucination and agreement breaches. Maintain a rotating sample of production audits for human review. Update golden sets quarterly or after major policy changes.

---

## 61. Governance

### Purpose

Governance defines accountability, decision rights, oversight, and operating controls for Auto QRA. It ensures that automation is introduced and managed responsibly across product, technology, quality operations, security, compliance, and business leadership.

### Description

Auto QRA governance covers release approvals, prompt and model promotion, QA parameter changes, data access, override policy, incident response, KPI review, compliance evidence, and roadmap prioritization. Governance must be practical enough to support frequent iteration but strong enough to protect employee fairness, customer privacy, and business integrity.

Governance will operate through a cross-functional steering group and specialized review forums. The steering group owns strategic direction and risk acceptance. Product owns user value and roadmap. QA Operations owns rubric correctness and human review process. AI Engineering owns model and prompt quality. SRE owns reliability. Security owns access and technical controls. Compliance and Legal own regulatory interpretation and evidence requirements.

### Business Justification

AI-driven quality review can affect employee coaching, customer compliance findings, and operational decisions. Clear governance protects the organization from unapproved automation, inconsistent scoring policy, privacy violations, and weak accountability. It also gives stakeholders confidence that Auto QRA is not a black box but a controlled enterprise system.

### Technical Details

Governance RACI:

| Activity | Product | QA Ops | Engineering | AI Owner | SRE | Security | Compliance/Legal | Business Sponsor |
|---|---|---|---|---|---|---|---|---|
| Product roadmap | A/R | C | C | C | C | C | C | A |
| QA parameter definition | C | A/R | C | C | I | I | C | C |
| Prompt authoring | C | R | C | A/R | I | C | C | I |
| Prompt promotion | A | A/R | C | A/R | C | C | C | I |
| Model promotion | C | C | C | A/R | A/R | C | C | I |
| Production deployment | C | I | A/R | C | A/R | C | I | I |
| Access control policy | C | C | R | I | I | A/R | A/R | I |
| Override policy | C | A/R | C | C | I | I | C | I |
| AI incident response | C | R | R | A/R | R | C | C | I |
| Compliance evidence | I | C | C | C | C | R | A/R | I |
| Rollout gate approval | A/R | A/R | C | C | C | C | C | A |

Decision rights should be documented for: production prompt changes, production model changes, QA parameter catalog changes, high-risk automation expansion, data retention changes, admin role assignment, and exception handling.

### Best Practices

Use written decision records for major changes. Maintain a governance calendar that includes rollout gate reviews, AI KPI reviews, release reviews, access reviews, and compliance evidence reviews. Require documented risk acceptance for any threshold exception. Keep governance artifacts linked to release manifests and evaluation records.

Human override must remain a core governance control. Override reason codes should be standardized and reviewed to identify model issues, prompt issues, rubric ambiguity, and training needs. Governance forums should review not only whether the AI is accurate but whether users understand and can challenge results.

### Risks

Governance risks include unclear ownership, slow approvals, rubber-stamp reviews, inconsistent parameter changes, and lack of accountability for AI behavior. If governance is too heavy, teams may work around it. If it is too light, unreviewed changes can reach production and affect audit outcomes.

Another risk is fragmented evidence. If release approvals, prompt evaluation, model metadata, and incident reviews are stored in separate systems without linkage, compliance reviews become costly and incomplete.

### Recommendations

Create a single governance index that links release records, prompt versions, model versions, evaluation reports, decision logs, and compliance evidence. Keep RACI current as the organization changes. Require quarterly governance effectiveness reviews. Ensure every production scoring change has an accountable business owner and a technical owner.

---

## 62. Compliance

### Purpose

Compliance defines how Auto QRA protects personal data, supports privacy rights, preserves auditability, and aligns with SOC2-ready operational controls. It covers GDPR/CCPA-style privacy expectations, enterprise security practices, data retention, access control, monitoring, and evidence management.

### Description

Auto QRA processes conversation data that may contain customer PII, employee identifiers, case metadata, and sensitive operational information. The platform must use privacy-by-design controls: data minimization, purpose limitation, access restriction, retention enforcement, encryption, audit logging, and human oversight. Because the platform is self-hosted on Azure with vLLM, the organization retains greater control over data movement but also bears responsibility for infrastructure, model artifact, and access controls.

Compliance readiness should be built into architecture and operations rather than handled as a late review. API access, Superset dashboards, Azure Blob Storage buckets, PostgreSQL tables, Redis usage, logs, prompts, model outputs, and evaluation datasets all require control consideration.

### Business Justification

Privacy and compliance failures can create regulatory exposure, contractual risk, reputational damage, and employee trust issues. Auto QRA will be more readily adopted if stakeholders know that PII is controlled, access is appropriate, and automated recommendations are auditable and contestable. SOC2-ready controls also support enterprise customer and internal risk requirements.

### Technical Details

Compliance controls mapping:

| Control Area | GDPR/CCPA-Style Expectation | SOC2-Ready Control | Auto QRA Implementation |
|---|---|---|---|
| Purpose limitation | use data for defined QA purposes | documented processing purpose | approved data processing register and product policy |
| Data minimization | collect only needed fields | data classification and design review | store conversation URI and required metadata, avoid unnecessary PII fields |
| Access control | restrict personal data access | logical access controls | Microsoft Entra ID SSO, RBAC, least privilege, quarterly access review |
| Encryption | protect data in transit and at rest | encryption controls | TLS, Azure-managed or customer-managed encryption, encrypted PostgreSQL and Azure Blob Storage |
| Audit logging | record access and changes | logging and monitoring | immutable `audit_logs`, admin logs, Superset access logs |
| Retention | delete or anonymize when no longer needed | retention policy and job evidence | retention timestamps and scheduled deletion jobs |
| Data subject rights | support access/deletion requests where applicable | request handling process | locate records by external identifiers and apply approved deletion/anonymization |
| Change management | controlled system changes | review, testing, approval | CI/CD gates, release manifests, approval records |
| Incident response | notify and remediate incidents | incident process | severity model, runbooks, evidence capture |
| Vendor and model risk | understand subprocessors and components | vendor risk management | self-hosted vLLM, approved model sources, license review |
| Confidentiality | protect sensitive business data | confidentiality controls | restricted buckets, masked logs, data loss prevention checks |
| Availability | meet service commitments | monitoring and recovery | SLOs, backup, DR testing, on-call |

PII handling requirements include transcript redaction where feasible, strict access to raw artifacts, masking in logs, no PII in prompt/version names, no raw PII in evaluation reports, and aggregation suppression for small groups in dashboards. Redis should not persist sensitive payloads longer than required and should avoid storing full conversation text where possible.

### Best Practices

Conduct privacy impact assessments before GA and before expanding to new regions, channels, or data categories. Use data classification labels for Azure Blob Storage buckets, PostgreSQL columns, and Superset datasets. Keep raw conversation artifacts separate from redacted versions. Give most reviewers access to redacted evidence rather than raw transcripts unless raw access is required.

For SOC2 readiness, maintain evidence for access reviews, change approvals, vulnerability management, incident response, backup tests, DR tests, monitoring, and vendor/model approvals. Compliance should review prompt instructions to ensure they do not direct the model to make employment, legal, or compliance conclusions beyond the approved QA rubric.

### Risks

Compliance risks include storing unnecessary PII, exposing raw transcripts through dashboards, insufficient retention enforcement, incomplete audit logs, unclear legal basis for processing, and inadequate handling of deletion requests. AI outputs may also contain sensitive information copied from transcripts if prompts do not restrict evidence use.

There is a risk of function creep: using audit data for purposes beyond the approved QA scope without new review. Another risk is treating self-hosting as automatically compliant. Infrastructure control reduces third-party exposure but does not eliminate privacy and security obligations.

### Recommendations

Create a compliance control owner for Auto QRA. Complete a privacy impact assessment before Limited Availability. Implement automated log masking and dashboard aggregation thresholds. Perform quarterly access reviews for admin, reviewer, compliance, and dashboard roles. Maintain SOC2-ready evidence in a central repository. Review retention and deletion jobs monthly until stable, then quarterly.

---

## 63. Production Readiness Checklist

### Purpose

The production readiness checklist provides a comprehensive launch control for Auto QRA. It ensures that product, engineering, AI quality, security, compliance, operations, support, and business teams have completed the work required for safe production use.

### Description

The checklist is grouped by domain and should be used for Pilot, Limited Availability, and General Availability. Some items may be required for GA but optional for Pilot; each readiness review should mark status, evidence link, owner, and due date. No phase should proceed unless mandatory gates are met or a documented risk acceptance is approved by the governance body.

### Business Justification

Production readiness reduces launch risk and creates shared accountability. Auto QRA affects audit operations and uses sensitive data, so readiness must cover more than application uptime. The checklist protects quality outcomes, user trust, regulatory posture, and operational continuity.

### Technical Details

Production readiness checklist:

| Group | # | Item |
|---|---:|---|
| Product and rollout | 1 | Pilot, Limited Availability, and GA scope documented |
| Product and rollout | 2 | Rollout gate metrics approved by governance council |
| Product and rollout | 3 | Eligible queues and excluded queues documented |
| Product and rollout | 4 | User personas and permissions documented |
| Product and rollout | 5 | Human override policy approved |
| Product and rollout | 6 | Reviewer training materials complete |
| Product and rollout | 7 | Supervisor dashboard training complete |
| Product and rollout | 8 | User support path published |
| Product and rollout | 9 | Release notes template approved |
| Product and rollout | 10 | Change communications plan approved |
| Architecture | 11 | Target architecture approved |
| Architecture | 12 | Azure project and network design reviewed |
| Architecture | 13 | Kubernetes namespaces configured |
| Architecture | 14 | API, worker, evaluator, and admin service boundaries documented |
| Architecture | 15 | vLLM serving architecture approved |
| Architecture | 16 | PostgreSQL sizing reviewed |
| Architecture | 17 | Redis sizing reviewed |
| Architecture | 18 | Azure Blob Storage bucket structure and access model approved |
| Architecture | 19 | Superset deployment and dataset model approved |
| Architecture | 20 | Dependency map documented |
| CI/CD | 21 | Docker builds are reproducible |
| CI/CD | 22 | CI pipeline runs formatting and lint checks |
| CI/CD | 23 | Unit tests are mandatory for protected branches |
| CI/CD | 24 | Integration tests are mandatory for protected branches |
| CI/CD | 25 | OpenAPI contract checks are mandatory |
| CI/CD | 26 | Database migration dry runs are mandatory |
| CI/CD | 27 | Container vulnerability scans are mandatory |
| CI/CD | 28 | Secret scans are mandatory |
| CI/CD | 29 | SBOM generation is enabled |
| CI/CD | 30 | Production deployments use immutable image digests |
| Data | 31 | Core schema migrations applied in staging |
| Data | 32 | Data dictionary drafted |
| Data | 33 | Conversation artifact URI conventions defined |
| Data | 34 | Redacted artifact storage path defined |
| Data | 35 | Retention periods approved |
| Data | 36 | Deletion and anonymization process tested |
| Data | 37 | Reporting views created |
| Data | 38 | Superset datasets certified |
| Data | 39 | Dashboard reconciliation tests pass |
| Data | 40 | Backup and restore test completed |
| AI quality | 41 | Golden set created and versioned |
| AI quality | 42 | Evaluation smoke set created |
| AI quality | 43 | Drift monitoring sample process defined |
| AI quality | 44 | Hallucination probes created |
| AI quality | 45 | Prompt version registry active |
| AI quality | 46 | Model version registry active |
| AI quality | 47 | Prompt promotion rules approved |
| AI quality | 48 | Model promotion rules approved |
| AI quality | 49 | Agreement target measured and met for phase |
| AI quality | 50 | Hallucination target measured and met for phase |
| AI quality | 51 | Per-parameter evaluation report reviewed |
| AI quality | 52 | Error taxonomy approved |
| AI quality | 53 | Human calibration process defined |
| AI quality | 54 | Model rollback process tested |
| AI quality | 55 | Prompt rollback process tested |
| Security | 56 | SSO integration tested |
| Security | 57 | RBAC matrix approved |
| Security | 58 | Admin access restricted |
| Security | 59 | Least privilege service accounts configured |
| Security | 60 | Secrets stored in approved manager |
| Security | 61 | TLS enforced for APIs |
| Security | 62 | Encryption at rest verified |
| Security | 63 | Network policies configured |
| Security | 64 | Container images scanned |
| Security | 65 | Critical vulnerabilities remediated or accepted |
| Security | 66 | Audit logging enabled for mutating actions |
| Security | 67 | Log masking tested |
| Security | 68 | Penetration or security review completed |
| Security | 69 | Incident response contacts documented |
| Compliance | 70 | Privacy impact assessment completed |
| Compliance | 71 | Data processing purpose documented |
| Compliance | 72 | Data subject request workflow defined |
| Compliance | 73 | Retention evidence process defined |
| Compliance | 74 | Access review process scheduled |
| Compliance | 75 | SOC2-ready change evidence stored |
| Compliance | 76 | SOC2-ready access evidence stored |
| Compliance | 77 | SOC2-ready monitoring evidence stored |
| Compliance | 78 | Model license review completed |
| Compliance | 79 | Dashboard aggregation suppression approved |
| Reliability | 80 | SLOs approved |
| Reliability | 81 | API availability monitoring active |
| Reliability | 82 | Audit latency monitoring active |
| Reliability | 83 | Queue backlog monitoring active |
| Reliability | 84 | vLLM health monitoring active |
| Reliability | 85 | PostgreSQL monitoring active |
| Reliability | 86 | Redis monitoring active |
| Reliability | 87 | Azure Blob Storage error monitoring active |
| Reliability | 88 | Superset freshness monitoring active |
| Reliability | 89 | Paging alerts configured |
| Reliability | 90 | Ticket alerts configured |
| Reliability | 91 | On-call rotation established |
| Reliability | 92 | Runbooks published |
| Reliability | 93 | Load test completed |
| Reliability | 94 | Failover test completed |
| Reliability | 95 | Disaster recovery exercise completed |
| API and integrations | 96 | OpenAPI specification published |
| API and integrations | 97 | `POST /audits` tested end to end |
| API and integrations | 98 | `GET /audits/{id}` tested end to end |
| API and integrations | 99 | Override endpoint tested end to end |
| API and integrations | 100 | Report endpoints tested |
| API and integrations | 101 | Health endpoints tested |
| API and integrations | 102 | Admin endpoints authorization tested |
| API and integrations | 103 | Idempotency behavior tested |
| API and integrations | 104 | Rate limiting tested |
| API and integrations | 105 | Error response format validated |
| Support and operations | 106 | Support runbook published |
| Support and operations | 107 | Known issues process defined |
| Support and operations | 108 | Escalation path documented |
| Support and operations | 109 | Status communication template ready |
| Support and operations | 110 | User feedback intake configured |
| Support and operations | 111 | Post-launch review scheduled |
| Support and operations | 112 | Cost monitoring dashboard ready |
| Support and operations | 113 | Business continuity plan reviewed |
| Support and operations | 114 | Rollback authority documented |
| Support and operations | 115 | GA sign-off completed |

### Best Practices

Each checklist item should have an owner and evidence link. Evidence should be objective: test output, dashboard screenshot, approval record, configuration export, runbook link, or release manifest. Readiness reviews should focus on unresolved risk rather than reciting completed work. Phase-specific requirements should be clearly marked so Pilot is not blocked by a GA-only item unless the risk is material.

### Risks

Checklist risk arises when teams mark items complete without durable evidence. Another risk is treating the checklist as a one-time launch artifact. Production readiness decays as systems, data, models, prompts, and teams change. Some items, such as access review and DR testing, must recur.

### Recommendations

Manage the checklist in a system that supports ownership, due dates, evidence links, and status. Require governance approval for exceptions. Convert recurring readiness items into operational controls after GA. Review the checklist after incidents and update it when new failure modes are discovered.

---

## 64. Future Roadmap

### Purpose

The future roadmap defines the likely evolution of Auto QRA over eight quarters. It helps stakeholders understand how the platform can mature from governed quality automation into a broader intelligence layer for quality, coaching, compliance, and operational improvement.

### Description

The roadmap is organized from Q1 to Q8 and assumes Version 1.0 is established in July 2026. Early quarters focus on stabilization, trust, rollout expansion, and measurement. Middle quarters focus on advanced analytics, workflow integrations, language and channel expansion, and model optimization. Later quarters focus on predictive quality, adaptive rubrics, deeper governance automation, and enterprise-scale intelligence.

The roadmap is directional and should be revisited quarterly based on Product KPIs, Operational KPIs, AI KPIs, regulatory developments, user feedback, and cost/performance trends.

### Business Justification

A clear roadmap prevents the product from becoming a one-time automation project. It shows how investments in data, prompts, models, dashboards, and governance compound over time. It also helps business sponsors plan adoption, training, and process redesign.

### Technical Details

| Quarter | Theme | Candidate Capabilities | Success Measures |
|---|---|---|---|
| Q1 | GA stabilization | production hardening, rollout completion, dashboard training, access review cadence | SLOs met, target agreement met, user adoption stable |
| Q2 | Workflow optimization | bulk review actions, improved override UX, supervisor coaching workflows, enhanced report filters | reduced cycle time, higher reviewer satisfaction |
| Q3 | AI quality expansion | larger golden sets, active learning, parameter-specific prompt modules, drift alerts | higher per-parameter agreement, lower override rate |
| Q4 | Scale and cost efficiency | optimized batching, model routing between 3B and 7B, GPU autoscaling improvements | lower cost per audit, stable latency |
| Q5 | Channel and language expansion | voice transcript support, multilingual evaluation, channel-specific rubrics | approved expansion metrics by segment |
| Q6 | Advanced governance | automated model cards, prompt cards, policy change impact analysis, governance workflow UI | faster approvals with stronger evidence |
| Q7 | Predictive insights | quality risk prediction, coaching recommendation prioritization, trend anomaly detection | measurable improvement in coaching outcomes |
| Q8 | Enterprise intelligence | cross-product quality intelligence, executive benchmarking, broader compliance analytics | expanded business value and governance maturity |

### Best Practices

Roadmap planning should use evidence from KPI reviews rather than stakeholder volume alone. Each roadmap item should identify whether it is primarily product, data, AI, infrastructure, security, or compliance work. AI expansion should remain gated by evaluation quality. New languages, channels, or regulatory contexts should not be assumed safe because the English chat use case works.

Architectural roadmap items should reduce complexity where possible. For example, model routing should be introduced only when there is enough traffic and evaluation evidence to justify maintaining multiple model paths.

### Risks

Roadmap risks include overexpansion before trust is established, adding features without governance capacity, underestimating multilingual complexity, and chasing model upgrades without business benefit. Predictive coaching features can create higher fairness and compliance risk than retrospective audit assistance.

Another risk is platform sprawl. Without strong product discipline, Auto QRA could accumulate unrelated analytics requests and become difficult to maintain.

### Recommendations

Use quarterly planning with explicit entry criteria for AI expansion. Keep GA stabilization as the priority until core SLOs and AI KPIs are stable. Require privacy and governance review for roadmap items that change data use, employee impact, or automation authority. Maintain a technology debt budget for infrastructure, evaluation, and observability improvements.

---

## 65. Appendix

### Purpose

The appendix provides shared reference material for readers who need definitions, acronyms, architecture context, assumptions, open questions, and decision history. It supports consistent understanding across product, engineering, operations, compliance, and executive stakeholders.

### Description

This appendix includes a glossary, acronym list, reference architecture summary, assumption log, open questions, and decision log. These supporting materials should be maintained as the design evolves. The appendix is not a substitute for detailed architecture diagrams, runbooks, or control evidence, but it provides a compact reference for the DevOps, API, and governance sections.

### Business Justification

Enterprise design packages are used by diverse stakeholders. Shared definitions reduce misinterpretation, especially for terms such as agreement, hallucination, override, prompt version, model version, and effective score. Assumption and decision logs improve transparency and help future teams understand why choices were made.

### Technical Details

#### Glossary

| Term | Definition |
|---|---|
| Audit | A quality review record for a conversation, including AI-generated scores, evidence, versions, and lifecycle status. |
| Audit score | A score assigned to a specific QA parameter for an audit. |
| Effective score | The score used for reporting after applying any accepted human override. |
| Human override | A documented human change to an AI-generated audit result. |
| Golden set | A curated and versioned evaluation dataset with human reference labels. |
| Hallucination | An unsupported model claim that is not grounded in the conversation or approved policy context. |
| Prompt version | An immutable versioned prompt artifact with metadata, evaluation evidence, and status. |
| Model version | An immutable model artifact and serving configuration registered for evaluation or production use. |
| vLLM | A high-throughput model serving engine used for self-hosted inference. |
| QA parameter | A defined quality criterion used to evaluate a conversation. |
| RACI | A responsibility model identifying who is responsible, accountable, consulted, and informed. |
| SLO | A service level objective used to define expected production performance. |

#### Acronyms

| Acronym | Meaning |
|---|---|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| CCPA | California Consumer Privacy Act |
| CI/CD | Continuous Integration and Continuous Delivery |
| DDL | Data Definition Language |
| DR | Disaster Recovery |
| ER | Entity Relationship |
| GA | General Availability |
| Azure | Microsoft Azure |
| Azure Blob Storage | Azure Blob Storage |
| GDPR | General Data Protection Regulation |
| KPI | Key Performance Indicator |
| Kubernetes | Container orchestration platform, often abbreviated as K8s |
| PII | Personally Identifiable Information |
| QA | Quality Assurance |
| QRA | Quality Review Automation |
| RBAC | Role-Based Access Control |
| REST | Representational State Transfer |
| SBOM | Software Bill of Materials |
| SOC2 | Service Organization Control 2 |
| SRE | Site Reliability Engineering |
| SSO | Single Sign-On |

#### Reference architecture summary

Auto QRA runs on Azure with Docker images deployed to Kubernetes. REST API services receive audit requests and enforce SSO/RBAC. Audit workers use Redis queues, load conversation artifacts from Azure Blob Storage, render approved prompts, call a model gateway, and receive structured output from self-hosted vLLM serving quantized 3B or 7B models. PostgreSQL stores audits, scores, overrides, version metadata, users, roles, and audit logs. Superset reads governed reporting views for dashboards. Azure Blob Storage stores raw and redacted conversation artifacts, prompt templates, model artifacts, evaluation datasets, and report exports.

The system is designed for 60,000 audits per month, 30 QA parameters, p95 latency under 60 seconds, 99.9% availability, greater than 90% agreement with human QA, and less than 5% hallucination. Human override remains part of the core workflow.

#### Assumption log

| ID | Assumption | Impact if False | Owner |
|---|---|---|---|
| A-001 | Conversation artifacts can be stored in Azure Blob Storage with approved retention controls. | Storage and privacy architecture must be revised. | Data Governance |
| A-002 | Historical human-scored audits are available for golden-set creation. | Pilot evaluation timeline extends. | QA Operations |
| A-003 | SSO groups can be mapped to Auto QRA RBAC roles. | Custom identity workflow required. | Security |
| A-004 | Quantized 7B model can meet p95 latency under 60s at planned concurrency. | GPU capacity or model routing plan must change. | AI Platform |
| A-005 | Superset is the approved dashboard platform. | Reporting requirements must be remapped. | Product Analytics |
| A-006 | PostgreSQL can support transactional workload with reporting views or replicas. | Additional warehouse or serving layer may be needed. | Engineering |
| A-007 | Human override is legally and operationally sufficient for disputed scores. | Governance workflow must be expanded. | Compliance |
| A-008 | Initial launch is English-first unless otherwise approved. | Multilingual evaluation must be accelerated. | Product |

#### Open questions

| ID | Question | Required By | Owner |
|---|---|---|---|
| Q-001 | What is the exact minimum aggregation threshold for dashboard privacy? | Limited Availability | Compliance |
| Q-002 | Which 30 QA parameters are in the first production catalog? | Pilot | QA Operations |
| Q-003 | What retention period applies to raw transcripts versus redacted evidence? | Pilot | Data Governance |
| Q-004 | Which GPU profile is approved for production vLLM serving? | Pilot | SRE |
| Q-005 | What is the final severity model for AI quality incidents? | Limited Availability | AI Owner |
| Q-006 | Which external systems will consume report APIs directly? | Limited Availability | Product |
| Q-007 | What threshold triggers automatic rollback versus manual investigation? | GA | SRE and AI Owner |
| Q-008 | Are any queues subject to region-specific privacy restrictions? | GA expansion | Legal |

#### Decision log

| ID | Decision | Rationale | Date |
|---|---|---|---|
| D-001 | Use self-hosted vLLM on Azure. | Supports data control, cost management, and enterprise deployment requirements. | July 2026 |
| D-002 | Use PostgreSQL as the system of record. | Provides transactional consistency and mature governance controls. | July 2026 |
| D-003 | Use Redis for queues and transient workflow state. | Supports scalable asynchronous audit processing. | July 2026 |
| D-004 | Use Superset for dashboards. | Aligns with specified reporting platform and enables governed BI. | July 2026 |
| D-005 | Persist prompt and model versions on every audit. | Required for traceability, rollback, and dispute resolution. | July 2026 |
| D-006 | Preserve human override in GA. | Required for governance, trust, and contested outcomes. | July 2026 |
| D-007 | Require AI evaluation gates for prompt and model promotion. | Required to meet agreement and hallucination targets. | July 2026 |
| D-008 | Use phased rollout with Pilot, Limited Availability, and GA gates. | Reduces operational and AI quality risk. | July 2026 |

### Best Practices

Keep appendix entries short, current, and linked to source artifacts where available. Update assumptions and open questions during each phase gate. Close decision log entries only by adding superseding decisions, not by deleting historical context. Use consistent terminology across APIs, dashboards, runbooks, and training materials.

### Risks

Appendix risks include becoming stale, duplicating source-of-truth systems, or hiding unresolved decisions. If assumptions are not reviewed, teams may build on invalid premises. If glossary terms differ from dashboard labels or API fields, users may misinterpret metrics.

### Recommendations

Review the appendix at every major release and rollout gate. Promote stable glossary terms into product training and API documentation. Convert open questions into owned work items with due dates. Store the decision log in a durable repository and link decisions to release manifests, governance records, and architecture diagrams.
