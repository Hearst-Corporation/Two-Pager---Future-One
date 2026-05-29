# ORACLE_INSTITUTIONAL_GAPS.md
## What's Missing for Real Institutional Use

---

## 1. AUDIT TRAIL (Incomplete)

**What exists:**
- `activity_log` table tracks status changes
- `events` table tracks user actions
- `hearst_advisor_logs` table tracks LLM calls

**What's missing:**
- ❌ No immutable audit log (activity_log can be deleted)
- ❌ No blockchain or WORM storage for critical decisions
- ❌ No audit report generation
- ❌ No compliance framework mapping (SOC2, ISO27001)

**Severity:** HIGH

---

## 2. DATA LINEAGE (Missing)

**What exists:**
- `source_id` fields on some scenario columns
- `calcSourceScore()` tracks 12 source fields

**What's missing:**
- ❌ No full data lineage graph (input → calculation → output)
- ❌ No provenance tracking for memo generation
- ❌ No versioning of source data
- ❌ No "what-if" history (can't replay old assumptions)

**Severity:** HIGH

---

## 3. MODEL GOVERNANCE (Missing)

**What exists:**
- LLM prompt templates
- Quality checks (banned phrases, citation count)

**What's missing:**
- ❌ No model versioning (which prompt version generated which memo)
- ❌ No A/B testing framework for prompts
- ❌ No human-in-the-loop approval before memo persistence
- ❌ No model drift detection
- ❌ No bias auditing

**Severity:** HIGH

---

## 4. ACCESS CONTROL (Broken)

**What exists:**
- Role enum: admin/editor/viewer
- Auth guards with shared workspace bypass

**What's missing:**
- ❌ Row-level ownership on core tables (operators, partners, initiatives)
- ❌ Field-level permissions (e.g., hide financials from viewers)
- ❌ Approval workflows (e.g., memo must be approved before shared)
- ❌ Session timeout / idle logout
- ❌ 2FA / MFA
- ❌ IP allowlisting

**Severity:** CRITICAL

---

## 5. DISASTER RECOVERY (Missing)

**What exists:**
- Supabase managed backups (implied)

**What's missing:**
- ❌ Documented RTO/RPO
- ❌ Cross-region replication
- ❌ Offline export capability
- ❌ Backup verification procedures
- ❌ Runbook for data corruption

**Severity:** HIGH

---

## 6. REGULATORY COMPLIANCE (Missing)

**What exists:**
- Data freshness tracking
- Confidence scoring

**What's missing:**
- ❌ GDPR compliance (data deletion, portability)
- ❌ Qatar data residency guarantees
- ❌ Financial services regulation alignment
- ❌ Export control compliance (US chip restrictions)
- ❌ SOX-style financial controls

**Severity:** HIGH

---

## 7. INTEGRATION APIs (Missing)

**What exists:**
- Internal REST API for CRM
- LLM API integrations (Kimi, Anthropic, OpenAI)

**What's missing:**
- ❌ No public API for external systems
- ❌ No webhook system
- ❌ No Salesforce/HubSpot integration
- ❌ No email/SMS notifications
- ❌ No calendar integration
- ❌ No document storage integration (S3, SharePoint)

**Severity:** MEDIUM

---

## 8. REPORTING & EXPORTS (Incomplete)

**What exists:**
- PDF generation route (unverified)
- Markdown export (`buildMemoMarkdown()`)
- Dossier inline rendering

**What's missing:**
- ❌ Verified PDF quality (layout, charts, branding)
- ❌ Excel/CSV export for projections
- ❌ PowerPoint generation
- ❌ Scheduled report delivery
- ❌ Custom report builder
- ❌ Print-optimized layouts

**Severity:** HIGH

---

## 9. REAL-TIME DATA (Fake)

**What exists:**
- Static intelligence datapoints (~140)
- Hardcoded energy tariffs
- Placeholder GPU pricing scrapers

**What's missing:**
- ❌ Live GPU pricing API (all scrapers fail or return static)
- ❌ Live energy tariff API
- ❌ Live market data feeds
- ❌ Live news/sentiment analysis
- ❌ Weather data for cooling calculations
- ❌ Grid capacity data

**Severity:** CRITICAL

---

## 10. SCENARIO COMPARISON (Basic)

**What exists:**
- Multiple scenario storage
- Versioning per scenario
- Sensitivity matrix

**What's missing:**
- ❌ Side-by-side scenario comparison UI
- ❌ Scenario diff (what changed between versions)
- ❌ Monte Carlo simulation
- ❌ Probabilistic outputs (confidence intervals)
- ❌ Scenario merge / conflict resolution

**Severity:** MEDIUM

---

## 11. USER ONBOARDING (Missing)

**What exists:**
- Magic link login
- Profile creation

**What's missing:**
- ❌ Guided tour
- ❌ Tutorial scenarios
- ❌ Help documentation
- ❌ Video walkthroughs
- ❌ In-app contextual help
- ❌ FAQ / knowledge base

**Severity:** MEDIUM

---

## 12. PERFORMANCE & SCALING (Unverified)

**What exists:**
- Next.js 14 with App Router
- Supabase for database

**What's missing:**
- ❌ Load testing results
- ❌ Performance benchmarks
- ❌ CDN configuration
- ❌ Edge caching
- ❌ Database query optimization
- ❌ Connection pooling

**Severity:** MEDIUM

---

## 13. TESTING (Insufficient)

**What exists:**
- Some test files in `test/` and `tests/`

**What's missing:**
- ❌ Unit tests for financial engine
- ❌ Integration tests for memo generation
- ❌ E2E tests for critical flows
- ❌ Load tests
- ❌ Security tests (penetration testing)
- ❌ Accessibility tests

**Severity:** HIGH

---

## 14. DOCUMENTATION (Incomplete)

**What exists:**
- README.md
- CLAUDE.md
- Some inline comments

**What's missing:**
- ❌ API documentation (OpenAPI/Swagger)
- ❌ Architecture diagrams
- ❌ Deployment guide
- ❌ Operations runbook
- ❌ Security policy
- ❌ Data dictionary

**Severity:** MEDIUM

---

## 15. MONITORING & ALERTING (Minimal)

**What exists:**
- Sentry integration (`@sentry/nextjs`)
- Console logging

**What's missing:**
- ❌ Application performance monitoring (APM)
- ❌ Business metrics dashboard
- ❌ Alerting on memo generation failures
- ❌ Alerting on data freshness expiration
- ❌ Health check endpoints
- ❌ Uptime monitoring

**Severity:** MEDIUM
