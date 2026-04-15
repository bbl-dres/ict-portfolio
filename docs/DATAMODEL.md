# DATAMODEL

**Project:** DRES PPM — Digital Initiative Portfolio Tool  
**Owner:** Digital Real Estate and Support (DRES), Federal Office for Buildings and Logistics (BBL)  
**Version:** 0.2 — April 2026  
**Status:** Draft

---

## Entities

### `project`

Core entity representing a digital initiative tracked through the DRES demand-to-delivery process.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | integer | yes | Auto-increment primary key |
| `title` | string (200) | yes | Name of the initiative |
| `description` | text | no | Short summary of what the initiative is about and why it exists |
| `requestor` | string (200) | yes | Requesting unit or stakeholder |
| `budget_chf` | integer | yes | Estimated budget in CHF |
| `type` | enum | yes | See type enum below |
| `complexity` | enum | yes | See complexity enum below |
| `phase` | enum | yes | See phase enum below |
| `priority` | enum | no | See priority enum below; default `medium` |
| `go_decision` | boolean / null | no | `null` = pending, `true` = approved |
| `go_date` | date / null | no | Date the go-decision was made |
| `responsible` | string (100) | no | Responsible person (BA or external PM) |
| `notes` | text | no | Free text: description, dependencies, references |
| `tags` | string[] | no | Free-text labels (e.g. `["SAP", "BFS"]`) |
| `target_date` | date / null | no | Target completion date |
| `dti_required` | boolean | no | DTI notification required (≥ CHF 1M or strategic) |
| `hermes_phase` | enum / null | no | Current HERMES phase if applicable |
| `thumbnail` | string (200) / null | no | Relative path to project thumbnail image |
| `jira_key` | string (20) / null | no | Linked Jira issue key (e.g. `DRESPPM-42`) |
| `gever_url` | string (500) / null | no | URL to ActaNova GEVER dossier with project documentation |
| `created_by` | integer FK → `user.id` | yes | User who created the record |
| `created_at` | datetime | yes | Set automatically on creation |
| `updated_at` | datetime | yes | Updated automatically on every change |

**Enum `type`**

| Value | Description |
|---|---|
| `incident` | Incident or support ticket (Störung / Support) |
| `new` | New system, platform, or capability |
| `change` | Enhancement or transformation of an existing system |
| `migration` | Migration from one system or format to another |
| `study` | Feasibility study, evaluation, or proof of concept |
| `data` | Data quality, enrichment, capture, or cleansing initiative (Datenbewirtschaftung) |

**Enum `complexity`**

| Value | Condition |
|---|---|
| `fast_track` | Budget < CHF 50k and no critical system dependencies |
| `standard` | Budget ≥ CHF 50k or at least one critical dependency |
| `complex` | Budget ≥ CHF 50k and critical dependency, or strategically relevant / DTI-notifiable |

**Enum `phase`**

| Value | Description |
|---|---|
| `triage` | Received, not yet classified |
| `analysis` | Solution concept in progress (standard / complex only) |
| `implementation` | Go granted, project running |
| `completed` | Go-live done, operations handed over |
| `rejected` | Initiative declined or withdrawn |

**Enum `priority`**

| Value | Description |
|---|---|
| `low` | Nice to have, no urgency |
| `medium` | Normal priority, planned timeline |
| `high` | Urgent, immediate attention required |

**Enum `hermes_phase`**

| Value |
|---|
| `initialisation` |
| `concept` |
| `realisation` |
| `introduction` |
| `closure` |

---

### `user`

Represents an authenticated user. In production, populated from the Atlassian/Confluence session — no separate registration flow required.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | integer | yes | Auto-increment primary key |
| `username` | string (100) | yes | Atlassian account ID or username |
| `display_name` | string (200) | yes | Full name as shown in the UI |
| `email` | string (200) | yes | Email address |
| `role` | enum | yes | See role enum below |
| `created_at` | datetime | yes | First login or manual creation |

**Enum `role`**

| Value | Permissions |
|---|---|
| `viewer` | Read-only access to all projects and comments |
| `analyst` | Create and edit projects, write and edit own comments |
| `owner` | All analyst permissions plus: grant go-decisions, advance or reject phase |
| `admin` | Full access including user role management |

---

### `comment`

Free-text comments attached to a project. Supports team discussion and informal documentation within the tool.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | integer | yes | Auto-increment primary key |
| `project_id` | integer FK → `project.id` | yes | Parent project |
| `user_id` | integer FK → `user.id` | yes | Comment author |
| `body` | text | yes | Comment content |
| `created_at` | datetime | yes | Set automatically on creation |
| `updated_at` | datetime / null | no | Set if comment is edited; `null` if unmodified |

---

### `change_log`

Immutable, field-level audit trail. Every change to a project record is recorded automatically. No manual entries, no deletions.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | integer | yes | Auto-increment primary key |
| `project_id` | integer FK → `project.id` | yes | Affected project |
| `user_id` | integer FK → `user.id` | yes | User who triggered the change |
| `field` | string (100) | yes | Name of the changed field (e.g. `phase`, `go_decision`) |
| `old_value` | text / null | no | Previous value, JSON-serialised; `null` on creation |
| `new_value` | text | yes | New value, JSON-serialised |
| `changed_at` | datetime | yes | Timestamp of the change |

---

## Relationships

```
user         ||--o{  project     : "created_by / owns"
user         ||--o{  comment     : "writes"
user         ||--o{  change_log  : "triggers"
project      ||--o{  comment     : "has"
project      ||--o{  change_log  : "tracked by"
```

---

## Persistence Options

### Option A — sql.js (SQLite in the browser)

Best for: read-heavy usage, small team, no server available.

```
/index.html      app shell
/app.js          application logic
/db.sqlite       database file (loaded into memory at startup)
```

Writes are held in memory during the session. Persistence requires either a manual export (download updated `.sqlite`) or a backend endpoint to commit the file. **Not suitable for concurrent multi-user editing.**

### Option B — Jira REST API

Best for: production use, multi-user, existing Atlassian tenant at BBL.

```
Jira project:    DRESPPM
Issue type:      Project
Custom fields:   complexity, budget_chf, phase, go_decision, dti_required
Comments:        native Jira comments (replaces comment entity)
Change history:  native Jira audit log (replaces change_log entity)
```

IAM is handled by the Atlassian session — no additional authentication code required. Comments and change history come for free. Requires admin setup of custom fields and API access.

### Option C — JSON flat file in repository

Best for: prototype or demo, very small team with Git access.

```
/data/projects.json     project records
/data/users.json        user records
/data/comments.json     comments
/data/changelog.json    change log
```

All writes require a manual commit or a GitHub Action triggered by a form submission. No concurrent editing. Fully version-controlled — every change is a Git commit with full diff.

---

## JSON Example

```json
{
  "project": {
    "id": 4,
    "title": "SAP RE-FX EGID Integration",
    "description": "Integration der EGID-Gebäudeidentifikatoren aus dem BFS-Register in SAP RE-FX zur eindeutigen Zuordnung von Immobilienobjekten.",
    "requestor": "Informatik BBL",
    "budget_chf": 620000,
    "type": "change",
    "complexity": "complex",
    "phase": "triage",
    "priority": "high",
    "go_decision": null,
    "go_date": null,
    "responsible": "BA DRES",
    "notes": "EGID governance by design. BIT SUPERB involved. DTI notification required.",
    "tags": ["SAP", "BFS", "EGID"],
    "target_date": "2027-03-31",
    "dti_required": true,
    "hermes_phase": null,
    "thumbnail": "assets/images/project-02.jpg",
    "jira_key": null,
    "created_by": 1,
    "created_at": "2026-04-13T08:00:00Z",
    "updated_at": "2026-04-13T08:00:00Z"
  },
  "comments": [
    {
      "id": 1,
      "project_id": 4,
      "user_id": 2,
      "body": "Awaiting scope confirmation from BIT SUPERB before moving to analysis.",
      "created_at": "2026-04-13T09:30:00Z",
      "updated_at": null
    }
  ],
  "change_log": [
    {
      "id": 1,
      "project_id": 4,
      "user_id": 1,
      "field": "phase",
      "old_value": null,
      "new_value": "\"triage\"",
      "changed_at": "2026-04-13T08:00:00Z"
    },
    {
      "id": 2,
      "project_id": 4,
      "user_id": 2,
      "field": "budget_chf",
      "old_value": "580000",
      "new_value": "620000",
      "changed_at": "2026-04-13T11:15:00Z"
    }
  ]
}
```
