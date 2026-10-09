/* =====================================================================
   Module 5: Matrix Factorization & LU Decomposition (A = LU)
   Interactive Laboratories · Newton School of Technology
   Strictly aligned with LA_Notebook_2.ipynb Cells 26–44
   ===================================================================== */
(function () {
  'use strict';
  const { el, M, C, fmt, g, pyf, bmat, setStatus } = LA;

  /* ------------------------------------------------------------------ */
  /* Lab 5.1: Dynamic Elementary Matrix Factory & Inverse Undo Engine   */
  /* Notebook Cell [31]: run_elementary_matrix_lab                      */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-elementary-factory', function () {
    const box = LA.lab('#lab-elementary-factory', {
      cell: 31,
      icon: '🏭',
      kicker: 'Elementary Matrices & Inverses · Cell 31',
      title: 'Elementary Matrix Factory: Matrix Multiplication as Row Operations',
      onReset: () => {
        opSel.value = 'elim';
        kSlider.set(2.0);
        render();
      }
    });

    const opSel = LA.select({
      label: 'Select Elementary Row Operation:',
      options: [
        { value: 'elim', label: 'Elimination: R₂ ← R₂ − k·R₁' },
        { value: 'scale', label: 'Scaling: R₂ ← c·R₂ (c ≠ 0)' },
        { value: 'swap', label: 'Swap: R₁ ↔ R₂' }
      ],
      value: 'elim',
      onChange: render
    });

    const kSlider = LA.slider({
      label: 'Operation Parameter (k or c):',
      min: -3.0,
      max: 4.0,
      step: 0.5,
      value: 2.0,
      color: C.blue,
      onInput: render
    });

    box.controls.append(opSel.el, kSlider.el);

    const stageWrap = el('div', { class: 'mat-eq' });
    box.stage.append(stageWrap);

    // Initial Test Matrix A (from Notebook 2 Cell 31)
    const A = [
      [2.0, 1.0, 3.0],
      [4.0, 5.0, 7.0],
      [1.0, 2.0, 4.0]
    ];

    function render() {
      const op = opSel.value;
      const k = kSlider.value;

      // Construct E and E_inv
      let E = M.eye(3);
      let E_inv = M.eye(3);
      let opDesc = '';

      if (op === 'elim') {
        E[1][0] = -k;
        E_inv[1][0] = k;
        opDesc = `Row Replacement: R₂ ← R₂ − (${fmt(k, 1)})·R₁. Notice entry (2, 1) of E is <b>-${fmt(k, 1)}</b>, while E⁻¹ has <b>+${fmt(k, 1)}</b>.`;
      } else if (op === 'scale') {
        const c = Math.abs(k) < 0.1 ? 1.0 : k;
        E[1][1] = c;
        E_inv[1][1] = 1.0 / c;
        opDesc = `Row Scaling: R₂ ← (${fmt(c, 1)})·R₂. Inverse scales by 1/c = <b>${fmt(1.0/c, 2)}</b>.`;
      } else {
        E = [[0, 1, 0], [1, 0, 0], [0, 0, 1]];
        E_inv = [[0, 1, 0], [1, 0, 0], [0, 0, 1]];
        opDesc = `Row Swap: R₁ ↔ R₂. A swap matrix is its own inverse (E⁻¹ = E)!`;
      }

      const EA = M.mul(E, A);
      const restoredA = M.mul(E_inv, EA);

      setStatus(box.status, 'good',
        `<b>⚙️ Elementary Operator Encoded:</b> ${opDesc}<br>` +
        `<b>Reversibility Theorem:</b> The "Undo" matrix strictly restores the initial matrix: $E^{-1}(EA) = A$!`
      );

      stageWrap.innerHTML = '';

      function drawBox(mat, title, color, bg) {
        const wrap = el('div', { class: 'mat-fig' });
        wrap.append(el('div', { class: 'cap', style: { color }, text: title }));
        const grid = el('div', { class: 'mat-grid', style: { gridTemplateColumns: 'repeat(3, 38px)', borderColor: color, background: bg } });
        mat.forEach(row => {
          row.forEach(val => {
            grid.append(el('div', { text: fmt(val, 1) }));
          });
        });
        wrap.append(grid);
        return wrap;
      }

      stageWrap.append(drawBox(E, 'Elementary E', C.blue, '#EFF6FF'));
      stageWrap.append(el('span', { class: 'sym', text: '·' }));
      stageWrap.append(drawBox(A, 'Initial A', C.slate, '#F8FAFC'));
      stageWrap.append(el('span', { class: 'sym', text: '=' }));
      stageWrap.append(drawBox(EA, 'Transformed EA', C.green, '#F0FDF4'));
      stageWrap.append(el('span', { class: 'sym', text: '   ⟹   ' }));
      stageWrap.append(drawBox(E_inv, 'Undo E⁻¹', C.orange, '#FFFBEB'));
      stageWrap.append(el('span', { class: 'sym', text: '·' }));
      stageWrap.append(drawBox(EA, 'EA', C.green, '#F0FDF4'));
      stageWrap.append(el('span', { class: 'sym', text: '=' }));
      stageWrap.append(drawBox(restoredA, 'Restored A', C.brand, '#EEF2FF'));
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 5.2: Mini-Game — Reverse Engineer the Elementary Operator      */
  /* Notebook Cell [33]: play_matrix_codebreaker                        */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-codebreaker-game', function () {
    const box = LA.lab('#lab-codebreaker-game', {
      cell: 33,
      icon: '🕵️',
      kicker: 'Reverse Engineering Mini-Game · Cell 33',
      title: 'Matrix Codebreaker: Reverse Engineer the Hidden Elementary Operation',
      onReset: () => {
        targetRowSel.value = '3';
        sourceRowSel.value = '1';
        kGuessSlider.set(0.0);
        render();
      }
    });

    const A_game = [
      [1.0, 3.0, 2.0],
      [2.0, 1.0, 4.0],
      [0.0, 2.0, 5.0]
    ];

    // Secret Hidden Operation from Notebook 2 Cell 33: R3 <- R3 - 2*R1
    const SECRET_TARGET = 3;
    const SECRET_SOURCE = 1;
    const SECRET_K = 2.0; // Multiplier subtracted

    // Secret Transformed Target Matrix B
    const E_secret = [
      [1.0, 0.0, 0.0],
      [0.0, 1.0, 0.0],
      [-SECRET_K, 0.0, 1.0]
    ];
    const B_target = M.mul(E_secret, A_game);

    const targetRowSel = LA.select({
      label: 'Target Row (R_target):',
      options: [
        { value: '1', label: 'Row 1' },
        { value: '2', label: 'Row 2' },
        { value: '3', label: 'Row 3' }
      ],
      value: '3',
      onChange: render
    });

    const sourceRowSel = LA.select({
      label: 'Source Row (R_source):',
      options: [
        { value: '1', label: 'Row 1' },
        { value: '2', label: 'Row 2' },
        { value: '3', label: 'Row 3' }
      ],
      value: '1',
      onChange: render
    });

    const kGuessSlider = LA.slider({
      label: 'Subtracted Multiplier (k in R_tgt - k·R_src):',
      min: -4.0,
      max: 4.0,
      step: 0.5,
      value: 0.0,
      color: C.purple,
      onInput: render
    });

    box.controls.append(targetRowSel.el, sourceRowSel.el, kGuessSlider.el);

    const displayWrap = el('div', { class: 'mat-eq' });
    box.stage.append(displayWrap);

    function render() {
      const tgt = parseInt(targetRowSel.value, 10);
      const src = parseInt(sourceRowSel.value, 10);
      const k = kGuessSlider.value;

      let E_guess = M.eye(3);
      if (tgt !== src) {
        E_guess[tgt - 1][src - 1] = -k;
      }

      const B_guess = M.mul(E_guess, A_game);

      // Check if B_guess matches B_target
      let diff = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          diff += Math.abs(B_guess[r][c] - B_target[r][c]);
        }
      }

      const solved = diff < 1e-4;

      if (solved) {
        setStatus(box.status, 'good',
          `<b>🎉 CODE CRACKED! EXCELLENT DEDUCTION!</b><br>` +
          `You successfully reversed the hidden operator: <b>R₃ ← R₃ − (2.0)·R₁</b>.<br>` +
          `Elementary Matrix $E$ has entry $(3, 1) = -2.0$. Transformed matrix perfectly matches the secret target!`
        );
      } else {
        setStatus(box.status, 'info',
          `<b>🕵️ Codebreaker Challenge:</b> Inspect Initial Matrix $A$ and Secret Target $B$. Which row in $B$ differs from $A$?<br>` +
          `Current Guess: $R_{${tgt}} \longleftarrow R_{${tgt}} - (${fmt(k, 1)}) \cdot R_{${src}}$ | Matrix Mismatch Distance: <b>${fmt(diff, 2)}</b>.`
        );
      }

      displayWrap.innerHTML = '';

      function drawBox(mat, title, color, bg) {
        const wrap = el('div', { class: 'mat-fig' });
        wrap.append(el('div', { class: 'cap', style: { color }, text: title }));
        const grid = el('div', { class: 'mat-grid', style: { gridTemplateColumns: 'repeat(3, 38px)', borderColor: color, background: bg } });
        mat.forEach(row => {
          row.forEach(val => {
            grid.append(el('div', { text: fmt(val, 1) }));
          });
        });
        wrap.append(grid);
        return wrap;
      }

      displayWrap.append(drawBox(A_game, 'Initial Matrix A', C.slate, '#F8FAFC'));
      displayWrap.append(el('span', { class: 'sym', text: '  ⟶  ' }));
      displayWrap.append(drawBox(B_guess, `Your Guess EA`, solved ? C.green : C.purple, solved ? '#F0FDF4' : '#FAF5FF'));
      displayWrap.append(el('span', { class: 'sym', text: '  vs  ' }));
      displayWrap.append(drawBox(B_target, 'Secret Mystery Target B', C.red, '#FEF2F2'));
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 5.3: Interactive 2x2 LU Decomposition Sandbox                  */
  /* Notebook Cell [37]: simulate_2x2_lu                                */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-2x2-lu', function () {
    const box = LA.lab('#lab-2x2-lu', {
      cell: 37,
      icon: '🧮',
      kicker: '2x2 Matrix Factorization · Cell 37',
      title: 'Interactive 2×2 LU Decomposition Sandbox: A = L · U',
      onReset: () => {
        a_sl.set(2);
        b_sl.set(3);
        c_sl.set(4);
        d_sl.set(9);
        render();
      }
    });

    const a_sl = LA.slider({ label: 'a (Pivot 1):', min: -5, max: 5, step: 1, value: 2, color: C.blue, onInput: render });
    const b_sl = LA.slider({ label: 'b:', min: -5, max: 5, step: 1, value: 3, color: C.blue, onInput: render });
    const c_sl = LA.slider({ label: 'c (To Eliminate):', min: -5, max: 5, step: 1, value: 4, color: C.orange, onInput: render });
    const d_sl = LA.slider({ label: 'd:', min: -5, max: 5, step: 1, value: 9, color: C.orange, onInput: render });

    box.controls.append(a_sl.el, b_sl.el, c_sl.el, d_sl.el);

    const stageWrap = el('div', { class: 'mat-eq' });
    box.stage.append(stageWrap);

    function render() {
      const a = a_sl.value, b = b_sl.value, c = c_sl.value, d = d_sl.value;

      if (a === 0) {
        setStatus(box.status, 'bad',
          `<b>❌ ZERO PIVOT ERROR (ZeroDivisionError):</b> Entry $a = 0$ cannot serve as a pivot without a row exchange!<br>` +
          `Standard $LU$ decomposition without permutation strictly requires $a \neq 0$.`
        );
        stageWrap.innerHTML = '<div class="status bad">Pivot a = 0 requires Row Swap (PA = LU). Set a ≠ 0 to observe pure LU factorization.</div>';
        return;
      }

      // Multiplier l21 = c / a
      const l21 = c / a;
      // Upper pivot u22 = d - l21 * b
      const u22 = d - l21 * b;

      const L = [
        [1.0, 0.0],
        [l21, 1.0]
      ];

      const U = [
        [a, b],
        [0.0, u22]
      ];

      const LU = M.mul(L, U);

      setStatus(box.status, 'good',
        `<b>✅ Exact Matrix Factorization A = L · U:</b><br>` +
        `Multiplier: $l_{21} = \frac{c}{a} = \frac{${c}}{${a}} = <b>${fmt(l21, 2)}</b>$.<br>` +
        `Lower Triangular $L$ directly holds the multiplier $l_{21}$, while Upper Triangular $U$ holds the pivots!`
      );

      stageWrap.innerHTML = '';

      function drawBox2(mat, title, color, bg) {
        const wrap = el('div', { class: 'mat-fig' });
        wrap.append(el('div', { class: 'cap', style: { color }, text: title }));
        const grid = el('div', { class: 'mat-grid', style: { gridTemplateColumns: 'repeat(2, 44px)', borderColor: color, background: bg } });
        mat.forEach(row => {
          row.forEach(val => {
            grid.append(el('div', { text: fmt(val, 2) }));
          });
        });
        wrap.append(grid);
        return wrap;
      }

      const A_mat = [[a, b], [c, d]];
      stageWrap.append(drawBox2(A_mat, 'Original Matrix A', C.slate, '#F8FAFC'));
      stageWrap.append(el('span', { class: 'sym', text: '=' }));
      stageWrap.append(drawBox2(L, 'Lower Triangular L', C.blue, '#EFF6FF'));
      stageWrap.append(el('span', { class: 'sym', text: '·' }));
      stageWrap.append(drawBox2(U, 'Upper Triangular U', C.orange, '#FFFBEB'));
      stageWrap.append(el('span', { class: 'sym', text: '  (Verified L·U = A)  ' }));
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 5.4: Dynamic Element-by-Element 3x3 LU Decomposition Builder   */
  /* Notebook Cell [40]: launch_dynamic_matrix_lu_builder               */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-3x3-lu-builder', function () {
    const box = LA.lab('#lab-3x3-lu-builder', {
      cell: 40,
      icon: '🏗️',
      kicker: '3x3 Factorization Engine · Cell 40',
      title: 'Dynamic Element-by-Element Matrix LU Decomposition Builder',
      onReset: () => {
        presetSel.value = 'p1';
        render();
      }
    });

    const PRESETS = {
      p1: {
        name: 'Preset 1: Clean Integers',
        A: [[2, 1, 1], [4, -6, 0], [-2, 7, 2]]
      },
      p2: {
        name: 'Preset 2: Textbook System',
        A: [[1, 2, 4], [3, 8, 14], [2, 6, 13]]
      },
      p3: {
        name: 'Preset 3: Symmetric Pattern',
        A: [[2, -1, 0], [-1, 2, -1], [0, -1, 2]]
      }
    };

    const presetSel = LA.select({
      label: 'Select Matrix A Configuration:',
      options: [
        { value: 'p1', label: 'Preset 1: Clean Integers (From Sheet 5)' },
        { value: 'p2', label: 'Preset 2: Textbook System' },
        { value: 'p3', label: 'Preset 3: Symmetric Tri-diagonal' }
      ],
      value: 'p1',
      onChange: render
    });

    box.controls.append(presetSel.el);

    const stageWrap = el('div', { class: 'mat-eq' });
    box.stage.append(stageWrap);

    function render() {
      const A = PRESETS[presetSel.value].A;

      // Forward elimination tracking multipliers
      const U = M.copy(A);
      const L = M.eye(3);

      // Col 1 elimination
      const l21 = U[1][0] / U[0][0];
      L[1][0] = l21;
      for (let j = 0; j < 3; j++) U[1][j] -= l21 * U[0][j];

      const l31 = U[2][0] / U[0][0];
      L[2][0] = l31;
      for (let j = 0; j < 3; j++) U[2][j] -= l31 * U[0][j];

      // Col 2 elimination
      const l32 = U[2][1] / U[1][1];
      L[2][1] = l32;
      for (let j = 0; j < 3; j++) U[2][j] -= l32 * U[1][j];

      const LU = M.mul(L, U);

      setStatus(box.status, 'good',
        `<b>🧩 The Miracle of No Crosstalk:</b><br>` +
        `Elimination multipliers: $l_{21} = <b>${fmt(l21, 2)}</b>$, $l_{31} = <b>${fmt(l31, 2)}</b>$, $l_{32} = <b>${fmt(l32, 2)}</b>$.<br>` +
        `Notice that $L = E_{21}^{-1} E_{31}^{-1} E_{32}^{-1}$ assembles these multipliers with <b>zero algebraic crosstalk</b>! The entries sit peacefully in their exact positions below the main diagonal.`
      );

      stageWrap.innerHTML = '';

      function drawBox3(mat, title, color, bg) {
        const wrap = el('div', { class: 'mat-fig' });
        wrap.append(el('div', { class: 'cap', style: { color }, text: title }));
        const grid = el('div', { class: 'mat-grid', style: { gridTemplateColumns: 'repeat(3, 40px)', borderColor: color, background: bg } });
        mat.forEach(row => {
          row.forEach(val => {
            grid.append(el('div', { text: fmt(val, 2) }));
          });
        });
        wrap.append(grid);
        return wrap;
      }

      stageWrap.append(drawBox3(A, 'Matrix A', C.slate, '#F8FAFC'));
      stageWrap.append(el('span', { class: 'sym', text: '=' }));
      stageWrap.append(drawBox3(L, 'Lower L (Multipliers)', C.blue, '#EFF6FF'));
      stageWrap.append(el('span', { class: 'sym', text: '·' }));
      stageWrap.append(drawBox3(U, 'Upper U (Echelon Pivots)', C.orange, '#FFFBEB'));
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Code Lab 5: Python LU Factorization                                */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-code-lu', function () {
    LA.codeLab('#lab-code-lu', {
      id: 'm5-c1',
      title: 'Challenge 1: Compute LU Factorization in Python with SciPy',
      intro: 'Use scipy.linalg.lu to factorize matrix $A$ into $P, L, U$ and verify that $L @ U = A$.',
      code: `import numpy as np
from scipy.linalg import lu

A = np.array([
    [2.0, 1.0],
    [4.0, 9.0]
])

# Factorize: P is permutation, L is unit lower triangular, U is upper triangular
P, L, U = lu(A)

print("Lower Matrix L:")
print(L)
print("Upper Matrix U:")
print(U)

# Multiplier entry L[1, 0] should equal: 4.0 / 2.0 = [[[l21]]]`,
      answers: {
        l21: ['2', '2.0']
      },
      run: (vals, ok, all) => {
        if (!all) return [{ t: 'err', s: 'ValueError: Incomplete multiplier answer.' }];
        return [
          'Lower Matrix L:',
          '[[1. 0.], [2. 1.]]',
          'Upper Matrix U:',
          '[[2. 1.], [0. 7.]]',
          { t: 'ok', s: '✅ Excellent! L stores multiplier l₂₁ = 2.0, and U stores pivots [2.0, 7.0]!' }
        ];
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Self-Check Quiz: Module 5                                          */
  /* ------------------------------------------------------------------ */
  LA.mount('quiz-m5', function () {
    LA.quiz('#quiz-m5', {
      title: 'Module 5 Mastery Self-Check: Matrix Factorization & LU',
      questions: [
        {
          q: 'If elementary matrix $E_{21}$ subtracts $3 \cdot R_1$ from $R_2$, what does its inverse $E_{21}^{-1}$ look like?',
          options: [
            'It adds $3 \cdot R_1$ to $R_2$ (entry (2, 1) becomes $+3$).',
            'It divides Row 2 by 3.',
            'It is the transpose of $E_{21}$.',
            'It is impossible to invert.'
          ],
          answer: 0,
          explain: 'To undo subtracting $3 R_1$, you simply add $3 R_1$ back! In the matrix $E_{21}^{-1}$, entry $(2, 1)$ is $+3$ instead of $-3$.'
        },
        {
          q: 'Why is the product $L = E_{21}^{-1} E_{31}^{-1} E_{32}^{-1}$ much cleaner than $E_{32} E_{31} E_{21}$?',
          options: [
            'Because in $L$, earlier row operations never modify rows that are subsequently used as pivots, resulting in zero multiplier crosstalk.',
            'Because upper triangular matrices are commutative.',
            'Because inverses eliminate the need for division.'
          ],
          answer: 0,
          explain: 'When inverting in reverse order, each multiplier $l_{ji}$ goes directly into entry $(j, i)$ of $L$ with no algebraic crosstalk!'
        }
      ]
    });
  });

  /* ------------------------------------------------------------------ */
  /* Assignment Conceptual MCQs: Module 5                               */
  /* ------------------------------------------------------------------ */
  LA.mount('assignment-quiz-m5', function () {
    LA.quiz('#assignment-quiz-m5', {
      title: 'Module 5 Assignment Conceptual MCQs: LU Decomposition',
      questions: [
        {
          q: 'In $A = LU$ decomposition without row permutations, what are the entries on the <b>main diagonal of $L$</b>?',
          options: [
            'All entries are strictly 1.',
            'They are the pivots of matrix $A$.',
            'They are all zero.',
            'They depend on the determinant.'
          ],
          answer: 0,
          explain: 'Matrix $L$ is a Unit Lower Triangular matrix, meaning every diagonal entry is $L_{ii} = 1$. The pivots reside entirely on the diagonal of Upper Triangular matrix $U$.'
        },
        {
          q: 'Once matrix $A$ is factored into $A = LU$, how do we solve $A\mathbf{x} = \mathbf{b}$ for many different right-hand sides $\mathbf{b}$?',
          options: [
            'Solve $L\mathbf{c} = \mathbf{b}$ by forward substitution, then solve $U\mathbf{x} = \mathbf{c}$ by back substitution.',
            'Multiply $L$ and $U$ repeatedly.',
            'Compute the inverse $A^{-1}$ from scratch each time.',
            'Perform Gaussian elimination on $\mathbf{b}$ independently.'
          ],
          answer: 0,
          explain: 'Setting $U\mathbf{x} = \mathbf{c}$, we first solve the triangular system $L\mathbf{c} = \mathbf{b}$ ($O(n^2)$ operations), then solve $U\mathbf{x} = \mathbf{c}$ ($O(n^2)$ operations), completely avoiding re-doing $O(n^3)$ elimination!'
        },
        {
          q: 'Under what condition does standard $A = LU$ decomposition <b>fail</b> without row permutations?',
          options: [
            'Whenever a zero pivot ($A_{ii} = 0$) is encountered during elimination.',
            'Whenever matrix $A$ has negative entries.',
            'Whenever the system has infinitely many solutions.',
            'It never fails for square matrices.'
          ],
          answer: 0,
          explain: 'If a diagonal entry becomes zero during elimination, calculating multiplier $l_{ji} = A_{ji}/A_{ii}$ causes a division by zero. We must perform a row exchange, leading to $PA = LU$.'
        },
        {
          q: 'What is the matrix equation representing the elementary row operation $R_2 \longleftarrow R_2 - 4 R_1$ on a $2 \times 2$ matrix $A$?',
          options: [
            '$\begin{bmatrix} 1 & 0 \\ -4 & 1 \end{bmatrix} A$',
            '$\begin{bmatrix} 1 & -4 \\ 0 & 1 \end{bmatrix} A$',
            '$A \begin{bmatrix} 1 & 0 \\ -4 & 1 \end{bmatrix}$',
            '$\begin{bmatrix} -4 & 0 \\ 0 & 1 \end{bmatrix} A$'
          ],
          answer: 0,
          explain: 'Row operations are pre-multiplications (on the left). The elementary matrix has Row 1 as $[1, 0]$ (keeping Row 1) and Row 2 as $[-4, 1]$ (subtracting $4 R_1$ from $R_2$).'
        }
      ]
    });
  });

})();
