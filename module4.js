/* =====================================================================
   Module 4: Gaussian Elimination & Row Operations · Interactive Laboratories
   M3 Linear Algebra — Newton School of Technology
   ===================================================================== */
(function () {
  'use strict';
  const { el, M, C, fmt, g, pyf, bmat, setStatus } = LA;

  /* ------------------------------------------------------------------ */
  /* Lab 4.1: Town Square Traffic Network Simulator                     */
  /* Notebook Cell [6]: simulate_town_traffic                           */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-traffic-network', function () {
    const box = LA.lab('#lab-traffic-network', {
      cell: 6,
      icon: '🚗',
      kicker: 'Network Equilibrium & Linear Modeling',
      title: 'Town Square Traffic Network: Flow Conservation & Free Variables',
      onReset: () => {
        wSlider.set(150);
        inASlider.set(200);
        render();
      }
    });

    const wSlider = LA.slider({
      label: 'Bypass Flow w (Free Variable):',
      min: 0,
      max: 250,
      step: 10,
      value: 150,
      color: C.purple,
      onInput: render
    });

    const inASlider = LA.slider({
      label: 'Intersection A Inflow:',
      min: 100,
      max: 300,
      step: 20,
      value: 200,
      color: C.blue,
      onInput: render
    });

    const presetSelect = LA.select({
      label: 'Flow Scenario Preset:',
      options: [
        { value: 'balanced', label: 'Balanced Network (w = 150 cars/hr)' },
        { value: 'low_bypass', label: 'Low Bypass / High x₃ (w = 50 cars/hr)' },
        { value: 'critical_loop', label: 'Critical Capacity (w = 200 cars/hr)' }
      ],
      value: 'balanced',
      onChange: () => {
        if (presetSelect.value === 'balanced') wSlider.set(150);
        else if (presetSelect.value === 'low_bypass') wSlider.set(50);
        else if (presetSelect.value === 'critical_loop') wSlider.set(200);
        render();
      }
    });

    box.controls.append(presetSelect.el, wSlider.el, inASlider.el);

    const plot = new LA.Plot2D(box.stage, {
      xmin: -6, xmax: 6, ymin: -4.5, ymax: 4.5, height: 420, equal: true
    });

    function render() {
      const w = wSlider.value;
      const inA = inASlider.value;

      // Conservation Equations:
      // A: inA + x1 = 100 + x2  => x2 - x1 = inA - 100
      // D: 200 + w = 200 + x1   => x1 = w
      // B: 150 + x2 = 250 + x3  => x2 - x3 = 100
      // C: 300 + x3 = 300 + w   => x3 = w
      const x1 = 150 + (w - 150); // x1 = w
      const x2 = (inA - 100) + x1;
      const x3 = 200 - (w - 150) * 0.8;

      const isReverse = x3 < 0;
      const isHighCongestion = x1 > 220 || x2 > 240 || w > 220;

      if (isReverse) {
        setStatus(box.status, 'bad',
          `<b>Flow Reversal / Gridlock:</b> Flow $x_3 = ${fmt(x3, 0)}$ cars/hr is negative! Traffic would be forced backwards down a one-way branch.`
        );
      } else if (isHighCongestion) {
        setStatus(box.status, 'warn',
          `<b>Congestion Warning:</b> Heavy circulating bypass flow ($w = ${fmt(w, 0)}$ cars/hr) is pushing branch $x_1 = ${fmt(x1, 0)}$ and $x_2 = ${fmt(x2, 0)}$ close to maximum road capacity.`
        );
      } else {
        setStatus(box.status, 'good',
          `<b>Conservation Equilibrium Verified:</b> Total Inflow (850 cars/hr) = Total Outflow (850 cars/hr). The free variable $w = ${fmt(w, 0)}$ circulates inside the closed loop without altering external conservation.`
        );
      }

      plot.render((p) => {
        p.frame({
          grid: false, axes: false, ticks: false,
          title: 'Town Square Roundabout Network (Kirchhoff Flow In = Flow Out)'
        });

        // 4 Intersections
        const A = [-3, 2], B = [3, 2], C = [3, -2], D = [-3, -2];

        // Draw Roundabout Road Segments
        function drawRoad(from, to, flow, name) {
          const col = flow > 220 ? C.red : (flow > 140 ? C.amber : C.green);
          p.arrow(from, to, { color: col, width: 4.5 });
          const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
          p.text(mid, `${name} = ${fmt(flow, 0)}/hr`, {
            color: C.ink, size: 11, bold: true, bg: true,
            dx: from[1] === to[1] ? 0 : 16,
            dy: from[0] === to[0] ? 0 : 12
          });
        }

        // Internal branches
        drawRoad(D, A, x1, 'x₁');
        drawRoad(A, B, x2, 'x₂');
        drawRoad(B, C, x3, 'x₃');
        drawRoad(C, D, w, 'w (Free)');

        // External inputs and outputs
        // Node A
        p.arrow([-5, 3.5], A, { color: C.blue, width: 3 });
        p.text([-5, 3.8], `In A: ${fmt(inA, 0)}`, { color: C.blue, size: 11, bold: true });
        p.arrow(A, [-3, 4], { color: C.slate, width: 2.5 });
        p.text([-3, 4.3], 'Out A: 100', { color: C.slate, size: 10 });

        // Node B
        p.arrow([5, 3.5], B, { color: C.blue, width: 3 });
        p.text([5, 3.8], 'In B: 150', { color: C.blue, size: 11, bold: true });
        p.arrow(B, [5, 2], { color: C.slate, width: 2.5 });
        p.text([5.2, 1.6], 'Out B: 250', { color: C.slate, size: 10 });

        // Node C
        p.arrow([5, -3.5], C, { color: C.blue, width: 3 });
        p.text([5, -3.8], 'In C: 300', { color: C.blue, size: 11, bold: true });
        p.arrow(C, [3, -4], { color: C.slate, width: 2.5 });
        p.text([3, -4.3], 'Out C: 300', { color: C.slate, size: 10 });

        // Node D
        p.arrow([-5, -3.5], D, { color: C.blue, width: 3 });
        p.text([-5, -3.8], 'In D: 200', { color: C.blue, size: 11, bold: true });
        p.arrow(D, [-5, -2], { color: C.slate, width: 2.5 });
        p.text([-5.2, -1.6], 'Out D: 200', { color: C.slate, size: 10 });

        // Intersection Nodes
        [
          { pt: A, label: 'Node A', sub: `Net: ${fmt(inA - 100, 0)}` },
          { pt: B, label: 'Node B', sub: 'Net: -100' },
          { pt: C, label: 'Node C', sub: 'Net: 0' },
          { pt: D, label: 'Node D', sub: 'Net: 0' }
        ].forEach(node => {
          p.point(node.pt, {
            color: '#ffffff', stroke: C.brand, strokeWidth: 3, size: 16,
            label: `${node.label} (${node.sub})`, labelColor: C.navy,
            labelStyle: { dy: -18, bold: true, size: 11 }
          });
        });

        // Center Network Equation Summary
        p.text([0, 0], `Traffic Solution: x = [${fmt(x1, 0)}, ${fmt(x2, 0)}, ${fmt(x3, 0)}]ᵀ + w`, {
          color: C.navy, size: 12, bold: true, bg: true
        });

        p.legend([
          { label: 'Flow < 140 cars/hr (Light)', color: C.green, kind: 'line' },
          { label: '140–220 cars/hr (Moderate)', color: C.amber, kind: 'line' },
          { label: '> 220 cars/hr (Congested)', color: C.red, kind: 'line' },
          { label: 'Bypass w (Free Parameter)', color: C.purple, kind: 'arrow' }
        ], 'tl');
      });

      LA.renderMath(box.status);
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 4.2: Dynamic Rope Simulator (Invariant Solution Space)         */
  /* Notebook Cell [11]: run_enhanced_rope_experiment                   */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-rope-physics', function () {
    const box = LA.lab('#lab-rope-physics', {
      cell: 11,
      icon: '🪢',
      kicker: 'Physical Analogy of Elementary Row Operations',
      title: 'Dynamic Rope Simulator: The Geometry of Invariant Solution Sets',
      onReset: () => {
        opSeg.set('replace');
        paramSlider.set(0.0);
        render();
      }
    });

    const opSeg = LA.seg({
      label: 'Elementary Row Operation:',
      options: [
        { value: 'replace', label: '3. Row Replacement (R₂ ← R₂ − k·R₁)' },
        { value: 'swap', label: '1. Row Swap (R₁ ↔ R₂)' },
        { value: 'scale', label: '2. Row Scaling (R₁ ← c·R₁)' }
      ],
      value: 'replace',
      onChange: () => {
        if (opSeg.value === 'scale') paramSlider.set(1.5);
        else if (opSeg.value === 'replace') paramSlider.set(0.0);
        render();
      }
    });

    const paramSlider = LA.slider({
      label: 'Operation Parameter (k or c):',
      min: -1.0,
      max: 4.0,
      step: 0.1,
      value: 0.0,
      color: C.brand,
      onInput: render
    });

    box.controls.append(opSeg.el, paramSlider.el);

    const plot = new LA.Plot2D(box.stage, {
      xmin: -2, xmax: 6, ymin: -1, ymax: 5, height: 420, equal: true
    });

    function render() {
      const mode = opSeg.value;
      const k = paramSlider.value;

      // Base System:
      // L1: x + 2y = 5  => y = (5 - x)/2
      // L2: 3x + 4y = 11 => y = (11 - 3x)/4
      // Intersection: x* = 1, y* = 2
      const fixedX = 1.0, fixedY = 2.0;

      if (mode === 'replace') {
        const isEliminated = Math.abs(k - 3.0) < 0.05;
        if (isEliminated) {
          setStatus(box.status, 'good',
            `<b>Elimination Multiplier Achieved ($k = 3.0$):</b> The $x$-term is completely cancelled ($3 - 3(1) = 0$). Transformed Line 2 is now strictly horizontal: $-2y = -4 \implies y = 2.0$!`
          );
        } else {
          setStatus(box.status, 'info',
            `<b>Pivoting Line 2:</b> Replacing $R_2 \leftarrow R_2 - (${fmt(k, 1)})R_1$ rotates Line 2 about the fixed solution pin $(1, 2)$. Slide $k \to 3.0$ to eliminate $x$.`
          );
        }
      } else if (mode === 'swap') {
        setStatus(box.status, 'good',
          '<b>Row Swap ($R_1 \longleftrightarrow R_2$):</b> The order of clues is reversed. Colors swap, but the intersection pin $(1, 2)$ does not move a single millimeter!'
        );
      } else {
        setStatus(box.status, 'info',
          `<b>Row Scaling ($R_1 \leftarrow ${fmt(k, 1)} R_1$):</b> Line 1 equation is scaled, but geometrically the line and the intersection pin $(1, 2)$ remain 100% identical.`
        );
      }

      plot.render((p) => {
        p.frame({
          grid: true, axes: true, ticks: true,
          xlabel: 'x', ylabel: 'y',
          title: 'Preserving the Solution Space During Elimination'
        });

        // 1. Ghost of Original Line 2
        p.fn((x) => (11 - 3 * x) / 4, { color: 'rgba(148, 163, 184, 0.45)', width: 1.5, dash: true });

        // 2. Line 1
        const l1Col = mode === 'swap' ? C.orange : C.blue;
        p.fn((x) => (5 - x) / 2, { color: l1Col, width: 3 });

        // 3. Line 2 (Transformed)
        const l2Col = mode === 'swap' ? C.blue : C.orange;
        if (mode === 'replace') {
          // (3 - k)x + (4 - 2k)y = (11 - 5k)
          // y = ((11 - 5k) - (3 - k)x) / (4 - 2k)
          const coeffY = 4 - 2 * k;
          if (Math.abs(coeffY) > 0.01) {
            p.fn((x) => ((11 - 5 * k) - (3 - k) * x) / coeffY, { color: l2Col, width: 3.5 });
          } else {
            // Vertical line x = 1
            p.arrow([1, -1], [1, 5], { color: l2Col, width: 3.5 });
          }
        } else {
          p.fn((x) => (11 - 3 * x) / 4, { color: l2Col, width: 3.5 });
        }

        // Horizontal Guide line if k ≈ 3.0
        if (mode === 'replace' && Math.abs(k - 3.0) < 0.15) {
          p.fn(() => 2.0, { color: C.green, width: 2, dash: true });
          p.text([4, 2.3], 'Horizontal: y = 2.0 (Isolated)', { color: C.green, size: 11, bold: true });
        }

        // Pinned Solution Node (1, 2)
        p.point([fixedX, fixedY], {
          color: C.gold, stroke: '#ffffff', strokeWidth: 3, size: 16,
          label: '📍 Fixed Solution Pin (1, 2)', labelColor: C.ink,
          labelStyle: { dx: 14, dy: -14, bold: true, size: 12 }
        });

        p.legend([
          { label: 'Line 1: x + 2y = 5', color: l1Col, kind: 'line' },
          { label: mode === 'replace' ? `Transformed Line 2 (k = ${fmt(k, 1)})` : 'Line 2: 3x + 4y = 11', color: l2Col, kind: 'line' },
          { label: 'Original Line 2 (Ghost Trail)', color: 'rgba(148, 163, 184, 0.7)', kind: 'dash' },
          { label: 'Pinned Intersection (1, 2)', color: C.gold, kind: 'point' }
        ], 'tr');
      });

      LA.renderMath(box.status);
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 4.3: Interactive Row Echelon Stepper                            */
  /* Notebook Cell [13]: StepByStepGaussianElimination                  */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-echelon-stepper', function () {
    const box = LA.lab('#lab-echelon-stepper', {
      cell: 13,
      icon: '🪜',
      kicker: 'Algorithmic Step-by-Step Echelon Reduction',
      title: 'The Systematic Pivot Engine: Forward Elimination to Echelon Form U',
      onReset: () => {
        presetSel.set('std');
        currentStep = 0;
        render();
      }
    });

    let currentStep = 0;

    const PRESETS = {
      std: {
        name: 'Standard 3×3 (Full Rank)',
        steps: [
          {
            mat: [[2, 1, 1], [4, -6, 0], [-2, 7, 2]],
            op: 'Initial Dense Matrix A',
            pivot: [0, 0], target: null, m: null,
            desc: 'Identify first pivot at row 1, col 1: Pivot = 2.0.'
          },
          {
            mat: [[2, 1, 1], [0, -8, -2], [-2, 7, 2]],
            op: 'R₂ ← R₂ − (2.0)·R₁',
            pivot: [0, 0], target: [1, 0], m: 2.0,
            desc: 'Multiplier m₂₁ = 4/2 = 2.0. Subtract 2·R₁ from R₂ to zero out A₂₁.'
          },
          {
            mat: [[2, 1, 1], [0, -8, -2], [0, 8, 3]],
            op: 'R₃ ← R₃ − (-1.0)·R₁',
            pivot: [0, 0], target: [2, 0], m: -1.0,
            desc: 'Multiplier m₃₁ = -2/2 = -1.0. Subtract (-1)·R₁ from R₃ to zero out A₃₁.'
          },
          {
            mat: [[2, 1, 1], [0, -8, -2], [0, 8, 3]],
            op: 'Advance to Column 2',
            pivot: [1, 1], target: null, m: null,
            desc: 'Identify second pivot at row 2, col 2: Pivot = -8.0.'
          },
          {
            mat: [[2, 1, 1], [0, -8, -2], [0, 0, 1]],
            op: 'R₃ ← R₃ − (-1.0)·R₂',
            pivot: [1, 1], target: [2, 1], m: -1.0,
            desc: 'Multiplier m₃₂ = 8/(-8) = -1.0. Subtract (-1)·R₂ from R₃. Row 3 is cleared!'
          },
          {
            mat: [[2, 1, 1], [0, -8, -2], [0, 0, 1]],
            op: 'Upper Triangular Form U Achieved!',
            pivot: null, target: null, m: null,
            desc: 'All entries below main diagonal are zero! Pivots on diagonal: [2, -8, 1]. Determinant = 2 × (-8) × 1 = -16.'
          }
        ]
      },
      swap: {
        name: 'Pivot Zero: Row Swap Required',
        steps: [
          {
            mat: [[0, 2, 3], [1, -1, 1], [2, 1, 4]],
            op: 'Initial Matrix (Zero Pivot at A₁₁)',
            pivot: [0, 0], target: null, m: null,
            desc: 'Entry A₁₁ = 0. Division by zero is impossible! A row swap is mandatory.'
          },
          {
            mat: [[1, -1, 1], [0, 2, 3], [2, 1, 4]],
            op: 'R₁ ⟷ R₂ (Row Swap)',
            pivot: [0, 0], target: null, m: null,
            desc: 'Swapped Row 1 and Row 2. New valid non-zero pivot at A₁₁ = 1.0!'
          },
          {
            mat: [[1, -1, 1], [0, 2, 3], [0, 3, 2]],
            op: 'R₃ ← R₃ − (2.0)·R₁',
            pivot: [0, 0], target: [2, 0], m: 2.0,
            desc: 'Eliminate entry below pivot at A₃₁ using multiplier m₃₁ = 2/1 = 2.0.'
          },
          {
            mat: [[1, -1, 1], [0, 2, 3], [0, 0, -2.5]],
            op: 'R₃ ← R₃ − (1.5)·R₂',
            pivot: [1, 1], target: [2, 1], m: 1.5,
            desc: 'Pivot 2 at A₂₂ = 2.0. Multiplier m₃₂ = 3/2 = 1.5. Matrix reached Echelon Form U!'
          }
        ]
      }
    };

    const presetSel = LA.select({
      label: 'Matrix Configuration:',
      options: [
        { value: 'std', label: '1. Standard 3×3 (Pivots: 2, -8, 1)' },
        { value: 'swap', label: '2. Pivot Zero (Row Swap Mandatory)' }
      ],
      value: 'std',
      onChange: () => {
        currentStep = 0;
        render();
      }
    });

    const btnPrev = LA.btn('← Previous Step', () => {
      if (currentStep > 0) { currentStep--; render(); }
    }, 'ghost small');

    const btnNext = LA.btn('Next Step →', () => {
      const maxSteps = PRESETS[presetSel.value].steps.length - 1;
      if (currentStep < maxSteps) { currentStep++; render(); }
    }, 'primary small');

    box.controls.append(presetSel.el, btnPrev, btnNext);

    function render() {
      const cfg = PRESETS[presetSel.value];
      const maxSteps = cfg.steps.length - 1;
      const stepData = cfg.steps[currentStep];

      btnPrev.disabled = currentStep === 0;
      btnNext.disabled = currentStep === maxSteps;

      setStatus(box.status, currentStep === maxSteps ? 'good' : 'info',
        `<b>Step ${currentStep + 1} of ${maxSteps + 1} · ${stepData.op}:</b> ${stepData.desc}`
      );

      // Render Visual Matrix Stage
      box.stage.innerHTML = '';
      const wrap = el('div', {
        style: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', padding: '20px'
        }
      });

      // Step Tag
      const stepBadge = el('div', {
        style: {
          fontSize: '13px', fontWeight: '800', letterSpacing: '0.06em',
          textTransform: 'uppercase', color: C.brand, background: '#eef2ff',
          padding: '4px 14px', borderRadius: '20px', marginBottom: '16px'
        },
        text: `OPERATION: ${stepData.op}`
      });

      // Matrix Table
      const matEl = el('div', {
        style: {
          display: 'grid', gridTemplateColumns: 'repeat(3, 80px)', gap: '10px',
          borderLeft: `3px solid ${C.brand}`, borderRight: `3px solid ${C.brand}`,
          padding: '10px 18px', borderRadius: '8px', background: '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }
      });

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const val = stepData.mat[r][c];
          const isPivot = stepData.pivot && stepData.pivot[0] === r && stepData.pivot[1] === c;
          const isTarget = stepData.target && stepData.target[0] === r && stepData.target[1] === c;

          const cell = el('div', {
            style: {
              height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'ui-monospace, monospace', fontSize: '16px', fontWeight: '700',
              borderRadius: '6px',
              background: isPivot ? '#fef3c7' : (isTarget ? '#fee2e2' : (val === 0 && r > c ? '#f8fafc' : '#ffffff')),
              border: isPivot ? `2px solid ${C.amber}` : (isTarget ? `2px solid ${C.red}` : '1px solid #e2e8f0'),
              color: isPivot ? C.amber : (isTarget ? C.red : (val === 0 && r > c ? '#94a3b8' : C.ink))
            },
            text: fmt(val, 1)
          });
          matEl.append(cell);
        }
      }

      wrap.append(stepBadge, matEl);
      box.stage.append(wrap);

      LA.renderMath(box.status);
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 4.4: Augmented Matrix & Back-Substitution Solver               */
  /* Notebook Cell [16]: render_augmented_solver_html                   */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-augmented-solver', function () {
    const box = LA.lab('#lab-augmented-solver', {
      cell: 16,
      icon: '🧮',
      kicker: 'From Forward Elimination to Exact Variable Extraction',
      title: 'The Complete Solver: Augmented Matrix [A | b] & Back-Substitution',
      onReset: () => {
        caseSel.set('unique');
        stepIdx = 0;
        render();
      }
    });

    let stepIdx = 0;

    const SYSTEMS = {
      unique: {
        name: 'Unique Solution System',
        steps: [
          {
            aug: [[2, 1, -1, 5], [-3, -1, 2, -7], [-2, 1, 2, -2]],
            phase: 'Initial Augmented Matrix [A | b]',
            desc: 'We concatenate coefficients A with constants vector b: $[A \mid \mathbf{b}]$.'
          },
          {
            aug: [[2, 1, -1, 5], [0, 0.5, 0.5, 0.5], [0, 2, 1, 3]],
            phase: 'Phase 1: Forward Elimination (Column 1)',
            desc: 'Eliminated entries below pivot 1: $R_2 \leftarrow R_2 - (-1.5)R_1$ and $R_3 \leftarrow R_3 - (-1)R_1$.'
          },
          {
            aug: [[2, 1, -1, 5], [0, 0.5, 0.5, 0.5], [0, 0, -1, 1]],
            phase: 'Phase 1: Forward Elimination Complete (Echelon Form [U | c])',
            desc: 'Eliminated entry below pivot 2: $R_3 \leftarrow R_3 - (4.0)R_2$. Matrix is now upper triangular!'
          },
          {
            aug: [[2, 1, -1, 5], [0, 0.5, 0.5, 0.5], [0, 0, -1, 1]],
            phase: 'Phase 2: Back-Substitution (Solving z)',
            desc: 'Last row yields $-1 z = 1 \implies z = -1.0$.'
          },
          {
            aug: [[2, 1, -1, 5], [0, 0.5, 0.5, 0.5], [0, 0, -1, 1]],
            phase: 'Phase 2: Back-Substitution (Solving y)',
            desc: 'Substitute $z = -1$ into row 2: $0.5y + 0.5(-1) = 0.5 \implies 0.5y = 1.0 \implies y = 2.0$.'
          },
          {
            aug: [[2, 1, -1, 5], [0, 0.5, 0.5, 0.5], [0, 0, -1, 1]],
            phase: 'Phase 2: Complete! (Solving x)',
            desc: 'Substitute $y = 2, z = -1$ into row 1: $2x + 1(2) - 1(-1) = 5 \implies 2x + 3 = 5 \implies x = 1.0$! Solution: $(x, y, z) = (1, 2, -1)$.'
          }
        ]
      },
      inconsistent: {
        name: 'Inconsistent System (0 = 3 Contradiction)',
        steps: [
          {
            aug: [[1, 1, 1, 2], [2, 2, 2, 7], [1, -1, 2, 1]],
            phase: 'Initial Augmented Matrix',
            desc: 'System representing parallel planes.'
          },
          {
            aug: [[1, 1, 1, 2], [0, 0, 0, 3], [0, -2, 1, -1]],
            phase: 'Contradiction Detected!',
            desc: 'Operation $R_2 \leftarrow R_2 - 2 R_1$ reveals: $0x + 0y + 0z = 3 \implies 0 = 3$. This is mathematically impossible! System has <b>0 solutions (Empty Set $\emptyset$)</b>.'
          }
        ]
      }
    };

    const caseSel = LA.select({
      label: 'System Scenario:',
      options: [
        { value: 'unique', label: '1. Unique Solution System (Solvable)' },
        { value: 'inconsistent', label: '2. Inconsistent System (Contradiction 0 = c)' }
      ],
      value: 'unique',
      onChange: () => { stepIdx = 0; render(); }
    });

    const btnNext = LA.btn('Next Step →', () => {
      const max = SYSTEMS[caseSel.value].steps.length - 1;
      if (stepIdx < max) { stepIdx++; render(); }
    }, 'primary small');

    const btnPrev = LA.btn('← Prev Step', () => {
      if (stepIdx > 0) { stepIdx--; render(); }
    }, 'ghost small');

    box.controls.append(caseSel.el, btnPrev, btnNext);

    function render() {
      const sys = SYSTEMS[caseSel.value];
      const max = sys.steps.length - 1;
      const s = sys.steps[stepIdx];

      btnPrev.disabled = stepIdx === 0;
      btnNext.disabled = stepIdx === max;

      setStatus(box.status, stepIdx === max ? 'good' : 'info',
        `<b>${s.phase}:</b> ${s.desc}`
      );

      box.stage.innerHTML = '';
      const wrap = el('div', {
        style: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', padding: '16px'
        }
      });

      // Augmented Matrix Grid
      const augGrid = el('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#ffffff', padding: '16px 24px', borderRadius: '12px',
          border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
        }
      });

      // Left A Part
      const leftCol = el('div', {
        style: {
          display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gap: '8px',
          borderLeft: `3px solid ${C.brand}`, paddingLeft: '8px'
        }
      });

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const v = s.aug[r][c];
          leftCol.append(el('div', {
            style: {
              height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'ui-monospace, monospace', fontSize: '15px', fontWeight: '700',
              background: v === 0 && r > c ? '#f1f5f9' : '#f8fafc',
              color: v === 0 && r > c ? '#94a3b8' : C.ink, borderRadius: '6px'
            },
            text: fmt(v, 1)
          }));
        }
      }

      // Vertical Divider Bar
      const divBar = el('div', {
        style: { width: '2px', height: '140px', background: C.amber, margin: '0 6px' }
      });

      // Right b Part
      const rightCol = el('div', {
        style: {
          display: 'grid', gridTemplateColumns: '60px', gap: '8px',
          borderRight: `3px solid ${C.brand}`, paddingRight: '8px'
        }
      });

      for (let r = 0; r < 3; r++) {
        const v = s.aug[r][3];
        rightCol.append(el('div', {
          style: {
            height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'ui-monospace, monospace', fontSize: '15px', fontWeight: '800',
            background: '#eef2ff', color: C.brand, borderRadius: '6px'
          },
          text: fmt(v, 1)
        }));
      }

      augGrid.append(leftCol, divBar, rightCol);
      wrap.append(augGrid);
      box.stage.append(wrap);

      LA.renderMath(box.status);
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 4.5: Dynamic 2D Line Elimination Visualizer                    */
  /* Notebook Cell [18]: plot_line_elimination_lab                      */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-line-elimination', function () {
    const box = LA.lab('#lab-line-elimination', {
      cell: 18,
      icon: '📐',
      kicker: 'Row Operations as Line Rotations in ℝ²',
      title: 'Geometric Line Elimination: Watching Line 2 Become Horizontal',
      onReset: () => {
        kSlider.set(0.0);
        render();
      }
    });

    const kSlider = LA.slider({
      label: 'Elimination Multiplier k:',
      min: -1.0,
      max: 4.0,
      step: 0.1,
      value: 0.0,
      color: C.teal,
      onInput: render
    });

    box.controls.append(kSlider.el);

    const plot = new LA.Plot2D(box.stage, {
      xmin: -2, xmax: 6, ymin: -1, ymax: 5, height: 400, equal: true
    });

    function render() {
      const k = kSlider.value;
      const isEliminated = Math.abs(k - 3.0) < 0.08;

      if (isEliminated) {
        setStatus(box.status, 'good',
          '<b>Variable x Eliminated!</b> When $k = 3.0$, the $x$-coefficient of transformed Line 2 equals $3 - 3(1) = 0$. Line 2 is now perfectly horizontal ($y = 2.0$), directly exposing the value of $y$!'
        );
      } else {
        setStatus(box.status, 'info',
          `<b>Pivoting Line 2:</b> $(3 - ${fmt(k, 1)})x + (4 - 2(${fmt(k, 1)}))y = (11 - 5(${fmt(k, 1)}))$. Slide $k \to 3.0$ to eliminate $x$.`
        );
      }

      plot.render((p) => {
        p.frame({
          grid: true, axes: true, ticks: true,
          xlabel: 'x', ylabel: 'y',
          title: 'Line 2 Rotating to Horizontal During Forward Elimination'
        });

        // Fixed Solution (1, 2)
        const fixedX = 1.0, fixedY = 2.0;

        // Line 1: x + 2y = 5
        p.fn((x) => (5 - x) / 2, { color: C.brand, width: 3 });

        // Line 2: (3 - k)x + (4 - 2k)y = (11 - 5k)
        const coeffY = 4 - 2 * k;
        if (Math.abs(coeffY) > 0.02) {
          p.fn((x) => ((11 - 5 * k) - (3 - k) * x) / coeffY, {
            color: isEliminated ? C.green : C.orange, width: 3.5
          });
        }

        // Pinned Node (1, 2)
        p.point([fixedX, fixedY], {
          color: C.gold, stroke: '#ffffff', strokeWidth: 3, size: 16,
          label: 'Intersection (1, 2)', labelColor: C.ink,
          labelStyle: { dx: 12, dy: -12, bold: true }
        });

        p.legend([
          { label: 'Line 1: x + 2y = 5 (Pivot Row)', color: C.brand, kind: 'line' },
          { label: `Line 2': (L₂ − ${fmt(k, 1)}·L₁)`, color: isEliminated ? C.green : C.orange, kind: 'line' },
          { label: 'Fixed Point (1, 2)', color: C.gold, kind: 'point' }
        ], 'tr');
      });

      LA.renderMath(box.status);
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Code Lab 1: Augmented Matrix Construction                          */
  /* Notebook Cell [23]                                                 */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-code-augmented', function () {
    LA.codeLab('#lab-code-augmented', {
      id: 'm4-c1',
      title: 'Challenge 1: Construct Augmented Matrix [A | b] in NumPy',
      intro: 'Construct the augmented matrix $[A \mid \mathbf{b}]$ for the system: $x + 2y = 5$ and $3x + 4y = 11$.',
      code: `import numpy as np

# Row 1: x + 2y = 5
# Row 2: 3x + 4y = 11

A_aug = np.array([
    [1.0, 2.0, [[[b1]]]],
    [3.0, [[[a2]]], 11.0]
], dtype=float)

print("Augmented Matrix [A | b]:")
print(A_aug)
print(f"Shape: {A_aug.shape}")`,
      answers: {
        b1: ['5', '5.0'],
        a2: ['4', '4.0']
      },
      run: (vals, ok, all) => {
        if (!all) return [{ t: 'err', s: 'ValueError: Incomplete coefficient entries.' }];
        return [
          'Augmented Matrix [A | b]:',
          '[[ 1.  2.  5.]\n [ 3.  4. 11.]]',
          { t: 'ok', s: '✅ Augmented Matrix Successfully Constructed! Shape: (2, 3).' }
        ];
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Code Lab 2: Row Elimination Multiplier                             */
  /* Notebook Cell [25]                                                 */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-code-elimination-step', function () {
    LA.codeLab('#lab-code-elimination-step', {
      id: 'm4-c2',
      title: 'Challenge 2: Elimination Multiplier & Row Replacement',
      intro: 'Calculate the pivot multiplier $m_{21} = \frac{A_{21}}{A_{11}}$ and zero out entry $A_{21}$ in Row 2.',
      code: `import numpy as np

M = np.array([
    [1.0, 2.0, 5.0],
    [3.0, 4.0, 11.0]
])

# Pivot entry at (0, 0) is 1.0
# Target entry at (1, 0) is 3.0
# Formula: multiplier = M[1, 0] / M[0, 0]
multiplier = [[[mult]]]

# Execute elementary row operation: R2 = R2 - multiplier * R1
M[1, :] = M[1, :] - multiplier * M[0, :]

print("Matrix After Forward Elimination:")
print(M)`,
      answers: {
        mult: ['3', '3.0', '3/1']
      },
      run: (vals, ok, all) => {
        if (!all) return [{ t: 'err', s: 'ValueError: Incorrect multiplier ratio.' }];
        return [
          'Matrix After Forward Elimination:',
          '[[ 1.  2.  5.]\n [ 0. -2. -4.]]',
          { t: 'ok', s: '✅ Row Elimination Succeeded! A₂₁ is now exactly 0.0. Back-substitution yields y = -4/(-2) = 2.0.' }
        ];
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Self-Check Mastery Quiz: Module 4                                  */
  /* ------------------------------------------------------------------ */
  LA.mount('quiz-m4', function () {
    LA.quiz('#quiz-m4', {
      title: 'Module 4 Mastery Self-Check: Elimination & Row Operations',
      questions: [
        {
          q: 'Why does replacing Row 2 with $R_2 - m R_1$ <b>never alter the solution set</b> of a linear system?',
          options: [
            'Because multiplying equations changes the slope without changing coordinates.',
            'Because any coordinate pair $(x^*, y^*)$ that satisfies both $R_1$ and $R_2$ automatically satisfies any linear combination of them: $0 - m(0) = 0$.',
            'Because row operations only apply to homogeneous systems.'
          ],
          answer: 1,
          explain: 'Linear combinations of valid equations are also valid equations. The intersection point $(x^*, y^*)$ remains an invariant pinned center of rotation.'
        },
        {
          q: 'During Gaussian Elimination, what should you do if the diagonal entry $A_{ii}$ is <b>zero</b>, but there is a non-zero entry below it?',
          options: [
            'Stop the algorithm and declare that no solution exists.',
            'Perform a Row Swap ($R_i \longleftrightarrow R_j$) with a lower row having a non-zero entry in that column.',
            'Multiply the row by 0 to clear it.'
          ],
          answer: 1,
          explain: 'A zero pivot prevents division by zero ($m = \frac{A_{ji}}{0}$). Swapping rows brings a non-zero pivot to the diagonal, legally rescuing the elimination algorithm.'
        },
        {
          q: 'In echelon form, what does a row of the form $[0, 0, 0 \mid 5]$ indicate about the system $A\mathbf{x} = \mathbf{b}$?',
          options: [
            'The system has infinitely many solutions.',
            'The system has a unique solution at $z = 5$.',
            'The system is inconsistent (0 solutions / Empty Set $\emptyset$), because $0x + 0y + 0z = 5$ is impossible.'
          ],
          answer: 2,
          explain: 'A row of zeros equating to a non-zero constant ($0 = 5$) is an algebraic contradiction representing parallel non-intersecting planes.'
        },
        {
          q: 'In Back-Substitution, why do we solve from <b>bottom to top</b> ($x_n \to x_1$)?',
          options: [
            'Because the bottom equation in an echelon matrix contains only one unknown ($u_{nn} x_n = c_n$), which can be solved immediately and substituted upwards.',
            'Because top-down solving produces fractional determinants.',
            'Because computers naturally store arrays in reverse order.'
          ],
          answer: 0,
          explain: 'Upper triangular matrices decouple the variables: the last equation has 1 unknown, the second to last has 2, and so on.'
        },
        {
          q: 'In the Town Square Roundabout network, what does the <b>free variable $w$</b> represent physically?',
          options: [
            'The total number of traffic accidents per hour.',
            'An unconstrained circulation loop: vehicles can circle the roundabout continuously without affecting external inflows or outflows.',
            'A road closure that eliminates unique solvability.'
          ],
          answer: 1,
          explain: 'A circulation loop in a closed network creates a 1D degree of freedom ($N(A)$ nullspace direction), meaning any volume $w$ can flow in that loop without altering external conservation.'
        }
      ]
    });
  });

  /* ------------------------------------------------------------------ */
  /* Assignment Conceptual MCQs: Module 4                               */
  /* Strictly aligned with LA_Notebook_2.ipynb Cells 0–25               */
  /* ------------------------------------------------------------------ */
  LA.mount('assignment-quiz-m4', function () {
    LA.quiz('#assignment-quiz-m4', {
      title: 'Module 4 Assignment Conceptual MCQs: Systematic Elimination',
      questions: [
        {
          q: 'Why is multiplying an equation by $c = 0$ strictly <b>forbidden</b> as an Elementary Row Operation (ERO)?',
          options: [
            'Because computers cannot divide by zero.',
            'Because multiplying by zero collapses the equation to $0 = 0$, destroying information and making the operation irreversible.',
            'Because zero is not a real number.',
            'Because it only changes the right-hand side constant.'
          ],
          answer: 1,
          explain: 'An operation is mathematically legitimate only if it is completely reversible. If you multiply by $c \neq 0$, you can reverse it by dividing by $c$. Multiplying by 0 collapses everything to $0 = 0$, erasing the constraint permanently and enlarging the solution set to the entire universe!'
        },
        {
          q: 'To eliminate entry $A_{21} = 6$ using pivot $A_{11} = 2$ in row 1, what row multiplier $m_{21}$ must you subtract from Row 2 ($R_2 \longleftarrow R_2 - m_{21} R_1$)?',
          options: [
            '$m_{21} = 2$',
            '$m_{21} = 3$',
            '$m_{21} = -3$',
            '$m_{21} = 1/3$'
          ],
          answer: 1,
          explain: 'The multiplier formula is $m_{ji} = \frac{A_{ji}}{A_{ii}} = \frac{6}{2} = 3$. Then $R_2 - 3 R_1$ gives $6 - 3(2) = 0$, eliminating the entry in column 1.'
        },
        {
          q: 'In the Town Square Roundabout Traffic Network, why does an internal circular loop naturally create a <b>free variable</b> ($x_3 = 200 - w$)?',
          options: [
            'Because cars are not allowed to turn right.',
            'Because internal circulating traffic can loop indefinitely without altering external boundary inflows or outflows.',
            'Because the matrix has more rows than columns.',
            'Because the flow speed is variable.'
          ],
          answer: 1,
          explain: 'Kirchhoff’s law balances inflows and outflows at each junction node. Any circulation $w$ around a closed loop cancels out across the junctions, leaving one unconstrained degree of freedom (free variable).'
        },
        {
          q: 'What is the primary computational reason for converting $[A \mid \mathbf{b}]$ to Upper Triangular Echelon Form $[U \mid \mathbf{c}]$?',
          options: [
            'It makes the determinant easier to memorize.',
            'It uncouples the variables, allowing the last variable $x_n$ to be solved instantly and back-substituted upwards in $O(n^2)$ steps.',
            'It guarantees that every linear system has a unique solution.',
            'It turns matrix multiplication into addition.'
          ],
          answer: 1,
          explain: 'Upper triangular form isolates the last variable in a single equation ($u_{nn} x_n = c_n$). Once $x_n$ is solved, back-substitution systematically unravels the preceding variables one by one with zero trial and error.'
        }
      ]
    });
  });

})();
