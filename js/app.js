/* ==========================================================================
   Main Application Controller & State Management
   Coordinates Navigation, Themes, Modals, and Cross-Tool Routing
   ========================================================================== */

class AppController {
  constructor() {
    this.currentTheme = localStorage.getItem('ssb_theme') || 'dark';
    this.activeTab = 'blueprint';

    this.graph = null;
    this.explorer = null;
    this.situationBank = null;
    this.simulator = null;

    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.setupNavigation();
    this.setupModals();
    this.setupGlobalShortcuts();

    // Initialize submodules
    if (window.KnowledgeGraph) {
      this.graph = new KnowledgeGraph('knowledgeGraphCanvas', 'graphInspector');
    }
    if (window.ProfessionExplorer) {
      this.explorer = new ProfessionExplorer({
        gridId: 'professionsGrid',
        searchId: 'explorerSearchInput',
        domainFilterId: 'explorerDomainSelect',
        olqFilterId: 'explorerOLQSelect',
        paginationId: 'explorerPagination',
        countId: 'explorerResultsCount',
        domainChipsId: 'domainChipsScroller'
      });
    }
    if (window.SituationBank) {
      this.situationBank = new SituationBank({
        gridId: 'situationBankGrid',
        modalId: 'situationSolverModal'
      });
    }
    if (window.TATSimulator) {
      this.simulator = new TATSimulator({
        promptSelectId: 'stimulusSelect',
        imageId: 'stimulusImage',
        imageTitleId: 'stimulusTitle',
        imageCueId: 'stimulusCue',
        suggestedRolesId: 'stimulusSuggestedRoles',
        observeTimerId: 'observeTimerDisplay',
        observeOverlayId: 'observationOverlay',
        writeTimerId: 'writingTimerBadge',
        startBtnId: 'startObservationBtn',
        resetBtnId: 'resetSimulatorBtn',
        storyInputId: 'storyWritingInput',
        wordCountId: 'storyWordCount',
        charCountId: 'storyCharCount',
        evalBtnId: 'evaluateStoryBtn',
        evalResultsId: 'evaluationResultsArea'
      });
      window.simulator = this.simulator;
    }
  }

  setupNavigation() {
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        this.switchTab(target);
      });
    });

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }
  }

  switchTab(tabId) {
    this.activeTab = tabId;

    // Update tab buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      if (btn.dataset.tab === tabId) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // If switching to graph, trigger canvas resize
    if (tabId === 'graph' && this.graph) {
      setTimeout(() => this.graph.resizeCanvas(), 50);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(this.currentTheme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ssb_theme', theme);
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      themeBtn.title = `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`;
    }
  }

  setupModals() {
    const overlay = document.getElementById('professionModalOverlay');
    const closeBtn = document.getElementById('modalCloseBtn');
    if (overlay && closeBtn) {
      closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    }

    const sitOverlay = document.getElementById('situationSolverModal');
    const sitCloseBtn = document.getElementById('sitModalCloseBtn');
    if (sitOverlay && sitCloseBtn) {
      sitCloseBtn.addEventListener('click', () => sitOverlay.classList.remove('active'));
      sitOverlay.addEventListener('click', (e) => {
        if (e.target === sitOverlay) sitOverlay.classList.remove('active');
      });
    }

    // Close on Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (overlay) overlay.classList.remove('active');
        if (sitOverlay) sitOverlay.classList.remove('active');
      }
    });
  }

  setupGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ctrl+K or / to search professions
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        this.switchTab('explorer');
        const search = document.getElementById('explorerSearchInput');
        if (search) {
          search.focus();
          search.select();
        }
      }
    });
  }

  openProfessionModal(profId) {
    if (!this.explorer) return;
    const p = this.explorer.getProfessionById(profId);
    if (!p) return;

    const overlay = document.getElementById('professionModalOverlay');
    const titleEl = document.getElementById('modalProfTitle');
    const domainEl = document.getElementById('modalProfDomain');
    const envEl = document.getElementById('modalProfEnv');
    const workflowEl = document.getElementById('modalProfWorkflow');
    const routineEl = document.getElementById('modalPatternRoutine');
    const crisisEl = document.getElementById('modalPatternCrisis');
    const teamEl = document.getElementById('modalPatternTeam');
    const actionEl = document.getElementById('modalProfAction');
    const olqsEl = document.getElementById('modalProfOLQs');
    const practiceBtn = document.getElementById('modalPracticeBtn');

    if (titleEl) titleEl.textContent = `${p.id}. ${p.name}`;
    if (domainEl) domainEl.textContent = `Domain ${p.domain_id} · ${p.domain_title}`;
    if (envEl) envEl.textContent = p.work_environment;

    if (workflowEl) {
      // Render workflow as clean connected breadcrumb nodes
      const steps = p.professional_workflow.split('->').map(s => s.trim()).filter(Boolean);
      workflowEl.innerHTML = steps.map((s, idx) => `
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
          <span style="font-family: var(--font-mono); font-size: 0.75rem; background: var(--bg-tertiary); color: var(--accent-primary); padding: 2px 6px; border-radius: 4px; font-weight: 700;">
            ${idx + 1}
          </span>
          <span style="font-size: 0.9rem; color: var(--text-primary); font-weight: 500;">${s}</span>
        </div>
      `).join('');
    }

    if (routineEl) routineEl.textContent = p.patterns.routine || 'Prepares for scheduled responsibilities and reviews execution.';
    if (crisisEl) crisisEl.textContent = p.patterns.problem_crisis || 'Encountered an operational constraint requiring calm diagnosis and response.';
    if (teamEl) teamEl.textContent = p.patterns.team_community || 'Coordinates support across teammates without disrupting the collective task.';

    if (actionEl) actionEl.textContent = p.practical_action_sequence;

    if (olqsEl) {
      olqsEl.innerHTML = p.olqs.map(o => `
        <span class="prof-olq-tag" style="font-size: 0.8rem; padding: 4px 10px; cursor: pointer;" onclick="window.app.filterByOLQ('${o}')">
          ${o}
        </span>
      `).join('');
    }

    if (practiceBtn) {
      practiceBtn.onclick = () => {
        overlay.classList.remove('active');
        this.switchTab('simulator');
        if (this.simulator) {
          this.simulator.fillHeroRole(p.name);
        }
      };
    }

    if (overlay) overlay.classList.add('active');
  }

  openSituationSolver(sitId) {
    if (!this.situationBank) return;
    const sit = this.situationBank.getSituationById(sitId);
    if (!sit) return;

    const overlay = document.getElementById('situationSolverModal');
    const titleEl = document.getElementById('sitModalTitle');
    const descEl = document.getElementById('sitModalDesc');
    const flowEl = document.getElementById('sitModalFlow');
    const profsSelect = document.getElementById('sitSolverProfSelect');
    const resultBox = document.getElementById('sitSolverResultBox');

    if (titleEl) titleEl.textContent = `Situation #${sit.id}: ${sit.title}`;
    if (descEl) descEl.textContent = sit.description;
    if (flowEl) flowEl.textContent = sit.practice_flow;

    const recs = this.situationBank.getRecommendedProfessions(sit.title);
    if (profsSelect) {
      profsSelect.innerHTML = recs.map(p => `
        <option value="${p.id}">${p.id}. ${p.name} (${p.domain_title})</option>
      `).join('');
    }

    const generateBtn = document.getElementById('sitSolverGenerateBtn');
    if (generateBtn && profsSelect && resultBox) {
      generateBtn.onclick = () => {
        const profId = profsSelect.value;
        const p = this.explorer.getProfessionById(profId);
        if (!p) return;

        resultBox.style.display = 'block';
        resultBox.innerHTML = `
          <h4 style="font-family: var(--font-display); font-size: 1.1rem; color: var(--accent-success); margin-bottom: 0.5rem;">
            🎯 Recommended TAT Resolution Chain for ${p.name}
          </h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
            <strong>Environment:</strong> ${p.work_environment}
          </p>
          <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); font-size: 0.9rem; line-height: 1.6;">
            <strong>Step 1 (Observe):</strong> Noticed the ${sit.title.toLowerCase()} in the work zone.<br>
            <strong>Step 2 (Identify):</strong> Defined the core operational problem without panic.<br>
            <strong>Step 3 (Plan & Initiate):</strong> Applied SOP: <em>"${p.professional_workflow.split('->')[0].trim()}"</em>.<br>
            <strong>Step 4 (Coordinate & Execute):</strong> Coordinated with team and resources: <em>"${p.practical_action_sequence}"</em>.<br>
            <strong>Step 5 (Measurable Result):</strong> Restored safety, documented details, and completed the primary objective calmly.
          </div>
          <button onclick="window.app.practiceFromSolver('${p.name}', '${sit.title}')" class="btn-primary" style="margin-top: 1rem; width: 100%; justify-content: center;">
            🚀 Write Story with this Framework in Simulator →
          </button>
        `;
      };
    }

    if (overlay) overlay.classList.add('active');
  }

  practiceFromSolver(profName, situationTitle) {
    const overlay = document.getElementById('situationSolverModal');
    if (overlay) overlay.classList.remove('active');
    this.switchTab('simulator');
    if (this.simulator) {
      this.simulator.storyInput.value = `Rohan, an experienced ${profName}, encountered a ${situationTitle.toLowerCase()} during an active assignment. He calmly assessed the immediate risk... `;
      this.simulator.updateCounters();
      this.simulator.storyInput.focus();
    }
  }

  filterByDomain(domainId) {
    this.switchTab('explorer');
    if (this.explorer) {
      this.explorer.setDomainFilter(domainId);
    }
  }

  filterByOLQ(olqTag) {
    this.switchTab('explorer');
    if (this.explorer) {
      this.explorer.setOLQFilter(olqTag);
    }
  }

  resetExplorerFilters() {
    if (this.explorer) {
      if (this.explorer.searchInput) this.explorer.searchInput.value = '';
      this.explorer.currentSearch = '';
      this.explorer.setDomainFilter('all');
      this.explorer.setOLQFilter('all');
    }
  }

  changeExplorerPage(page) {
    if (this.explorer) {
      this.explorer.setPage(page);
    }
  }
}

// Instantiate on load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
