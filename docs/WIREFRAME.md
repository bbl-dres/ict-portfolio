# WIREFRAME

**Project:** DRES PPM — Digital Initiative Portfolio Tool  
**Owner:** Digital Real Estate and Support (DRES), Federal Office for Buildings and Logistics (BBL)  
**Version:** 0.1 — April 2026  
**Status:** Draft

---

## Layout Overview

The application uses a single-page layout with a fixed header, a persistent action bar below it, and a main content area that renders one of four views. A detail panel slides in from the right when a project is selected.

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                     │
│  Logo + Title                                    User Menu  │
├─────────────────────────────────────────────────────────────┤
│  ACTION BAR                                                 │
│  Search | View Toggles | Filters | Group By     + Projekt   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MAIN CONTENT                                               │
│  (List | Gallery | Kanban | Gantt)                          │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 1 — Header

Fixed bar at the top. Minimal — branding and user context only.

```
┌─────────────────────────────────────────────────────────────┐
│  [CH]  DRES PPM                                             │
│        Bundesamt für Bauten und Logistik        [A. Wyss ▾] │
└─────────────────────────────────────────────────────────────┘
```

| Element | Description |
|---|---|
| Logo | Swiss coat of arms (ch.png), 32 × 32 px |
| Title | Two-line: "DRES PPM" (bold) + "Bundesamt für Bauten und Logistik" (small) |
| User menu | Avatar + display name, dropdown with role badge and logout |

---

## 2 — Action Bar

Persistent toolbar below the header. Controls apply to **all four views** consistently — switching views does not reset search, filters, or grouping.

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Suche...    [List][Gallery][Kanban][Gantt]               │
│                                                              │
│  [Filter ▾]  [Gruppierung ▾]       12 Projekte  [+ Projekt] │
│  ┌──────┐ ┌──────┐ ┌──────────┐                             │
│  │Triage│ │≥100k │ │Fast Track│  ← active filter pills      │
│  └──────┘ └──────┘ └──────────┘                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 — Search

| Aspect | Detail |
|---|---|
| Position | Left-aligned, expandable input with search icon |
| Behaviour | Live filtering with 300 ms debounce |
| Fields searched | `title`, `requestor`, `responsible`, `jira_key`, `notes` |
| Clear | × button inside input when non-empty |

### 2.2 — View Toggles

Four icon buttons in a toggle group. Only one active at a time.

| Icon | View | Description |
|---|---|---|
| ☰ | List | Default. Tabular rows |
| ▦ | Gallery | Card grid with thumbnail images |
| ▣ | Kanban | Columns grouped by phase |
| ▬ | Gantt | Horizontal timeline bars |

Active button gets accent background. Switching views preserves the current search, filter, and group-by state.

### 2.3 — Filter Button & Modal

**Button:** "Filter" label with tune icon. Shows a count badge when filters are active. Click opens a modal overlay.

**Filter Modal:**

```
┌───────────────────────────────────────────────────┐
│  Filter                                [Reset][×] │
├───────────────────────────────────────────────────┤
│                                                   │
│  Phase          Komplexität          Budget             │
│  ○ Triage       ○ Fast Track    ○ < 50k           │
│  ○ Analysis     ○ Standard      ○ 50k – 200k     │
│  ○ Implementa…  ○ Complex       ○ 200k – 500k    │
│  ○ Completed                    ○ > 500k          │
│  ○ Rejected                                       │
│                                                   │
│  Verantwortlich   DTI-pflichtig   HERMES           │
│  ○ S. Keller      ○ Ja            ○ Initialisation │
│  ○ L. Meier       ○ Nein          ○ Concept        │
│  ○ A. Wyss                        ○ Realisation    │
│  ○ (nicht zug.)                    ○ Introduction   │
│                                                    │
└────────────────────────────────────────────────────┘
```

Six filter categories, rendered as a responsive multi-column grid. Each option is a clickable pill — selected options get accent background. Multiple selections within a category are OR-combined; across categories they are AND-combined.

**Filter Pills:** Active filters appear as removable pills below the toolbar. Click the × on a pill to remove that filter.

### 2.4 — Group By

Dropdown with options that apply to **all views** consistently:

| Option | Effect |
|---|---|
| Keine | No grouping (flat list) |
| Phase | Group by `phase` enum (Triage → Rejected) |
| Komplexität | Group by `complexity` (Fast Track, Standard, Complex) |
| Verantwortlich | Group by `responsible` person |
| DTI-pflichtig | Group by `dti_required` (Ja / Nein) |

Each group shows a **collapsible header** with the group name, a colour indicator, and a count badge. Groups can be collapsed/expanded independently.

How grouping maps to each view:

- **List:** Grouped table sections with a header row per group
- **Gallery:** Grouped card sections with a header bar per group
- **Kanban:** Horizontal swimlanes within each column
- **Gantt:** Grouped row sections in the sidebar and bar area

### 2.5 — Project Count & Create Button

- **Count:** "12 Projekte" — updates live as filters change
- **+ Projekt:** Primary accent button, opens the create/edit form (see section 7)

---

## 3 — List View (Default)

Tabular view inspired by task-canvas. Each row is one project. Clicking a row opens the detail panel.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ▾ Triage (3)                                                           │
│  ┌─────┬────────────────────────┬───────────┬─────────┬──────┬────────┐ │
│  │ Key │ Titel                  │ Auftragg. │ Budget  │Phase │ Komplexität │ │
│  ├─────┼────────────────────────┼───────────┼─────────┼──────┼────────┤ │
│  │ —   │ IoT Sensorik Gebäude…  │ Energie…  │ 1.2 M   │⬤ Tri │ Compl. │ │
│  │ —   │ E-Signatur BK-Sign     │ Rechts…   │  28k    │⬤ Tri │ Fast   │ │
│  │ —   │ Nachhaltigk.-Dashboard │ Nachhal…  │  55k    │⬤ Tri │ Stand. │ │
│  └─────┴────────────────────────┴───────────┴─────────┴──────┴────────┘ │
│                                                            [+ Projekt]  │
│  ▾ Analysis (3)                                                         │
│  ┌─────┬────────────────────────┬───────────┬─────────┬──────┬────────┐ │
│  │DP-2 │ SAP RE-FX EGID Integ.  │ Inform…   │ 620k    │⬤ Ana │ Compl. │ │
│  │DP-7 │ KI-Flächenoptimierung  │ Portfol…  │ 480k    │⬤ Ana │ Compl. │ │
│  │DP-9 │ Mietvertragsportal     │ Immob…    │  95k    │⬤ Ana │ Stand. │ │
│  └─────┴────────────────────────┴───────────┴─────────┴──────┴────────┘ │
│                                                                         │
│  ▸ Implementation (2)  — collapsed                                      │
│  ▸ Completed (1)       — collapsed                                      │
│  ▸ Rejected (1)        — collapsed                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Columns

| Column | Source field | Format |
|---|---|---|
| Key | `jira_key` | Text, "—" if null |
| Titel | `title` | Truncated with ellipsis |
| Auftraggeber | `requestor` | Truncated |
| Budget | `budget_chf` | CHF formatted (e.g. "620k", "1.2 M") |
| Phase | `phase` | Coloured dot + abbreviated label |
| Komplexität | `complexity` | Badge (Fast / Stand. / Compl.) |
| Verantwortlich | `responsible` | Name or "—" |
| DTI | `dti_required` | Flag icon if true |

Columns are fixed for v1 (no reordering or visibility toggle).

### Interactions

- **Row click** → opens detail panel (section 6)
- **Row hover** → light background highlight
- **Group header click** → toggle collapse/expand
- **+ Projekt row** → opens create form within that group's phase pre-selected

---

## 4 — Gallery View

Card grid with thumbnail images for visual exploration. Inspired by pm-cockpit gallery. Responsive: 4 columns → 3 → 2 → 1.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ▾ Analysis (3)                                                 │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌────────────┐ │ │
│  │ │              │ │  │ │              │ │  │ │            │ │ │
│  │ │  Thumbnail   │ │  │ │  Thumbnail   │ │  │ │ Thumbnail  │ │ │
│  │ │  Image       │ │  │ │  Image       │ │  │ │ Image      │ │ │
│  │ │              │ │  │ │              │ │  │ │            │ │ │
│  │ │  [Complex]   │ │  │ │  [Complex]   │ │  │ │ [Standard] │ │ │
│  │ └──────────────┘ │  │ └──────────────┘ │  │ └────────────┘ │ │
│  │                  │  │                  │  │                │ │
│  │  SAP RE-FX EGID  │  │  KI-Flächen-     │  │ Mietvertrags- │ │
│  │  Integration     │  │  optimierung     │  │ portal Ablös. │ │
│  │  ──────────────  │  │  ──────────────  │  │ ────────────  │ │
│  │  Informatik BBL  │  │  Portfoliomgmt   │  │ Immobilien    │ │
│  │  CHF 620k        │  │  CHF 480k        │  │ CHF 95k       │ │
│  │  ⬤ Analysis      │  │  ⬤ Analysis      │  │ ⬤ Analysis    │ │
│  │  S. Keller       │  │  A. Wyss         │  │ L. Meier      │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Card Anatomy

```
┌──────────────────────┐
│ ┌──────────────────┐ │
│ │                  │ │  ← Thumbnail area (180 px height)
│ │   Image or       │ │    Placeholder gradient if no image
│ │   Placeholder    │ │
│ │                  │ │
│ │  [Class Badge]   │ │  ← Overlay badge, bottom-left
│ └──────────────────┘ │
│                      │
│  Title (semibold)    │  ← Max 2 lines, ellipsis overflow
│  ────────────────    │  ← Separator line
│  Requestor           │
│  CHF xxx'xxx         │  ← Budget, de-CH formatted
│  ⬤ Phase label       │  ← Coloured dot + phase text
│  Responsible         │  ← Name or "nicht zugewiesen"
│                      │
└──────────────────────┘
```

### Thumbnail Images

For v1, projects do not have images in the data model. The gallery view uses **placeholder thumbnails** — a coloured gradient derived from the project class:

| Class | Gradient |
|---|---|
| Fast Track | Light green tones |
| Standard | Light blue tones |
| Complex | Light amber/orange tones |

A project icon (Material icon: `assignment`) is centred on the gradient. When image support is added later, the thumbnail area will display the actual image with `object-fit: cover`.

### Interactions

- **Card click** → opens detail panel
- **Card hover** → subtle lift shadow + slight upward translate
- **Class badge click** → adds class filter
- **Phase dot click** → adds phase filter

---

## 5 — Kanban View

Columns represent the `phase` enum. Cards move between columns to represent phase transitions. Inspired by task-canvas board view.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  Triage (3)       Analysis (3)      Implementation (2)   Completed (1)   │
│  ┌────────────┐   ┌────────────┐   ┌────────────────┐   ┌────────────┐  │
│  │            │   │            │   │                │   │            │  │
│  │ IoT Sensor │   │ SAP RE-FX  │   │ DMS Migration  │   │ Workplace  │  │
│  │ Gebäude…   │   │ EGID Integ │   │ SharePoint     │   │ Booking    │  │
│  │ ────────── │   │ ────────── │   │ ────────────── │   │ ────────── │  │
│  │ 1.2 M      │   │ 620k       │   │ 85k            │   │ 35k        │  │
│  │ [Complex]  │   │ [Complex]  │   │ [Standard]     │   │ [Fast]     │  │
│  │            │   │ S. Keller  │   │ A. Wyss        │   │ L. Meier   │  │
│  └────────────┘   └────────────┘   └────────────────┘   └────────────┘  │
│  ┌────────────┐   ┌────────────┐   ┌────────────────┐                   │
│  │ E-Signatur │   │ KI-Flächen │   │ Intranet       │    Rejected (1)   │
│  │ BK-Sign    │   │ optimier.  │   │ Relaunch       │   ┌────────────┐  │
│  │ ────────── │   │ ────────── │   │ ────────────── │   │ Zutritts-  │  │
│  │ 28k        │   │ 480k       │   │ 42k            │   │ steuerung  │  │
│  │ [Fast]     │   │ [Complex]  │   │ [Fast]         │   │ Biometrie  │  │
│  └────────────┘   └────────────┘   └────────────────┘   │ ────────── │  │
│  ┌────────────┐   ┌────────────┐                        │ 250k       │  │
│  │ Nachhalti… │   │ Mietvertr… │                        │ [Standard] │  │
│  │ Dashboard  │   │ portal     │                        └────────────┘  │
│  │ ────────── │   │ ────────── │                                        │
│  │ 55k        │   │ 95k        │                                        │
│  │ [Standard] │   │ [Standard] │                                        │
│  └────────────┘   └────────────┘                                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Column Layout

- Five columns, one per `phase` value, in process order: Triage → Analysis → Implementation → Completed → Rejected
- Each column header shows the phase name and a count badge
- Columns scroll vertically independently if content overflows
- Horizontal scroll for the full board on narrow screens

### Kanban Card

```
┌──────────────┐
│  Title       │  ← Semibold, max 2 lines
│  ──────────  │
│  CHF xxxk    │  ← Budget
│  [Class]     │  ← Class badge
│  Responsible │  ← Name or empty
└──────────────┘
```

### Swimlanes (via Group By)

When Group By is active, each column is subdivided into horizontal swimlanes. Example with Group By = "Komplexität":

```
Column: Triage
├── Swimlane: Fast Track (1)
│   └── [E-Signatur BK-Sign]
├── Swimlane: Standard (1)
│   └── [Nachhaltigkeits-Dashboard]
└── Swimlane: Complex (1)
    └── [IoT Sensorik Gebäude…]
```

### Interactions

- **Card click** → opens detail panel
- **Drag & drop** → move card between phase columns (triggers phase transition with confirmation for owner/admin roles; disabled for viewer/analyst)
- **Card hover** → light shadow emphasis

---

## 6 — Gantt View

Horizontal timeline showing project duration. Inspired by task-canvas roadmap view.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        [◀] [Today] [▶]    [Week | Month | Quarter]     │
├──────────────────┬──────────────────────────────────────────────────────┤
│  Sidebar         │  Jan    Feb    Mar    Apr    May    Jun    Jul       │
├──────────────────┼──────────────────────────────────────────────────────┤
│                  │                                                      │
│  ▾ Complex (3)   │                                                      │
│  SAP RE-FX EGID  │         ████████████████████░░░░░░░░░░░░░           │
│  KI-Flächen…     │                ██████████████░░░░░░░░░░░░░░░        │
│  IoT Sensorik    │                      ██░░░░░░░░░░░░░░░░░░░░░░░     │
│                  │                                                      │
│  ▾ Standard (3)  │                                                      │
│  DMS Migration   │         █████████████████████████                    │
│  Mietvertrag…    │                ████████████░░░░░░░░░░░░             │
│  Nachhaltigk.    │                            ░░░░░░░░░░░░░            │
│                  │                                                      │
│  ▾ Fast Track(3) │                                                      │
│  Workplace Bo…   │  ████████████████                                    │
│  Intranet Rel…   │              █████████████████                       │
│  E-Signatur      │                            ░░░░░░░░                  │
│                  │                                                      │
├──────────────────┼──────────────────────────────────────────────────────┤
│                  │  ████ = elapsed        ░░░░ = remaining              │
└──────────────────┴──────────────────────────────────────────────────────┘
```

### Structure

| Element | Description |
|---|---|
| Time scale toggle | Week / Month / Quarter buttons — controls column width |
| Navigation | ◀ / ▶ scroll the timeline; "Today" centres on current date |
| Sidebar | Left column listing project titles, grouped if Group By is active |
| Bars | Horizontal bars representing `created_at` → estimated end (derived from phase + class) |
| Bar colour | Filled portion = elapsed time, lighter portion = remaining estimate |
| Today marker | Vertical dashed line at current date |

### Bar Colouring by Class

| Class | Bar colour |
|---|---|
| Fast Track | Green accent |
| Standard | Blue accent |
| Complex | Amber accent |

### Interactions

- **Bar click** → opens detail panel
- **Bar hover** → tooltip with title, phase, budget, dates
- **Sidebar row click** → opens detail panel
- **Drag bar edges** → adjust estimated start/end dates (owner/admin only)

### Duration Estimation (v1)

Since the data model has no explicit end date, Gantt bars use a heuristic:

- `created_at` = bar start
- Completed/Rejected projects: `updated_at` = bar end
- Active projects: estimated end = `created_at` + duration by class (Fast Track: 3 months, Standard: 6 months, Complex: 12 months)

---

## 7 — Detail Panel

A slide-in panel from the right side of the screen (480 px wide). Shows full project information with tabs. Opens when clicking any project in any view.

```
┌──────────────────────────────────────┬──────────────────────────┐
│                                      │                          │
│  MAIN CONTENT (dimmed)               │  DETAIL PANEL            │
│                                      │                          │
│                                      │  [←] SAP RE-FX EGID     │
│                                      │       Integration        │
│                                      │                          │
│                                      │  [Übersicht] [Komment.]  │
│                                      │  [Verlauf]               │
│                                      │  ────────────────────    │
│                                      │                          │
│                                      │  Phase       ⬤ Analysis  │
│                                      │  Komplexität      Complex     │
│                                      │  Budget      CHF 620k   │
│                                      │  Go-Entsch.  ausstehend  │
│                                      │  Verantw.    S. Keller   │
│                                      │  Auftragg.   Informatik  │
│                                      │  DTI          Ja         │
│                                      │  HERMES      Concept     │
│                                      │  Jira        DRESPPM-2  │
│                                      │  ────────────────────    │
│                                      │  Notizen                 │
│                                      │  EGID governance by      │
│                                      │  design. BIT SUPERB…     │
│                                      │                          │
│                                      │  Erstellt    05.02.2026  │
│                                      │  Geändert    02.04.2026  │
│                                      │                          │
│                                      │  [Bearbeiten]  [Löschen] │
│                                      │                          │
└──────────────────────────────────────┴──────────────────────────┘
```

### Tabs

| Tab | Content |
|---|---|
| **Übersicht** | All project fields in a structured layout (see wireframe above) |
| **Kommentare** | Chronological comment list with author, timestamp, body. Input field at the bottom to add a new comment |
| **Verlauf** | Immutable change log table: timestamp, user, field, old → new value. Sorted newest-first |

### Actions

| Button | Role required | Behaviour |
|---|---|---|
| Bearbeiten (Edit) | analyst, owner, admin | Opens inline editing / edit form for the project |
| Löschen (Delete) | admin | Confirmation dialog, then removes the project |
| Go-Entscheid (Go decision) | owner, admin | Shown only when `go_decision` is null; sets `go_decision` to true/false and advances/rejects phase |
| ← (Back) | all | Closes the panel, returns to the list |

---

## 8 — Create / Edit Form

Used for both creating a new project and editing an existing one. Can appear either as a modal overlay or replace the detail panel content.

```
┌──────────────────────────────────┐
│  Neues Projekt erfassen          │
│  ────────────────────────────    │
│                                  │
│  Titel *                         │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  Auftraggeber *                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  Budget (CHF) *                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  Komplexität         ← auto-suggest  │
│  ┌────────────────────────────┐  │
│  │ [Fast Track ▾]            │  │
│  └────────────────────────────┘  │
│  ℹ Budget < 50k → Fast Track    │
│                                  │
│  Verantwortlich                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  DTI-pflichtig   [ ] Ja          │
│                                  │
│  Notizen                         │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│           [Abbrechen] [Speichern]│
└──────────────────────────────────┘
```

### Auto-Suggest Logic for Class

As specified in REQUIREMENTS.md, the class is auto-suggested based on budget and dependencies:

| Condition | Suggested class |
|---|---|
| Budget < CHF 50k | Fast Track |
| Budget ≥ CHF 50k | Standard |
| Budget ≥ CHF 50k + DTI checked | Complex |

The suggestion is shown as a hint below the class dropdown. The user can override it.

### Field Rules

| Field | Create | Edit |
|---|---|---|
| `title` | Required, empty | Editable |
| `requestor` | Required, empty | Editable |
| `budget_chf` | Required, empty | Editable |
| `complexity` | Auto-suggested, overridable | Editable |
| `phase` | Defaults to "Triage", hidden | Not editable here — changed via Go-Entscheid or Kanban drag |
| `responsible` | Optional | Editable |
| `dti_required` | Checkbox, default false | Editable |
| `notes` | Optional textarea | Editable |
| `hermes_phase` | Hidden on create | Editable (dropdown) |
| `jira_key` | Hidden on create | Editable |
| `go_decision` | Not shown | Not editable here — separate action |

---

## 9 — Phase & Class Colour System

### Phase Colours

| Phase | Dot colour | Usage |
|---|---|---|
| Triage | `#6B7280` (gray) | Neutral — not yet classified |
| Analysis | `#3B82F6` (blue) | In progress — being evaluated |
| Implementation | `#F59E0B` (amber) | Active — project running |
| Completed | `#10B981` (green) | Done — handed over |
| Rejected | `#EF4444` (red) | Declined or withdrawn |

### Class Badges

| Class | Background | Text |
|---|---|---|
| Fast Track | `#DCFCE7` (green-100) | `#166534` (green-800) |
| Standard | `#DBEAFE` (blue-100) | `#1E40AF` (blue-800) |
| Complex | `#FEF3C7` (amber-100) | `#92400E` (amber-800) |

---

## 10 — Responsive Behaviour

| Breakpoint | Adaptation |
|---|---|
| ≥ 1280 px | Full layout, gallery 4 columns, detail panel as overlay |
| 1024 – 1279 px | Gallery 3 columns, Gantt sidebar narrows |
| 768 – 1023 px | Gallery 2 columns, detail panel full-width overlay, Kanban horizontal scroll |
| < 768 px | Gallery 1 column, list view horizontal scroll, action bar stacks vertically, detail panel full-screen |

---

## 11 — View × Grouping Matrix

How the Group By option renders in each view:

| Group By \ View | List | Gallery | Kanban | Gantt |
|---|---|---|---|---|
| Keine | Flat table | Flat card grid | Columns by phase | Flat timeline |
| Phase | Grouped table sections | Grouped card sections | *(native — no change)* | Grouped rows |
| Komplexität | Grouped table sections | Grouped card sections | Swimlanes per class | Grouped rows |
| Verantwortlich | Grouped table sections | Grouped card sections | Swimlanes per person | Grouped rows |
| DTI-pflichtig | Grouped table sections | Grouped card sections | Swimlanes (Ja / Nein) | Grouped rows |

Note: In Kanban view, the columns are always `phase`. When Group By = Phase, nothing changes since columns already represent phases. Any other Group By value creates swimlanes within each phase column.

---

## Open Design Questions

1. **Image support:** Should the data model be extended with a `thumbnail_url` field on `project`, or should gallery thumbnails remain abstract placeholders?
2. **Gantt end dates:** Should an explicit `target_date` field be added, or is the heuristic duration by class sufficient for v1?
3. **Drag & drop in Kanban:** Should phase transitions via drag require a confirmation dialog, or apply immediately with an undo toast?
4. **Detail panel vs. full page:** Should complex projects open a full-page detail view instead of a side panel?
5. **Export:** Should the list view include a CSV/Excel export button (like pm-cockpit)?
