/* Jack's Bumpers — bumper render engine (illustrative SVG overlay) */
(function () {
  // Per-photo calibration. Quad = front face of stock bumper, in % of image (TL, TR, BR, BL).
  // gTop = how many bumper-heights above the bumper top the grille top sits (for guards).
  const PHOTOS = {
    ford:   { src: 'img/ford_c.jpg',   ar: 2,     quad: [[40.5,56],[87.5,55],[87,77],[41,76.5]],   gTop: 1.25, cap: 'Representative photo · Super Duty' },
    chevy:  { src: 'img/chevy_c.jpg',  ar: 1.5,   quad: [[59,54.5],[86.5,52.5],[86,64.5],[59.5,67]], gTop: 1.0, cap: 'Representative photo · Silverado 1500' },
    ram:    { src: 'img/ram_c.jpg',    ar: 1.5,   quad: [[44,52.5],[85.8,51],[85.3,67],[44.5,70.5]], gTop: 0.95, cap: 'Representative photo · Ram HD' },
    toyota: { src: 'img/toyota_c.jpg', ar: 1.5,   quad: [[14,52],[41.5,54],[41.5,68],[14.5,64]],   gTop: 0.95, cap: 'Representative photo · Tacoma' },
    jeep:   { src: 'img/jeep_c.jpg',   ar: 1.5,   quad: [[55,47.5],[87.5,48.5],[87,57.5],[55.5,58]], gTop: 2.0, cap: 'Representative photo · Wrangler (modified)' },
    heavy:  { src: 'img/heavy_c.jpg',  ar: 1.5,   quad: [[6.5,65.5],[51.5,72],[51,95],[7,83.5]],   gTop: 2.2, cap: 'Representative photo · Class 8 tractor' }
  };

  const DESIGNS = [
    { id: 'std',   name: 'Standard Heavy-Duty', short: 'Heavy-Duty', desc: 'Full-coverage plate steel built for daily work and wildlife strikes.', tags: ['Full coverage','Winch-ready'], best: 'Ranch & work trucks', coverage: 4, clearance: 2, protection: 4 },
    { id: 'off',   name: 'Off-Road',           short: 'Off-Road',   desc: 'Tucked, angled wings for approach angle and tire clearance on the trail.', tags: ['High clearance','Recovery points'], best: 'Trail & overland', coverage: 2, clearance: 5, protection: 3 },
    { id: 'fw',    name: 'Full-Width Custom',  short: 'Full-Width', desc: 'Wraps past the fenders with integrated light cutouts and a bold face.', tags: ['Wrap-around','Light cutouts'], best: 'Show & highway', coverage: 5, clearance: 2, protection: 4 },
    { id: 'ranch', name: 'Ranch-Style',        short: 'Ranch',      desc: 'Heavy bumper with an integrated full guard — the classic Western build.', tags: ['Integrated guard','Max protection'], best: 'Rural highways & livestock', coverage: 5, clearance: 2, protection: 5 },
    { id: 'prem',  name: 'Premium Custom Steel', short: 'Premium',  desc: 'Layered, sculpted plate with machined edges. Built one at a time.', tags: ['Layered plate','Signature build'], best: 'One-of-a-kind builds', coverage: 4, clearance: 3, protection: 4 }
  ];

  const FINISHES = [
    { id: 'raw',   name: 'Raw Steel',   sw: 'linear-gradient(160deg,#c9cdd2,#7d838a 55%,#5a5f66)' },
    { id: 'matte', name: 'Matte Black', sw: 'linear-gradient(160deg,#323438,#1b1c1e)' },
    { id: 'gloss', name: 'Gloss Black', sw: 'linear-gradient(160deg,#5b5f66 0%,#0c0d0e 35%,#1e2023 60%,#030303)' }
  ];

  let uid = 0;

  function bil(q, u, v) {
    const [a, b, c, d] = q;
    return [
      (1-u)*(1-v)*a[0] + u*(1-v)*b[0] + u*v*c[0] + (1-u)*v*d[0],
      (1-u)*(1-v)*a[1] + u*(1-v)*b[1] + u*v*c[1] + (1-u)*v*d[1]
    ];
  }

  // Build a renderer bound to a quad in viewBox units
  function mapper(q) {
    const P = (u, v) => bil(q, u, v);
    const f = n => n.toFixed(1);
    function poly(pts, closed = true, n = 6) {
      let out = [];
      const L = closed ? pts.length : pts.length - 1;
      for (let i = 0; i < L; i++) {
        const p0 = pts[i], p1 = pts[(i+1) % pts.length];
        for (let k = 0; k < n; k++) {
          const t = k / n;
          out.push(P(p0[0] + (p1[0]-p0[0])*t, p0[1] + (p1[1]-p0[1])*t));
        }
      }
      if (!closed) out.push(P(...pts[pts.length-1]));
      return 'M' + out.map(p => f(p[0]) + ' ' + f(p[1])).join(' L') + (closed ? ' Z' : '');
    }
    const rect = (u0, v0, u1, v1) => poly([[u0,v0],[u1,v0],[u1,v1],[u0,v1]]);
    // approximate local scale (height of bumper in units)
    const H = Math.hypot(P(0.5,1)[0]-P(0.5,0)[0], P(0.5,1)[1]-P(0.5,0)[1]);
    const W = Math.hypot(P(1,0.5)[0]-P(0,0.5)[0], P(1,0.5)[1]-P(0,0.5)[1]);
    function circ(u, v, r) { // r in fraction of H
      const p = P(u, v); return `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(r*H)}" ry="${f(r*H)}"/>`;
    }
    return { P, poly, rect, circ, H, W, f };
  }

  const SHAPES = {
    std:   { face: [[0,0.08],[1,0.08],[1,0.74],[0.95,0.96],[0.05,0.96],[0,0.74]], top: [[0,0],[1,0],[1,0.13],[0,0.13]], recess: [0.37,0.24,0.63,0.7], pods: [[0.16,0.22],[0.84,0.22]], fog: [[0.1,0.55],[0.9,0.55]] },
    off:   { face: [[0.1,0.02],[0.9,0.02],[0.98,0.28],[0.86,0.84],[0.64,1],[0.36,1],[0.14,0.84],[0.02,0.28]], top: [[0.1,-0.04],[0.9,-0.04],[0.93,0.1],[0.07,0.1]], recess: [0.38,0.22,0.62,0.68], pods: [[0.2,0.24],[0.8,0.24]], fog: [[0.2,0.56],[0.8,0.56]] },
    fw:    { face: [[-0.03,-0.04],[1.03,-0.04],[1.03,0.78],[0.9,1],[0.1,1],[-0.03,0.78]], top: [[-0.03,-0.08],[1.03,-0.08],[1.03,0.06],[-0.03,0.06]], recess: [0.36,0.2,0.64,0.66], pods: [[0.13,0.24],[0.87,0.24]], fog: [[0.2,0.6],[0.8,0.6]] },
    ranch: { face: [[0,0.02],[1,0.02],[1,0.86],[0.7,0.86],[0.68,1.06],[0.32,1.06],[0.3,0.86],[0,0.86]], top: [[0,-0.04],[1,-0.04],[1,0.1],[0,0.1]], recess: [0.38,0.22,0.62,0.72], pods: [[0.16,0.26],[0.84,0.26]], fog: [[0.12,0.6],[0.88,0.6]] },
    prem:  { face: [[0,0.1],[1,0.1],[1,0.7],[0.92,0.96],[0.08,0.96],[0,0.7]], top: [[0.03,-0.02],[0.97,-0.02],[1,0.16],[0.64,0.24],[0.6,0.62],[0.4,0.62],[0.36,0.24],[0,0.16]], recess: [0.41,0.3,0.59,0.6], pods: [[0.18,0.36],[0.82,0.36]], fog: [[0.1,0.62],[0.9,0.62]] }
  };

  function defs(id, finish) {
    const g = {
      raw:   [['#7a8087',0],['#b8bdc2',0.13],['#747a81',0.4],['#575c62',0.75],['#3b3f44',1]],
      matte: [['#34363a',0],['#26282b',0.25],['#1d1e21',0.6],['#141517',1]],
      gloss: [['#6a6f76',0],['#16181a',0.2],['#26292d',0.45],['#08090a',0.7],['#151719',1]]
    }[finish];
    const t = {
      raw:   [['#cdd1d5',0],['#8b9197',1]],
      matte: [['#46494e',0],['#2b2d30',1]],
      gloss: [['#9aa0a8',0],['#2a2d31',1]]
    }[finish];
    const stops = a => a.map(s => `<stop offset="${s[1]}" stop-color="${s[0]}"/>`).join('');
    return `<defs>
      <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1">${stops(g)}</linearGradient>
      <linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1">${stops(t)}</linearGradient>
      <linearGradient id="${id}tube" x1="0" y1="0" x2="1" y2="1">${stops(finish==='raw'?[['#d9dde1',0],['#7b8188',0.5],['#555a60',1]]:finish==='gloss'?[['#7a7f86',0],['#0b0c0d',0.5],['#2a2d31',1]]:[['#3a3c40',0],['#1d1e20',1]])}</linearGradient>
      <pattern id="${id}br" width="6" height="2.2" patternUnits="userSpaceOnUse"><rect width="6" height="0.5" fill="#fff" opacity="${finish==='raw'?0.09:0.02}"/></pattern>
      <radialGradient id="${id}lens"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#e8f2ff"/><stop offset="1" stop-color="#9fb4c8"/></radialGradient>
      <radialGradient id="${id}beam"><stop offset="0" stop-color="#fffbe9" stop-opacity="0.95"/><stop offset="0.35" stop-color="#fff4cc" stop-opacity="0.35"/><stop offset="1" stop-color="#fff4cc" stop-opacity="0"/></radialGradient>
      <filter id="${id}sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.55"/></filter>
      <filter id="${id}glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>`;
  }

  /**
   * cfg: { design, finish, led, winch, guard, acc:[], lights }
   * q: quad in viewBox units; gTop
   */
  function bumperSVG(cfg, q, gTop, opts = {}) {
    const id = 'jb' + (++uid);
    const M = mapper(q);
    const S = SHAPES[cfg.design] || SHAPES.std;
    const dark = cfg.finish === 'raw' ? '#3f4348' : '#08090a';
    const mid = cfg.finish === 'raw' ? '#5d6268' : '#121315';
    const edge = cfg.finish === 'raw' ? 'rgba(255,255,255,.55)' : cfg.finish === 'gloss' ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.08)';
    const guard = cfg.design === 'ranch' ? 'brush' : cfg.guard;
    const sw = Math.max(1.2, M.H * 0.075);
    let s = defs(id, cfg.finish);
    let back = '', body = '', front = '', glow = '';

    // Guard (drawn behind bumper so tubes emerge from top)
    if (guard && guard !== 'none') {
      const top = -gTop * 0.92, mid1 = -gTop * 0.45;
      const tube = (pts) => `<path d="${M.poly(pts, false, 10)}" fill="none" stroke="url(#${id}tube)" stroke-width="${M.f(sw)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      const tubeShadow = (pts) => `<path d="${M.poly(pts, false, 10)}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="${M.f(sw*1.5)}" stroke-linecap="round" transform="translate(${M.f(sw*0.35)},${M.f(sw*0.5)})"/>`;
      const center = [[0.31,0.05],[0.31,top+0.15],[0.36,top],[0.64,top],[0.69,top+0.15],[0.69,0.05]];
      back += tubeShadow(center) + tube(center);
      back += tube([[0.31,mid1],[0.69,mid1]]);
      back += tube([[0.31,mid1*1.6],[0.69,mid1*1.6]]);
      if (guard === 'brush') {
        const L = [[0.31,top*0.62],[0.2,top*0.66],[0.06,top*0.5],[0.03,0.05]];
        const R = [[0.69,top*0.62],[0.8,top*0.66],[0.94,top*0.5],[0.97,0.05]];
        back += tubeShadow(L) + tube(L) + tubeShadow(R) + tube(R);
      }
      // mount plates
      back += `<path d="${M.rect(0.29,-0.05,0.33,0.06)}" fill="${mid}"/><path d="${M.rect(0.67,-0.05,0.71,0.06)}" fill="${mid}"/>`;
    }

    // Winch drum (exposed) sits above bumper center
    if (cfg.winch === 'exposed') {
      back += `<path d="${M.rect(0.385,-0.34,0.615,0.06)}" fill="${dark}" filter="url(#${id}sh)"/>`;
      back += `<path d="${M.rect(0.4,-0.3,0.6,-0.1)}" fill="#2b2d30"/>`;
      for (let i = 0; i < 6; i++) { const u = 0.41 + i*0.033; back += `<path d="${M.rect(u,-0.29,u+0.012,-0.11)}" fill="#55595f"/>`; }
      back += `<path d="${M.rect(0.385,-0.36,0.615,-0.32)}" fill="${mid}"/>`;
    }

    // Skid plate below
    if (cfg.acc.includes('skid')) {
      back += `<path d="${M.poly([[0.28,0.85],[0.72,0.85],[0.66,1.28],[0.34,1.28]])}" fill="${dark}" opacity=".95"/>`;
      for (let i = 0; i < 4; i++) { const u = 0.38 + i*0.08; back += `<path d="${M.rect(u,1.0,u+0.04,1.16)}" fill="#000" opacity=".5"/>`; }
    }

    // Bumper body
    const under = S.face.map(p => [p[0], p[1] + 0.07]);
    body += `<path d="${M.poly(under)}" fill="#000" opacity=".55"/>`;
    body += `<g filter="url(#${id}sh)"><path d="${M.poly(S.face)}" fill="url(#${id}f)"/></g>`;
    body += `<path d="${M.poly(S.face)}" fill="url(#${id}br)"/>`;
    body += `<path d="${M.poly(S.top)}" fill="url(#${id}t)"/>`;
    body += `<path d="${M.poly(S.top)}" fill="none" stroke="${edge}" stroke-width="${M.f(Math.max(0.6, M.H*0.012))}"/>`;
    if (cfg.finish === 'gloss') {
      body += `<path d="${M.poly([[0.02,0.2],[0.98,0.2],[0.98,0.26],[0.02,0.3]])}" fill="#fff" opacity=".22"/>`;
    }
    // design specifics
    const r = S.recess;
    if (cfg.design === 'off') {
      body += `<path d="${M.poly([[0.05,0.32],[0.2,0.3],[0.18,0.7]])}" fill="${dark}" opacity=".9"/>`;
      body += `<path d="${M.poly([[0.95,0.32],[0.8,0.3],[0.82,0.7]])}" fill="${dark}" opacity=".9"/>`;
    }
    if (cfg.design === 'fw') {
      for (let i = 0; i < 3; i++) { const v = 0.3 + i*0.14; body += `<path d="${M.rect(0.25,v,0.33,v+0.05)}" fill="${dark}"/><path d="${M.rect(0.67,v,0.75,v+0.05)}" fill="${dark}"/>`; }
      body += `<path d="${M.rect(0.02,0.2,0.24,0.5)}" fill="${dark}" opacity=".85"/><path d="${M.rect(0.76,0.2,0.98,0.5)}" fill="${dark}" opacity=".85"/>`;
    }
    if (cfg.design === 'ranch') {
      body += `<path d="${M.rect(0.02,0.42,0.98,0.47)}" fill="${dark}" opacity=".6"/>`;
    }
    if (cfg.design === 'prem') {
      body += `<path d="${M.poly(S.top)}" fill="none" stroke="#f0782b" stroke-opacity=".0" />`;
      body += `<path d="${M.poly([[0.06,0.74],[0.94,0.74],[0.9,0.86],[0.1,0.86]])}" fill="${dark}" opacity=".7"/>`;
      body += `<path d="${M.poly([[0.08,0.2],[0.3,0.25],[0.3,0.55],[0.08,0.55]])}" fill="${mid}" stroke="${edge}" stroke-width="${M.f(Math.max(.5,M.H*.01))}"/>`;
      body += `<path d="${M.poly([[0.92,0.2],[0.7,0.25],[0.7,0.55],[0.92,0.55]])}" fill="${mid}" stroke="${edge}" stroke-width="${M.f(Math.max(.5,M.H*.01))}"/>`;
    }
    // center recess (winch / plate)
    body += `<path d="${M.rect(r[0],r[1],r[2],r[3])}" fill="${dark}"/>`;
    body += `<path d="${M.rect(r[0],r[1],r[2],r[1]+0.04)}" fill="#000" opacity=".5"/>`;
    if (cfg.winch === 'hidden' || cfg.winch === 'exposed') {
      // fairlead
      body += `<path d="${M.rect(0.44,(r[1]+r[3])/2-0.08,0.56,(r[1]+r[3])/2+0.08)}" fill="#8f949a"/>`;
      body += `<path d="${M.rect(0.465,(r[1]+r[3])/2-0.03,0.535,(r[1]+r[3])/2+0.03)}" fill="#0a0a0a"/>`;
      // hook
      body += `<g fill="#f0782b">${M.circ(0.5,(r[1]+r[3])/2+0.12,0.06)}</g>`;
    }
    // bolts
    body += `<g fill="${cfg.finish==='raw'?'#3c4045':'#2f3135'}">${[0.06,0.94,0.3,0.7].map(u => M.circ(u, 0.82, 0.025)).join('')}</g>`;

    // Accessories
    if (cfg.acc.includes('shackles')) {
      const sh = (u) => `<path d="${M.rect(u-0.02,0.62,u+0.02,0.8)}" fill="${dark}"/><path d="${M.poly([[u-0.03,0.78],[u+0.03,0.78],[u+0.03,0.92],[u,0.98],[u-0.03,0.92]])}" fill="none" stroke="#f0782b" stroke-width="${M.f(Math.max(1,M.H*0.04))}" stroke-linejoin="round"/>`;
      front += sh(0.32) + sh(0.68);
    }
    if (cfg.acc.includes('hitch')) {
      front += `<path d="${M.rect(0.47,0.76,0.53,0.95)}" fill="#050505" stroke="#6b7076" stroke-width="${M.f(Math.max(.6,M.H*.015))}"/>`;
    }
    if (cfg.acc.includes('sensors')) {
      front += `<g fill="#0b0b0c" stroke="#5a5e64" stroke-width="${M.f(Math.max(.4,M.H*.008))}">${[0.22,0.3,0.7,0.78].map(u => M.circ(u, 0.66, 0.028)).join('')}</g>`;
    }
    const lit = !!cfg.lights;
    if (cfg.acc.includes('fog')) {
      S.fog.forEach(([u, v]) => {
        front += `<g fill="#0a0a0a">${M.circ(u, v, 0.11)}</g><g fill="${lit?'#fff8e0':'#8995a1'}">${M.circ(u, v, 0.075)}</g>`;
        if (lit) glow += `<g fill="#fff3c4" filter="url(#${id}glow)" opacity=".9">${M.circ(u, v, 0.2)}</g>`;
      });
    }
    // LEDs
    if (cfg.led === 'pods' || cfg.led === 'both') {
      S.pods.forEach(([u, v]) => {
        const w = 0.055, h = 0.26;
        front += `<path d="${M.rect(u-w-0.012,v-0.04,u+w+0.012,v+h+0.04)}" fill="#0a0a0a" filter="url(#${id}sh)"/>`;
        front += `<path d="${M.rect(u-w,v,u+w,v+h)}" fill="${lit?'#ffffff':'url(#'+id+'lens)'}"/>`;
        if (!lit) for (let k = 0; k < 2; k++) front += `<g fill="#6f7f8e" opacity=".55">${M.circ(u, v + h*(0.3+k*0.4), 0.03)}</g>`;
        if (lit) glow += `<g fill="#ffffff" filter="url(#${id}glow)">${M.circ(u, v+h/2, 0.3)}</g>`;
      });
    }
    if (cfg.led === 'bar' || cfg.led === 'both') {
      const v0 = cfg.design === 'prem' ? 0.03 : 0.015, v1 = v0 + 0.11;
      front += `<path d="${M.rect(0.28,v0-0.02,0.72,v1+0.02)}" fill="#050505"/>`;
      front += `<path d="${M.rect(0.29,v0,0.71,v1)}" fill="${lit?'#ffffff':'#7f909f'}"/>`;
      if (!lit) for (let k = 0; k < 10; k++) { const u = 0.3 + k*0.041; front += `<path d="${M.rect(u,v0+0.02,u+0.02,v1-0.02)}" fill="#c9d6e2" opacity=".6"/>`; }
      if (lit) glow += `<path d="${M.rect(0.27,v0-0.06,0.73,v1+0.06)}" fill="#ffffff" filter="url(#${id}glow)"/>`;
    }
    let beams = '';
    if (lit && (cfg.led !== 'none' || cfg.acc.includes('fog'))) {
      const c = M.P(0.5, 0.4);
      beams = `<ellipse cx="${M.f(c[0])}" cy="${M.f(c[1])}" rx="${M.f(M.W*0.9)}" ry="${M.f(M.H*2.2)}" fill="url(#${id}beam)" opacity=".55" style="mix-blend-mode:screen"/>`;
    }
    return s + `<g class="bmp-back">${back}</g><g class="bmp-body">${body}</g><g class="bmp-front">${front}</g><g style="mix-blend-mode:screen">${glow}${beams}</g>`;
  }

  // Full SVG for a photo
  function photoSVG(cfg, make, W = 1000) {
    const p = PHOTOS[make]; const H = W / p.ar;
    const q = p.quad.map(([x, y]) => [x / 100 * W, y / 100 * H]);
    return `<svg viewBox="0 0 ${W} ${H.toFixed(1)}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${bumperSVG(cfg, q, p.gTop)}</svg>`;
  }

  // Studio product render (flat, front)
  function productSVG(cfg, W = 400, H = 220, padX = 0.12, top = 0.42, h = 0.3) {
    const x0 = W*padX, x1 = W*(1-padX), y0 = H*top, y1 = H*(top+h);
    const q = [[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
    const gTop = (y0 - H*0.06) / (y1 - y0);
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><ellipse cx="${W/2}" cy="${H*(top+h)+H*0.12}" rx="${W*0.42}" ry="${H*0.05}" fill="#000" opacity=".45"/>${bumperSVG(cfg, q, Math.min(gTop, 1.25))}</svg>`;
  }

  // Side profile (technical)
  function sideSVG(cfg) {
    const W = 1000, H = 560;
    const fin = cfg.finish;
    const fill = fin === 'raw' ? '#8a9097' : fin === 'gloss' ? '#15171a' : '#232528';
    const stroke = '#c9cdd2';
    const D = { std: 120, off: 100, fw: 130, ranch: 140, prem: 125 }[cfg.design] || 120;
    const bx = 560, by = 300, bh = { std: 110, off: 120, fw: 120, ranch: 130, prem: 112 }[cfg.design] || 110;
    let g = '';
    // vehicle reference (frame rail + tire)
    g += `<rect x="130" y="${by+20}" width="${bx-130}" height="38" fill="none" stroke="#3a3e43" stroke-dasharray="6 6"/>`;
    g += `<circle cx="300" cy="${by+150}" r="120" fill="none" stroke="#3a3e43" stroke-dasharray="6 6"/>`;
    g += `<text x="300" y="${by+155}" fill="#5c6168" font-size="18" text-anchor="middle" font-family="JetBrains Mono, monospace">FRONT TIRE (REF)</text>`;
    g += `<text x="200" y="${by+12}" fill="#5c6168" font-size="18" font-family="JetBrains Mono, monospace">FRAME RAIL</text>`;
    // bumper profile
    const off = cfg.design === 'off';
    const pts = off
      ? [[bx,by],[bx+D,by],[bx+D+18,by+bh*0.35],[bx+D-10,by+bh],[bx,by+bh*0.85]]
      : [[bx,by],[bx+D,by],[bx+D+14,by+18],[bx+D+14,by+bh-24],[bx+D-6,by+bh],[bx,by+bh]];
    g += `<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    g += `<rect x="${bx-60}" y="${by+24}" width="64" height="30" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    const guard = cfg.design === 'ranch' ? 'brush' : cfg.guard;
    if (guard !== 'none') {
      const gh = guard === 'brush' ? 210 : 180;
      g += `<path d="M ${bx+D-20} ${by} L ${bx+D-6} ${by-gh+30} Q ${bx+D-10} ${by-gh} ${bx+D-50} ${by-gh} L ${bx+10} ${by-gh+10}" fill="none" stroke="${fin==='raw'?'#aab0b6':'#2b2d31'}" stroke-width="16" stroke-linecap="round"/>`;
      g += `<path d="M ${bx+D-20} ${by} L ${bx+D-6} ${by-gh+30} Q ${bx+D-10} ${by-gh} ${bx+D-50} ${by-gh} L ${bx+10} ${by-gh+10}" fill="none" stroke="${stroke}" stroke-opacity=".35" stroke-width="2"/>`;
    }
    if (cfg.winch === 'exposed') g += `<rect x="${bx+20}" y="${by-58}" width="78" height="58" rx="6" fill="#2b2d30" stroke="${stroke}" stroke-width="2"/>`;
    if (cfg.winch === 'hidden') g += `<rect x="${bx+18}" y="${by+20}" width="74" height="54" rx="6" fill="none" stroke="#f0782b" stroke-dasharray="5 5" stroke-width="2"/>`;
    if (cfg.led === 'pods' || cfg.led === 'both') g += `<rect x="${bx+D+14}" y="${by+26}" width="18" height="34" fill="#e8f2ff" stroke="#111" stroke-width="2"/>`;
    if (cfg.acc.includes('skid')) g += `<path d="M ${bx+D-30} ${by+bh} L ${bx+D-60} ${by+bh+40} L ${bx-80} ${by+bh+40}" fill="none" stroke="${stroke}" stroke-width="4"/>`;
    if (cfg.acc.includes('shackles')) g += `<path d="M ${bx+D+4} ${by+bh-30} q 26 6 22 32 q -10 12 -26 0" fill="none" stroke="#f0782b" stroke-width="7"/>`;
    // dims
    g += `<line x1="${bx}" y1="${by+bh+80}" x2="${bx+D+14}" y2="${by+bh+80}" stroke="#f0782b" stroke-width="1.5"/>`;
    g += `<text x="${bx+D/2}" y="${by+bh+105}" fill="#f0782b" font-size="18" text-anchor="middle" font-family="JetBrains Mono, monospace">DEPTH · VARIES BY BUILD</text>`;
    g += `<line x1="${bx+D+70}" y1="${by}" x2="${bx+D+70}" y2="${by+bh}" stroke="#f0782b" stroke-width="1.5"/>`;
    g += `<text x="${bx+D+86}" y="${by+bh/2+6}" fill="#f0782b" font-size="18" font-family="JetBrains Mono, monospace">FACE HEIGHT</text>`;
    // ground
    g += `<line x1="60" y1="${by+270}" x2="940" y2="${by+270}" stroke="#2a2d31" stroke-width="2"/>`;
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="sgrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#1d2024" stroke-width="1"/></pattern></defs>
      <rect width="${W}" height="${H}" fill="url(#sgrid)"/>${g}</svg>`;
  }

  window.JB = { PHOTOS, DESIGNS, FINISHES, photoSVG, productSVG, sideSVG };
})();
