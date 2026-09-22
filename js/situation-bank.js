/* ==========================================================================
   Part III: 25-Scenario TAT Situation Bank & Story Intelligence Engine
   Interactive scenario breakdown, model officer stories, blunder contrasts,
   recommended professions, and 7-step action logic
   ========================================================================== */

class SituationBank {
  constructor(options) {
    this.container = document.getElementById(options.gridId);
    this.categoryFiltersContainer = document.getElementById(options.categoryFiltersId || 'situationCategoryFilters');
    this.situations = window.SSB_DATA ? window.SSB_DATA.situation_bank : [];
    this.selectedCategory = 'all';

    if (this.container) {
      this.init();
    }
  }

  init() {
    this.renderCategoryFilters();
    this.render();
  }

  renderCategoryFilters() {
    if (!this.categoryFiltersContainer || !this.situations) return;

    const categories = ['all', 'Crisis & Emergency', 'Technical & Engineering', 'Logistics & Operations', 'People & Leadership'];
    const counts = {
      'all': this.situations.length,
      'Crisis & Emergency': this.situations.filter(s => s.category === 'Crisis & Emergency').length,
      'Technical & Engineering': this.situations.filter(s => s.category === 'Technical & Engineering').length,
      'Logistics & Operations': this.situations.filter(s => s.category === 'Logistics & Operations').length,
      'People & Leadership': this.situations.filter(s => s.category === 'People & Leadership').length,
    };

    let html = '';
    categories.forEach(cat => {
      const label = cat === 'all' ? 'All Situations' : cat;
      const count = counts[cat] || 0;
      html += `
        <button class="domain-chip ${this.selectedCategory === cat ? 'active' : ''}" data-category="${cat}">
          ${label} <span class="tab-badge">${count}</span>
        </button>
      `;
    });

    this.categoryFiltersContainer.innerHTML = html;

    this.categoryFiltersContainer.querySelectorAll('.domain-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.selectedCategory = chip.dataset.category;
        this.categoryFiltersContainer.querySelectorAll('.domain-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.render();
      });
    });
  }

  render() {
    if (!this.container || !this.situations) return;

    const filtered = this.selectedCategory === 'all' 
      ? this.situations 
      : this.situations.filter(s => s.category === this.selectedCategory);

    let html = '';
    filtered.forEach(sit => {
      const icon = this.getScenarioIcon(sit.title);
      const catColor = this.getCategoryColor(sit.category);

      html += `
        <div class="situation-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="sit-number">#${sit.id}</span>
                <span style="font-size: 0.72rem; font-weight: 700; color: ${catColor}; background: ${catColor}18; padding: 2px 8px; border-radius: var(--radius-full);">
                  ${sit.category || 'General'}
                </span>
              </div>
              <span style="font-size: 1.35rem;">${icon}</span>
            </div>

            <h3 class="sit-title">${sit.title}</h3>
            <p class="sit-desc">${sit.description}</p>

            ${sit.picture_cues ? `
              <div style="background: var(--bg-tertiary); padding: 0.65rem 0.85rem; border-radius: var(--radius-md); margin-bottom: 0.85rem; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
                <strong style="color: var(--text-primary); display: block; margin-bottom: 0.15rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px;">
                  🖼️ Typical Picture Cues:
                </strong>
                ${sit.picture_cues}
              </div>
            ` : ''}

            ${sit.best_fit_professions && sit.best_fit_professions.length > 0 ? `
              <div style="margin-bottom: 1rem;">
                <span style="font-size: 0.72rem; font-weight: 700; color: var(--accent-secondary); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.35rem;">
                  🎯 Best-Fit Professions:
                </span>
                <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
                  ${sit.best_fit_professions.map(p => `
                    <span class="prof-olq-tag" style="background: rgba(6, 182, 212, 0.12); color: var(--accent-secondary); border: 1px solid rgba(6, 182, 212, 0.25);" title="${p.reason}">
                      ${p.name}
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <div>
            <button onclick="window.app.openSituationSolver('${sit.id}')" class="btn-primary" style="width: 100%; justify-content: center; font-size: 0.88rem; padding: 0.65rem 1rem;">
              📖 View Model Story & Analysis →
            </button>
          </div>
        </div>
      `;
    });

    this.container.innerHTML = html;
  }

  getScenarioIcon(title) {
    const t = title.toLowerCase();
    if (t.includes('accident') || t.includes('injury')) return '🩹';
    if (t.includes('technical failure') || t.includes('glitch')) return '⚙️';
    if (t.includes('hazard') || t.includes('weather')) return '⛈️';
    if (t.includes('lost person')) return '🧭';
    if (t.includes('conflict') || t.includes('conflicting')) return '⚖️';
    if (t.includes('team delay')) return '⏱️';
    if (t.includes('community')) return '🏘️';
    if (t.includes('academic')) return '📚';
    if (t.includes('safety') || t.includes('hazard')) return '⚠️';
    if (t.includes('supply') || t.includes('logistics')) return '🚚';
    if (t.includes('public event') || t.includes('crowd')) return '🏟️';
    if (t.includes('environmental')) return '🌱';
    if (t.includes('discrepancy') || t.includes('financial')) return '📊';
    if (t.includes('complaint') || t.includes('grievance')) return '🗣️';
    if (t.includes('cyber')) return '💻';
    if (t.includes('construction')) return '🏗️';
    if (t.includes('evacuation')) return '🚨';
    if (t.includes('maintenance')) return '🔧';
    if (t.includes('research') || t.includes('anomaly')) return '🔬';
    if (t.includes('transport')) return '🚆';
    if (t.includes('leadership')) return '🎖️';
    if (t.includes('volunteer')) return '👥';
    if (t.includes('service access') || t.includes('vulnerable')) return '🤝';
    if (t.includes('change')) return '🔄';
    return '📌';
  }

  getCategoryColor(category) {
    switch (category) {
      case 'Crisis & Emergency': return 'var(--accent-danger)';
      case 'Technical & Engineering': return 'var(--accent-primary)';
      case 'Logistics & Operations': return 'var(--accent-warning)';
      case 'People & Leadership': return 'var(--accent-success)';
      default: return 'var(--accent-secondary)';
    }
  }

  getSituationById(id) {
    return this.situations.find(s => s.id === id);
  }
}

window.SituationBank = SituationBank;
