/* ==========================================================================
   SSB 610 Model Stories Dossier - Controller & Interactive Engine
   Handles Filtering, Live Search, Pagination, Deep-Dive Modal & Audio TTS
   ========================================================================== */

class StoriesDossier {
  constructor() {
    this.rawStories = window.SSB_MODEL_STORIES || { tat: [], ppdt: [] };
    this.allStories = [...(this.rawStories.tat || []), ...(this.rawStories.ppdt || [])];
    
    this.state = {
      mode: 'all',          // 'all' | 'tat' | 'ppdt'
      category: 'all',
      olq: 'all',
      search: '',
      sort: 'num_asc',
      page: 1,
      perPage: 24,
      currentModalStory: null
    };

    this.speechSynth = window.speechSynthesis;
    this.currentUtterance = null;
    this.isSpeaking = false;

    this.init();
  }

  init() {
    this.cacheDom();
    this.initTheme();
    this.populateFilterDropdowns();
    this.bindEvents();
    this.handleUrlParams();
    this.applyFiltersAndRender();
  }

  cacheDom() {
    this.searchInput = document.getElementById('storySearchInput');
    this.clearSearchBtn = document.getElementById('clearSearchBtn');
    this.modeButtons = document.querySelectorAll('.mode-filter-btn');
    this.categorySelect = document.getElementById('categorySelect');
    this.olqSelect = document.getElementById('olqSelect');
    this.sortSelect = document.getElementById('sortSelect');
    this.resultCountEl = document.getElementById('resultCount');
    this.gridEl = document.getElementById('storiesGrid');
    this.paginationEl = document.getElementById('paginationControls');
    
    // Modal elements
    this.modalEl = document.getElementById('storyDetailModal');
    this.modalOverlay = document.getElementById('modalOverlay');
    this.modalCloseBtn = document.getElementById('modalCloseBtn');
    this.modalImg = document.getElementById('modalImg');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalBadge = document.getElementById('modalBadge');
    this.modalCategory = document.getElementById('modalCategory');
    this.modalHero = document.getElementById('modalHero');
    this.modalStory = document.getElementById('modalStory');
    this.modalWordCount = document.getElementById('modalWordCount');
    this.modalActionObserve = document.getElementById('modalActionObserve');
    this.modalActionPlan = document.getElementById('modalActionPlan');
    this.modalActionExecute = document.getElementById('modalActionExecute');
    this.modalActionOutcome = document.getElementById('modalActionOutcome');
    this.modalOlqs = document.getElementById('modalOlqs');
    this.modalBlunder = document.getElementById('modalBlunder');
    this.modalPpdtBox = document.getElementById('modalPpdtBox');
    this.modalPpdtChars = document.getElementById('modalPpdtChars');
    this.modalCopyBtn = document.getElementById('modalCopyBtn');
    this.modalSpeakBtn = document.getElementById('modalSpeakBtn');
    this.modalPracticeBtn = document.getElementById('modalPracticeBtn');
    this.toastEl = document.getElementById('copyToast');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
  }

  initTheme() {
    const savedTheme = localStorage.getItem('ssb_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (this.themeToggleBtn) {
      this.themeToggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ssb_theme', next);
    if (this.themeToggleBtn) {
      this.themeToggleBtn.textContent = next === 'dark' ? '☀️' : '🌙';
    }
  }

  populateFilterDropdowns() {
    // Categories
    const categories = new Set();
    this.allStories.forEach(s => {
      if (s.category) categories.add(s.category);
    });

    if (this.categorySelect) {
      Array.from(categories).sort().forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        this.categorySelect.appendChild(opt);
      });
    }

    // OLQs
    const olqs = [
      "Effective Intelligence", "Reasoning Ability", "Organizing Ability", 
      "Social Adaptability", "Cooperation", "Sense of Responsibility", 
      "Initiative", "Self Confidence", "Speed of Decision", 
      "Courage", "Stamina", "Determination", "Liveliness"
    ];

    if (this.olqSelect) {
      olqs.forEach(olq => {
        const opt = document.createElement('option');
        opt.value = olq;
        opt.textContent = olq;
        this.olqSelect.appendChild(opt);
      });
    }
  }

  bindEvents() {
    // Theme toggle
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.state.search = e.target.value.trim().toLowerCase();
        this.state.page = 1;
        if (this.clearSearchBtn) {
          this.clearSearchBtn.style.display = this.state.search ? 'block' : 'none';
        }
        this.applyFiltersAndRender();
      });
    }

    if (this.clearSearchBtn) {
      this.clearSearchBtn.addEventListener('click', () => {
        this.searchInput.value = '';
        this.state.search = '';
        this.clearSearchBtn.style.display = 'none';
        this.state.page = 1;
        this.applyFiltersAndRender();
      });
    }

    // Mode filter buttons (All / TAT / PPDT)
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.mode = btn.dataset.mode;
        this.state.page = 1;
        this.applyFiltersAndRender();
      });
    });

    // Category select
    if (this.categorySelect) {
      this.categorySelect.addEventListener('change', (e) => {
        this.state.category = e.target.value;
        this.state.page = 1;
        this.applyFiltersAndRender();
      });
    }

    // OLQ select
    if (this.olqSelect) {
      this.olqSelect.addEventListener('change', (e) => {
        this.state.olq = e.target.value;
        this.state.page = 1;
        this.applyFiltersAndRender();
      });
    }

    // Sort select
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        this.state.sort = e.target.value;
        this.applyFiltersAndRender();
      });
    }

    // Modal controls
    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', () => this.closeModal());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalEl && this.modalEl.classList.contains('active')) {
        this.closeModal();
      }
    });

    // Copy story button in modal
    if (this.modalCopyBtn) {
      this.modalCopyBtn.addEventListener('click', () => {
        if (this.state.currentModalStory) {
          navigator.clipboard.writeText(this.state.currentModalStory.story).then(() => {
            this.showToast('Story copied to clipboard!');
          });
        }
      });
    }

    // Audio TTS speak button in modal
    if (this.modalSpeakBtn) {
      this.modalSpeakBtn.addEventListener('click', () => {
        this.toggleSpeech();
      });
    }

    // Practice button
    if (this.modalPracticeBtn) {
      this.modalPracticeBtn.addEventListener('click', () => {
        if (this.state.currentModalStory) {
          const s = this.state.currentModalStory;
          window.location.href = `index.html?tab=simulator&mode=${s.type}&id=${s.id}`;
        }
      });
    }
  }

  handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get('id');
    const modeParam = params.get('mode');

    if (modeParam && ['all', 'tat', 'ppdt'].includes(modeParam)) {
      this.state.mode = modeParam;
      this.modeButtons.forEach(b => {
        b.classList.toggle('active', b.dataset.mode === modeParam);
      });
    }

    if (storyId) {
      const match = this.allStories.find(s => s.id === storyId);
      if (match) {
        setTimeout(() => this.openModal(match), 300);
      }
    }
  }

  applyFiltersAndRender() {
    let filtered = [...this.allStories];

    // Mode filter
    if (this.state.mode === 'tat') {
      filtered = filtered.filter(s => s.type === 'tat');
    } else if (this.state.mode === 'ppdt') {
      filtered = filtered.filter(s => s.type === 'ppdt');
    }

    // Category filter
    if (this.state.category !== 'all') {
      filtered = filtered.filter(s => s.category === this.state.category);
    }

    // OLQ filter
    if (this.state.olq !== 'all') {
      filtered = filtered.filter(s => s.olqs_demonstrated && s.olqs_demonstrated.includes(this.state.olq));
    }

    // Text search
    if (this.state.search) {
      const q = this.state.search;
      filtered = filtered.filter(s => {
        const text = `${s.id} ${s.title} ${s.hero.name} ${s.hero.profession} ${s.category} ${s.story} ${(s.olqs_demonstrated || []).join(' ')}`.toLowerCase();
        return text.includes(q);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (this.state.sort === 'num_asc') return a.num - b.num;
      if (this.state.sort === 'num_desc') return b.num - a.num;
      if (this.state.sort === 'word_asc') return a.word_count - b.word_count;
      if (this.state.sort === 'word_desc') return b.word_count - a.word_count;
      return 0;
    });

    this.filteredStories = filtered;

    // Update result count
    if (this.resultCountEl) {
      this.resultCountEl.textContent = `Showing ${filtered.length} model stories`;
    }

    // Pagination bounds
    const totalPages = Math.ceil(filtered.length / this.state.perPage) || 1;
    if (this.state.page > totalPages) this.state.page = totalPages;
    if (this.state.page < 1) this.state.page = 1;

    const startIdx = (this.state.page - 1) * this.state.perPage;
    const pageItems = filtered.slice(startIdx, startIdx + this.state.perPage);

    this.renderGrid(pageItems);
    this.renderPagination(totalPages);
  }

  renderGrid(items) {
    if (!this.gridEl) return;

    if (items.length === 0) {
      this.gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="color: var(--text-primary); font-size: 1.2rem; margin-bottom: 0.5rem;">No Model Stories Found</h3>
          <p style="font-size: 0.9rem;">Try adjusting your search terms or clearing your category/OLQ filters.</p>
          <button class="btn-primary" style="margin-top: 1.5rem;" onclick="window.storiesApp.resetFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    let html = '';
    items.forEach(s => {
      const typeLabel = s.type === 'tat' ? 'TAT' : 'PPDT';
      const badgeClass = s.type === 'tat' ? 'tat-badge' : 'ppdt-badge';
      const olqChips = (s.olqs_demonstrated || []).slice(0, 3).map(olq => `
        <span class="story-olq-chip" onclick="event.stopPropagation(); window.storiesApp.filterByOLQ('${olq}')">${olq}</span>
      `).join('');

      html += `
        <div class="story-card" onclick="window.storiesApp.openModalById('${s.id}')">
          <div class="story-card-image-wrap">
            <img src="${s.image}" alt="${s.title}" loading="lazy" class="story-card-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'200\\' fill=\\'%231e293b\\'><rect width=\\'100%\\' height=\\'100%\\'/><text x=\\'50%\\' y=\\'50%\\' fill=\\'%2394a3b8\\' text-anchor=\\'middle\\' font-size=\\'16\\'>${s.id}</text></svg>'">
            <span class="story-type-badge ${badgeClass}">${typeLabel} #${s.num}</span>
            <span class="story-cat-badge">${s.category}</span>
          </div>

          <div class="story-card-body">
            <div class="story-hero-line">
              <span class="hero-avatar">👤</span>
              <strong class="hero-name">${s.hero.name} (${s.hero.age})</strong>
              <span class="hero-role-tag">${s.hero.profession}</span>
            </div>

            <h4 class="story-card-title">${s.title}</h4>

            <p class="story-card-excerpt">"${s.story.substring(0, 155)}..."</p>

            <div class="story-card-footer">
              <div class="story-meta-tags">
                <span class="story-word-badge">📝 ${s.word_count} Words</span>
                ${s.type === 'ppdt' ? '<span class="story-box-badge">📦 PPDT Box</span>' : ''}
              </div>
              <div class="story-olqs-row">
                ${olqChips}
              </div>
            </div>

            <div class="story-card-actions" onclick="event.stopPropagation();">
              <button class="btn-story-action primary" onclick="window.storiesApp.openModalById('${s.id}')">
                📖 Read Dossier
              </button>
              <button class="btn-story-action secondary" title="Copy Story" onclick="window.storiesApp.copyStory('${s.id}')">
                📋 Copy
              </button>
              <a href="index.html?tab=simulator&mode=${s.type}&id=${s.id}" class="btn-story-action accent" title="Practice in Simulator">
                ⏱️ Test
              </a>
            </div>
          </div>
        </div>
      `;
    });

    this.gridEl.innerHTML = html;
  }

  renderPagination(totalPages) {
    if (!this.paginationEl) return;

    if (totalPages <= 1) {
      this.paginationEl.innerHTML = '';
      return;
    }

    const cur = this.state.page;
    let html = `
      <div class="pagination-bar">
        <button class="pag-btn" ${cur === 1 ? 'disabled' : ''} onclick="window.storiesApp.setPage(1)">« First</button>
        <button class="pag-btn" ${cur === 1 ? 'disabled' : ''} onclick="window.storiesApp.setPage(${cur - 1})">‹ Prev</button>
        
        <span class="pag-info">
          Page <strong>${cur}</strong> of <strong>${totalPages}</strong>
        </span>

        <button class="pag-btn" ${cur === totalPages ? 'disabled' : ''} onclick="window.storiesApp.setPage(${cur + 1})">Next ›</button>
        <button class="pag-btn" ${cur === totalPages ? 'disabled' : ''} onclick="window.storiesApp.setPage(${totalPages})">Last »</button>
      </div>
    `;

    this.paginationEl.innerHTML = html;
  }

  setPage(page) {
    this.state.page = page;
    this.applyFiltersAndRender();
    window.scrollTo({ top: 400, behavior: 'smooth' });
  }

  resetFilters() {
    this.state.mode = 'all';
    this.state.category = 'all';
    this.state.olq = 'all';
    this.state.search = '';
    this.state.sort = 'num_asc';
    this.state.page = 1;

    if (this.searchInput) this.searchInput.value = '';
    if (this.clearSearchBtn) this.clearSearchBtn.style.display = 'none';
    if (this.categorySelect) this.categorySelect.value = 'all';
    if (this.olqSelect) this.olqSelect.value = 'all';
    if (this.sortSelect) this.sortSelect.value = 'num_asc';

    this.modeButtons.forEach(b => {
      b.classList.toggle('active', b.dataset.mode === 'all');
    });

    this.applyFiltersAndRender();
  }

  filterByOLQ(olqName) {
    if (this.olqSelect) {
      this.olqSelect.value = olqName;
      this.state.olq = olqName;
      this.state.page = 1;
      this.applyFiltersAndRender();
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  }

  openModalById(id) {
    const story = this.allStories.find(s => s.id === id);
    if (story) {
      this.openModal(story);
    }
  }

  openModal(story) {
    this.stopSpeech();
    this.state.currentModalStory = story;

    // Fill modal fields
    if (this.modalImg) this.modalImg.src = story.image;
    if (this.modalTitle) this.modalTitle.textContent = story.title;
    if (this.modalBadge) {
      this.modalBadge.textContent = `${story.type.toUpperCase()} #${story.num}`;
      this.modalBadge.className = `story-type-badge ${story.type === 'tat' ? 'tat-badge' : 'ppdt-badge'}`;
    }
    if (this.modalCategory) this.modalCategory.textContent = story.category;

    if (this.modalHero) {
      this.modalHero.innerHTML = `
        <div class="modal-hero-card">
          <span style="font-size: 1.5rem;">👤</span>
          <div>
            <strong style="color: var(--text-primary); font-size: 1.05rem;">${story.hero.name} (${story.hero.age}, ${story.hero.gender})</strong>
            <div style="font-size: 0.85rem; color: var(--accent-secondary); margin-top: 2px;">
              ${story.hero.profession} · Mood: <span style="color: var(--accent-success); font-weight: bold;">${story.hero.mood} (Positive)</span>
            </div>
          </div>
        </div>
      `;
    }

    // PPDT box display
    if (this.modalPpdtBox) {
      if (story.type === 'ppdt' && story.box_characters) {
        this.modalPpdtBox.style.display = 'block';
        if (this.modalPpdtChars) {
          this.modalPpdtChars.innerHTML = story.box_characters.map(c => `
            <div class="ppdt-char-token">
              <span class="token-sex">${c.gender}</span>
              <span class="token-age">${c.age}</span>
              <span class="token-mood">${c.mood}</span>
              <span class="token-role">${c.role}</span>
            </div>
          `).join('');
        }
      } else {
        this.modalPpdtBox.style.display = 'none';
      }
    }

    if (this.modalStory) {
      this.modalStory.innerHTML = `"${story.story}"`;
    }

    if (this.modalWordCount) {
      this.modalWordCount.textContent = `📝 ${story.word_count} Words · Ideal 4-Minute Pacing`;
    }

    // 4-step logic
    if (story.action_breakdown) {
      if (this.modalActionObserve) this.modalActionObserve.textContent = story.action_breakdown.observe;
      if (this.modalActionPlan) this.modalActionPlan.textContent = story.action_breakdown.plan;
      if (this.modalActionExecute) this.modalActionExecute.textContent = story.action_breakdown.execute;
      if (this.modalActionOutcome) this.modalActionOutcome.textContent = story.action_breakdown.outcome;
    }

    // OLQs
    if (this.modalOlqs && story.olqs_demonstrated) {
      this.modalOlqs.innerHTML = story.olqs_demonstrated.map(olq => `
        <span class="prof-olq-tag" onclick="window.storiesApp.closeModal(); window.storiesApp.filterByOLQ('${olq}')">
          ✨ ${olq}
        </span>
      `).join('');
    }

    // Blunder warning
    if (this.modalBlunder) {
      this.modalBlunder.innerHTML = `
        <strong>⚠️ SSB Candidate Blunder to Avoid:</strong><br>
        ${story.blunder_warning || 'Avoid making the protagonist a passive bystander or introducing unnecessary criminal/superhero melodrama.'}
      `;
    }

    // Open modal
    if (this.modalEl) this.modalEl.classList.add('active');
    if (this.modalOverlay) this.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.stopSpeech();
    if (this.modalEl) this.modalEl.classList.remove('active');
    if (this.modalOverlay) this.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    this.state.currentModalStory = null;
  }

  copyStory(id) {
    const story = this.allStories.find(s => s.id === id);
    if (story) {
      navigator.clipboard.writeText(story.story).then(() => {
        this.showToast(`Story for ${story.type.toUpperCase()} #${story.num} copied to clipboard!`);
      });
    }
  }

  showToast(message) {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');
    setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 2500);
  }

  toggleSpeech() {
    if (!this.speechSynth || !this.state.currentModalStory) return;

    if (this.isSpeaking) {
      this.stopSpeech();
      return;
    }

    const story = this.state.currentModalStory;
    const textToSpeak = `${story.title}. Main character: ${story.hero.name}, ${story.hero.profession}. Story: ${story.story}`;

    this.currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
    this.currentUtterance.rate = 0.95;
    this.currentUtterance.pitch = 1.0;

    this.currentUtterance.onstart = () => {
      this.isSpeaking = true;
      if (this.modalSpeakBtn) {
        this.modalSpeakBtn.innerHTML = '⏹️ Stop Audio';
        this.modalSpeakBtn.classList.add('speaking');
      }
    };

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
      if (this.modalSpeakBtn) {
        this.modalSpeakBtn.innerHTML = '🔊 Read Aloud';
        this.modalSpeakBtn.classList.remove('speaking');
      }
    };

    this.currentUtterance.onerror = () => {
      this.isSpeaking = false;
      if (this.modalSpeakBtn) {
        this.modalSpeakBtn.innerHTML = '🔊 Read Aloud';
        this.modalSpeakBtn.classList.remove('speaking');
      }
    };

    this.speechSynth.speak(this.currentUtterance);
  }

  stopSpeech() {
    if (this.speechSynth) {
      this.speechSynth.cancel();
      this.isSpeaking = false;
      if (this.modalSpeakBtn) {
        this.modalSpeakBtn.innerHTML = '🔊 Read Aloud';
        this.modalSpeakBtn.classList.remove('speaking');
      }
    }
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.storiesApp = new StoriesDossier();
});
