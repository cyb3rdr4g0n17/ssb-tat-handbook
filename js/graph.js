/* ==========================================================================
   Interactive Knowledge Graph & Logic Network Visualizer
   Canvas-based Force Simulation & Relationship Graph
   ========================================================================== */

class KnowledgeGraph {
  constructor(canvasId, inspectorId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.inspector = document.getElementById(inspectorId);

    this.nodes = [];
    this.links = [];
    this.transform = { x: 0, y: 0, k: 1 };
    this.isDragging = false;
    this.draggedNode = null;
    this.dragStart = { x: 0, y: 0 };
    this.hoveredNode = null;
    this.selectedNode = null;
    this.animationFrameId = null;

    // Filter states
    this.filterDomain = 'all';
    this.filterOLQ = 'all';

    if (this.canvas) {
      this.init();
    }
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.setupEventListeners();
    this.buildGraphData();
    this.startSimulation();
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    if (this.transform.x === 0 && this.transform.y === 0) {
      this.transform.x = this.canvas.width / 2;
      this.transform.y = this.canvas.height / 2;
    }
  }

  buildGraphData() {
    if (!window.SSB_DATA) return;

    this.nodes = [];
    this.links = [];

    // Central Root Node
    const rootNode = {
      id: 'root_tat',
      label: 'SSB TAT Logic',
      type: 'root',
      radius: 36,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      color: '#6366f1',
      details: {
        title: 'SSB Thematic Apperception Test (TAT)',
        desc: 'Core psychological projection engine based on the 7-Step Action Logic and authentic professional execution.',
        subtext: 'Observe -> Identify -> Plan -> Initiate -> Coordinate -> Execute -> Result'
      }
    };
    this.nodes.push(rootNode);

    // 16 OLQs Nodes
    const olqMap = new Map();
    const olqNames = [
      'initiative', 'sense of responsibility', 'practical intelligence',
      'cooperation', 'effective communication', 'organising ability',
      'problem solving', 'perseverance', 'determination', 'attention to detail',
      'integrity', 'courage', 'adaptability', 'social adaptability',
      'self-confidence', 'stamina'
    ];

    const olqRadius = 260;
    olqNames.forEach((olq, idx) => {
      const angle = (idx / olqNames.length) * Math.PI * 2;
      const olqNode = {
        id: 'olq_' + olq.replace(/\s+/g, '_'),
        label: olq.toUpperCase(),
        rawOLQ: olq,
        type: 'olq',
        radius: 20,
        x: Math.cos(angle) * olqRadius,
        y: Math.sin(angle) * olqRadius,
        vx: 0,
        vy: 0,
        color: '#06b6d4',
        details: {
          title: `OLQ: ${olq.toUpperCase()}`,
          desc: `Officer Like Quality naturally demonstrated through practical role responsibilities and calm execution.`,
          subtext: 'Factor Matrix Attribute'
        }
      };
      this.nodes.push(olqNode);
      olqMap.set(olq, olqNode);
      this.links.push({ source: rootNode, target: olqNode, strength: 0.1, length: 220, color: 'rgba(6, 182, 212, 0.25)' });
    });

    // 25 Domains
    const domainRadius = 460;
    window.SSB_DATA.domains.forEach((dom, idx) => {
      const angle = (idx / window.SSB_DATA.domains.length) * Math.PI * 2;
      const domNode = {
        id: 'dom_' + dom.id,
        label: `${dom.id}. ${dom.title}`,
        domainId: dom.id,
        type: 'domain',
        radius: 26,
        x: Math.cos(angle) * domainRadius,
        y: Math.sin(angle) * domainRadius,
        vx: 0,
        vy: 0,
        color: '#10b981',
        details: {
          title: `${dom.id}. ${dom.title}`,
          desc: dom.focus || 'Domain focus of professional actions and environments.',
          subtext: `${dom.professions.length} Professions in this domain`
        }
      };
      this.nodes.push(domNode);
      this.links.push({ source: rootNode, target: domNode, strength: 0.2, length: 360, color: 'rgba(16, 185, 129, 0.3)' });

      // Add representative professions per domain (sample 2-3 to keep graph clean & performant)
      const sampleProfs = dom.professions.slice(0, 2);
      sampleProfs.forEach((prof, pIdx) => {
        const offsetAngle = angle + ((pIdx - 0.5) * 0.12);
        const pDist = domainRadius + 140;
        const profNode = {
          id: 'prof_' + prof.id,
          label: prof.name,
          profData: prof,
          domainId: dom.id,
          type: 'profession',
          radius: 15,
          x: Math.cos(offsetAngle) * pDist,
          y: Math.sin(offsetAngle) * pDist,
          vx: 0,
          vy: 0,
          color: '#8b5cf6',
          details: {
            title: `${prof.id}. ${prof.name}`,
            desc: `Environment: ${prof.work_environment}`,
            subtext: `Action: ${prof.practical_action_sequence}`
          }
        };
        this.nodes.push(profNode);
        this.links.push({ source: domNode, target: profNode, strength: 0.3, length: 110, color: 'rgba(139, 92, 246, 0.35)' });

        // Connect to its OLQs
        prof.olqs.forEach(o => {
          const matchOlq = olqMap.get(o.toLowerCase());
          if (matchOlq) {
            this.links.push({
              source: profNode,
              target: matchOlq,
              strength: 0.05,
              length: 280,
              color: 'rgba(99, 102, 241, 0.15)'
            });
          }
        });
      });
    });
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', e => this.onMouseDown(e));
    window.addEventListener('mousemove', e => this.onMouseMove(e));
    window.addEventListener('mouseup', e => this.onMouseUp(e));
    this.canvas.addEventListener('wheel', e => this.onWheel(e), { passive: false });

    // Touch support
    this.canvas.addEventListener('touchstart', e => this.onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', e => this.onTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', e => this.onTouchEnd(e));
  }

  getCanvasPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const x = (clientX - rect.left - this.transform.x) / this.transform.k;
    const y = (clientY - rect.top - this.transform.y) / this.transform.k;
    return { x, y, clientX, clientY };
  }

  findNodeAt(pos) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const dx = pos.x - node.x;
      const dy = pos.y - node.y;
      if (dx * dx + dy * dy <= (node.radius + 6) * (node.radius + 6)) {
        return node;
      }
    }
    return null;
  }

  onMouseDown(e) {
    const pt = this.getCanvasPoint(e);
    const hit = this.findNodeAt(pt);

    if (hit) {
      this.draggedNode = hit;
      this.selectNode(hit);
    } else {
      this.isDragging = true;
      this.dragStart = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
    }
  }

  onMouseMove(e) {
    const pt = this.getCanvasPoint(e);

    if (this.draggedNode) {
      this.draggedNode.x = pt.x;
      this.draggedNode.y = pt.y;
      this.draggedNode.vx = 0;
      this.draggedNode.vy = 0;
    } else if (this.isDragging) {
      this.transform.x = e.clientX - this.dragStart.x;
      this.transform.y = e.clientY - this.dragStart.y;
    } else {
      const hit = this.findNodeAt(pt);
      if (hit !== this.hoveredNode) {
        this.hoveredNode = hit;
        this.canvas.style.cursor = hit ? 'pointer' : 'grab';
      }
    }
  }

  onMouseUp() {
    this.draggedNode = null;
    this.isDragging = false;
  }

  onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newK = Math.max(0.2, Math.min(3.5, this.transform.k * zoomFactor));

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    this.transform.x = mouseX - (mouseX - this.transform.x) * (newK / this.transform.k);
    this.transform.y = mouseY - (mouseY - this.transform.y) * (newK / this.transform.k);
    this.transform.k = newK;
  }

  onTouchStart(e) {
    if (e.touches.length === 1) {
      const pt = this.getCanvasPoint(e.touches[0]);
      const hit = this.findNodeAt(pt);
      if (hit) {
        this.draggedNode = hit;
        this.selectNode(hit);
      } else {
        this.isDragging = true;
        this.dragStart = { x: e.touches[0].clientX - this.transform.x, y: e.touches[0].clientY - this.transform.y };
      }
    }
  }

  onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      if (this.draggedNode) {
        const pt = this.getCanvasPoint(e.touches[0]);
        this.draggedNode.x = pt.x;
        this.draggedNode.y = pt.y;
      } else if (this.isDragging) {
        this.transform.x = e.touches[0].clientX - this.dragStart.x;
        this.transform.y = e.touches[0].clientY - this.dragStart.y;
      }
    }
  }

  onTouchEnd() {
    this.draggedNode = null;
    this.isDragging = false;
  }

  selectNode(node) {
    this.selectedNode = node;
    if (!this.inspector) return;

    if (!node) {
      this.inspector.style.display = 'none';
      return;
    }

    this.inspector.style.display = 'block';
    const typeLabel = node.type.toUpperCase();
    const typeColor = node.color;

    let extraHtml = '';
    if (node.type === 'profession' && node.profData) {
      const p = node.profData;
      extraHtml = `
        <div style="margin-top: 10px; font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
          <p><strong>Workflow:</strong> ${p.professional_workflow}</p>
          <div style="margin-top: 6px;">
            <strong style="color: var(--accent-secondary);">OLQs:</strong>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
              ${p.olqs.map(o => `<span class="prof-olq-tag">${o}</span>`).join('')}
            </div>
          </div>
          <button onclick="window.app.openProfessionModal(${p.id})" class="btn-primary" style="margin-top: 12px; width: 100%; justify-content: center; padding: 6px 12px; font-size: 0.8rem;">
            Full Profession Dossier
          </button>
        </div>
      `;
    } else if (node.type === 'domain') {
      extraHtml = `
        <button onclick="window.app.filterByDomain('${node.domainId}')" class="btn-primary" style="margin-top: 12px; width: 100%; justify-content: center; padding: 6px 12px; font-size: 0.8rem;">
          View All Professions in Domain
        </button>
      `;
    } else if (node.type === 'olq') {
      extraHtml = `
        <button onclick="window.app.filterByOLQ('${node.rawOLQ}')" class="btn-primary" style="margin-top: 12px; width: 100%; justify-content: center; padding: 6px 12px; font-size: 0.8rem;">
          Filter Explorer by this OLQ
        </button>
      `;
    }

    this.inspector.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <span style="font-size: 0.7rem; font-weight: 700; color: ${typeColor}; background: ${typeColor}22; padding: 2px 8px; border-radius: 4px;">
          ${typeLabel}
        </span>
        <button onclick="document.getElementById('${this.inspector.id}').style.display='none'" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.1rem;">&times;</button>
      </div>
      <h3 style="font-family: var(--font-display); font-size: 1.15rem; color: #f1f5f9; margin: 8px 0 4px 0;">${node.details.title}</h3>
      <p style="font-size: 0.85rem; color: #94a3b8; line-height: 1.4;">${node.details.desc}</p>
      ${node.details.subtext ? `<p style="font-size: 0.75rem; color: #64748b; margin-top: 6px; font-family: var(--font-mono);">${node.details.subtext}</p>` : ''}
      ${extraHtml}
    `;
  }

  filterGraph(domainId, olqTag) {
    this.filterDomain = domainId;
    this.filterOLQ = olqTag;
  }

  isNodeHighlighted(node) {
    if (this.selectedNode === node || this.hoveredNode === node) return true;
    if (this.filterDomain !== 'all') {
      if (node.type === 'domain' && node.domainId === this.filterDomain) return true;
      if (node.type === 'profession' && node.domainId === this.filterDomain) return true;
    }
    if (this.filterOLQ !== 'all') {
      if (node.type === 'olq' && node.rawOLQ.toLowerCase() === this.filterOLQ.toLowerCase()) return true;
      if (node.type === 'profession' && node.profData && node.profData.olqs.some(o => o.toLowerCase() === this.filterOLQ.toLowerCase())) return true;
    }
    return false;
  }

  startSimulation() {
    const loop = () => {
      this.updatePhysics();
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  updatePhysics() {
    // Basic force-directed relaxation
    const friction = 0.85;

    for (let i = 0; i < this.nodes.length; i++) {
      const n1 = this.nodes[i];
      if (n1 === this.draggedNode) continue;

      // Radial gravity towards origin
      const distFromCenter = Math.sqrt(n1.x * n1.x + n1.y * n1.y);
      if (distFromCenter > 20) {
        const gravityStrength = 0.0005;
        n1.vx -= n1.x * gravityStrength;
        n1.vy -= n1.y * gravityStrength;
      }

      // Repulsion between nodes
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n2 = this.nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = n1.radius + n2.radius + 35;

        if (dist < minDist) {
          const force = (minDist - dist) / dist * 0.2;
          const fx = dx * force;
          const fy = dy * force;
          if (n1 !== this.draggedNode) { n1.vx -= fx; n1.vy -= fy; }
          if (n2 !== this.draggedNode) { n2.vx += fx; n2.vy += fy; }
        }
      }

      n1.x += n1.vx;
      n1.y += n1.vy;
      n1.vx *= friction;
      n1.vy *= friction;
    }

    // Spring forces for links
    for (const link of this.links) {
      const dx = link.target.x - link.source.x;
      const dy = link.target.y - link.source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const diff = dist - link.length;
      const force = diff * link.strength * 0.05;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (link.source !== this.draggedNode && link.source.type !== 'root') {
        link.source.vx += fx;
        link.source.vy += fy;
      }
      if (link.target !== this.draggedNode) {
        link.target.vx -= fx;
        link.target.vy -= fy;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.transform.x, this.transform.y);
    ctx.scale(this.transform.k, this.transform.k);

    const hasActiveFilter = this.filterDomain !== 'all' || this.filterOLQ !== 'all' || this.selectedNode !== null;

    // Draw Links
    for (const link of this.links) {
      const isSrcHighlighted = this.isNodeHighlighted(link.source);
      const isTgtHighlighted = this.isNodeHighlighted(link.target);
      const isLinkActive = isSrcHighlighted && isTgtHighlighted;

      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);

      if (hasActiveFilter) {
        ctx.strokeStyle = isLinkActive ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = isLinkActive ? 2 : 0.6;
      } else {
        ctx.strokeStyle = link.color;
        ctx.lineWidth = 1;
      }
      ctx.stroke();
    }

    // Draw Nodes
    for (const node of this.nodes) {
      const isHigh = this.isNodeHighlighted(node);
      const alpha = hasActiveFilter && !isHigh ? 0.2 : 1.0;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Glow if highlighted
      if (isHigh) {
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 18;
      }

      // Outer circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Border ring
      ctx.strokeStyle = isHigh ? '#ffffff' : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = isHigh ? 2.5 : 1;
      ctx.stroke();

      // Inner icon or label
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(9, Math.round(node.radius * 0.45))}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text abbreviation inside circle
      let innerText = '';
      if (node.type === 'root') innerText = 'TAT';
      else if (node.type === 'domain') innerText = node.domainId;
      else if (node.type === 'olq') innerText = node.label.substring(0, 3);
      else if (node.type === 'profession') innerText = '•';

      ctx.fillText(innerText, node.x, node.y);

      // Label below node if zoom is adequate or node is prominent/hovered
      if (this.transform.k > 0.6 || node.type === 'domain' || isHigh) {
        ctx.font = `600 ${node.type === 'domain' ? 12 : 10}px Inter, sans-serif`;
        ctx.fillStyle = isHigh ? '#ffffff' : '#94a3b8';
        ctx.fillText(node.label, node.x, node.y + node.radius + 12);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  resetView() {
    this.transform = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      k: 1
    };
    this.selectedNode = null;
    if (this.inspector) this.inspector.style.display = 'none';
  }

  zoomIn() {
    this.transform.k = Math.min(3.5, this.transform.k * 1.25);
  }

  zoomOut() {
    this.transform.k = Math.max(0.2, this.transform.k * 0.8);
  }
}

window.KnowledgeGraph = KnowledgeGraph;
