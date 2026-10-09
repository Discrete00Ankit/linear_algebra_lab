/**
 * Linear Algebra Interactive Laboratory
 * Core Simulation Engine (Fixed Canvas Sizing, True Aspect Ratio, Pure JS)
 * Newton School of Technology — Batch of 2026-27
 */

// Theme Detection
function getThemeColors() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return {
    isLight,
    bg: isLight ? '#ffffff' : '#0f172a',
    grid: isLight ? 'rgba(203, 213, 225, 0.7)' : 'rgba(51, 65, 85, 0.45)',
    axis: isLight ? '#334155' : '#94a3b8',
    text: isLight ? '#0f172a' : '#f8fafc',
    textMuted: isLight ? '#64748b' : '#94a3b8',
    accent1: '#6366f1', // Indigo
    accent2: '#10b981', // Emerald
    accent3: '#f59e0b', // Amber
    accent4: '#ef4444', // Red
    accent5: '#06b6d4', // Cyan
    accent6: '#8b5cf6', // Purple
  };
}

/**
 * Rock-Solid Canvas Setup (Fixed Height, Retina DPR, Never Stretches)
 */
function setupCanvas(canvas, defaultHeight = 380) {
  if (!canvas) return null;
  const dpr = window.devicePixelRatio || 1;
  const container = canvas.parentElement;
  
  // Logical CSS width: read from container or canvas
  const width = (container && container.clientWidth > 0) ? container.clientWidth : 600;
  // Logical CSS height: strictly fixed so it NEVER mutates on input events!
  const height = defaultHeight;
  
  const targetPxW = Math.round(width * dpr);
  const targetPxH = Math.round(height * dpr);
  
  if (canvas.width !== targetPxW || canvas.height !== targetPxH) {
    canvas.width = targetPxW;
    canvas.height = targetPxH;
  }
  
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  
  const ctx = canvas.getContext('2d');
  // Reset transform to identity before scaling to prevent cumulative transforms
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  
  return { ctx, width, height, dpr };
}

/**
 * True-Aspect Ratio Cartesian Coordinate Grid (Equal Scaling in X and Y)
 */
function drawSquareGrid(ctx, width, height, yRange, theme) {
  ctx.clearRect(0, 0, width, height);
  
  const originX = width / 2;
  const originY = height / 2;
  // unitPx: pixels per mathematical unit
  const unitPx = (height * 0.85) / (2 * yRange);
  
  const toScreenX = (x) => originX + x * unitPx;
  const toScreenY = (y) => originY - y * unitPx;
  
  const xRange = (width / 2) / unitPx;
  
  // Grid Lines
  ctx.lineWidth = 1;
  ctx.strokeStyle = theme.grid;
  ctx.beginPath();
  
  for (let x = Math.ceil(-xRange); x <= Math.floor(xRange); x++) {
    const sx = toScreenX(x);
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, height);
  }
  for (let y = Math.ceil(-yRange); y <= Math.floor(yRange); y++) {
    const sy = toScreenY(y);
    ctx.moveTo(0, sy);
    ctx.lineTo(width, sy);
  }
  ctx.stroke();
  
  // Axes
  ctx.lineWidth = 2;
  ctx.strokeStyle = theme.axis;
  ctx.beginPath();
  // X axis
  ctx.moveTo(0, originY);
  ctx.lineTo(width, originY);
  // Y axis
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, height);
  ctx.stroke();
  
  // Ticks & Labels
  ctx.fillStyle = theme.textMuted;
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  for (let x = Math.ceil(-xRange); x <= Math.floor(xRange); x += 2) {
    if (x === 0) continue;
    const sx = toScreenX(x);
    if (sx >= 15 && sx <= width - 15) {
      ctx.fillText(x.toString(), sx, Math.min(originY + 6, height - 16));
    }
  }
  
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let y = Math.ceil(-yRange); y <= Math.floor(yRange); y += 2) {
    if (y === 0) continue;
    const sy = toScreenY(y);
    if (sy >= 15 && sy <= height - 15) {
      ctx.fillText(y.toString(), Math.max(originX - 6, 20), sy);
    }
  }
  
  return { toScreenX, toScreenY, originX, originY, unitPx, xRange, yRange };
}

// Arrow Vector Drawing
function drawVector(ctx, fromX, fromY, toX, toY, color, label = '', lineWidth = 3) {
  const headLength = 11;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return;
  const angle = Math.atan2(dy, dx);
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  
  if (label) {
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, toX + 6, toY - 6);
  }
  ctx.restore();
}

/* ==========================================================================
   SIMULATION 1: LINEARITY CURVE (Cell 10)
   sin(x) + sin(y) = c vs x + y = c
   ========================================================================== */
function initCurveSim() {
  const canvas = document.getElementById('curve-canvas');
  const slider = document.getElementById('curve-c-slider');
  const readout = document.getElementById('curve-c-val');
  const status = document.getElementById('curve-status');
  if (!canvas || !slider) return;

  function render() {
    const c = parseFloat(slider.value);
    if (readout) readout.textContent = c.toFixed(2);
    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 380);
    if (!inst) return;
    const { ctx, width, height } = inst;
    
    const grid = drawSquareGrid(ctx, width, height, 4.5, theme);
    const { toScreenX, toScreenY, xRange } = grid;
    
    // 1. Draw Linear Line: x + y = c => y = c - x
    ctx.strokeStyle = theme.accent1;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toScreenX(-xRange), toScreenY(c - (-xRange)));
    ctx.lineTo(toScreenX(xRange), toScreenY(c - xRange));
    ctx.stroke();
    
    // 2. Draw Non-Linear Equation: sin(x) + sin(y) = c => sin(y) = c - sin(x)
    ctx.strokeStyle = theme.accent4;
    ctx.lineWidth = 2.5;
    const step = 0.03;
    for (let k = -2; k <= 2; k++) {
      let drawing1 = false;
      ctx.beginPath();
      for (let x = -xRange; x <= xRange; x += step) {
        const val = c - Math.sin(x);
        if (Math.abs(val) <= 1) {
          const y = Math.asin(val) + 2 * Math.PI * k;
          const sx = toScreenX(x);
          const sy = toScreenY(y);
          if (!drawing1) { ctx.moveTo(sx, sy); drawing1 = true; }
          else { ctx.lineTo(sx, sy); }
        } else { drawing1 = false; }
      }
      ctx.stroke();

      let drawing2 = false;
      ctx.beginPath();
      for (let x = -xRange; x <= xRange; x += step) {
        const val = c - Math.sin(x);
        if (Math.abs(val) <= 1) {
          const y = Math.PI - Math.asin(val) + 2 * Math.PI * k;
          const sx = toScreenX(x);
          const sy = toScreenY(y);
          if (!drawing2) { ctx.moveTo(sx, sy); drawing2 = true; }
          else { ctx.lineTo(sx, sy); }
        } else { drawing2 = false; }
      }
      ctx.stroke();
    }
    
    // Clean, Non-Clipping Legend Badge in Top-Right
    const badgeW = 270;
    const badgeH = 50;
    const badgeX = Math.max(15, width - badgeW - 15);
    const badgeY = 15;
    ctx.fillStyle = theme.isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.fill();
    ctx.strokeStyle = theme.isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = theme.accent1;
    ctx.fillText(`● Linear: x + y = ${c.toFixed(2)} (Flat Line)`, badgeX + 14, badgeY + 20);
    ctx.fillStyle = theme.accent4;
    ctx.fillText(`● Non-Linear: sin(x) + sin(y) = ${c.toFixed(2)} (Rings)`, badgeX + 14, badgeY + 38);
    
    if (status) {
      status.innerHTML = `<span><strong>Parameter c = ${c.toFixed(2)}</strong>: Linear equations produce flat invariant straight lines ($m = -1$), whereas trigonometric equations generate curved periodic closed loops.</span>`;
    }
  }

  slider.addEventListener('input', render);
  window.addEventListener('resize', render);
  render();
}

/* ==========================================================================
   SIMULATION 2: 2D DUAL-VIEW LINE SOLVER (Cell 15)
   a1*x + b1*y = c1 and a2*x + b2*y = c2
   ========================================================================== */
function initLineSolverSim() {
  const canvas = document.getElementById('line-solver-canvas');
  const a1 = document.getElementById('l1-a');
  const b1 = document.getElementById('l1-b');
  const c1 = document.getElementById('l1-c');
  const a2 = document.getElementById('l2-a');
  const b2 = document.getElementById('l2-b');
  const c2 = document.getElementById('l2-c');
  const status = document.getElementById('line-solver-status');
  if (!canvas || !a1) return;

  function render() {
    const valA1 = parseFloat(a1.value) || 0;
    const valB1 = parseFloat(b1.value) || 0;
    const valC1 = parseFloat(c1.value) || 0;
    const valA2 = parseFloat(a2.value) || 0;
    const valB2 = parseFloat(b2.value) || 0;
    const valC2 = parseFloat(c2.value) || 0;

    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 380);
    if (!inst) return;
    const { ctx, width, height } = inst;
    
    const grid = drawSquareGrid(ctx, width, height, 5.5, theme);
    const { toScreenX, toScreenY, xRange, yRange } = grid;

    function plotLine(a, b, c, color) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (Math.abs(b) > 0.001) {
        ctx.moveTo(toScreenX(-xRange), toScreenY((c - a * (-xRange)) / b));
        ctx.lineTo(toScreenX(xRange), toScreenY((c - a * xRange) / b));
      } else if (Math.abs(a) > 0.001) {
        const x = c / a;
        ctx.moveTo(toScreenX(x), toScreenY(-yRange));
        ctx.lineTo(toScreenX(x), toScreenY(yRange));
      }
      ctx.stroke();
      ctx.restore();
    }

    plotLine(valA1, valB1, valC1, theme.accent1);
    plotLine(valA2, valB2, valC2, theme.accent2);

    const det = valA1 * valB2 - valA2 * valB1;
    let statusText = '';

    if (Math.abs(det) > 0.0001) {
      const xStar = (valC1 * valB2 - valC2 * valB1) / det;
      const yStar = (valA1 * valC2 - valA2 * valC1) / det;
      
      const sx = toScreenX(xStar);
      const sy = toScreenY(yStar);
      
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent4;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = theme.text;
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`Intersection: (${xStar.toFixed(2)}, ${yStar.toFixed(2)})`, sx + 10, sy - 10);

      statusText = `<span style="color:#10b981;">✓ <strong>Unique Intersection:</strong></span> Solution <strong>x* = [${xStar.toFixed(2)}, ${yStar.toFixed(2)}]ᵀ</strong> | Determinant det(A) = ${det.toFixed(2)} ≠ 0`;
    } else {
      const ratioA = valA2 !== 0 ? valA1 / valA2 : 0;
      const ratioC = valC2 !== 0 ? valC1 / valC2 : 0;
      const isCoincident = Math.abs(ratioA - ratioC) < 0.05 && (valC1 !== 0 || valC2 === 0);
      if (isCoincident) {
        statusText = `<span style="color:#f59e0b;">● <strong>Infinitely Many Solutions:</strong></span> det(A) = 0 and lines are coincident (identical line).`;
      } else {
        statusText = `<span style="color:#ef4444;">✗ <strong>No Solution (Inconsistent):</strong></span> det(A) = 0 and lines are strictly parallel and disjoint.`;
      }
    }
    if (status) status.innerHTML = statusText;
  }

  [a1, b1, c1, a2, b2, c2].forEach(el => el.addEventListener('input', render));
  window.addEventListener('resize', render);
  render();
}

/* ==========================================================================
   SIMULATION 3: 2D TRICHOTOMY CLASSIFIER (Cell 17)
   ========================================================================== */
function initTrichotomySim() {
  const canvas = document.getElementById('trichotomy-canvas');
  const btn1 = document.getElementById('tricho-case-1');
  const btn2 = document.getElementById('tricho-case-2');
  const btn3 = document.getElementById('tricho-case-3');
  const status = document.getElementById('trichotomy-status');
  if (!canvas) return;

  let currentCase = 1;

  function render() {
    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 380);
    if (!inst) return;
    const { ctx, width, height } = inst;
    
    const grid = drawSquareGrid(ctx, width, height, 5, theme);
    const { toScreenX, toScreenY, xRange } = grid;

    if (currentCase === 1) {
      // x + 2y = 3  => y = (3 - x)/2
      // 3x - y = 2  => y = 3x - 2
      ctx.strokeStyle = theme.accent1;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(toScreenX(-xRange), toScreenY((3 - (-xRange)) / 2));
      ctx.lineTo(toScreenX(xRange), toScreenY((3 - xRange) / 2));
      ctx.stroke();

      ctx.strokeStyle = theme.accent2;
      ctx.beginPath();
      ctx.moveTo(toScreenX(-xRange), toScreenY(3 * (-xRange) - 2));
      ctx.lineTo(toScreenX(xRange), toScreenY(3 * xRange - 2));
      ctx.stroke();

      // Intersection at (1, 1)
      const sx = toScreenX(1);
      const sy = toScreenY(1);
      ctx.fillStyle = theme.accent4;
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = theme.text;
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('(1.0, 1.0)', sx + 10, sy - 10);

      if (status) {
        status.innerHTML = `<span style="color: #10b981;">● <strong>Case 1: Unique Solution (Independent Lines)</strong></span> — Slopes differ (m₁ = -0.5, m₂ = 3.0). Exactly one unique intersection point exists at (1, 1). Matrix has rank 2.`;
      }
    } else if (currentCase === 2) {
      // Parallel: x + 2y = 4 and x + 2y = -2
      ctx.strokeStyle = theme.accent1;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(toScreenX(-xRange), toScreenY((4 - (-xRange)) / 2));
      ctx.lineTo(toScreenX(xRange), toScreenY((4 - xRange) / 2));
      ctx.stroke();

      ctx.strokeStyle = theme.accent4;
      ctx.beginPath();
      ctx.moveTo(toScreenX(-xRange), toScreenY((-2 - (-xRange)) / 2));
      ctx.lineTo(toScreenX(xRange), toScreenY((-2 - xRange) / 2));
      ctx.stroke();

      if (status) {
        status.innerHTML = `<span style="color: #ef4444;">● <strong>Case 2: No Solution (Parallel Inconsistent)</strong></span> — Slopes are identical (m₁ = m₂ = -0.5), but y-intercepts differ (b₁ = 2, b₂ = -1). The lines never meet. Solution set is empty ∅.`;
      }
    } else {
      // Coincident: x + 2y = 3 and 2x + 4y = 6
      ctx.strokeStyle = theme.accent1;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(toScreenX(-xRange), toScreenY((3 - (-xRange)) / 2));
      ctx.lineTo(toScreenX(xRange), toScreenY((3 - xRange) / 2));
      ctx.stroke();

      ctx.strokeStyle = theme.accent3;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(toScreenX(-xRange), toScreenY((3 - (-xRange)) / 2));
      ctx.lineTo(toScreenX(xRange), toScreenY((3 - xRange) / 2));
      ctx.stroke();
      ctx.setLineDash([]);

      if (status) {
        status.innerHTML = `<span style="color: #f59e0b;">● <strong>Case 3: Infinitely Many Solutions (Coincident Equations)</strong></span> — Both equations describe the exact same geometric line. Every single point on the line is a valid solution!`;
      }
    }
  }

  if (btn1) btn1.onclick = () => { currentCase = 1; updateButtons(); render(); };
  if (btn2) btn2.onclick = () => { currentCase = 2; updateButtons(); render(); };
  if (btn3) btn3.onclick = () => { currentCase = 3; updateButtons(); render(); };

  function updateButtons() {
    [btn1, btn2, btn3].forEach((b, idx) => {
      if (!b) return;
      if (idx + 1 === currentCase) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  updateButtons();
  render();
  window.addEventListener('resize', render);
}

/* ==========================================================================
   SIMULATION 4: 3D PLANES 6 SCENARIOS (Cell 21)
   ========================================================================== */
function init3DScenariosSim() {
  const container = document.getElementById('plotly-3d-scenarios');
  const selector = document.getElementById('scenario-3d-select');
  const info = document.getElementById('scenario-3d-info');
  if (!container || typeof Plotly === 'undefined') return;

  const scenarios = {
    "unique": {
      name: "1. Unique Solution (Planes Meet at Single Point)",
      planes: [
        { z: (x, y) => 3 - x - y, color: 'Blues', name: 'Plane 1: x + y + z = 3' },
        { z: (x, y) => (2 - x + y) / 2, color: 'Greens', name: 'Plane 2: x - y + 2z = 2' },
        { z: (x, y) => 2 * x + y - 2, color: 'YlOrRd', name: 'Plane 3: 2x + y - z = 2' }
      ],
      point: [1, 1, 1],
      desc: "All three planes intersect at exactly one point (1, 1, 1). Matrix has rank 3 and full column rank."
    },
    "line": {
      name: "2. Infinite Solutions (Planes Meet Along a Line — Open Book)",
      planes: [
        { z: (x, y) => 4 - x - y, color: 'Blues', name: 'Plane 1: x + y + z = 4' },
        { z: (x, y) => (6 - 2 * x - 2 * y) / 2, color: 'Greens', name: 'Plane 2: 2x + 2y + 2z = 6 (approx)' },
        { z: (x, y) => x, color: 'YlOrRd', name: 'Plane 3: x - z = 0' }
      ],
      point: null,
      desc: "The planes share a common line of intersection like pages meeting at the spine of an open book. 1 free variable."
    },
    "prism": {
      name: "3. No Solution: Triangular Prism (Tent Configuration)",
      planes: [
        { z: (x, y) => 2 - x, color: 'Blues', name: 'Plane 1: x + z = 2' },
        { z: (x, y) => -2 + x, color: 'Greens', name: 'Plane 2: x - z = 2' },
        { z: (x, y) => 2, color: 'YlOrRd', name: 'Plane 3: z = 2' }
      ],
      point: null,
      desc: "Planes pairwise intersect along 3 parallel lines, forming an open triangular tunnel. No single point is shared by all three planes!"
    },
    "two_parallel": {
      name: "4. No Solution: Two Parallel Planes Cut by Third",
      planes: [
        { z: (x, y) => 2 - x - y, color: 'Blues', name: 'Plane 1: x + y + z = 2' },
        { z: (x, y) => 5 - x - y, color: 'Greens', name: 'Plane 2: x + y + z = 5' },
        { z: (x, y) => x - y, color: 'YlOrRd', name: 'Plane 3: x - y - z = 0' }
      ],
      point: null,
      desc: "Plane 1 and Plane 2 never meet (strictly parallel). A third plane cuts them both, but no simultaneous triple intersection exists."
    },
    "three_parallel": {
      name: "5. No Solution: Three Parallel Disjoint Sheets",
      planes: [
        { z: (x, y) => -2 - x - y, color: 'Blues', name: 'Plane 1: x + y + z = -2' },
        { z: (x, y) => 1 - x - y, color: 'Greens', name: 'Plane 2: x + y + z = 1' },
        { z: (x, y) => 4 - x - y, color: 'YlOrRd', name: 'Plane 3: x + y + z = 4' }
      ],
      point: null,
      desc: "Three parallel leaves stacked like floors in a building. Zero solutions."
    },
    "coincident": {
      name: "6. Infinite Solutions: All 3 Planes are Coincident",
      planes: [
        { z: (x, y) => 3 - x - y, color: 'Blues', name: 'Plane 1: x + y + z = 3' },
        { z: (x, y) => (6 - 2 * x - 2 * y) / 2, color: 'Purples', name: 'Plane 2: 2x + 2y + 2z = 6' }
      ],
      point: null,
      desc: "All three equations represent the exact same 2D plane. The solution set is an entire 2-dimensional plane (2 free variables)."
    }
  };

  function renderPlot() {
    const key = selector ? selector.value : 'unique';
    const sc = scenarios[key] || scenarios.unique;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    
    const xVals = [], yVals = [];
    for (let i = -3; i <= 3; i += 0.5) { xVals.push(i); yVals.push(i); }
    
    const data = [];
    sc.planes.forEach(pl => {
      const zGrid = [];
      for (let yi = 0; yi < yVals.length; yi++) {
        const row = [];
        for (let xi = 0; xi < xVals.length; xi++) {
          row.push(typeof pl.z === 'function' ? pl.z(xVals[xi], yVals[yi]) : pl.z);
        }
        zGrid.push(row);
      }
      data.push({
        type: 'surface',
        x: xVals,
        y: yVals,
        z: zGrid,
        name: pl.name,
        showscale: false,
        opacity: 0.65,
        colorscale: pl.color
      });
    });

    if (sc.point) {
      data.push({
        type: 'scatter3d',
        mode: 'markers+text',
        x: [sc.point[0]],
        y: [sc.point[1]],
        z: [sc.point[2]],
        marker: { size: 9, color: '#ef4444' },
        text: [`Solution (${sc.point.join(', ')})`],
        textposition: 'top center',
        name: 'Intersection Point'
      });
    }

    const layout = {
      margin: { l: 0, r: 0, b: 0, t: 20 },
      paper_bgcolor: isLight ? '#ffffff' : '#0f172a',
      scene: {
        camera: { eye: { x: 1.5, y: -1.6, z: 1.2 } },
        xaxis: { title: 'X', color: isLight ? '#334155' : '#94a3b8' },
        yaxis: { title: 'Y', color: isLight ? '#334155' : '#94a3b8' },
        zaxis: { title: 'Z', color: isLight ? '#334155' : '#94a3b8' }
      }
    };

    Plotly.newPlot(container, data, layout, { responsive: true, displayModeBar: false });
    if (info) info.innerHTML = `<strong>${sc.name}</strong>: ${sc.desc}`;
  }

  if (selector) selector.addEventListener('change', renderPlot);
  renderPlot();
}

/* ==========================================================================
   SIMULATION 5: 3D CUSTOM SYSTEM SOLVER (Cell 24)
   ========================================================================== */
function init3DCustomSolverSim() {
  const container = document.getElementById('plotly-3d-custom');
  const btn = document.getElementById('solve-3d-btn');
  const status = document.getElementById('plotly-3d-custom-status');
  if (!container || typeof Plotly === 'undefined') return;

  function solveAndPlot() {
    const a1 = parseFloat(document.getElementById('p1-a')?.value || 1);
    const b1 = parseFloat(document.getElementById('p1-b')?.value || 1);
    const c1 = parseFloat(document.getElementById('p1-c')?.value || 1);
    const d1 = parseFloat(document.getElementById('p1-d')?.value || 3);

    const a2 = parseFloat(document.getElementById('p2-a')?.value || 1);
    const b2 = parseFloat(document.getElementById('p2-b')?.value || -1);
    const c2 = parseFloat(document.getElementById('p2-c')?.value || 2);
    const d2 = parseFloat(document.getElementById('p2-d')?.value || 2);

    const a3 = parseFloat(document.getElementById('p3-a')?.value || 2);
    const b3 = parseFloat(document.getElementById('p3-b')?.value || 1);
    const c3 = parseFloat(document.getElementById('p3-c')?.value || -1);
    const d3 = parseFloat(document.getElementById('p3-d')?.value || 2);

    const det = a1*(b2*c3 - b3*c2) - b1*(a2*c3 - a3*c2) + c1*(a2*b3 - a3*b2);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const xVals = [], yVals = [];
    for (let i = -3; i <= 3; i += 0.5) { xVals.push(i); yVals.push(i); }

    function makeZ(a, b, c, d) {
      const zGrid = [];
      for (let y of yVals) {
        const row = [];
        for (let x of xVals) {
          row.push(Math.abs(c) > 0.001 ? (d - a * x - b * y) / c : 0);
        }
        zGrid.push(row);
      }
      return zGrid;
    }

    const data = [
      { type: 'surface', x: xVals, y: yVals, z: makeZ(a1, b1, c1, d1), name: 'Plane 1', showscale: false, opacity: 0.65, colorscale: 'Blues' },
      { type: 'surface', x: xVals, y: yVals, z: makeZ(a2, b2, c2, d2), name: 'Plane 2', showscale: false, opacity: 0.65, colorscale: 'Greens' },
      { type: 'surface', x: xVals, y: yVals, z: makeZ(a3, b3, c3, d3), name: 'Plane 3', showscale: false, opacity: 0.65, colorscale: 'YlOrRd' }
    ];

    if (Math.abs(det) > 0.0001) {
      const detX = d1*(b2*c3 - b3*c2) - b1*(d2*c3 - d3*c2) + c1*(d2*b3 - d3*b2);
      const detY = a1*(d2*c3 - d3*c2) - d1*(a2*c3 - a3*c2) + c1*(a2*d3 - a3*d2);
      const detZ = a1*(b2*d3 - b3*d2) - b1*(a2*d3 - a3*d2) + d1*(a2*b3 - a3*b2);

      const xStar = detX / det;
      const yStar = detY / det;
      const zStar = detZ / det;

      data.push({
        type: 'scatter3d',
        mode: 'markers+text',
        x: [xStar], y: [yStar], z: [zStar],
        marker: { size: 9, color: '#ef4444' },
        text: [`Sol: [${xStar.toFixed(2)}, ${yStar.toFixed(2)}, ${zStar.toFixed(2)}]`],
        textposition: 'top center',
        name: 'Solution Point'
      });

      if (status) {
        status.innerHTML = `<span style="color: #10b981;">✓ <strong>Unique Solution Found:</strong></span> x* = <strong>[${xStar.toFixed(2)}, ${yStar.toFixed(2)}, ${zStar.toFixed(2)}]ᵀ</strong> | det(A) = ${det.toFixed(2)} ≠ 0`;
      }
    } else {
      if (status) {
        status.innerHTML = `<span style="color: #ef4444;">⚠ <strong>Singular System:</strong></span> det(A) = 0. No unique point intersection exists.`;
      }
    }

    const layout = {
      margin: { l: 0, r: 0, b: 0, t: 20 },
      paper_bgcolor: isLight ? '#ffffff' : '#0f172a',
      scene: {
        camera: { eye: { x: 1.5, y: -1.5, z: 1.2 } },
        xaxis: { title: 'X', color: isLight ? '#334155' : '#94a3b8' },
        yaxis: { title: 'Y', color: isLight ? '#334155' : '#94a3b8' },
        zaxis: { title: 'Z', color: isLight ? '#334155' : '#94a3b8' }
      }
    };

    Plotly.newPlot(container, data, layout, { responsive: true, displayModeBar: false });
  }

  if (btn) btn.addEventListener('click', solveAndPlot);
  solveAndPlot();
}

/* ==========================================================================
   SIMULATION 6: ROW PICTURE VS COLUMN PICTURE (Cell 28)
   System: x + 2y = 3, 4x + 5y = 6  => Solution: x = -1, y = 2
   ========================================================================== */
function initRowColumnSim() {
  const canvas = document.getElementById('row-column-canvas');
  const sliderX = document.getElementById('rc-x-slider');
  const sliderY = document.getElementById('rc-y-slider');
  const valXText = document.getElementById('rc-x-val');
  const valYText = document.getElementById('rc-y-val');
  const modePills = document.querySelectorAll('.rc-mode-btn');
  const status = document.getElementById('row-column-status');
  if (!canvas || !sliderX) return;

  let viewMode = 'both';

  function render() {
    const xVal = parseFloat(sliderX.value);
    const yVal = parseFloat(sliderY.value);
    if (valXText) valXText.textContent = xVal.toFixed(2);
    if (valYText) valYText.textContent = yVal.toFixed(2);

    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 380);
    if (!inst) return;
    const { ctx, width, height } = inst;
    
    if (viewMode === 'both') {
      const halfW = width / 2;
      
      // LEFT HALF: ROW PICTURE
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, halfW, height);
      ctx.clip();
      
      const rOriginX = halfW / 2;
      const rOriginY = height / 2;
      const rUnitPx = (height * 0.8) / 10;
      const rToX = (x) => rOriginX + x * rUnitPx;
      const rToY = (y) => rOriginY - y * rUnitPx;

      // Grid
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -6; x <= 6; x++) { ctx.moveTo(rToX(x), 0); ctx.lineTo(rToX(x), height); }
      for (let y = -6; y <= 6; y++) { ctx.moveTo(0, rToY(y)); ctx.lineTo(halfW, rToY(y)); }
      ctx.stroke();

      // Axes
      ctx.strokeStyle = theme.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, rOriginY); ctx.lineTo(halfW, rOriginY);
      ctx.moveTo(rOriginX, 0); ctx.lineTo(rOriginX, height);
      ctx.stroke();

      // Line 1: x + 2y = 3 => y = (3 - x)/2
      ctx.strokeStyle = theme.accent1;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rToX(-6), rToY((3 - (-6)) / 2));
      ctx.lineTo(rToX(6), rToY((3 - 6) / 2));
      ctx.stroke();

      // Line 2: 4x + 5y = 6 => y = (6 - 4x)/5
      ctx.strokeStyle = theme.accent2;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rToX(-6), rToY((6 - 4 * (-6)) / 5));
      ctx.lineTo(rToX(6), rToY((6 - 4 * 6) / 5));
      ctx.stroke();

      // Intersection (-1, 2)
      ctx.beginPath();
      ctx.arc(rToX(-1), rToY(2), 5, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent3;
      ctx.fill();

      // Probe Point (x, y)
      const px = rToX(xVal);
      const py = rToY(yVal);
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent4;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = theme.text;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(`Probe (${xVal.toFixed(1)}, ${yVal.toFixed(1)})`, px + 8, py - 8);

      ctx.fillStyle = theme.accent1;
      ctx.fillText('Row Picture: Lines Cross', 15, 20);
      ctx.restore();

      // RIGHT HALF: COLUMN PICTURE
      ctx.save();
      ctx.translate(halfW, 0);
      ctx.beginPath();
      ctx.rect(0, 0, halfW, height);
      ctx.clip();

      const cOriginX = halfW / 3;
      const cOriginY = height * 0.75;
      const cUnitPx = (height * 0.7) / 10;
      const cToX = (x) => cOriginX + x * cUnitPx;
      const cToY = (y) => cOriginY - y * cUnitPx;

      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -3; x <= 8; x++) { ctx.moveTo(cToX(x), 0); ctx.lineTo(cToX(x), height); }
      for (let y = -2; y <= 9; y++) { ctx.moveTo(0, cToY(y)); ctx.lineTo(halfW, cToY(y)); }
      ctx.stroke();

      ctx.strokeStyle = theme.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, cOriginY); ctx.lineTo(halfW, cOriginY);
      ctx.moveTo(cOriginX, 0); ctx.lineTo(cOriginX, height);
      ctx.stroke();

      // Target b [3, 6]
      drawVector(ctx, cOriginX, cOriginY, cToX(3), cToY(6), theme.accent4, 'Target b [3, 6]ᵀ', 3.5);

      // x * col1 [1, 4]
      const p1x = xVal * 1;
      const p1y = xVal * 4;
      drawVector(ctx, cOriginX, cOriginY, cToX(p1x), cToY(p1y), theme.accent1, 'x·col₁', 2.5);

      // + y * col2 [2, 5]
      const p2x = p1x + yVal * 2;
      const p2y = p1y + yVal * 5;
      drawVector(ctx, cToX(p1x), cToY(p1y), cToX(p2x), cToY(p2y), theme.accent2, '+ y·col₂', 2.5);

      // Result tip
      ctx.beginPath();
      ctx.arc(cToX(p2x), cToY(p2y), 5, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent3;
      ctx.fill();

      ctx.fillStyle = theme.accent2;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('Column Picture: Vector Sum', 15, 20);
      ctx.restore();

      // Divider
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(halfW, 0);
      ctx.lineTo(halfW, height);
      ctx.stroke();

    } else if (viewMode === 'row') {
      const grid = drawSquareGrid(ctx, width, height, 5, theme);
      const { toScreenX, toScreenY, xRange } = grid;

      ctx.strokeStyle = theme.accent1;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(toScreenX(-xRange), toScreenY((3 - (-xRange)) / 2));
      ctx.lineTo(toScreenX(xRange), toScreenY((3 - xRange) / 2));
      ctx.stroke();

      ctx.strokeStyle = theme.accent2;
      ctx.beginPath();
      ctx.moveTo(toScreenX(-xRange), toScreenY((6 - 4 * (-xRange)) / 5));
      ctx.lineTo(toScreenX(xRange), toScreenY((6 - 4 * xRange) / 5));
      ctx.stroke();

      const ix = toScreenX(-1);
      const iy = toScreenY(2);
      ctx.beginPath();
      ctx.arc(ix, iy, 7, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent4;
      ctx.fill();
      ctx.fillStyle = theme.text;
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('Exact Intersection: (-1.0, 2.0)', ix + 10, iy - 10);
    } else {
      const grid = drawSquareGrid(ctx, width, height, 5.5, theme);
      const { toScreenX, toScreenY, originX, originY } = grid;
      drawVector(ctx, originX, originY, toScreenX(3), toScreenY(6), theme.accent4, 'Target b [3, 6]ᵀ', 3.5);
      const p1x = xVal * 1;
      const p1y = xVal * 4;
      drawVector(ctx, originX, originY, toScreenX(p1x), toScreenY(p1y), theme.accent1, 'x·col₁', 2.5);
      const p2x = p1x + yVal * 2;
      const p2y = p1y + yVal * 5;
      drawVector(ctx, toScreenX(p1x), toScreenY(p1y), toScreenX(p2x), toScreenY(p2y), theme.accent2, '+ y·col₂', 2.5);
    }

    const dist = Math.sqrt(Math.pow(xVal - (-1), 2) + Math.pow(yVal - 2, 2));
    if (dist < 0.15) {
      if (status) status.innerHTML = `<span style="color: #10b981;">🎯 <strong>PERFECT SOLUTION MATCH!</strong> (x = -1.0, y = 2.0)</span> — In Row Picture, lines cross at (-1, 2). In Column Picture, (-1)[1, 4]ᵀ + (2)[2, 5]ᵀ reaches target [3, 6]ᵀ!`;
    } else {
      if (status) status.innerHTML = `<span>Weights: x = ${xVal.toFixed(2)}, y = ${yVal.toFixed(2)} | Distance to exact solution (-1, 2): <strong>${dist.toFixed(2)}</strong></span>`;
    }
  }

  modePills.forEach(btn => {
    btn.onclick = () => {
      modePills.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      viewMode = btn.dataset.mode;
      render();
    };
  });

  sliderX.addEventListener('input', render);
  sliderY.addEventListener('input', render);
  window.addEventListener('resize', render);
  render();
}

/* ==========================================================================
   SIMULATION 7: 2D COLUMN PICTURE COMBINATION EXPLORER (Cell 31)
   ========================================================================== */
function initColumnExplorerSim() {
  const canvas = document.getElementById('column-explorer-canvas');
  const a11 = document.getElementById('ce-a11');
  const a21 = document.getElementById('ce-a21');
  const a12 = document.getElementById('ce-a12');
  const a22 = document.getElementById('ce-a22');
  const b1 = document.getElementById('ce-b1');
  const b2 = document.getElementById('ce-b2');
  const x1Slider = document.getElementById('ce-x1');
  const x2Slider = document.getElementById('ce-x2');
  const x1Val = document.getElementById('ce-x1-val');
  const x2Val = document.getElementById('ce-x2-val');
  const solveBtn = document.getElementById('ce-solve-btn');
  const status = document.getElementById('ce-status');
  if (!canvas || !x1Slider) return;

  function render() {
    const col1 = [parseFloat(a11?.value || 1), parseFloat(a21?.value || -1)];
    const col2 = [parseFloat(a12?.value || 1), parseFloat(a22?.value || 1)];
    const targetB = [parseFloat(b1?.value || 2), parseFloat(b2?.value || 0)];
    const x1 = parseFloat(x1Slider.value);
    const x2 = parseFloat(x2Slider.value);

    if (x1Val) x1Val.textContent = x1.toFixed(2);
    if (x2Val) x2Val.textContent = x2.toFixed(2);

    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 380);
    if (!inst) return;
    const { ctx, width, height } = inst;
    const grid = drawSquareGrid(ctx, width, height, 4.5, theme);

    drawVector(ctx, grid.originX, grid.originY, grid.toScreenX(targetB[0]), grid.toScreenY(targetB[1]), theme.accent4, `Target b [${targetB[0]}, ${targetB[1]}]ᵀ`, 3.5);

    const v1x = x1 * col1[0];
    const v1y = x1 * col1[1];
    drawVector(ctx, grid.originX, grid.originY, grid.toScreenX(v1x), grid.toScreenY(v1y), theme.accent1, `x₁·v₁`, 2.5);

    const endX = v1x + x2 * col2[0];
    const endY = v1y + x2 * col2[1];
    drawVector(ctx, grid.toScreenX(v1x), grid.toScreenY(v1y), grid.toScreenX(endX), grid.toScreenY(endY), theme.accent2, `+ x₂·v₂`, 2.5);

    const dist = Math.sqrt(Math.pow(endX - targetB[0], 2) + Math.pow(endY - targetB[1], 2));
    if (dist < 0.1) {
      if (status) status.innerHTML = `<span style="color: #10b981;">🎯 <strong>TARGET REACHED!</strong></span> x₁ = ${x1.toFixed(2)}, x₂ = ${x2.toFixed(2)} exactly recreates target vector b!`;
    } else {
      if (status) status.innerHTML = `Current vector sum: [${endX.toFixed(2)}, ${endY.toFixed(2)}]ᵀ | Distance to Target: <strong>${dist.toFixed(2)}</strong>`;
    }
  }

  if (solveBtn) {
    solveBtn.onclick = () => {
      const col1 = [parseFloat(a11?.value || 1), parseFloat(a21?.value || -1)];
      const col2 = [parseFloat(a12?.value || 1), parseFloat(a22?.value || 1)];
      const targetB = [parseFloat(b1?.value || 2), parseFloat(b2?.value || 0)];
      const det = col1[0] * col2[1] - col1[1] * col2[0];
      if (Math.abs(det) > 0.0001) {
        x1Slider.value = (targetB[0] * col2[1] - targetB[1] * col2[0]) / det;
        x2Slider.value = (col1[0] * targetB[1] - col1[1] * targetB[0]) / det;
        render();
      }
    };
  }

  [a11, a21, a12, a22, b1, b2, x1Slider, x2Slider].forEach(el => el?.addEventListener('input', render));
  window.addEventListener('resize', render);
  render();
}

/* ==========================================================================
   SIMULATION 8: RGB LIGHT STUDIO (Cell 39)
   ========================================================================== */
function initRGBStudioSim() {
  const rSlider = document.getElementById('rgb-r');
  const gSlider = document.getElementById('rgb-g');
  const bSlider = document.getElementById('rgb-b');
  const rVal = document.getElementById('rgb-r-val');
  const gVal = document.getElementById('rgb-g-val');
  const bVal = document.getElementById('rgb-b-val');
  const swatchBox = document.getElementById('rgb-swatch-box');
  const hexCode = document.getElementById('rgb-hex-code');
  const eqDisplay = document.getElementById('rgb-equation-display');
  const canvas = document.getElementById('rgb-bar-canvas');
  if (!rSlider || !swatchBox) return;

  function render() {
    const r = parseFloat(rSlider.value);
    const g = parseFloat(gSlider.value);
    const b = parseFloat(bSlider.value);

    if (rVal) rVal.textContent = r.toFixed(2);
    if (gVal) gVal.textContent = g.toFixed(2);
    if (bVal) bVal.textContent = b.toFixed(2);

    const r255 = Math.round(r * 255);
    const g255 = Math.round(g * 255);
    const b255 = Math.round(b * 255);
    const hex = `#${r255.toString(16).padStart(2, '0')}${g255.toString(16).padStart(2, '0')}${b255.toString(16).padStart(2, '0')}`.toUpperCase();

    swatchBox.style.backgroundColor = hex;
    if (hexCode) hexCode.textContent = hex;

    if (eqDisplay) {
      eqDisplay.innerHTML = `
        <span style="color:#ef4444">${r.toFixed(2)}</span>·[1, 0, 0]ᵀ + 
        <span style="color:#10b981">${g.toFixed(2)}</span>·[0, 1, 0]ᵀ + 
        <span style="color:#3b82f6">${b.toFixed(2)}</span>·[0, 0, 1]ᵀ = 
        <strong>[${r.toFixed(2)}, ${g.toFixed(2)}, ${b.toFixed(2)}]ᵀ</strong>
      `;
    }

    if (canvas) {
      const theme = getThemeColors();
      const inst = setupCanvas(canvas, 200);
      if (!inst) return;
      const { ctx, width, height } = inst;
      ctx.clearRect(0, 0, width, height);

      const barW = width / 4;
      const colors = ['#ef4444', '#10b981', '#3b82f6'];
      const vals = [r, g, b];
      const labels = ['Red (e₁)', 'Green (e₂)', 'Blue (e₃)'];

      vals.forEach((v, idx) => {
        const x = (idx + 0.5) * barW;
        const barH = v * (height - 50);
        const y = height - 30 - barH;

        ctx.fillStyle = colors[idx];
        ctx.fillRect(x, y, barW * 0.7, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barW * 0.7, barH);

        ctx.fillStyle = theme.text;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[idx], x + barW * 0.35, height - 10);
        ctx.fillText(`${(v * 100).toFixed(0)}%`, x + barW * 0.35, y - 6);
      });
    }
  }

  [rSlider, gSlider, bSlider].forEach(s => s.addEventListener('input', render));
  window.addEventListener('resize', render);
  render();
}

/* ==========================================================================
   SIMULATION 9: ACOUSTIC WAVE SUPERPOSITION (Cell 41)
   ========================================================================== */
function initAudioMixerSim() {
  const bachSlider = document.getElementById('audio-bach-gain');
  const mlkSlider = document.getElementById('audio-mlk-gain');
  const bachVal = document.getElementById('audio-bach-val');
  const mlkVal = document.getElementById('audio-mlk-val');
  const playBtn = document.getElementById('audio-play-btn');
  const stopBtn = document.getElementById('audio-stop-btn');
  const canvas = document.getElementById('audio-waveform-canvas');
  const status = document.getElementById('audio-status-banner');
  if (!canvas || !bachSlider) return;

  let audioCtx = null;
  let bachAudio = null;
  let mlkAudio = null;
  let bachGainNode = null;
  let mlkGainNode = null;
  let isPlaying = false;
  let animId = null;

  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      bachAudio = new Audio('bach.mp3');
      bachAudio.crossOrigin = 'anonymous';
      bachAudio.loop = true;
      mlkAudio = new Audio('mlk.mp3');
      mlkAudio.crossOrigin = 'anonymous';
      mlkAudio.loop = true;

      const bachSource = audioCtx.createMediaElementSource(bachAudio);
      const mlkSource = audioCtx.createMediaElementSource(mlkAudio);
      bachGainNode = audioCtx.createGain();
      mlkGainNode = audioCtx.createGain();

      bachSource.connect(bachGainNode);
      mlkSource.connect(mlkGainNode);
      bachGainNode.connect(audioCtx.destination);
      mlkGainNode.connect(audioCtx.destination);
    } catch (e) {
      console.warn("AudioContext setup notice:", e);
    }
  }

  function updateGains() {
    const bGain = parseFloat(bachSlider.value);
    const mGain = parseFloat(mlkSlider.value);
    if (bachVal) bachVal.textContent = bGain.toFixed(2);
    if (mlkVal) mlkVal.textContent = mGain.toFixed(2);
    if (bachGainNode) bachGainNode.gain.value = bGain;
    if (mlkGainNode) mlkGainNode.gain.value = mGain;
    drawWaveform();
  }

  let timePhase = 0;
  function drawWaveform() {
    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 220);
    if (!inst) return;
    const { ctx, width, height } = inst;
    ctx.clearRect(0, 0, width, height);

    const bGain = parseFloat(bachSlider.value);
    const mGain = parseFloat(mlkSlider.value);

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = theme.accent1;
    ctx.beginPath();

    const midY = height / 2;
    const amp = height * 0.38;

    for (let x = 0; x < width; x++) {
      const t = (x / width) * 20 + timePhase;
      const sBach = Math.sin(t * 1.5) * 0.6 + Math.sin(t * 3.0) * 0.3 + Math.sin(t * 6.0) * 0.1;
      const sMLK = (Math.sin(t * 0.8) + Math.cos(t * 2.1) * 0.5 + Math.sin(t * 5.2) * 0.3) * (Math.sin(t * 0.2) > 0 ? 1 : 0.3);

      const composite = bGain * sBach + mGain * sMLK;
      const y = midY - composite * amp;

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = theme.text;
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(`Superposition Signal s(t) = ${bGain.toFixed(2)}·Bach(t) + ${mGain.toFixed(2)}·MLK(t)`, 15, 20);

    if (isPlaying) {
      timePhase += 0.08;
      animId = requestAnimationFrame(drawWaveform);
    }
  }

  if (playBtn) {
    playBtn.onclick = () => {
      initAudio();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      if (bachAudio) bachAudio.play().catch(() => {});
      if (mlkAudio) mlkAudio.play().catch(() => {});
      isPlaying = true;
      playBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'inline-flex';
      if (status) status.innerHTML = `<span style="color: #10b981;">▶ <strong>PLAYING LIVE MIX:</strong></span> Linear superposition of sound waves in action!`;
      drawWaveform();
    };
  }

  if (stopBtn) {
    stopBtn.onclick = () => {
      if (bachAudio) bachAudio.pause();
      if (mlkAudio) mlkAudio.pause();
      isPlaying = false;
      if (animId) cancelAnimationFrame(animId);
      stopBtn.style.display = 'none';
      if (playBtn) playBtn.style.display = 'inline-flex';
      if (status) status.innerHTML = `<span>Audio paused. Adjust volume weights α and β to inspect linearity.</span>`;
      drawWaveform();
    };
  }

  bachSlider.addEventListener('input', updateGains);
  mlkSlider.addEventListener('input', updateGains);
  window.addEventListener('resize', drawWaveform);
  drawWaveform();
}

/* ==========================================================================
   SIMULATION 10: MATRIX DIMENSION COMPATIBILITY (Cell 44)
   ========================================================================== */
function initMatrixDimensionsSim() {
  const mSlider = document.getElementById('dim-m');
  const k1Slider = document.getElementById('dim-k1');
  const k2Slider = document.getElementById('dim-k2');
  const nSlider = document.getElementById('dim-n');
  const mVal = document.getElementById('dim-m-val');
  const k1Val = document.getElementById('dim-k1-val');
  const k2Val = document.getElementById('dim-k2-val');
  const nVal = document.getElementById('dim-n-val');
  const aBox = document.getElementById('dim-a-box');
  const bBox = document.getElementById('dim-b-box');
  const cBox = document.getElementById('dim-c-box');
  const status = document.getElementById('dim-status-banner');
  if (!mSlider || !aBox) return;

  function createGrid(rows, cols, color) {
    let html = `<div style="display:grid; grid-template-rows:repeat(${rows}, 20px); grid-template-columns:repeat(${cols}, 20px); gap:3px; margin:8px auto; width:fit-content;">`;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        html += `<div style="background:${color}; border-radius:3px; border:1px solid rgba(255,255,255,0.2);"></div>`;
      }
    }
    html += `</div>`;
    return html;
  }

  function render() {
    const m = parseInt(mSlider.value);
    const k1 = parseInt(k1Slider.value);
    const k2 = parseInt(k2Slider.value);
    const n = parseInt(nSlider.value);

    if (mVal) mVal.textContent = m;
    if (k1Val) k1Val.textContent = k1;
    if (k2Val) k2Val.textContent = k2;
    if (nVal) nVal.textContent = n;

    if (aBox) aBox.innerHTML = `<strong>Matrix A (${m} × ${k1})</strong>` + createGrid(m, k1, '#6366f1');
    if (bBox) bBox.innerHTML = `<strong>Matrix B (${k2} × ${n})</strong>` + createGrid(k2, n, '#10b981');

    const isMatch = k1 === k2;
    if (isMatch) {
      if (cBox) cBox.innerHTML = `<strong>Result Matrix C (${m} × ${n})</strong>` + createGrid(m, n, '#f59e0b');
      if (status) {
        status.innerHTML = `<span style="color: #10b981;">✓ <strong>COMPATIBLE:</strong> Inner dimensions match (${k1} == ${k2}). Multiplication A(${m}×${k1}) · B(${k2}×${n}) = C(${m}×${n}) is well-defined!</span>`;
      }
    } else {
      if (cBox) cBox.innerHTML = `<div style="color:#ef4444; font-weight:bold; margin-top:20px;">Undefined (Dimension Mismatch)</div>`;
      if (status) {
        status.innerHTML = `<span style="color: #ef4444;">✗ <strong>INCOMPATIBLE:</strong> Inner dimensions do NOT match (${k1} ≠ ${k2})! Matrix multiplication requires columns of A to equal rows of B.</span>`;
      }
    }
  }

  [mSlider, k1Slider, k2Slider, nSlider].forEach(s => s.addEventListener('input', render));
  render();
}

/* ==========================================================================
   SIMULATION 11: CHAI KITCHEN RECIPE MIXER (Cell 49)
   ========================================================================== */
function initChaiKitchenSim() {
  const teaSlider = document.getElementById('chai-tea');
  const milkSlider = document.getElementById('chai-milk');
  const sugarSlider = document.getElementById('chai-sugar');
  const teaVal = document.getElementById('chai-tea-val');
  const milkVal = document.getElementById('chai-milk-val');
  const sugarVal = document.getElementById('chai-sugar-val');
  const flavorCanvas = document.getElementById('chai-flavor-canvas');
  const cupCanvas = document.getElementById('chai-cup-canvas');
  const readout = document.getElementById('chai-readout');
  if (!teaSlider || !flavorCanvas) return;

  function render() {
    const tea = parseFloat(teaSlider.value);
    const milk = parseFloat(milkSlider.value);
    const sugar = parseFloat(sugarSlider.value);

    if (teaVal) teaVal.textContent = tea.toFixed(1);
    if (milkVal) milkVal.textContent = milk.toFixed(1);
    if (sugarVal) sugarVal.textContent = sugar.toFixed(1);

    const boldness = 4.0 * tea + 0.1 * milk;
    const creaminess = 0.1 * tea + 3.5 * milk;
    const sweetness = 0.5 * milk + 4.0 * sugar;

    const theme = getThemeColors();

    const fInst = setupCanvas(flavorCanvas, 220);
    if (fInst) {
      const { ctx, width, height } = fInst;
      ctx.clearRect(0, 0, width, height);

      const labels = ['Boldness (Tea)', 'Creaminess (Milk)', 'Sweetness (Sugar)'];
      const vals = [boldness, creaminess, sweetness];
      const colors = ['#854d0e', '#fde047', '#ec4899'];
      const maxVal = 16;
      const barW = width / 4;

      vals.forEach((v, idx) => {
        const x = (idx + 0.5) * barW;
        const barH = (v / maxVal) * (height - 50);
        const y = height - 30 - barH;

        ctx.fillStyle = colors[idx];
        ctx.fillRect(x, y, barW * 0.7, barH);
        ctx.strokeRect(x, y, barW * 0.7, barH);

        ctx.fillStyle = theme.text;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[idx], x + barW * 0.35, height - 10);
        ctx.fillText(v.toFixed(1), x + barW * 0.35, y - 6);
      });
    }

    const cInst = setupCanvas(cupCanvas, 220);
    if (cInst) {
      const { ctx, width, height } = cInst;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 + 15;
      const cupW = 60;
      const cupH = 80;

      const milkRatio = creaminess / (boldness + creaminess + 0.1);
      const r = Math.round(139 + milkRatio * 80);
      const g = Math.round(69 + milkRatio * 110);
      const b = Math.round(19 + milkRatio * 120);
      const chaiColor = `rgb(${r}, ${g}, ${b})`;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - cupW, cy - cupH);
      ctx.lineTo(cx + cupW, cy - cupH);
      ctx.lineTo(cx + cupW * 0.7, cy + cupH);
      ctx.lineTo(cx - cupW * 0.7, cy + cupH);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = chaiColor;
      ctx.beginPath();
      ctx.moveTo(cx - cupW * 0.85, cy - cupH * 0.4);
      ctx.lineTo(cx + cupW * 0.85, cy - cupH * 0.4);
      ctx.lineTo(cx + cupW * 0.7, cy + cupH);
      ctx.lineTo(cx - cupW * 0.7, cy + cupH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = theme.text;
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Fresh Masala Chai', cx, cy + cupH + 18);
    }

    if (readout) {
      readout.innerHTML = `<strong>Flavor Vector b = Ax:</strong> [Boldness: ${boldness.toFixed(1)}, Creaminess: ${creaminess.toFixed(1)}, Sweetness: ${sweetness.toFixed(1)}]ᵀ`;
    }
  }

  [teaSlider, milkSlider, sugarSlider].forEach(s => s.addEventListener('input', render));
  window.addEventListener('resize', render);
  render();
}

/* ==========================================================================
   SIMULATION 12: DIGITAL IMAGE MATRIX TRANSFORMATIONS (Cell 52)
   ========================================================================== */
function initImageTransformSim() {
  const canvas = document.getElementById('img-transform-canvas');
  const selector = document.getElementById('img-op-select');
  const status = document.getElementById('img-transform-status');
  if (!canvas || !selector) return;

  const F_orig = [
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [1, 0, 0, 0]
  ];

  const I4 = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
  const U4 = [[0,1,0,0],[0,0,1,0],[0,0,0,1],[0,0,0,0]];
  const D4 = [[0,0,0,0],[1,0,0,0],[0,1,0,0],[0,0,1,0]];
  const Flip = [[0,0,0,1],[0,0,1,0],[0,1,0,0],[1,0,0,0]];

  function matMul4(A, B) {
    const res = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) res[i][j] += A[i][k] * B[k][j];
      }
    }
    return res;
  }

  function render() {
    let M = I4;
    let label = "Identity Matrix I: Leaves rows untouched.";
    const op = selector.value;
    if (op === 'up') { M = U4; label = "Shift Up U: Row 1 <- Row 2, Row 2 <- Row 3, bottom filled with 0s."; }
    else if (op === 'down') { M = D4; label = "Shift Down D: Pushes rows down; top filled with 0s."; }
    else if (op === 'flip') { M = Flip; label = "Flip Vertical F: Reverses row order (Row 1 <-> Row 4)."; }
    else if (op === 'up2') { M = matMul4(U4, U4); label = "Shift Up 2 U²: Shifts rows up by 2 positions."; }

    const transformed = matMul4(M, F_orig);
    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 240);
    if (!inst) return;
    const { ctx, width, height } = inst;
    ctx.clearRect(0, 0, width, height);

    const cellSize = 28;
    const startY = (height - 4 * cellSize) / 2 + 10;

    function drawGrid(grid, startX, title, highlightColor) {
      ctx.fillStyle = theme.text;
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, startX + 2 * cellSize, startY - 12);

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const x = startX + c * cellSize;
          const y = startY + r * cellSize;
          ctx.fillStyle = grid[r][c] > 0 ? highlightColor : (theme.isLight ? '#f1f5f9' : '#1e293b');
          ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
          ctx.strokeStyle = theme.grid;
          ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);

          ctx.fillStyle = grid[r][c] > 0 ? '#fff' : theme.textMuted;
          ctx.font = '10px Inter, sans-serif';
          ctx.fillText(grid[r][c].toString(), x + cellSize / 2, y + cellSize / 2 + 4);
        }
      }
    }

    const gap = (width - 3 * (4 * cellSize)) / 4;
    drawGrid(F_orig, Math.max(10, gap), "Original Image X", theme.accent1);
    drawGrid(M, Math.max(10, gap * 2 + 4 * cellSize), "Transform Matrix M", theme.accent3);
    drawGrid(transformed, Math.max(10, gap * 3 + 8 * cellSize), "Result M·X", theme.accent2);

    if (status) status.innerHTML = `<strong>${label}</strong>`;
  }

  selector.addEventListener('change', render);
  window.addEventListener('resize', render);
  render();
}

/* ==========================================================================
   SIMULATION 13: CANTEEN MENU MATRIX MULTIPLICATION (Cell 54)
   ========================================================================== */
function initCanteenMenuSim() {
  const canvas = document.getElementById('canteen-canvas');
  const d1Rice = document.getElementById('canteen-d1-rice');
  const d2Paneer = document.getElementById('canteen-d2-paneer');
  const d3Paneer = document.getElementById('canteen-d3-paneer');
  const d1Val = document.getElementById('canteen-d1-val');
  const d2Val = document.getElementById('canteen-d2-val');
  const d3Val = document.getElementById('canteen-d3-val');
  const modePills = document.querySelectorAll('.canteen-view-btn');
  const status = document.getElementById('canteen-status');
  if (!canvas || !d1Rice) return;

  let viewMode = 'column';

  // Matrix A: Properties × Ingredients
  // Rows: Cost(₹), Calories(kcal), Protein(g)
  // Cols: Rice, Paneer, Veggies
  const A = [
    [20.0, 60.0, 30.0],
    [200.0, 250.0, 80.0],
    [4.0, 18.0, 3.0]
  ];

  function render() {
    const r1 = parseFloat(d1Rice.value);
    const p2 = parseFloat(d2Paneer.value);
    const p3 = parseFloat(d3Paneer.value);

    if (d1Val) d1Val.textContent = r1.toFixed(1);
    if (d2Val) d2Val.textContent = p2.toFixed(1);
    if (d3Val) d3Val.textContent = p3.toFixed(1);

    // Update Matrix B in DOM
    const matBr1 = document.getElementById('mat-b-r1');
    const matBp2 = document.getElementById('mat-b-p2');
    const matBp3 = document.getElementById('mat-b-p3');
    if (matBr1) matBr1.textContent = r1.toFixed(1);
    if (matBp2) matBp2.textContent = p2.toFixed(1);
    if (matBp3) matBp3.textContent = p3.toFixed(1);

    // Matrix B: Ingredients × Dishes
    // Col 0 (Khichdi): [r1, 0, 1]
    // Col 1 (Thali): [1, p2, 1]
    // Col 2 (Paneer Tikka): [0, p3, 1]
    const B = [
      [r1, 1.0, 0.0],
      [0.0, p2, p3],
      [1.0, 1.0, 1.0]
    ];

    // Compute C = A × B
    const C = [[0,0,0],[0,0,0],[0,0,0]];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j];
      }
    }

    // Update Matrix C in DOM
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const el = document.getElementById(`mat-c-${i}${j}`);
        if (el) el.textContent = C[i][j].toFixed(0);
      }
    }

    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 320);
    if (!inst) return;
    const { ctx, width, height } = inst;
    ctx.clearRect(0, 0, width, height);

    const dishes = [
      { name: 'Dish 1 (Khichdi)', icon: '🍲', color: '#6366f1' },
      { name: 'Dish 2 (Thali)', icon: '🍛', color: '#10b981' },
      { name: 'Dish 3 (Paneer Tikka)', icon: '🍢', color: '#f59e0b' }
    ];

    if (viewMode === 'column') {
      // COLUMN PERSPECTIVE: 3 Finished Dishes
      const colW = width / 3;
      dishes.forEach((dish, j) => {
        const cx = j * colW + colW / 2;
        const leftX = j * colW + 14;
        const cardW = colW - 28;

        // Dish Card Background
        ctx.fillStyle = theme.isLight ? '#f8fafc' : '#111827';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(leftX, 15, cardW, height - 30, 10);
        else ctx.rect(leftX, 15, cardW, height - 30);
        ctx.fill();
        ctx.strokeStyle = dish.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Icon & Header
        ctx.textAlign = 'center';
        ctx.font = '22px Inter, sans-serif';
        ctx.fillText(dish.icon, cx, 44);

        ctx.font = 'bold 13px Outfit, sans-serif';
        ctx.fillStyle = theme.text;
        ctx.fillText(dish.name, cx, 66);

        // Price Badge
        const cost = C[0][j];
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 15px Outfit, sans-serif';
        ctx.fillText(`₹${cost.toFixed(0)}`, cx, 90);

        // Nutrition Meters
        const cal = C[1][j];
        const prot = C[2][j];

        // Calorie Gauge
        const gaugeY1 = 120;
        ctx.textAlign = 'left';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = theme.textMuted;
        ctx.fillText(`Energy: ${cal.toFixed(0)} kcal`, leftX + 16, gaugeY1);
        ctx.fillStyle = theme.isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)';
        ctx.fillRect(leftX + 16, gaugeY1 + 6, cardW - 32, 8);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(leftX + 16, gaugeY1 + 6, Math.min(cardW - 32, ((cardW - 32) * cal) / 750), 8);

        // Protein Gauge
        const gaugeY2 = 160;
        ctx.fillStyle = theme.textMuted;
        ctx.fillText(`Protein: ${prot.toFixed(1)}g`, leftX + 16, gaugeY2);
        ctx.fillStyle = theme.isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)';
        ctx.fillRect(leftX + 16, gaugeY2 + 6, cardW - 32, 8);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(leftX + 16, gaugeY2 + 6, Math.min(cardW - 32, ((cardW - 32) * prot) / 50), 8);

        // Column Linear Combination Tag
        ctx.textAlign = 'center';
        ctx.font = '10px Fira Code, monospace';
        ctx.fillStyle = theme.textMuted;
        ctx.fillText(`col_${j+1}(C) = A · col_${j+1}(B)`, cx, height - 52);
        
        ctx.font = 'bold 11px Fira Code, monospace';
        ctx.fillStyle = dish.color;
        const bCol = [B[0][j], B[1][j], B[2][j]];
        ctx.fillText(`[${bCol[0].toFixed(1)}a₁ + ${bCol[1].toFixed(1)}a₂ + ${bCol[2].toFixed(1)}a₃]`, cx, height - 34);
      });

      if (status) {
        status.innerHTML = `<strong>Column Perspective:</strong> Modifying a slider changes ONLY that dish's column! Column <em>j</em> of the product is purely a linear combination of the ingredient columns of A weighted by column <em>j</em> of B.`;
      }
    } else {
      // ROW PERSPECTIVE: 3 Nutritional Properties Across Entire Menu
      const props = [
        { label: 'Total Cost Across Menu', unit: '₹', color: '#6366f1', idx: 0 },
        { label: 'Energy Across Menu', unit: 'kcal', color: '#10b981', idx: 1 },
        { label: 'Protein Across Menu', unit: 'g', color: '#f59e0b', idx: 2 }
      ];

      const rowH = (height - 30) / 3;
      props.forEach((prop, i) => {
        const topY = 15 + i * rowH;
        ctx.fillStyle = theme.isLight ? '#f8fafc' : '#111827';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(14, topY, width - 28, rowH - 10, 8);
        else ctx.rect(14, topY, width - 28, rowH - 10);
        ctx.fill();
        ctx.strokeStyle = prop.color;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = 'bold 13px Outfit, sans-serif';
        ctx.fillStyle = prop.color;
        ctx.fillText(`Row ${i+1}: ${prop.label}`, 30, topY + 28);

        // Values for D1, D2, D3
        dishes.forEach((d, j) => {
          const val = C[i][j];
          const valX = width * 0.42 + j * (width * 0.18);
          ctx.font = '11px Inter, sans-serif';
          ctx.fillStyle = theme.textMuted;
          ctx.fillText(`Dish ${j+1}:`, valX, topY + 22);

          ctx.font = 'bold 14px Fira Code, monospace';
          ctx.fillStyle = theme.text;
          ctx.fillText(`${val.toFixed(0)} ${prop.unit}`, valX, topY + 44);
        });
      });

      if (status) {
        status.innerHTML = `<strong>Row Perspective:</strong> Row <em>i</em> of the product matrix evaluates property <em>i</em> across all dishes on the menu simultaneously: <code>row_i(C) = row_i(A) · B</code>.`;
      }
    }
  }

  modePills.forEach(pill => {
    pill.addEventListener('click', () => {
      modePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      viewMode = pill.dataset.view;
      render();
    });
  });

  d1Rice.addEventListener('input', render);
  d2Paneer.addEventListener('input', render);
  d3Paneer.addEventListener('input', render);
  window.addEventListener('resize', render);
  render();
}

/* =/* ==========================================================================
   SIMULATION 14: LIGHT MATRIX BLENDING (Cell 56)
   ========================================================================== */
function initLightBlendingSim() {
  const s2Amber = document.getElementById('light-s2-amber');
  const s2Cyan = document.getElementById('light-s2-cyan');
  const canvas = document.getElementById('light-swatch-canvas');
  const status = document.getElementById('light-status');
  if (!canvas || !s2Amber) return;

  const C_base = [[1.0, 0.0], [0.5, 1.0], [0.0, 1.0]];

  function render() {
    const amb = parseFloat(s2Amber.value);
    const cyn = parseFloat(s2Cyan.value);

    const D = [[1.0, amb, 0.2], [0.0, cyn, 0.8]];
    const CD = [[0,0,0],[0,0,0],[0,0,0]];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 2; k++) CD[i][j] += C_base[i][k] * D[k][j];
      }
    }

    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 220);
    if (!inst) return;
    const { ctx, width, height } = inst;
    ctx.clearRect(0, 0, width, height);

    const boxW = Math.min(140, width / 4);
    const boxH = 110;
    const titles = ['Swatch 1: Amber', 'Swatch 2: Blended', 'Swatch 3: Cyan'];

    for (let col = 0; col < 3; col++) {
      const r = Math.min(1.0, Math.max(0, CD[0][col]));
      const g = Math.min(1.0, Math.max(0, CD[1][col]));
      const b = Math.min(1.0, Math.max(0, CD[2][col]));

      const hex = `rgb(${Math.round(r*255)}, ${Math.round(g*255)}, ${Math.round(b*255)})`;
      const x = 30 + col * (boxW + 30);
      const y = 30;

      ctx.fillStyle = hex;
      ctx.fillRect(x, y, boxW, boxH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, boxW, boxH);

      ctx.fillStyle = theme.text;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(titles[col], x + boxW / 2, y + boxH + 20);
      ctx.fillText(`[${r.toFixed(2)}, ${g.toFixed(2)}, ${b.toFixed(2)}]ᵀ`, x + boxW / 2, y + boxH + 36);
    }

    if (status) status.innerHTML = `Swatch 2 blended with Amber = ${amb.toFixed(1)}, Cyan = ${cyn.toFixed(1)}.`;
  }

  s2Amber.addEventListener('input', render);
  s2Cyan.addEventListener('input', render);
  window.addEventListener('resize', render);
  render();
}

/* ==========================================================================
   SIMULATION 15: 8x8 MATRIX PIXEL SHIFTER (Cell 58)
   ========================================================================== */
function initPixelShifterSim() {
  const upSlider = document.getElementById('pixel-shift-up');
  const leftSlider = document.getElementById('pixel-shift-left');
  const canvas = document.getElementById('pixel-shifter-canvas');
  const status = document.getElementById('pixel-status');
  if (!canvas || !upSlider) return;

  function render() {
    const kUp = parseInt(upSlider.value);
    const kLeft = parseInt(leftSlider.value);

    const X = Array(8).fill(0).map(() => Array(8).fill(0));
    for (let r = 2; r < 6; r++) {
      for (let c = 2; c < 6; c++) X[r][c] = 1;
    }

    const shiftedRow = Array(8).fill(0).map(() => Array(8).fill(0));
    for (let r = 0; r < 8 - kUp; r++) {
      for (let c = 0; c < 8; c++) shiftedRow[r][c] = X[r + kUp][c];
    }

    const result = Array(8).fill(0).map(() => Array(8).fill(0));
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8 - kLeft; c++) result[r][c] = shiftedRow[r][c + kLeft];
    }

    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 260);
    if (!inst) return;
    const { ctx, width, height } = inst;
    ctx.clearRect(0, 0, width, height);

    const cellSize = 26;
    const startX = (width - 8 * cellSize) / 2;
    const startY = (height - 8 * cellSize) / 2;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;
        ctx.fillStyle = result[r][c] === 1 ? theme.accent1 : (theme.isLight ? '#f1f5f9' : '#1e293b');
        ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
        ctx.strokeStyle = theme.grid;
        ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);
      }
    }

    if (status) status.innerHTML = `Shifted Up by ${kUp} rows (P_${kUp}), Shifted Left by ${kLeft} columns (Q_${kLeft}). Result: P·X·Q`;
  }

  upSlider.addEventListener('input', render);
  leftSlider.addEventListener('input', render);
  window.addEventListener('resize', render);
  render();
}

/* ==========================================================================
   SIMULATION 16: 2D VECTOR CANVAS (Cell 68)
   ========================================================================== */
function initVector2DSim() {
  const canvas = document.getElementById('vector2d-canvas');
  const xSlider = document.getElementById('v2d-x');
  const ySlider = document.getElementById('v2d-y');
  const txSlider = document.getElementById('v2d-tx');
  const tySlider = document.getElementById('v2d-ty');
  const info = document.getElementById('vector2d-info');
  if (!canvas || !xSlider) return;

  function render() {
    const dx = parseFloat(xSlider.value);
    const dy = parseFloat(ySlider.value);
    const tx = parseFloat(txSlider?.value || 0);
    const ty = parseFloat(tySlider?.value || 0);

    const mag = Math.sqrt(dx * dx + dy * dy);
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180 / Math.PI + 360) % 360;

    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 380);
    if (!inst) return;
    const { ctx, width, height } = inst;
    const grid = drawSquareGrid(ctx, width, height, 5.5, theme);

    const startX = grid.toScreenX(tx);
    const startY = grid.toScreenY(ty);
    const endX = grid.toScreenX(tx + dx);
    const endY = grid.toScreenY(ty + dy);

    ctx.strokeStyle = theme.textMuted;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    drawVector(ctx, startX, startY, endX, endY, theme.accent1, `v [${dx}, ${dy}]ᵀ`, 3.5);

    ctx.strokeStyle = theme.accent3;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(startX, startY, 25, 0, -angleRad, angleRad < 0);
    ctx.stroke();

    if (info) {
      info.innerHTML = `
        <strong>Vector Properties:</strong> 
        Magnitude ||v|| = <strong>${mag.toFixed(2)}</strong> | 
        Angle θ = <strong>${angleDeg.toFixed(1)}°</strong> | 
        Unit Vector v̂ = <strong>[${(dx / (mag || 1)).toFixed(2)}, ${(dy / (mag || 1)).toFixed(2)}]ᵀ</strong>
      `;
    }
  }

  [xSlider, ySlider, txSlider, tySlider].forEach(s => s?.addEventListener('input', render));
  window.addEventListener('resize', render);
  render();
}

/* ==========================================================================
   SIMULATION 17: VECTOR ADDITION (Cell 70)
   ========================================================================== */
function initVectorAddSim() {
  const canvas = document.getElementById('vector-add-canvas');
  const uxSlider = document.getElementById('vadd-ux');
  const uySlider = document.getElementById('vadd-uy');
  const vxSlider = document.getElementById('vadd-vx');
  const vySlider = document.getElementById('vadd-vy');
  const cSlider = document.getElementById('vadd-c');
  const toggleBtns = document.querySelectorAll('.vadd-toggle-btn');
  const status = document.getElementById('vector-add-status');
  if (!canvas || !uxSlider) return;

  let method = 'head-to-tail';

  function render() {
    const ux = parseFloat(uxSlider.value);
    const uy = parseFloat(uySlider.value);
    const vx = parseFloat(vxSlider.value) * parseFloat(cSlider.value);
    const vy = parseFloat(vySlider.value) * parseFloat(cSlider.value);
    const rx = ux + vx;
    const ry = uy + vy;

    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 380);
    if (!inst) return;
    const { ctx, width, height } = inst;
    const grid = drawSquareGrid(ctx, width, height, 5.5, theme);

    if (method === 'head-to-tail') {
      drawVector(ctx, grid.originX, grid.originY, grid.toScreenX(ux), grid.toScreenY(uy), theme.accent1, 'u', 3);
      drawVector(ctx, grid.toScreenX(ux), grid.toScreenY(uy), grid.toScreenX(rx), grid.toScreenY(ry), theme.accent2, 'c·v', 3);
      drawVector(ctx, grid.originX, grid.originY, grid.toScreenX(rx), grid.toScreenY(ry), theme.accent3, 'u + c·v', 3.5);
    } else {
      drawVector(ctx, grid.originX, grid.originY, grid.toScreenX(ux), grid.toScreenY(uy), theme.accent1, 'u', 3);
      drawVector(ctx, grid.originX, grid.originY, grid.toScreenX(vx), grid.toScreenY(vy), theme.accent2, 'c·v', 3);
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(grid.toScreenX(ux), grid.toScreenY(uy));
      ctx.lineTo(grid.toScreenX(rx), grid.toScreenY(ry));
      ctx.lineTo(grid.toScreenX(vx), grid.toScreenY(vy));
      ctx.stroke();
      ctx.setLineDash([]);
      drawVector(ctx, grid.originX, grid.originY, grid.toScreenX(rx), grid.toScreenY(ry), theme.accent3, 'Resultant', 3.5);
    }

    if (status) {
      status.innerHTML = `<strong>Resultant:</strong> [${rx.toFixed(1)}, ${ry.toFixed(1)}]ᵀ | Method: ${method === 'head-to-tail' ? 'Head-to-Tail Rule' : 'Parallelogram Law'}`;
    }
  }

  toggleBtns.forEach(btn => {
    btn.onclick = () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      method = btn.dataset.method;
      render();
    };
  });

  [uxSlider, uySlider, vxSlider, vySlider, cSlider].forEach(s => s.addEventListener('input', render));
  window.addEventListener('resize', render);
  render();
}

/* ==========================================================================
   SIMULATION 18: VECTOR SPACE AXIOM TESTER (Cell 72)
   ========================================================================== */
function initAxiomTesterSim() {
  const sel = document.getElementById('axiom-select');
  const vx = document.getElementById('axiom-vx');
  const vy = document.getElementById('axiom-vy');
  const wx = document.getElementById('axiom-wx');
  const wy = document.getElementById('axiom-wy');
  const c = document.getElementById('axiom-c');
  const d = document.getElementById('axiom-d');
  const card = document.getElementById('axiom-status-card');
  if (!sel || !vx) return;

  function render() {
    const v = [parseFloat(vx.value), parseFloat(vy.value)];
    const w = [parseFloat(wx.value), parseFloat(wy.value)];
    const cVal = parseFloat(c.value);
    const dVal = parseFloat(d.value);
    const type = sel.value;

    let lhs = [0, 0], rhs = [0, 0];
    let title = "", formulaL = "", formulaR = "";

    if (type === 'comm') {
      title = "Commutativity of Vector Addition";
      formulaL = "v + w"; formulaR = "w + v";
      lhs = [v[0] + w[0], v[1] + w[1]];
      rhs = [w[0] + v[0], w[1] + v[1]];
    } else if (type === 'dist_vec') {
      title = "Vector Distributivity: c(v + w) == cv + cw";
      formulaL = "c(v + w)"; formulaR = "c·v + c·w";
      lhs = [cVal * (v[0] + w[0]), cVal * (v[1] + w[1])];
      rhs = [cVal * v[0] + cVal * w[0], cVal * v[1] + cVal * w[1]];
    } else if (type === 'dist_scal') {
      title = "Scalar Distributivity: (c + d)v == cv + dv";
      formulaL = "(c + d)v"; formulaR = "c·v + d·v";
      lhs = [(cVal + dVal) * v[0], (cVal + dVal) * v[1]];
      rhs = [cVal * v[0] + dVal * v[0], cVal * v[1] + dVal * v[1]];
    } else {
      title = "Additive Inverse: v + (-v) == 0";
      formulaL = "v + (-v)"; formulaR = "0 Vector";
      lhs = [v[0] - v[0], v[1] - v[1]];
      rhs = [0, 0];
    }

    if (card) {
      card.innerHTML = `
        <div style="font-size:14px; font-weight:700; color:#10b981; margin-bottom:8px;">✓ AXIOM HOLDS: ${title}</div>
        <div style="display:flex; justify-content:space-around; align-items:center; background:rgba(99,102,241,0.08); padding:10px; border-radius:8px;">
          <div><strong>LHS (${formulaL}):</strong> [${lhs[0].toFixed(2)}, ${lhs[1].toFixed(2)}]ᵀ</div>
          <div style="font-size:20px; font-weight:bold; color:#10b981;">≡</div>
          <div><strong>RHS (${formulaR}):</strong> [${rhs[0].toFixed(2)}, ${rhs[1].toFixed(2)}]ᵀ</div>
        </div>
      `;
    }
  }

  [sel, vx, vy, wx, wy, c, d].forEach(el => el.addEventListener('input', render));
  render();
}

/* ==========================================================================
   SIMULATION 19: 2D CONTINUOUS SPAN SYNTHESIZER (Cell 75)
   ========================================================================== */
function initSpan2DSim() {
  const canvas = document.getElementById('span2d-canvas');
  const vx = document.getElementById('span2d-vx');
  const vy = document.getElementById('span2d-vy');
  const wx = document.getElementById('span2d-wx');
  const wy = document.getElementById('span2d-wy');
  const c1 = document.getElementById('span2d-c1');
  const c2 = document.getElementById('span2d-c2');
  const presetSel = document.getElementById('span2d-preset');
  const status = document.getElementById('span2d-status');
  if (!canvas || !vx) return;

  function render() {
    const v = [parseFloat(vx.value), parseFloat(vy.value)];
    const w = [parseFloat(wx.value), parseFloat(wy.value)];
    const valC1 = parseFloat(c1.value);
    const valC2 = parseFloat(c2.value);

    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 380);
    if (!inst) return;
    const { ctx, width, height } = inst;
    const grid = drawSquareGrid(ctx, width, height, 5, theme);

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(grid.toScreenX(i * v[0] - 4 * w[0]), grid.toScreenY(i * v[1] - 4 * w[1]));
      ctx.lineTo(grid.toScreenX(i * v[0] + 4 * w[0]), grid.toScreenY(i * v[1] + 4 * w[1]));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(grid.toScreenX(-4 * v[0] + i * w[0]), grid.toScreenY(-4 * v[1] + i * w[1]));
      ctx.lineTo(grid.toScreenX(4 * v[0] + i * w[0]), grid.toScreenY(4 * v[1] + i * w[1]));
      ctx.stroke();
    }

    drawVector(ctx, grid.originX, grid.originY, grid.toScreenX(v[0]), grid.toScreenY(v[1]), theme.accent1, 'v', 2.5);
    drawVector(ctx, grid.originX, grid.originY, grid.toScreenX(w[0]), grid.toScreenY(w[1]), theme.accent2, 'w', 2.5);

    const curX = valC1 * v[0] + valC2 * w[0];
    const curY = valC1 * v[1] + valC2 * w[1];
    drawVector(ctx, grid.originX, grid.originY, grid.toScreenX(curX), grid.toScreenY(curY), theme.accent4, `p [${curX.toFixed(1)}, ${curY.toFixed(1)}]ᵀ`, 3.5);

    const det = v[0] * w[1] - v[1] * w[0];
    const isCollinear = Math.abs(det) < 0.05;
    if (status) {
      if (isCollinear) {
        status.innerHTML = `<span style="color: #ef4444;">● <strong>LINE TRAP (Linearly Dependent):</strong></span> v and w are parallel! Span is restricted to a 1D line through origin.`;
      } else {
        status.innerHTML = `<span style="color: #10b981;">● <strong>FULL PLANE SPAN (Linearly Independent):</strong></span> det ≠ 0. Linear combinations cover the entire 2D space ℝ²!`;
      }
    }
  }

  if (presetSel) {
    presetSel.onchange = () => {
      const p = presetSel.value;
      if (p === 'indep') { vx.value = 2; vy.value = 0; wx.value = 1; wy.value = 2; }
      else if (p === 'collinear') { vx.value = 2; vy.value = 1; wx.value = 4; wy.value = 2; }
      else if (p === 'opposite') { vx.value = 3; vy.value = -1; wx.value = -3; wy.value = 1; }
      render();
    };
  }

  [vx, vy, wx, wy, c1, c2].forEach(s => s.addEventListener('input', render));
  window.addEventListener('resize', render);
  render();
}

/* ==========================================================================
   SIMULATION 20: 3D SUBSPACE SPAN EXPLORER (Cell 77)
   ========================================================================== */
function initSpan3DSim() {
  const container = document.getElementById('plotly-3d-span');
  const sel = document.getElementById('span3d-preset');
  const status = document.getElementById('span3d-status');
  if (!container || typeof Plotly === 'undefined') return;

  const cases = {
    "line": {
      name: "Case 1: 1D Line Trap (u & v Collinear)",
      u: [2, 2, 1], v: [4, 4, 2], w: null,
      desc: "v is 2·u! Span is trapped on a 1D line through the origin."
    },
    "plane": {
      name: "Case 2: 2D Plane Trap (u & v Independent)",
      u: [3, 0, 1], v: [0, 3, 1], w: null,
      desc: "u and v span a tilted 2D sheet. Points off this plane cannot be reached."
    },
    "redundant": {
      name: "Case 3: Redundant Trio (w = u + v)",
      u: [3, 0, 1], v: [0, 3, 1], w: [3, 3, 2],
      desc: "w = u + v! Even with 3 vectors, the span remains a flat 2D plane in ℝ³."
    },
    "volume": {
      name: "Case 4: Full 3D Space (3 Independent Vectors)",
      u: [3, 0, 0.5], v: [0, 3, 0.5], w: [0, 0, 3],
      desc: "3 independent vectors! Span covers every single coordinate in ℝ³."
    }
  };

  function renderPlot() {
    const key = sel ? sel.value : 'line';
    const c = cases[key] || cases.line;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    const data = [
      { type: 'scatter3d', mode: 'markers', x: [0], y: [0], z: [0], marker: { size: 5, color: '#94a3b8' }, name: 'Origin' },
      { type: 'scatter3d', mode: 'lines+markers', x: [0, c.u[0]], y: [0, c.u[1]], z: [0, c.u[2]], line: { width: 6, color: '#6366f1' }, name: 'Vector u' },
      { type: 'scatter3d', mode: 'lines+markers', x: [0, c.v[0]], y: [0, c.v[1]], z: [0, c.v[2]], line: { width: 6, color: '#10b981' }, name: 'Vector v' }
    ];

    if (c.w) {
      data.push({
        type: 'scatter3d', mode: 'lines+markers', x: [0, c.w[0]], y: [0, c.w[1]], z: [0, c.w[2]], line: { width: 6, color: '#f59e0b' }, name: 'Vector w'
      });
    }

    const layout = {
      margin: { l: 0, r: 0, b: 0, t: 20 },
      paper_bgcolor: isLight ? '#ffffff' : '#0f172a',
      scene: {
        camera: { eye: { x: 1.6, y: -1.6, z: 1.2 } },
        xaxis: { title: 'X', range: [-5, 5] },
        yaxis: { title: 'Y', range: [-5, 5] },
        zaxis: { title: 'Z', range: [-5, 5] }
      }
    };

    Plotly.newPlot(container, data, layout, { responsive: true, displayModeBar: false });
    if (status) status.innerHTML = `<strong>${c.name}:</strong> ${c.desc}`;
  }

  if (sel) sel.onchange = renderPlot;
  renderPlot();
}

/* ==========================================================================
   SIMULATION 21: COLUMN COMBINATION TARGET RECONSTRUCTOR (Cell 79)
   ========================================================================== */
function initColumnReconSim() {
  const canvas = document.getElementById('recon-canvas');
  const xSlider = document.getElementById('recon-x');
  const ySlider = document.getElementById('recon-y');
  const solveBtn = document.getElementById('recon-solve-btn');
  const status = document.getElementById('recon-status');
  if (!canvas || !xSlider) return;

  const col1 = [2.0, 1.0];
  const col2 = [1.0, -1.0];
  const target = [7.0, 2.0];

  function render() {
    const x = parseFloat(xSlider.value);
    const y = parseFloat(ySlider.value);
    const cur = [x * col1[0] + y * col2[0], x * col1[1] + y * col2[1]];

    const dist = Math.sqrt(Math.pow(cur[0] - target[0], 2) + Math.pow(cur[1] - target[1], 2));
    const isSolved = dist < 0.08;

    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 380);
    if (!inst) return;
    const { ctx, width, height } = inst;
    const grid = drawSquareGrid(ctx, width, height, 4.5, theme);

    drawVector(ctx, grid.originX, grid.originY, grid.toScreenX(target[0]), grid.toScreenY(target[1]), theme.accent4, 'Target b [7, 2]ᵀ', 3.5);

    const p1x = x * col1[0];
    const p1y = x * col1[1];
    drawVector(ctx, grid.originX, grid.originY, grid.toScreenX(p1x), grid.toScreenY(p1y), theme.accent1, `x·col₁`, 2.5);

    drawVector(ctx, grid.toScreenX(p1x), grid.toScreenY(p1y), grid.toScreenX(cur[0]), grid.toScreenY(cur[1]), theme.accent2, `+ y·col₂`, 2.5);

    if (isSolved) {
      if (status) {
        status.innerHTML = `<span style="color: #10b981;">🎯 <strong>TARGET REACHED! (x = 3.0, y = 1.0)</strong></span> — 3·[2, 1]ᵀ + 1·[1, -1]ᵀ = [6, 3]ᵀ + [1, -1]ᵀ = [7, 2]ᵀ!`;
      }
    } else {
      if (status) {
        status.innerHTML = `Current: [${cur[0].toFixed(2)}, ${cur[1].toFixed(2)}]ᵀ | Distance: <strong>${dist.toFixed(2)}</strong> (Target: [7, 2]ᵀ)`;
      }
    }
  }

  if (solveBtn) {
    solveBtn.onclick = () => {
      xSlider.value = 3.0;
      ySlider.value = 1.0;
      render();
    };
  }

  xSlider.addEventListener('input', render);
  ySlider.addEventListener('input', render);
  window.addEventListener('resize', render);
  render();
}

/* ==========================================================================
   SIMULATION 22: 5x5 SYSTEM BREAKDOWN (Cell 81)
   ========================================================================== */
function init5x5SystemSim() {
  const canvas = document.getElementById('sys5x5-canvas');
  const status = document.getElementById('sys5x5-status');
  if (!canvas) return;

  function render() {
    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 240);
    if (!inst) return;
    const { ctx, width, height } = inst;
    ctx.clearRect(0, 0, width, height);

    const weights = [1.0, 1.0, 1.0, 1.0, 1.0];
    const labels = ['x₁ (Col 1)', 'x₂ (Col 2)', 'x₃ (Col 3)', 'x₄ (Col 4)', 'x₅ (Col 5)'];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    const barW = width / 6.5;
    weights.forEach((w, idx) => {
      const x = (idx + 0.6) * barW;
      const barH = height * 0.55;
      const y = height - 40 - barH;

      ctx.fillStyle = colors[idx];
      ctx.fillRect(x, y, barW * 0.7, barH);
      ctx.strokeRect(x, y, barW * 0.7, barH);

      ctx.fillStyle = theme.text;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[idx], x + barW * 0.35, height - 15);
      ctx.fillText(w.toFixed(2), x + barW * 0.35, y - 6);
    });

    if (status) {
      status.innerHTML = `<strong>Solved via Matrix Inversion:</strong> All 5 weights equal exactly 1.00! Summing all 5 columns reconstructs target b = [15, 11, 13, 11, 12]ᵀ.`;
    }
  }

  render();
  window.addEventListener('resize', render);
}

/* ==========================================================================
   SIMULATION 23: SUBSPACE SPAN DETECTIVE GAME (Cell 84)
   ========================================================================== */
function initDetectiveGameSim() {
  const canvas = document.getElementById('game-canvas');
  const sel = document.getElementById('game-level-select');
  const dial1 = document.getElementById('game-dial1');
  const dial2 = document.getElementById('game-dial2');
  const dial1Val = document.getElementById('game-dial1-val');
  const dial2Val = document.getElementById('game-dial2-val');
  const dial1Label = document.getElementById('game-dial1-label');
  const dial2Label = document.getElementById('game-dial2-label');
  const btn = document.getElementById('game-test-btn');
  const status = document.getElementById('game-status');
  const scoreBadge = document.getElementById('game-score-badge');
  if (!sel || !dial1 || !canvas) return;

  let currentScore = 0;

  function render() {
    const lvl = sel.value;
    const v1 = parseFloat(dial1.value);
    const v2 = parseFloat(dial2.value);
    if (dial1Val) dial1Val.textContent = v1.toFixed(2);
    if (dial2Val) dial2Val.textContent = v2.toFixed(2);

    const theme = getThemeColors();
    const inst = setupCanvas(canvas, 340);
    if (!inst) return;
    const { ctx, width, height } = inst;
    ctx.clearRect(0, 0, width, height);

    if (lvl === 'color') {
      // LEVEL 1: RGB STAGE LIGHT ALCHEMIST
      if (dial1Label) dial1Label.textContent = 'Amber Beam (x₁):';
      if (dial2Label) dial2Label.textContent = 'Cyan Beam (x₂):';

      // Basis Light Vectors
      const u = [1.0, 0.65, 0.1]; // Amber
      const v = [0.1, 0.75, 1.0]; // Cyan
      const target = [0.65, 0.82, 0.56]; // Target goal color (lime sage)

      // Synthesized color: clamp to [0, 1]
      const rMix = Math.min(1.0, v1 * u[0] + v2 * v[0]);
      const gMix = Math.min(1.0, v1 * u[1] + v2 * v[1]);
      const bMix = Math.min(1.0, v1 * u[2] + v2 * v[2]);

      const dist = Math.sqrt(Math.pow(rMix - target[0], 2) + Math.pow(gMix - target[1], 2) + Math.pow(bMix - target[2], 2));

      // Draw Emitters on Left
      const lampY1 = 80;
      const lampY2 = height - 80;
      ctx.fillStyle = `rgb(${Math.round(u[0]*255)}, ${Math.round(u[1]*255)}, ${Math.round(u[2]*255)})`;
      ctx.beginPath(); ctx.arc(60, lampY1, 24, 0, Math.PI * 2); ctx.fill();
      ctx.font = 'bold 11px Inter, sans-serif'; ctx.fillStyle = theme.text; ctx.textAlign = 'center';
      ctx.fillText('Amber Beam u', 60, lampY1 + 38);

      ctx.fillStyle = `rgb(${Math.round(v[0]*255)}, ${Math.round(v[1]*255)}, ${Math.round(v[2]*255)})`;
      ctx.beginPath(); ctx.arc(60, lampY2, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('Cyan Beam v', 60, lampY2 + 38);

      // Light Cones towards center
      const centerX = width * 0.42;
      const centerY = height / 2;
      const grad1 = ctx.createRadialGradient(60, lampY1, 5, centerX, centerY, 180);
      grad1.addColorStop(0, `rgba(245, 158, 11, ${v1 * 0.5})`);
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.beginPath(); ctx.moveTo(60, lampY1); ctx.lineTo(centerX + 40, centerY - 50); ctx.lineTo(centerX + 40, centerY + 50); ctx.fill();

      // Synthesized Mixed Stage Circle
      ctx.fillStyle = `rgb(${Math.round(rMix*255)}, ${Math.round(gMix*255)}, ${Math.round(bMix*255)})`;
      ctx.beginPath(); ctx.arc(centerX, centerY, 52, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Mixed Stage Spot', centerX, centerY + 72);

      // Target Swatch on Right
      const targetX = width * 0.78;
      ctx.fillStyle = `rgb(${Math.round(target[0]*255)}, ${Math.round(target[1]*255)}, ${Math.round(target[2]*255)})`;
      ctx.beginPath(); ctx.arc(targetX, centerY, 52, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = theme.accent3; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = theme.text;
      ctx.fillText('🎯 Goal Target', targetX, centerY + 72);

      // Distance Bar
      const meterW = 160;
      const meterX = width / 2 - meterW / 2;
      ctx.fillStyle = theme.isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)';
      ctx.fillRect(meterX, height - 34, meterW, 8);
      const matchPct = Math.max(0, 1 - dist / 0.8);
      ctx.fillStyle = dist < 0.1 ? '#10b981' : '#f59e0b';
      ctx.fillRect(meterX, height - 34, meterW * matchPct, 8);
      ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = theme.textMuted;
      ctx.fillText(`Color Match: ${(matchPct * 100).toFixed(0)}% (Distance: ${dist.toFixed(2)})`, width / 2, height - 16);

      if (dist < 0.1) {
        if (status) status.innerHTML = `<span style="color:#10b981;">🎉 <strong>PERFECT COLOR MATCH!</strong></span> Ratio calibrated (x₁ = ${v1.toFixed(2)}, x₂ = ${v2.toFixed(2)})! Target is inside the span!`;
      } else {
        if (status) status.innerHTML = `Adjust Amber and Cyan dials to hit the lime-sage target. Current color distance: <strong>${dist.toFixed(2)}</strong>`;
      }

    } else if (lvl === 'drone') {
      // LEVEL 2: 2D DRONE FLIGHT NAVIGATION (HEAD-TO-TAIL)
      if (dial1Label) dial1Label.textContent = 'Thruster 1 (x₁):';
      if (dial2Label) dial2Label.textContent = 'Thruster 2 (x₂):';

      // 2D Radar Grid
      const originX = width * 0.25;
      const originY = height * 0.75;
      const scale = 36;
      const toX = (x) => originX + x * scale;
      const toY = (y) => originY - y * scale;

      // Draw Grid
      ctx.strokeStyle = theme.grid; ctx.lineWidth = 1;
      for (let x = 0; x <= 6; x++) { ctx.beginPath(); ctx.moveTo(toX(x), 20); ctx.lineTo(toX(x), height - 20); ctx.stroke(); }
      for (let y = 0; y <= 6; y++) { ctx.beginPath(); ctx.moveTo(originX - 20, toY(y)); ctx.lineTo(width - 30, toY(y)); ctx.stroke(); }

      // Basis Vectors: u = [1, 1], v = [1, 2]
      // Target Waypoint: [3, 4] -> Solution: 2*u + 1*v = [3, 4]
      const tx = 3.0; const ty = 4.0;
      const droneX = v1 * 1.0 + v2 * 1.0;
      const droneY = v1 * 1.0 + v2 * 2.0;

      // Target Bullseye
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(toX(tx), toY(ty), 14, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(toX(tx), toY(ty), 6, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('🎯 Waypoint [3, 4]ᵀ', toX(tx) + 18, toY(ty) + 4);

      // Vector 1 (Indigo from Origin)
      const u1x = v1 * 1.0; const u1y = v1 * 1.0;
      drawVector(ctx, originX, originY, toX(u1x), toY(u1y), theme.accent1, 'x₁·u [1,1]', 3);

      // Vector 2 (Emerald Head-to-Tail from tip of u)
      drawVector(ctx, toX(u1x), toY(u1y), toX(droneX), toY(droneY), theme.accent2, 'x₂·v [1,2]', 3);

      // Drone Craft at Result Tip
      ctx.font = '24px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🛸', toX(droneX), toY(droneY));

      const dist = Math.sqrt(Math.pow(droneX - tx, 2) + Math.pow(droneY - ty, 2));
      if (dist < 0.18) {
        if (status) status.innerHTML = `<span style="color:#10b981;">🚀 <strong>WAYPOINT REACHED!</strong></span> Perfect flight solution: 2[1,1]ᵀ + 1[1,2]ᵀ = [3,4]ᵀ!`;
      } else {
        if (status) status.innerHTML = `Current Drone Position: [${droneX.toFixed(2)}, ${droneY.toFixed(2)}]ᵀ. Distance to target: <strong>${dist.toFixed(2)}</strong>`;
      }

    } else {
      // LEVEL 3: 3D SUBSPACE SPAN DETECTIVE (PLANE VS OFF-PLANE TARGET)
      if (dial1Label) dial1Label.textContent = 'Plane Weight 1 (x₁):';
      if (dial2Label) dial2Label.textContent = 'Plane Weight 2 (x₂):';

      // Isometric 3D Projection
      const ox = width * 0.45;
      const oy = height * 0.65;
      // 3D to 2D projection
      const proj = (x, y, z) => ({
        px: ox + (x - y) * 28,
        py: oy + (x + y) * 14 - z * 32
      });

      // Draw 2D Subspace Plane Sheet (Translucent Parallelogram)
      // Basis: u = [2, 0, 1], v = [0, 2, 1]
      const p0 = proj(0, 0, 0);
      const p1 = proj(3*2, 0, 3*1);
      const p2 = proj(3*2, 3*2, 3*1 + 3*1);
      const p3 = proj(0, 3*2, 3*1);

      ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
      ctx.beginPath();
      ctx.moveTo(p0.px, p0.py); ctx.lineTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.lineTo(p3.px, p3.py);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1.5; ctx.stroke();

      // Origin
      ctx.fillStyle = theme.text; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('(0,0,0)', p0.px - 6, p0.py);

      // Synthesized Vector on the Plane: x1*u + x2*v
      const curX = v1 * 2; const curY = v2 * 2; const curZ = v1 * 1 + v2 * 1;
      const curP = proj(curX, curY, curZ);

      // Draw synthesis vector
      drawVector(ctx, p0.px, p0.py, curP.px, curP.py, theme.accent2, 'Synthesized Vector on Plane', 3);

      // Target Vector b = [2, 2, 4]
      const tbP = proj(2, 2, 4);
      // Projection of target ON plane is [2, 2, 2]
      const tbOnPlane = proj(2, 2, 2);

      // Dashed vertical altitude drop line
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(tbOnPlane.px, tbOnPlane.py); ctx.lineTo(tbP.px, tbP.py); ctx.stroke();
      ctx.setLineDash([]);

      // Target Vector Arrow
      drawVector(ctx, p0.px, p0.py, tbP.px, tbP.py, '#ef4444', 'Target b [2, 2, 4]ᵀ', 3);

      // Altitude label
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Altitude h = 2.0 (Off-Plane!)', tbP.px + 10, (tbP.py + tbOnPlane.py)/2);

      if (status) {
        status.innerHTML = `<span style="color:#ef4444;">🚨 <strong>TARGET LIES OUTSIDE SUBSPACE!</strong></span> Target vector [2, 2, 4]ᵀ hovers 2 units above the plane sheet (which requires z = (x+y)/2 = 2). No combination of basis vectors can ever leave the plane! Therefore, <strong>b ∉ Span(u, v)</strong>.`;
      }
    }
  }

  if (btn) {
    btn.onclick = () => {
      currentScore += 10;
      if (scoreBadge) scoreBadge.textContent = `${currentScore} pts`;
      render();
    };
  }

  sel.onchange = render;
  dial1.addEventListener('input', render);
  dial2.addEventListener('input', render);
  window.addEventListener('resize', render);
  render();
}

/* =/* ==========================================================================
   GLOBAL INITIALIZATION ENTRYPOINT
   ========================================================================== */
function initAllSimulations() {
  console.log("Initializing all Linear Algebra simulations with fixed heights & true aspect ratios...");
  initCurveSim();
  initLineSolverSim();
  initTrichotomySim();
  init3DScenariosSim();
  init3DCustomSolverSim();
  initRowColumnSim();
  initColumnExplorerSim();
  initRGBStudioSim();
  initAudioMixerSim();
  initMatrixDimensionsSim();
  initChaiKitchenSim();
  initImageTransformSim();
  initCanteenMenuSim();
  initLightBlendingSim();
  initPixelShifterSim();
  initVector2DSim();
  initVectorAddSim();
  initAxiomTesterSim();
  initSpan2DSim();
  initSpan3DSim();
  initColumnReconSim();
  init5x5SystemSim();
  initDetectiveGameSim();
}

window.addEventListener('DOMContentLoaded', initAllSimulations);
window.addEventListener('theme-changed', initAllSimulations);
