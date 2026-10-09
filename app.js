/**
 * Linear Algebra Lab - Main Application Controller
 * Handles Navigation, TOC ScrollSpy, Theme Switcher, Search, and Exercise Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Switcher (Dark / Light)
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const root = document.documentElement;
  
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('la_lab_theme', theme);
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = theme === 'light' ? '🌙' : '☀️';
      themeToggleBtn.setAttribute('title', theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode');
    }
    window.dispatchEvent(new Event('theme-changed'));
    // Re-typeset math on theme change if needed
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  }

  const savedTheme = localStorage.getItem('la_lab_theme') || 'dark';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // 2. Reading Progress Bar & ScrollSpy
  const progressBar = document.getElementById('reading-progress');
  const tocLinks = document.querySelectorAll('.toc-nav-item a');
  const sections = document.querySelectorAll('section[id], div[id^="module-"], div[id^="sec-"]');

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    let currentId = '';
    const scrollPos = window.scrollY + 140;

    sections.forEach(sec => {
      if (sec.offsetTop <= scrollPos) {
        currentId = sec.getAttribute('id');
      }
    });

    if (currentId) {
      tocLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === `#${currentId}`) {
          link.parentElement.classList.add('active');
        } else {
          link.parentElement.classList.remove('active');
        }
      });
    }
  });

  // 3. Mobile Sidebar Drawer Toggle
  const menuToggleBtn = document.getElementById('menu-toggle-btn');
  const sidebar = document.getElementById('sidebar-toc');
  if (menuToggleBtn && sidebar) {
    menuToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !menuToggleBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // 4. Module Navigation Pills
  const modulePills = document.querySelectorAll('.module-pill-btn');
  modulePills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      modulePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const targetId = pill.dataset.target;
      if (targetId === 'all') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const yOffset = -80;
          const y = targetEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    });
  });

  // 5. Interactive Exercise Accordions (Show/Hide Solution)
  document.querySelectorAll('.toggle-solution-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const solutionCard = btn.nextElementSibling;
      if (!solutionCard) return;

      const isHidden = solutionCard.style.display === 'none' || !solutionCard.style.display;
      solutionCard.style.display = isHidden ? 'block' : 'none';
      btn.textContent = isHidden ? '🙈 Hide Solution & Walkthrough' : '💡 Reveal Solution & Python Code';
      btn.classList.toggle('active', isHidden);

      if (isHidden && window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([solutionCard]);
      }
    });
  });

  // 6. Real-Time Search Filter
  const searchInput = document.getElementById('lab-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        document.querySelectorAll('.theory-block, .simulation-card, .exercise-card').forEach(el => {
          el.style.display = '';
        });
        return;
      }

      document.querySelectorAll('.theory-block, .simulation-card, .exercise-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(query)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // 7. Interactive Conceptual MCQ Quiz Engine
  const mcqExplanations = {
    'm1-q1': {
      text: '<strong>Intuitive Explanation:</strong> In the row picture, finding the intersection requires thinking about 1,000 separate hyperplanes meeting at a single coordinate—an impossible visualization. In the column picture, the equation is clean: we have 1,000 column vectors in $\\mathbb{R}^{1000}$, and we simply seek the weights $x_1, \\dots, x_{1000}$ to reconstruct $\\mathbf{b}$ ($x_1\\mathbf{a}_1 + \\dots + x_{1000}\\mathbf{a}_{1000} = \\mathbf{b}$). This column perspective is the cornerstone of Machine Learning and Least Squares.'
    },
    'm1-q2': {
      text: '<strong>Intuitive Explanation:</strong> Linearity fundamentally means constant, scale-invariant flatness. The rate of change $\\frac{\\Delta y}{\\Delta x} = -\\frac{2}{3}$ is identical everywhere across the plane. In contrast, trigonometric functions have non-constant curvature and periodic ripples, which completely break the superposition principle of linear algebra.'
    },
    'm1-q3': {
      text: '<strong>Intuitive Explanation:</strong> A solution MUST satisfy all equations simultaneously. While any two planes meet along a line, the three pairwise intersection lines are mutually parallel and never meet! Because no single point lies on all three planes at the same time, the solution set is strictly empty ($\\emptyset$). This is the 3D analog of parallel lines in 2D.'
    },
    'm1-q4': {
      text: '<strong>Intuitive Explanation:</strong> The determinant $\\det(A)$ measures the 2D area spanned by the row vectors. When $\\det(A) = 0$, this area collapses to zero, which forces the row vectors to be collinear: $\\frac{a_1}{a_2} = \\frac{b_1}{b_2}$. This means both lines have identical slopes $m_1 = m_2$. If intercepts match, they overlap (infinite solutions); if intercepts differ, they are parallel (0 solutions).'
    },
    'm1-q5': {
      text: '<strong>Intuitive Explanation:</strong> If $A\\mathbf{x} = \\mathbf{0}$ has a non-trivial solution $\\mathbf{x}_0$, then $\\det(A) = 0$. If any particular solution $\\mathbf{x}_p$ exists for $A\\mathbf{x} = \\mathbf{b}$, then $\\mathbf{x}_p + c\\mathbf{x}_0$ is ALSO a valid solution for every scalar $c \\in \\mathbb{R}$, yielding an entire line ($\\infty$) of solutions! If $\\mathbf{b} \\notin \\text{Col}(A)$, there are 0 solutions. Hence, a unique solution is impossible.'
    },
    'm2-q1': {
      text: '<strong>Intuitive Explanation:</strong> Mathematically, $\\mathbf{col}_j(C) = A \\cdot \\mathbf{col}_j(B) = B_{1j}\\mathbf{a}_1 + B_{2j}\\mathbf{a}_2 + \\dots + B_{mj}\\mathbf{a}_m$. This shows that each column of the product is synthesized entirely from the columns of $A$, using only the weights from that specific column of $B$! This is why modifying Dish 2 in the Canteen Menu only alters the second column of the output matrix.'
    },
    'm2-q2': {
      text: '<strong>Intuitive Explanation:</strong> For $AB = 0$, each column of the product $A \\cdot \\mathbf{col}_j(B)$ must equal $\\mathbf{0}$. This means every column of $B$ is a vector in the Nullspace of matrix $A$ ($\\mathbf{col}_j(B) \\in \\text{Null}(A)$). As long as $A$ projects vectors along a certain direction to zero, $B$ can send vectors along that direction, resulting in total collapse to the zero matrix even though neither $A$ nor $B$ is zero!'
    },
    'm2-q3': {
      text: '<strong>Intuitive Explanation:</strong> Matrices represent physical transformations (rotations, reflections, shears). In the real world, sequential transformations do not commute: try rotating a book 90° about the z-axis and then 90° about the x-axis, then reverse the order. The book ends up in two completely different physical orientations! Because matrix composition mirrors physical operation order, $AB \\neq BA$ in general.'
    },
    'm2-q4': {
      text: '<strong>Intuitive Explanation:</strong> An outer product of a column vector $\\mathbf{u}$ and a row vector $\\mathbf{v}^\\top$ produces a matrix whose columns are all scalar multiples of $\\mathbf{u}$, and whose rows are all scalar multiples of $\\mathbf{v}^\\top$. Every outer product has a 1-dimensional column space, meaning its rank is strictly 1! Thus, full matrix multiplication decomposes a complex transformation into the sum of $k$ elementary Rank-1 building blocks.'
    },
    'm2-q5': {
      text: '<strong>Intuitive Explanation:</strong> To decode ANY $2 \\times 2$ matrix, look where its columns send the basis vectors! Column 1 $[0, 1]^\\top$ is the new home of $\\hat{i} = [1, 0]^\\top$. Column 2 $[-1, 0]^\\top$ is the new home of $\\hat{j} = [0, 1]^\\top$. On the Cartesian grid, moving $[1, 0]$ to $[0, 1]$ and $[0, 1]$ to $[-1, 0]$ is exactly a 90° counterclockwise rotation!'
    },
    'm3-q1': {
      text: '<strong>Intuitive Explanation:</strong> A subspace MUST be closed under scalar multiplication. If $W$ is non-empty, pick any vector $\\mathbf{w} \\in W$. By the closure axiom, $c\\mathbf{w}$ must belong to $W$ for EVERY scalar $c \\in \\mathbb{R}$. Setting $c = 0$ gives $0 \\cdot \\mathbf{w} = \\mathbf{0}$. Therefore, if a subset does not contain the origin $\\mathbf{0}$, it IMMEDIATELY fails the subspace test—no further testing required!'
    },
    'm3-q2': {
      text: '<strong>Intuitive Explanation:</strong> Straightness is NOT enough! An affine line shifted away from the origin by $+3$ breaks both fundamental vector space axioms: (1) It does not pass through the origin ($y(0) = 3 \\neq 0$). (2) Vector addition falls off the line: $(0,3) + (1,5) = (1,8)$, which is not on the line ($8 \\neq 2(1) + 3$)! Only straight lines passing through the origin $y = mx$ are genuine 1D vector subspaces of $\\mathbb{R}^2$.'
    },
    'm3-q3': {
      text: '<strong>Intuitive Explanation:</strong> While the intersection of two subspaces is ALWAYS a subspace ($U \\cap W = \\{\\mathbf{0}\\}$), the union is almost NEVER a subspace! Taking a vector purely on the x-axis and adding a vector purely on the y-axis creates a diagonal vector $[1, 1]^\\top$ that escapes the cross-shaped set $U \\cup W$. To form a valid subspace, you must take their SPAN ($U + W = \\mathbb{R}^2$), not their raw union.'
    },
    'm3-q4': {
      text: '<strong>Intuitive Explanation:</strong> Adding a redundant vector (a vector already in the span) does NOT enlarge the reachable universe! Since $\\mathbf{w}$ already lies completely inside the 2D flat plane defined by $\\mathbf{u}$ and $\\mathbf{v}$, any combination $c_1\\mathbf{u} + c_2\\mathbf{v} + c_3\\mathbf{w}$ can be rewritten simply as a combination of $\\mathbf{u}$ and $\\mathbf{v}$. Redundant vectors only create linear dependence without expanding dimension.'
    },
    'm3-q5': {
      text: '<strong>Intuitive Explanation:</strong> Any vector in $\\text{Span}(\\mathbf{u}, \\mathbf{v})$ has coordinates $[2x_1, 2x_2, x_1 + x_2]^\\top$. Notice that the third coordinate MUST be the average of the first two: $z = \\frac{x+y}{2}$. For our target $[2, 2, 4]^\\top$, the average of $x=2$ and $y=2$ is 2, but the target requires $z=4$! The target vector literally hovers 2 units above the subspace plane. No linear combination can ever leave the plane sheet!'
    }
  };

  const moduleScores = { 1: 0, 2: 0, 3: 0 };
  const answeredQuestions = new Set();

  document.querySelectorAll('.mcq-question-card').forEach(card => {
    const qid = card.dataset.qid;
    const correctOpt = card.dataset.correct;
    const feedbackBox = card.querySelector('.mcq-feedback-box');
    const buttons = card.querySelectorAll('.mcq-option-btn');
    const modNum = qid.startsWith('m1') ? 1 : qid.startsWith('m2') ? 2 : 3;

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (answeredQuestions.has(qid)) return;
        answeredQuestions.add(qid);

        const chosenOpt = btn.dataset.opt;
        const isCorrect = (chosenOpt === correctOpt);

        buttons.forEach(b => {
          b.classList.add('disabled');
          if (b.dataset.opt === correctOpt) b.classList.add('correct');
        });

        if (!isCorrect) {
          btn.classList.add('incorrect');
        } else {
          moduleScores[modNum]++;
        }

        const scoreBadge = document.getElementById(`m${modNum}-quiz-score`);
        if (scoreBadge) scoreBadge.textContent = `Score: ${moduleScores[modNum]} / 5`;

        if (feedbackBox) {
          feedbackBox.className = `mcq-feedback-box show ${isCorrect ? 'correct' : 'incorrect'}`;
          const explData = mcqExplanations[qid];
          const explHtml = explData ? explData.text : '';
          feedbackBox.innerHTML = `<div>${isCorrect ? '✅ <strong>Correct!</strong> ' : '❌ <strong>Incorrect.</strong> '}${explHtml}</div>`;

          if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([feedbackBox]);
          }
        }
      });
    });
  });

  // 8. Student Intuition Journals (Persisted in localStorage)
  [1, 2, 3].forEach(m => {
    const input = document.getElementById(`m${m}-reflection-input`);
    const btn = document.getElementById(`m${m}-reflection-btn`);
    const banner = document.getElementById(`m${m}-reflection-banner`);
    const storageKey = `la_lab_reflection_m${m}`;

    if (input) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        input.value = saved;
        if (banner) {
          banner.className = 'student-result-banner show';
          banner.style.background = 'rgba(16, 185, 129, 0.15)';
          banner.style.color = '#10b981';
          banner.innerHTML = '📝 <em>Saved insight loaded from your browser notebook.</em>';
        }
      }
    }

    if (btn && input) {
      btn.addEventListener('click', () => {
        const val = input.value.trim();
        if (!val) return;
        localStorage.setItem(storageKey, val);
        if (banner) {
          banner.className = 'student-result-banner show';
          banner.style.background = 'rgba(16, 185, 129, 0.15)';
          banner.style.color = '#10b981';
          banner.innerHTML = '🎉 <strong>Saved!</strong> Your reflection has been stored in your study notebook.';
        }
      });
    }
  });

});
