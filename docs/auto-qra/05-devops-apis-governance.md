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
