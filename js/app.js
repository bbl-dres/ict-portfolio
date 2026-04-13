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
    { title: 'Titel', budget_chf: 'Budget', phase: 'Phase', class: 'Klasse', created_at: 'Erstellt', updated_at: 'Geändert' }[state.sortField] || 'Titel';
  if (state.groupBy !== 'none') {
    document.getElementById('groupLabel').textContent =
      { phase: 'Phase', class: 'Klasse', responsible: 'Verantwortlich', dti_required: 'DTI-pflichtig' }[state.groupBy] || 'Gruppieren';
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
  const hideForViews = ['dashboard', 'wiki'].includes(state.currentView);
  document.getElementById('sortDropdown').style.display = hideForViews ? 'none' : '';
  document.getElementById('groupDropdown').style.display = hideForViews ? 'none' : '';
  document.getElementById('fieldsDropdown').style.display = hideForViews ? 'none' : '';
  switch (state.currentView) {
    case 'list':      renderListView(container); break;      // uses renderGroupedView
    case 'gallery':   renderGalleryView(container); break;   // uses renderGroupedView
    case 'kanban':    renderKanbanView(container); break;    // uses renderGroupedView
    case 'gantt':     renderGanttView(container); break;     // uses renderGroupedView
    case 'dashboard': container.classList.add('view-container--transparent'); renderDashboardView(container); break;
    case 'wiki':      container.classList.add('view-container--transparent'); renderWikiView(container); break;
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
      // Don't trigger if clicking inside add-project-btn
      if (e.target.closest('.add-project-btn')) return;
      openDetailPanel(Number(el.dataset.id));
    });
  });

  // Add project buttons
  container.querySelectorAll('.add-project-btn').forEach(btn => {
    btn.addEventListener('click', () => openModal());
  });
}

/* ═══════════════════════════════════════════════════════════
   LIST VIEW
   ═══════════════════════════════════════════════════════════ */

function renderListView(container) {
  renderGroupedView(container, (items) => {
    return '<div class="list-card">' +
      items.map(p => renderProjectRow(p)).join('') +
    '</div>';
  });
}

function renderProjectRow(p) {
  return `<div class="project-row" data-id="${p.id}">
    <span class="project-jira">${p.jira_key || '—'}</span>
    <div class="project-row-main">
      <div class="project-title">${esc(p.title)}</div>
      <div class="project-requestor">${esc(p.requestor)}</div>
    </div>
    <span class="project-budget">${formatBudgetShort(p.budget_chf)}</span>
    <span class="project-responsible">${p.responsible || '—'}</span>
    <span class="badge badge-phase" data-phase="${p.phase}"><span class="phase-dot"></span>${PHASE_LABELS[p.phase]}</span>
    <span class="badge badge-class" data-class="${p.class}">${CLASS_LABELS[p.class]}</span>
    <span class="badge-dti" title="DTI-pflichtig">${p.dti_required ? '🚩' : ''}</span>
  </div>`;
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
  const hasImage = !!p.thumbnail;
  const imageStyle = hasImage
    ? `background-image:url('${p.thumbnail}');background-size:cover;background-position:center`
    : `background:linear-gradient(135deg, var(--gray-100) 0%, var(--gray-200) 100%)`;
  return `<div class="gallery-card" data-id="${p.id}">
    <div class="gallery-card-image" style="${imageStyle}">
      ${!hasImage ? '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h.01M7 12h10M7 17h6"/></svg>' : ''}
      <div class="card-badge">
        <span class="badge badge-class" data-class="${p.class}">${CLASS_LABELS[p.class]}</span>
      </div>
    </div>
    <div class="gallery-card-body">
      <div class="gallery-card-title">${esc(p.title)}</div>
      <div class="gallery-card-sep"></div>
      <div class="gallery-card-meta">
        <div class="gallery-card-meta-row">
          <span>${esc(p.requestor)}</span>
          <span style="font-weight:var(--font-weight-semi)">${formatBudgetShort(p.budget_chf)}</span>
        </div>
        <div class="gallery-card-meta-row">
          <span class="badge badge-phase" data-phase="${p.phase}"><span class="phase-dot"></span>${PHASE_LABELS[p.phase]}</span>
          <span>${p.responsible || '—'}</span>
        </div>
      </div>
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
      html += `<div class="kanban-column">
        <div class="kanban-column-header">
          <span class="group-dot" style="background:var(--phase-${phase})"></span>
          ${PHASE_LABELS[phase]}
          <span class="kanban-column-count">${phaseItems.length}</span>
        </div>
        <div class="kanban-column-body">`;
      phaseItems.forEach(p => {
        html += `<div class="kanban-card" data-id="${p.id}">
          <div class="kanban-card-title">${esc(p.title)}</div>
          <div class="kanban-card-meta">
            <span class="kanban-card-budget">${formatBudgetShort(p.budget_chf)}</span>
            <span class="badge badge-class" data-class="${p.class}" style="font-size:10px;padding:1px 6px">${CLASS_LABELS[p.class]}</span>
          </div>
          ${p.responsible ? `<div style="font-size:var(--font-size-xs);color:var(--gray-500);margin-top:var(--space-2)">${esc(p.responsible)}</div>` : ''}
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
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--gray-300)">
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
      if (m.id !== menuId) m.classList.remove('open');
    });
    menu.classList.toggle('open');
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
  });
}

/* ═══════════════════════════════════════════════════════════
   DETAIL PANEL
   ═══════════════════════════════════════════════════════════ */

function setupDetailPanel() {
  document.getElementById('detailBackBtn').addEventListener('click', closeDetailPanel);
  document.getElementById('panelOverlay').addEventListener('click', closeDetailPanel);
  document.getElementById('detailEditBtn').addEventListener('click', () => {
    if (state.selectedProjectId) openModal(state.selectedProjectId);
  });
}

function openDetailPanel(projectId) {
  state.selectedProjectId = projectId;
  state.detailTab = 'overview';
  document.getElementById('detailPanel').classList.add('open');
  document.getElementById('panelOverlay').classList.add('open');
  renderDetailPanel();
}

function closeDetailPanel() {
  state.selectedProjectId = null;
  document.getElementById('detailPanel').classList.remove('open');
  document.getElementById('panelOverlay').classList.remove('open');
}

function renderDetailPanel() {
  const p = state.projects.find(pr => pr.id === state.selectedProjectId);
  if (!p) return;

  const creator = getUserById(p.created_by);
  const body = document.getElementById('detailPanelBody');

  let html = `
    <div class="detail-tabs">
      <button class="detail-tab${state.detailTab === 'overview' ? ' active' : ''}" data-tab="overview">Übersicht</button>
      <button class="detail-tab${state.detailTab === 'comments' ? ' active' : ''}" data-tab="comments">Kommentare</button>
      <button class="detail-tab${state.detailTab === 'changelog' ? ' active' : ''}" data-tab="changelog">Verlauf</button>
    </div>`;

  if (state.detailTab === 'overview') {
    html += `
      <div class="detail-title">${esc(p.title)}</div>
      <div class="detail-fields">
        <div class="detail-field">
          <span class="detail-field-label">Phase</span>
          <span class="detail-field-value"><span class="badge badge-phase" data-phase="${p.phase}"><span class="phase-dot"></span>${PHASE_LABELS[p.phase]}</span></span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Klasse</span>
          <span class="detail-field-value"><span class="badge badge-class" data-class="${p.class}">${CLASS_LABELS[p.class]}</span></span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Budget</span>
          <span class="detail-field-value">${formatBudget(p.budget_chf)}</span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Go-Entscheid</span>
          <span class="detail-field-value">${p.go_decision === true ? '✅ Genehmigt' : p.go_decision === false ? '❌ Abgelehnt' : 'Ausstehend'}</span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Verantwortlich</span>
          <span class="detail-field-value">${p.responsible || '—'}</span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Auftraggeber</span>
          <span class="detail-field-value">${esc(p.requestor)}</span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">DTI-pflichtig</span>
          <span class="detail-field-value">${p.dti_required ? 'Ja' : 'Nein'}</span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">HERMES Phase</span>
          <span class="detail-field-value">${p.hermes_phase || '—'}</span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Jira-Key</span>
          <span class="detail-field-value">${p.jira_key || '—'}</span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Erstellt von</span>
          <span class="detail-field-value">${creator ? esc(creator.display_name) : '—'}</span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Erstellt am</span>
          <span class="detail-field-value">${formatDate(p.created_at)}</span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Letzte Änderung</span>
          <span class="detail-field-value">${formatDate(p.updated_at)}</span>
        </div>
      </div>
      ${p.notes ? `
        <div class="detail-section">
          <div class="detail-section-title">Notizen</div>
          <div class="detail-notes">${esc(p.notes)}</div>
        </div>` : ''}
    `;
  } else if (state.detailTab === 'comments') {
    const comments = getCommentsForProject(p.id);
    html += '<div class="comment-list">';
    if (comments.length === 0) {
      html += '<div style="color:var(--gray-400);font-size:var(--font-size-sm)">Keine Kommentare vorhanden.</div>';
    }
    comments.forEach(c => {
      const user = getUserById(c.user_id);
      const name = user ? user.display_name : 'Unbekannt';
      const initials = getUserInitials(name);
      html += `<div class="comment-item">
        <div class="comment-avatar">${initials}</div>
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-author">${esc(name)}</span>
            <span class="comment-date">${formatDateTime(c.created_at)}</span>
          </div>
          <div class="comment-text">${esc(c.body)}</div>
        </div>
      </div>`;
    });
    html += '</div>';
  } else if (state.detailTab === 'changelog') {
    const entries = getChangelogForProject(p.id);
    html += '<div class="changelog-list">';
    if (entries.length === 0) {
      html += '<div style="color:var(--gray-400);font-size:var(--font-size-sm)">Kein Verlauf vorhanden.</div>';
    }
    entries.forEach(e => {
      const user = getUserById(e.user_id);
      const name = user ? user.display_name : 'Unbekannt';
      html += `<div class="changelog-item">
        <span class="changelog-date">${formatDateTime(e.changed_at)}</span>
        <div class="changelog-detail">
          <span class="changelog-field">${esc(e.field)}</span>
          ${e.old_value != null ? `<span class="changelog-old">${esc(String(e.old_value))}</span> →` : '→'}
          <span class="changelog-new">${esc(String(e.new_value))}</span>
          <div style="font-size:var(--font-size-xs);color:var(--gray-400);margin-top:2px">${esc(name)}</div>
        </div>
      </div>`;
    });
    html += '</div>';
  }

  body.innerHTML = html;

  // Bind tabs
  body.querySelectorAll('.detail-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.detailTab = tab.dataset.tab;
      renderDetailPanel();
    });
  });
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

  if (isEdit) {
    const p = state.projects.find(pr => pr.id === projectId);
    if (p) {
      document.getElementById('formTitle').value = p.title;
      document.getElementById('formRequestor').value = p.requestor;
      document.getElementById('formBudget').value = p.budget_chf;
      document.getElementById('formClass').value = p.class;
      document.getElementById('formResponsible').value = p.responsible || '';
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
  state.editingProjectId = null;
}

function saveProject() {
  const data = {
    title: document.getElementById('formTitle').value,
    requestor: document.getElementById('formRequestor').value,
    budget_chf: Number(document.getElementById('formBudget').value),
    class: document.getElementById('formClass').value,
    responsible: document.getElementById('formResponsible').value || null,
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
  if (state.selectedProjectId) renderDetailPanel();
}

/* ═══════════════════════════════════════════════════════════
   UTILITY
   ═══════════════════════════════════════════════════════════ */

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
