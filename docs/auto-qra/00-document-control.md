# Auto QRA — Document Control and Architecture Review Brief

**Version:** 1.1  
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
