/* ==========================================================================
   SSB Intel & Resource Library Controller
   Renders and filters curated preparation books, OIR sets, PIQ, SRT & WAT papers
   ========================================================================== */

class IntelLibrary {
  constructor(options = {}) {
    this.containerId = options.containerId || 'intelLibraryGrid';
    this.searchId = options.searchId || 'intelSearchInput';
    this.stageFilterId = options.stageFilterId || 'intelStageFilter';
    this.countId = options.countId || 'intelResultsCount';
    
    this.container = document.getElementById(this.containerId);
    this.searchInput = document.getElementById(this.searchId);
    this.stageFilter = document.getElementById(this.stageFilterId);
    this.countEl = document.getElementById(this.countId);
    
    this.docs = (window.SSB_STIMULI && Array.isArray(window.SSB_STIMULI.docs)) ? window.SSB_STIMULI.docs : [];
    this.filteredDocs = [...this.docs];
    this.activeStage = 'ALL';
    this.searchQuery = '';

    if (this.container) {
      this.init();
    }
  }

  init() {
    this.renderStageChips();
    this.renderDocs();
    this.setupListeners();
  }

  renderStageChips() {
    const chipsContainer = document.getElementById('intelStageChips');
    if (!chipsContainer) return;

    const stages = [
      { id: 'ALL', label: 'All Intel Resources', icon: '📚' },
      { id: 'Stage I', label: 'Stage I: Screening & OIR', icon: '🎯' },
      { id: 'Psychology', label: 'Stage II: Psychology (TAT/WAT/SRT)', icon: '🧠' },
      { id: 'GTO', label: 'Stage II: GTO Field Tasks', icon: '🧗' },
      { id: 'Interview', label: 'Personal Interview & PIQ', icon: '🎖️' }
    ];

    chipsContainer.innerHTML = stages.map(s => `
      <button class="domain-chip ${s.id === this.activeStage ? 'active' : ''}" data-stage="${s.id}">
        <span>${s.icon}</span> ${s.label}
      </button>
    `).join('');

    chipsContainer.querySelectorAll('.domain-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        chipsContainer.querySelectorAll('.domain-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeStage = btn.dataset.stage;
        this.applyFilters();
      });
    });
  }

  setupListeners() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.applyFilters();
      });
    }

    if (this.stageFilter) {
      this.stageFilter.addEventListener('change', (e) => {
        this.activeStage = e.target.value;
        this.applyFilters();
      });
    }
  }

  applyFilters() {
    this.filteredDocs = this.docs.filter(doc => {
      // Stage match
      const stageMatch = this.activeStage === 'ALL' || 
        (this.activeStage === 'Stage I' && (doc.stage.includes('Stage I') || doc.category.includes('Screening'))) ||
        (this.activeStage === 'Psychology' && (doc.stage.includes('Psychology') || doc.category.includes('Psychological'))) ||
        (this.activeStage === 'GTO' && (doc.stage.includes('GTO') || doc.category.includes('GTO'))) ||
        (this.activeStage === 'Interview' && (doc.stage.includes('Interview') || doc.category.includes('Interview')));

      // Search match
      const queryMatch = !this.searchQuery ||
        doc.title.toLowerCase().includes(this.searchQuery) ||
        doc.description.toLowerCase().includes(this.searchQuery) ||
        doc.category.toLowerCase().includes(this.searchQuery) ||
        doc.badge.toLowerCase().includes(this.searchQuery);

      return stageMatch && queryMatch;
    });

    this.renderDocs();
  }

  renderDocs() {
    if (!this.container) return;

    if (this.countEl) {
      this.countEl.textContent = `Showing ${this.filteredDocs.length} curated documents`;
    }

    if (this.filteredDocs.length === 0) {
      this.container.innerHTML = `
        <div class="empty-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: var(--text-primary);">No documents found</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Try adjusting your keyword or stage filter.</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = this.filteredDocs.map(doc => {
      let icon = '📄';
      if (doc.category.includes('Interview')) icon = '📝';
      else if (doc.category.includes('Screening')) icon = '🎯';
      else if (doc.category.includes('Psychological')) icon = '🧠';
      else if (doc.category.includes('GTO')) icon = '🧗';

      return `
        <div class="intel-card">
          <div class="intel-card-header">
            <div class="intel-badge-row">
              <span class="intel-stage-badge">${doc.stage}</span>
              <span class="intel-highlight-badge">${doc.badge}</span>
            </div>
            <span class="intel-size">${doc.size}</span>
          </div>

          <div class="intel-card-body">
            <div style="display: flex; gap: 0.75rem; align-items: flex-start; margin-bottom: 0.6rem;">
              <span style="font-size: 1.5rem; line-height: 1;">${icon}</span>
              <h4 class="intel-card-title">${doc.title}</h4>
            </div>
            <p class="intel-card-desc">${doc.description}</p>
          </div>

          <div class="intel-card-footer">
            <a href="${doc.file}" target="_blank" class="btn-primary intel-btn" title="View Document in new tab">
              <span>👁️</span> View PDF
            </a>
            <a href="${doc.file}" download class="btn-primary intel-btn-download" title="Download for offline study">
              <span>📥</span> Download
            </a>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.IntelLibrary = IntelLibrary;
