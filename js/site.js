/* ============================================================
   TPTWO — site.js  (vanilla JS, no dependencies)
   Header, nav, hero slider, scroll reveal, stat counters,
   mailto forms. Page-specific scripts (gallery lightbox, RSP
   accordion, CSR form) live inline on their own pages.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Sticky header shadow ---------- */
  const header = document.getElementById('siteHeader');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile navigation ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    // Only intercept taps on items that really have a dropdown submenu
    document.querySelectorAll('.has-dropdown > a').forEach(link => {
      link.addEventListener('click', e => {
        const hasMenu = link.parentElement.querySelector('.dropdown');
        if (hasMenu && window.innerWidth <= 860) {
          e.preventDefault();
          link.parentElement.classList.toggle('open');
        }
      });
    });
  }

  /* ---------- Hero slider ---------- */
  const slides = document.querySelectorAll('#heroSlider .slide');
  const dotsWrap = document.getElementById('sliderDots');
  if (slides.length) {
    const DURATION = 6000; // ms each slide is shown
    const frame = document.querySelector('.badge-frame');
    const plate = frame && frame.querySelector('.slide-plate');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current = 0;
    let playing = !reduce;      // reduced-motion users start paused
    let hovering = false;
    const bars = [];

    // Slide counter inside the caption plate
    let counter = null;
    if (plate) {
      counter = document.createElement('span');
      counter.className = 'slide-count';
      plate.appendChild(counter);
    }

    const toggle = null; // pause button removed; slider still pauses on hover/focus

    const pad = n => String(n).padStart(2, '0');
    const paused = () => !playing || hovering || document.hidden;

    const syncState = () => {
      if (dotsWrap) {
        dotsWrap.style.setProperty('--slide-dur', DURATION + 'ms');
        dotsWrap.classList.toggle('paused', paused());
        dotsWrap.classList.toggle('static', reduce);
      }
      if (toggle) {
        toggle.setAttribute('aria-label', playing ? 'Pause slideshow' : 'Play slideshow');
        toggle.classList.toggle('is-paused', !playing);
      }
      const slider = document.getElementById('heroSlider');
      if (slider) slider.classList.toggle('kb-paused', paused());
    };

    if (dotsWrap) {
      slides.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Go to slide ' + (i + 1) + ' of ' + slides.length);
        b.addEventListener('click', () => go(i));
        // The active bar fills over DURATION; when it finishes the slider advances
        b.addEventListener('animationend', e => {
          if (e.animationName === 'slideFill' && i === current && !reduce) go(current + 1);
        });
        dotsWrap.appendChild(b);
        bars.push(b);
      });
    }

    const go = i => {
      slides[current].classList.remove('active');
      current = (i + slides.length) % slides.length;
      slides[current].classList.add('active');
      bars.forEach((b, k) => {
        b.classList.toggle('active', k === current);
        b.classList.toggle('seen', k < current);
        if (k === current) { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }
      });
      if (counter) counter.textContent = pad(current + 1) + ' / ' + pad(slides.length);
      syncState();
    };

    const next = document.getElementById('nextSlide');
    const prev = document.getElementById('prevSlide');
    if (next) next.addEventListener('click', () => go(current + 1));
    if (prev) prev.addEventListener('click', () => go(current - 1));

    // Pause while the pointer is over the slider or focus is inside it, and when the tab is hidden
    if (frame) {
      frame.addEventListener('mouseenter', () => { hovering = true; syncState(); });
      frame.addEventListener('mouseleave', () => { hovering = false; syncState(); });
      frame.addEventListener('focusin', () => { hovering = true; syncState(); });
      frame.addEventListener('focusout', () => { hovering = false; syncState(); });
      frame.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') go(current + 1);
        if (e.key === 'ArrowLeft') go(current - 1);
      });
      // Swipe on touch screens
      let x0 = null;
      frame.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
      frame.addEventListener('touchend', e => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
        x0 = null;
      }, { passive: true });
    }
    document.addEventListener('visibilitychange', syncState);

    go(0);
  }

  /* ---------- Stat counters ---------- */
  const animateCount = el => {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    const duration = 1200, t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / duration, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* ---------- Scroll reveal + counters (graceful fallback) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const counters = document.querySelectorAll('.stat-number[data-count]');
  if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => ro.observe(el));

    const co = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(el => co.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
    counters.forEach(el => { el.textContent = el.dataset.count; });
  }

  /* ---------- Contact form → mailto ---------- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const v = id => document.getElementById(id).value.trim();
      const body = `Name: ${v('cf-name')}\nEmail: ${v('cf-email')}\n\n${v('cf-message')}`;
      window.location.href = 'mailto:admin@tptwo.org?subject=' +
        encodeURIComponent(v('cf-subject') || 'Website enquiry') + '&body=' + encodeURIComponent(body);
    });
  }
});


/* ---------- Homepage: traffic-signal intro + slide blink ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const sig = document.getElementById('heroSignal');
  if (!sig || !document.body.classList.contains('home')) return;
  const [r, a, g] = sig.querySelectorAll('.lamp');
  const set = (on) => { [r, a, g].forEach(l => l.classList.remove('on')); if (on) on.classList.add('on'); };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { set(g); return; }
  const body = document.body;
  body.classList.add('signal-hold');
  set(r);
  setTimeout(() => set(a), 800);
  setTimeout(() => { set(g); body.classList.remove('signal-hold'); }, 1500);
  setTimeout(() => body.classList.remove('signal-hold'), 3000);
  // Brief amber blink whenever the slider advances
  const slider = document.getElementById('heroSlider');
  if (slider) {
    let ready = false;
    setTimeout(() => { ready = true; }, 1800);
    new MutationObserver(() => {
      if (!ready) return;
      set(a);
      setTimeout(() => set(g), 450);
    }).observe(slider, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }
});


/* ---------- Back-to-top button (all pages) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML =
    '<svg viewBox="0 0 48 48" aria-hidden="true"><circle class="btt-ring" cx="24" cy="24" r="21" ' +
    'stroke-dasharray="131.9" stroke-dashoffset="131.9"></circle></svg>' +
    '<svg class="btt-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(btn);
  const ring = btn.querySelector('.btt-ring');
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY;
    btn.classList.toggle('show', y > 500);
    if (ring && max > 0) ring.style.strokeDashoffset = String(131.9 * (1 - Math.min(1, y / max)));
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  btn.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    const skip = document.getElementById('mainContent');
    if (skip) skip.focus({ preventScroll: true });
  });
  update();
});