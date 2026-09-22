/* ==========================================================================
   Main Application Controller & State Management
   Coordinates Navigation, Themes, Modals, and Cross-Tool Routing
   ========================================================================== */

class AppController {
  constructor() {
    window.app = this;
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
    const badgeEl = document.getElementById('sitModalBadge');
    const catEl = document.getElementById('sitModalCategory');
    const titleEl = document.getElementById('sitModalTitle');
    const descEl = document.getElementById('sitModalDesc');
    const cuesEl = document.getElementById('sitModalPictureCues');
    const profsListEl = document.getElementById('sitModalProfessionsList');
    const modelStoryEl = document.getElementById('sitModalModelStory');
    const storyWordCountEl = document.getElementById('sitModalStoryWordCount');
    const blunderStoryEl = document.getElementById('sitModalBlunderStory');
    const actionBreakdownEl = document.getElementById('sitModalActionBreakdown');
    const olqsEl = document.getElementById('sitModalOLQs');
    const practiceBtn = document.getElementById('sitPracticeBtn');
    const copyBtn = document.getElementById('sitCopyStoryBtn');

    if (badgeEl) badgeEl.textContent = `Situation #${sit.id}`;
    if (catEl) {
      catEl.textContent = sit.category || 'General';
      const catColor = this.situationBank.getCategoryColor(sit.category);
      catEl.style.color = catColor;
      catEl.style.background = `${catColor}20`;
    }
    if (titleEl) titleEl.textContent = sit.title;
    if (descEl) descEl.textContent = sit.description;
    if (cuesEl) cuesEl.textContent = sit.picture_cues || 'Examine the environment, tools present, expressions, and immediate source of friction.';

    // Best Fit Professions
    if (profsListEl && sit.best_fit_professions) {
      profsListEl.innerHTML = sit.best_fit_professions.map(p => `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.75rem; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <span style="font-size: 0.7rem; color: var(--text-muted);">${p.domain}</span>
            <strong style="display: block; font-size: 0.92rem; color: var(--text-primary); margin: 2px 0 4px 0;">${p.name}</strong>
            <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${p.reason}</p>
          </div>
        </div>
      `).join('');
    }

    // Model Story & Word Count
    if (modelStoryEl && sit.model_story) {
      const words = sit.model_story.trim().split(/\s+/).length;
      if (storyWordCountEl) storyWordCountEl.textContent = `${words} Words · Officer Grade`;
      modelStoryEl.innerHTML = `"${sit.model_story}"`;
    }

    // Blunder Story
    if (blunderStoryEl && sit.blunder_story) {
      blunderStoryEl.innerHTML = `"${sit.blunder_story}"<br><br><span style="font-size: 0.78rem; font-weight: 600; color: #f87171;">⚠️ Why it fails: Shows violent melodrama, panic, or superhuman lone-wolf action without practical coordination.</span>`;
    }

    // 7-Step Action Breakdown
    if (actionBreakdownEl && sit.action_logic_breakdown) {
      const b = sit.action_logic_breakdown;
      actionBreakdownEl.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <div><strong style="color: var(--accent-primary);">1. Observe:</strong> <span style="color: var(--text-primary);">${b.observe}</span></div>
          <div><strong style="color: var(--accent-secondary);">2. Identify:</strong> <span style="color: var(--text-primary);">${b.identify}</span></div>
          <div><strong style="color: var(--accent-warning);">3. Plan & Initiate:</strong> <span style="color: var(--text-primary);">${b.plan_initiate}</span></div>
          <div><strong style="color: var(--accent-purple);">4. Coordinate:</strong> <span style="color: var(--text-primary);">${b.coordinate}</span></div>
          <div><strong style="color: var(--accent-success);">5. Result:</strong> <span style="color: var(--text-primary);">${b.result}</span></div>
        </div>
      `;
    }

    // OLQs
    if (olqsEl && sit.olqs_projected) {
      olqsEl.innerHTML = sit.olqs_projected.map(o => `
        <span class="prof-olq-tag" style="font-size: 0.8rem; padding: 4px 10px; cursor: pointer;" onclick="window.app.filterByOLQ('${o}')">
          ${o}
        </span>
      `).join('');
    }

    // Practice button in Simulator
    if (practiceBtn) {
      practiceBtn.onclick = () => {
        overlay.classList.remove('active');
        this.switchTab('simulator');
        if (this.simulator) {
          const defaultProf = (sit.best_fit_professions && sit.best_fit_professions[0]) ? sit.best_fit_professions[0].name : 'Officer';
          this.simulator.storyInput.value = `Rohan, a 26-year-old ${defaultProf}, was on duty when he noticed ${sit.title.toLowerCase()}... `;
          this.simulator.updateCounters();
          this.simulator.storyInput.focus();
        }
      };
    }

    // Copy button
    if (copyBtn) {
      copyBtn.onclick = () => {
        if (sit.model_story) {
          navigator.clipboard.writeText(sit.model_story).then(() => {
            alert('Model story copied to clipboard!');
          });
        }
      };
    }

    if (overlay) overlay.classList.add('active');
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
