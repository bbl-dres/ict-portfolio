/* ═══════════════════════════════════════════════════════════
   DRES PPM — Main Application
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  restoreFromURL();
  setupViewTabs();
  setupToolbar();
  setupDetailPanel();
  setupModal();
  render();
});

/* ═══════════════════════════════════════════════════════════
   URL STATE PERSISTENCE
   ═══════════════════════════════════════════════════════════ */

function restoreFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('view'))   state.currentView = params.get('view');
  if (params.has('id'))     state.selectedProjectId = Number(params.get('id'));
  if (params.has('group'))  state.groupBy = params.get('group');
  if (params.has('sort'))   state.sortField = params.get('sort');
  if (params.has('dir'))    state.sortDirection = params.get('dir');
  if (params.has('q'))      state.searchQuery = params.get('q');
  if (params.has('assignee')) state.assigneeFilter = params.get('assignee');

  // Sync UI to restored state
  document.querySelectorAll('.view-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.view === state.currentView);
  });
  document.getElementById('sortLabel').textContent =
    { title: 'Titel', budget_chf: 'Budget', phase: 'Phase', class: 'Klasse', priority: 'Priorität', created_at: 'Erstellt', updated_at: 'Geändert' }[state.sortField] || 'Titel';
  if (state.groupBy !== 'none') {
    document.getElementById('groupLabel').textContent =
      { phase: 'Phase', class: 'Klasse', responsible: 'Verantwortlich', priority: 'Priorität', dti_required: 'DTI-pflichtig' }[state.groupBy] || 'Gruppieren';
    document.getElementById('groupBtn').classList.add('active');
  }
  if (state.searchQuery) {
    document.getElementById('searchInput').value = state.searchQuery;
    document.getElementById('toolbarSearch').classList.add('expanded');
  }
}

function updateURL() {
  const params = new URLSearchParams();
  params.set('view', state.currentView);
  if (state.currentView === 'detail' && state.selectedProjectId) {
    params.set('id', state.selectedProjectId);
  }
  if (state.groupBy !== 'none')         params.set('group', state.groupBy);
  if (state.sortField !== 'title')      params.set('sort', state.sortField);
  if (state.sortDirection !== 'asc')    params.set('dir', state.sortDirection);
  if (state.searchQuery)                params.set('q', state.searchQuery);
  if (state.assigneeFilter)             params.set('assignee', state.assigneeFilter);

  const qs = params.toString();
  const url = window.location.pathname + (qs ? '?' + qs : '');
  window.history.replaceState(null, '', url);
}

/* ═══════════════════════════════════════════════════════════
   RENDER ORCHESTRATOR
   ═══════════════════════════════════════════════════════════ */

function render() {
  renderView();
  updateURL();
}


/* ═══════════════════════════════════════════════════════════
   VIEW TABS
   ═══════════════════════════════════════════════════════════ */

function setupViewTabs() {
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.currentView = tab.dataset.view;
      document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderView();
    });
  });
}

function renderView() {
  const container = document.getElementById('viewContainer');
  container.classList.remove('view-container--transparent');
  const isDetail = state.currentView === 'detail';
  const hideControls = ['dashboard', 'wiki', 'detail'].includes(state.currentView);

  // Show/hide view tabs and toolbar
  document.querySelector('.view-tabs').style.display = isDetail ? 'none' : '';
  document.querySelector('.toolbar').style.display = isDetail ? 'none' : '';
  document.getElementById('sortDropdown').style.display = hideControls ? 'none' : '';
  document.getElementById('groupDropdown').style.display = hideControls ? 'none' : '';
  document.getElementById('fieldsDropdown').style.display = hideControls ? 'none' : '';

  // Restore breadcrumb when not in detail
  if (!isDetail) {
    document.querySelector('.breadcrumb-inner').innerHTML = `
      <span>Projekte</span>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">Übersicht</span>
    `;
  }

  switch (state.currentView) {
    case 'list':      renderListView(container); break;
    case 'gallery':   renderGalleryView(container); break;
    case 'kanban':    renderKanbanView(container); break;
    case 'gantt':     renderGanttView(container); break;
    case 'dashboard': container.classList.add('view-container--transparent'); renderDashboardView(container); break;
    case 'wiki':      container.classList.add('view-container--transparent'); renderWikiView(container); break;
    case 'detail':    container.classList.add('view-container--transparent'); renderDetailPage(container); return;
  }
}

/* ═══════════════════════════════════════════════════════════
   LIST VIEW
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   SHARED GROUP RENDERING
   ═══════════════════════════════════════════════════════════ */

function renderGroupedView(container, contentRenderer) {
  const projects = getFilteredProjects();
  const groups = getGroupedProjects(projects);

  // Always use card-group layout (transparent container)
  container.classList.add('view-container--transparent');

  let html = '<div class="groups-container">';

  if (groups) {
    for (const [key, items] of groups) {
      const collapsed = state.collapsedGroups.has(key);
      html += renderGroupCard(key, items, collapsed, contentRenderer);
    }
  } else {
    // Default: single "Alle Projekte" group
    const collapsed = state.collapsedGroups.has('__all__');
    html += renderGroupCard('__all__', projects, collapsed, contentRenderer, true);
  }

  html += '</div>';
  container.innerHTML = html;

  bindGroupEvents(container);
}

function renderGroupCard(key, items, collapsed, contentRenderer, isFlat) {
  const label = isFlat ? 'Alle Projekte' : getGroupLabel(key);
  const color = isFlat ? 'var(--gray-400)' : getGroupColor(key);

  let html = '<div class="group-card">';
  html += `<div class="group-header${collapsed ? ' collapsed' : ''}" data-group="${key}">`;
  html += `<svg class="group-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`;
  if (!isFlat) {
    html += `<span class="group-dot" style="background:${color}"></span>`;
  }
  html += `<span class="group-name">${label}</span>`;
  html += `<span class="group-count">${items.length}</span>`;
  html += '</div>';

  if (!collapsed) {
    html += '<div class="group-body">';
    html += contentRenderer(items);
    html += renderAddRow();
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function renderAddRow() {
  return `<div class="add-project-row">
    <button class="add-project-btn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
      Projekt erfassen
    </button>
  </div>`;
}

function bindGroupEvents(container) {
  // Group toggles
  container.querySelectorAll('.group-header').forEach(header => {
    header.addEventListener('click', () => {
      const key = header.dataset.group;
      if (state.collapsedGroups.has(key)) {
        state.collapsedGroups.delete(key);
      } else {
        state.collapsedGroups.add(key);
      }
      renderView();
    });
  });

  // Project clicks
  container.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.add-project-btn')) return;
      openDetailPanel(Number(el.dataset.id));
    });
  });

  // Add project buttons
  container.querySelectorAll('.add-project-btn').forEach(btn => {
    btn.addEventListener('click', () => openModal());
  });

  // Drag & drop
  setupDragAndDrop(container);
}

/* ═══════════════════════════════════════════════════════════
   LIST VIEW
   ═══════════════════════════════════════════════════════════ */

function renderListView(container) {
  renderGroupedView(container, (items) => {
    const cols = getListColumns();
    const gridCols = cols.map(c => c.width).join(' ');
    return '<div class="list-card">' +
      items.map(p => renderProjectRow(p, cols, gridCols)).join('') +
    '</div>';
  });
}

function getListColumns() {
  const vf = state.visibleFields;
  const cols = [];
  if (vf.has('jira_key'))      cols.push({ key: 'jira_key',     width: '100px' });
  // Title is always shown
  cols.push({ key: '_title', width: '1fr' });
  if (vf.has('budget_chf'))    cols.push({ key: 'budget_chf',   width: '80px' });
  if (vf.has('responsible'))   cols.push({ key: 'responsible',  width: '110px' });
  if (vf.has('phase'))         cols.push({ key: 'phase',        width: '110px' });
  if (vf.has('class'))         cols.push({ key: 'class',        width: '90px' });
  if (vf.has('priority'))      cols.push({ key: 'priority',     width: '80px' });
  if (vf.has('tags'))           cols.push({ key: 'tags',         width: '150px' });
  if (vf.has('target_date'))   cols.push({ key: 'target_date',  width: '90px' });
  if (vf.has('go_decision'))   cols.push({ key: 'go_decision',  width: '90px' });
  if (vf.has('hermes_phase'))  cols.push({ key: 'hermes_phase', width: '100px' });
  if (vf.has('dti_required'))  cols.push({ key: 'dti_required', width: '30px' });
  if (vf.has('created_at'))    cols.push({ key: 'created_at',   width: '90px' });
  return cols;
}

function renderProjectRow(p, cols, gridCols) {
  const vf = state.visibleFields;
  let cells = '';
  for (const col of cols) {
    switch (col.key) {
      case 'jira_key':     cells += `<span class="project-jira">${p.jira_key || '—'}</span>`; break;
      case '_title':       cells += `<div class="project-row-main"><div class="project-title">${esc(p.title)}</div>${vf.has('requestor') ? `<div class="project-requestor">${esc(p.requestor)}</div>` : ''}</div>`; break;
      case 'budget_chf':   cells += `<span class="project-budget">${formatBudgetShort(p.budget_chf)}</span>`; break;
      case 'responsible':  cells += `<span class="project-responsible">${p.responsible || '—'}</span>`; break;
      case 'phase':        cells += `<span class="badge badge-phase" data-phase="${p.phase}"><span class="phase-dot"></span>${PHASE_LABELS[p.phase]}</span>`; break;
      case 'class':        cells += `<span class="badge badge-class" data-class="${p.class}">${CLASS_LABELS[p.class]}</span>`; break;
      case 'priority':     cells += priorityBadge(p.priority); break;
      case 'tags':         cells += `<div class="tag-list">${(p.tags || []).map(t => `<span class="badge-tag">${esc(t)}</span>`).join('')}</div>`; break;
      case 'target_date':  cells += `<span class="project-date">${p.target_date ? formatDate(p.target_date) : '—'}</span>`; break;
      case 'go_decision':  cells += `<span class="project-go">${p.go_decision === true ? 'Ja' : p.go_decision === false ? 'Nein' : '—'}</span>`; break;
      case 'hermes_phase': cells += `<span class="project-hermes">${p.hermes_phase || '—'}</span>`; break;
      case 'dti_required': cells += `<span class="badge-dti" title="DTI-pflichtig">${p.dti_required ? '🚩' : ''}</span>`; break;
      case 'created_at':   cells += `<span class="project-date">${formatDate(p.created_at)}</span>`; break;
    }
  }
  return `<div class="project-row" data-id="${p.id}" style="grid-template-columns:${gridCols}">${cells}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   GALLERY VIEW
   ═══════════════════════════════════════════════════════════ */

function renderGalleryView(container) {
  renderGroupedView(container, (items) => {
    return '<div class="gallery-grid">' +
      items.map(p => renderGalleryCard(p)).join('') +
    '</div>';
  });
}

function renderGalleryCard(p) {
  const vf = state.visibleFields;
  const hasImage = !!p.thumbnail;
  const imageStyle = hasImage
    ? `background-image:url('${p.thumbnail}');background-size:cover;background-position:center`
    : `background:linear-gradient(135deg, var(--gray-100) 0%, var(--gray-200) 100%)`;

  // Top row: jira key + priority
  const topLeft = vf.has('jira_key') ? `<span class="project-jira">${p.jira_key || '—'}</span>` : '';
  const topRight = vf.has('priority') ? priorityBadge(p.priority) : '';
  const topRow = (topLeft || topRight) ? `<div class="gallery-card-meta-row">${topLeft || '<span></span>'}${topRight || '<span></span>'}</div>` : '';

  // Info row: requestor + budget
  const infoLeft = vf.has('requestor') ? `<span>${esc(p.requestor)}</span>` : '';
  const infoRight = vf.has('budget_chf') ? `<span class="gallery-card-budget">${formatBudgetShort(p.budget_chf)}</span>` : '';
  const infoRow = (infoLeft || infoRight) ? `<div class="gallery-card-meta-row">${infoLeft || '<span></span>'}${infoRight || '<span></span>'}</div>` : '';

  // Phase row
  const phaseRow = vf.has('phase') ? `<div class="gallery-card-meta-row"><span class="badge badge-phase" data-phase="${p.phase}"><span class="phase-dot"></span>${PHASE_LABELS[p.phase]}</span></div>` : '';

  // Tags
  const tags = vf.has('tags') ? (p.tags && p.tags.length
    ? `<div class="tag-list">${p.tags.map(t => `<span class="badge-tag">${esc(t)}</span>`).join('')}</div>`
    : `<div class="card-placeholder">Keine Tags</div>`) : '';

  // Extras row: dti, hermes, go_decision, created_at
  const extras = [];
  if (vf.has('dti_required') && p.dti_required) extras.push('🚩 DTI');
  if (vf.has('hermes_phase')) extras.push(p.hermes_phase || '—');
  if (vf.has('go_decision')) extras.push(p.go_decision === true ? 'Go: Ja' : p.go_decision === false ? 'Go: Nein' : 'Go: —');
  if (vf.has('created_at')) extras.push(formatDate(p.created_at));
  const extrasRow = extras.length ? `<div class="gallery-card-meta-row"><span class="project-date">${extras.join(' · ')}</span></div>` : '';

  // Bottom row: target_date + assignee avatar (with separator)
  const showDeadline = vf.has('target_date');
  const showAssignee = vf.has('responsible');
  const deadline = showDeadline ? `<span class="project-date">${p.target_date ? formatDate(p.target_date) : '—'}</span>` : '';
  const assigneeInitials = (showAssignee && p.responsible) ? getUserInitials(p.responsible) : '';
  const assigneeHTML = showAssignee ? (assigneeInitials
    ? `<div class="card-avatar" title="${esc(p.responsible)}">${assigneeInitials}</div>`
    : `<div class="card-avatar card-avatar--empty" title="Nicht zugewiesen">—</div>`) : '';
  const bottomRow = (showDeadline || showAssignee) ? `<div class="card-separator"></div><div class="gallery-card-meta-row">${deadline || '<span></span>'}${assigneeHTML}</div>` : '';

  return `<div class="gallery-card" data-id="${p.id}" role="article" aria-label="${esc(p.title)}">
    <div class="gallery-card-image" style="${imageStyle}">
      ${!hasImage ? '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h.01M7 12h10M7 17h6"/></svg>' : ''}
      ${vf.has('class') ? `<div class="card-badge"><span class="badge badge-class" data-class="${p.class}">${CLASS_LABELS[p.class]}</span></div>` : ''}
    </div>
    <div class="gallery-card-body">
      ${topRow}
      <div class="gallery-card-title">${esc(p.title)}</div>
      ${infoRow}
      ${phaseRow}
      ${tags}
      ${extrasRow}
      ${bottomRow}
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════
   KANBAN VIEW
   ═══════════════════════════════════════════════════════════ */

function renderKanbanView(container) {
  renderGroupedView(container, (items) => {
    // Build phase columns from the items in this group
    const columns = {};
    PHASE_ORDER.forEach(ph => { columns[ph] = []; });
    items.forEach(p => { columns[p.phase].push(p); });

    let html = '<div class="kanban-board">';
    for (const phase of PHASE_ORDER) {
      const phaseItems = columns[phase];
      html += `<div class="kanban-column" data-phase="${phase}">
        <div class="kanban-column-header">
          <span class="group-dot" style="background:var(--phase-${phase})"></span>
          ${PHASE_LABELS[phase]}
          <span class="kanban-column-count">${phaseItems.length}</span>
        </div>
        <div class="kanban-column-body">`;
      if (phaseItems.length === 0) {
        html += '<div class="kanban-empty">Keine Projekte</div>';
      }
      phaseItems.forEach(p => {
        const vf = state.visibleFields;

        // Top row: jira key + priority
        const topLeft = vf.has('jira_key') ? `<span class="project-jira">${p.jira_key || '—'}</span>` : '';
        const topRight = vf.has('priority') ? priorityBadge(p.priority) : '';
        const topRow = (topLeft || topRight) ? `<div class="kanban-card-meta">${topLeft || '<span></span>'}${topRight || '<span></span>'}</div>` : '';

        // Info: budget + class
        const infoLeft = vf.has('budget_chf') ? `<span class="kanban-card-budget">${formatBudgetShort(p.budget_chf)}</span>` : '';
        const infoRight = vf.has('class') ? `<span class="badge badge-class badge-sm" data-class="${p.class}">${CLASS_LABELS[p.class]}</span>` : '';
        const infoRow = (infoLeft || infoRight) ? `<div class="kanban-card-meta">${infoLeft || '<span></span>'}${infoRight || '<span></span>'}</div>` : '';

        // Tags
        const tags = vf.has('tags') ? (p.tags && p.tags.length
          ? `<div class="tag-list">${p.tags.map(t => `<span class="badge-tag">${esc(t)}</span>`).join('')}</div>`
          : `<div class="card-placeholder">Keine Tags</div>`) : '';

        // Extras
        const extras = [];
        if (vf.has('dti_required') && p.dti_required) extras.push('🚩 DTI');
        if (vf.has('hermes_phase')) extras.push(p.hermes_phase || '—');
        if (vf.has('go_decision')) extras.push(p.go_decision === true ? 'Go: Ja' : p.go_decision === false ? 'Go: Nein' : 'Go: —');
        const extrasRow = extras.length ? `<div class="kanban-card-responsible"><span class="project-date">${extras.join(' · ')}</span></div>` : '';

        // Bottom row: target_date + assignee avatar (with separator)
        const showDeadline = vf.has('target_date');
        const showAssignee = vf.has('responsible');
        const deadline = showDeadline ? `<span class="project-date">${p.target_date ? formatDate(p.target_date) : '—'}</span>` : '';
        const assigneeHTML = showAssignee ? (p.responsible
          ? `<div class="card-avatar" title="${esc(p.responsible)}">${getUserInitials(p.responsible)}</div>`
          : `<div class="card-avatar card-avatar--empty" title="Nicht zugewiesen">—</div>`) : '';
        const bottomRow = (showDeadline || showAssignee) ? `<div class="card-separator"></div><div class="kanban-card-meta">${deadline || '<span></span>'}${assigneeHTML}</div>` : '';

        html += `<div class="kanban-card" data-id="${p.id}">
          ${topRow}
          <div class="kanban-card-title">${esc(p.title)}</div>
          ${infoRow}
          ${tags}
          ${extrasRow}
          ${bottomRow}
        </div>`;
      });
      html += '</div></div>';
    }
    html += '</div>';
    return html;
  });
}

/* ═══════════════════════════════════════════════════════════
   GANTT VIEW
   ═══════════════════════════════════════════════════════════ */

function renderGanttView(container) {
  renderGroupedView(container, (items) => {
    return renderGanttChart(items);
  });
}

function renderGanttChart(projects) {
  const today = new Date();
  const durations = { fast_track: 90, standard: 180, complex: 365 };
  let minDate = new Date('2026-01-01');
  let maxDate = new Date('2026-12-31');

  const bars = projects.map(p => {
    const start = new Date(p.created_at);
    let end;
    if (p.phase === 'completed' || p.phase === 'rejected') {
      end = new Date(p.updated_at);
    } else {
      end = new Date(start);
      end.setDate(end.getDate() + (durations[p.class] || 180));
    }
    if (start < minDate) minDate = new Date(start);
    if (end > maxDate) maxDate = new Date(end);
    return { project: p, start, end };
  });

  const months = [];
  const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (cursor <= maxDate) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
  const pxPerDay = 4;
  const timelineWidth = Math.max(totalDays * pxPerDay, 800);

  function dayOffset(date) {
    return ((date - minDate) / (1000 * 60 * 60 * 24)) * pxPerDay;
  }

  let sidebarHTML = '<div class="gantt-sidebar-header">Projekt</div>';
  bars.forEach(b => {
    sidebarHTML += `<div class="gantt-sidebar-row" data-id="${b.project.id}">${esc(b.project.title)}</div>`;
  });

  let headerHTML = '';
  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  months.forEach(m => {
    const left = dayOffset(m);
    headerHTML += `<div class="gantt-month-label" style="left:${left}px">${monthNames[m.getMonth()]} ${m.getFullYear()}</div>`;
  });

  let barsHTML = '';
  const todayX = dayOffset(today);
  bars.forEach(b => {
    const left = dayOffset(b.start);
    const width = Math.max(dayOffset(b.end) - left, 4);
    barsHTML += `<div class="gantt-bar-row">
      <div class="gantt-bar" data-class="${b.project.class}" data-id="${b.project.id}" style="left:${left}px;width:${width}px" title="${esc(b.project.title)}: ${formatDate(b.start.toISOString())} – ${formatDate(b.end.toISOString())}">
        ${width > 60 ? esc(b.project.title) : ''}
      </div>
    </div>`;
  });

  return `
    <div class="gantt-container">
      <div class="gantt-chart">
        <div class="gantt-sidebar">${sidebarHTML}</div>
        <div class="gantt-timeline" style="width:${timelineWidth}px">
          <div class="gantt-timeline-header" style="width:${timelineWidth}px">${headerHTML}</div>
          <div class="gantt-timeline-body" style="width:${timelineWidth}px">
            ${barsHTML}
            <div class="gantt-today-line" style="left:${todayX}px">
              <div class="gantt-today-label">Heute</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD VIEW
   ═══════════════════════════════════════════════════════════ */

function renderDashboardView(container) {
  const projects = getFilteredProjects();
  const total = projects.length;
  const totalBudget = projects.reduce((s, p) => s + p.budget_chf, 0);
  const dtiCount = projects.filter(p => p.dti_required).length;
  const activeCount = projects.filter(p => p.phase === 'implementation').length;

  // Phase distribution
  const phaseData = PHASE_ORDER.map(ph => ({
    key: ph,
    label: PHASE_LABELS[ph],
    count: projects.filter(p => p.phase === ph).length,
  }));

  // Class distribution
  const classData = CLASS_ORDER.map(cl => ({
    key: cl,
    label: CLASS_LABELS[cl],
    count: projects.filter(p => p.class === cl).length,
    budget: projects.filter(p => p.class === cl).reduce((s, p) => s + p.budget_chf, 0),
  }));

  const phaseColors = {
    triage: 'var(--phase-triage)',
    analysis: 'var(--phase-analysis)',
    implementation: 'var(--phase-implementation)',
    completed: 'var(--phase-completed)',
    rejected: 'var(--phase-rejected)',
  };

  const classColors = {
    fast_track: 'var(--success-500)',
    standard: 'var(--accent-500)',
    complex: 'var(--warning-500)',
  };

  container.innerHTML = `
    <div class="dashboard">
      <div class="dashboard-grid">
        <div class="dashboard-kpi">
          <div class="dashboard-kpi-value">${total}</div>
          <div class="dashboard-kpi-label">Projekte Total</div>
        </div>
        <div class="dashboard-kpi">
          <div class="dashboard-kpi-value">${activeCount}</div>
          <div class="dashboard-kpi-label">In Umsetzung</div>
        </div>
        <div class="dashboard-kpi">
          <div class="dashboard-kpi-value">${dtiCount}</div>
          <div class="dashboard-kpi-label">DTI-pflichtig</div>
        </div>
        <div class="dashboard-kpi">
          <div class="dashboard-kpi-value">${formatBudget(totalBudget)}</div>
          <div class="dashboard-kpi-label">Gesamtbudget</div>
        </div>
      </div>

      <div class="dashboard-charts">
        <div class="dashboard-chart-card">
          <div class="dashboard-chart-title">Projekte nach Phase</div>
          <div class="dashboard-bar-chart">
            ${phaseData.map(d => `
              <div class="dashboard-bar-row">
                <span class="dashboard-bar-label">${d.label}</span>
                <div class="dashboard-bar-track">
                  <div class="dashboard-bar-fill" style="width:${total ? (d.count / total * 100) : 0}%;background:${phaseColors[d.key]}">
                    ${d.count > 0 ? d.count : ''}
                  </div>
                </div>
                <span class="dashboard-bar-value">${d.count}</span>
              </div>
            `).join('')}
          </div>
          <div class="dashboard-legend">
            ${phaseData.map(d => `
              <span class="dashboard-legend-item">
                <span class="dashboard-legend-dot" style="background:${phaseColors[d.key]}"></span>
                ${d.label}
              </span>
            `).join('')}
          </div>
        </div>

        <div class="dashboard-chart-card">
          <div class="dashboard-chart-title">Budget nach Klasse</div>
          <div class="dashboard-bar-chart">
            ${classData.map(d => `
              <div class="dashboard-bar-row">
                <span class="dashboard-bar-label">${d.label}</span>
                <div class="dashboard-bar-track">
                  <div class="dashboard-bar-fill" style="width:${totalBudget ? (d.budget / totalBudget * 100) : 0}%;background:${classColors[d.key]}">
                    ${d.budget > 0 ? formatBudgetShort(d.budget) : ''}
                  </div>
                </div>
                <span class="dashboard-bar-value">${d.count}</span>
              </div>
            `).join('')}
          </div>
          <div class="dashboard-legend">
            ${classData.map(d => `
              <span class="dashboard-legend-item">
                <span class="dashboard-legend-dot" style="background:${classColors[d.key]}"></span>
                ${d.label} (${d.count})
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   WIKI VIEW (placeholder)
   ═══════════════════════════════════════════════════════════ */

function renderWikiView(container) {
  container.innerHTML = `
    <div class="placeholder-view">
      <svg class="placeholder-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        <path d="M8 7h8M8 11h6"/>
      </svg>
      <h2 class="placeholder-title">Wiki</h2>
      <p class="placeholder-text">Projektdokumentation, Vorlagen und Richtlinien — in Vorbereitung.</p>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TOOLBAR
   ═══════════════════════════════════════════════════════════ */

function setupToolbar() {
  // Search toggle
  const searchToggle = document.getElementById('searchToggleBtn');
  const searchWrap = document.getElementById('toolbarSearch');
  const searchInput = document.getElementById('searchInput');

  searchToggle.addEventListener('click', () => {
    searchWrap.classList.add('expanded');
    searchInput.focus();
  });

  document.getElementById('searchClearBtn').addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    searchWrap.classList.remove('expanded');
    render();
  });

  let debounce;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      render();
    }, 300);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      state.searchQuery = '';
      searchWrap.classList.remove('expanded');
      render();
    }
  });

  // Sort
  setupDropdown('sortDropdown', 'sortBtn', 'sortMenu', (item) => {
    if (item.dataset.sort) {
      state.sortField = item.dataset.sort;
      document.getElementById('sortLabel').textContent = item.textContent.trim();
      document.querySelectorAll('#sortMenu .dropdown-item[data-sort]').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    }
    if (item.dataset.direction) {
      state.sortDirection = item.dataset.direction;
      document.querySelectorAll('#sortMenu .dropdown-item[data-direction]').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    }
    render();
  });

  // Group
  setupDropdown('groupDropdown', 'groupBtn', 'groupMenu', (item) => {
    state.groupBy = item.dataset.group;
    state.collapsedGroups.clear();
    const label = item.dataset.group === 'none' ? 'Gruppieren' : item.textContent.trim();
    document.getElementById('groupLabel').textContent = label;
    document.querySelectorAll('#groupMenu .dropdown-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('groupBtn').classList.toggle('active', state.groupBy !== 'none');
    render();
  });

  // Assignee
  setupAssigneeDropdown();

  // Assigned to me
  document.getElementById('assignedToMe').addEventListener('change', (e) => {
    state.assignedToMe = e.target.checked;
    render();
  });

  // Show archived
  document.getElementById('showArchived').addEventListener('change', (e) => {
    state.showArchived = e.target.checked;
    render();
  });

  // Fields
  const fieldsMenu = document.getElementById('fieldsMenu');
  fieldsMenu.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const field = cb.dataset.field;
      if (cb.checked) {
        state.visibleFields.add(field);
      } else {
        state.visibleFields.delete(field);
      }
      render();
    });
  });

  setupDropdown('fieldsDropdown', 'fieldsBtn', 'fieldsMenu', () => {}, true);

  // Create project
  document.getElementById('createProjectBtn').addEventListener('click', () => openModal());

  // Export
  setupDropdown('exportDropdown', 'exportBtn', 'exportMenu', (item) => {
    const type = item.dataset.export;
    if (type === 'csv') exportCSV();
    if (type === 'pdf') exportPDF();
  });
}

function setupAssigneeDropdown() {
  const responsibles = getUniqueResponsibles();
  const menu = document.getElementById('assigneeMenu');
  let html = '<div class="dropdown-item active" data-assignee="">Alle</div>';
  html += `<div class="dropdown-item" data-assignee="__none__">(nicht zugewiesen)</div>`;
  responsibles.forEach(r => {
    html += `<div class="dropdown-item" data-assignee="${esc(r)}">${esc(r)}</div>`;
  });
  menu.innerHTML = html;

  setupDropdown('assigneeDropdown', 'assigneeBtn', 'assigneeMenu', (item) => {
    const val = item.dataset.assignee;
    state.assigneeFilter = val || null;
    const label = val ? item.textContent.trim() : 'Verantwortlich';
    document.getElementById('assigneeLabel').textContent = label;
    document.querySelectorAll('#assigneeMenu .dropdown-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('assigneeBtn').classList.toggle('active', !!val);
    render();
  });
}

function setupDropdown(wrapperId, btnId, menuId, onSelect, keepOpen = false) {
  const btn = document.getElementById(btnId);
  const menu = document.getElementById(menuId);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Close all other dropdowns first
    document.querySelectorAll('.dropdown-menu.open').forEach(m => {
      if (m.id !== menuId) {
        m.classList.remove('open');
        const otherBtn = m.previousElementSibling || m.parentElement.querySelector('.toolbar-btn');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      }
    });
    const isOpen = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
  });

  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.dropdown-item');
    if (item) {
      onSelect(item);
      if (!keepOpen) menu.classList.remove('open');
    }
    e.stopPropagation();
  });

  // Close on outside click
  document.addEventListener('click', () => {
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });
}

/* ═══════════════════════════════════════════════════════════
   DETAIL PAGE
   ═══════════════════════════════════════════════════════════ */

function setupDetailPanel() {
  // No setup needed — detail page is rendered inline
}

function openDetailPanel(projectId) {
  state.previousView = state.currentView;
  state.currentView = 'detail';
  state.selectedProjectId = projectId;
  state.detailTab = 'overview';

  // Update tab UI
  document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));

  render();
}

function closeDetailPage() {
  state.currentView = state.previousView || 'gallery';
  state.selectedProjectId = null;

  // Restore tab UI
  document.querySelectorAll('.view-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.view === state.currentView);
  });

  render();
}

function renderDetailPage(container) {
  const p = state.projects.find(pr => pr.id === state.selectedProjectId);
  if (!p) return;

  const creator = getUserById(p.created_by);
  const comments = getCommentsForProject(p.id);
  const changelog = getChangelogForProject(p.id);

  // Update breadcrumb
  document.querySelector('.breadcrumb-inner').innerHTML = `
    <a href="#" class="breadcrumb-link" id="breadcrumbBack">Projekte</a>
    <span class="breadcrumb-sep">/</span>
    <span class="breadcrumb-current">${esc(p.title)}</span>
  `;

  // Hide view tabs and toolbar
  document.querySelector('.view-tabs').style.display = 'none';
  document.querySelector('.toolbar').style.display = 'none';

  const imageStyle = p.thumbnail
    ? `background-image:url('${p.thumbnail}')`
    : `background:var(--gray-100)`;

  let html = `
    <button class="detail-back" id="detailBackBtn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
      Zurück
    </button>

    <div class="detail-hero">
      <div class="detail-hero-image" style="${imageStyle}"></div>
      <div class="detail-hero-body">
        <div class="detail-hero-title">${esc(p.title)}</div>
        <div class="detail-hero-subtitle">${esc(p.requestor)}${p.responsible ? ' · ' + esc(p.responsible) : ''}</div>
        <div class="detail-hero-badges">
          <span class="badge badge-phase" data-phase="${p.phase}"><span class="phase-dot"></span>${PHASE_LABELS[p.phase]}</span>
          <span class="badge badge-class" data-class="${p.class}">${CLASS_LABELS[p.class]}</span>
          ${p.dti_required ? '<span class="badge-dti" title="DTI-pflichtig">🚩 DTI</span>' : ''}
          ${p.jira_key ? `<span class="detail-hero-jira">${esc(p.jira_key)}</span>` : ''}
        </div>
        <div class="detail-hero-actions">
          <button class="btn btn-outline btn-sm" id="detailEditBtn">Bearbeiten</button>
        </div>
      </div>
    </div>

    <div class="detail-tabs">
      <button class="detail-tab${state.detailTab === 'overview' ? ' active' : ''}" data-tab="overview">Übersicht</button>
      <button class="detail-tab${state.detailTab === 'comments' ? ' active' : ''}" data-tab="comments">Kommentare (${comments.length})</button>
      <button class="detail-tab${state.detailTab === 'changelog' ? ' active' : ''}" data-tab="changelog">Verlauf (${changelog.length})</button>
    </div>
  `;

  if (state.detailTab === 'overview') {
    html += `
      <div class="detail-card">
        <div class="detail-card-header">Projektdetails</div>
        <div class="detail-card-body">
          ${detailFieldRow('Phase', `<span class="badge badge-phase" data-phase="${p.phase}"><span class="phase-dot"></span>${PHASE_LABELS[p.phase]}</span>`)}
          ${detailFieldRow('Klasse', `<span class="badge badge-class" data-class="${p.class}">${CLASS_LABELS[p.class]}</span>`)}
          ${detailFieldRow('Priorität', priorityBadge(p.priority))}
          ${detailFieldRow('Budget', formatBudget(p.budget_chf))}
          ${detailFieldRow('Zieldatum', p.target_date ? formatDate(p.target_date) : '—')}
          ${detailFieldRow('Go-Entscheid', p.go_decision === true ? 'Genehmigt' : p.go_decision === false ? 'Abgelehnt' : 'Ausstehend')}
          ${detailFieldRow('Verantwortlich', p.responsible || '—')}
          ${detailFieldRow('Auftraggeber', esc(p.requestor))}
          ${detailFieldRow('DTI-pflichtig', p.dti_required ? 'Ja' : 'Nein')}
          ${detailFieldRow('HERMES Phase', p.hermes_phase || '—')}
          ${detailFieldRow('Jira-Key', p.jira_key || '—')}
          ${detailFieldRow('Erstellt von', creator ? esc(creator.display_name) : '—')}
          ${detailFieldRow('Erstellt am', formatDate(p.created_at))}
          ${detailFieldRow('Letzte Änderung', formatDate(p.updated_at))}
        </div>
      </div>
    `;
    if (p.tags && p.tags.length) {
      html += `
        <div class="detail-card">
          <div class="detail-card-header">Tags</div>
          <div class="detail-card-body">
            <div class="tag-list">${p.tags.map(t => `<span class="badge-tag">${esc(t)}</span>`).join('')}</div>
          </div>
        </div>
      `;
    }
    if (p.notes) {
      html += `
        <div class="detail-card">
          <div class="detail-card-header">Notizen</div>
          <div class="detail-card-body">
            <div class="detail-notes">${esc(p.notes)}</div>
          </div>
        </div>
      `;
    }
  } else if (state.detailTab === 'comments') {
    html += '<div class="detail-card"><div class="detail-card-body">';
    if (comments.length === 0) {
      html += '<div class="empty-state">Keine Kommentare vorhanden.</div>';
    } else {
      html += '<div class="comment-list">';
      comments.forEach(c => {
        const user = getUserById(c.user_id);
        const name = user ? user.display_name : 'Unbekannt';
        const initials = getUserInitials(name);
        html += `<div class="comment-item">
          <div class="comment-avatar">${initials}</div>
          <div class="comment-body">
            <div class="comment-author">${esc(name)}</div>
            <div class="comment-date">${formatDateTime(c.created_at)}</div>
            <div class="comment-text">${esc(c.body)}</div>
          </div>
        </div>`;
      });
      html += '</div>';
    }
    html += '</div></div>';
  } else if (state.detailTab === 'changelog') {
    html += '<div class="detail-card"><div class="detail-card-body">';
    if (changelog.length === 0) {
      html += '<div class="empty-state">Kein Verlauf vorhanden.</div>';
    } else {
      html += '<div class="changelog-list">';
      changelog.forEach(e => {
        const user = getUserById(e.user_id);
        const name = user ? user.display_name : 'Unbekannt';
        html += `<div class="changelog-item">
          <div class="changelog-meta">${formatDateTime(e.changed_at)}</div>
          <div class="changelog-field">${esc(name)} · ${esc(e.field)}</div>
          <div class="changelog-values">
            ${e.old_value != null ? `<span class="changelog-old">${esc(String(e.old_value))}</span>` : '—'}
            <span class="changelog-arrow">→</span>
            <span class="changelog-new">${esc(String(e.new_value))}</span>
          </div>
        </div>`;
      });
      html += '</div>';
    }
    html += '</div></div>';
  }

  container.innerHTML = html;

  // Bind events
  document.getElementById('detailBackBtn').addEventListener('click', closeDetailPage);
  document.getElementById('breadcrumbBack').addEventListener('click', (e) => {
    e.preventDefault();
    closeDetailPage();
  });
  document.getElementById('detailEditBtn').addEventListener('click', () => {
    openModal(state.selectedProjectId);
  });
  container.querySelectorAll('.detail-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.detailTab = tab.dataset.tab;
      renderDetailPage(container);
    });
  });
}

function detailFieldRow(label, value) {
  return `<div class="detail-field-row">
    <span class="detail-field-label">${label}</span>
    <span class="detail-field-value">${value}</span>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════
   CREATE / EDIT MODAL
   ═══════════════════════════════════════════════════════════ */

function setupModal() {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Auto-suggest class
  const budgetInput = document.getElementById('formBudget');
  const dtiInput = document.getElementById('formDti');
  const classSelect = document.getElementById('formClass');
  const hint = document.getElementById('classHint');

  function suggestClass() {
    const budget = Number(budgetInput.value) || 0;
    const dti = dtiInput.checked;
    let suggested;
    if (budget >= 50000 && dti) {
      suggested = 'complex';
    } else if (budget >= 50000) {
      suggested = 'standard';
    } else {
      suggested = 'fast_track';
    }
    classSelect.value = suggested;
    hint.textContent = `Vorschlag: ${CLASS_LABELS[suggested]} (Budget ${budget < 50000 ? '<' : '≥'} CHF 50k${dti ? ', DTI' : ''})`;
  }

  budgetInput.addEventListener('input', suggestClass);
  dtiInput.addEventListener('change', suggestClass);

  // Save
  document.getElementById('modalSave').addEventListener('click', () => {
    const form = document.getElementById('projectForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    saveProject();
  });
}

function openModal(projectId) {
  state.editingProjectId = projectId || null;
  const isEdit = !!projectId;
  document.getElementById('modalTitle').textContent = isEdit ? 'Projekt bearbeiten' : 'Neues Projekt erfassen';
  document.getElementById('modalOverlay').classList.add('open');
  document.body.classList.add('modal-open');

  if (isEdit) {
    const p = state.projects.find(pr => pr.id === projectId);
    if (p) {
      document.getElementById('formTitle').value = p.title;
      document.getElementById('formRequestor').value = p.requestor;
      document.getElementById('formBudget').value = p.budget_chf;
      document.getElementById('formClass').value = p.class;
      document.getElementById('formResponsible').value = p.responsible || '';
      document.getElementById('formPriority').value = p.priority || 'medium';
      document.getElementById('formTargetDate').value = p.target_date || '';
      document.getElementById('formTags').value = (p.tags || []).join(', ');
      document.getElementById('formDti').checked = !!p.dti_required;
      document.getElementById('formNotes').value = p.notes || '';
    }
  } else {
    document.getElementById('projectForm').reset();
    document.getElementById('classHint').textContent = '';
  }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.classList.remove('modal-open');
  state.editingProjectId = null;
}

function saveProject() {
  const data = {
    title: document.getElementById('formTitle').value,
    requestor: document.getElementById('formRequestor').value,
    budget_chf: Number(document.getElementById('formBudget').value),
    class: document.getElementById('formClass').value,
    responsible: document.getElementById('formResponsible').value || null,
    priority: document.getElementById('formPriority').value,
    target_date: document.getElementById('formTargetDate').value || null,
    tags: document.getElementById('formTags').value ? document.getElementById('formTags').value.split(',').map(t => t.trim()).filter(Boolean) : [],
    dti_required: document.getElementById('formDti').checked,
    notes: document.getElementById('formNotes').value || null,
  };

  if (state.editingProjectId) {
    // Edit
    const p = state.projects.find(pr => pr.id === state.editingProjectId);
    if (p) {
      Object.assign(p, data);
      p.updated_at = new Date().toISOString();
    }
  } else {
    // Create
    const maxId = Math.max(0, ...state.projects.map(p => p.id));
    state.projects.push({
      id: maxId + 1,
      ...data,
      phase: 'triage',
      go_decision: null,
      go_date: null,
      hermes_phase: null,
      jira_key: null,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  closeModal();
  render();
  if (state.currentView === 'detail' && state.selectedProjectId) {
    renderDetailPage(document.getElementById('viewContainer'));
  }
}

/* ═══════════════════════════════════════════════════════════
   UTILITY
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════════ */

function exportCSV() {
  const projects = getFilteredProjects();
  const headers = ['ID', 'Titel', 'Auftraggeber', 'Budget (CHF)', 'Klasse', 'Phase', 'Priorität', 'Verantwortlich', 'DTI', 'HERMES', 'Jira-Key', 'Tags', 'Zieldatum', 'Erstellt', 'Geändert'];
  const rows = projects.map(p => [
    p.id,
    `"${(p.title || '').replace(/"/g, '""')}"`,
    `"${(p.requestor || '').replace(/"/g, '""')}"`,
    p.budget_chf,
    CLASS_LABELS[p.class] || p.class,
    PHASE_LABELS[p.phase] || p.phase,
    PRIORITY_LABELS[p.priority] || p.priority || 'medium',
    `"${(p.responsible || '').replace(/"/g, '""')}"`,
    p.dti_required ? 'Ja' : 'Nein',
    p.hermes_phase || '',
    p.jira_key || '',
    `"${(p.tags || []).join(', ')}"`,
    p.target_date || '',
    p.created_at ? p.created_at.split('T')[0] : '',
    p.updated_at ? p.updated_at.split('T')[0] : '',
  ]);

  const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DRES_PPM_Export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF() {
  const projects = getFilteredProjects();
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="de"><head>
    <meta charset="UTF-8">
    <title>DRES PPM — Projektportfolio Bericht</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; color: #111827; margin: 40px; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      .subtitle { color: #6B7280; font-size: 12px; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th { text-align: left; padding: 8px 6px; border-bottom: 2px solid #D1D5DB; font-weight: 600; color: #374151; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
      td { padding: 6px; border-bottom: 1px solid #E5E7EB; vertical-align: top; }
      tr:hover { background: #F9FAFB; }
      .badge { display: inline-block; padding: 1px 8px; border-radius: 99px; font-size: 10px; font-weight: 500; }
      .phase-triage { background: #F3F4F6; color: #374151; }
      .phase-analysis { background: #DBEAFE; color: #1E40AF; }
      .phase-implementation { background: #FEF3C7; color: #92400E; }
      .phase-completed { background: #DCFCE7; color: #166534; }
      .phase-rejected { background: #FEE2E2; color: #991B1B; }
      .tags { color: #6B7280; }
      @media print { body { margin: 20px; } }
    </style>
  </head><body>
    <h1>Projektportfolio DRES</h1>
    <div class="subtitle">${projects.length} Projekte · Erstellt am ${new Date().toLocaleDateString('de-CH')}</div>
    <table>
      <thead><tr>
        <th>Key</th><th>Titel</th><th>Phase</th><th>Klasse</th><th>Priorität</th><th>Verantwortlich</th><th>Zieldatum</th><th>Tags</th>
      </tr></thead>
      <tbody>
        ${projects.map(p => `<tr>
          <td>${p.jira_key || '—'}</td>
          <td><strong>${esc(p.title)}</strong><br><span style="color:#6B7280">${esc(p.requestor)}</span></td>
          <td><span class="badge phase-${p.phase}">${PHASE_LABELS[p.phase]}</span></td>
          <td>${CLASS_LABELS[p.class]}</td>
          <td>${PRIORITY_LABELS[p.priority || 'medium']}</td>
          <td>${p.responsible || '—'}</td>
          <td>${p.target_date ? new Date(p.target_date).toLocaleDateString('de-CH') : '—'}</td>
          <td class="tags">${(p.tags || []).join(', ') || '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 300);
}

/* ═══════════════════════════════════════════════════════════
   UTILITY
   ═══════════════════════════════════════════════════════════ */

function priorityBadge(priority) {
  const p = priority || 'medium';
  return `<span class="badge badge-priority" data-priority="${p}">${PRIORITY_ICONS[p]} ${PRIORITY_LABELS[p]}</span>`;
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ═══════════════════════════════════════════════════════════
   DRAG & DROP
   ═══════════════════════════════════════════════════════════ */

function setupDragAndDrop(container) {
  const view = state.currentView;

  if (view === 'kanban') {
    setupKanbanDrag(container);
  } else if (['list', 'gallery', 'gantt'].includes(view) && state.groupBy !== 'none') {
    setupGroupDrag(container);
  }
}

/* ── Kanban: drag between phase columns ── */

function setupKanbanDrag(container) {
  // Make cards draggable
  container.querySelectorAll('.kanban-card').forEach(card => {
    card.setAttribute('draggable', 'true');

    card.addEventListener('dragstart', (e) => {
      card.classList.add('drag-item');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.id);
      // Store the source phase column
      const sourceColumn = card.closest('.kanban-column');
      e.dataTransfer.setData('application/x-source', sourceColumn.dataset.phase);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('drag-item');
      container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });
  });

  // Make columns drop zones
  container.querySelectorAll('.kanban-column').forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      column.classList.add('drag-over');
    });

    column.addEventListener('dragleave', (e) => {
      // Only remove if actually leaving the column (not entering a child)
      if (!column.contains(e.relatedTarget)) {
        column.classList.remove('drag-over');
      }
    });

    column.addEventListener('drop', (e) => {
      e.preventDefault();
      column.classList.remove('drag-over');
      const projectId = Number(e.dataTransfer.getData('text/plain'));
      const targetPhase = column.dataset.phase;
      const project = state.projects.find(p => p.id === projectId);
      if (project && project.phase !== targetPhase) {
        project.phase = targetPhase;
        project.updated_at = new Date().toISOString();
        render();
      }
    });
  });
}

/* ── List/Gallery/Gantt: drag between group cards ── */

function setupGroupDrag(container) {
  const draggableSelector = getDraggableSelector();
  if (!draggableSelector) return;

  // Make items draggable
  container.querySelectorAll(draggableSelector).forEach(item => {
    item.setAttribute('draggable', 'true');

    item.addEventListener('dragstart', (e) => {
      item.classList.add('drag-item');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.dataset.id);
      // Prevent click event from firing after drag
      e.stopPropagation();
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('drag-item');
      container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });
  });

  // Make group cards drop zones
  container.querySelectorAll('.group-card').forEach(groupCard => {
    const header = groupCard.querySelector('.group-header');
    if (!header) return;
    const groupKey = header.dataset.group;

    groupCard.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      groupCard.classList.add('drag-over');
    });

    groupCard.addEventListener('dragleave', (e) => {
      if (!groupCard.contains(e.relatedTarget)) {
        groupCard.classList.remove('drag-over');
      }
    });

    groupCard.addEventListener('drop', (e) => {
      e.preventDefault();
      groupCard.classList.remove('drag-over');
      const projectId = Number(e.dataTransfer.getData('text/plain'));
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return;

      // Update the field that matches the current groupBy
      const field = state.groupBy;
      const newValue = convertGroupKeyToValue(field, groupKey);
      if (project[field] !== newValue) {
        project[field] = newValue;
        project.updated_at = new Date().toISOString();
        render();
      }
    });
  });
}

function getDraggableSelector() {
  switch (state.currentView) {
    case 'list':    return '.project-row';
    case 'gallery': return '.gallery-card';
    case 'gantt':   return '.gantt-sidebar-row';
    default:        return null;
  }
}

function convertGroupKeyToValue(field, groupKey) {
  if (field === 'dti_required') {
    return groupKey === 'DTI-pflichtig';
  }
  if (field === 'responsible') {
    return groupKey === '(nicht zugewiesen)' ? null : groupKey;
  }
  // phase, class — key is the enum value directly
  return groupKey;
}
