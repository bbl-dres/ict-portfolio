/* ═══════════════════════════════════════════════════════════
   DRES PPM — Centralised State
   ═══════════════════════════════════════════════════════════ */

const state = {
  /* ── Data ── */
  projects:  [],
  users:     [],
  comments:  [],
  changelog: [],

  /* ── View ── */
  currentView: 'gallery',   // gallery | list | kanban | gantt | dashboard

  /* ── Toolbar ── */
  searchQuery: '',
  sortField: 'title',
  sortDirection: 'asc',
  groupBy: 'none',       // none | phase | class | responsible | dti_required

  /* ── Filters ── */
  assigneeFilter: null,  // null = all, or user display_name
  assignedToMe: false,   // checkbox: show only my projects
  showArchived: false,   // checkbox: include completed/rejected

  /* ── Field visibility ── */
  visibleFields: new Set([
    'jira_key', 'requestor', 'budget_chf',
    'responsible', 'phase', 'class'
  ]),

  /* ── Collapsed groups ── */
  collapsedGroups: new Set(),

  /* ── Detail panel ── */
  selectedProjectId: null,
  detailTab: 'overview',  // overview | comments | changelog

  /* ── Modal ── */
  editingProjectId: null,  // null = create, number = edit
};

/* ── Labels & look-ups ── */

const PHASE_LABELS = {
  triage:         'Triage',
  analysis:       'Analyse',
  implementation: 'Umsetzung',
  completed:      'Abgeschlossen',
  rejected:       'Abgelehnt',
};

const PHASE_ORDER = ['triage', 'analysis', 'implementation', 'completed', 'rejected'];

const CLASS_LABELS = {
  fast_track: 'Fast Track',
  standard:   'Standard',
  complex:    'Complex',
};

const CLASS_ORDER = ['fast_track', 'standard', 'complex'];
