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
