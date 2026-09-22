/* ==========================================================================
   Part V: Timed TAT Practice Simulator & Part IV Evaluation Engine
   Simulates authentic SSB TAT slide projection (30s observe + 4m write)
   with instant automated checklist rubric and pitfall detection
   ========================================================================== */

class TATSimulator {
  constructor(options) {
    this.promptSelect = document.getElementById(options.promptSelectId);
    this.imageEl = document.getElementById(options.imageId);
    this.imageTitleEl = document.getElementById(options.imageTitleId);
    this.imageCueEl = document.getElementById(options.imageCueId);
    this.suggestedRolesEl = document.getElementById(options.suggestedRolesId);

    // Timers
    this.observeTimerEl = document.getElementById(options.observeTimerId);
    this.observeOverlay = document.getElementById(options.observeOverlayId);
    this.writeTimerEl = document.getElementById(options.writeTimerId);
    this.startBtn = document.getElementById(options.startBtnId);
    this.resetBtn = document.getElementById(options.resetBtnId);

    // Writing
    this.storyInput = document.getElementById(options.storyInputId);
    this.wordCountEl = document.getElementById(options.wordCountId);
    this.charCountEl = document.getElementById(options.charCountId);
    this.evalBtn = document.getElementById(options.evalBtnId);
    this.evalResultsEl = document.getElementById(options.evalResultsId);

    this.prompts = window.SSB_DATA ? window.SSB_DATA.sample_prompts : [];
    this.currentPrompt = this.prompts[0] || null;

    this.state = 'idle'; // 'idle', 'observing', 'writing', 'finished'
    this.observeRemaining = 30;
    this.writeRemaining = 240; // 4 minutes
    this.timerInterval = null;

    if (this.imageEl && this.storyInput) {
      this.init();
    }
  }

  init() {
    this.renderPromptOptions();
    this.loadPrompt(0);
    this.setupEventListeners();
  }

  renderPromptOptions() {
    if (!this.promptSelect || !this.prompts) return;

    let html = '';
    this.prompts.forEach((p, idx) => {
      html += `<option value="${idx}">${p.title} (${p.domain})</option>`;
    });
    this.promptSelect.innerHTML = html;
  }

  loadPrompt(index) {
    const p = this.prompts[index];
    if (!p) return;
    this.currentPrompt = p;

    if (this.imageEl) this.imageEl.src = p.image;
    if (this.imageTitleEl) this.imageTitleEl.textContent = p.title;
    if (this.imageCueEl) this.imageCueEl.textContent = p.context_cue;

    if (this.suggestedRolesEl) {
      this.suggestedRolesEl.innerHTML = p.suggested_roles
        .map(role => `<span class="prof-olq-tag" style="cursor: pointer;" onclick="window.simulator.fillHeroRole('${role}')">${role}</span>`)
        .join('');
    }

    // Update thumbs
    const thumbs = document.querySelectorAll('.stimulus-thumb');
    thumbs.forEach((th, idx) => {
      if (idx === index) th.classList.add('active');
      else th.classList.remove('active');
    });

    this.resetTest();
  }

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
          this.startWriting();
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

  startObservation() {
    this.state = 'observing';
    this.observeRemaining = 30;
    if (this.observeOverlay) this.observeOverlay.style.display = 'flex';
    if (this.startBtn) {
      this.startBtn.textContent = 'Skip to Writing →';
      this.startBtn.classList.remove('btn-primary');
      this.startBtn.style.background = 'var(--accent-secondary)';
    }

    this.playTone(440, 0.15); // Audio notification

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.observeRemaining--;
      if (this.observeTimerEl) {
        this.observeTimerEl.textContent = `${this.observeRemaining}s`;
      }

      if (this.observeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.startWriting();
      }
    }, 1000);
  }

  startWriting() {
    this.state = 'writing';
    clearInterval(this.timerInterval);

    if (this.observeOverlay) this.observeOverlay.style.display = 'none';
    if (this.startBtn) {
      this.startBtn.style.display = 'none';
    }

    this.playTone(880, 0.25); // Start writing tone
    this.writeRemaining = 240; // 4 minutes
    this.storyInput.removeAttribute('disabled');
    this.storyInput.focus();

    this.timerInterval = setInterval(() => {
      this.writeRemaining--;
      this.updateWriteTimerDisplay();

      if (this.writeRemaining === 60) {
        this.playTone(587, 0.2); // 1-minute warning tone
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
    this.playTone(330, 0.4); // End buzzer
    if (this.writeTimerEl) this.writeTimerEl.textContent = '⏱️ Time Up!';
    this.evaluateStory();
  }

  resetTest() {
    clearInterval(this.timerInterval);
    this.state = 'idle';
    this.observeRemaining = 30;
    this.writeRemaining = 240;

    if (this.observeOverlay) this.observeOverlay.style.display = 'none';
    if (this.observeTimerEl) this.observeTimerEl.textContent = '30s';
    if (this.writeTimerEl) {
      this.writeTimerEl.textContent = '⏱️ 4:00';
      this.writeTimerEl.className = 'writing-timer-badge';
    }

    if (this.startBtn) {
      this.startBtn.style.display = 'inline-flex';
      this.startBtn.textContent = '▶ Start 30s Observation';
      this.startBtn.className = 'btn-primary';
      this.startBtn.style.background = '';
    }

    if (this.evalResultsEl) {
      this.evalResultsEl.style.display = 'none';
    }
  }

  updateCounters() {
    const text = this.storyInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;

    if (this.wordCountEl) {
      this.wordCountEl.textContent = `${words} words (Target: 90-120)`;
      if (words > 135) {
        this.wordCountEl.style.color = 'var(--accent-warning)';
      } else if (words >= 85) {
        this.wordCountEl.style.color = 'var(--accent-success)';
      } else {
        this.wordCountEl.style.color = 'var(--text-secondary)';
      }
    }
    if (this.charCountEl) this.charCountEl.textContent = `${chars} characters`;
  }

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
        passed: words >= 75 && !/(miracle|magically|single-handedly solved all|defeated single-handed)/i.test(lower)
      }
    ];

    // Pitfall Scanner (The 7 Common Mistakes)
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
    if (words < 70) {
      redFlags.push('⚠️ Underdeveloped Story: Under 70 words. Lacks depth in execution steps and final measurable outcome.');
    } else if (words > 145) {
      redFlags.push('⚠️ Wordiness Warning: Over 145 words. May be difficult to handwrite within 4 minutes in actual SSB.');
    }

    const passedCount = checks.filter(c => c.passed).length;
    const score = Math.max(10, Math.round((passedCount / checks.length) * 100 - (redFlags.length * 8)));

    let scoreColor = 'var(--accent-success)';
    if (score < 60) scoreColor = 'var(--accent-danger)';
    else if (score < 80) scoreColor = 'var(--accent-warning)';

    this.evalResultsEl.style.display = 'block';
    this.evalResultsEl.innerHTML = `
      <div class="eval-score-banner">
        <div>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 1px;">
            SSB TAT Evaluation Scorecard
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
      prompt: this.currentPrompt ? this.currentPrompt.title : 'Custom',
      story: text
    });
    localStorage.setItem('ssb_tat_history', JSON.stringify(history.slice(0, 20)));
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
      // Audio context might be restricted before gesture
    }
  }
}

window.TATSimulator = TATSimulator;
