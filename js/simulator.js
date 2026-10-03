/* ==========================================================================
   Part V: SSB Timed Practice Simulator & Part IV Automated Evaluation Engine
   Features:
   - Stage-2 TAT Single Practice (79 Authentic Prompts + Blank Slide)
   - Stage-1 PPDT Arena with Interactive Character Plotter Box & Action Header
   - 12-Slide Continuous TAT Mock Exam Battery (54-min authentic SSB simulation)
   - Authentic Audio Cue Engine (timeIsUp.m4a, countdown chimes)
   - 10-Point Checklist & 7 Lethal Pitfalls Automated Radar
   ========================================================================== */

class TATSimulator {
  constructor(options = {}) {
    this.options = options;

    // Elements
    this.promptSelect = document.getElementById(options.promptSelectId || 'stimulusSelect');
    this.imageEl = document.getElementById(options.imageId || 'stimulusImage');
    this.imageTitleEl = document.getElementById(options.imageTitleId || 'stimulusTitle');
    this.imageCueEl = document.getElementById(options.imageCueId || 'stimulusCue');
    this.suggestedRolesEl = document.getElementById(options.suggestedRolesId || 'stimulusSuggestedRoles');

    // Timers & Controls
    this.observeTimerEl = document.getElementById(options.observeTimerId || 'observeTimerDisplay');
    this.observeOverlay = document.getElementById(options.observeOverlayId || 'observationOverlay');
    this.writeTimerEl = document.getElementById(options.writeTimerId || 'writingTimerBadge');
    this.startBtn = document.getElementById(options.startBtnId || 'startObservationBtn');
    this.resetBtn = document.getElementById(options.resetBtnId || 'resetSimulatorBtn');

    // Writing Workspace
    this.storyInput = document.getElementById(options.storyInputId || 'storyWritingInput');
    this.wordCountEl = document.getElementById(options.wordCountId || 'storyWordCount');
    this.charCountEl = document.getElementById(options.charCountId || 'storyCharCount');
    this.evalBtn = document.getElementById(options.evalBtnId || 'evaluateStoryBtn');
    this.evalResultsEl = document.getElementById(options.evalResultsId || 'evaluationResultsArea');

    // PPDT Box elements
    this.ppdtBoxContainer = document.getElementById('ppdtBoxContainer');
    this.ppdtCanvas = document.getElementById('ppdtCanvas');
    this.ppdtActionInput = document.getElementById('ppdtActionInput');
    this.ppdtCharacters = []; // Array of { id, x, y, age, gender, mood, isHero }

    // Mode & Battery State
    this.currentMode = 'tat'; // 'tat', 'ppdt', 'battery'
    this.batteryActive = false;
    this.batteryCurrentIndex = 0;
    this.batterySlides = []; // 12 slides
    this.batteryStories = []; // 12 stories

    // Audio Engine
    this.soundEnabled = localStorage.getItem('ssb_sound_enabled') !== 'false';
    this.audioPlayer = null;

    // Stimuli Lists
    this.tatPrompts = (window.SSB_STIMULI && Array.isArray(window.SSB_STIMULI.tat)) 
      ? window.SSB_STIMULI.tat 
      : ((window.SSB_DATA && window.SSB_DATA.sample_prompts) || []);

    this.ppdtPrompts = (window.SSB_STIMULI && Array.isArray(window.SSB_STIMULI.ppdt)) 
      ? window.SSB_STIMULI.ppdt 
      : [];

    this.currentPrompts = this.tatPrompts;
    this.currentPrompt = this.currentPrompts.length > 0 ? this.currentPrompts[0] : null;

    // Timer variables
    this.state = 'idle'; // 'idle', 'observing', 'box_phase', 'writing', 'finished'
    this.observeRemaining = 30;
    this.boxRemaining = 60; // 1 min for PPDT box
    this.writeRemaining = 240; // 4 minutes
    this.timerInterval = null;

    if (this.imageEl && this.storyInput) {
      this.init();
    }
  }

  init() {
    this.setupModeSelector();
    this.renderPromptOptions();
    this.setupEventListeners();
    this.setupPPDTBox();
    this.updateSoundToggleUI();
    if (this.currentPrompts.length > 0) {
      this.loadPrompt(0);
    }
  }

  /* --------------------------------------------------------------------------
     MODE SELECTION: Stage-2 TAT | Stage-1 PPDT | 12-Slide Mock Battery
     -------------------------------------------------------------------------- */
  setupModeSelector() {
    const modeTabs = document.querySelectorAll('.simulator-mode-btn');
    modeTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        modeTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.switchMode(btn.dataset.mode);
      });
    });
  }

  switchMode(mode) {
    this.currentMode = mode;
    this.resetTest();

    const modeTabs = document.querySelectorAll('.simulator-mode-btn');
    modeTabs.forEach(b => {
      if (b.dataset.mode === mode) b.classList.add('active');
      else b.classList.remove('active');
    });

    const batteryBar = document.getElementById('batteryProgressBar');
    const ppdtWorkspace = document.getElementById('ppdtWorkspaceSection');
    const roleSuggestions = document.getElementById('stimulusRolesContainer');
    const promptSelectorWrap = document.getElementById('stimulusSelectorWrap');

    if (batteryBar) batteryBar.style.display = (mode === 'battery') ? 'block' : 'none';
    if (ppdtWorkspace) ppdtWorkspace.style.display = (mode === 'ppdt') ? 'block' : 'none';
    if (roleSuggestions) roleSuggestions.style.display = (mode === 'ppdt') ? 'none' : 'block';
    if (promptSelectorWrap) promptSelectorWrap.style.display = (mode === 'battery') ? 'none' : 'block';

    if (mode === 'tat') {
      this.currentPrompts = this.tatPrompts;
      this.writeRemaining = 240; // 4 minutes
      this.renderPromptOptions();
      this.loadPrompt(0);
    } else if (mode === 'ppdt') {
      this.currentPrompts = this.ppdtPrompts.length > 0 ? this.ppdtPrompts : this.tatPrompts;
      this.writeRemaining = 180; // 3 minutes for PPDT story after box
      this.renderPromptOptions();
      this.loadPrompt(0);
    } else if (mode === 'battery') {
      this.initBatteryMock();
    }
  }

  renderPromptOptions(filterCategory = 'ALL') {
    if (!this.promptSelect || !this.currentPrompts) return;

    let html = '';
    const filtered = filterCategory === 'ALL' 
      ? this.currentPrompts 
      : this.currentPrompts.filter(p => p.category === filterCategory);

    filtered.forEach((p) => {
      const idx = this.currentPrompts.indexOf(p);
      html += `<option value="${idx}">${p.title} (${p.category || 'General'})</option>`;
    });

    this.promptSelect.innerHTML = html;
  }

  filterPromptsByCategory(category) {
    this.renderPromptOptions(category);
    if (this.promptSelect.options.length > 0) {
      this.loadPrompt(Number(this.promptSelect.options[0].value));
    }
  }

  loadRandomPrompt() {
    if (!this.currentPrompts || this.currentPrompts.length === 0) return;
    const rand = Math.floor(Math.random() * this.currentPrompts.length);
    this.loadPrompt(rand);
    if (this.promptSelect) this.promptSelect.value = rand;
  }

  loadBlankSlide() {
    const blankIdx = this.currentPrompts.findIndex(p => p.id === 'tat_blank');
    if (blankIdx !== -1) {
      this.loadPrompt(blankIdx);
      if (this.promptSelect) this.promptSelect.value = blankIdx;
    } else {
      alert('Blank slide is only available in TAT Mode.');
    }
  }

  loadPrompt(index) {
    const p = this.currentPrompts[index];
    if (!p) return;
    this.currentPrompt = p;

    if (this.imageEl) this.imageEl.src = p.image;
    if (this.imageTitleEl) this.imageTitleEl.textContent = p.title;
    if (this.imageCueEl) this.imageCueEl.textContent = p.context_cue;

    if (this.suggestedRolesEl && p.suggested_roles) {
      this.suggestedRolesEl.innerHTML = p.suggested_roles
        .map(role => `<span class="prof-olq-tag" style="cursor: pointer;" onclick="window.simulator.fillHeroRole('${role}')">${role}</span>`)
        .join('');
    }

    this.resetTest();
  }

  openModelStory() {
    if (!this.currentPrompt) return;
    const mode = this.currentMode === 'ppdt' ? 'ppdt' : 'tat';
    const targetUrl = `stories.html?id=${this.currentPrompt.id}&mode=${mode}`;
    window.open(targetUrl, '_blank');
  }

  /* --------------------------------------------------------------------------
     12-SLIDE CONTINUOUS TAT MOCK EXAM BATTERY
     -------------------------------------------------------------------------- */
  initBatteryMock() {
    this.batteryActive = true;
    this.batteryCurrentIndex = 0;
    this.batteryStories = [];

    // Select 11 random distinct TAT slides + 1 Blank Slide
    const nonBlank = this.tatPrompts.filter(p => p.id !== 'tat_blank');
    const shuffled = [...nonBlank].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 11);

    const blank = this.tatPrompts.find(p => p.id === 'tat_blank') || {
      id: 'tat_blank',
      title: 'Slide 12: Blank Slide (Self-Directed Ideal Story)',
      category: 'Self-Directed / Final Slide',
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%231e293b"/><text x="400" y="300" font-family="Arial, sans-serif" font-size="22" fill="%2394a3b8" text-anchor="middle">BLANK SLIDE: Write your personal ideal story</text></svg>',
      context_cue: 'Write a constructive story reflecting your personal ambitions, values, and realistic problem-solving philosophy.'
    };

    selected.push(blank);
    this.batterySlides = selected;

    this.updateBatteryHeaderUI();
    this.loadBatterySlide(0);
  }

  loadBatterySlide(idx) {
    if (idx >= this.batterySlides.length) {
      this.finishFullBattery();
      return;
    }
    this.batteryCurrentIndex = idx;
    const slide = this.batterySlides[idx];
    this.currentPrompt = slide;

    if (this.imageEl) this.imageEl.src = slide.image;
    if (this.imageTitleEl) this.imageTitleEl.textContent = `Slide ${idx + 1} of 12: ${slide.title}`;
    if (this.imageCueEl) this.imageCueEl.textContent = slide.context_cue;

    if (this.storyInput) {
      this.storyInput.value = '';
      this.updateCounters();
    }

    this.updateBatteryHeaderUI();
    this.startObservation();
  }

  updateBatteryHeaderUI() {
    const numEl = document.getElementById('batteryCurrentSlideNum');
    const progressFill = document.getElementById('batteryProgressFill');
    if (numEl) numEl.textContent = `Slide ${this.batteryCurrentIndex + 1} of 12`;
    if (progressFill) {
      const pct = Math.round(((this.batteryCurrentIndex + 1) / 12) * 100);
      progressFill.style.width = `${pct}%`;
    }
  }

  finishFullBattery() {
    this.batteryActive = false;
    this.state = 'finished';
    clearInterval(this.timerInterval);
    this.playAudioAlert('end');

    if (this.evalResultsEl) {
      this.evalResultsEl.style.display = 'block';
      let storiesHtml = this.batteryStories.map((item, idx) => `
        <div style="background: var(--bg-tertiary); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1rem; border-left: 4px solid var(--accent-primary);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <strong style="color: var(--accent-secondary);">Slide ${idx + 1}: ${item.title}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${item.wordCount} words</span>
          </div>
          <p style="font-size: 0.9rem; line-height: 1.6; color: var(--text-primary);">${item.story || '<em>(No story recorded)</em>'}</p>
        </div>
      `).join('');

      this.evalResultsEl.innerHTML = `
        <div class="eval-score-banner">
          <div>
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--accent-success); text-transform: uppercase;">
              Full 12-Slide Continuous TAT Exam Complete!
            </span>
            <h2 style="font-family: var(--font-display); font-size: 1.6rem; color: var(--text-primary); margin-top: 0.25rem;">
              🎖️ 54-Minute Battery Summary
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">
              You have completed all 11 standardized picture projections + Slide 12 Blank Slide under authentic SSB psychological timing.
            </p>
          </div>
        </div>

        <div style="margin: 1.5rem 0;">
          <h4 style="font-family: var(--font-display); font-size: 1.15rem; margin-bottom: 1rem;">Your 12-Story Portfolio:</h4>
          ${storiesHtml}
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button onclick="window.simulator.exportBatteryTranscript()" class="btn-primary">
            📥 Export / Download Full Exam Transcript
          </button>
          <button onclick="window.simulator.switchMode('tat')" class="btn-primary" style="background: var(--bg-tertiary); border: 1px solid var(--border-subtle); color: var(--text-primary);">
            🔄 Return to Single Practice
          </button>
        </div>
      `;
      this.evalResultsEl.scrollIntoView({ behavior: 'smooth' });
    }
  }

  exportBatteryTranscript() {
    let transcript = `===========================================================\nSSB 12-SLIDE CONTINUOUS TAT MOCK EXAM TRANSCRIPT\nDate: ${new Date().toLocaleString()}\n===========================================================\n\n`;
    this.batteryStories.forEach((s, idx) => {
      transcript += `--- SLIDE ${idx + 1}: ${s.title} (${s.wordCount} words) ---\n${s.story}\n\n`;
    });

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SSB_TAT_Battery_Exam_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* --------------------------------------------------------------------------
     STAGE-1 PPDT BOX INTERACTIVE PLOTTER
     -------------------------------------------------------------------------- */
  setupPPDTBox() {
    const box = document.getElementById('ppdtInteractiveBox');
    if (!box) return;

    box.addEventListener('click', (e) => {
      // Don't trigger if clicked on existing token
      if (e.target.closest('.ppdt-token')) return;

      const rect = box.getBoundingClientRect();
      const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);

      this.promptAddPPDTCharacter(xPct, yPct);
    });
  }

  promptAddPPDTCharacter(x, y) {
    const age = prompt('Enter Character Age (e.g. 24):', '24');
    if (!age) return;

    const gender = prompt('Enter Gender: M (Male), F (Female), or P (Person/Ambiguous):', 'M').toUpperCase();
    const mood = prompt('Enter Mood: + (Positive), 0 (Neutral), or - (Negative):', '+');
    const isHero = confirm('Is this character the PROTAGONIST / HERO? (Will be circled with a ring)');

    const char = {
      id: Date.now(),
      x,
      y,
      age: age.trim(),
      gender: ['M', 'F', 'P'].includes(gender) ? gender : 'M',
      mood: ['+', '-', '0'].includes(mood) ? mood : '+',
      isHero: isHero
    };

    this.ppdtCharacters.push(char);
    this.renderPPDTCharacters();
  }

  renderPPDTCharacters() {
    const box = document.getElementById('ppdtInteractiveBox');
    if (!box) return;

    box.innerHTML = '';
    this.ppdtCharacters.forEach((char) => {
      const token = document.createElement('div');
      token.className = `ppdt-token ${char.isHero ? 'is-hero' : ''}`;
      token.style.left = `${char.x}%`;
      token.style.top = `${char.y}%`;
      token.title = `${char.isHero ? 'PROTAGONIST - ' : ''}Age: ${char.age}, Sex: ${char.gender}, Mood: ${char.mood}`;

      token.innerHTML = `
        <span class="token-text">${char.gender} ${char.age} ${char.mood}</span>
        <button class="token-del-btn" onclick="event.stopPropagation(); window.simulator.removePPDTCharacter(${char.id})">×</button>
      `;
      box.appendChild(token);
    });

    const statusEl = document.getElementById('ppdtCharCountStatus');
    if (statusEl) {
      statusEl.textContent = `${this.ppdtCharacters.length} character(s) marked. ${this.ppdtCharacters.some(c => c.isHero) ? '✅ Hero designated.' : '⚠️ No hero circled yet.'}`;
    }
  }

  removePPDTCharacter(id) {
    this.ppdtCharacters = this.ppdtCharacters.filter(c => c.id !== id);
    this.renderPPDTCharacters();
  }

  clearPPDTBox() {
    this.ppdtCharacters = [];
    this.renderPPDTCharacters();
  }

  /* --------------------------------------------------------------------------
     TIMER CONTROLS & TIMED FLOW
     -------------------------------------------------------------------------- */
  setupEventListeners() {
    if (this.promptSelect) {
      this.promptSelect.addEventListener('change', (e) => {
        this.loadPrompt(Number(e.target.value));
      });
    }

    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        if (this.state === 'idle') {
          this.startObservation();
        } else if (this.state === 'observing') {
          if (this.currentMode === 'ppdt') this.startPPDTBoxPhase();
          else this.startWriting();
        }
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.resetTest());
    }

    if (this.storyInput) {
      this.storyInput.addEventListener('input', () => this.updateCounters());
    }

    if (this.evalBtn) {
      this.evalBtn.addEventListener('click', () => this.evaluateStory());
    }

    // Sound toggle in top header
    const soundToggle = document.getElementById('soundToggleBtn');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => this.toggleSound());
    }

    // Category chips
    document.querySelectorAll('.stimulus-category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.stimulus-category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.filterPromptsByCategory(chip.dataset.category);
      });
    });
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('ssb_sound_enabled', this.soundEnabled);
    this.updateSoundToggleUI();
  }

  updateSoundToggleUI() {
    const btn = document.getElementById('soundToggleBtn');
    if (btn) {
      btn.textContent = this.soundEnabled ? '🔊 Sound On' : '🔇 Muted';
      btn.title = this.soundEnabled ? 'Audio alerts active' : 'Audio muted';
    }
  }

  playAudioAlert(type) {
    if (!this.soundEnabled) return;
    try {
      if (type === 'end') {
        const audio = new Audio('assets/sounds/timeisup.m4a');
        audio.play().catch(() => this.playTone(330, 0.4));
      } else if (type === 'start') {
        this.playTone(880, 0.25);
      } else if (type === 'warning') {
        this.playTone(587, 0.2);
      }
    } catch (e) {
      this.playTone(440, 0.2);
    }
  }

  startObservation() {
    this.state = 'observing';
    this.observeRemaining = 30;
    if (this.observeOverlay) this.observeOverlay.style.display = 'flex';
    if (this.startBtn) {
      this.startBtn.textContent = 'Skip to Writing →';
      this.startBtn.classList.remove('btn-primary');
      this.startBtn.style.background = 'var(--accent-secondary)';
    }

    this.playAudioAlert('start');

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.observeRemaining--;
      if (this.observeTimerEl) {
        this.observeTimerEl.textContent = `${this.observeRemaining}s`;
      }

      if (this.observeRemaining <= 0) {
        clearInterval(this.timerInterval);
        if (this.currentMode === 'ppdt') {
          this.startPPDTBoxPhase();
        } else {
          this.startWriting();
        }
      }
    }, 1000);
  }

  startPPDTBoxPhase() {
    this.state = 'box_phase';
    if (this.observeOverlay) this.observeOverlay.style.display = 'none';
    this.boxRemaining = 60; // 1 minute to fill box & action

    if (this.startBtn) {
      this.startBtn.textContent = 'Proceed to Story Writing (3m) →';
      this.startBtn.style.background = 'var(--accent-warning)';
    }

    this.playAudioAlert('start');
    const badge = this.writeTimerEl;
    if (badge) {
      badge.textContent = '📦 Box Phase: 1:00';
      badge.className = 'writing-timer-badge warning';
    }

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.boxRemaining--;
      const secs = this.boxRemaining < 10 ? `0${this.boxRemaining}` : this.boxRemaining;
      if (badge) badge.textContent = `📦 Box Phase: 0:${secs}`;

      if (this.boxRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.startWriting();
      }
    }, 1000);
  }

  startWriting() {
    this.state = 'writing';
    clearInterval(this.timerInterval);

    if (this.observeOverlay) this.observeOverlay.style.display = 'none';
    if (this.startBtn) this.startBtn.style.display = 'none';

    this.playAudioAlert('start');
    this.writeRemaining = (this.currentMode === 'ppdt') ? 180 : 240; // 3m for PPDT, 4m for TAT
    this.storyInput.removeAttribute('disabled');
    this.storyInput.focus();

    this.timerInterval = setInterval(() => {
      this.writeRemaining--;
      this.updateWriteTimerDisplay();

      if (this.writeRemaining === 60) {
        this.playAudioAlert('warning');
      }

      if (this.writeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.finishWriting();
      }
    }, 1000);
  }

  updateWriteTimerDisplay() {
    if (!this.writeTimerEl) return;
    const mins = Math.floor(this.writeRemaining / 60);
    const secs = this.writeRemaining % 60;
    this.writeTimerEl.textContent = `⏱️ ${mins}:${secs < 10 ? '0' : ''}${secs}`;

    if (this.writeRemaining <= 30) {
      this.writeTimerEl.className = 'writing-timer-badge danger';
    } else if (this.writeRemaining <= 60) {
      this.writeTimerEl.className = 'writing-timer-badge warning';
    } else {
      this.writeTimerEl.className = 'writing-timer-badge';
    }
  }

  finishWriting() {
    this.state = 'finished';
    this.playAudioAlert('end');
    if (this.writeTimerEl) this.writeTimerEl.textContent = '⏱️ Time Up!';

    if (this.batteryActive) {
      // Save current story
      const storyText = this.storyInput.value.trim();
      this.batteryStories.push({
        title: this.currentPrompt.title,
        story: storyText,
        wordCount: storyText ? storyText.split(/\s+/).length : 0
      });

      // Automatically advance to next slide in battery
      setTimeout(() => {
        this.loadBatterySlide(this.batteryCurrentIndex + 1);
      }, 1500);
    } else {
      this.evaluateStory();
    }
  }

  resetTest() {
    clearInterval(this.timerInterval);
    this.state = 'idle';
    this.observeRemaining = 30;
    this.boxRemaining = 60;
    this.writeRemaining = (this.currentMode === 'ppdt') ? 180 : 240;

    if (this.observeOverlay) this.observeOverlay.style.display = 'none';
    if (this.observeTimerEl) this.observeTimerEl.textContent = '30s';
    if (this.writeTimerEl) {
      this.writeTimerEl.textContent = (this.currentMode === 'ppdt') ? '⏱️ 3:00' : '⏱️ 4:00';
      this.writeTimerEl.className = 'writing-timer-badge';
    }

    if (this.startBtn) {
      this.startBtn.style.display = 'inline-flex';
      this.startBtn.textContent = '▶ Start 30s Observation';
      this.startBtn.className = 'btn-primary';
      this.startBtn.style.background = '';
    }

    if (this.storyInput) {
      this.storyInput.value = '';
      this.updateCounters();
    }

    if (this.evalResultsEl) {
      this.evalResultsEl.style.display = 'none';
      this.evalResultsEl.innerHTML = '';
    }
  }

  updateCounters() {
    if (!this.storyInput) return;
    const text = this.storyInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;

    if (this.wordCountEl) {
      const targetMin = (this.currentMode === 'ppdt') ? 70 : 90;
      const targetMax = (this.currentMode === 'ppdt') ? 100 : 120;
      this.wordCountEl.textContent = `${words} words (Target: ${targetMin}-${targetMax})`;

      if (words >= targetMin && words <= targetMax) {
        this.wordCountEl.style.color = 'var(--accent-success)';
      } else if (words > targetMax + 20) {
        this.wordCountEl.style.color = 'var(--accent-warning)';
      } else {
        this.wordCountEl.style.color = 'var(--text-secondary)';
      }
    }
    if (this.charCountEl) this.charCountEl.textContent = `${chars} characters`;
  }

  fillHeroRole(roleName) {
    if (!this.storyInput) return;
    const current = this.storyInput.value;
    if (!current.trim()) {
      this.storyInput.value = `Rohan, a 26-year-old ${roleName}, observed... `;
    } else {
      this.storyInput.value = current + ` (${roleName})`;
    }
    this.storyInput.focus();
    this.updateCounters();
  }

  /* --------------------------------------------------------------------------
     EVALUATION RADAR & 10-POINT CHECKLIST AUDIT
     -------------------------------------------------------------------------- */
  evaluateStory() {
    const story = this.storyInput.value.trim();
    if (!this.evalResultsEl) return;

    if (story.length < 20) {
      alert('Please write at least a few sentences before evaluating.');
      return;
    }

    const words = story.split(/\s+/).length;
    const lower = story.toLowerCase();

    // 10-Point Checklist Audit
    const checks = [
      {
        id: 1,
        title: 'Protagonist Identified',
        rule: 'Identified main character name, age, and professional role.',
        passed: /([A-Z][a-z]+.*?\b(aged|\d{2}|years old|engineer|officer|doctor|specialist|manager|technician|worker|student|teacher|inspector|pilot)\b)/i.test(story)
      },
      {
        id: 2,
        title: 'Profession Relevance',
        rule: 'Does the profession actually matter to the solution?',
        passed: /(blueprint|site|equipment|tool|team|protocol|patient|diagnosis|system|circuit|data|code|inspection|survey|crop|bridge|maintenance)/i.test(lower)
      },
      {
        id: 3,
        title: 'Specific Problem Defined',
        rule: 'The problem is specific and tangible rather than vague.',
        passed: /(noticed|observed|found|discrepancy|leak|crack|fault|injury|delay|shortage|anomaly|blockage|risk|fissure|damaged)/i.test(lower)
      },
      {
        id: 4,
        title: 'Clear Initiative Taken',
        rule: 'Protagonist initiates first useful action without waiting.',
        passed: /(immediately|promptly|stepped in|initiated|examined|decided|inspected|alerted|assessed|prioritised)/i.test(lower)
      },
      {
        id: 5,
        title: 'Practical Resources Used',
        rule: 'Actions rely on realistic tools, equipment, or SOPs.',
        passed: /(kit|radio|materials|tools|backup|equipment|resources|protocol|log|drawings|sensors|spares)/i.test(lower)
      },
      {
        id: 6,
        title: 'Team Coordination & Delegation',
        rule: 'Story includes coordinating with colleagues and stakeholders.',
        passed: /(coordinated|instructed|along with|delegated|consulted|team|workers|colleagues|officials|elders|staff)/i.test(lower)
      },
      {
        id: 7,
        title: 'Adaptability to Constraint',
        rule: 'Protagonist adjusted the plan when confronting difficulties.',
        passed: /(adjusted|modified|revised|alternative|adapted|monitored|shifted|contingency)/i.test(lower)
      },
      {
        id: 8,
        title: 'Realistic Outcome',
        rule: 'Outcome is measurable and plausible, not superhuman.',
        passed: /(completed|resolved|restored|stabilised|secured|submitted|achieved|resumed|prevented|passed inspection)/i.test(lower)
      },
      {
        id: 9,
        title: 'Avoidance of Melodrama',
        rule: 'No unnecessary violence, weapons, or fatalistic drama.',
        passed: !/(terrorist|murder|killed|gun|knife|shot|blood|bomb|robber|ghost|suicide)/i.test(lower)
      },
      {
        id: 10,
        title: 'Real-Life Feasibility',
        rule: 'The same action sequence could actually work in real life.',
        passed: words >= 65 && !/(miracle|magically|single-handedly solved all|defeated single-handed)/i.test(lower)
      }
    ];

    // PPDT Specific Checks
    let ppdtSpecificPoints = [];
    if (this.currentMode === 'ppdt') {
      const hasHero = this.ppdtCharacters.some(c => c.isHero);
      const actionText = (this.ppdtActionInput ? this.ppdtActionInput.value.trim() : '');
      ppdtSpecificPoints.push({
        title: 'Character Designation Box',
        passed: this.ppdtCharacters.length > 0 && hasHero,
        note: hasHero ? `✅ Marked ${this.ppdtCharacters.length} character(s) with designated hero.` : `⚠️ Remember to designate and circle your hero.`
      });
      ppdtSpecificPoints.push({
        title: 'PPDT Action Header',
        passed: actionText.length >= 5,
        note: actionText.length >= 5 ? `✅ Action line: "${actionText}"` : `⚠️ Write a crisp 1-line action header.`
      });
    }

    // Pitfall Scanner
    const redFlags = [];
    if (/alone|by himself|without anyone's help|single-handedly/i.test(lower)) {
      redFlags.push('⚠️ Lone-Wolf Trap: The protagonist tried to solve everything alone instead of coordinating.');
    }
    if (/(terrorist|murder|killed|gun|knife|shot|blood|bomb|revenge)/i.test(lower)) {
      redFlags.push('⚠️ Melodrama Violation: Injected crime/violence where practical professional problem-solving was called for.');
    }
    if (/(is a person who is very good|always helps everyone|qualities of leadership|displaying initiative)/i.test(lower)) {
      redFlags.push('⚠️ Preachy / OLQ-Forcing Trap: Described qualities explicitly instead of demonstrating them through action.');
    }
    if (/(this picture shows|in the picture we can see|the image depicts)/i.test(lower)) {
      redFlags.push('⚠️ Description over Story: Treated the slide as a photograph description instead of a dynamic story.');
    }
    if (words < 65) {
      redFlags.push('⚠️ Underdeveloped Story: Under 65 words. Lacks depth in execution steps and final measurable outcome.');
    } else if (words > 140) {
      redFlags.push('⚠️ Wordiness Warning: Over 140 words. May be difficult to handwrite within 4 minutes in actual SSB.');
    }

    const passedCount = checks.filter(c => c.passed).length;
    let score = Math.max(10, Math.round((passedCount / checks.length) * 100 - (redFlags.length * 8)));

    let scoreColor = 'var(--accent-success)';
    if (score < 60) scoreColor = 'var(--accent-danger)';
    else if (score < 80) scoreColor = 'var(--accent-warning)';

    this.evalResultsEl.style.display = 'block';
    this.evalResultsEl.innerHTML = `
      <div class="eval-score-banner">
        <div>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 1px;">
            SSB ${this.currentMode === 'ppdt' ? 'Stage-1 PPDT' : 'Stage-2 TAT'} Evaluation Scorecard
          </span>
          <h2 style="font-family: var(--font-display); font-size: 1.6rem; color: var(--text-primary); margin-top: 0.25rem;">
            ${score >= 80 ? '🎯 Officer-Grade Structured Response' : score >= 60 ? '⚡ Good Practical Foundation' : '⚠️ Needs Practical Realism Alignment'}
          </h2>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">
            Evaluated against the 10 Handbook Checklist Questions & 7 Common Pitfalls
          </p>
        </div>
        <div style="text-align: right;">
          <div class="eval-score-num" style="color: ${scoreColor};">${score} <span style="font-size: 1.25rem; font-weight: 600; color: var(--text-muted);">/ 100</span></div>
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">${passedCount} of 10 Criteria Passed</span>
        </div>
      </div>

      ${ppdtSpecificPoints.length > 0 ? `
        <div style="background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(14, 165, 233, 0.25); border-radius: var(--radius-lg); padding: 0.85rem 1.25rem; margin-bottom: 1rem;">
          <strong style="color: var(--accent-secondary); font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">Stage-1 PPDT Elements Audit:</strong>
          ${ppdtSpecificPoints.map(p => `<p style="font-size: 0.85rem; margin: 0.2rem 0; color: var(--text-primary);">${p.note}</p>`).join('')}
        </div>
      ` : ''}

      ${redFlags.length > 0 ? `
        <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: var(--radius-lg); padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
          <strong style="color: #f87171; font-size: 0.85rem; display: block; margin-bottom: 0.4rem;">Identified Red Flags & Pitfalls:</strong>
          <ul style="margin-left: 1.25rem; font-size: 0.85rem; color: var(--text-primary); line-height: 1.6;">
            ${redFlags.map(rf => `<li>${rf}</li>`).join('')}
          </ul>
        </div>
      ` : `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-lg); padding: 0.85rem 1.25rem; margin-bottom: 1.5rem; color: #34d399; font-size: 0.85rem;">
          ✅ Clean Story! No major melodrama or lone-wolf pitfalls detected.
        </div>
      `}

      <h4 style="font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 0.75rem;">10-Point Checklist Verification:</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;">
        ${checks.map(c => `
          <div style="background: var(--bg-tertiary); padding: 0.75rem 1rem; border-radius: var(--radius-md); border-left: 3px solid ${c.passed ? 'var(--accent-success)' : 'var(--accent-danger)'};">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="font-size: 0.85rem; color: var(--text-primary);">${c.id}. ${c.title}</strong>
              <span style="font-size: 0.9rem;">${c.passed ? '✅' : '❌'}</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem;">${c.rule}</p>
          </div>
        `).join('')}
      </div>

      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button onclick="window.simulator.saveStoryLocally()" class="btn-primary" style="font-size: 0.85rem;">
          💾 Save Story to Practice Journal
        </button>
        <button onclick="window.simulator.copyStoryText()" class="btn-primary" style="background: var(--bg-tertiary); border: 1px solid var(--border-subtle); color: var(--text-primary); font-size: 0.85rem;">
          📋 Copy Text
        </button>
      </div>
    `;

    this.evalResultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  saveStoryLocally() {
    const text = this.storyInput.value.trim();
    if (!text) return;
    const history = JSON.parse(localStorage.getItem('ssb_tat_history') || '[]');
    history.unshift({
      date: new Date().toLocaleString(),
      mode: this.currentMode,
      prompt: this.currentPrompt ? this.currentPrompt.title : 'Custom',
      action: this.ppdtActionInput ? this.ppdtActionInput.value.trim() : '',
      story: text
    });
    localStorage.setItem('ssb_tat_history', JSON.stringify(history.slice(0, 30)));
    alert('Story successfully saved to local practice history!');
  }

  copyStoryText() {
    const text = this.storyInput.value.trim();
    navigator.clipboard.writeText(text).then(() => {
      alert('Story copied to clipboard!');
    });
  }

  playTone(frequency, duration) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }
}

window.TATSimulator = TATSimulator;
