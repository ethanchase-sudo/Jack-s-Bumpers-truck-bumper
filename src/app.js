(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const range = (a, b) => { const r = []; for (let y = b; y >= a; y--) r.push(y); return r; };

  const MAKES = [
    { id: 'ford', name: 'Ford', sub: 'F-150 · Super Duty · Ranger', photo: 'ford', models: [
      { n: 'F-250 Super Duty', y: range(1999, 2026), c: ['Regular Cab', 'SuperCab', 'Crew Cab'] },
      { n: 'F-350 Super Duty', y: range(1999, 2026), c: ['Regular Cab', 'SuperCab', 'Crew Cab', 'Dually'] },
      { n: 'F-150', y: range(2004, 2026), c: ['Regular Cab', 'SuperCab', 'SuperCrew'] },
      { n: 'Ranger', y: range(2019, 2026), c: ['SuperCab', 'SuperCrew'] } ] },
    { id: 'chevy', name: 'Chevrolet / GMC', sub: 'Silverado · Sierra', photo: 'chevy', models: [
      { n: 'Silverado 1500', y: range(2007, 2026), c: ['Regular Cab', 'Double Cab', 'Crew Cab'] },
      { n: 'Silverado 2500HD', y: range(2007, 2026), c: ['Regular Cab', 'Double Cab', 'Crew Cab'] },
      { n: 'GMC Sierra 1500', y: range(2007, 2026), c: ['Regular Cab', 'Double Cab', 'Crew Cab'] },
      { n: 'GMC Sierra 2500HD', y: range(2007, 2026), c: ['Regular Cab', 'Double Cab', 'Crew Cab'] } ] },
    { id: 'ram', name: 'Dodge / RAM', sub: '1500 · 2500 · 3500', photo: 'ram', models: [
      { n: 'Ram 2500', y: range(2003, 2026), c: ['Regular Cab', 'Crew Cab', 'Mega Cab'] },
      { n: 'Ram 3500', y: range(2003, 2026), c: ['Regular Cab', 'Crew Cab', 'Mega Cab', 'Dually'] },
      { n: 'Ram 1500', y: range(2009, 2026), c: ['Regular Cab', 'Quad Cab', 'Crew Cab'] } ] },
    { id: 'toyota', name: 'Toyota', sub: 'Tacoma · Tundra', photo: 'toyota', models: [
      { n: 'Tacoma', y: range(2005, 2026), c: ['Access Cab', 'Double Cab'] },
      { n: 'Tundra', y: range(2007, 2026), c: ['Double Cab', 'CrewMax'] } ] },
    { id: 'jeep', name: 'Jeep', sub: 'Wrangler · Gladiator', photo: 'jeep', models: [
      { n: 'Wrangler JL', y: range(2018, 2026), c: ['2-Door', '4-Door Unlimited'] },
      { n: 'Wrangler JK', y: range(2007, 2018), c: ['2-Door', '4-Door Unlimited'] },
      { n: 'Gladiator JT', y: range(2020, 2026), c: ['Crew Cab'] } ] },
    { id: 'heavy', name: 'Heavy Trucks & Vans', sub: 'Class 8 · Box · Cargo van', photo: 'heavy', models: [
      { n: 'Class 8 Tractor', y: range(2000, 2026), c: ['Day Cab', 'Sleeper'] },
      { n: 'Medium-Duty / Box Truck', y: range(2000, 2026), c: ['Standard'] },
      { n: 'Full-Size Cargo Van', y: range(2005, 2026), c: ['Standard Roof', 'High Roof'] } ] }
  ];

  const LED = [
    { id: 'none', b: 'No lighting', s: 'Clean face, no cutouts' },
    { id: 'pods', b: 'LED cube pods', s: 'Pair of flush-mount pods' },
    { id: 'bar', b: 'Integrated light bar', s: 'Recessed bar across the top' },
    { id: 'both', b: 'Pods + light bar', s: 'Full lighting package' }
  ];
  const WINCH = [
    { id: 'none', b: 'No winch mount', s: 'Solid center plate' },
    { id: 'hidden', b: 'Hidden winch mount', s: 'Recessed tray, fairlead only' },
    { id: 'exposed', b: 'Exposed winch tray', s: 'Top-mount, easy service' }
  ];
  const GUARD = [
    { id: 'none', b: 'None', s: 'Bumper only' },
    { id: 'grille', b: 'Grille guard', s: 'Center hoop protects the grille' },
    { id: 'brush', b: 'Full brush guard', s: 'Wraps grille and headlights' }
  ];
  const ACC = [
    { id: 'shackles', b: 'D-ring shackle mounts', s: 'Recovery points, pair' },
    { id: 'fog', b: 'Round fog light cutouts', s: 'Lower outboard lights' },
    { id: 'skid', b: 'Skid plate', s: 'Protects steering & pan' },
    { id: 'hitch', b: 'Front receiver hitch', s: '2" receiver opening' },
    { id: 'sensors', b: 'Parking sensor cutouts', s: 'Keep factory sensors' }
  ];
  const MODS = [
    { id: 'plate', b: 'Plate mount relocation' },
    { id: 'logo', b: 'Custom logo / ranch brand cutout' },
    { id: 'width', b: 'Extended or narrowed width' },
    { id: 'other', b: 'Something else — describe in quote' }
  ];
  const DEF_CFG = { design: 'std', finish: 'matte', led: 'none', winch: 'none', guard: 'none', acc: [], mods: [], modNote: '' };

  const S = Object.assign({
    screen: 1, make: null, model: null, year: null, conf: null,
    cfg: { ...DEF_CFG }, view: 'truck', lights: false, cmpB: 'ranch'
  }, JSON.parse(localStorage.getItem('jb-state') || '{}'));
  S.cfg = Object.assign({ ...DEF_CFG }, S.cfg);
  const save = () => localStorage.setItem('jb-state', JSON.stringify(S));
  const M = () => MAKES.find(m => m.id === S.make);
  const MD = () => M() && M().models.find(m => m.n === S.model);
  const photo = () => JB.PHOTOS[M() ? M().photo : 'ford'];

  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 1800); }

  /* ---------- SCREEN 1 ---------- */
  function renderMakes() {
    $('#makes').innerHTML = MAKES.map(m => `
      <button class="make ${S.make === m.id ? 'sel' : ''}" data-make="${m.id}" aria-pressed="${S.make === m.id}">
        <div class="ph" style="background-image:url(${JB.PHOTOS[m.photo].src})"></div>
        <span class="chk"></span>
        <div class="lb"><b>${m.name}</b><span>${m.sub}</span></div>
      </button>`).join('');
  }
  function renderDetails() {
    const m = M();
    $('#details').classList.toggle('on', !!m);
    const md = MD();
    $('#modelChips').innerHTML = m ? m.models.map(x => `<button class="chip ${S.model === x.n ? 'sel' : ''}" data-model="${x.n}">${x.n}</button>`).join('') : '<span class="empty-note">Choose a manufacturer above</span>';
    const ys = $('#yearSel');
    ys.innerHTML = `<option value="">${md ? 'Select year' : 'Select a model first'}</option>` + (md ? md.y.map(y => `<option ${S.year == y ? 'selected' : ''}>${y}</option>`).join('') : '');
    ys.disabled = !md;
    $('#confChips').innerHTML = md ? md.c.map(c => `<button class="chip ${S.conf === c ? 'sel' : ''}" data-conf="${c}">${c}</button>`).join('') : '<span class="empty-note">—</span>';
    // preview
    const p = photo();
    $('#vpImg').style.backgroundImage = `url(${p.src})`;
    $('#vpCap').textContent = m ? p.cap : 'Select your truck';
    $('#vpName').textContent = m ? (md ? `${S.year || ''} ${md.n}`.trim() : m.name) : 'Your truck';
    $('#vpSub').textContent = md ? (S.conf || 'Choose configuration') : (m ? 'Choose a model' : 'Start with a manufacturer');
    const ready = !!(m && md && S.year && S.conf);
    $$('.go2').forEach(b => b.disabled = !ready);
    $('#vpState').textContent = ready ? 'Ready to customize' : `${[m, md, S.year, S.conf].filter(Boolean).length}/4 selected`;
    $('#vpState').style.color = ready ? 'var(--or)' : '';
    $('#cbar').classList.toggle('on', !!m);
    $('#cbarTxt').textContent = ready ? `${S.year} ${md.n} · ${S.conf}` : (m ? `${m.name}${md ? ' · ' + md.n : ''}` : '');
    $('#cbarHint').textContent = ready ? 'Vehicle confirmed' : 'Finish model, year & configuration';
  }

  /* ---------- SCREEN 2 ---------- */
  const lbl = (arr, id) => (arr.find(x => x.id === id) || {}).b;
  const designName = id => JB.DESIGNS.find(d => d.id === id).name;
  const finName = id => JB.FINISHES.find(f => f.id === id).name;

  function renderDesigns() {
    $('#drow').innerHTML = JB.DESIGNS.map((d, i) => `
      <button class="dcard ${S.cfg.design === d.id ? 'sel' : ''}" data-design="${d.id}">
        <div class="pv">${JB.productSVG({ ...DEF_CFG, design: d.id, finish: S.cfg.finish, guard: d.id === 'ranch' ? 'brush' : 'none' }, 300, 110, 0.14, 0.5, 0.3)}</div>
        <span class="mono num">0${i + 1}</span><span class="chk"></span>
        <div class="tx"><b>${d.name}</b><p>${d.desc}</p></div>
      </button>`).join('');
  }
  function optList(arr, key, multi) {
    return arr.map(o => {
      const on = multi ? S.cfg[key].includes(o.id) : S.cfg[key] === o.id;
      const locked = key === 'guard' && S.cfg.design === 'ranch' && o.id !== 'brush';
      return `<button class="opt ${multi ? 'ck' : ''} ${on || (key === 'guard' && S.cfg.design === 'ranch' && o.id === 'brush') ? 'sel' : ''} ${locked ? 'locked' : ''}" data-k="${key}" data-v="${o.id}" ${multi ? 'data-multi="1"' : ''}>
        <span class="chk"></span><span><b>${o.b}</b>${o.s ? `<small>${o.s}</small>` : ''}</span>${o.tag ? `<span class="tag">${o.tag}</span>` : ''}</button>`;
    }).join('');
  }
  function renderSide() {
    const c = S.cfg;
    $('#finVal').textContent = finName(c.finish);
    $('#fins').innerHTML = JB.FINISHES.map(f => `<button class="fin ${c.finish === f.id ? 'sel' : ''}" data-fin="${f.id}"><div class="sw" style="background:${f.sw}"></div><span>${f.name}</span></button>`).join('');
    $('#styleVal').textContent = JB.DESIGNS.find(d => d.id === c.design).short;
    $('#styleOpts').innerHTML = optList(JB.DESIGNS.map(d => ({ id: d.id, b: d.name, s: 'Best for ' + d.best.toLowerCase() })), 'design');
    $('#ledVal').textContent = lbl(LED, c.led);
    $('#ledOpts').innerHTML = optList(LED, 'led');
    $('#winVal').textContent = lbl(WINCH, c.winch);
    $('#winOpts').innerHTML = optList(WINCH, 'winch');
    const g = c.design === 'ranch' ? 'brush' : c.guard;
    $('#grdVal').textContent = c.design === 'ranch' ? 'Included' : lbl(GUARD, g);
    $('#grdOpts').innerHTML = (c.design === 'ranch' ? '<p class="mono" style="margin-bottom:8px;color:var(--or)">Ranch-style includes a full guard</p>' : '') + optList(GUARD, 'guard');
    $('#accVal').textContent = c.acc.length ? c.acc.length + ' selected' : 'None';
    $('#accOpts').innerHTML = optList(ACC, 'acc', true);
    $('#modVal').textContent = c.mods.length ? c.mods.length + ' selected' : 'None';
    $('#modOpts').innerHTML = optList(MODS, 'mods', true);
    if (document.activeElement !== $('#modNote')) $('#modNote').value = c.modNote;
    $('#sumName').textContent = designName(c.design);
    $('#sumList').innerHTML = summaryLines().join(' · ');
  }
  function summaryLines() {
    const c = S.cfg; const out = [finName(c.finish)];
    if (c.led !== 'none') out.push(lbl(LED, c.led));
    if (c.winch !== 'none') out.push(lbl(WINCH, c.winch));
    const g = c.design === 'ranch' ? 'brush' : c.guard;
    if (g !== 'none') out.push(lbl(GUARD, g));
    c.acc.forEach(a => out.push(lbl(ACC, a)));
    c.mods.forEach(a => out.push(lbl(MODS, a)));
    return out;
  }
  function renderStage(animate) {
    const p = photo();
    const md = MD();
    document.documentElement.style.setProperty('--ar', p.ar);
    $('#vsTh').style.backgroundImage = `url(${p.src})`;
    $('#vsName').textContent = md ? `${S.year} ${md.n}` : 'Your truck';
    $('#vsConf').textContent = S.conf || '';
    $('#stPhoto').src = p.src;
    $('#stCap').textContent = p.cap + ' — bumper is a digital preview';
    $('#stName').textContent = designName(S.cfg.design);
    const cfg = { ...S.cfg, lights: S.lights };
    const put = () => {
      $('#stBmp').innerHTML = JB.photoSVG(cfg, M() ? M().photo : 'ford');
      $('#stFront').innerHTML = JB.productSVG(cfg, 1000, 562, 0.1, 0.5, 0.26);
      $('#stSide').innerHTML = JB.sideSVG(cfg);
    };
    if (animate) { $('#stBmp').classList.add('fade'); setTimeout(() => { put(); $('#stBmp').classList.remove('fade'); }, 140); } else put();
    $('.photo').classList.toggle('night', S.lights);
    $('#lightBtn').classList.toggle('act', S.lights);
    $$('#viewSeg button').forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
    $$('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + S.view));
  }
  function render2(animate) { renderDesigns(); renderSide(); renderStage(animate); }

  /* ---------- NAV ---------- */
  function go(n) {
    S.screen = n; save();
    $$('.screen').forEach(s => s.classList.toggle('on', s.id === 's' + n));
    window.scrollTo(0, 0);
    if (n === 2) render2(); else { renderMakes(); renderDetails(); }
  }

  /* ---------- MODALS ---------- */
  function openM(id) { $('#' + id).classList.add('on'); }
  function closeM(el) { el.closest('.modal').classList.remove('on'); }

  function openQuote() {
    const p = photo(); const md = MD();
    $('#qForm').style.display = ''; $('#qConf').style.display = 'none';
    $('#qPv').innerHTML = `<img src="${p.src}" alt="">${JB.photoSVG({ ...S.cfg, lights: false }, M() ? M().photo : 'ford')}`;
    $('#qVeh').value = md ? `${S.year} ${md.n} · ${S.conf}` : '';
    $('#qDl').innerHTML = `
      <dt class="mono">Vehicle</dt><dd>${md ? `${S.year} ${md.n}<br><span style="color:var(--tx3)">${S.conf}</span>` : '—'}</dd>
      <dt class="mono">Bumper design</dt><dd>${designName(S.cfg.design)}</dd>
      <dt class="mono">Customization</dt><dd style="color:var(--tx2)">${summaryLines().join('<br>')}</dd>
      ${S.cfg.modNote ? `<dt class="mono">Mod notes</dt><dd style="color:var(--tx2)">${S.cfg.modNote.replace(/</g, '&lt;')}</dd>` : ''}`;
    openM('mQuote');
  }
  function submitQuote(e) {
    e.preventDefault();
    let ok = true;
    const chk = (id, test) => { const f = $('#' + id).closest('.ff'); const good = test($('#' + id).value.trim()); f.classList.toggle('err', !good); if (!good) ok = false; };
    chk('qName', v => v.length > 1);
    chk('qEmail', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
    chk('qPhone', v => v.replace(/\D/g, '').length >= 10);
    if (!ok) return;
    const btn = $('#qSubmit'); btn.disabled = true; btn.textContent = 'Sending…';
    setTimeout(() => {
      btn.disabled = false; btn.innerHTML = 'Submit My Request <span class="arr">→</span>';
      $('#qForm').style.display = 'none'; $('#qConf').style.display = '';
      $('#qRef').textContent = 'JB-' + new Date().getFullYear().toString().slice(2) + '-' + Math.floor(1000 + Math.random() * 9000);
      $('#qWho').textContent = $('#qName').value.trim().split(' ')[0];
      $('#qEm').textContent = $('#qEmail').value.trim();
    }, 900);
  }
  function openCompare() {
    if (S.cmpB === S.cfg.design) S.cmpB = JB.DESIGNS.find(d => d.id !== S.cfg.design).id;
    renderCompare(); openM('mCmp');
  }
  function renderCompare() {
    const p = photo(); const mk = M() ? M().photo : 'ford';
    const card = (id, which) => {
      const d = JB.DESIGNS.find(x => x.id === id);
      const cfg = which === 'a' ? { ...S.cfg } : { ...DEF_CFG, design: id, finish: S.cfg.finish };
      const bars = [['Coverage', d.coverage], ['Clearance', d.clearance], ['Protection', d.protection]].map(([n, v]) => `<div class="bar"><span>${n}</span><i>${[1,2,3,4,5].map(k => `<s class="${k <= v ? 'f' : ''}"></s>`).join('')}</i></div>`).join('');
      return `<div class="cmpc"><div class="pv"><img src="${p.src}" alt="">${JB.photoSVG(cfg, mk)}</div><div class="bd">
        <span class="mono">${which === 'a' ? 'Your current build' : 'Compare with'}</span>
        ${which === 'b' ? `<div class="sel-wrap" style="margin:8px 0 0"><select id="cmpSel">${JB.DESIGNS.filter(x => x.id !== S.cfg.design).map(x => `<option value="${x.id}" ${x.id === id ? 'selected' : ''}>${x.name}</option>`).join('')}</select></div>` : `<div class="disp" style="font-size:26px;margin-top:8px;height:46px;display:flex;align-items:center">${d.name}</div>`}
        <p style="color:var(--tx2);font-size:13.5px;margin-top:10px">${d.desc}</p>
        <div class="bars">${bars}</div>
        <p class="mono" style="margin-bottom:14px">Best for · <span style="color:var(--tx)">${d.best}</span></p>
        ${which === 'b' ? `<button class="btn btn-ghost btn-sm" data-usecmp="${id}" style="width:100%">Switch to this design</button>` : `<button class="btn btn-ghost btn-sm" disabled style="width:100%;opacity:.5">Currently selected</button>`}
      </div></div>`;
    };
    $('#cmpBody').innerHTML = card(S.cfg.design, 'a') + card(S.cmpB, 'b');
  }

  /* ---------- QR ---------- */
  function drawQR() {
    const n = 25, cells = []; let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const finder = (x, y, ox, oy) => { const dx = x - ox, dy = y - oy; if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null; return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4); };
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let v = finder(x, y, 0, 0); if (v === null) v = finder(x, y, n - 7, 0); if (v === null) v = finder(x, y, 0, n - 7);
      if (v === null) { const near = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9); v = near ? false : rnd() > 0.52; }
      cells.push(`<i class="${v ? 'b' : ''}"></i>`);
    }
    $('#qr').innerHTML = cells.join('');
  }

  /* ---------- EVENTS ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('button, a, [data-act]'); if (!t) return;
    const d = t.dataset;
    if (d.make) { if (S.make !== d.make) { S.make = d.make; S.model = null; S.year = null; S.conf = null; } save(); renderMakes(); renderDetails();
      const m = M(); if (m.models.length === 1) { S.model = m.models[0].n; renderDetails(); }
      if (window.innerWidth < 900) window.scrollTo({ top: $('#details').getBoundingClientRect().top + scrollY - 80, behavior: 'smooth' });
      return; }
    if (d.model) { S.model = d.model; const md = MD(); if (!md.y.includes(+S.year)) S.year = null; S.conf = md.c.length === 1 ? md.c[0] : (md.c.includes(S.conf) ? S.conf : null); save(); renderDetails(); return; }
    if (d.conf) { S.conf = d.conf; save(); renderDetails(); return; }
    if (d.design) { S.cfg.design = d.design; save(); render2(true); return; }
    if (d.fin) { S.cfg.finish = d.fin; save(); render2(false); return; }
    if (d.k) {
      if (d.multi) { const a = S.cfg[d.k]; const i = a.indexOf(d.v); i >= 0 ? a.splice(i, 1) : a.push(d.v); }
      else S.cfg[d.k] = d.v;
      save(); if (d.k === 'design') render2(true); else { renderSide(); renderStage(false); }
      return;
    }
    if (d.view) { S.view = d.view; save(); renderStage(); return; }
    if (d.usecmp) { S.cfg.design = d.usecmp; save(); closeM(t); render2(true); toast('Switched to ' + designName(d.usecmp)); return; }
    switch (d.act) {
      case 'start': if (S.screen !== 1) go(1); window.scrollTo({ top: $('#select').getBoundingClientRect().top + scrollY - 70, behavior: 'smooth' }); $('#nav').classList.remove('open'); break;
      case 'go2': if (!t.disabled) go(2); break;
      case 'go1': go(1); setTimeout(() => window.scrollTo({ top: $('#select').getBoundingClientRect().top + scrollY - 70 }), 30); break;
      case 'home': go(1); break;
      case 'how': openM('mHow'); $('#nav').classList.remove('open'); break;
      case 'contact': openM('mContact'); $('#nav').classList.remove('open'); break;
      case 'explore': if (S.screen === 2) break; window.scrollTo({ top: $('#select').getBoundingClientRect().top + scrollY - 70, behavior: 'smooth' }); $('#nav').classList.remove('open'); break;
      case 'menu': $('#nav').classList.toggle('open'); break;
      case 'lights': S.lights = !S.lights; save(); renderStage(); break;
      case 'reset': S.cfg = { ...DEF_CFG, acc: [], mods: [] }; S.lights = false; save(); render2(true); toast('Customization reset'); break;
      case 'compare': openCompare(); break;
      case 'quote': openQuote(); break;
      case 'close': closeM(t); break;
      case 'grp': t.closest('.grp').classList.toggle('open'); break;
      case 'newq': closeM(t); break;
      case 'copy': navigator.clipboard && navigator.clipboard.writeText('jacksbumpers.com/build').catch(() => {}); toast('Link copied'); break;
    }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'yearSel') { S.year = e.target.value || null; save(); renderDetails(); }
    if (e.target.id === 'cmpSel') { S.cmpB = e.target.value; save(); renderCompare(); }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'modNote') { S.cfg.modNote = e.target.value; save(); }
    if (e.target.closest('.ff.err')) e.target.closest('.ff').classList.remove('err');
  });
  $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('on'); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal.on').forEach(m => m.classList.remove('on')); });
  $('#qForm').addEventListener('submit', submitQuote);
  $('#cForm').addEventListener('submit', e => { e.preventDefault(); closeM(e.target); toast('Message sent — thanks!'); });

  drawQR();
  if (S.screen === 2 && !(S.make && S.model && S.year && S.conf)) S.screen = 1;
  go(S.screen);
})();
