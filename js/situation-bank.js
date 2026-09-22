/* ==========================================================================
   Part III: 25-Scenario TAT Situation Bank & Solver
   Interactive scenario breakdown and realistic response synthesizer
   ========================================================================== */

class SituationBank {
  constructor(options) {
    this.container = document.getElementById(options.gridId);
    this.solverModal = document.getElementById(options.modalId);
    this.situations = window.SSB_DATA ? window.SSB_DATA.situation_bank : [];
    
    if (this.container) {
      this.render();
    }
  }

  render() {
    if (!this.container || !this.situations) return;

    let html = '';
    this.situations.forEach(sit => {
      const icon = this.getScenarioIcon(sit.title);
      html += `
        <div class="situation-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span class="sit-number">SITUATION #${sit.id}</span>
              <span style="font-size: 1.25rem;">${icon}</span>
            </div>
            <h3 class="sit-title">${sit.title}</h3>
            <p class="sit-desc">${sit.description}</p>
          </div>

          <div>
            <div class="sit-flow-box">
              <strong style="color: var(--accent-secondary); display: block; margin-bottom: 0.25rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                5-Step Resolution Chain
              </strong>
              ${sit.practice_flow}
            </div>

            <button onclick="window.app.openSituationSolver('${sit.id}')" class="btn-primary" style="width: 100%; justify-content: center; font-size: 0.85rem; padding: 0.55rem 1rem;">
              Resolve with a Profession →
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
    if (t.includes('technical') || t.includes('maintenance')) return '⚙️';
    if (t.includes('hazard') || t.includes('weather')) return '⛈️';
    if (t.includes('conflict') || t.includes('disagreement')) return '🤝';
    if (t.includes('delay') || t.includes('transport')) return '🚚';
    if (t.includes('cyber')) return '💻';
    if (t.includes('evacuation') || t.includes('emergency')) return '🚨';
    if (t.includes('discrepancy') || t.includes('financial')) return '📊';
    if (t.includes('leadership')) return '🎖️';
    if (t.includes('volunteer') || t.includes('community')) return '👥';
    if (t.includes('crop') || t.includes('farm')) return '🌾';
    return '📌';
  }

  getSituationById(id) {
    return this.situations.find(s => s.id === id);
  }

  getRecommendedProfessions(sitTitle) {
    if (!window.SSB_DATA) return [];
    const t = sitTitle.toLowerCase();
    let keywords = [];

    if (t.includes('accident') || t.includes('injury')) keywords = ['doctor', 'nurse', 'paramedic', 'safety'];
    else if (t.includes('technical') || t.includes('equipment')) keywords = ['engineer', 'mechanic', 'technician'];
    else if (t.includes('weather') || t.includes('hazard')) keywords = ['meteorologist', 'disaster', 'captain', 'pilot'];
    else if (t.includes('conflict') || t.includes('leadership')) keywords = ['manager', 'administrator', 'officer', 'coordinator'];
    else if (t.includes('cyber')) keywords = ['cyber', 'software', 'network', 'analyst'];
    else if (t.includes('financial')) keywords = ['accountant', 'auditor', 'analyst', 'banker'];
    else if (t.includes('community') || t.includes('volunteer')) keywords = ['social worker', 'development', 'teacher'];
    else keywords = ['officer', 'manager', 'specialist'];

    const matches = [];
    window.SSB_DATA.domains.forEach(d => {
      d.professions.forEach(p => {
        if (keywords.some(k => p.name.toLowerCase().includes(k))) {
          matches.push(p);
        }
      });
    });

    return matches.slice(0, 6);
  }
}

window.SituationBank = SituationBank;
