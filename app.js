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

    // ScrollSpy active link detection
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
    });
  });

  // 6. Real-Time Search Filter
  const searchInput = document.getElementById('lab-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        document.querySelectorAll('.theory-card, .simulation-card, .exercise-card').forEach(el => {
          el.style.display = '';
        });
        return;
      }

      document.querySelectorAll('.theory-card, .simulation-card, .exercise-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(query)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
});
