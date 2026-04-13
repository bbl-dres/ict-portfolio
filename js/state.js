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
  groupBy: 'none',       // none | phase | class | type | responsible | dti_required

  /* ── Filters ── */
  assigneeFilter: null,  // null = all, or user display_name
  assignedToMe: false,   // checkbox: show only my projects
  showArchived: false,   // checkbox: include completed/rejected

  /* ── Multi-dimensional filters ── */
  filters: {
    phase:    new Set(),   // e.g. Set(['triage', 'analysis'])
    class:    new Set(),   // e.g. Set(['complex'])
    priority: new Set(),   // e.g. Set(['high'])
    type:     new Set(),   // e.g. Set(['new', 'change'])
    tags:     new Set(),   // e.g. Set(['SAP', 'IoT'])
    dti:      null,        // true | false | null (any)
  },
  filterPanelOpen: false,

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

const TYPE_LABELS = {
  incident:  'Störung / Support',
  change:    'Änderungsantrag',
  new:       'Neuvorhaben',
  data:      'Datenbewirtschaftung',
  migration: 'Ablösung / Migration',
  study:     'Studie / Evaluation',
};

const TYPE_ORDER = ['incident', 'change', 'new', 'data', 'migration', 'study'];

const TYPE_ICONS = {
  incident:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  change:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
  new:       '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v8m0 0 4-4m-4 4L8 6"/><circle cx="12" cy="18" r="4"/></svg>',
  data:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>',
  migration: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m18 8 4 4-4 4"/><path d="M2 12h20"/><path d="m6 16-4-4 4-4"/></svg>',
  study:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
};
