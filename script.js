(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Altura real del header (para el scroll a cada sección) ---- */
 
const header = $('.site-header');
const setHeaderH = () =>
  header && document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
setHeaderH();
addEventListener('resize', setHeaderH);


  /* ---- Menú hamburguesa ---- */
const toggle = $('.nav-toggle');
const nav = $('#main-nav');
if (toggle && nav) {
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); }); // cierra al elegir una sección
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  addEventListener('resize', () => { if (innerWidth > 860) setMenu(false); });
}

  /* ---- Aparición escalonada al hacer scroll ---- */
  if (!reduce && 'IntersectionObserver' in window) {
    const count = new Map();
    $$('.section-title, .section-intro, .subtitle, .card, .home > div').forEach((el) => {
      const i = count.get(el.parentElement) || 0;
      count.set(el.parentElement, i + 1);
      el.classList.add('reveal');
      el.style.setProperty('--d', Math.min(i, 5) * 0.12 + 's');
    });
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          el.classList.add('in');
          io.unobserve(el);
          // al terminar, se quita la clase para que el hover de las tarjetas funcione normal
          setTimeout(() => el.classList.remove('reveal', 'in'), 1500);
        }),
      { threshold: 0.12 }
    );
    $$('.reveal').forEach((el) => io.observe(el));
  }

  /* ---- Barra de progreso de lectura ---- */
  const bar = $('.progress');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Enlace activo del menú según la sección visible ---- */
  const links = $$('.main-nav a');
  const spy = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      }),
    { rootMargin: '-45% 0px -50% 0px' }
  );
  $$('#home, #stack, #projects, #education, #footer').forEach((s) => spy.observe(s));

  /* ---- Escritura del texto del Home (mismo texto, solo animado) ---- */
  const headline = $('.home-headline');
  if (headline && !reduce) {
    const text = headline.textContent.trim();
    headline.setAttribute('aria-label', text);
    headline.textContent = '';
    headline.classList.add('typing');
    let i = 0;
    (function type() {
      headline.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(type, 60);
    })();
  }

  /* ---- Luz que sigue al cursor ---- */
  const glow = $('.cursor-glow');
  if (glow && !reduce && matchMedia('(hover: hover)').matches) {
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('pointermove', (e) => {
      x = e.clientX;
      y = e.clientY;
      glow.style.opacity = 1;
    });
    (function follow() {
      cx += (x - cx) * 0.12;
      cy += (y - cy) * 0.12;
      glow.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(follow);
    })();
  }

  /* ---- Partículas conectadas (violeta y rosa) ---- */
  const cv = $('#particles');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d');
    const mouse = { x: -9999, y: -9999 };
    let w, h, dpr, pts = [], raf;

    const init = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.width = innerWidth * dpr;
      h = cv.height = innerHeight * dpr;
      const n = Math.min(70, Math.floor((innerWidth * innerHeight) / 22000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35 * dpr,
        vy: (Math.random() - 0.5) * 0.35 * dpr,
        c: Math.random() < 0.5 ? '139,61,255' : '255,61,139',
      }));
    };

    const line = (x1, y1, x2, y2, color, alpha) => {
      ctx.strokeStyle = `rgba(${color},${alpha})`;
      ctx.lineWidth = dpr * 0.8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const reach = 130 * dpr;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},0.8)`;
        ctx.fill();

        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < reach) line(p.x, p.y, q.x, q.y, p.c, (1 - d / reach) * 0.35);
        }
        const dm = Math.hypot(p.x - mouse.x * dpr, p.y - mouse.y * dpr);
        if (dm < reach * 1.3) line(p.x, p.y, mouse.x * dpr, mouse.y * dpr, '255,255,255', (1 - dm / (reach * 1.3)) * 0.4);
      }
      raf = requestAnimationFrame(draw);
    };

    addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    let t;
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(init, 200); });
    // se pausa cuando la pestaña no está visible
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) draw();
    });
    init();
    draw();
  }
})();
