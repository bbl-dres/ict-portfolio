/* ═══════════════════════════════════════════════════════════
   DRES PPM — Main Application
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  restoreFromURL();
  setupViewTabs();
  setupToolbar();
  setupFilterToggle();
  setupViewContainerEvents();
  setupFilterPanelEvents();
  setupBadgeFilterClicks();
  setupDragAndDrop();
  setupModal();
  setupImagePreview();
  renderFilterPills();
  updateFilterCountBadge();
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
  if (params.has('archived')) state.showArchived = params.get('archived') === '1';

  // Restore multi-dimensional filters
  if (params.has('f.phase'))    params.get('f.phase').split(',').forEach(v => state.filters.phase.add(v));
  if (params.has('f.complexity'))    params.get('f.complexity').split(',').forEach(v => state.filters.complexity.add(v));
  if (params.has('f.type'))     params.get('f.type').split(',').forEach(v => state.filters.type.add(v));
  if (params.has('f.priority')) params.get('f.priority').split(',').forEach(v => state.filters.priority.add(v));
  if (params.has('f.responsible')) params.get('f.responsible').split(',').forEach(v => state.filters.responsible.add(v));
  if (params.has('f.tags'))     params.get('f.tags').split(',').forEach(v => state.filters.tags.add(v));
  if (params.has('f.dti'))      state.filters.dti = params.get('f.dti') === '1';

  // Sync UI to restored state
  document.querySelectorAll('.view-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.view === state.currentView);
  });
  document.getElementById('sortLabel').textContent =
    { title: 'Titel', budget_chf: 'Budget', phase: 'Phase', complexity: 'Komplexität', type: 'Typ', priority: 'Priorität', created_at: 'Erstellt', updated_at: 'Geändert' }[state.sortField] || 'Titel';
  if (state.groupBy !== 'none') {
    document.getElementById('groupLabel').textContent =
      { phase: 'Phase', complexity: 'Komplexität', type: 'Typ', responsible: 'Verantwortlich', priority: 'Priorität', dti_required: 'DTI-pflichtig' }[state.groupBy] || 'Gruppieren';
    document.getElementById('groupBtn').classList.add('active');
  }
  // Sync sort field active state
  document.querySelectorAll('#sortMenu .dropdown-item[data-sort]').forEach(i => {
    i.classList.toggle('active', i.dataset.sort === state.sortField);
  });
  // Sync sort direction active state
  document.querySelectorAll('#sortMenu .dropdown-item[data-direction]').forEach(i => {
    i.classList.toggle('active', i.dataset.direction === state.sortDirection);
  });

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
  if (state.showArchived)               params.set('archived', '1');

  // Multi-dimensional filters
  if (state.filters.phase.size)    params.set('f.phase', [...state.filters.phase].join(','));
  if (state.filters.complexity.size)    params.set('f.complexity', [...state.filters.complexity].join(','));
  if (state.filters.type.size)     params.set('f.type', [...state.filters.type].join(','));
  if (state.filters.priority.size) params.set('f.priority', [...state.filters.priority].join(','));
  if (state.filters.responsible.size) params.set('f.responsible', [...state.filters.responsible].join(','));
  if (state.filters.tags.size)     params.set('f.tags', [...state.filters.tags].join(','));
  if (state.filters.dti != null)   params.set('f.dti', state.filters.dti ? '1' : '0');

  const qs = params.toString();
  const url = window.location.pathname + (qs ? '?' + qs : '');
  window.history.replaceState(null, '', url);
}

/* ═══════════════════════════════════════════════════════════
   RENDER ORCHESTRATOR
   ═══════════════════════════════════════════════════════════ */

function render() {
  renderView();
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
  document.getElementById('filterToggleBtn').style.display = hideControls ? 'none' : '';
  document.getElementById('assigneeDropdown').style.display = hideControls ? 'none' : '';
  document.getElementById('fieldsDropdown').style.display = hideControls ? 'none' : '';
  document.querySelector('.toolbar-sep').style.display = hideControls ? 'none' : '';

  // Show/hide filter panel and pills in detail view
  if (isDetail) {
    document.getElementById('filterPanel').classList.remove('open');
    document.getElementById('filterPills').classList.remove('visible');
  } else {
    if (state.filterPanelOpen) document.getElementById('filterPanel').classList.add('open');
    if (hasActiveFilters()) document.getElementById('filterPills').classList.add('visible');
  }

  // Restore breadcrumb when not in detail
  if (!isDetail) {
    document.querySelector('.breadcrumb-inner').innerHTML = `
      <div class="breadcrumb-trail">
        <span>Projekte</span>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">Übersicht</span>
      </div>
    `;
  }

  switch (state.currentView) {
    case 'list':      renderListView(container); break;
    case 'gallery':   renderGalleryView(container); break;
    case 'kanban':    renderKanbanView(container); break;
    case 'gantt':     renderGanttView(container); scrollGanttToToday(); break;
    case 'dashboard': container.classList.add('view-container--transparent'); renderDashboardView(container); break;
    case 'wiki':      container.classList.add('view-container--transparent'); renderWikiView(container); break;
    case 'detail':    container.classList.add('view-container--transparent'); renderDetailPage(container); updateURL(); return;
  }
  updateURL();
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

  if (projects.length === 0) {
    container.innerHTML = `<div class="placeholder-view">
      <svg class="placeholder-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
      <div class="placeholder-title">Keine Projekte gefunden</div>
      <div class="placeholder-text">Die aktiven Filter ergeben keine Treffer. Passen Sie die Filterkriterien an oder setzen Sie alle Filter zurück.</div>
    </div>`;
    return;
  }

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

  // Set draggable attributes (events are delegated via setupViewContainerEvents)
  setupDragAttributes(container);
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

/* ── Delegated event handler for viewContainer (set up once) ── */

function setupViewContainerEvents() {
  const container = document.getElementById('viewContainer');

  // Breadcrumb back link (outside viewContainer, delegate on document)
  document.querySelector('.breadcrumb-inner').addEventListener('click', (e) => {
    const back = e.target.closest('#breadcrumbBack, #detailBackBtn');
    if (back) { e.preventDefault(); closeDetailPage(); }
  });

  container.addEventListener('click', (e) => {
    // Group header toggles
    const header = e.target.closest('.group-header');
    if (header) {
      const key = header.dataset.group;
      if (state.collapsedGroups.has(key)) {
        state.collapsedGroups.delete(key);
      } else {
        state.collapsedGroups.add(key);
      }
      renderView();
      return;
    }

    // Gantt zoom controls
    const scaleBtn = e.target.closest('.gantt-scale-btn');
    if (scaleBtn) {
      state.ganttScale = scaleBtn.dataset.scale;
      renderView();
      return;
    }

    // Gantt navigation (today, left, right)
    const navBtn = e.target.closest('.gantt-nav-btn');
    if (navBtn) {
      const action = navBtn.dataset.nav;
      if (action === 'today') {
        scrollGanttToToday(true);
      } else {
        const timeline = document.querySelector('.gantt-timeline');
        if (timeline) {
          const step = timeline.clientWidth * 0.6;
          timeline.scrollLeft += action === 'right' ? step : -step;
        }
      }
      return;
    }

    // Add project buttons
    if (e.target.closest('.add-project-btn')) {
      openModal();
      return;
    }

    // Detail page: back button
    if (e.target.closest('#detailBackBtn')) {
      closeDetailPage();
      return;
    }

    // Detail page: image preview
    if (e.target.closest('.detail-hero-image')) {
      openImagePreview();
      return;
    }

    // Detail page: inline edit toggle
    if (e.target.closest('#detailEditBtn')) {
      state.detailEditing = true;
      renderDetailPage(container);
      return;
    }
    if (e.target.closest('#detailCancelBtn')) {
      state.detailEditing = false;
      renderDetailPage(container);
      return;
    }
    if (e.target.closest('#detailSaveBtn')) {
      saveInlineEdit();
      return;
    }

    // Detail page: section collapse toggle
    const sectionHeader = e.target.closest('.detail-section-header');
    if (sectionHeader) {
      sectionHeader.classList.toggle('collapsed');
      const body = sectionHeader.nextElementSibling;
      if (body) body.classList.toggle('collapsed');
      return;
    }

    // Detail page: tab clicks
    const detailTab = e.target.closest('.detail-tab');
    if (detailTab) {
      state.detailTab = detailTab.dataset.tab;
      renderDetailPage(container);
      return;
    }

    // Project row / card clicks (open detail) — must be last
    // Skip if click was on a badge (handled by setupBadgeFilterClicks)
    if (e.target.closest('.badge-phase, .badge-complexity, .badge-type, .badge-priority, .badge-tag')) return;
    const item = e.target.closest('[data-id]');
    if (item) {
      openDetailPanel(Number(item.dataset.id));
    }
  });

  // Keyboard accessibility: Enter/Space on focusable [data-id] elements
  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('[data-id][role="button"]');
    if (item) {
      e.preventDefault();
      openDetailPanel(Number(item.dataset.id));
    }
  });
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
  if (vf.has('jira_key'))      cols.push({ key: 'jira_key',     width: '56px' });
  // Title is always shown
  cols.push({ key: '_title', width: 'minmax(180px, 2fr)' });
  if (vf.has('phase'))         cols.push({ key: 'phase',        width: '100px' });
  if (vf.has('complexity'))    cols.push({ key: 'complexity',   width: '95px' });
  if (vf.has('type'))          cols.push({ key: 'type',         width: '140px' });
  if (vf.has('priority'))      cols.push({ key: 'priority',     width: '90px' });
  if (vf.has('responsible'))   cols.push({ key: 'responsible',  width: '130px' });
  if (vf.has('budget_chf'))    cols.push({ key: 'budget_chf',   width: '72px' });
  if (vf.has('tags'))          cols.push({ key: 'tags',         width: 'minmax(120px, 1fr)' });
  if (vf.has('target_date'))   cols.push({ key: 'target_date',  width: '92px' });
  if (vf.has('go_decision'))   cols.push({ key: 'go_decision',  width: '90px' });
  if (vf.has('hermes_phase'))  cols.push({ key: 'hermes_phase', width: '110px' });
  if (vf.has('dti_required'))  cols.push({ key: 'dti_required', width: '44px' });
  if (vf.has('created_at'))    cols.push({ key: 'created_at',   width: '92px' });
  return cols;
}

function renderProjectRow(p, cols, gridCols) {
  const vf = state.visibleFields;
  let cells = '';
  for (const col of cols) {
    switch (col.key) {
      case 'jira_key':     cells += `<span class="project-jira">#${p.id}</span>`; break;
      case '_title':       cells += `<div class="project-row-main"><div class="project-title">${esc(p.title)}</div>${vf.has('requestor') ? `<div class="project-requestor">${esc(p.requestor)}</div>` : ''}</div>`; break;
      case 'budget_chf':   cells += `<span class="project-budget">${formatBudgetShort(p.budget_chf)}</span>`; break;
      case 'responsible':  cells += `<span class="project-responsible">${p.responsible || '—'}</span>`; break;
      case 'phase':        cells += `<span class="badge badge-phase" data-phase="${p.phase}">${PHASE_LABELS[p.phase]}</span>`; break;
      case 'type':         cells += typeBadge(p.type); break;
      case 'complexity':   cells += `<span class="badge badge-complexity" data-complexity="${p.complexity}">${COMPLEXITY_LABELS[p.complexity]}</span>`; break;
      case 'priority':     cells += priorityBadge(p.priority); break;
      case 'tags':         cells += `<div class="tag-list">${(p.tags || []).map(t => `<span class="badge-tag">${esc(t)}</span>`).join('')}</div>`; break;
      case 'target_date':  cells += `<span class="project-date">${p.target_date ? formatDate(p.target_date) : '—'}</span>`; break;
      case 'go_decision':  cells += `<span class="project-go">${p.go_decision === true ? 'Ja' : p.go_decision === false ? 'Nein' : '—'}</span>`; break;
      case 'hermes_phase': cells += `<span class="project-hermes">${(HERMES_LABELS[p.hermes_phase] || p.hermes_phase || '—')}</span>`; break;
      case 'dti_required': cells += p.dti_required ? '<span class="badge badge-dti">DTI</span>' : '<span></span>'; break;
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
    ? `background-image:url('${escCSSUrl(p.thumbnail)}');background-size:cover;background-position:center`
    : `background:linear-gradient(145deg, var(--gray-50) 0%, var(--gray-200) 60%, var(--accent-50) 100%)`;

  // Top row: project id + priority
  const topLeft = `<span class="project-jira">#${p.id}</span>`;
  const topRight = vf.has('priority') ? priorityBadge(p.priority) : '';
  const topRow = `<div class="gallery-card-meta-row">${topLeft}${topRight || '<span></span>'}</div>`;

  // Info row: requestor + budget
  const infoLeft = vf.has('requestor') ? `<span>${esc(p.requestor)}</span>` : '';
  const infoRight = vf.has('budget_chf') ? `<span class="gallery-card-budget">${formatBudgetShort(p.budget_chf)}</span>` : '';
  const infoRow = (infoLeft || infoRight) ? `<div class="gallery-card-meta-row">${infoLeft || '<span></span>'}${infoRight || '<span></span>'}</div>` : '';

  // Badge row: class + phase in card body
  const badgeParts = [];
  if (vf.has('complexity')) badgeParts.push(`<span class="badge badge-complexity" data-complexity="${p.complexity}">${COMPLEXITY_LABELS[p.complexity]}</span>`);
  if (vf.has('phase')) badgeParts.push(`<span class="badge badge-phase" data-phase="${p.phase}">${PHASE_LABELS[p.phase]}</span>`);
  const badgeRow = badgeParts.length ? `<div class="gallery-card-badges">${badgeParts.join('')}</div>` : '';

  // Type badge on image overlay (top left)
  const typeBadgeOverlay = vf.has('type') ? `<div class="card-badge">${typeBadge(p.type)}</div>` : '';

  // Tags
  const tags = vf.has('tags') ? (p.tags && p.tags.length
    ? `<div class="tag-list">${p.tags.map(t => `<span class="badge-tag">${esc(t)}</span>`).join('')}</div>`
    : `<div class="card-placeholder">Keine Tags</div>`) : '';

  // Extras row: dti, hermes, go_decision, created_at
  const extras = [];
  if (vf.has('dti_required') && p.dti_required) extras.push('DTI');
  if (vf.has('hermes_phase')) extras.push((HERMES_LABELS[p.hermes_phase] || p.hermes_phase || '—'));
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
      ${typeBadgeOverlay}
    </div>
    <div class="gallery-card-body">
      ${topRow}
      <div class="gallery-card-title">${esc(p.title)}</div>
      ${infoRow}
      ${badgeRow}
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
          ${PHASE_LABELS[phase]}
          <span class="kanban-column-count">${phaseItems.length}</span>
        </div>
        <div class="kanban-column-body">`;
      if (phaseItems.length === 0) {
        html += '<div class="kanban-empty">Keine Projekte</div>';
      }
      phaseItems.forEach(p => {
        const vf = state.visibleFields;

        // Top row: project id + priority
        const topLeft = `<span class="project-jira">#${p.id}</span>`;
        const topRight = vf.has('priority') ? priorityBadge(p.priority) : '';
        const topRow = `<div class="kanban-card-meta">${topLeft}${topRight || '<span></span>'}</div>`;

        // Info: budget
        const budgetHtml = vf.has('budget_chf') ? `<span class="kanban-card-budget">${formatBudgetShort(p.budget_chf)}</span>` : '';

        // Class + Type badge row (consistent with gallery overlay)
        const classBadgeHtml = vf.has('complexity') ? `<span class="badge badge-complexity" data-complexity="${p.complexity}">${COMPLEXITY_LABELS[p.complexity]}</span>` : '';
        const typeBadgeHtml = vf.has('type') ? typeBadge(p.type) : '';
        const badgeRow = (classBadgeHtml || typeBadgeHtml) ? `<div class="kanban-card-meta">${classBadgeHtml}${typeBadgeHtml}${budgetHtml ? `<span style="margin-left:auto">${budgetHtml}</span>` : ''}</div>` : (budgetHtml ? `<div class="kanban-card-meta">${budgetHtml}</div>` : '');

        // Tags
        const tags = vf.has('tags') ? (p.tags && p.tags.length
          ? `<div class="tag-list">${p.tags.map(t => `<span class="badge-tag">${esc(t)}</span>`).join('')}</div>`
          : `<div class="card-placeholder">Keine Tags</div>`) : '';

        // Extras
        const extras = [];
        if (vf.has('dti_required') && p.dti_required) extras.push('DTI');
        if (vf.has('hermes_phase')) extras.push((HERMES_LABELS[p.hermes_phase] || p.hermes_phase || '—'));
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
          ${badgeRow}
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

function scrollGanttToToday(smooth) {
  // Double-rAF: first frame triggers layout, second frame scrolls reliably
  requestAnimationFrame(() => { requestAnimationFrame(() => {
    const timeline = document.querySelector('.gantt-timeline');
    if (!timeline) return;
    const todayLine = timeline.querySelector('.gantt-today-line');
    if (!todayLine) return;
    const todayLeft = parseFloat(todayLine.style.left);
    if (!smooth) timeline.style.scrollBehavior = 'auto';
    timeline.scrollLeft = Math.max(todayLeft - timeline.clientWidth / 2, 0);
    if (!smooth) requestAnimationFrame(() => { timeline.style.scrollBehavior = ''; });
  }); });
}

const GANTT_SCALES = {
  year:    { pxPerDay: 1,  label: 'Jahr' },
  quarter: { pxPerDay: 3,  label: 'Quartal' },
  month:   { pxPerDay: 10, label: 'Monat' },
};

function renderGanttChart(projects) {
  const today = new Date();
  // Estimated bar length when target_date is missing, based on project class
  const fallbackDurations = { fast_track: 90, standard: 180, complex: 365 };
  let minDate = new Date(today.getFullYear(), 0, 1);
  let maxDate = new Date(today.getFullYear(), 11, 31);

  const bars = projects.map(p => {
    const start = new Date(p.created_at);
    let end;
    if (p.phase === 'completed' || p.phase === 'rejected') {
      end = new Date(p.updated_at);
    } else if (p.target_date) {
      end = new Date(p.target_date);
    } else {
      end = new Date(start);
      end.setDate(end.getDate() + (fallbackDurations[p.complexity] || 180));
    }
    if (start < minDate) minDate = new Date(start);
    if (end > maxDate) maxDate = new Date(end);
    return { project: p, start, end };
  });

  // Pad range to full years
  minDate = new Date(minDate.getFullYear(), 0, 1);
  maxDate = new Date(maxDate.getFullYear(), 11, 31);

  const scale = GANTT_SCALES[state.ganttScale] || GANTT_SCALES.quarter;
  const pxPerDay = scale.pxPerDay;
  const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
  const timelineWidth = Math.max(totalDays * pxPerDay, 800);

  function dayOffset(date) {
    return ((date - minDate) / (1000 * 60 * 60 * 24)) * pxPerDay;
  }

  // Sidebar
  let sidebarHTML = '<div class="gantt-sidebar-header">Projekt</div>';
  bars.forEach(b => {
    sidebarHTML += `<div class="gantt-sidebar-row" data-id="${b.project.id}" tabindex="0" role="button">${esc(b.project.title)}</div>`;
  });

  // Year headers (major axis)
  let yearHeaderHTML = '';
  for (let y = minDate.getFullYear(); y <= maxDate.getFullYear(); y++) {
    const yearStart = new Date(y, 0, 1);
    const yearEnd = new Date(y, 11, 31);
    const left = dayOffset(yearStart < minDate ? minDate : yearStart);
    const right = dayOffset(yearEnd > maxDate ? maxDate : yearEnd);
    const width = right - left;
    yearHeaderHTML += `<div class="gantt-year-label" style="left:${left}px;width:${width}px">${y}</div>`;
  }

  // Month headers (minor axis)
  let monthHeaderHTML = '';
  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const quarterNames = ['Q1', '', '', 'Q2', '', '', 'Q3', '', '', 'Q4', '', ''];
  const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (cursor <= maxDate) {
    const left = dayOffset(cursor);
    const m = cursor.getMonth();
    let label;
    if (state.ganttScale === 'year') {
      label = quarterNames[m];
    } else {
      label = monthNames[m];
    }
    monthHeaderHTML += `<div class="gantt-month-label" style="left:${left}px">${label}</div>`;
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Bars
  let barsHTML = '';
  const todayX = dayOffset(today);
  bars.forEach(b => {
    const left = dayOffset(b.start);
    const width = Math.max(dayOffset(b.end) - left, 4);
    barsHTML += `<div class="gantt-bar-row">
      <div class="gantt-bar" data-complexity="${b.project.complexity}" data-id="${b.project.id}" tabindex="0" role="button" style="left:${left}px;width:${width}px" title="${esc(b.project.title)}: ${formatDate(b.start.toISOString())} – ${formatDate(b.end.toISOString())}">
        ${width > 60 ? esc(b.project.title) : ''}
      </div>
    </div>`;
  });

  // Zoom controls + navigation
  const scaleButtons = Object.entries(GANTT_SCALES).map(([key, s]) =>
    `<button class="gantt-scale-btn ${state.ganttScale === key ? 'active' : ''}" data-scale="${key}">${s.label}</button>`
  ).join('');

  const navWidget = `<div class="gantt-nav">
    <button class="gantt-nav-btn" data-nav="left" title="Zurück">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <button class="gantt-nav-btn gantt-nav-today" data-nav="today">Heute</button>
    <button class="gantt-nav-btn" data-nav="right" title="Vorwärts">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
    </button>
  </div>`;

  return `
    <div class="gantt-container">
      <div class="gantt-controls">${scaleButtons}${navWidget}</div>
      <div class="gantt-chart">
        <div class="gantt-sidebar">${sidebarHTML}</div>
        <div class="gantt-timeline">
          <div class="gantt-year-header" style="width:${timelineWidth}px">${yearHeaderHTML}</div>
          <div class="gantt-timeline-header" style="width:${timelineWidth}px">${monthHeaderHTML}</div>
          <div class="gantt-timeline-body" style="width:${timelineWidth}px">
            ${barsHTML}
            <div class="gantt-today-line" style="left:${todayX}px">
              <div class="gantt-today-label">Heute, ${formatDate(today.toISOString())}</div>
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

  // Single-pass aggregation
  let totalBudget = 0, dtiCount = 0, activeCount = 0;
  const phaseCounts = {};
  const classCounts = {};
  const classBudgets = {};
  for (const p of projects) {
    totalBudget += p.budget_chf;
    if (p.dti_required) dtiCount++;
    if (p.phase === 'implementation') activeCount++;
    phaseCounts[p.phase] = (phaseCounts[p.phase] || 0) + 1;
    classCounts[p.complexity] = (classCounts[p.complexity] || 0) + 1;
    classBudgets[p.complexity] = (classBudgets[p.complexity] || 0) + p.budget_chf;
  }

  const phaseData = PHASE_ORDER.map(ph => ({
    key: ph, label: PHASE_LABELS[ph], count: phaseCounts[ph] || 0,
  }));

  const classData = COMPLEXITY_ORDER.map(cl => ({
    key: cl, label: COMPLEXITY_LABELS[cl], count: classCounts[cl] || 0, budget: classBudgets[cl] || 0,
  }));

  const phaseColors = PHASE_COLORS;
  const classColors = COMPLEXITY_COLORS;

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
          <div class="dashboard-chart-title">Budget nach Komplexität</div>
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

  let debounce;

  document.getElementById('searchClearBtn').addEventListener('click', () => {
    clearTimeout(debounce);
    searchInput.value = '';
    state.searchQuery = '';
    searchWrap.classList.remove('expanded');
    render();
  });

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      render();
    }, 300);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearTimeout(debounce);
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
  setupDropdown('assigneeDropdown', 'assigneeBtn', 'assigneeMenu', () => {}, true);

  // Create project
  document.getElementById('createProjectBtn').addEventListener('click', () => openModal());

  // Share modal
  setupShareModal();

  // Header brand → home (gallery, clear filters)
  document.getElementById('headerBrandHome').addEventListener('click', (e) => {
    e.preventDefault();
    clearAllFilters();
    state.searchQuery = '';
    state.selectedProjectId = null;
    state.detailEditing = false;
    state.currentView = 'gallery';
    document.querySelectorAll('.view-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.view === 'gallery');
    });
    renderFilterPills();
    updateFilterCountBadge();
    if (state.filterPanelOpen) renderFilterPanel();
    render();
  });

  // Export
  setupDropdown('exportDropdown', 'exportBtn', 'exportMenu', (item) => {
    const type = item.dataset.export;
    if (type === 'csv') exportCSV();
    if (type === 'pdf') exportPDF();
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
        const wrapper = m.closest('.toolbar-dropdown');
        const otherBtn = wrapper ? wrapper.querySelector('[aria-expanded]') : null;
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
}

// Single global listener to close all dropdowns and search on outside click
document.addEventListener('click', (e) => {
  document.querySelectorAll('.dropdown-menu.open').forEach(m => {
    m.classList.remove('open');
    // Find the toggle button reliably: it's the sibling with aria-expanded
    // within the same .toolbar-dropdown wrapper
    const wrapper = m.closest('.toolbar-dropdown');
    const btn = wrapper ? wrapper.querySelector('[aria-expanded]') : null;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  });

  // Collapse search if click is outside it and query is empty
  const searchWrap = document.getElementById('toolbarSearch');
  if (searchWrap.classList.contains('expanded') && !searchWrap.contains(e.target)) {
    const input = document.getElementById('searchInput');
    if (!input.value.trim()) {
      searchWrap.classList.remove('expanded');
    }
  }
});

/* ═══════════════════════════════════════════════════════════
   FILTER PANEL & PILLS
   ═══════════════════════════════════════════════════════════ */

function setupFilterToggle() {
  document.getElementById('filterToggleBtn').addEventListener('click', () => {
    state.filterPanelOpen = !state.filterPanelOpen;
    document.getElementById('filterToggleBtn').classList.toggle('active', state.filterPanelOpen);
    renderFilterPanel();
  });

  // Assignee dropdown
  setupAssigneeDropdown();
}

function setupAssigneeDropdown() {
  const menu = document.getElementById('assigneeMenu');
  const list = document.getElementById('assigneeList');

  function populateList() {
    const responsibles = new Set();
    const currentUser = getUserById(state.currentUserId);
    const meName = currentUser ? currentUser.display_name : null;
    state.projects.forEach(p => {
      if (p.responsible && p.responsible !== meName) responsibles.add(p.responsible);
    });
    list.innerHTML = [...responsibles].sort().map(r =>
      `<label class="dropdown-checkbox"><input type="checkbox" data-assignee="${esc(r)}" ${state.filters.responsible.has(r) ? 'checked' : ''}> ${esc(r)}</label>`
    ).join('');
  }

  function syncChecks() {
    document.getElementById('assigneeMeCheck').checked = state.filters.responsible.has('__me__');
    document.getElementById('assigneeNoneCheck').checked = state.filters.responsible.has('__none__');
    list.querySelectorAll('input[data-assignee]').forEach(cb => {
      cb.checked = state.filters.responsible.has(cb.dataset.assignee);
    });
    const count = state.filters.responsible.size;
    document.getElementById('assigneeLabel').textContent = count > 0 ? `Zuweisung (${count})` : 'Zuweisung';
    document.getElementById('assigneeBtn').classList.toggle('active', count > 0);
  }

  // Populate on each open
  document.getElementById('assigneeBtn').addEventListener('click', () => {
    populateList();
    syncChecks();
  });

  // Handle checkbox changes
  menu.addEventListener('change', (e) => {
    const cb = e.target;
    if (!cb.dataset || !cb.dataset.assignee) return;
    if (cb.checked) {
      state.filters.responsible.add(cb.dataset.assignee);
    } else {
      state.filters.responsible.delete(cb.dataset.assignee);
    }
    syncChecks();
    renderFilterPills();
    updateFilterCountBadge();
    render();
  });

  // Stop click propagation so dropdown stays open on checkbox click
  menu.addEventListener('click', (e) => { e.stopPropagation(); });
}

function renderFilterPanel() {
  const panel = document.getElementById('filterPanel');
  panel.classList.toggle('open', state.filterPanelOpen);

  if (!state.filterPanelOpen) return;

  const f = state.filters;
  const allTags = getAllTags();

  const phaseOpts = PHASE_ORDER.map(k => {
    const checked = f.phase.has(k) ? 'checked' : '';
    return `<label class="filter-option"><input type="checkbox" data-dim="phase" data-val="${k}" ${checked}>${PHASE_LABELS[k]}</label>`;
  }).join('');

  const classOpts = COMPLEXITY_ORDER.map(k => {
    const checked = f.complexity.has(k) ? 'checked' : '';
    return `<label class="filter-option"><input type="checkbox" data-dim="complexity" data-val="${k}" ${checked}>${COMPLEXITY_LABELS[k]}</label>`;
  }).join('');

  const typeOpts = TYPE_ORDER.map(k => {
    const checked = f.type.has(k) ? 'checked' : '';
    return `<label class="filter-option"><input type="checkbox" data-dim="type" data-val="${k}" ${checked}>${TYPE_LABELS[k]}</label>`;
  }).join('');

  const prioOpts = PRIORITY_ORDER.map(k => {
    const checked = f.priority.has(k) ? 'checked' : '';
    return `<label class="filter-option"><input type="checkbox" data-dim="priority" data-val="${k}" ${checked}>${PRIORITY_LABELS[k]}</label>`;
  }).join('');

  const responsibles = getUniqueResponsibles();
  const currentUser = getUserById(state.currentUserId);
  const meName = currentUser ? currentUser.display_name : null;
  let respOpts = '';
  if (meName) {
    const checked = f.responsible.has('__me__') ? 'checked' : '';
    respOpts += `<label class="filter-option"><input type="checkbox" data-dim="responsible" data-val="__me__" ${checked}>Mir zugewiesen (${esc(meName)})</label>`;
  }
  const noneChecked = f.responsible.has('__none__') ? 'checked' : '';
  respOpts += `<label class="filter-option"><input type="checkbox" data-dim="responsible" data-val="__none__" ${noneChecked}>Nicht zugewiesen</label>`;
  responsibles.forEach(r => {
    if (r === meName) return; // already shown as "Mir zugewiesen"
    const checked = f.responsible.has(r) ? 'checked' : '';
    respOpts += `<label class="filter-option"><input type="checkbox" data-dim="responsible" data-val="${esc(r)}" ${checked}>${esc(r)}</label>`;
  });

  const dtiVal = f.dti;
  const dtiOpts = [
    `<label class="filter-option"><input type="radio" name="filter-dti" data-dim="dti" data-val="any" ${dtiVal == null ? 'checked' : ''}>Alle</label>`,
    `<label class="filter-option"><input type="radio" name="filter-dti" data-dim="dti" data-val="true" ${dtiVal === true ? 'checked' : ''}>Ja</label>`,
    `<label class="filter-option"><input type="radio" name="filter-dti" data-dim="dti" data-val="false" ${dtiVal === false ? 'checked' : ''}>Nein</label>`,
  ].join('');

  const tagChips = allTags.map(t => {
    const sel = f.tags.has(t) ? ' selected' : '';
    return `<button class="filter-tag-chip${sel}" data-dim="tags" data-val="${esc(t)}">${esc(t)}</button>`;
  }).join('');

  panel.innerHTML = `
    <div class="filter-panel-grid">
      <div>
        <div class="filter-section-title">Phase</div>
        <div class="filter-section-options">${phaseOpts}</div>
      </div>
      <div>
        <div class="filter-section-title">Komplexität</div>
        <div class="filter-section-options">${classOpts}</div>
      </div>
      <div>
        <div class="filter-section-title">Typ</div>
        <div class="filter-section-options">${typeOpts}</div>
      </div>
      <div>
        <div class="filter-section-title">Priorität</div>
        <div class="filter-section-options">${prioOpts}</div>
      </div>
      <div>
        <div class="filter-section-title">Verantwortlich</div>
        <div class="filter-section-options">${respOpts}</div>
      </div>
      <div>
        <div class="filter-section-title">DTI-pflichtig</div>
        <div class="filter-section-options">${dtiOpts}</div>
      </div>
      <div>
        <div class="filter-section-title">Tags</div>
        <div class="filter-tags-wrap">${tagChips || '<span style="color:var(--gray-400);font-size:var(--font-size-xs)">Keine Tags</span>'}</div>
      </div>
      <div>
        <div class="filter-section-title">Anzeige</div>
        <div class="filter-section-options">
          <label class="filter-option"><input type="checkbox" id="showArchived" ${state.showArchived ? 'checked' : ''}>Archivierte anzeigen</label>
        </div>
      </div>
    </div>`;

  // Events are delegated via setupFilterPanelEvents() — no per-render binding needed
}

/* ── Delegated event handler for filterPanel (set up once) ── */

function setupFilterPanelEvents() {
  const panel = document.getElementById('filterPanel');

  // Checkbox/radio changes (filter dimensions + archived toggle)
  panel.addEventListener('change', (e) => {
    const input = e.target;

    // Archived toggle
    if (input.id === 'showArchived') {
      state.showArchived = input.checked;
      render();
      return;
    }

    // Filter dimension inputs
    const dim = input.dataset.dim;
    const val = input.dataset.val;
    if (dim) {
      if (dim === 'dti') {
        state.filters.dti = val === 'any' ? null : val === 'true';
      } else {
        toggleFilter(dim, val);
      }
      renderFilterPills();
      updateFilterCountBadge();
      render();
    }
  });

  // Tag chip clicks
  panel.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-tag-chip');
    if (chip) {
      toggleFilter('tags', chip.dataset.val);
      chip.classList.toggle('selected');
      renderFilterPills();
      updateFilterCountBadge();
      render();
    }
  });

  // Filter pills: remove individual pill or reset all (delegate on #filterPills)
  const pillsContainer = document.getElementById('filterPills');
  pillsContainer.addEventListener('click', (e) => {
    // Individual pill remove
    const removeBtn = e.target.closest('.filter-pill-remove');
    if (removeBtn) {
      const dim = removeBtn.dataset.dim;
      const val = removeBtn.dataset.val;
      if (dim === 'dti') {
        state.filters.dti = null;
      } else {
        state.filters[dim].delete(val);
      }
      renderFilterPills();
      updateFilterCountBadge();
      if (state.filterPanelOpen) renderFilterPanel();
      render();
      return;
    }

    // Reset all filters
    if (e.target.closest('#filterResetBtn')) {
      clearAllFilters();
      renderFilterPills();
      updateFilterCountBadge();
      if (state.filterPanelOpen) renderFilterPanel();
      render();
    }
  });
}

function renderFilterPills() {
  const container = document.getElementById('filterPills');
  const active = hasActiveFilters();
  container.classList.toggle('visible', active);

  if (!active) { container.innerHTML = ''; return; }

  const f = state.filters;
  let html = '<span class="filter-pills-label">Aktive Filter:</span>';

  for (const k of f.phase) {
    html += filterPill('phase', k, PHASE_LABELS[k], PHASE_COLORS[k]);
  }
  for (const k of f.complexity) {
    html += filterPill('complexity', k, COMPLEXITY_LABELS[k], COMPLEXITY_COLORS[k]);
  }
  for (const k of f.type) {
    html += filterPill('type', k, TYPE_LABELS[k], TYPE_COLORS[k] || 'var(--gray-500)');
  }
  for (const k of f.priority) {
    html += filterPill('priority', k, PRIORITY_LABELS[k], PRIORITY_COLORS[k]);
  }
  for (const r of f.responsible) {
    const label = r === '__me__' ? 'Mir zugewiesen' : r === '__none__' ? 'Nicht zugewiesen' : r;
    html += filterPill('responsible', r, label, 'var(--accent-500)');
  }
  for (const t of f.tags) {
    html += filterPill('tags', t, t, 'var(--gray-400)');
  }
  if (f.dti != null) {
    html += filterPill('dti', String(f.dti), f.dti ? 'DTI: Ja' : 'DTI: Nein', 'var(--error-500)');
  }

  html += `<button class="filter-reset-btn" id="filterResetBtn">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
    Alle Filter zurücksetzen
  </button>`;

  container.innerHTML = html;
}

/* Filter pills use event delegation — set up once in setupFilterPanelEvents */

function filterPill(dim, val, label, color) {
  return `<span class="filter-pill" style="background:color-mix(in srgb, ${color} 12%, white); border-color:color-mix(in srgb, ${color} 30%, transparent);">
    ${esc(label)}
    <button class="filter-pill-remove" data-dim="${dim}" data-val="${esc(val)}" aria-label="Filter entfernen">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  </span>`;
}

function updateFilterCountBadge() {
  const f = state.filters;
  const count = f.phase.size + f.complexity.size + f.type.size + f.priority.size + f.responsible.size + f.tags.size + (f.dti != null ? 1 : 0);
  const badge = document.getElementById('filterCountBadge');
  badge.textContent = count;
  badge.classList.toggle('visible', count > 0);
  document.getElementById('filterToggleBtn').classList.toggle('active', count > 0 || state.filterPanelOpen);
}

/* ── Badge click → add filter (event delegation) ── */

function setupBadgeFilterClicks() {
  document.getElementById('viewContainer').addEventListener('click', (e) => {
    // Don't intercept clicks that should navigate to detail
    const card = e.target.closest('[data-id]');

    const applyBadgeFilter = (dim, val) => {
      if (state.currentView === 'detail') {
        state.filters[dim].clear();
        state.filters[dim].add(val);
        state.previousView = 'gallery';
        closeDetailPage();
        renderFilterPills();
        updateFilterCountBadge();
        if (state.filterPanelOpen) renderFilterPanel();
      } else {
        toggleFilter(dim, val);
        afterBadgeClick();
      }
    };

    const phaseBadge = e.target.closest('.badge-phase');
    if (phaseBadge) {
      e.stopPropagation();
      const val = phaseBadge.dataset.phase;
      if (val) { applyBadgeFilter('phase', val); return; }
    }

    const classBadge = e.target.closest('.badge-complexity');
    if (classBadge) {
      e.stopPropagation();
      const val = classBadge.dataset.complexity;
      if (val) { applyBadgeFilter('complexity', val); return; }
    }

    const typeBadgeEl = e.target.closest('.badge-type');
    if (typeBadgeEl) {
      e.stopPropagation();
      const val = typeBadgeEl.dataset.type;
      if (val) { applyBadgeFilter('type', val); return; }
    }

    const prioBadge = e.target.closest('.badge-priority');
    if (prioBadge) {
      e.stopPropagation();
      const val = prioBadge.dataset.priority;
      if (val) { applyBadgeFilter('priority', val); return; }
    }

    const tagBadge = e.target.closest('.badge-tag');
    if (tagBadge) {
      e.stopPropagation();
      const val = tagBadge.textContent.trim();
      if (val) { applyBadgeFilter('tags', val); return; }
    }

    // Dashboard bar/legend clicks
    const barRow = e.target.closest('.dashboard-bar-row');
    if (barRow) {
      const chartCard = barRow.closest('.dashboard-chart-card');
      if (chartCard) {
        const title = chartCard.querySelector('.dashboard-chart-title').textContent;
        const label = barRow.querySelector('.dashboard-bar-label').textContent.trim();
        handleDashboardFilterClick(title, label);
        return;
      }
    }

    const legendItem = e.target.closest('.dashboard-legend-item');
    if (legendItem) {
      const chartCard = legendItem.closest('.dashboard-chart-card');
      if (chartCard) {
        const title = chartCard.querySelector('.dashboard-chart-title').textContent;
        let label = legendItem.textContent.trim();
        // Legend items for class have " (N)" suffix — strip it
        label = label.replace(/\s*\(\d+\)$/, '');
        handleDashboardFilterClick(title, label);
        return;
      }
    }
  });
}

function handleDashboardFilterClick(chartTitle, label) {
  // Determine dimension and value from chart title and label
  let key;
  if (chartTitle.includes('Phase')) {
    key = Object.entries(PHASE_LABELS).find(([, v]) => v === label)?.[0];
    if (key) toggleFilter('phase', key);
  } else if (chartTitle.includes('Komplexität') || chartTitle.includes('Budget')) {
    key = Object.entries(COMPLEXITY_LABELS).find(([, v]) => v === label)?.[0];
    if (key) toggleFilter('complexity', key);
  }
  if (key) {
    renderFilterPills();
    updateFilterCountBadge();
    switchFromDashboard();
    // If still on dashboard (previousView was dashboard), just re-render in place
    if (state.currentView === 'dashboard') render();
  }
}

function switchFromDashboard() {
  if (state.currentView === 'dashboard') {
    const targetView = state.previousView && state.previousView !== 'dashboard' ? state.previousView : 'gallery';
    state.currentView = targetView;
    document.querySelectorAll('.view-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.view === state.currentView);
    });
    render();
  }
}

function afterBadgeClick() {
  renderFilterPills();
  updateFilterCountBadge();
  if (state.filterPanelOpen) renderFilterPanel();
  render();
}

/* ═══════════════════════════════════════════════════════════
   DETAIL PAGE
   ═══════════════════════════════════════════════════════════ */

function openDetailPanel(projectId) {
  if (state.currentView !== 'detail') {
    state.previousView = state.currentView;
  }
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
  state.detailEditing = false;

  // Restore tab UI
  document.querySelectorAll('.view-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.view === state.currentView);
  });

  render();
}

// Field name translations for changelog display
const FIELD_LABELS = {
  phase: 'Phase', complexity: 'Komplexität', type: 'Typ', priority: 'Priorität',
  budget_chf: 'Budget', go_decision: 'Go-Entscheid', go_date: 'Go-Datum',
  responsible: 'Verantwortlich', requestor: 'Auftraggeber', notes: 'Notizen',
  description: 'Beschreibung', tags: 'Tags', target_date: 'Zieldatum',
  dti_required: 'DTI-pflichtig', hermes_phase: 'HERMES Phase',
  jira_key: 'Jira-Key', gever_url: 'GEVER Dossier', title: 'Titel',
};

// Translate raw changelog values to German labels
function translateFieldValue(field, raw) {
  if (raw == null || raw === 'null') return '—';
  const val = String(raw).replace(/^"|"$/g, '');
  if (field === 'phase') return PHASE_LABELS[val] || val;
  if (field === 'complexity') return COMPLEXITY_LABELS[val] || val;
  if (field === 'type') return TYPE_LABELS[val] || val;
  if (field === 'priority') return PRIORITY_LABELS[val] || val;
  if (field === 'hermes_phase') return HERMES_LABELS[val] || val;
  if (field === 'go_decision') return val === 'true' ? 'Genehmigt' : val === 'false' ? 'Abgelehnt' : val;
  if (field === 'dti_required') return val === 'true' ? 'Ja' : 'Nein';
  return val;
}

function renderDetailPage(container) {
  const p = state.projects.find(pr => pr.id === state.selectedProjectId);
  if (!p) return;

  const creator = getUserById(p.created_by);
  const comments = getCommentsForProject(p.id);
  const changelog = getChangelogForProject(p.id);

  // Update breadcrumb
  document.querySelector('.breadcrumb-inner').innerHTML = `
    <div class="breadcrumb-trail">
      <a href="#" class="breadcrumb-link" id="breadcrumbBack">Projekte</a>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">${esc(p.title)}</span>
    </div>
    <button class="detail-back" id="detailBackBtn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
      Zurück
    </button>
  `;

  // Hide view tabs and toolbar
  document.querySelector('.view-tabs').style.display = 'none';
  document.querySelector('.toolbar').style.display = 'none';

  const editing = state.detailEditing;
  const imageStyle = p.thumbnail
    ? `background-image:url('${escCSSUrl(p.thumbnail)}')`
    : `background:var(--gray-100)`;

  // Go-Entscheid with icon
  const goIcon = p.go_decision === true
    ? '<span class="go-badge go-badge--yes">✓ Genehmigt</span>'
    : p.go_decision === false
      ? '<span class="go-badge go-badge--no">✗ Abgelehnt</span>'
      : '<span class="go-badge go-badge--pending">⏳ Ausstehend</span>';

  // Tags in hero
  const tagsHTML = (p.tags && p.tags.length)
    ? `<div class="detail-hero-tags">${p.tags.map(t => `<span class="badge-tag">${esc(t)}</span>`).join('')}</div>`
    : '';

  // Action buttons
  const actionButtons = editing
    ? `<div class="detail-hero-actions">
        <button class="btn btn-outline btn-sm" id="detailCancelBtn">Abbrechen</button>
        <button class="btn btn-primary btn-sm" id="detailSaveBtn">Speichern</button>
      </div>`
    : `<button class="btn btn-outline btn-sm" id="detailEditBtn">Bearbeiten</button>`;

  let html = `
    <div class="detail-hero">
      <div class="detail-hero-image" style="${imageStyle}">
        ${p.type ? `<div class="card-badge">${typeBadge(p.type)}</div>` : ''}
      </div>
      <div class="detail-hero-body">
        <div class="detail-hero-top">
          <div class="detail-hero-title">${esc(p.title)}</div>
          ${actionButtons}
        </div>
        ${p.description ? `<div class="detail-hero-description">${esc(p.description)}</div>` : ''}
        ${tagsHTML}
      </div>
    </div>

    <div class="detail-tabs">
      <button class="detail-tab${state.detailTab === 'overview' ? ' active' : ''}" data-tab="overview">Übersicht</button>
      <button class="detail-tab${state.detailTab === 'changelog' ? ' active' : ''}" data-tab="changelog">Verlauf (${changelog.length})</button>
    </div>
  `;

  const sectionChevron = '<svg class="detail-section-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';

  if (state.detailTab === 'overview') {
    const phaseBadgeHTML = p.phase
      ? `<span class="badge badge-phase" data-phase="${p.phase}">${PHASE_LABELS[p.phase] || p.phase}</span>`
      : '—';
    const classBadgeHTML = p.complexity
      ? `<span class="badge badge-complexity" data-complexity="${p.complexity}">${COMPLEXITY_LABELS[p.complexity] || p.complexity}</span>`
      : '—';

    // Status & Planung — Summary / KPIs
    html += `
      <div class="detail-section">
        <div class="detail-section-header" data-section="status">
          ${sectionChevron}
          <span class="detail-section-title">Zusammenfassung</span>
        </div>
        <div class="detail-section-body">
          <div class="detail-fields-grid">
            ${detailFieldRow('Projekt-ID', '#' + p.id)}
            ${editing
              ? detailEditRow('Verantwortlich', detailInput('editResponsible', p.responsible, 'text'))
              : detailFieldRow('Verantwortlich', p.responsible || '—')}
            ${detailFieldRow('Name', esc(p.title))}
            ${editing
              ? detailEditRow('Komplexität', detailSelect('editComplexity', COMPLEXITY_LABELS, p.complexity))
              : detailFieldRow('Komplexität', classBadgeHTML)}
            ${editing
              ? detailEditRow('Typ', detailSelect('editType', TYPE_LABELS, p.type || 'new'))
              : detailFieldRow('Typ', p.type ? typeBadge(p.type) : '—')}
            ${detailFieldRow('Phase', phaseBadgeHTML)}
            ${editing
              ? detailEditRow('Zieldatum', detailInput('editTargetDate', p.target_date, 'date'))
              : detailFieldRow('Zieldatum', p.target_date ? formatDate(p.target_date) : '—')}
            ${editing
              ? detailEditRow('Priorität', detailSelect('editPriority', PRIORITY_LABELS, p.priority || 'medium'))
              : detailFieldRow('Priorität', priorityBadge(p.priority))}
            ${detailFieldRow('Go-Entscheid', goIcon)}
            ${editing
              ? detailEditRow('GEVER Dossier', detailInput('editGeverUrl', p.gever_url, 'text'))
              : detailFieldRow('GEVER Dossier', p.gever_url
                ? `<a href="${esc(p.gever_url)}" target="_blank" rel="noopener" class="detail-link">${esc(p.gever_url)}</a>`
                : '—')}
            ${detailFieldRow('Erstellt', formatDateTime(p.created_at) + (creator ? ' · ' + esc(creator.display_name) : ''))}
            <div class="detail-field-row" style="grid-column:2">
              <span class="detail-field-label">Letzte Änderung</span>
              <span class="detail-field-value">${formatDateTime(p.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // 1. Erfassung & Triage
    html += `
      <div class="detail-section">
        <div class="detail-section-header" data-section="triage">
          ${sectionChevron}
          <span class="detail-section-title">1. Erfassung &amp; Triage</span>
        </div>
        <div class="detail-section-body">
          <div class="detail-fields-grid">
            ${editing
              ? detailEditRow('Auftraggeber', detailInput('editRequestor', p.requestor, 'text'))
              : detailFieldRow('Auftraggeber', esc(p.requestor))}
            ${editing
              ? detailEditRow('Beschreibung', `<textarea class="form-input form-input--desc" id="editDescription" rows="3" placeholder="Beschreibung...">${esc(p.description || '')}</textarea>`)
              : detailFieldRow('Beschreibung', p.description ? esc(p.description) : '—')}
            ${editing
              ? detailEditRow('Tags', `<input class="form-input form-input--inline" type="text" id="editTags" value="${esc((p.tags || []).join(', '))}" placeholder="z.B. SAP, Migration">`)
              : detailFieldRow('Tags', (p.tags && p.tags.length) ? p.tags.map(t => `<span class="badge-tag">${esc(t)}</span>`).join(' ') : '—')}
          </div>
        </div>
      </div>
    `;

    // 2. Bewertung, Analyse & Freigabe
    html += `
      <div class="detail-section">
        <div class="detail-section-header" data-section="assessment">
          ${sectionChevron}
          <span class="detail-section-title">2. Bewertung, Analyse &amp; Freigabe</span>
        </div>
        <div class="detail-section-body">
          <div class="detail-fields-grid">
            ${editing
              ? detailEditRow('DTI-pflichtig', `<label class="form-checkbox-inline"><input type="checkbox" id="editDti" ${p.dti_required ? 'checked' : ''}> Ja</label>`)
              : detailFieldRow('DTI-pflichtig', p.dti_required ? 'Ja' : 'Nein')}
            ${detailFieldRow('HERMES Phase', (HERMES_LABELS[p.hermes_phase] || p.hermes_phase || '—'))}
            ${detailFieldRow('Go-Datum', p.go_date ? formatDate(p.go_date) : '—')}
            ${editing
              ? detailEditRow('Jira-Key', detailInput('editJiraKey', p.jira_key, 'text'))
              : detailFieldRow('Jira-Key', p.jira_key || '—')}
          </div>
        </div>
      </div>
    `;

    // Comments section
    html += `
      <div class="detail-section">
        <div class="detail-section-header" data-section="comments">
          <svg class="detail-section-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          <span class="detail-section-title">Kommentare (${comments.length})</span>
        </div>
        <div class="detail-section-body">`;
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
            <div class="comment-author">${esc(name)} <span class="comment-date">${formatDateTime(c.created_at)}</span></div>
            <div class="comment-text">${esc(c.body)}</div>
          </div>
        </div>`;
      });
      html += '</div>';
    }
    html += `
        <div class="comment-input-placeholder">
          <div class="comment-input-box">Kommentar hinzufügen...</div>
        </div>
      </div>
    </div>`; // close detail-section-body + detail-section

  } else if (state.detailTab === 'changelog') {
    html += '<div class="detail-card"><div class="detail-card-body">';
    if (changelog.length === 0) {
      html += '<div class="empty-state">Kein Verlauf vorhanden.</div>';
    } else {
      html += '<div class="changelog-list">';
      changelog.forEach(e => {
        const user = getUserById(e.user_id);
        const name = user ? user.display_name : 'Unbekannt';
        const fieldLabel = FIELD_LABELS[e.field] || e.field;
        const oldVal = translateFieldValue(e.field, e.old_value);
        const newVal = translateFieldValue(e.field, e.new_value);
        html += `<div class="changelog-item">
          <div class="changelog-dot"></div>
          <div class="changelog-content">
            <div class="changelog-meta">${formatDateTime(e.changed_at)}</div>
            <div class="changelog-field">${esc(name)} änderte <strong>${esc(fieldLabel)}</strong></div>
            <div class="changelog-values">
              ${e.old_value != null ? `<span class="changelog-old">${esc(oldVal)}</span>` : '—'}
              <span class="changelog-arrow">→</span>
              <span class="changelog-new">${esc(newVal)}</span>
            </div>
          </div>
        </div>`;
      });
      html += '</div>';
    }
    html += '</div></div>';
  }

  container.innerHTML = html;
}

function detailFieldRow(label, value) {
  return `<div class="detail-field-row">
    <span class="detail-field-label">${label}</span>
    <span class="detail-field-value">${value}</span>
  </div>`;
}

function detailInput(id, value, type) {
  if (type === 'text') return `<input class="form-input form-input--inline" type="text" id="${id}" value="${esc(value || '')}">`;
  if (type === 'number') return `<input class="form-input form-input--inline" type="number" id="${id}" value="${value || 0}" min="0">`;
  if (type === 'date') return `<input class="form-input form-input--inline" type="date" id="${id}" value="${value || ''}">`;
  if (type === 'checkbox') return `<input type="checkbox" id="${id}" ${value ? 'checked' : ''}>`;
  return '';
}

function detailSelect(id, options, selected) {
  const opts = Object.entries(options).map(([k, v]) =>
    `<option value="${k}" ${k === selected ? 'selected' : ''}>${esc(v)}</option>`
  ).join('');
  return `<select class="form-input form-input--inline" id="${id}">${opts}</select>`;
}

function detailEditRow(label, inputHTML) {
  return `<div class="detail-field-row">
    <span class="detail-field-label">${label}</span>
    <span class="detail-field-value">${inputHTML}</span>
  </div>`;
}

function saveInlineEdit() {
  const p = state.projects.find(pr => pr.id === state.selectedProjectId);
  if (!p) return;

  p.description = document.getElementById('editDescription').value || null;
  p.requestor = document.getElementById('editRequestor').value;
  p.budget_chf = Number(document.getElementById('editBudget').value) || 0;
  p.type = document.getElementById('editType').value;
  p.complexity = document.getElementById('editComplexity').value;
  p.priority = document.getElementById('editPriority').value;
  p.target_date = document.getElementById('editTargetDate').value || null;
  p.responsible = document.getElementById('editResponsible').value || null;
  p.dti_required = document.getElementById('editDti').checked;
  p.jira_key = document.getElementById('editJiraKey').value || null;
  p.gever_url = document.getElementById('editGeverUrl').value || null;
  const tagsRaw = document.getElementById('editTags').value;
  p.tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
  p.updated_at = new Date().toISOString();

  state.detailEditing = false;
  render();
  renderDetailPage(document.getElementById('viewContainer'));
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

function openModal() {
  state.editingProjectId = null;
  document.getElementById('modalTitle').textContent = 'Neues Projekt erfassen';
  document.getElementById('modalOverlay').classList.add('open');
  document.body.classList.add('modal-open');
  document.getElementById('projectForm').reset();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.classList.remove('modal-open');
  state.editingProjectId = null;
}

function setupShareModal() {
  const overlay = document.getElementById('shareOverlay');
  const urlInput = document.getElementById('shareUrl');
  const embedInput = document.getElementById('shareEmbed');
  const embedToggle = document.getElementById('shareEmbedToggle');
  const embedBody = document.getElementById('shareEmbedBody');

  const openShare = () => {
    const url = window.location.href;
    urlInput.value = url;
    embedInput.value = `<iframe src="${url}" width="100%" height="600" frameborder="0"></iframe>`;
    embedToggle.setAttribute('aria-expanded', 'false');
    embedBody.hidden = true;
    overlay.classList.add('open');
    document.body.classList.add('modal-open');
  };
  const closeShare = () => {
    overlay.classList.remove('open');
    document.body.classList.remove('modal-open');
  };

  document.getElementById('shareBtn').addEventListener('click', openShare);
  document.getElementById('shareClose').addEventListener('click', closeShare);
  document.getElementById('shareCloseBtn').addEventListener('click', closeShare);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeShare(); });

  embedToggle.addEventListener('click', () => {
    const open = embedToggle.getAttribute('aria-expanded') === 'true';
    embedToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    embedBody.hidden = open;
  });

  const wireCopy = (btnId, sourceEl) => {
    document.getElementById(btnId).addEventListener('click', async () => {
      const btn = document.getElementById(btnId);
      try {
        await navigator.clipboard.writeText(sourceEl.value);
      } catch {
        sourceEl.select();
        document.execCommand('copy');
      }
      btn.classList.add('btn-copied');
      const original = btn.innerHTML;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
      setTimeout(() => { btn.innerHTML = original; btn.classList.remove('btn-copied'); }, 1500);
    });
  };
  wireCopy('shareUrlCopy', urlInput);
  wireCopy('shareEmbedCopy', embedInput);
}

function saveProject() {
  const tagsInput = document.getElementById('formTags').value;
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];

  const maxId = Math.max(0, ...state.projects.map(p => p.id));
  const now = new Date().toISOString();
  state.projects.push({
    id: maxId + 1,
    title: document.getElementById('formTitle').value,
    description: document.getElementById('formDescription').value || null,
    requestor: document.getElementById('formRequestor').value,
    type: document.getElementById('formType').value,
    tags,
    budget_chf: 0,
    complexity: 'fast_track',
    phase: 'triage',
    priority: 'medium',
    go_decision: null,
    go_date: null,
    responsible: null,
    target_date: null,
    dti_required: false,
    hermes_phase: null,
    thumbnail: null,
    jira_key: null,
    notes: null,
    created_by: state.currentUserId,
    created_at: now,
    updated_at: now,
  });

  closeModal();
  render();
}

/* ═══════════════════════════════════════════════════════════
   IMAGE PREVIEW
   ═══════════════════════════════════════════════════════════ */

function setupImagePreview() {
  const overlay = document.getElementById('imagePreviewOverlay');
  const img = document.getElementById('imagePreviewImg');
  const body = document.getElementById('imagePreviewBody');
  const uploadInput = document.getElementById('imageUploadInput');
  let zoomLevel = 1;
  let panX = 0, panY = 0, isPanning = false, panStartX, panStartY;
  // Pinch state
  let lastPinchDist = 0;

  function setZoom(level, centerX, centerY) {
    zoomLevel = Math.min(Math.max(level, 0.5), 5);
    img.style.transform = `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`;
    const label = document.getElementById('imagePreviewZoomLabel');
    if (label) label.textContent = Math.round(zoomLevel * 100) + '%';
  }

  function resetZoom() {
    zoomLevel = 1; panX = 0; panY = 0;
    img.style.transform = '';
    const label = document.getElementById('imagePreviewZoomLabel');
    if (label) label.textContent = '100%';
  }

  // Close
  document.getElementById('imagePreviewClose').addEventListener('click', closeImagePreview);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || (e.target === body && !isPanning)) closeImagePreview();
  });
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeImagePreview();
    if (e.key === '+' || e.key === '=') { setZoom(zoomLevel * 1.2); e.preventDefault(); }
    if (e.key === '-') { setZoom(zoomLevel / 1.2); e.preventDefault(); }
    if (e.key === '0') { resetZoom(); e.preventDefault(); }
  });

  // Scroll wheel zoom (desktop)
  body.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(zoomLevel * delta);
  }, { passive: false });

  // Zoom buttons
  document.getElementById('imagePreviewZoomIn').addEventListener('click', () => setZoom(zoomLevel * 1.3));
  document.getElementById('imagePreviewZoomOut').addEventListener('click', () => setZoom(zoomLevel / 1.3));
  document.getElementById('imagePreviewZoomReset').addEventListener('click', resetZoom);

  // Pan with mouse drag (when zoomed)
  body.addEventListener('mousedown', (e) => {
    if (zoomLevel <= 1) return;
    isPanning = true;
    panStartX = e.clientX - panX;
    panStartY = e.clientY - panY;
    body.style.cursor = 'grabbing';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    panX = e.clientX - panStartX;
    panY = e.clientY - panStartY;
    img.style.transform = `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`;
  });
  document.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      body.style.cursor = '';
    }
  });

  // Pinch-to-zoom (mobile)
  body.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      lastPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      isPanning = true;
      panStartX = e.touches[0].clientX - panX;
      panStartY = e.touches[0].clientY - panY;
    }
  }, { passive: true });

  body.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastPinchDist > 0) {
        setZoom(zoomLevel * (dist / lastPinchDist));
      }
      lastPinchDist = dist;
    } else if (e.touches.length === 1 && isPanning) {
      panX = e.touches[0].clientX - panStartX;
      panY = e.touches[0].clientY - panStartY;
      img.style.transform = `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`;
    }
  }, { passive: false });

  // Touch end: reset state + double-tap to toggle zoom
  let lastTap = 0;
  body.addEventListener('touchend', (e) => {
    lastPinchDist = 0;
    isPanning = false;
    // Double-tap detection
    if (e.changedTouches.length === 1) {
      const now = Date.now();
      if (now - lastTap < 300) {
        zoomLevel > 1 ? resetZoom() : setZoom(2.5);
      }
      lastTap = now;
    }
  });

  // Download
  document.getElementById('imagePreviewDownload').addEventListener('click', () => {
    const p = state.projects.find(pr => pr.id === state.selectedProjectId);
    if (!p || !p.thumbnail) return;
    const a = document.createElement('a');
    a.href = p.thumbnail;
    a.download = p.title.replace(/[^a-zA-Z0-9äöüÄÖÜ\-_ ]/g, '') + '.jpg';
    a.click();
  });

  // Upload
  document.getElementById('imagePreviewUpload').addEventListener('click', () => uploadInput.click());
  uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const p = state.projects.find(pr => pr.id === state.selectedProjectId);
    if (!p) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      p.thumbnail = ev.target.result;
      p.updated_at = new Date().toISOString();
      img.src = ev.target.result;
      resetZoom();
      const heroImg = document.querySelector('.detail-hero-image');
      if (heroImg) heroImg.style.backgroundImage = `url('${ev.target.result}')`;
    };
    reader.readAsDataURL(file);
    uploadInput.value = '';
  });

  // Delete
  document.getElementById('imagePreviewDelete').addEventListener('click', () => {
    const p = state.projects.find(pr => pr.id === state.selectedProjectId);
    if (!p) return;
    p.thumbnail = null;
    p.updated_at = new Date().toISOString();
    closeImagePreview();
    renderDetailPage(document.getElementById('viewContainer'));
  });
}

function openImagePreview() {
  const p = state.projects.find(pr => pr.id === state.selectedProjectId);
  if (!p || !p.thumbnail) return;
  const img = document.getElementById('imagePreviewImg');
  img.src = p.thumbnail;
  img.style.transform = '';
  document.getElementById('imagePreviewTitle').textContent = p.title;
  document.getElementById('imagePreviewZoomLabel').textContent = '100%';
  document.getElementById('imagePreviewOverlay').classList.add('open');
  document.body.classList.add('modal-open');
}

function closeImagePreview() {
  document.getElementById('imagePreviewOverlay').classList.remove('open');
  document.body.classList.remove('modal-open');
}

/* ═══════════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════════ */

function exportCSV() {
  const projects = getFilteredProjects();
  const headers = ['ID', 'Titel', 'Auftraggeber', 'Budget (CHF)', 'Komplexität', 'Typ', 'Phase', 'Priorität', 'Verantwortlich', 'DTI', 'HERMES', 'Jira-Key', 'Tags', 'Zieldatum', 'Erstellt', 'Geändert'];
  const rows = projects.map(p => [
    p.id,
    `"${(p.title || '').replace(/"/g, '""')}"`,
    `"${(p.requestor || '').replace(/"/g, '""')}"`,
    p.budget_chf,
    COMPLEXITY_LABELS[p.complexity] || p.complexity,
    TYPE_LABELS[p.type] || p.type || '',
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
  a.download = `IKT_Portfolio_DRES_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF() {
  const projects = getFilteredProjects();
  const win = window.open('', '_blank');
  if (!win) { alert('Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite.'); return; }
  win.document.write(`<!DOCTYPE html><html lang="de"><head>
    <meta charset="UTF-8">
    <title>IKT Projektportfolio DRES — Bericht</title>
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
      .phase-implementation { background: #FEF3C7; color: #78350F; }
      .phase-completed { background: #DCFCE7; color: #166534; }
      .phase-rejected { background: #FEE2E2; color: #991B1B; }
      .tags { color: #6B7280; }
      @media print { body { margin: 20px; } }
    </style>
  </head><body>
    <h1>IKT Projektportfolio DRES</h1>
    <div class="subtitle">${projects.length} Projekte · Erstellt am ${new Date().toLocaleDateString('de-CH')}</div>
    <table>
      <thead><tr>
        <th>Key</th><th>Titel</th><th>Typ</th><th>Phase</th><th>Komplexität</th><th>Priorität</th><th>Verantwortlich</th><th>Zieldatum</th><th>Tags</th>
      </tr></thead>
      <tbody>
        ${projects.map(p => `<tr>
          <td>${esc(p.jira_key) || '—'}</td>
          <td><strong>${esc(p.title)}</strong><br><span style="color:#6B7280">${esc(p.requestor)}</span></td>
          <td>${TYPE_LABELS[p.type] || '—'}</td>
          <td><span class="badge phase-${p.phase}">${PHASE_LABELS[p.phase]}</span></td>
          <td>${COMPLEXITY_LABELS[p.complexity]}</td>
          <td>${PRIORITY_LABELS[p.priority || 'medium']}</td>
          <td>${esc(p.responsible) || '—'}</td>
          <td>${p.target_date ? new Date(p.target_date).toLocaleDateString('de-CH') : '—'}</td>
          <td class="tags">${(p.tags || []).map(t => esc(t)).join(', ') || '—'}</td>
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

function typeBadge(type) {
  const t = type || 'new';
  return `<span class="badge badge-type" data-type="${t}">${TYPE_LABELS[t]}</span>`;
}

const _escEl = document.createElement('div');
function esc(str) {
  if (!str) return '';
  _escEl.textContent = str;
  return _escEl.innerHTML;
}

function escCSSUrl(url) {
  if (!url) return '';
  // Only allow http(s), relative paths, and data:image/* URIs
  if (/^(https?:\/\/|data:image\/|assets\/|\.\/|\/)/.test(url)) {
    return url.replace(/['"\\()]/g, '\\$&');
  }
  return '';
}

/* ═══════════════════════════════════════════════════════════
   DRAG & DROP
   ═══════════════════════════════════════════════════════════ */

/* ── Drag & drop: set draggable attributes (called each render) ── */

function setupDragAttributes(container) {
  const view = state.currentView;
  if (view === 'kanban') {
    container.querySelectorAll('.kanban-card').forEach(card => card.setAttribute('draggable', 'true'));
  } else if (['list', 'gallery', 'gantt'].includes(view) && state.groupBy !== 'none') {
    const sel = getDraggableSelector();
    if (sel) container.querySelectorAll(sel).forEach(el => el.setAttribute('draggable', 'true'));
  }
}

/* ── Drag & drop: delegated event handlers (set up once in DOMContentLoaded) ── */

function setupDragAndDrop() {
  const container = document.getElementById('viewContainer');

  container.addEventListener('dragstart', (e) => {
    const draggable = e.target.closest('[draggable="true"]');
    if (!draggable) return;
    draggable.classList.add('drag-item');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggable.dataset.id);
    const sourceColumn = draggable.closest('.kanban-column');
    if (sourceColumn) e.dataTransfer.setData('application/x-source', sourceColumn.dataset.phase);
  });

  container.addEventListener('dragend', (e) => {
    const draggable = e.target.closest('[draggable="true"]');
    if (draggable) draggable.classList.remove('drag-item');
    container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  });

  container.addEventListener('dragover', (e) => {
    const dropZone = e.target.closest('.kanban-column, .group-card');
    if (!dropZone) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dropZone.classList.add('drag-over');
  });

  container.addEventListener('dragleave', (e) => {
    const dropZone = e.target.closest('.kanban-column, .group-card');
    if (dropZone && !dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('drag-over');
    }
  });

  container.addEventListener('drop', (e) => {
    const dropZone = e.target.closest('.kanban-column, .group-card');
    if (!dropZone) return;
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const projectId = Number(e.dataTransfer.getData('text/plain'));
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;

    // Kanban column drop
    const column = dropZone.closest('.kanban-column');
    if (column) {
      const targetPhase = column.dataset.phase;
      if (project.phase !== targetPhase) {
        project.phase = targetPhase;
        project.updated_at = new Date().toISOString();
        render();
      }
      return;
    }

    // Group card drop
    const groupCard = dropZone.closest('.group-card');
    if (groupCard) {
      const header = groupCard.querySelector('.group-header');
      if (!header) return;
      const field = state.groupBy;
      const newValue = convertGroupKeyToValue(field, header.dataset.group);
      if (project[field] !== newValue) {
        project[field] = newValue;
        project.updated_at = new Date().toISOString();
        render();
      }
    }
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
