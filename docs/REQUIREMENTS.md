# REQUIREMENTS

**Project:** DRES PPM — Digital Initiative Portfolio Tool  
**Owner:** Digital Real Estate and Support (DRES), Federal Office for Buildings and Logistics (BBL)  
**Version:** 0.2 — April 2026  
**Status:** Draft

---

## Guiding Principle

> As much governance as necessary, as little administration as possible.  
> We use existing federal standards (HERMES, KBB/Perimap) and evaluate solution variants against the principles of the Federal Digital Transformation Strategy.

---

## 1. Purpose

The DRES PPM tool provides a lightweight interface for capturing, tracking, and governing digital initiatives within the DRES team. It does not replace existing federal tools (SAP PPM, HERMES Online), but serves as a practical working instrument for the team and its leadership.

---

## 2. Context

Digital initiatives at DRES follow a three-stage process:

| Stage | Description | Applies to |
|---|---|---|
| **Intake & Triage** | All requests enter via Service Center. The Business Analyst classifies each request and assigns a process class. | All initiatives |
| **Analysis & Solution** | BA prepares a solution concept as a decision basis: feasibility, cost estimates, variants, procurement strategy, and optional architecture review. | Standard / Complex only |
| **Selection & Implementation** | Portfolio committee prioritises. Procurement runs (BöB/VöB if applicable). Implementation follows HERMES. No go-live without a defined SLA and support plan. | All initiatives |

**Process classes:**

| Class | Condition |
|---|---|
| Fast Track | Budget < CHF 50k, no critical system dependencies → direct implementation |
| Standard | Budget ≥ CHF 50k or at least one critical dependency → requires solution concept |
| Complex | Budget ≥ CHF 50k and critical dependency, or strategically relevant / DTI-notifiable → requires solution concept + architecture review |

---

## 3. Functional Requirements

### 3.1 Project Capture

- Capture a new initiative with the following required fields: title, requestor, budget (CHF), process class
- Optional fields: notes, dependencies, responsible person, Jira key
- Process class is suggested based on budget and dependency inputs but can be overridden manually
- DTI notification flag is set automatically when budget ≥ CHF 1M or class is `complex`

### 3.2 Portfolio Overview

- Tabular view of all initiatives with filtering by class and phase
- Budget sum displayed per active filter selection
- Quick summary: initiative count per phase
- Click on a row to expand inline detail view — no separate page or modal

### 3.3 Status Management

- Phase transitions: Triage → Analysis → Implementation → Completed
- Go-decision can be set to approved — only by users with `owner` or `admin` role
- Initiatives can be rejected at any phase, with mandatory notation
- All state changes are recorded automatically in the change log

### 3.4 Comments

- Users can add free-text comments to any initiative
- Comments are visible to all users with at least `viewer` role
- Comments can be edited by their author; edits are flagged with `updated_at`
- No threaded replies in v1 — flat comment list only

### 3.5 Change History

- Every field-level change to a project record is logged automatically (field, old value, new value, user, timestamp)
- Change log is immutable — no editing or deletion of entries
- Change log is visible in the detail view, collapsed by default

### 3.6 User Management

- Users are identified via Atlassian/Confluence session — no separate registration
- Roles: `viewer` / `analyst` / `owner` / `admin`
- Role assignment is managed by `admin` users within the tool
- In demo mode (not embedded in Confluence), a read-only guest session is shown with test data

### 3.7 Visibility and Access Control

- App checks on load whether it is embedded from `confluence.bbl.admin.ch` (via `document.referrer`)
- If correctly embedded: live mode with real data
- Otherwise: demo mode with test data and a visible warning banner
- No standalone login — IAM is handled by the Atlassian session of the authenticated user

### 3.8 Confluence Embedding

- App runs as a static page (GitHub Pages or equivalent)
- Embedded via iframe in a Confluence page (Confluence iframe macro)
- No Atlassian plugin, no build system, no dedicated server

---

## 4. Non-Functional Requirements

| Requirement | Description |
|---|---|
| No build toolchain | Vanilla JS, plain HTML/CSS — no dependency on Node, npm, or bundlers |
| No server | Static hosting (GitHub Pages or equivalent), no server-side logic |
| No frontend frameworks | No React, Vue, Angular — maximise longevity and maintainability |
| Data sovereignty | Data resides either in Jira (BBL Atlassian tenant) or as a SQLite file in the repository |
| Auditability | All changes to project records are logged with user, timestamp, and field-level detail |
| Accessibility | Sufficient colour contrast, keyboard navigation for core interactions |
| Language | Interface in German; code, data model, and documentation in English |

---

## 5. Open Questions

| # | Question | Priority |
|---|---|---|
| 1 | Is the Confluence iframe macro enabled on the BBL Confluence instance? | High |
| 2 | Is SAP PPM already licensed and configured at BBL — and if so, should this tool integrate with it? | High |
| 3 | Who is authorised to set the go-decision — requestor, BA, or a named approver? | High |
| 4 | Will BIT process requests that have not been captured through this tool? How strictly should the process be enforced? | Medium |
| 5 | Will BBL finance accept budget bookings for initiatives not captured in the portfolio? | Medium |
| 6 | GitHub Pages (public URL) or internal hosting (BBL web server)? | Medium |
| 7 | Jira API integration for persistence, or SQLite flat file in the repo? | Medium |
| 8 | Is there a portfolio committee already — who sits on it, what is its cadence, and who has decision authority? | High |
| 9 | Should initiatives rejected by the committee be retained in the system for reporting, or archived? | Low |

---

## 6. Out of Scope (v1)

- Full HERMES project management (use HERMES Online for that)
- Procurement workflow (use KBB Perimap for that)
- Budget approval workflow (handled outside this tool)
- Mobile-optimised interface
- Notifications or email alerts
- Integration with SAP PPM (potential v2)
- Multi-language interface (German only in v1)

---

## 7. References and Standards

| Reference | Relevance |
|---|---|
| DTI — Federal Digital Transformation and ICT Governance Directives | Notification obligations, governance thresholds |
| HERMES Online (hermes.admin.ch) | Project phases, deliverables |
| KBB Vorlagenplattform Perimap | Procurement templates, procedure thresholds |
| Federal Procurement Act (BöB) | Mandatory tendering above threshold |
| Federal Procurement Ordinance (VöB) | Market assessment Art. 15, procedure types |
| EMBAG Art. 9 | Open-source obligation for software procurement |
| Federal Digital Transformation Strategy | Evaluation principles for solution variants |
| UA VBS Confluence | Enterprise architecture reference patterns |
