/* =====================================================================
   Module 6 · Linear Independence, Rank & Solvability
   Newton School of Technology · Mathematics-3
   Interactive companion labs:
     - lab-mission-control-2d: 2D Vector Dials Radar Simulator
     - lab-3d-space-radar: 3D Vector Space Radar (Line vs Plane vs 3D)
     - lab-augmented-rank-tester: Augmented Matrix Rank Solvability Test
     - lab-subspace-lock-game: Broken Controller 3D Subspace Lock Game
     - lab-code-rank: NumPy Rank CodeLab
     - quiz-m6: Module 6 Mastery Self-Check Quiz
     - assignment-quiz-m6: Assignment Conceptual MCQs
   ===================================================================== */

(function () {
  'use strict';
  const { el, $, fmt, g, clamp } = LA;

  /* ------------------------------------------------------------------ */
  /* Lab 1: 2D Mission Control Vector Dials Radar Simulator              */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-mission-control-2d', function () {
    const root = $('#lab-mission-control-2d');
    if (!root) return;
    root.innerHTML = '';

    const PRESETS = [
      {
        name: 'Independent Thrusters (Full 2D Control)',
        v1: [2, 1],
        v2: [-1, 2],
        desc: 'v₁ and v₂ point in non-parallel directions. Det = 2(2) - (1)(-1) = 5 ≠ 0. You can reach any target (x, y) in the entire 2D plane!'
      },
      {
        name: 'Collinear / Redundant Thrusters (1D Trapped)',
        v1: [2, 1],
        v2: [4, 2],
        desc: 'v₂ = 2·v₁. Thruster 2 points in the exact same direction as Thruster 1! Det = 2(2) - (1)(4) = 0. Trapped along the line y = 0.5x!'
      },
      {
        name: 'Antiparallel Thrusters (1D Trapped)',
        v1: [3, -1],
        v2: [-1.5, 0.5],
        desc: 'v₂ = -0.5·v₁. The thrusters oppose each other along the single line y = -x/3. Linearly dependent!'
      }
    ];

    const TARGETS = [
      { name: 'Beacon Alpha (3, 4)', x: 3, y: 4 },
      { name: 'Beacon Beta (6, 3) [On Collinear Line]', x: 6, y: 3 },
      { name: 'Beacon Gamma (-2, 3)', x: -2, y: 3 },
      { name: 'Beacon Delta (4, 2) [On Collinear Line]', x: 4, y: 2 }
    ];

    let currentPresetIdx = 0;
    let currentTargetIdx = 0;
    let c1 = 1.0;
    let c2 = 1.0;

    // Build DOM layout
    const container = el('div', { class: 'lab-dual-view' });
    const controlPanel = el('div', { class: 'lab-panel' });
    const canvasCard = el('div', { class: 'lab-canvas-card' });

    // Canvas
    const canvas = el('canvas', { width: 520, height: 440, style: { width: '100%', maxWidth: '520px', borderRadius: '8px', background: '#0f172a' } });
    const ctx = canvas.getContext('2d');
    canvasCard.appendChild(canvas);

    // Preset selector
    const presetSelect = el('select', { class: 'lab-select', style: { width: '100%', marginBottom: '12px' } });
    PRESETS.forEach((p, idx) => {
      const opt = el('option', { value: idx }, p.name);
      presetSelect.appendChild(opt);
    });

    // Target selector
    const targetSelect = el('select', { class: 'lab-select', style: { width: '100%', marginBottom: '12px' } });
    TARGETS.forEach((t, idx) => {
      const opt = el('option', { value: idx }, t.name);
      targetSelect.appendChild(opt);
    });

    // Sliders
    const s1Row = el('div', { class: 'lab-slider-row', style: { marginBottom: '10px' } });
    const s1Label = el('div', { class: 'lab-slider-label' }, 'Dial 1 (c₁): 1.0');
    const s1 = el('input', { type: 'range', min: -3, max: 3, step: 0.1, value: 1.0, class: 'lab-slider' });
    s1Row.append(s1Label, s1);

    const s2Row = el('div', { class: 'lab-slider-row', style: { marginBottom: '14px' } });
    const s2Label = el('div', { class: 'lab-slider-label' }, 'Dial 2 (c₂): 1.0');
    const s2 = el('input', { type: 'range', min: -3, max: 3, step: 0.1, value: 1.0, class: 'lab-slider' });
    s2Row.append(s2Label, s2);

    // Auto-solve lock button
    const autoLockBtn = el('button', { class: 'lab-btn-primary', style: { width: '100%', marginBottom: '12px' } }, '🎯 Auto-Calculate Dial Settings (Solve Ax = b)');

    // Status readout
    const statusBox = el('div', { class: 'lab-status-box', style: { fontSize: '13px', lineHeight: '1.5' } });
    const descBox = el('div', { class: 'lab-info-box', style: { marginTop: '10px', fontSize: '12.5px', color: '#475569' } });

    controlPanel.append(
      el('h4', { style: { margin: '0 0 8px 0', fontSize: '14px', color: '#1e3a8a' } }, 'Engine Thruster Configuration:'),
      presetSelect,
      el('h4', { style: { margin: '0 0 8px 0', fontSize: '14px', color: '#1e3a8a' } }, 'Select Target Beacon (b):'),
      targetSelect,
      s1Row,
      s2Row,
      autoLockBtn,
      statusBox,
      descBox
    );

    container.append(canvasCard, controlPanel);
    root.appendChild(container);

    function solveSystem(v1, v2, target) {
      // System: [v1_x  v2_x] [c1] = [tx]
      //         [v1_y  v2_y] [c2] = [ty]
      const det = v1[0] * v2[1] - v1[1] * v2[0];
      if (Math.abs(det) > 1e-6) {
        // Unique solution
        const c1_sol = (target.x * v2[1] - target.y * v2[0]) / det;
        const c2_sol = (v1[0] * target.y - v1[1] * target.x) / det;
        return { solvable: true, unique: true, c1: c1_sol, c2: c2_sol, dist: 0 };
      } else {
        // Collinear / dependent. Check if target lies on span(v1)
        // Normal to v1: (-v1[1], v1[0])
        const norm = Math.hypot(v1[0], v1[1]);
        if (norm < 1e-6) return { solvable: false, dist: Math.hypot(target.x, target.y) };
        const perpDist = Math.abs(-v1[1] * target.x + v1[0] * target.y) / norm;
        if (perpDist < 1e-4) {
          // Solvable along line! Projection of target onto v1:
          const dot = (target.x * v1[0] + target.y * v1[1]) / (norm * norm);
          return { solvable: true, unique: false, c1: dot, c2: 0, dist: 0 };
        } else {
          return { solvable: false, unique: false, dist: perpDist };
        }
      }
    }

    function render() {
      const preset = PRESETS[currentPresetIdx];
      const target = TARGETS[currentTargetIdx];
      const v1 = preset.v1;
      const v2 = preset.v2;

      s1Label.textContent = `Dial 1 (c₁): ${fmt(c1, 1)}`;
      s2Label.textContent = `Dial 2 (c₂): ${fmt(c2, 1)}`;
      descBox.textContent = preset.desc;

      // Resultant ship position: r = c1*v1 + c2*v2
      const rx = c1 * v1[0] + c2 * v2[0];
      const ry = c1 * v1[1] + c2 * v2[1];
      const distToTarget = Math.hypot(rx - target.x, ry - target.y);

      // Solve check
      const sol = solveSystem(v1, v2, target);

      // Update status box
      let statusHtml = `<div><strong>Ship Position:</strong> (${fmt(rx, 2)}, ${fmt(ry, 2)})</div>`;
      statusHtml += `<div><strong>Target Position:</strong> (${target.x}, ${target.y})</div>`;
      statusHtml += `<div><strong>Distance to Target:</strong> ${fmt(distToTarget, 2)} units</div>`;

      if (distToTarget < 0.25) {
        statusHtml += `<div style="color: #16a34a; font-weight: bold; margin-top: 6px;">🎯 TARGET LOCKED! Excellent navigation!</div>`;
      } else if (!sol.solvable) {
        statusHtml += `<div style="color: #dc2626; font-weight: bold; margin-top: 6px;">⚠️ TARGET UNREACHABLE! Distance off 1D line: ${fmt(sol.dist, 2)} units. Thrusters are collinear!</div>`;
      } else {
        statusHtml += `<div style="color: #2563eb; margin-top: 6px;">Target is reachable. Adjust dials or click Auto-Calculate!</div>`;
      }
      statusBox.innerHTML = statusHtml;

      // Draw canvas radar
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const ox = w / 2;
      const oy = h / 2;
      const scale = 34; // pixels per unit

      function toX(x) { return ox + x * scale; }
      function toY(y) { return oy - y * scale; }

      // Radar circles
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let r = 1; r <= 6; r++) {
        ctx.beginPath();
        ctx.arc(ox, oy, r * scale, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Radar crosshair axes
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(0, oy); ctx.lineTo(w, oy);
      ctx.moveTo(ox, 0); ctx.lineTo(ox, h);
      ctx.stroke();

      // If collinear, draw the span line
      const det = v1[0] * v2[1] - v1[1] * v2[0];
      if (Math.abs(det) < 1e-6) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(toX(-10 * v1[0]), toY(-10 * v1[1]));
        ctx.lineTo(toX(10 * v1[0]), toY(10 * v1[1]));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw vector arrow helper
      function drawArrow(fromX, fromY, toX_val, toY_val, color, width) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX_val, toY_val);
        ctx.stroke();

        const angle = Math.atan2(toY_val - fromY, toX_val - fromX);
        const headLen = 8;
        ctx.beginPath();
        ctx.moveTo(toX_val, toY_val);
        ctx.lineTo(toX_val - headLen * Math.cos(angle - Math.PI / 6), toY_val - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX_val - headLen * Math.cos(angle + Math.PI / 6), toY_val - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }

      // Draw Thruster 1 (scaled by c1): from origin
      const p1x = toX(c1 * v1[0]);
      const p1y = toY(c1 * v1[1]);
      drawArrow(ox, oy, p1x, p1y, '#ef4444', 2.5);

      // Draw Thruster 2 (scaled by c2): tip-to-tail from p1 to ship position
      const prx = toX(rx);
      const pry = toY(ry);
      drawArrow(p1x, p1y, prx, pry, '#3b82f6', 2.5);

      // Base unscaled vectors for reference
      drawArrow(ox, oy, toX(v1[0]), toY(v1[1]), 'rgba(239, 68, 68, 0.5)', 1.5);
      drawArrow(ox, oy, toX(v2[0]), toY(v2[1]), 'rgba(59, 130, 246, 0.5)', 1.5);

      // Target Beacon (green diamond)
      const tx = toX(target.x);
      const ty = toY(target.y);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(tx, ty - 9);
      ctx.lineTo(tx + 9, ty);
      ctx.lineTo(tx, ty + 9);
      ctx.lineTo(tx - 9, ty);
      ctx.closePath();
      ctx.fill();

      // Ship Resultant Position (Gold Star / Circle)
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(prx, pry, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Labels
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Target (b)', tx + 12, ty + 4);
      ctx.fillText('Ship (r)', prx + 10, pry - 4);
    }

    presetSelect.addEventListener('change', (e) => {
      currentPresetIdx = parseInt(e.target.value);
      render();
    });

    targetSelect.addEventListener('change', (e) => {
      currentTargetIdx = parseInt(e.target.value);
      render();
    });

    s1.addEventListener('input', (e) => {
      c1 = parseFloat(e.target.value);
      render();
    });

    s2.addEventListener('input', (e) => {
      c2 = parseFloat(e.target.value);
      render();
    });

    autoLockBtn.addEventListener('click', () => {
      const preset = PRESETS[currentPresetIdx];
      const target = TARGETS[currentTargetIdx];
      const sol = solveSystem(preset.v1, preset.v2, target);
      if (sol.solvable) {
        c1 = clamp(sol.c1, -3, 3);
        c2 = clamp(sol.c2, -3, 3);
        s1.value = c1;
        s2.value = c2;
        render();
      } else {
        alert('Cannot reach target! The vector thrusters are linearly dependent and the target does not lie on their 1D span line.');
      }
    });

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 2: 3D Vector Space Radar: Line vs Plane vs 3D Space            */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-3d-space-radar', function () {
    const root = $('#lab-3d-space-radar');
    if (!root) return;
    root.innerHTML = '';

    const INSTANCES = [
      {
        name: 'Instance A: All 3 Collinear (Rank 1 Line Collapse)',
        v1: [1.0, 2.0, 3.0],
        v2: [3.0, 6.0, 9.0],
        v3: [2.0, 4.0, 6.0],
        rank: 1,
        dimDesc: '1D Line Subspace. All three vectors are scalar multiples of [1, 2, 3]ᵀ! You can only steer forwards and backwards along a single line.'
      },
      {
        name: 'Instance B: Two Independent, Third Redundant (Rank 2 Flat Plane)',
        v1: [1.0, 0.0, 0.0],
        v2: [0.0, 1.0, 0.0],
        v3: [1.0, 1.0, 0.0],
        rank: 2,
        dimDesc: '2D Flat Plane Subspace (XY Floor). v₃ = v₁ + v₂. Any target floating above the floor (z ≠ 0) is unreachable!'
      },
      {
        name: 'Instance C: Full 3D Independence (Rank 3 Full Space)',
        v1: [1.0, 0.0, 0.0],
        v2: [0.0, 1.0, 0.0],
        v3: [0.0, 0.0, 1.0],
        rank: 3,
        dimDesc: '3D Full Space ℝ³. All three vectors point into new dimensions. Rank = 3. You can reach any target (x, y, z) in the universe!'
      }
    ];

    let currentInstIdx = 1; // Default to Rank 2
    let c1 = 1.0, c2 = 1.0, c3 = 0.0;
    let target = [2.0, 3.0, 2.0];

    const container = el('div', { class: 'lab-dual-view' });
    const plotContainer = el('div', { style: { minHeight: '440px', width: '100%', borderRadius: '8px', overflow: 'hidden' } });
    const panel = el('div', { class: 'lab-panel' });

    // Selector
    const instSelect = el('select', { class: 'lab-select', style: { width: '100%', marginBottom: '12px' } });
    INSTANCES.forEach((inst, idx) => {
      const opt = el('option', { value: idx }, inst.name);
      if (idx === currentInstIdx) opt.selected = true;
      instSelect.appendChild(opt);
    });

    // Sliders
    const s1Row = el('div', { class: 'lab-slider-row', style: { marginBottom: '8px' } });
    const s1Label = el('div', { class: 'lab-slider-label' }, 'Dial c₁ (v₁): 1.0');
    const s1 = el('input', { type: 'range', min: -2, max: 2, step: 0.2, value: 1.0, class: 'lab-slider' });
    s1Row.append(s1Label, s1);

    const s2Row = el('div', { class: 'lab-slider-row', style: { marginBottom: '8px' } });
    const s2Label = el('div', { class: 'lab-slider-label' }, 'Dial c₂ (v₂): 1.0');
    const s2 = el('input', { type: 'range', min: -2, max: 2, step: 0.2, value: 1.0, class: 'lab-slider' });
    s2Row.append(s2Label, s2);

    const s3Row = el('div', { class: 'lab-slider-row', style: { marginBottom: '14px' } });
    const s3Label = el('div', { class: 'lab-slider-label' }, 'Dial c₃ (v₃): 0.0');
    const s3 = el('input', { type: 'range', min: -2, max: 2, step: 0.2, value: 0.0, class: 'lab-slider' });
    s3Row.append(s3Label, s3);

    // Target preset toggle
    const targetRow = el('div', { style: { marginBottom: '12px' } });
    const targetFloorBtn = el('button', { class: 'lab-btn-secondary', style: { marginRight: '6px', fontSize: '12px' } }, 'Target on Floor [2, 3, 0]');
    const targetAirBtn = el('button', { class: 'lab-btn-secondary', style: { fontSize: '12px' } }, 'Target in Air [2, 3, 2]');
    targetRow.append(targetFloorBtn, targetAirBtn);

    const infoBox = el('div', { class: 'lab-status-box', style: { fontSize: '13px', lineHeight: '1.5' } });
    panel.append(
      el('h4', { style: { margin: '0 0 8px 0', fontSize: '14px', color: '#1e3a8a' } }, 'Select Subspace Scenario:'),
      instSelect,
      s1Row,
      s2Row,
      s3Row,
      el('h4', { style: { margin: '0 0 6px 0', fontSize: '13px', color: '#475569' } }, 'Test Target Location:'),
      targetRow,
      infoBox
    );

    container.append(plotContainer, panel);
    root.appendChild(container);

    function updatePlot() {
      const inst = INSTANCES[currentInstIdx];
      const v1 = inst.v1;
      const v2 = inst.v2;
      const v3 = inst.v3;

      s1Label.textContent = `Dial c₁ (v₁): ${fmt(c1, 1)}`;
      s2Label.textContent = `Dial c₂ (v₂): ${fmt(c2, 1)}`;
      s3Label.textContent = `Dial c₃ (v₃): ${fmt(c3, 1)}`;

      const rx = c1 * v1[0] + c2 * v2[0] + c3 * v3[0];
      const ry = c1 * v1[1] + c2 * v2[1] + c3 * v3[1];
      const rz = c1 * v1[2] + c2 * v2[2] + c3 * v3[2];
      const dist = Math.hypot(rx - target[0], ry - target[1], rz - target[2]);

      let reachable = true;
      if (inst.rank === 1) {
        // Collinear along v1
        const norm = Math.hypot(...v1);
        const crossX = target[1] * v1[2] - target[2] * v1[1];
        const crossY = target[2] * v1[0] - target[0] * v1[2];
        const crossZ = target[0] * v1[1] - target[1] * v1[0];
        const perp = Math.hypot(crossX, crossY, crossZ) / norm;
        if (perp > 0.05) reachable = false;
      } else if (inst.rank === 2) {
        // Flat plane z = 0
        if (Math.abs(target[2]) > 0.05) reachable = false;
      }

      infoBox.innerHTML = `
        <div><strong>Matrix Rank:</strong> <span class="badge ${inst.rank === 3 ? 'badge-teal' : 'badge-amber'}">${inst.rank} / 3</span></div>
        <div style="margin-top: 4px;"><strong>Ship Pos:</strong> (${fmt(rx, 1)}, ${fmt(ry, 1)}, ${fmt(rz, 1)})</div>
        <div><strong>Target Pos:</strong> (${target[0]}, ${target[1]}, ${target[2]})</div>
        <div><strong>Distance:</strong> ${fmt(dist, 2)} units</div>
        <div style="margin-top: 6px; font-weight: bold; color: ${dist < 0.3 ? '#16a34a' : reachable ? '#2563eb' : '#dc2626'}">
          ${dist < 0.3 ? '🎯 TARGET REACHED!' : reachable ? 'Target is reachable within this subspace!' : '⚠️ TARGET UNREACHABLE! Target is outside the subspace dimension!'}
        </div>
        <div style="margin-top: 6px; font-size: 12px; color: #64748b;">${inst.dimDesc}</div>
      `;

      if (typeof Plotly === 'undefined') return;

      const traces = [
        // Target point
        {
          type: 'scatter3d',
          mode: 'markers+text',
          x: [target[0]],
          y: [target[1]],
          z: [target[2]],
          marker: { size: 9, color: '#22c55e', symbol: 'diamond' },
          text: ['Target'],
          textposition: 'top center',
          name: 'Target Beacon'
        },
        // Ship current position
        {
          type: 'scatter3d',
          mode: 'markers+lines+text',
          x: [0, rx],
          y: [0, ry],
          z: [0, rz],
          line: { color: '#fbbf24', width: 6 },
          marker: { size: 7, color: '#fbbf24' },
          text: ['', 'Ship'],
          name: 'Ship Position'
        },
        // v1 vector
        {
          type: 'scatter3d',
          mode: 'lines',
          x: [0, v1[0]],
          y: [0, v1[1]],
          z: [0, v1[2]],
          line: { color: '#ef4444', width: 4 },
          name: 'v₁'
        },
        // v2 vector
        {
          type: 'scatter3d',
          mode: 'lines',
          x: [0, v2[0]],
          y: [0, v2[1]],
          z: [0, v2[2]],
          line: { color: '#3b82f6', width: 4 },
          name: 'v₂'
        },
        // v3 vector
        {
          type: 'scatter3d',
          mode: 'lines',
          x: [0, v3[0]],
          y: [0, v3[1]],
          z: [0, v3[2]],
          line: { color: '#10b981', width: 4 },
          name: 'v₃'
        }
      ];

      // If Rank 2 flat plane, add transparent plane mesh
      if (inst.rank === 2) {
        traces.unshift({
          type: 'mesh3d',
          x: [-3, 3, 3, -3],
          y: [-3, -3, 3, 3],
          z: [0, 0, 0, 0],
          opacity: 0.25,
          color: '#3b82f6',
          name: 'Reachable Plane (Z=0)'
        });
      }

      const layout = {
        margin: { l: 0, r: 0, b: 0, t: 0 },
        scene: {
          xaxis: { range: [-3.5, 3.5], title: 'X' },
          yaxis: { range: [-3.5, 3.5], title: 'Y' },
          zaxis: { range: [-3.5, 3.5], title: 'Z' },
          camera: { eye: { x: 1.6, y: -1.6, z: 1.2 } }
        },
        showlegend: false
      };

      Plotly.react(plotContainer, traces, layout, { responsive: true, displayModeBar: false });
    }

    instSelect.addEventListener('change', (e) => {
      currentInstIdx = parseInt(e.target.value);
      updatePlot();
    });

    s1.addEventListener('input', (e) => { c1 = parseFloat(e.target.value); updatePlot(); });
    s2.addEventListener('input', (e) => { c2 = parseFloat(e.target.value); updatePlot(); });
    s3.addEventListener('input', (e) => { c3 = parseFloat(e.target.value); updatePlot(); });

    targetFloorBtn.addEventListener('click', () => { target = [2.0, 3.0, 0.0]; updatePlot(); });
    targetAirBtn.addEventListener('click', () => { target = [2.0, 3.0, 2.0]; updatePlot(); });

    updatePlot();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 3: Augmented Matrix Rank Solvability Test [A | b]              */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-augmented-rank-tester', function () {
    const root = $('#lab-augmented-rank-tester');
    if (!root) return;
    root.innerHTML = '';

    const SCENARIOS = [
      {
        name: 'Case 1: Inconsistent (No Solution)',
        A: [[1, 2], [2, 4]],
        b: [5, 12],
        desc: 'Row 2 becomes [0, 0 | 2]. Rank(A) = 1, but Rank([A | b]) = 2! The augmented column introduces a pivot in the constants column: 0 = 2 (impossible contradiction).'
      },
      {
        name: 'Case 2: Unique Solution',
        A: [[1, 2], [3, 5]],
        b: [4, 11],
        desc: 'Det(A) = 1(5) - 2(3) = -1 ≠ 0. Row reduction yields 2 pivots in A and 2 pivots in [A | b]. Rank(A) = Rank([A | b]) = 2 = n. Unique solution x = [2, 1]ᵀ.'
      },
      {
        name: 'Case 3: Infinitely Many Solutions',
        A: [[1, 2], [2, 4]],
        b: [5, 10],
        desc: 'Row 2 is an exact multiple: 2·R₁ = R₂. Row reduction yields [0, 0 | 0]. Rank(A) = Rank([A | b]) = 1 < n = 2. Free variable x₂ exists!'
      }
    ];

    let currentScenIdx = 0;

    const panel = el('div', { class: 'lab-panel', style: { width: '100%' } });
    const scenSelect = el('select', { class: 'lab-select', style: { width: '100%', marginBottom: '14px' } });
    SCENARIOS.forEach((s, idx) => {
      const opt = el('option', { value: idx }, s.name);
      scenSelect.appendChild(opt);
    });

    const displayCard = el('div', { class: 'lab-card', style: { background: '#f8fafc', padding: '16px', borderRadius: '8px' } });

    panel.append(
      el('h4', { style: { margin: '0 0 8px 0', fontSize: '14px', color: '#1e3a8a' } }, 'Select Golden Solvability Scenario:'),
      scenSelect,
      displayCard
    );
    root.appendChild(panel);

    function renderScenario() {
      const scen = SCENARIOS[currentScenIdx];
      const A = scen.A;
      const b = scen.b;

      // Row reduction of [A | b]:
      // R2 <- R2 - m * R1, where m = A[1][0] / A[0][0]
      const m = A[1][0] / A[0][0];
      const r2_a = A[1][1] - m * A[0][1];
      const r2_b = b[1] - m * b[0];

      // Rank evaluation
      const rankA = Math.abs(r2_a) > 1e-6 ? 2 : 1;
      const rankAug = (Math.abs(r2_a) > 1e-6 || Math.abs(r2_b) > 1e-6) ? 2 : 1;

      let diagnosisClass = 'badge-teal';
      let diagnosisText = 'Unique Solution';
      if (rankA < rankAug) {
        diagnosisClass = 'badge-crimson';
        diagnosisText = 'Inconsistent (No Solution)';
      } else if (rankA === rankAug && rankA < 2) {
        diagnosisClass = 'badge-amber';
        diagnosisText = 'Infinitely Many Solutions';
      }

      displayCard.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px;">
          <div>
            <div style="font-weight: 600; font-size: 13px; color: #475569; margin-bottom: 6px;">Original Augmented Matrix $[A \\mid \\mathbf{b}]$:</div>
            <div style="font-family: monospace; font-size: 14px; background: white; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
              [ ${A[0][0]}  ${A[0][1]}  |  ${b[0]} ]<br>
              [ ${A[1][0]}  ${A[1][1]}  |  ${b[1]} ]
            </div>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 13px; color: #475569; margin-bottom: 6px;">Row Echelon Form $[U \\mid \\mathbf{c}]$:</div>
            <div style="font-family: monospace; font-size: 14px; background: white; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
              [ ${A[0][0]}  ${A[0][1]}  |  ${b[0]} ]<br>
              [ 0  ${fmt(r2_a, 1)}  |  ${fmt(r2_b, 1)} ]
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
          <div style="background: white; padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <strong>Rank(A):</strong> <span class="badge badge-teal">${rankA}</span>
          </div>
          <div style="background: white; padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <strong>Rank([A | b]):</strong> <span class="badge ${rankAug > rankA ? 'badge-crimson' : 'badge-teal'}">${rankAug}</span>
          </div>
          <div style="background: white; padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <strong>Diagnosis:</strong> <span class="badge ${diagnosisClass}">${diagnosisText}</span>
          </div>
        </div>

        <div style="font-size: 13.5px; color: #334155; line-height: 1.5; background: #f1f5f9; padding: 12px; border-radius: 6px;">
          <strong>Mathematical Analysis:</strong> ${scen.desc}
        </div>
      `;

      if (window.renderMathInElement) {
        renderMathInElement(displayCard, { delimiters: [{ left: '$', right: '$', display: false }] });
      }
    }

    scenSelect.addEventListener('change', (e) => {
      currentScenIdx = parseInt(e.target.value);
      renderScenario();
    });

    renderScenario();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 4: The Broken Controller Subspace Lock Game                    */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-subspace-lock-game', function () {
    const root = $('#lab-subspace-lock-game');
    if (!root) return;
    root.innerHTML = '';

    const TARGET_PRESETS = [
      { name: 'Ground Target [3, 4, 0] (In Span)', b: [3.0, 4.0, 0.0] },
      { name: 'Floating Orb [3, 4, 3] (Outside Span)', b: [3.0, 4.0, 3.0] },
      { name: 'Wall Target [0, 5, 2] (Outside Span)', b: [0.0, 5.0, 2.0] }
    ];

    let currentTargetIdx = 1; // Default to floating orb outside span
    let x1 = 1.0, x2 = 1.0;

    const container = el('div', { class: 'lab-dual-view' });
    const plotContainer = el('div', { style: { minHeight: '440px', width: '100%', borderRadius: '8px', overflow: 'hidden' } });
    const panel = el('div', { class: 'lab-panel' });

    // Target selector
    const targetSelect = el('select', { class: 'lab-select', style: { width: '100%', marginBottom: '12px' } });
    TARGET_PRESETS.forEach((t, idx) => {
      const opt = el('option', { value: idx }, t.name);
      if (idx === currentTargetIdx) opt.selected = true;
      targetSelect.appendChild(opt);
    });

    // Sliders for button presses
    const b1Row = el('div', { class: 'lab-slider-row', style: { marginBottom: '8px' } });
    const b1Label = el('div', { class: 'lab-slider-label' }, 'Button 1 Press (x₁ East): 1.0');
    const s1 = el('input', { type: 'range', min: -5, max: 5, step: 0.5, value: 1.0, class: 'lab-slider' });
    b1Row.append(b1Label, s1);

    const b2Row = el('div', { class: 'lab-slider-row', style: { marginBottom: '14px' } });
    const b2Label = el('div', { class: 'lab-slider-label' }, 'Button 2 Press (x₂ North): 1.0');
    const s2 = el('input', { type: 'range', min: -5, max: 5, step: 0.5, value: 1.0, class: 'lab-slider' });
    b2Row.append(b2Label, s2);

    const snapBtn = el('button', { class: 'lab-btn-primary', style: { width: '100%', marginBottom: '12px' } }, '🧲 Snap Character to Closest Position (Projection)');

    const statusBox = el('div', { class: 'lab-status-box', style: { fontSize: '13px', lineHeight: '1.5' } });

    panel.append(
      el('h4', { style: { margin: '0 0 8px 0', fontSize: '14px', color: '#1e3a8a' } }, 'Select Target Orb:'),
      targetSelect,
      b1Row,
      b2Row,
      snapBtn,
      statusBox
    );

    container.append(plotContainer, panel);
    root.appendChild(container);

    function updatePlot() {
      const target = TARGET_PRESETS[currentTargetIdx].b;
      b1Label.textContent = `Button 1 Press (x₁ East): ${fmt(x1, 1)}`;
      b2Label.textContent = `Button 2 Press (x₂ North): ${fmt(x2, 1)}`;

      // Movement matrix A = [[1, 0], [0, 1], [0, 0]]
      // Character pos = x1*[1,0,0] + x2*[0,1,0] = [x1, x2, 0]
      const charPos = [x1, x2, 0.0];
      const horizDist = Math.hypot(charPos[0] - target[0], charPos[1] - target[1]);
      const vertGap = Math.abs(target[2]);
      const totalDist = Math.hypot(charPos[0] - target[0], charPos[1] - target[1], charPos[2] - target[2]);

      const rankA = 2;
      const rankAug = Math.abs(target[2]) > 1e-4 ? 3 : 2;

      let lockMsg = '';
      if (totalDist < 0.25) {
        lockMsg = '<div style="color: #16a34a; font-weight: bold; margin-top: 6px;">🎉 MISSION ACCOMPLISHED! Target touched!</div>';
      } else if (rankA < rankAug) {
        lockMsg = `<div style="color: #dc2626; font-weight: bold; margin-top: 6px;">❌ IMPOSSIBLE! Target floats ${fmt(vertGap, 1)}m above floor. Since Z-button is broken, Rank([A|b]) = 3 > Rank(A) = 2.</div>`;
      } else {
        lockMsg = '<div style="color: #2563eb; margin-top: 6px;">Target is on the floor! Align Button 1 and Button 2 to touch it.</div>';
      }

      statusBox.innerHTML = `
        <div><strong>Character Pos:</strong> (${fmt(charPos[0], 1)}, ${fmt(charPos[1], 1)}, 0.0)</div>
        <div><strong>Target Pos:</strong> (${target[0]}, ${target[1]}, ${target[2]})</div>
        <div><strong>Vertical Distance off Floor (Δz):</strong> ${fmt(vertGap, 2)} units</div>
        <div><strong>Total Distance:</strong> ${fmt(totalDist, 2)} units</div>
        <div style="margin-top: 4px;">
          <strong>Rank Test:</strong> Rank(A) = ${rankA}, Rank([A|b]) = ${rankAug}
        </div>
        ${lockMsg}
      `;

      if (typeof Plotly === 'undefined') return;

      const traces = [
        // Reachable floor mesh (Span of Button 1 and Button 2)
        {
          type: 'mesh3d',
          x: [-5, 5, 5, -5],
          y: [-5, -5, 5, 5],
          z: [0, 0, 0, 0],
          opacity: 0.25,
          color: '#3b82f6',
          name: 'Working Floor (C(A))'
        },
        // Target Orb
        {
          type: 'scatter3d',
          mode: 'markers+text',
          x: [target[0]],
          y: [target[1]],
          z: [target[2]],
          marker: { size: 9, color: '#ef4444', symbol: 'diamond' },
          text: ['Target b'],
          name: 'Target Orb'
        },
        // Character Position
        {
          type: 'scatter3d',
          mode: 'markers+lines+text',
          x: [0, charPos[0]],
          y: [0, charPos[1]],
          z: [0, 0],
          line: { color: '#fbbf24', width: 6 },
          marker: { size: 8, color: '#fbbf24' },
          text: ['', 'Player'],
          name: 'Player'
        },
        // Vertical dashed gap line to target
        {
          type: 'scatter3d',
          mode: 'lines',
          x: [target[0], target[0]],
          y: [target[1], target[1]],
          z: [0, target[2]],
          line: { color: 'rgba(239, 68, 68, 0.7)', dash: 'dash', width: 3 },
          name: 'Height Gap'
        }
      ];

      const layout = {
        margin: { l: 0, r: 0, b: 0, t: 0 },
        scene: {
          xaxis: { range: [-6, 6], title: 'East (X)' },
          yaxis: { range: [-6, 6], title: 'North (Y)' },
          zaxis: { range: [-1, 5], title: 'Up (Z)' },
          camera: { eye: { x: 1.5, y: -1.7, z: 1.3 } }
        },
        showlegend: false
      };

      Plotly.react(plotContainer, traces, layout, { responsive: true, displayModeBar: false });
    }

    targetSelect.addEventListener('change', (e) => {
      currentTargetIdx = parseInt(e.target.value);
      updatePlot();
    });

    s1.addEventListener('input', (e) => { x1 = parseFloat(e.target.value); updatePlot(); });
    s2.addEventListener('input', (e) => { x2 = parseFloat(e.target.value); updatePlot(); });

    snapBtn.addEventListener('click', () => {
      const target = TARGET_PRESETS[currentTargetIdx].b;
      x1 = target[0];
      x2 = target[1];
      s1.value = x1;
      s2.value = x2;
      updatePlot();
    });

    updatePlot();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 5: NumPy Matrix Rank & Solvability CodeLab                     */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-code-rank', function () {
    LA.codeLab('#lab-code-rank', {
      title: 'NumPy: Automated Solvability Test via matrix_rank()',
      code: `import numpy as np

# System 1: Inconsistent system
A = np.array([[1.0, 2.0],
              [2.0, 4.0]])
b = np.array([5.0, 12.0])

# Compute rank of coefficient matrix A
rank_A = np.linalg.[[[func]]](A)

# Build augmented matrix [A | b] and compute rank
Ab = np.[[[stack_func]]]([A, b])
rank_Ab = np.linalg.matrix_rank(Ab)

print(f"Rank(A): {rank_A}")
print(f"Rank([A | b]): {rank_Ab}")

# Solvability criterion: Rank(A) == Rank([A | b])
is_solvable = (rank_A [[[op]]] rank_Ab)
print(f"Is system solvable? {is_solvable}")`,
      answers: {
        func: ['matrix_rank'],
        stack_func: ['column_stack', 'c_'],
        op: ['==']
      },
      run: (vals, ok, all) => {
        if (!all) return [{ t: 'err', s: 'ValueError: Please complete all code blanks.' }];
        return [
          'Rank(A): 1',
          'Rank([A | b]): 2',
          'Is system solvable? False',
          { t: 'ok', s: '✅ Brilliant! Since Rank(A) = 1 < Rank([A | b]) = 2, the augmented column introduces a contradiction: 0 = 2!' }
        ];
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Self-Check Quiz: Module 6                                          */
  /* ------------------------------------------------------------------ */
  LA.mount('quiz-m6', function () {
    LA.quiz('#quiz-m6', {
      title: 'Module 6 Mastery Self-Check: Independence, Rank & Solvability',
      questions: [
        {
          q: 'If a set of vectors $\\{\\mathbf{v}_1, \\mathbf{v}_2, \\mathbf{v}_3\\}$ is linearly dependent, what does that mean geometrically?',
          options: [
            'At least one vector lies completely within the span of the other vectors.',
            'All three vectors must point along the same straight line.',
            'The vectors are mutually perpendicular.',
            'The vectors cannot be plotted in Cartesian space.'
          ],
          answer: 0,
          explain: 'Linear dependence means redundancy: at least one vector can be constructed as a linear combination of the others, adding zero new dimensions.'
        },
        {
          q: 'What is the relationship between the row rank and column rank of any $m \\times n$ matrix $A$?',
          options: [
            'Row rank always equals column rank (they are the exact same invariant integer).',
            'Row rank is always smaller than column rank.',
            'Column rank equals $n$, while row rank equals $m$.',
            'They are only equal if the matrix is square.'
          ],
          answer: 0,
          explain: 'A fundamental theorem of linear algebra proves that row rank equals column rank for every matrix, equal to the number of pivot entries.'
        },
        {
          q: 'Under what condition does the linear system $A\\mathbf{x} = \\mathbf{b}$ have AT LEAST ONE valid solution?',
          options: [
            '$\\text{Rank}(A) = \\text{Rank}([A \\mid \\mathbf{b}])$',
            '$\\text{Rank}([A \\mid \\mathbf{b}]) > \\text{Rank}(A)$',
            '$\\text{Rank}(A) = 0$',
            'The matrix $A$ must be invertible.'
          ],
          answer: 0,
          explain: 'A solution exists if and only if $\\mathbf{b} \\in C(A)$, which means appending $\\mathbf{b}$ introduces no new pivot: $\\text{Rank}(A) = \\text{Rank}([A \\mid \\mathbf{b}])$.'
        },
        {
          q: 'If a $3 \\times 3$ matrix $A$ has $\\text{Rank}(A) = 2$, how many free variables exist in $A\\mathbf{x} = \\mathbf{0}$?',
          options: [
            '1 free variable ($n - \\text{rank} = 3 - 2 = 1$)',
            '2 free variables',
            '0 free variables',
            '3 free variables'
          ],
          answer: 0,
          explain: 'The number of free variables is always the total number of columns minus the number of pivot columns: $n - \\text{rank}(A) = 3 - 2 = 1$.'
        }
      ]
    });
  });

  /* ------------------------------------------------------------------ */
  /* Assignment MCQs: Module 6                                          */
  /* ------------------------------------------------------------------ */
  LA.mount('assignment-quiz-m6', function () {
    LA.quiz('#assignment-quiz-m6', {
      title: 'Module 6 Conceptual Assignment: Solvability & Dimensionality Analysis',
      questions: [
        {
          q: 'Consider the system: $x_1 + 2x_2 = 5$ and $2x_1 + 4x_2 = 10$. What are $\\text{Rank}(A)$ and $\\text{Rank}([A \\mid \\mathbf{b}])$, and how many solutions exist?',
          options: [
            '$\\text{Rank}(A) = 1$, $\\text{Rank}([A \\mid \\mathbf{b}]) = 1$; Infinitely Many Solutions.',
            '$\\text{Rank}(A) = 1$, $\\text{Rank}([A \\mid \\mathbf{b}]) = 2$; No Solution.',
            '$\\text{Rank}(A) = 2$, $\\text{Rank}([A \\mid \\mathbf{b}]) = 2$; Unique Solution.',
            '$\\text{Rank}(A) = 0$, $\\text{Rank}([A \\mid \\mathbf{b}]) = 0$; Trivial Solution.'
          ],
          answer: 0,
          explain: 'Subtracting $2 \\cdot R_1$ from $R_2$ produces $[0, 0 \\mid 0]$. Both $A$ and $[A \\mid \\mathbf{b}]$ have exactly 1 non-zero pivot row. Since $\\text{rank} = 1 < n = 2$, there is 1 free variable, giving infinitely many solutions along the line!'
        },
        {
          q: 'Can the augmented matrix $[A \\mid \\mathbf{b}]$ EVER have a rank strictly smaller than $\\text{Rank}(A)$?',
          options: [
            'No, adding a column can never decrease the dimension of the column space.',
            'Yes, if $\\mathbf{b}$ is the zero vector.',
            'Yes, if $\\mathbf{b}$ is linearly dependent on the columns of $A$.',
            'Yes, whenever the system has no solution.'
          ],
          answer: 0,
          explain: 'Appending an extra column can either preserve the rank (if $\\mathbf{b} \\in C(A)$) or increase it by 1 (if $\\mathbf{b} \\notin C(A)$). It can NEVER decrease rank!'
        },
        {
          q: 'In the Broken Controller Game, your character movement matrix is $A = \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\\\ 0 & 0 \\end{bmatrix}$. Why is target $\\mathbf{b} = [3, 4, 3]^T$ unreachable?',
          options: [
            'Because $\\mathbf{b}$ has a non-zero Z coordinate, placing it outside the $XY$-plane spanned by the columns of $A$.',
            'Because Button 1 and Button 2 are linearly dependent.',
            'Because the matrix $A$ has 3 columns.',
            'Because the determinant of $A$ is negative.'
          ],
          answer: 0,
          explain: 'The columns of $A$ have $Z=0$, so their span is solely the $XY$ floor plane. Since the target requires $Z=3$, $\\mathbf{b} \\notin C(A)$ and $\\text{Rank}([A \\mid \\mathbf{b}]) = 3 > \\text{Rank}(A) = 2$.'
        },
        {
          q: 'A system $A\\mathbf{x} = \\mathbf{b}$ has 4 equations and 3 unknowns ($4 \\times 3$ matrix $A$). If $\\text{Rank}(A) = 3$ and $\\text{Rank}([A \\mid \\mathbf{b}]) = 3$, what can you conclude?',
          options: [
            'The system has a UNIQUE solution.',
            'The system has infinitely many solutions.',
            'The system has no solution because there are more equations than unknowns.',
            'The system has exactly 3 solutions.'
          ],
          answer: 0,
          explain: 'Since $\\text{Rank}(A) = \\text{Rank}([A \\mid \\mathbf{b}])$, the system is consistent. Because $\\text{rank} = n = 3$ (full column rank), there are 0 free variables ($n - r = 3 - 3 = 0$), guaranteeing a unique solution despite the extra equation!'
        }
      ]
    });
  });

})();
