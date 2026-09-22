/* ==========================================================================
   459 Professions Matrix & Live Explorer
   Search, Faceted Filtering, Pagination, and Deep-Dive Modal
   ========================================================================== */

class ProfessionExplorer {
  constructor(options) {
    this.container = document.getElementById(options.gridId);
    this.searchInput = document.getElementById(options.searchId);
    this.domainFilter = document.getElementById(options.domainFilterId);
    this.olqFilter = document.getElementById(options.olqFilterId);
    this.paginationWrap = document.getElementById(options.paginationId);
    this.resultsCountEl = document.getElementById(options.countId);
    this.domainChipsWrap = document.getElementById(options.domainChipsId);

    this.allProfessions = [];
    this.filteredList = [];
    this.currentPage = 1;
    this.pageSize = 18;

    this.currentSearch = '';
    this.selectedDomain = 'all';
    this.selectedOLQ = 'all';

    if (window.SSB_DATA) {
      this.init();
    }
  }

  init() {
    this.flattenProfessions();
    this.renderDomainChips();
    this.setupEventListeners();
    this.applyFilters();
  }

  flattenProfessions() {
    this.allProfessions = [];
    if (!window.SSB_DATA || !window.SSB_DATA.domains) return;

    window.SSB_DATA.domains.forEach(domain => {
      domain.professions.forEach(p => {
        this.allProfessions.push({
          ...p,
          domain_id: domain.id,
          domain_title: domain.title
        });
      });
    });
    this.filteredList = [...this.allProfessions];
  }

  renderDomainChips() {
    if (!this.domainChipsWrap || !window.SSB_DATA) return;

    let html = `
      <div class="domain-chip ${this.selectedDomain === 'all' ? 'active' : ''}" data-domain="all">
        All Domains <span class="tab-badge">${this.allProfessions.length}</span>
      </div>
    `;

    window.SSB_DATA.domains.forEach(dom => {
      html += `
        <div class="domain-chip ${this.selectedDomain === dom.id ? 'active' : ''}" data-domain="${dom.id}">
          ${dom.id}. ${dom.title} <span class="tab-badge">${dom.professions.length}</span>
        </div>
      `;
    });

    this.domainChipsWrap.innerHTML = html;

    this.domainChipsWrap.querySelectorAll('.domain-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const domId = chip.dataset.domain;
        this.setDomainFilter(domId);
      });
    });
  }

  setupEventListeners() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.currentSearch = e.target.value.toLowerCase().trim();
        this.currentPage = 1;
        this.applyFilters();
      });
    }

    if (this.domainFilter) {
      this.domainFilter.addEventListener('change', (e) => {
        this.setDomainFilter(e.target.value);
      });
    }

    if (this.olqFilter) {
      this.olqFilter.addEventListener('change', (e) => {
        this.selectedOLQ = e.target.value.toLowerCase();
        this.currentPage = 1;
        this.applyFilters();
      });
    }
  }

  setDomainFilter(domainId) {
    this.selectedDomain = domainId;
    if (this.domainFilter) {
      this.domainFilter.value = domainId;
    }
    // Update chip active classes
    if (this.domainChipsWrap) {
      this.domainChipsWrap.querySelectorAll('.domain-chip').forEach(c => {
        if (c.dataset.domain === domainId) {
          c.classList.add('active');
          c.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          c.classList.remove('active');
        }
      });
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  setOLQFilter(olqTag) {
    this.selectedOLQ = olqTag.toLowerCase();
    if (this.olqFilter) {
      this.olqFilter.value = this.selectedOLQ;
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredList = this.allProfessions.filter(p => {
      // Domain filter
      if (this.selectedDomain !== 'all' && p.domain_id !== this.selectedDomain) {
        return false;
      }

      // OLQ filter
      if (this.selectedOLQ !== 'all') {
        const hasOLQ = p.olqs.some(o => o.toLowerCase().includes(this.selectedOLQ));
        if (!hasOLQ) return false;
      }

      // Search keyword
      if (this.currentSearch) {
        const matchName = p.name.toLowerCase().includes(this.currentSearch);
        const matchEnv = p.work_environment.toLowerCase().includes(this.currentSearch);
        const matchAction = p.practical_action_sequence.toLowerCase().includes(this.currentSearch);
        const matchWorkflow = p.professional_workflow.toLowerCase().includes(this.currentSearch);
        const matchOLQ = p.olqs.some(o => o.toLowerCase().includes(this.currentSearch));
        if (!matchName && !matchEnv && !matchAction && !matchWorkflow && !matchOLQ) {
          return false;
        }
      }

      return true;
    });

    if (this.resultsCountEl) {
      this.resultsCountEl.textContent = `Showing ${this.filteredList.length} of ${this.allProfessions.length} professions`;
    }

    this.renderCards();
    this.renderPagination();
  }

  renderCards() {
    if (!this.container) return;

    if (this.filteredList.length === 0) {
      this.container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-secondary);">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-family: var(--font-display); font-size: 1.25rem; color: var(--text-primary); margin-bottom: 0.5rem;">No professions match your filters</h3>
          <p style="font-size: 0.9rem;">Try adjusting your search terms, clearing domain filters, or selecting "All OLQs".</p>
          <button onclick="window.app.resetExplorerFilters()" class="btn-primary" style="margin-top: 1.25rem;">Reset All Filters</button>
        </div>
      `;
      return;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const pageItems = this.filteredList.slice(start, start + this.pageSize);

    let html = '';
    pageItems.forEach(p => {
      html += `
        <div class="profession-card" onclick="window.app.openProfessionModal(${p.id})">
          <div>
            <div class="prof-header">
              <div>
                <span class="prof-id">#${String(p.id).padStart(3, '0')}</span>
                <h3 class="prof-title">${this.highlightMatch(p.name)}</h3>
              </div>
              <span class="prof-domain-badge">${p.domain_id} · ${p.domain_title}</span>
            </div>

            <div class="prof-env">
              <span>📍</span> <span>${this.truncateText(p.work_environment, 65)}</span>
            </div>

            <p class="prof-action-snippet">
              <strong>Action:</strong> ${this.highlightMatch(p.practical_action_sequence)}
            </p>
          </div>

          <div>
            <div class="prof-olq-tags">
              ${p.olqs.map(o => `<span class="prof-olq-tag">${o}</span>`).join('')}
            </div>
          </div>
        </div>
      `;
    });

    this.container.innerHTML = html;
  }

  renderPagination() {
    if (!this.paginationWrap) return;

    const totalPages = Math.ceil(this.filteredList.length / this.pageSize);
    if (totalPages <= 1) {
      this.paginationWrap.innerHTML = '';
      return;
    }

    let html = `
      <button class="btn-page" ${this.currentPage === 1 ? 'disabled' : ''} onclick="window.app.changeExplorerPage(${this.currentPage - 1})">
        ← Previous
      </button>
      <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">
        Page ${this.currentPage} of ${totalPages}
      </div>
      <button class="btn-page" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="window.app.changeExplorerPage(${this.currentPage + 1})">
        Next →
      </button>
    `;

    this.paginationWrap.innerHTML = html;
  }

  setPage(page) {
    const totalPages = Math.ceil(this.filteredList.length / this.pageSize);
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    this.renderCards();
    this.renderPagination();
    this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  truncateText(text, maxLen) {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  }

  highlightMatch(text) {
    if (!this.currentSearch || !text) return text;
    const regex = new RegExp(`(${this.escapeRegex(this.currentSearch)})`, 'gi');
    return text.replace(regex, '<mark style="background: rgba(99, 102, 241, 0.35); color: #fff; border-radius: 2px; padding: 0 2px;">$1</mark>');
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  getProfessionById(id) {
    return this.allProfessions.find(p => p.id === Number(id));
  }
}

window.ProfessionExplorer = ProfessionExplorer;
