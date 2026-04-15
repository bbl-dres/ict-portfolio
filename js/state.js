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
  groupBy: 'none',       // none | phase | complexity | type | responsible | dti_required

  /* ── Filters ── */
  showArchived: false,   // checkbox: include completed/rejected

  /* ── Multi-dimensional filters ── */
  filters: {
    phase:       new Set(),   // e.g. Set(['triage', 'analysis'])
    complexity:  new Set(),   // e.g. Set(['complex'])
    type:        new Set(),   // e.g. Set(['new', 'change'])
    priority:    new Set(),   // e.g. Set(['high'])
    responsible: new Set(),   // e.g. Set(['Sandra Keller', '__me__', '__none__'])
    tags:        new Set(),   // e.g. Set(['SAP', 'IoT'])
    dti:         null,        // true | false | null (any)
  },
  filterPanelOpen: false,

  /* ── Field visibility ── */
  visibleFields: new Set([
    'jira_key',
    'responsible', 'phase', 'complexity', 'type', 'priority', 'target_date'
  ]),

  /* ── Collapsed groups ── */
  collapsedGroups: new Set(),

  /* ── Detail page ── */
  selectedProjectId: null,
  previousView: 'gallery',  // view to return to from detail
  detailTab: 'overview',    // overview | changelog
  detailEditing: false,     // inline edit mode

  /* ── Modal ── */
  editingProjectId: null,  // null = create, number = edit

  /* ── Gantt ── */
  ganttScale: 'quarter',  // year | quarter | month

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

const COMPLEXITY_LABELS = {
  fast_track: 'Fast Track',
  standard:   'Standard',
  complex:    'Komplex',
};

const COMPLEXITY_ORDER = ['fast_track', 'standard', 'complex'];

const PRIORITY_LABELS = {
  low:    'Tief',
  medium: 'Mittel',
  high:   'Hoch',
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
  new:       'Neues IKT-Vorhaben',
  data:      'Daten Initiative',
  migration: 'Ablösung / Migration',
  study:     'Studie / Evaluation',
};

const TYPE_ORDER = ['incident', 'change', 'new', 'data', 'migration', 'study'];

const HERMES_LABELS = {
  initialisation: 'Initialisierung',
  concept:        'Konzept',
  realisation:    'Realisierung',
  introduction:   'Einführung',
  closure:        'Abschluss',
};
