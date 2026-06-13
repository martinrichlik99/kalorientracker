// app.js — UI, Navigation, Render, Add-Flow, Barcode
(function () {
  const view = document.getElementById('view');
  const modalRoot = document.getElementById('modal-root');

  let current = 'dashboard';
  let diaryDate = Store.todayStr();

  // Makro-Konfiguration (Farbe = Mockup-Dashboard)
  const MACROS = [
    { key: 'protein', label: 'Eiweiß', bar: 'bg-primary', text: 'text-primary', tkey: 'proteinTarget' },
    { key: 'carbs', label: 'Kohlenhydrate', bar: 'bg-secondary-container', text: 'text-secondary', tkey: 'carbsTarget' },
    { key: 'fat', label: 'Fett', bar: 'bg-tertiary-container', text: 'text-tertiary', tkey: 'fatTarget' },
  ];
  const MEALS = [
    { key: 'breakfast', label: 'Frühstück', icon: 'coffee' },
    { key: 'lunch', label: 'Mittagessen', icon: 'restaurant' },
    { key: 'dinner', label: 'Abendessen', icon: 'dinner_dining' },
    { key: 'snack', label: 'Snacks', icon: 'cookie' },
  ];
  const ACTIVITY = {
    sedentary: 'Sitzend', light: 'Leicht', moderate: 'Moderat',
    active: 'Aktiv', very_active: 'Sehr aktiv',
  };

  // ---------- Helfer ----------
  const fmt = (n) => new Intl.NumberFormat('de-DE').format(Math.round(n));
  const fmtDec = (n) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(n);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pct = (v, t) => (t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0);

  function dateLabel(str) {
    const d = new Date(str + 'T00:00:00');
    return new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  }
  function shiftDate(str, days) {
    const d = new Date(str + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function header(title, sub) {
    return `<header class="sticky top-0 z-30 bg-background/85 backdrop-blur-md">
      <div class="flex justify-between items-center px-container-margin py-4 max-w-max-width mx-auto">
        <div class="flex flex-col">
          <h1 class="text-headline-lg text-primary">${esc(title)}</h1>
          ${sub ? `<p class="text-body-md text-on-surface-variant">${esc(sub)}</p>` : ''}
        </div>
      </div>
    </header>`;
  }

  function macroBadges(e) {
    return `<div class="flex gap-1.5">
      <span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-sm font-bold">E ${fmt(e.protein)}g</span>
      <span class="px-2 py-0.5 rounded-full bg-secondary-container/15 text-secondary text-label-sm font-bold">K ${fmt(e.carbs)}g</span>
      <span class="px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary text-label-sm font-bold">F ${fmt(e.fat)}g</span>
    </div>`;
  }

  // ---------- Navigation ----------
  function go(name) {
    current = name;
    render();
    document.querySelectorAll('.nav-btn').forEach((b) => {
      const active = b.dataset.nav === name;
      b.classList.toggle('text-primary', active);
      b.classList.toggle('text-on-surface-variant', !active);
      b.querySelector('.material-symbols-outlined').classList.toggle('fill-icon', active);
    });
  }
  document.querySelectorAll('.nav-btn').forEach((b) =>
    b.addEventListener('click', () => go(b.dataset.nav))
  );

  function render() {
    const fn = { dashboard: renderDashboard, diary: renderDiary, search: renderSearch, favorites: renderFavorites, profile: renderProfile }[current];
    view.innerHTML = `<div class="fade-in">${fn()}</div>`;
    const after = { search: afterSearch, profile: afterProfile }[current];
    if (after) after();
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    const p = Store.getProfile();
    const s = Store.daySummary(Store.todayStr());
    const remaining = p.dailyCalorieTarget - s.calories;
    const ringPct = pct(s.calories, p.dailyCalorieTarget);
    const C = 2 * Math.PI * 90; // r=90
    const offset = C - (ringPct / 100) * C;

    const meals = MEALS.map((m) => {
      const items = s.byMeal[m.key] || [];
      const kcal = items.reduce((a, e) => a + e.calories, 0);
      const sub = items.length ? `${fmt(kcal)} kcal • ${items.length} ${items.length === 1 ? 'Lebensmittel' : 'Lebensmittel'}` : 'Noch nichts eingetragen';
      return `<button data-meal="${m.key}" class="meal-add w-full bg-surface-container-lowest rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.99] transition">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
            <span class="material-symbols-outlined">${m.icon}</span>
          </div>
          <div class="text-left">
            <h3 class="text-label-md text-on-surface">${m.label}</h3>
            <p class="text-body-md text-on-surface-variant">${sub}</p>
          </div>
        </div>
        <span class="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg shrink-0"><span class="material-symbols-outlined">add</span></span>
      </button>`;
    }).join('');

    const macroBars = MACROS.map((m) => {
      const val = s[m.key], target = p[m.tkey];
      return `<div class="space-y-1">
        <div class="flex justify-between text-label-md">
          <span class="text-on-surface">${m.label}</span>
          <span class="text-on-surface-variant">${fmt(val)}g / ${fmt(target)}g</span>
        </div>
        <div class="w-full bg-surface-container rounded-full h-2">
          <div class="${m.bar} h-2 rounded-full transition-all" style="width:${pct(val, target)}%"></div>
        </div>
      </div>`;
    }).join('');

    return `${header(greeting(), dateLabel(Store.todayStr()))}
    <main class="max-w-max-width mx-auto px-container-margin mt-2 space-y-4">
      <section class="glass-card rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col items-center">
        <div class="relative w-56 h-56 flex items-center justify-center">
          <svg class="w-full h-full" viewBox="0 0 224 224">
            <circle class="text-primary-container/20" cx="112" cy="112" r="90" fill="transparent" stroke="currentColor" stroke-width="12"/>
            <circle class="text-primary progress-ring-circle" cx="112" cy="112" r="90" fill="transparent" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"/>
          </svg>
          <div class="absolute flex flex-col items-center">
            <span class="text-display text-on-surface">${fmt(Math.max(0, remaining))}</span>
            <span class="text-label-md text-on-surface-variant uppercase tracking-wider">${remaining < 0 ? 'Überschritten' : 'Verbleibend'}</span>
          </div>
        </div>
        <div class="grid grid-cols-2 w-full mt-6 gap-4 border-t border-outline-variant/20 pt-6">
          <div class="text-center"><p class="text-label-sm text-on-surface-variant">Gegessen</p><p class="text-headline-md text-on-surface">${fmt(s.calories)}</p></div>
          <div class="text-center"><p class="text-label-sm text-on-surface-variant">Tagesziel</p><p class="text-headline-md text-on-surface">${fmt(p.dailyCalorieTarget)}</p></div>
        </div>
      </section>
      <section class="space-y-3">
        <h2 class="text-headline-md text-on-surface">Makronährstoffe</h2>
        <div class="space-y-4 bg-surface-container-lowest p-5 rounded-xl shadow-sm">${macroBars}</div>
      </section>
      <section class="space-y-3 pb-4">${meals}</section>
    </main>`;
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 11) return 'Guten Morgen';
    if (h < 17) return 'Guten Tag';
    return 'Guten Abend';
  }

  // ---------- Tagebuch ----------
  function renderDiary() {
    const p = Store.getProfile();
    const s = Store.daySummary(diaryDate);
    const isToday = diaryDate === Store.todayStr();
    const remaining = p.dailyCalorieTarget - s.calories;

    const sections = MEALS.map((m) => {
      const items = s.byMeal[m.key] || [];
      const kcal = items.reduce((a, e) => a + e.calories, 0);
      const rows = items.length
        ? items.map((e) => `<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col gap-2">
            <div class="flex justify-between items-start">
              <div><h4 class="text-label-md text-on-surface">${esc(e.foodName)}</h4>
                <p class="text-label-sm text-on-surface-variant">${fmt(e.portion)}${e.unit === 'piece' ? ' Stk' : e.unit} • ${new Date(e.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p></div>
              <button data-del="${e.id}" class="del-entry p-1 text-on-surface-variant active:text-error"><span class="material-symbols-outlined text-[20px]">delete</span></button>
            </div>
            <div class="flex items-end gap-3">
              <span class="text-headline-md text-primary">${fmt(e.calories)} <span class="text-label-sm font-normal text-on-surface-variant">kcal</span></span>
              <div class="ml-auto">${macroBadges(e)}</div>
            </div>
          </div>`).join('')
        : `<button data-meal="${m.key}" class="meal-add w-full py-4 border-2 border-dashed border-outline-variant rounded-xl flex items-center justify-center gap-2 text-on-surface-variant active:scale-[0.99] transition">
            <span class="material-symbols-outlined">add_circle</span><span class="text-label-md">${m.label} hinzufügen</span></button>`;
      return `<section class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary">${m.icon}</span>
          <h3 class="text-headline-md text-on-surface">${m.label}</h3>
          <span class="ml-auto text-label-md text-on-surface-variant">${fmt(kcal)} kcal</span>
        </div>
        <div class="space-y-2">${rows}</div>
      </section>`;
    }).join('');

    return `${header('Tagebuch')}
    <main class="max-w-max-width mx-auto px-container-margin mt-1 space-y-6">
      <div class="flex items-center justify-between">
        <button id="d-prev" class="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest shadow-sm active:scale-90 transition"><span class="material-symbols-outlined text-on-surface-variant">chevron_left</span></button>
        <div class="text-center"><p class="text-label-sm text-on-surface-variant uppercase tracking-widest">${isToday ? 'Heute' : ''}</p><p class="text-headline-md">${dateLabel(diaryDate)}</p></div>
        <button id="d-next" ${isToday ? 'disabled' : ''} class="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest shadow-sm active:scale-90 transition ${isToday ? 'opacity-30' : ''}"><span class="material-symbols-outlined text-on-surface-variant">chevron_right</span></button>
      </div>
      <div class="bg-inverse-surface text-inverse-on-surface p-5 rounded-2xl shadow-lg flex justify-between items-center">
        <div><p class="text-label-sm opacity-70 uppercase tracking-wider">Verbleibend</p>
          <p class="text-display text-primary-fixed-dim leading-none">${fmt(Math.max(0, remaining))}<span class="text-label-md opacity-70 ml-1">kcal</span></p></div>
        <div class="text-right text-label-sm opacity-80 space-y-0.5">
          <p>E ${fmt(s.protein)}g</p><p>K ${fmt(s.carbs)}g</p><p>F ${fmt(s.fat)}g</p></div>
      </div>
      ${sections}
    </main>`;
  }

  // ---------- Suche ----------
  let searchAbort = null;
  function renderSearch() {
    return `${header('Suche')}
    <main class="max-w-max-width mx-auto px-container-margin mt-1 space-y-6">
      <div class="flex items-center bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 focus-within:ring-2 ring-primary transition">
        <span class="material-symbols-outlined text-outline mr-3">search</span>
        <input id="q" type="text" inputmode="search" placeholder="Lebensmittel suchen..." class="w-full bg-transparent border-none focus:ring-0 text-body-md p-0 placeholder:text-outline-variant" />
        <button id="scan-btn" class="material-symbols-outlined text-outline ml-3 active:text-primary">photo_camera</button>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <button id="scan-tile" class="bg-primary-container/10 p-4 rounded-xl flex items-center justify-between active:scale-95 transition">
          <div class="text-left"><p class="text-label-md text-primary">Scan</p><p class="text-label-sm text-on-surface-variant">Barcode</p></div>
          <span class="material-symbols-outlined text-primary text-3xl">barcode_scanner</span></button>
        <button id="custom-tile" class="bg-secondary-container/10 p-4 rounded-xl flex items-center justify-between active:scale-95 transition">
          <div class="text-left"><p class="text-label-md text-secondary">Eigenes</p><p class="text-label-sm text-on-surface-variant">Lebensmittel</p></div>
          <span class="material-symbols-outlined text-secondary text-3xl">add_circle</span></button>
      </div>
      <div id="results"></div>
    </main>`;
  }

  function afterSearch() {
    const q = document.getElementById('q');
    const results = document.getElementById('results');
    document.getElementById('scan-btn').addEventListener('click', openScanner);
    document.getElementById('scan-tile').addEventListener('click', openScanner);
    document.getElementById('custom-tile').addEventListener('click', openCustomFood);

    renderSuggestions(results);

    let t;
    q.addEventListener('input', () => {
      clearTimeout(t);
      const term = q.value.trim();
      if (term.length < 2) { renderSuggestions(results); return; }
      t = setTimeout(() => doSearch(term, results), 350);
    });
  }

  function foodRow(food) {
    const data = encodeURIComponent(JSON.stringify(food));
    return `<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex items-center justify-between">
      <div class="flex-1 min-w-0 pr-3">
        <p class="text-label-md text-on-surface truncate">${esc(food.name)}</p>
        <div class="flex items-center gap-2 mt-0.5 flex-wrap">
          <span class="text-label-sm text-primary font-bold">${fmt(food.calories)} kcal<span class="text-outline font-normal">/100${food.unit === 'ml' ? 'ml' : 'g'}</span></span>
          <span class="text-label-sm text-on-surface-variant">E${fmt(food.protein)} K${fmt(food.carbs)} F${fmt(food.fat)}</span>
        </div>
      </div>
      <button class="add-food w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center active:scale-90 transition shrink-0" data-food="${data}">
        <span class="material-symbols-outlined">add</span></button>
    </div>`;
  }

  function renderSuggestions(box) {
    const recent = Store.getRecentFoods(6);
    const favs = Store.getFavorites();
    const custom = Store.getCustomFoods();
    let html = '';
    if (favs.length) html += section('Favoriten', favs.map(foodRow).join(''));
    if (recent.length) html += section('Zuletzt verwendet', recent.map(foodRow).join(''));
    if (custom.length) html += section('Eigene Lebensmittel', custom.map(foodRow).join(''));
    if (!html) html = empty('Noch nichts gespeichert', 'Suche ein Lebensmittel oder lege ein eigenes an.');
    box.innerHTML = html;
    bindFoodRows(box);
  }

  async function doSearch(term, box) {
    box.innerHTML = `<div class="py-10 text-center text-on-surface-variant"><span class="material-symbols-outlined animate-spin">progress_activity</span><p class="mt-2 text-label-md">Suche…</p></div>`;
    if (searchAbort) searchAbort.abort();
    searchAbort = new AbortController();
    try {
      const list = await OFF.search(term, { signal: searchAbort.signal });
      box.innerHTML = list.length
        ? section(`Treffer für „${esc(term)}"`, list.map(foodRow).join(''))
        : empty('Keine Treffer', 'Anderen Begriff versuchen oder eigenes Lebensmittel anlegen.');
      bindFoodRows(box);
    } catch (err) {
      if (err.name === 'AbortError') return;
      box.innerHTML = empty('Offline oder Fehler', 'OpenFoodFacts nicht erreichbar.');
    }
  }

  function section(title, inner) {
    return `<section class="space-y-3 mb-6"><h2 class="text-headline-md text-on-surface px-1">${title}</h2><div class="space-y-2">${inner}</div></section>`;
  }
  function empty(t, s) {
    return `<div class="py-12 text-center text-on-surface-variant"><span class="material-symbols-outlined text-4xl text-outline-variant">inventory_2</span><p class="text-label-md mt-2 text-on-surface">${esc(t)}</p><p class="text-label-sm">${esc(s)}</p></div>`;
  }
  function bindFoodRows(box) {
    box.querySelectorAll('.add-food').forEach((b) =>
      b.addEventListener('click', () => openPortionSheet(JSON.parse(decodeURIComponent(b.dataset.food))))
    );
  }

  // ---------- Favoriten ----------
  function renderFavorites() {
    const favs = Store.getFavorites();
    const body = favs.length
      ? `<div class="grid grid-cols-2 gap-4">${favs.map((f) => {
          const data = encodeURIComponent(JSON.stringify(f));
          return `<div class="bg-surface-container-low p-4 rounded-2xl flex flex-col items-center text-center gap-2 border border-outline-variant/10">
            <button data-unfav="${esc(f.id)}" class="unfav self-end -mt-1 -mr-1 text-secondary"><span class="material-symbols-outlined fill-icon">favorite</span></button>
            <p class="text-label-md text-on-surface truncate w-full">${esc(f.name)}</p>
            <p class="text-label-sm text-outline">${fmt(f.calories)} kcal/100g</p>
            <button class="add-food mt-1 w-full py-2 rounded-full bg-primary text-on-primary text-label-md active:scale-95 transition" data-food="${data}">Hinzufügen</button>
          </div>`;
        }).join('')}</div>`
      : empty('Keine Favoriten', 'Tippe das Herz bei einem Lebensmittel, um es zu merken.');
    return `${header('Favoriten')}<main class="max-w-max-width mx-auto px-container-margin mt-1">${body}</main>`;
  }

  // ---------- Profil ----------
  function renderProfile() {
    const p = Store.getProfile();
    const row = (icon, label, val, id, color) => `<button data-edit="${id}" class="edit-field flex items-center justify-between p-4 w-full hover:bg-surface-container-low transition">
      <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg ${color}/10 flex items-center justify-center"><span class="material-symbols-outlined ${color.replace('bg-', 'text-')} text-[20px]">${icon}</span></div><span class="text-body-md">${label}</span></div>
      <div class="flex items-center gap-2"><span class="text-label-md text-on-surface-variant">${val}</span><span class="material-symbols-outlined text-outline-variant text-[18px]">chevron_right</span></div></button>`;

    const macroSlider = (m) => `<div class="space-y-2">
      <div class="flex justify-between text-label-md"><span class="${m.text} font-semibold">${m.label}</span><span id="${m.key}-val">${fmt(p[m.tkey])}g</span></div>
      <input id="${m.key}-slider" type="range" min="0" max="400" step="5" value="${p[m.tkey]}" class="w-full h-1.5 rounded-lg" /></div>`;

    return `${header('Profil')}
    <main class="max-w-max-width mx-auto px-container-margin mt-1 space-y-6 pb-6">
      <section class="space-y-2">
        <h2 class="text-label-md text-on-surface-variant px-1">PERSÖNLICHE DATEN</h2>
        <div class="bg-surface-container-lowest rounded-xl overflow-hidden divide-y divide-outline-variant/20 shadow-sm">
          ${row('scale', 'Körpergewicht', fmtDec(p.weight) + ' kg', 'weight', 'bg-primary')}
          ${row('height', 'Größe', fmt(p.height) + ' cm', 'height', 'bg-tertiary')}
          ${row('fitness_center', 'Aktivitätslevel', ACTIVITY[p.activityLevel], 'activityLevel', 'bg-secondary')}
        </div>
      </section>
      <section class="space-y-2">
        <h2 class="text-label-md text-on-surface-variant px-1">ERNÄHRUNGSZIELE</h2>
        <div class="bg-surface-container-lowest rounded-xl p-5 space-y-6 shadow-sm">
          <div class="space-y-3">
            <div class="flex justify-between items-center"><div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary">local_fire_department</span><span class="text-body-md font-semibold">Tägliches Kalorienziel</span></div>
              <div class="bg-primary-container/20 px-3 py-1 rounded-full"><span class="text-label-md text-on-primary-container" id="kcal-val">${fmt(p.dailyCalorieTarget)} kcal</span></div></div>
            <input id="kcal-slider" type="range" min="1200" max="4000" step="50" value="${p.dailyCalorieTarget}" class="w-full h-2 rounded-lg" />
          </div>
          <div class="h-px bg-outline-variant/20"></div>
          <div class="space-y-5"><span class="text-label-md text-on-surface-variant block">MAKRONÄHRSTOFFZIELE (g/Tag)</span>
            ${MACROS.map(macroSlider).join('')}</div>
        </div>
      </section>
      <button id="reset-day" class="w-full py-3 text-error font-semibold bg-surface-container-lowest rounded-xl shadow-sm active:scale-[0.98] transition">Heutigen Tag zurücksetzen</button>
      <p class="text-center text-label-sm text-on-surface-variant">Vitality · V1 · lokal gespeichert</p>
    </main>`;
  }

  function afterProfile() {
    // Slider live + speichern
    bindSlider('kcal-slider', 'kcal-val', (v) => fmt(v) + ' kcal', (v) => Store.saveProfile({ dailyCalorieTarget: +v }));
    MACROS.forEach((m) =>
      bindSlider(`${m.key}-slider`, `${m.key}-val`, (v) => fmt(v) + 'g', (v) => Store.saveProfile({ [m.tkey]: +v }))
    );
    document.querySelectorAll('.edit-field').forEach((b) =>
      b.addEventListener('click', () => editProfileField(b.dataset.edit))
    );
    document.getElementById('reset-day').addEventListener('click', () => {
      if (!confirm('Alle heutigen Einträge löschen?')) return;
      Store.getDiaryByDate(Store.todayStr()).forEach((e) => Store.removeDiaryEntry(e.id));
      toast('Heutiger Tag zurückgesetzt');
    });
  }
  function bindSlider(sliderId, valId, label, save) {
    const s = document.getElementById(sliderId), v = document.getElementById(valId);
    s.addEventListener('input', () => { v.textContent = label(s.value); });
    s.addEventListener('change', () => save(s.value));
  }

  function editProfileField(field) {
    const p = Store.getProfile();
    if (field === 'activityLevel') {
      const keys = Object.keys(ACTIVITY);
      const opts = keys.map((k) => `<button data-val="${k}" class="opt w-full text-left p-4 rounded-xl ${k === p.activityLevel ? 'bg-primary-container/15 text-primary font-semibold' : 'bg-surface-container-low'}">${ACTIVITY[k]}</button>`).join('');
      openSheet('Aktivitätslevel', `<div class="space-y-2">${opts}</div>`, (root) => {
        root.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => { Store.saveProfile({ activityLevel: b.dataset.val }); closeModal(); render(); }));
      });
      return;
    }
    const cfg = { weight: ['Körpergewicht', 'kg', 0.1], height: ['Größe', 'cm', 1] }[field];
    openSheet(cfg[0], `<div class="flex items-center gap-3 bg-surface-container-low rounded-xl p-4">
      <input id="pf-input" type="number" step="${cfg[2]}" value="${p[field]}" class="flex-1 bg-transparent border-none focus:ring-0 text-headline-md p-0" />
      <span class="text-on-surface-variant text-body-md">${cfg[1]}</span></div>
      <button id="pf-save" class="mt-4 w-full py-4 rounded-xl bg-primary text-on-primary text-label-md active:scale-95 transition">Speichern</button>`, (root) => {
      root.querySelector('#pf-save').addEventListener('click', () => {
        const val = parseFloat(root.querySelector('#pf-input').value);
        if (Number.isFinite(val)) { Store.saveProfile({ [field]: val }); closeModal(); render(); }
      });
    });
  }

  // ---------- Add-Flow: Portions-Sheet ----------
  let pendingMeal = null;
  function defaultMeal() {
    const h = new Date().getHours();
    if (h < 10) return 'breakfast';
    if (h < 15) return 'lunch';
    if (h < 21) return 'dinner';
    return 'snack';
  }
  // Mahlzeit-Schnellwahl aus Dashboard/Tagebuch
  view.addEventListener('click', (e) => {
    const mealBtn = e.target.closest('.meal-add');
    if (mealBtn) { pendingMeal = mealBtn.dataset.meal; go('search'); }
    const del = e.target.closest('.del-entry');
    if (del) { Store.removeDiaryEntry(del.dataset.del); render(); }
    const unfav = e.target.closest('.unfav');
    if (unfav) { const f = Store.getFavorites().find((x) => x.id === unfav.dataset.unfav); if (f) { Store.toggleFavorite(f); render(); } }
    if (e.target.closest('#d-prev')) { diaryDate = shiftDate(diaryDate, -1); render(); }
    if (e.target.closest('#d-next')) { if (diaryDate !== Store.todayStr()) { diaryDate = shiftDate(diaryDate, 1); render(); } }
  });

  function openPortionSheet(food) {
    const meal = pendingMeal || defaultMeal();
    pendingMeal = null;
    const unitLabel = food.unit === 'ml' ? 'ml' : food.unit === 'piece' ? 'Stück' : 'g';
    const start = food.portion || 100;
    const fav = food.id ? Store.isFavorite(food.id) : false;

    const mealOpts = MEALS.map((m) => `<button data-m="${m.key}" class="m-opt px-3 py-2 rounded-full text-label-md whitespace-nowrap ${m.key === meal ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}">${m.label}</button>`).join('');

    openSheet(food.name, `
      <div class="flex items-center justify-between mb-4">
        <p class="text-label-md text-on-surface-variant">${fmt(food.calories)} kcal · E${fmt(food.protein)} K${fmt(food.carbs)} F${fmt(food.fat)} /100${food.unit === 'ml' ? 'ml' : 'g'}</p>
        <button id="fav-toggle" class="${fav ? 'text-secondary' : 'text-outline-variant'}"><span class="material-symbols-outlined ${fav ? 'fill-icon' : ''}">favorite</span></button>
      </div>
      <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">${mealOpts}</div>
      <label class="text-label-md text-on-surface-variant">Menge (${unitLabel})</label>
      <div class="flex items-center gap-3 bg-surface-container-low rounded-xl p-4 mt-1">
        <input id="portion" type="number" inputmode="decimal" step="${food.unit === 'piece' ? 1 : 10}" value="${start}" class="flex-1 bg-transparent border-none focus:ring-0 text-headline-md p-0" />
        <span class="text-on-surface-variant">${unitLabel}</span>
      </div>
      <div class="grid grid-cols-4 gap-2 mt-3 mb-5">
        ${(food.unit === 'piece' ? [1, 2, 3, 5] : [50, 100, 150, 200]).map((q) => `<button data-q="${q}" class="quick-q py-2 rounded-lg bg-surface-container text-label-md text-on-surface-variant active:scale-95 transition">${q}</button>`).join('')}
      </div>
      <div class="flex items-center justify-between bg-primary/5 rounded-xl p-4 mb-4">
        <span class="text-label-md text-on-surface-variant">Ergibt</span>
        <span id="calc-kcal" class="text-headline-md text-primary">0 kcal</span>
      </div>
      <button id="confirm-add" class="w-full py-4 rounded-xl bg-primary text-on-primary text-label-md flex items-center justify-center gap-2 active:scale-95 transition shadow-lg">
        <span class="material-symbols-outlined fill-icon text-[20px]">check_circle</span>Hinzufügen</button>
    `, (root) => {
      let selMeal = meal;
      const portion = root.querySelector('#portion');
      const calc = root.querySelector('#calc-kcal');
      const update = () => {
        const por = parseFloat(portion.value) || 0;
        const factor = food.unit === 'piece' ? por : por / 100;
        calc.textContent = `${fmt(food.calories * factor)} kcal`;
      };
      update();
      portion.addEventListener('input', update);
      root.querySelectorAll('.quick-q').forEach((b) => b.addEventListener('click', () => { portion.value = b.dataset.q; update(); }));
      root.querySelectorAll('.m-opt').forEach((b) => b.addEventListener('click', () => {
        selMeal = b.dataset.m;
        root.querySelectorAll('.m-opt').forEach((x) => { x.classList.remove('bg-primary', 'text-on-primary'); x.classList.add('bg-surface-container', 'text-on-surface-variant'); });
        b.classList.add('bg-primary', 'text-on-primary'); b.classList.remove('bg-surface-container', 'text-on-surface-variant');
      }));
      root.querySelector('#fav-toggle').addEventListener('click', (ev) => {
        if (!food.id) food.id = Store.uid();
        const now = Store.toggleFavorite(food);
        const btn = ev.currentTarget, ic = btn.querySelector('.material-symbols-outlined');
        btn.className = now ? 'text-secondary' : 'text-outline-variant';
        ic.classList.toggle('fill-icon', now);
      });
      root.querySelector('#confirm-add').addEventListener('click', () => {
        const por = parseFloat(portion.value);
        if (!por || por <= 0) { toast('Menge eingeben'); return; }
        Store.addDiaryEntry(food, por, selMeal, current === 'diary' ? diaryDate : Store.todayStr());
        closeModal();
        toast(`${food.name} hinzugefügt`);
        go('dashboard');
      });
    });
  }

  // ---------- Eigenes Lebensmittel ----------
  function openCustomFood() {
    const f = (id, label, unit) => `<div class="flex items-center justify-between bg-surface-container-low rounded-xl p-3">
      <label class="text-body-md">${label}</label>
      <div class="flex items-center gap-2"><input id="cf-${id}" type="number" inputmode="decimal" class="w-24 bg-transparent border-none focus:ring-0 text-right text-label-md p-0" placeholder="0" /><span class="text-on-surface-variant text-label-sm w-6">${unit}</span></div></div>`;
    openSheet('Eigenes Lebensmittel', `
      <div class="bg-surface-container-low rounded-xl p-3 mb-3"><input id="cf-name" type="text" placeholder="Name" class="w-full bg-transparent border-none focus:ring-0 text-body-md p-0" /></div>
      <p class="text-label-sm text-on-surface-variant mb-2 px-1">Werte pro 100 g</p>
      <div class="space-y-2">
        ${f('calories', 'Kalorien', 'kcal')}${f('protein', 'Eiweiß', 'g')}${f('carbs', 'Kohlenhydrate', 'g')}${f('fat', 'Fett', 'g')}
      </div>
      <button id="cf-save" class="mt-5 w-full py-4 rounded-xl bg-primary text-on-primary text-label-md active:scale-95 transition">Anlegen & hinzufügen</button>
    `, (root) => {
      root.querySelector('#cf-save').addEventListener('click', () => {
        const name = root.querySelector('#cf-name').value.trim();
        if (!name) { toast('Name eingeben'); return; }
        const food = Store.addCustomFood({
          name, unit: 'g',
          calories: +root.querySelector('#cf-calories').value || 0,
          protein: +root.querySelector('#cf-protein').value || 0,
          carbs: +root.querySelector('#cf-carbs').value || 0,
          fat: +root.querySelector('#cf-fat').value || 0,
        });
        closeModal();
        openPortionSheet(food);
      });
    });
  }

  // ---------- Barcode-Scanner (ZXing, lazy) ----------
  let zxingLoaded = null;
  function loadZXing() {
    if (zxingLoaded) return zxingLoaded;
    zxingLoaded = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
    return zxingLoaded;
  }
  async function openScanner() {
    if (!navigator.mediaDevices?.getUserMedia) { toast('Kamera nicht verfügbar'); return; }
    modalRoot.innerHTML = `<div class="fixed inset-0 z-50 bg-black flex flex-col">
      <div class="flex justify-between items-center p-5 text-white"><button id="sc-close" class="w-10 h-10 flex items-center justify-center rounded-full bg-white/15"><span class="material-symbols-outlined">close</span></button><span class="text-label-md">Barcode scannen</span><div class="w-10"></div></div>
      <div class="flex-1 relative flex items-center justify-center overflow-hidden">
        <video id="sc-video" class="w-full h-full object-cover" muted playsinline></video>
        <div class="absolute w-64 h-40 border-2 border-primary rounded-xl"></div>
      </div>
      <p id="sc-status" class="text-center text-white/80 text-label-md py-6">Kamera wird gestartet…</p></div>`;
    const status = document.getElementById('sc-status');
    let reader, stream;
    const cleanup = () => { try { reader?.reset(); } catch {} try { stream?.getTracks().forEach((t) => t.stop()); } catch {} modalRoot.innerHTML = ''; };
    document.getElementById('sc-close').addEventListener('click', cleanup);
    try {
      await loadZXing();
      reader = new ZXing.BrowserMultiFormatReader();
      status.textContent = 'Barcode in den Rahmen halten';
      reader.decodeFromVideoDevice(null, 'sc-video', async (result, err, controls) => {
        if (result) {
          const code = result.getText();
          status.textContent = `Gefunden: ${code} — lade…`;
          try {
            const food = await OFF.byBarcode(code);
            cleanup();
            if (food) openPortionSheet(food);
            else toast('Produkt nicht in OpenFoodFacts');
          } catch { cleanup(); toast('Offline – Barcode nicht ladbar'); }
        }
      });
    } catch (e) { status.textContent = 'Scanner konnte nicht starten'; }
  }

  // ---------- Sheet / Modal ----------
  function openSheet(title, inner, onMount) {
    modalRoot.innerHTML = `<div id="overlay" class="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
      <div id="sheet" class="bg-background w-full max-w-max-width rounded-t-2xl p-5 pb-8 max-h-[88vh] overflow-y-auto no-scrollbar sheet-enter transition-transform duration-300">
        <div class="flex items-center justify-between mb-4"><h3 class="text-headline-md text-on-surface pr-4 truncate">${esc(title)}</h3>
          <button id="sheet-close" class="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant shrink-0"><span class="material-symbols-outlined text-[20px]">close</span></button></div>
        <div id="sheet-body">${inner}</div></div></div>`;
    const sheet = document.getElementById('sheet');
    requestAnimationFrame(() => { sheet.classList.remove('sheet-enter'); sheet.classList.add('sheet-open'); });
    document.getElementById('sheet-close').addEventListener('click', closeModal);
    document.getElementById('overlay').addEventListener('click', (e) => { if (e.target.id === 'overlay') closeModal(); });
    if (onMount) onMount(document.getElementById('sheet-body'));
  }
  function closeModal() { modalRoot.innerHTML = ''; }

  // ---------- Toast ----------
  let toastT;
  function toast(msg) {
    clearTimeout(toastT);
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] bg-inverse-surface text-inverse-on-surface px-5 py-3 rounded-full text-label-md shadow-lg transition-opacity'; document.body.appendChild(t); }
    t.textContent = msg; t.style.opacity = '1';
    toastT = setTimeout(() => { t.style.opacity = '0'; }, 1800);
  }

  // ---------- Start ----------
  go('dashboard');
})();
