/* ═══════════════════════════════════════════════════════════
   DRES PPM — Data Loading & Helpers
   ═══════════════════════════════════════════════════════════ */

async function loadData() {
  async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Failed to load ${url}: ${r.status} ${r.statusText}`);
    return r.json();
  }

  try {
    const [projects, users, comments, changelog] = await Promise.all([
      fetchJSON('data/projects.json'),
      fetchJSON('data/users.json'),
      fetchJSON('data/comments.json'),
      fetchJSON('data/changelog.json'),
    ]);
    state.projects  = projects;
    state.users     = users;
    state.comments  = comments;
    state.changelog = changelog;
  } catch (err) {
    console.error('Data loading failed:', err);
    document.getElementById('viewContainer').innerHTML =
      '<div class="placeholder-view"><h2 class="placeholder-title">Fehler beim Laden</h2>' +
      '<p class="placeholder-text">Die Projektdaten konnten nicht geladen werden. Bitte Seite neu laden.</p></div>';
  }
}

/* ── Look-ups ── */

function getUserById(id) {
  return state.users.find(u => u.id === id);
}

function getUserInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getCommentsForProject(projectId) {
  return state.comments
    .filter(c => c.project_id === projectId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

function getChangelogForProject(projectId) {
  return state.changelog
    .filter(c => c.project_id === projectId)
    .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
}

/* ── Formatting ── */

function formatBudget(chf) {
  if (chf >= 1_000_000) return `CHF ${(chf / 1_000_000).toFixed(1)} Mio.`;
  if (chf >= 1_000) return `CHF ${Math.round(chf / 1_000)}'000`;
  return `CHF ${chf}`;
}

function formatBudgetShort(chf) {
  if (chf >= 1_000_000) return `${(chf / 1_000_000).toFixed(1)}M`;
  if (chf >= 1_000) return `${Math.round(chf / 1_000)}k`;
  return `${chf}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── Filtering, Sorting, Grouping ── */

function getFilteredProjects() {
  let list = [...state.projects];

  // Archived (completed/rejected) — bypass if user explicitly filters for those phases
  if (!state.showArchived) {
    const fp = state.filters.phase;
    const wantsCompleted = fp.has('completed');
    const wantsRejected = fp.has('rejected');
    if (!wantsCompleted && !wantsRejected) {
      list = list.filter(p => p.phase !== 'completed' && p.phase !== 'rejected');
    } else if (!wantsCompleted) {
      list = list.filter(p => p.phase !== 'completed');
    } else if (!wantsRejected) {
      list = list.filter(p => p.phase !== 'rejected');
    }
  }

  // Search
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(p =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.requestor && p.requestor.toLowerCase().includes(q)) ||
      (p.responsible && p.responsible.toLowerCase().includes(q)) ||
      (p.jira_key && p.jira_key.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  }

  // Assigned to me
  if (state.assignedToMe) {
    const currentUser = getUserById(state.currentUserId);
    if (currentUser) {
      list = list.filter(p => p.responsible === currentUser.display_name);
    }
  }

  // Assignee filter
  if (state.assigneeFilter) {
    if (state.assigneeFilter === '__none__') {
      list = list.filter(p => !p.responsible);
    } else {
      list = list.filter(p => p.responsible === state.assigneeFilter);
    }
  }

  // Multi-dimensional filters (OR within dimension, AND across dimensions)
  const f = state.filters;
  if (f.phase.size > 0) {
    list = list.filter(p => f.phase.has(p.phase));
  }
  if (f.class.size > 0) {
    list = list.filter(p => f.class.has(p.class));
  }
  if (f.type.size > 0) {
    list = list.filter(p => f.type.has(p.type));
  }
  if (f.priority.size > 0) {
    list = list.filter(p => f.priority.has(p.priority || 'medium'));
  }
  if (f.tags.size > 0) {
    list = list.filter(p => (p.tags || []).some(t => f.tags.has(t)));
  }
  if (f.dti === true) {
    list = list.filter(p => p.dti_required);
  } else if (f.dti === false) {
    list = list.filter(p => !p.dti_required);
  }

  // Sort
  list.sort((a, b) => {
    let va = a[state.sortField];
    let vb = b[state.sortField];

    // Special sort orders
    if (state.sortField === 'phase') {
      va = PHASE_ORDER.indexOf(va);
      vb = PHASE_ORDER.indexOf(vb);
    } else if (state.sortField === 'class') {
      va = CLASS_ORDER.indexOf(va);
      vb = CLASS_ORDER.indexOf(vb);
    } else if (state.sortField === 'type') {
      va = TYPE_ORDER.indexOf(va);
      vb = TYPE_ORDER.indexOf(vb);
    } else if (state.sortField === 'priority') {
      va = PRIORITY_ORDER.indexOf(va);
      vb = PRIORITY_ORDER.indexOf(vb);
    }

    if (va == null) va = '';
    if (vb == null) vb = '';

    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();

    if (va < vb) return state.sortDirection === 'asc' ? -1 : 1;
    if (va > vb) return state.sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return list;
}

function getGroupedProjects(projects) {
  if (state.groupBy === 'none') return null;

  const groups = new Map();

  for (const p of projects) {
    let key;
    if (state.groupBy === 'phase') {
      key = p.phase;
    } else if (state.groupBy === 'class') {
      key = p.class;
    } else if (state.groupBy === 'type') {
      key = p.type || 'new';
    } else if (state.groupBy === 'responsible') {
      key = p.responsible || '(nicht zugewiesen)';
    } else if (state.groupBy === 'priority') {
      key = p.priority || 'medium';
    } else if (state.groupBy === 'dti_required') {
      key = p.dti_required ? 'DTI-pflichtig' : 'Nicht DTI-pflichtig';
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }

  // Sort group keys
  if (state.groupBy === 'phase') {
    return new Map(PHASE_ORDER.filter(k => groups.has(k)).map(k => [k, groups.get(k)]));
  }
  if (state.groupBy === 'class') {
    return new Map(CLASS_ORDER.filter(k => groups.has(k)).map(k => [k, groups.get(k)]));
  }
  if (state.groupBy === 'type') {
    return new Map(TYPE_ORDER.filter(k => groups.has(k)).map(k => [k, groups.get(k)]));
  }
  if (state.groupBy === 'priority') {
    return new Map(PRIORITY_ORDER.filter(k => groups.has(k)).map(k => [k, groups.get(k)]));
  }

  return groups;
}

function getGroupLabel(key) {
  if (state.groupBy === 'phase') return PHASE_LABELS[key] || key;
  if (state.groupBy === 'class') return CLASS_LABELS[key] || key;
  if (state.groupBy === 'type') return TYPE_LABELS[key] || key;
  if (state.groupBy === 'priority') return PRIORITY_LABELS[key] || key;
  return key;
}

function getGroupColor(key) {
  if (state.groupBy === 'phase') {
    const colors = {
      triage: 'var(--phase-triage)',
      analysis: 'var(--phase-analysis)',
      implementation: 'var(--phase-implementation)',
      completed: 'var(--phase-completed)',
      rejected: 'var(--phase-rejected)',
    };
    return colors[key] || 'var(--gray-400)';
  }
  if (state.groupBy === 'class') {
    const colors = {
      fast_track: 'var(--success-500)',
      standard: 'var(--accent-500)',
      complex: 'var(--warning-500)',
    };
    return colors[key] || 'var(--gray-400)';
  }
  if (state.groupBy === 'type') {
    const colors = {
      incident: 'var(--type-incident)',
      change: 'var(--type-change)',
      new: 'var(--type-new)',
      data: 'var(--type-data)',
      migration: 'var(--type-migration)',
      study: 'var(--type-study)',
    };
    return colors[key] || 'var(--gray-400)';
  }
  if (state.groupBy === 'priority') {
    const colors = {
      high: 'var(--priority-high)',
      medium: 'var(--priority-medium)',
      low: 'var(--priority-low)',
    };
    return colors[key] || 'var(--gray-400)';
  }
  return 'var(--gray-400)';
}

function getUniqueResponsibles() {
  const set = new Set();
  state.projects.forEach(p => {
    if (p.responsible) set.add(p.responsible);
  });
  return [...set].sort();
}

/* ── Filter helpers ── */

function getAllTags() {
  const set = new Set();
  state.projects.forEach(p => {
    (p.tags || []).forEach(t => set.add(t));
  });
  return [...set].sort();
}

function hasActiveFilters() {
  const f = state.filters;
  return f.phase.size > 0 || f.class.size > 0 || f.type.size > 0 || f.priority.size > 0 || f.tags.size > 0 || f.dti != null;
}

function toggleFilter(dimension, value) {
  const set = state.filters[dimension];
  if (set.has(value)) {
    set.delete(value);
  } else {
    set.add(value);
  }
}

function clearAllFilters() {
  state.filters.phase.clear();
  state.filters.class.clear();
  state.filters.type.clear();
  state.filters.priority.clear();
  state.filters.tags.clear();
  state.filters.dti = null;
}
