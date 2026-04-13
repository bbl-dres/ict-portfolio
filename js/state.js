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
    'jira_key',
    'responsible', 'phase', 'class', 'priority', 'target_date'
  ]),

  /* ── Collapsed groups ── */
  collapsedGroups: new Set(),

  /* ── Detail page ── */
  selectedProjectId: null,
  previousView: 'gallery',  // view to return to from detail
  detailTab: 'overview',    // overview | comments | changelog

  /* ── Modal ── */
  editingProjectId: null,  // null = create, number = edit

  /* ── Current user (simulated login) ── */
  currentUserId: 1,  // Marc Brunner
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

const PRIORITY_LABELS = {
  low:    'Low',
  medium: 'Medium',
  high:   'High',
};

const PRIORITY_ICONS = {
  low:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>',
  medium: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m18 15-6-6-6 6"/></svg>',
  high:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m18 11-6-6-6 6"/><path d="m18 18-6-6-6 6"/></svg>',
};

const PRIORITY_ORDER = ['high', 'medium', 'low'];
