(() => {
  const C = window.MRLOOP;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) root.classList.add('js');
  const clamp = n => Math.min(1, Math.max(0, n));

  /* ---------- placeholder drawings for missing images ---------- */
  const HUES = ['#E8A144', '#B9702B', '#D98B3A', '#C9803A', '#E2B35C', '#A8642A'];
  const drawing = (kind, label, i) => {
    const col = kind === 'classic' ? HUES[0] : kind === 'biscoff' ? HUES[1] : HUES[(+i || 0) % 6];
    const dots = kind === 'biscoff' ? '<g fill="#E9C48A">' + [0,1,2,3,4,5,6,7].map(k => `<circle cx="${200 + 140 * Math.sin(k * Math.PI / 4)}" cy="${200 - 140 * Math.cos(k * Math.PI / 4)}" r="9"/>`).join('') + '</g>' : '';
    const ring = k => `<circle cx="200" cy="${k}" r="125" fill="none" stroke="${col}" stroke-width="76"/><circle cx="200" cy="${k}" r="125" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="76" stroke-dasharray="3 9.2"/>`;
    let body = kind === 'combo' ? ring(250) + '<circle cx="200" cy="140" r="72" fill="#F6C9DA"/><circle cx="200" cy="140" r="72" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="6" stroke-dasharray="40 400"/>' : ring(200) + dots;
    if (kind === 'social') body = '<rect width="400" height="400" fill="#8CCFC5"/>' + body;
    const y = kind === 'combo' ? 262 : 206;
    const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">${body}<text x="200" y="${y}" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="#062743">REPLACE: ${label}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  };
  const hook = img => {
    const fail = () => {
      if (img.dataset.failed) return; img.dataset.failed = 1;
      const [kind, label, i] = img.dataset.ph.split('|');
      img.src = drawing(kind, label, i); img.classList.add('is-placeholder');
    };
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
  };
  const pic = (src, alt, ph, eager) => {
    const im = new Image(); im.alt = alt; im.dataset.ph = ph;
    if (!eager) im.loading = 'lazy';
    hook(im); im.src = src; return im;
  };
  const file = p => p.split('/').pop();
  document.querySelectorAll('img[data-ph]').forEach(hook);

  /* ---------- build hero ring, menu, combos from content.js ---------- */
  
const F = C.flavours, N = Math.min(6, F.length);
const ring = document.getElementById('ring');

const churros = F.slice(0, 6).map((f, i) => {
  const im = pic(
    f.img,
    `${f.name} loop churro`,
    `${f.ph || 'flavour'}|${file(f.img)}|${i}`,
    true
  );
  im.className = 'hero__churro';
  ring.append(im);
  return im;
});

  const item = (cls, f, i, kind) => {
    const li = document.createElement('li'); li.className = cls;
    li.innerHTML = `<div class="${cls === 'combo' ? 'combo__img' : 'menu__img'}"></div><h3 class="display"></h3><p></p>${f.price ? '<p class="price"></p>' : ''}`;
    li.firstChild.append(pic(f.img, f.name, `${kind}|${file(f.img)}|${i}`));
    li.querySelector('h3').textContent = f.name;
    li.querySelectorAll('p')[0].textContent = f.desc;
    if (f.price) li.querySelector('.price').textContent = 'Price: ' + f.price;
    return li;
  };
  document.getElementById('flavourList').append(...F.map((f, i) => item('menu__item', f, i, f.ph || 'flavour')));
  document.getElementById('comboList').append(...C.combos.map((f, i) => item('combo', f, i, 'combo')));
  
/* ---------- build sundae ring ---------- */
const S = C.sundaes || [];
const sundaeRing = document.getElementById('sundaeRing');
const sundaeName = document.getElementById('sundaeName');
const sundaeStage = document.getElementById('sundaeStage');

const sundaeImages = S.map((s, i) => {
  const im = pic(
    s.img,
    `${s.name} sundae`,
    `${s.ph || 'sundae'}|${file(s.img)}|${i}`,
    true
  );
  im.className = 'sundae-item';
  sundaeRing.append(im);
  return im;
});

let activeSundae = -1;

function layoutSundaes(p) {
  if (!S.length || !sundaeStage) return;

  const w = sundaeStage.clientWidth;
  const h = sundaeStage.clientHeight;
  const small = w < 700;

  // Let the heading fade before the sundaes start moving
  const e = ease(clamp((p - .12) / .12));
  const eo = ease(clamp(p / .12));
  const q = clamp((p - .24) / .70);

  const Rx = w * (small ? .33 : .34);
  const Ry = h * (small ? .10 : .12);
  const n = S.length;
  const rot = q * ((n - 1) / n) * 2 * Math.PI;

  sundaeImages.forEach((im, i) => {
    const a = i / n * 2 * Math.PI - rot;
    const sin = Math.sin(a);
    const cos = Math.cos(a);
    const depth = (cos + 1) / 2;
    const scale = .45 + .9 * depth ** 3;

    im.style.transform =
      `translate(-50%,-50%) ` +
      `translate(${(Rx * sin * e).toFixed(1)}px,` +
      `${(Ry * cos * e + (1 - eo) * h * .12).toFixed(1)}px) ` +
      `scale(${scale.toFixed(3)}) rotate(${(-sin * 14).toFixed(1)}deg)`;

    im.style.zIndex = Math.round(depth * 10);
    im.style.opacity =
      ((.55 + .45 * depth ** 2) * eo *
      (depth > .97 ? 1 : e)).toFixed(2);
  });

  const idx = Math.min(n - 1, Math.round(q * (n - 1)));

if (idx !== activeSundae) {
  activeSundae = idx;

  sundaeName.replaceChildren();
  sundaeName.append(document.createTextNode(S[idx].name));

  if (S[idx].price) {
    const price = document.createElement('span');
    price.className = 'sundae-price-inline';
    price.textContent = S[idx].price;
    sundaeName.append(price);
  }

  sundaeName.classList.remove('swap');
  void sundaeName.offsetWidth;
  sundaeName.classList.add('swap');
}
}


  /* ---------- Instagram is the only social link ---------- */
  document.querySelectorAll('[data-instagram]').forEach(a => {
    if (C.instagram) { a.href = C.instagram; a.target = '_blank'; a.rel = 'noopener'; a.removeAttribute('data-placeholder'); }
    if (a.id === 'igBtn' && C.instagramHandle) a.textContent = 'Follow ' + C.instagramHandle;
  });
  document.querySelectorAll('[data-placeholder]').forEach(a => a.addEventListener('click', e => e.preventDefault()));
  document.getElementById('yr').textContent = new Date().getFullYear();

  /* ---------- mobile menu ---------- */
  const nav = document.getElementById('nav'), tog = nav.querySelector('.nav__toggle');
  const setMenu = o => { nav.classList.toggle('open', o); tog.setAttribute('aria-expanded', o); };
  tog.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- hero ring: one full turn through every flavour ---------- */
  const stage = document.getElementById('heroStage'), nameEl = document.getElementById('heroName');
  const ease = t => 1 - Math.pow(1 - t, 3);
  let feat = -1;
  function layoutHero(p) {
    const w = stage.clientWidth, h = stage.clientHeight, small = w < 700;
    const e = ease(clamp((p - .12) / .12));
    const eo = ease(clamp(p / .12));
    const q = clamp((p - .24) / .70);

    const rot = q * ((N - 1) / N) * 2 * Math.PI;
    const Rx = w * (small ? .33 : .34), Ry = h * (small ? .1 : .12);
    churros.forEach((c, i) => {
      const a = i / N * 2 * Math.PI - rot, sin = Math.sin(a), cos = Math.cos(a);
      const f = (cos + 1) / 2, s = .45 + .9 * f ** 3;
      c.style.transform = `translate(-50%,-50%) translate(${(Rx * sin * e).toFixed(1)}px,${(Ry * cos * e + (1 - eo) * h * .12).toFixed(1)}px) scale(${s.toFixed(3)}) rotate(${(-sin * 14).toFixed(1)}deg)`;
      c.style.zIndex = Math.round(f * 10);
      c.style.opacity = ((.55 + .45 * f * f) * eo * (f > .97 ? 1 : e)).toFixed(2);
    });
    const idx = Math.round(q * (N - 1));
    if (idx !== feat) {
      feat = idx; nameEl.textContent = F[idx].name;
      nameEl.classList.remove('swap'); void nameEl.offsetWidth; nameEl.classList.add('swap');
    }
  }

    /* ---------- corn on the cob: roll-in, then spotlight each flavour ---------- */
  const K = C.corn || [];
  const cornStage = document.getElementById('cornStage');
  const cornRow = document.getElementById('cornRow');
  const cornHalo = document.getElementById('cornHalo');
  const cornCaps = [];
  const cornItems = K.map((k, i) => {
    const fig = document.createElement('figure'); fig.className = 'corn-item';
    fig.append(pic(k.img, `${k.name} corn on the cob`, `corn|${file(k.img)}|${i}`, true));
    const cap = document.createElement('figcaption');
    cap.innerHTML = `<h3 class="display"></h3><p></p>${k.price ? '<p class="price"></p>' : ''}`;
    cap.querySelector('h3').textContent = k.name;
    cap.querySelectorAll('p')[0].textContent = k.desc || '';
    if (k.price) cap.querySelector('.price').textContent = 'Price: ' + k.price;
    fig.append(cap); cornRow.append(fig); cornCaps.push(cap);
    return fig;
  });

  function layoutCorn(p) {
    const n = K.length;
    if (!n || !cornStage) return;
    const w = cornStage.clientWidth, h = cornStage.clientHeight, small = w < 700;
    const sx = w * (small ? .31 : .27);
    const mid = (n - 1) / 2;
    const f = clamp((p - .42) / .5) * (n - 1);          // focus position 0..n-1

    const he = ease(clamp(p / .2));
    cornHalo.style.opacity = he.toFixed(2);
    cornHalo.style.transform =
      `translate(-50%,-50%) translateX(${((f - mid) * sx).toFixed(1)}px) ` +
      `rotate(${(p * 720).toFixed(1)}deg) scale(${(.6 + .4 * he).toFixed(3)})`;

    cornItems.forEach((el, i) => {
      const e = ease(clamp((p - i * .07) / .2));          // staggered roll-in
      const wt = clamp(1 - Math.abs(i - f)) * e;          // how "in focus" this cob is
      const x = (i - mid) * sx;
      const y = (1 - e) * h * .8 - wt * h * .03;
      const rot = (1 - e) * (i % 2 ? 260 : -260) + (i - mid) * 5 * (1 - wt);
      const sc = (.55 + .45 * e) * (1 + .32 * wt);
      el.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
      el.style.opacity = (e * (.55 + .45 * wt)).toFixed(2);
      el.style.zIndex = 2 + Math.round(wt * 10);
      cornCaps[i].style.opacity = (wt * wt).toFixed(2);
    });
  }

  /* ---------- scroll progress (--p) + nav theme ---------- */
  const tracks = [...document.querySelectorAll('[data-scroll]')];
  const themed = [...document.querySelectorAll('[data-nav]')];
  let queued = false;

  function update() {
    queued = false;
    const vh = innerHeight;
    if (!reduce) {
      tracks.forEach(el => {
        const r = el.getBoundingClientRect();
        const span = Math.max(1, r.height - vh);              // guards divide-by-zero (was the blank hero bug)
        let p = el.dataset.scroll === 'track' ? clamp(-r.top / span) : clamp((vh - r.top) / (vh + r.height));
        if (!isFinite(p)) p = 0;
        el.style.setProperty('--p', p.toFixed(4));
        if (el.id === 'home') layoutHero(p);
        if (el.id === 'sundaes') layoutSundaes(p);
        if (el.id === 'corn') layoutCorn(p);
      });
    }
    let dark = false;
    themed.forEach(s => { const r = s.getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) dark = s.dataset.nav === 'dark'; });
    nav.classList.toggle('on-dark', dark && !nav.classList.contains('open'));
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  if (reduce) layoutHero(.12);
  update();

  /* ---------- heading reveal ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .2 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
})();

/* ---------- tilting custom cursor (desktop mouse only) ---------- */
(() => {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // hx/hy = the click point inside each image (same as your old CSS hotspots)
  const MODES = {
    loop: { src: 'assets/cursor/loop.svg', w: 50, h: 78, hx: 16, hy: 40 },
    corn: { src: 'assets/cursor/corn.svg', w: 48, h: 48, hx: 10, hy: 10 }
  };
  Object.values(MODES).forEach(m => { new Image().src = m.src; }); // preload

  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  const img = new Image();
  img.alt = '';
  el.append(img);
  document.body.append(el);

  let mode = null, m = MODES.loop;
  const setMode = name => {
    if (name === mode) return;
    mode = name; m = MODES[name];
    img.src = m.src;
    el.style.width = m.w + 'px';
    el.style.height = m.h + 'px';
    el.style.transformOrigin = `${m.hx}px ${m.hy}px`;   // tilt pivots on the click point
  };
  setMode('loop');

  let x = 0, y = 0, tx = 0, ty = 0, rot = 0, scale = 1, targetScale = 1, seen = false;
  const MAX_TILT = 60;     // degrees
  const TILT_AMOUNT = 1.5; // higher = tilts more
  const FOLLOW = .35;      // 1 = glued to mouse, lower = floatier

  const pick = target => {
    setMode(target && target.closest && target.closest('#corn') ? 'corn' : 'loop');
    targetScale = target && target.closest && target.closest('a,button') ? 1.15 : 1;
  };

  addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    if (!seen) { seen = true; x = tx; y = ty; el.style.opacity = 1; }
    pick(e.target);
  }, { passive: true });

  // keep the right cursor when the page scrolls under a still mouse
  addEventListener('scroll', () => { if (seen) pick(document.elementFromPoint(tx, ty)); }, { passive: true });

  document.documentElement.addEventListener('mouseleave', () => { el.style.opacity = 0; });
  document.documentElement.addEventListener('mouseenter', () => { if (seen) el.style.opacity = 1; });

  document.documentElement.classList.add('has-cursor');

  (function frame() {
    const dx = tx - x;
    x += dx * FOLLOW;
    y += (ty - y) * FOLLOW;
    const target = Math.max(-MAX_TILT, Math.min(MAX_TILT, -dx * TILT_AMOUNT));
    rot += (target - rot) * .18;       // smooth the tilt, springs back to upright when you stop
    scale += (targetScale - scale) * .2;
    el.style.transform =
      `translate(${(x - m.hx).toFixed(1)}px,${(y - m.hy).toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    requestAnimationFrame(frame);
  })();
})();