```md
## 2. Immediate: Add high-value quality & accuracy upgrades (context-aware)

### 2a) Deterministic “cheap gate” (job-aware, before LLM judge)

Apply fast, rule-based checks **conditioned on job type and modification level** to catch obvious failures consistently and cheaply.

| Job Type | Expectation |
|----------|-------------|
| **Co-op / Internship** | Learning-focused, simpler phrasing acceptable |
| **Full-time Position** | Emphasize impact and delivery |
| **Aggressive Rewrite** | Large structural change allowed, but still no fabrication |

#### Cheap gate rules (examples)

**Near-duplicate / no-op**  
Original:  
> “Managed a team of engineers.”

Suggestion:  
> “Managed a team of engineers.”

→ Flag: `no_meaningful_change`

---

**Too generic (job-aware)**  
Suggestion (Full-time):  
> “Worked on various important projects.”

→ Flag: `too_generic_for_fulltime`

Same suggestion (Internship):  
> “Worked on various projects while learning new tools.”

→ Acceptable

---

**Missing impact when expected**  
Context:  
> “Led a migration project.”

Suggestion (Full-time):  
> “Led a migration project.”

→ Flag: `no_outcome_or_metric`

---

**Behavior**
If cheap gate triggers:
- Skip LLM judge OR
- Force `recommendation = regenerate`
- Log `cheap_gate_reason`

This improves:
- speed,
- consistency,
- and avoids wasting judge calls on low-quality output.

---

### 2b) Faithfulness + Modification-Level–aware judging

Use the two inputs already passed to the LLM:
- **Job type** (Internship vs Full-time)
- **Modification level** (Conservative / Moderate / Aggressive)

to control **how much change is allowed** and **what quality means**.

#### Modification levels

| Level | Allowed Change | Judge Interpretation |
|-------|----------------|---------------------|
| **Conservative (15–25%)** | Keywords + light restructuring | Meaning must remain nearly identical |
| **Moderate (35–50%)** | Restructure for impact | Reordering and emphasis allowed |
| **Aggressive (60–75%)** | Major rewrite | Full reorganization allowed, still no new facts |

---

#### Example: same input, different levels

Original:  
> “Worked on data analysis for sales reports.”

**Conservative (Internship)**  
> “Assisted with data analysis for sales reports using Excel.”

✅ Light rewrite  
❌ Not allowed: “increased revenue by 20%”

---

**Moderate (Full-time)**  
> “Analyzed sales data to produce weekly reports supporting business decisions.”

✅ Impact-focused rewrite  
❌ Not allowed: invented metrics

---

**Aggressive (Full-time)**  
> “Led end-to-end sales data analysis workflows, delivering actionable reports to stakeholders.”

✅ Stronger positioning  
❌ Not allowed: “boosted revenue by 30%” unless present in source

---

### Judge rubric update (required)

Add the following constraint:

> **Faithfulness + Modification Constraint**  
> The suggestion must:
> - NOT introduce facts, metrics, tools, or achievements not present in the source text  
> - Respect the allowed modification level  
> - Penalize:
>   - **over-modification** when Conservative is required  
>   - **under-modification** when Aggressive is required  

Judge checks:
1. Did the suggestion invent information? (hard penalty)
2. Did it respect the modification level?
3. Did it match job-type expectations (intern vs full-time)?

---

### Value of this change

This ensures:
- **Accuracy**: prevents hallucinated achievements
- **Relevance**: intern vs full-time roles judged differently
- **Consistency**: generator and judge follow the same transformation rules
- **Trust**: users are not shown fabricated or misleading improvements
```
