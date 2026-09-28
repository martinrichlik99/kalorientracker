// app.js — UI, Navigation, Render, Add-Flow, Barcode
(function () {
  const view = document.getElementById('view');
  const modalRoot = document.getElementById('modal-root');

  let current = 'dashboard';
  let diaryDate = Store.todayStr();
  const openMeals = new Set();
  let suppressRowClick = false;

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
  const SEX = { male: 'Männlich', female: 'Weiblich' };
  const GOAL = { lose: 'Abnehmen', maintain: 'Halten', gain: 'Zunehmen' };
  const PACE = { gentle: 'Sanft', steady: 'Stetig', aggressive: 'Aggressiv' };

  // ---------- Helfer ----------
  const fmt = (n) => new Intl.NumberFormat('de-DE').format(Math.round(n));
  const fmtDec = (n) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(n);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pct = (v, t) => (t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0);
  const round = (n) => Math.round((n + Number.EPSILON) * 10) / 10;

  function dateLabel(str) {
    const d = new Date(str + 'T00:00:00');
    return new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  }
  function shiftDate(str, days) {
    const d = new Date(str + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return Store.todayStr(d);
  }

  function header(title, sub, right) {
    return `<header class="sticky top-0 z-30 bg-background/85 backdrop-blur-md">
      <div class="flex justify-between items-center px-container-margin py-4 max-w-max-width mx-auto">
        <div class="flex flex-col">
          <h1 class="text-headline-lg text-primary">${esc(title)}</h1>
          ${sub ? `<p class="text-body-md text-on-surface-variant">${esc(sub)}</p>` : ''}
        </div>
        ${right || ''}
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
    const C = 2 * Math.PI * 64; // r=64 (kleinerer Ring, mehr passt auf den Bildschirm)
    const offset = C - (ringPct / 100) * C;
    const yesterday = Store.daySummary(shiftDate(Store.todayStr(), -1)).byMeal;

    const meals = MEALS.map((m) => {
      const items = s.byMeal[m.key] || [];
      const kcal = items.reduce((a, e) => a + e.calories, 0);
      const yItems = items.length ? [] : yesterday[m.key];
      const yKcal = yItems.reduce((a, e) => a + e.calories, 0);
      const sub = items.length ? `${fmt(kcal)} kcal • ${items.length} ${items.length === 1 ? 'Eintrag' : 'Einträge'}` : yItems.length ? `Gestern ${fmt(yKcal)} kcal` : 'Noch nichts eingetragen';
      const copyBtn = yItems.length
        ? `<button data-copy-meal="${m.key}" title="${m.label} von gestern übernehmen" aria-label="${m.label} von gestern übernehmen" class="meal-copy w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 active:scale-90 transition"><span class="material-symbols-outlined">history</span></button>`
        : '';
      const offen = openMeals.has(m.key) && items.length > 0;
      const liste = offen ? `<div class="px-4 pb-4 space-y-2">${items.map(entryRowCompact).join('')}</div>` : '';
      return `<div class="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 gap-3">
          <button data-meal-toggle="${m.key}" class="meal-toggle flex items-center gap-4 flex-1 min-w-0 text-left active:opacity-70 transition">
            <div class="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary shrink-0">
              <span class="material-symbols-outlined">${m.icon}</span>
            </div>
            <div class="min-w-0">
              <h3 class="text-label-md text-on-surface">${m.label}</h3>
              <p class="text-body-md text-on-surface-variant">${sub}</p>
            </div>
            ${items.length ? `<span class="material-symbols-outlined text-on-surface-variant transition-transform ${offen ? 'rotate-180' : ''}">expand_more</span>` : ''}
          </button>
          ${copyBtn}
          <button data-meal="${m.key}" title="${m.label} hinzufügen" class="meal-add w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg shrink-0 active:scale-90 transition"><span class="material-symbols-outlined">add</span></button>
        </div>
        ${liste}
      </div>`;
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

    return `${header(greeting(), dateLabel(Store.todayStr()), `<button id="export-data-top" title="Daten exportieren" class="w-9 h-9 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface-variant active:scale-90 transition shrink-0"><span class="material-symbols-outlined text-[18px]">ios_share</span></button>`)}
    <main class="max-w-max-width mx-auto px-container-margin mt-2 space-y-4">
      <section class="glass-card rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex items-center gap-5">
        <div class="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg class="w-full h-full" viewBox="0 0 160 160">
            <circle class="text-primary-container/20" cx="80" cy="80" r="64" fill="transparent" stroke="currentColor" stroke-width="10"/>
            <circle class="text-primary progress-ring-circle" cx="80" cy="80" r="64" fill="transparent" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"/>
          </svg>
          <div class="absolute flex flex-col items-center">
            <span class="text-headline-lg text-on-surface">${fmt(Math.max(0, remaining))}</span>
            <span class="text-[10px] text-on-surface-variant uppercase tracking-wider">${remaining < 0 ? 'Über' : 'Übrig'}</span>
          </div>
        </div>
        <div class="grid grid-cols-2 flex-1 gap-3 border-l border-outline-variant/20 pl-5">
          <div><p class="text-label-sm text-on-surface-variant">Gegessen</p><p class="text-headline-md text-on-surface">${fmt(s.calories)}</p></div>
          <div><p class="text-label-sm text-on-surface-variant">Tagesziel</p><p class="text-headline-md text-on-surface">${fmt(p.dailyCalorieTarget)}</p></div>
        </div>
      </section>
      <section class="space-y-2">
        <h2 class="text-label-md text-on-surface-variant">Makronährstoffe</h2>
        <div class="space-y-2 bg-surface-container-lowest p-4 rounded-xl shadow-sm">${macroBars}</div>
      </section>
      <section class="space-y-3">${meals}</section>
      ${weekCard(p.dailyCalorieTarget)}
    </main>`;
  }

  function weekCard(target) {
    const today = Store.todayStr();
    const days = Store.weekSummary(today);
    const max = Math.max(target * 1.25, ...days.map((d) => d.calories));
    const logged = days.filter((d) => d.count && d.date !== today); // heute ist noch nicht vorbei
    const avg = logged.length ? logged.reduce((a, d) => a + d.calories, 0) / logged.length : 0;
    const inTarget = logged.filter((d) => d.calories <= target).length;
    const wd = new Intl.DateTimeFormat('de-DE', { weekday: 'short' });
    const targetPos = Math.round((target / max) * 100);
    const bars = days.map((d) => {
      const over = d.calories > target;
      return `<button data-week-day="${d.date}" aria-label="${dateLabel(d.date)}: ${fmt(d.calories)} kcal" class="week-day flex-1 flex flex-col items-center gap-1 active:opacity-70">
        <div class="relative w-full h-20 flex items-end justify-center">
          <div class="absolute inset-x-0 border-t border-dashed border-outline-variant" style="bottom:${targetPos}%"></div>
          <div class="relative w-5 rounded-t-md ${over ? 'bg-error' : 'bg-primary'}" style="height:${Math.round((d.calories / max) * 100)}%"></div>
        </div>
        <span class="text-label-sm ${d.date === today ? 'text-primary font-bold' : 'text-on-surface-variant'}">${wd.format(new Date(d.date + 'T00:00:00')).replace('.', '')}</span>
      </button>`;
    }).join('');
    return `<section class="space-y-2 pb-4">
      <div class="flex justify-between items-baseline">
        <h2 class="text-label-md text-on-surface-variant">Diese Woche</h2>
        <span class="text-label-sm text-on-surface-variant">${logged.length ? `Ø ${fmt(avg)} kcal · ${inTarget}/${logged.length} Tage im Ziel` : 'Noch keine vollen Tage'}</span>
      </div>
      <div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex">${bars}</div>
    </section>`;
  }

  function entryRowCompact(e) {
    const einheit = e.unit === 'piece' ? ' Stk' : e.unit;
    return `<div data-swipe-del="${e.id}" data-edit-entry="${e.id}" class="entry-row flex items-center gap-2 bg-surface-container rounded-lg pl-3">
      <div class="min-w-0 flex-1 py-2">
        <p class="text-label-md text-on-surface truncate">${esc(e.foodName)}</p>
        <p class="text-label-sm text-on-surface-variant">${fmt(e.portion)}${einheit} • ${fmt(e.calories)} kcal</p>
      </div>
      <button data-del="${e.id}" title="Eintrag löschen" class="del-entry w-11 h-11 flex items-center justify-center text-on-surface-variant active:text-error shrink-0"><span class="material-symbols-outlined text-[20px]">delete</span></button>
    </div>`;
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
        ? items.map((e) => `<div data-swipe-del="${e.id}" data-edit-entry="${e.id}" class="entry-row bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col gap-2">
            <div class="flex justify-between items-start">
              <div><h4 class="text-label-md text-on-surface">${esc(e.foodName)}</h4>
                <p class="text-label-sm text-on-surface-variant">${fmt(e.portion)}${e.unit === 'piece' ? ' Stk' : e.unit} • ${new Date(e.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p></div>
              <button data-del="${e.id}" title="Eintrag löschen" class="del-entry w-11 h-11 -mt-2 -mr-2 flex items-center justify-center text-on-surface-variant active:text-error shrink-0"><span class="material-symbols-outlined text-[20px]">delete</span></button>
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
      <div class="grid grid-cols-3 gap-3">
        <button id="scan-tile" class="bg-primary-container/10 p-3 rounded-xl flex flex-col items-start gap-1 active:scale-95 transition">
          <span class="material-symbols-outlined text-primary text-3xl">barcode_scanner</span>
          <div class="text-left"><p class="text-label-md text-primary">Scan</p><p class="text-label-sm text-on-surface-variant">Barcode</p></div></button>
        <button id="custom-tile" class="bg-secondary-container/10 p-3 rounded-xl flex flex-col items-start gap-1 active:scale-95 transition">
          <span class="material-symbols-outlined text-secondary text-3xl">add_circle</span>
          <div class="text-left"><p class="text-label-md text-secondary">Eigenes</p><p class="text-label-sm text-on-surface-variant">Lebensmittel</p></div></button>
        <button id="recipe-tile" class="bg-tertiary-container/10 p-3 rounded-xl flex flex-col items-start gap-1 active:scale-95 transition">
          <span class="material-symbols-outlined text-tertiary text-3xl">skillet</span>
          <div class="text-left"><p class="text-label-md text-tertiary">Rezept</p><p class="text-label-sm text-on-surface-variant">Zutaten</p></div></button>
      </div>
      <div id="results"></div>
    </main>`;
  }

  function afterSearch() {
    const q = document.getElementById('q');
    const results = document.getElementById('results');
    document.getElementById('scan-btn').addEventListener('click', openScanner);
    document.getElementById('scan-tile').addEventListener('click', openScanner);
    document.getElementById('custom-tile').addEventListener('click', () => openCustomFood());
    document.getElementById('recipe-tile').addEventListener('click', () => openRecipe());

    renderSuggestions(results);

    let t;
    q.addEventListener('input', () => {
      clearTimeout(t);
      const term = q.value.trim();
      if (term.length < 2) { renderSuggestions(results); return; }
      t = setTimeout(() => doSearch(term, results), 350);
    });
  }

  function foodRow(food, editable = false) {
    const data = encodeURIComponent(JSON.stringify(food));
    const fav = Store.isFavorite(food.id);
    return `<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex items-center justify-between">
      <div class="flex-1 min-w-0 pr-3">
        <p class="text-label-md text-on-surface truncate">${food.recipe ? '<span class="material-symbols-outlined text-[16px] text-tertiary align-[-3px] mr-1">skillet</span>' : ''}${esc(food.name)}</p>
        <div class="flex items-center gap-2 mt-0.5 flex-wrap">
          <span class="text-label-sm text-primary font-bold">${fmt(food.calories)} kcal<span class="text-outline font-normal">/100${food.unit === 'ml' ? 'ml' : 'g'}</span></span>
          <span class="text-label-sm text-on-surface-variant">E${fmt(food.protein)} K${fmt(food.carbs)} F${fmt(food.fat)}</span>
          ${food.serving && food.source === 'custom' ? `<span class="text-label-sm text-outline">1 Port. = ${fmt(food.serving)} g</span>` : ''}
        </div>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        ${editable ? `<button class="edit-custom w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant active:scale-90 transition" data-edit-custom="${esc(food.id)}" title="Bearbeiten"><span class="material-symbols-outlined text-[20px]">edit</span></button>` : ''}
        <button class="row-fav w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition ${fav ? 'text-secondary' : 'text-on-surface-variant'}" data-fav-food="${data}" title="Als Favorit merken">
          <span class="material-symbols-outlined ${fav ? 'fill-icon' : ''}">favorite</span></button>
        <button class="add-food w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center active:scale-90 transition shrink-0" data-food="${data}">
          <span class="material-symbols-outlined">add</span></button>
      </div>
    </div>`;
  }

  function renderSuggestions(box) {
    const recent = Store.getRecentFoods(6);
    const favs = Store.getFavorites();
    const custom = Store.getCustomFoods();
    let html = '';
    if (favs.length) html += section('Favoriten', favs.map((f) => foodRow(f)).join(''));
    if (recent.length) html += section('Zuletzt verwendet', recent.map((f) => foodRow(f)).join(''));
    if (custom.length) html += section('Eigene Lebensmittel & Rezepte', custom.map((f) => foodRow(f, true)).join(''));
    if (!html) html = empty('Noch nichts gespeichert', 'Suche ein Lebensmittel oder lege ein eigenes an.');
    box.innerHTML = html;
  }

  async function doSearch(term, box) {
    box.innerHTML = `<div class="py-10 text-center text-on-surface-variant"><span class="material-symbols-outlined animate-spin">progress_activity</span><p class="mt-2 text-label-md">Suche…</p></div>`;
    if (searchAbort) searchAbort.abort();
    searchAbort = new AbortController();
    const sig = { signal: searchAbort.signal };
    try {
        // Lokale DE-Datenbank sofort (synchron)
      const local = FoodsDE.search(term);
      // Lokale Treffer sofort zeigen — Netzquellen schieben sich danach dazu
      if (local.length) {
        box.innerHTML =
          section(`Treffer für „${esc(term)}"`, local.map((f) => foodRow(f)).join('')) +
          `<p class="text-label-sm text-outline px-1 -mt-4 mb-6">Suche weitere Quellen…</p>`;
      }

      const [offResults, usdaResults] = await Promise.allSettled([
        OFF.search(term, sig),
        USDA.search(term, sig),
      ]);
      if (offResults.reason?.name === 'AbortError') return;

      const off = offResults.status === 'fulfilled' ? offResults.value : [];
      const usda = usdaResults.status === 'fulfilled' ? usdaResults.value : [];

      // Duplikate raus — lokale Treffer haben Vorrang
      const localNames = new Set(local.map((f) => f.name.toLowerCase()));
      const offFiltered = off.filter((f) => !localNames.has(f.name.toLowerCase()));
      const allNames = new Set([...localNames, ...offFiltered.map((f) => f.name.toLowerCase())]);
      const usdaFiltered = usda.filter((f) => !allNames.has(f.name.toLowerCase()));

      const list = [...local, ...offFiltered, ...usdaFiltered];
      const hinweis =
        offResults.status === 'rejected'
          ? `<p class="text-label-sm text-outline px-1 -mt-4 mb-6">OpenFoodFacts gerade nicht erreichbar — verpackte Produkte fehlen.</p>`
          : '';
      box.innerHTML = list.length
        ? section(`Treffer für „${esc(term)}"`, list.map((f) => foodRow(f)).join('')) + hinweis
        : empty(
            'Keine Treffer',
            offResults.status === 'rejected'
              ? 'OpenFoodFacts nicht erreichbar. Nochmal versuchen oder eigenes Lebensmittel anlegen.'
              : 'Anderen Begriff versuchen oder eigenes Lebensmittel anlegen.'
          );
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
  // .add-food wird zentral im delegierten view-Listener behandelt (gilt auch für Favoriten)

  // ---------- Favoriten ----------
  function renderFavorites() {
    const favs = Store.getFavorites();
    const body = favs.length
      ? `<div class="grid grid-cols-2 gap-4">${favs.map((f) => {
          const data = encodeURIComponent(JSON.stringify(f));
          return `<div class="bg-surface-container-low p-4 rounded-2xl flex flex-col items-center text-center gap-2 border border-outline-variant/10">
            <button data-unfav="${esc(f.id)}" title="Favorit entfernen" class="unfav self-end -mt-2 -mr-2 w-10 h-10 flex items-center justify-center text-secondary active:scale-90 transition"><span class="material-symbols-outlined fill-icon">favorite</span></button>
            <p class="text-label-md text-on-surface truncate w-full">${esc(f.name)}</p>
            <p class="text-label-sm text-outline">${fmt(f.calories)} kcal/100${f.unit === 'ml' ? 'ml' : 'g'}</p>
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
          ${row('cake', 'Alter', fmt(p.age) + ' Jahre', 'age', 'bg-tertiary')}
          ${row('person', 'Biologisches Geschlecht', SEX[p.sex], 'sex', 'bg-secondary')}
          ${row('fitness_center', 'Aktivitätslevel', ACTIVITY[p.activityLevel], 'activityLevel', 'bg-secondary')}
        </div>
      </section>
      <section class="space-y-2">
        <h2 class="text-label-md text-on-surface-variant px-1">ZIEL</h2>
        <div class="bg-surface-container-lowest rounded-xl overflow-hidden divide-y divide-outline-variant/20 shadow-sm">
          ${row('flag', 'Ziel', GOAL[p.goal], 'goal', 'bg-primary')}
          ${row('speed', 'Tempo', PACE[p.pace], 'pace', 'bg-secondary')}
          ${row('target', 'Zielgewicht', p.targetWeight != null ? fmtDec(p.targetWeight) + ' kg' : '– (optional)', 'targetWeight', 'bg-tertiary')}
        </div>
      </section>
      <section class="space-y-2">
        <h2 class="text-label-md text-on-surface-variant px-1">ERNÄHRUNGSZIELE</h2>
        <div class="bg-surface-container-lowest rounded-xl p-5 space-y-6 shadow-sm">
          <button id="calc-open" class="w-full py-3 text-primary font-semibold bg-primary/5 rounded-xl active:scale-[0.98] transition flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-[20px]">calculate</span>Ziele berechnen
          </button>
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
      <section class="space-y-2">
        <h2 class="text-label-md text-on-surface-variant px-1">SICHERUNG</h2>
        <div class="bg-surface-container-lowest rounded-xl p-4 space-y-3 shadow-sm">
          <p class="text-label-sm text-on-surface-variant px-1">Alle Daten (Profil, Tagebuch, Favoriten, eigene Lebensmittel) als Datei sichern — vor dem Testen einer neuen Version empfohlen.</p>
          <button id="backup-save" class="w-full py-3 text-primary font-semibold bg-primary/5 rounded-xl active:scale-[0.98] transition flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-[20px]">save</span>Vollständige Sicherung erstellen
          </button>
          <button id="backup-restore" class="w-full py-3 text-on-surface-variant font-semibold bg-surface-container rounded-xl active:scale-[0.98] transition flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-[20px]">restore</span>Aus Sicherung wiederherstellen
          </button>
          <input id="backup-file" type="file" accept="application/json,.json" class="hidden" />
          <p class="text-label-sm text-on-surface-variant px-1 pt-2">Automatische Sicherungen (je Tag, letzte 7) — Antippen holt den Stand zurück:</p>
          <div id="snap-list" class="space-y-2"></div>
        </div>
      </section>
      <button id="export-data" class="w-full py-3 text-primary font-semibold bg-surface-container-lowest rounded-xl shadow-sm active:scale-[0.98] transition flex items-center justify-center gap-2">
        <span class="material-symbols-outlined text-[20px]">ios_share</span>Daten exportieren (Fitness-Dashboard)
      </button>
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
    document.getElementById('calc-open').addEventListener('click', openGoalCalculator);
    document.getElementById('reset-day').addEventListener('click', () => {
      if (!confirm('Alle heutigen Einträge löschen?')) return;
      Store.getDiaryByDate(Store.todayStr()).forEach((e) => Store.removeDiaryEntry(e.id));
      toast('Heutiger Tag zurückgesetzt');
    });
    document.getElementById('export-data').addEventListener('click', exportForDashboard);
    document.getElementById('backup-save').addEventListener('click', saveFullBackup);
    document.getElementById('backup-restore').addEventListener('click', () => document.getElementById('backup-file').click());
    document.getElementById('backup-file').addEventListener('change', (ev) => {
      const file = ev.target.files[0];
      ev.target.value = '';
      if (file) restoreFullBackup(file);
    });
    renderSnapshots();
  }

  async function renderSnapshots() {
    const list = await Store.listSnapshots();
    const box = document.getElementById('snap-list');
    if (!box) return;
    const when = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
    const label = (s) => (s.id === 'before-restore' ? 'Vor letzter Wiederherstellung' : when.format(new Date(s.exportedAt)));
    box.innerHTML = list.length
      ? list.map((s) => `<button data-snap="${esc(s.id)}" data-label="${esc(label(s))}" class="snap w-full flex justify-between items-center p-3 rounded-lg bg-surface-container-low text-left active:scale-[0.99] transition">
          <span class="text-label-md">${esc(label(s))}</span><span class="text-label-sm text-on-surface-variant">${s.entries} ${s.entries === 1 ? 'Eintrag' : 'Einträge'}</span></button>`).join('')
      : '<p class="text-label-sm text-outline px-1">Noch keine vorhanden.</p>';
    box.querySelectorAll('.snap').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm(`Stand „${b.dataset.label}" zurückholen? Der aktuelle Stand wird vorher gesichert.`)) return;
      if (await Store.restoreSnapshot(b.dataset.snap)) { toast('Stand zurückgeholt'); render(); }
      else toast('Sicherung nicht lesbar');
    }));
  }

  // ---------- Vollstaendige Sicherung / Wiederherstellung ----------
  async function saveFullBackup() {
    const payload = Store.exportBackup();
    const json = JSON.stringify(payload, null, 2);
    const stamp = Store.todayStr();
    const file = new File([json], `kalorientracker-backup-${stamp}.json`, { type: 'application/json' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Kalorientracker-Sicherung' });
        toast('Sicherung geteilt');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    toast('Sicherung heruntergeladen');
  }

  function restoreFullBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try {
        data = JSON.parse(reader.result);
      } catch {
        toast('Datei ist keine gültige Sicherung');
        return;
      }
      if (!confirm('Aktuelle Daten mit dieser Sicherung überschreiben?')) return;
      try {
        Store.restoreBackup(data);
        toast('Wiederhergestellt');
        render();
      } catch {
        toast('Sicherung konnte nicht gelesen werden');
      }
    };
    reader.readAsText(file);
  }

  // ---------- Export für Fitness-Dashboard ----------
  async function exportForDashboard() {
    const p = Store.getProfile();
    const payload = {
      exportedAt: new Date().toISOString(),
      targets: { calories: p.dailyCalorieTarget, protein: p.proteinTarget, carbs: p.carbsTarget, fat: p.fatTarget },
      days: Store.getAllDaySummaries(),
    };
    const json = JSON.stringify(payload, null, 2);
    const file = new File([json], 'kalorientracker-export.json', { type: 'application/json' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Kalorientracker-Export' });
        toast('Export geteilt');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // Nutzer hat abgebrochen
      }
    }
    // Fallback: normaler Download (Desktop-Browser)
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    toast('Export heruntergeladen');
  }
  function bindSlider(sliderId, valId, label, save) {
    const s = document.getElementById(sliderId), v = document.getElementById(valId);
    s.addEventListener('input', () => { v.textContent = label(s.value); });
    s.addEventListener('change', () => save(s.value));
  }

  function editProfileField(field) {
    const p = Store.getProfile();
    const choiceMaps = { activityLevel: ACTIVITY, sex: SEX, goal: GOAL, pace: PACE };
    if (choiceMaps[field]) {
      const map = choiceMaps[field];
      const titles = { activityLevel: 'Aktivitätslevel', sex: 'Biologisches Geschlecht', goal: 'Ziel', pace: 'Tempo' };
      const opts = Object.keys(map).map((k) => `<button data-val="${k}" class="opt w-full text-left p-4 rounded-xl ${k === p[field] ? 'bg-primary-container/15 text-primary font-semibold' : 'bg-surface-container-low'}">${map[k]}</button>`).join('');
      openSheet(titles[field], `<div class="space-y-2">${opts}</div>`, (root) => {
        root.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => { Store.saveProfile({ [field]: b.dataset.val }); closeModal(); render(); }));
      });
      return;
    }
    const numCfg = {
      weight: ['Körpergewicht', 'kg', 0.1],
      height: ['Größe', 'cm', 1],
      age: ['Alter', 'Jahre', 1],
      targetWeight: ['Zielgewicht', 'kg', 0.1],
    };
    const cfg = numCfg[field];
    const optional = field === 'targetWeight';
    openSheet(cfg[0], `<div class="flex items-center gap-3 bg-surface-container-low rounded-xl p-4">
      <input id="pf-input" type="number" step="${cfg[2]}" value="${p[field] ?? ''}" placeholder="${optional ? 'optional' : ''}" class="flex-1 bg-transparent border-none focus:ring-0 text-headline-md p-0" />
      <span class="text-on-surface-variant text-body-md">${cfg[1]}</span></div>
      <button id="pf-save" class="mt-4 w-full py-4 rounded-xl bg-primary text-on-primary text-label-md active:scale-95 transition">Speichern</button>`, (root) => {
      root.querySelector('#pf-save').addEventListener('click', () => {
        const raw = root.querySelector('#pf-input').value.trim();
        if (optional && raw === '') { Store.saveProfile({ [field]: null }); closeModal(); render(); return; }
        const val = parseFloat(raw);
        if (Number.isFinite(val)) { Store.saveProfile({ [field]: val }); closeModal(); render(); }
      });
    });
  }

  function openGoalCalculator() {
    const p = Store.getProfile();
    const r = Store.calcTargets(p);
    openSheet('Ziele berechnen', `<div class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-surface-container-low rounded-xl p-3"><p class="text-label-sm text-on-surface-variant">Grundumsatz</p><p class="text-headline-sm text-on-surface">${fmt(r.bmr)} kcal</p></div>
        <div class="bg-surface-container-low rounded-xl p-3"><p class="text-label-sm text-on-surface-variant">Gesamtumsatz</p><p class="text-headline-sm text-on-surface">${fmt(r.tdee)} kcal</p></div>
      </div>
      <div class="bg-primary-container/15 rounded-xl p-4 text-center">
        <p class="text-label-sm text-on-surface-variant">Tägliches Kalorienziel</p>
        <p class="text-headline-lg text-primary">${fmt(r.dailyCalorieTarget)} kcal</p>
      </div>
      <div class="grid grid-cols-3 gap-3 text-center">
        <div><p class="text-label-sm text-primary font-semibold">Protein</p><p class="text-body-md">${fmt(r.proteinTarget)} g</p></div>
        <div><p class="text-label-sm text-secondary font-semibold">Kohlenhydrate</p><p class="text-body-md">${fmt(r.carbsTarget)} g</p></div>
        <div><p class="text-label-sm text-tertiary font-semibold">Fett</p><p class="text-body-md">${fmt(r.fatTarget)} g</p></div>
      </div>
      <p class="text-body-md text-on-surface-variant text-center">Wasserziel: ${fmtDec(r.waterTarget)} L/Tag</p>
      ${r.weeks != null ? `<p class="text-body-md text-on-surface-variant text-center">Geschätzter Zeitrahmen: ~${r.weeks} Wochen</p>` : ''}
      <div class="h-px bg-outline-variant/20"></div>
      <p class="text-label-sm text-on-surface-variant">METHODIK: Grundumsatz nach Mifflin-St-Jeor, Gesamtumsatz über Standard-Aktivitätsfaktoren (1,2–1,9), Proteinziel 1,8–2,2 g/kg, Fettziel 0,8 g/kg, Wasserziel 30–35 ml/kg, Zeitrahmen über 7.700 kcal/kg. Allgemeine Orientierung, keine medizinische Beratung.</p>
      <button id="calc-apply" class="w-full py-4 rounded-xl bg-primary text-on-primary text-label-md active:scale-95 transition">Übernehmen</button>
    </div>`, (root) => {
      root.querySelector('#calc-apply').addEventListener('click', () => {
        Store.saveProfile({ dailyCalorieTarget: r.dailyCalorieTarget, proteinTarget: r.proteinTarget, carbsTarget: r.carbsTarget, fatTarget: r.fatTarget });
        closeModal(); render(); toast('Ziele übernommen');
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
    if (mealBtn) { pendingMeal = mealBtn.dataset.meal; go('search'); return; }
    const copyBtn = e.target.closest('.meal-copy');
    if (copyBtn) {
      const today = Store.todayStr();
      Store.copyMeal(shiftDate(today, -1), copyBtn.dataset.copyMeal, today);
      openMeals.add(copyBtn.dataset.copyMeal);
      render();
      toast(`${MEALS.find((m) => m.key === copyBtn.dataset.copyMeal).label} von gestern übernommen`);
      return;
    }
    const weekDay = e.target.closest('.week-day');
    if (weekDay) { diaryDate = weekDay.dataset.weekDay; go('diary'); return; }
    const editCustom = e.target.closest('.edit-custom');
    if (editCustom) {
      const f = Store.getCustomFoods().find((x) => x.id === editCustom.dataset.editCustom);
      if (f) f.recipe ? openRecipe(f) : openCustomFood(f, true);
      return;
    }
    const toggle = e.target.closest('.meal-toggle');
    if (toggle) {
      const key = toggle.dataset.mealToggle;
      openMeals.has(key) ? openMeals.delete(key) : openMeals.add(key);
      render();
      return;
    }
    const addFood = e.target.closest('.add-food');
    if (addFood) { openPortionSheet(JSON.parse(decodeURIComponent(addFood.dataset.food))); return; }
    const rowFav = e.target.closest('.row-fav');
    if (rowFav) {
      const food = JSON.parse(decodeURIComponent(rowFav.dataset.favFood));
      Store.toggleFavorite(food);
      const nowFav = Store.isFavorite(food.id);
      rowFav.className = `row-fav w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition ${nowFav ? 'text-secondary' : 'text-on-surface-variant'}`;
      rowFav.querySelector('.material-symbols-outlined').className = `material-symbols-outlined ${nowFav ? 'fill-icon' : ''}`;
      return;
    }
    if (e.target.closest('#export-data-top')) { exportForDashboard(); return; }
    const del = e.target.closest('.del-entry');
    if (del) { Store.removeDiaryEntry(del.dataset.del); render(); return; }
    const unfav = e.target.closest('.unfav');
    if (unfav) { const f = Store.getFavorites().find((x) => x.id === unfav.dataset.unfav); if (f) { Store.toggleFavorite(f); render(); } return; }
    if (e.target.closest('#d-prev')) { diaryDate = shiftDate(diaryDate, -1); render(); return; }
    if (e.target.closest('#d-next')) { if (diaryDate !== Store.todayStr()) { diaryDate = shiftDate(diaryDate, 1); render(); } return; }
    if (suppressRowClick) { suppressRowClick = false; return; }
    const entryRow = e.target.closest('.entry-row');
    if (entryRow && entryRow.dataset.editEntry) {
      const entry = Store.getDiary().find((x) => x.id === entryRow.dataset.editEntry);
      if (entry) openEditEntrySheet(entry);
    }
  });

  // Nach links wischen löscht einen Eintrag (Tagebuch + aufgeklappte Mahlzeit)
  let swipe = null;
  view.addEventListener('touchstart', (e) => {
    const row = e.target.closest('[data-swipe-del]');
    if (!row) return;
    swipe = { row, id: row.dataset.swipeDel, x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, aktiv: false };
    row.style.transition = '';
  }, { passive: true });
  view.addEventListener('touchmove', (e) => {
    if (!swipe) return;
    const dx = e.touches[0].clientX - swipe.x;
    const dy = e.touches[0].clientY - swipe.y;
    if (!swipe.aktiv && Math.abs(dx) < Math.abs(dy)) { swipe = null; return; }
    if (dx > 0 && !swipe.aktiv) return;
    swipe.aktiv = true;
    swipe.dx = Math.min(0, dx);
    swipe.row.style.transform = `translateX(${swipe.dx}px)`;
    swipe.row.style.opacity = String(Math.max(0.4, 1 + swipe.dx / 200));
  }, { passive: true });
  view.addEventListener('touchend', () => {
    if (!swipe) return;
    const { row, id, dx } = swipe;
    swipe = null;
    if (dx < -80) { Store.removeDiaryEntry(id); render(); return; }
    if (dx < -5) suppressRowClick = true; // Wischversuch, danach nicht zusaetzlich das Bearbeiten-Sheet oeffnen
    row.style.transition = 'transform .15s, opacity .15s';
    row.style.transform = '';
    row.style.opacity = '';
  });

  function openPortionSheet(food) {
    const meal = pendingMeal || defaultMeal();
    pendingMeal = null;
    const unitLabel = food.unit === 'ml' ? 'ml' : food.unit === 'piece' ? 'Stück' : 'g';
    const start = food.portion || food.serving || 100;
    const fav = food.id ? Store.isFavorite(food.id) : false;
    const quick = food.unit === 'piece'
      ? [1, 2, 3, 5].map((q) => ({ q, label: q }))
      : food.serving
        ? [[0.5, '½'], [1, '1'], [2, '2']].map(([n, l]) => ({ q: round(n * food.serving), label: `${l} Port.<br><span class="text-label-sm text-outline">${fmt(n * food.serving)} ${food.unit === 'ml' ? 'ml' : 'g'}</span>` })).concat({ q: 100, label: '100' })
        : [50, 100, 150, 200].map((q) => ({ q, label: q }));

    const mealOpts = MEALS.map((m) => `<button data-m="${m.key}" class="m-opt px-3 py-2 rounded-full text-label-md whitespace-nowrap ${m.key === meal ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}">${m.label}</button>`).join('');

    openSheet(food.name, `
      <div class="flex items-center justify-between mb-4">
        <p class="text-label-md text-on-surface-variant">${fmt(food.calories)} kcal · E${fmt(food.protein)} K${fmt(food.carbs)} F${fmt(food.fat)} /100${food.unit === 'ml' ? 'ml' : 'g'}</p>
        <button id="fav-toggle" title="Als Favorit merken" class="w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition ${fav ? 'bg-secondary/10 text-secondary' : 'bg-surface-container text-on-surface-variant'}"><span class="material-symbols-outlined ${fav ? 'fill-icon' : ''}">favorite</span></button>
      </div>
      <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">${mealOpts}</div>
      <label class="text-label-md text-on-surface-variant">Menge (${unitLabel})</label>
      <div class="flex items-center gap-3 bg-surface-container-low rounded-xl p-4 mt-1">
        <input id="portion" type="number" inputmode="decimal" step="${food.unit === 'piece' ? 1 : 10}" value="${start}" class="flex-1 bg-transparent border-none focus:ring-0 text-headline-md p-0" />
        <span class="text-on-surface-variant">${unitLabel}</span>
      </div>
      <div class="grid grid-cols-4 gap-2 mt-3 mb-5">
        ${quick.map(({ q, label }) => `<button data-q="${q}" class="quick-q py-2 rounded-lg bg-surface-container text-label-md text-on-surface-variant leading-tight active:scale-95 transition">${label}</button>`).join('')}
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
        btn.className = `w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition ${now ? 'bg-secondary/10 text-secondary' : 'bg-surface-container text-on-surface-variant'}`;
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

  // ---------- Bestehenden Tagebuch-Eintrag bearbeiten ----------
  function openEditEntrySheet(entry) {
    const unitLabel = entry.unit === 'piece' ? 'Stück' : entry.unit;
    // Naehrwerte je 100g/ml (bzw. je Stueck) aus der gespeicherten Portion zurueckrechnen,
    // da der Tagebuch-Eintrag nur die berechneten Endwerte speichert.
    const factorAlt = entry.unit === 'piece' ? entry.portion : entry.portion / 100;
    const per = {
      calories: factorAlt ? entry.calories / factorAlt : 0,
      protein: factorAlt ? entry.protein / factorAlt : 0,
      carbs: factorAlt ? entry.carbs / factorAlt : 0,
      fat: factorAlt ? entry.fat / factorAlt : 0,
    };
    const mealOpts = MEALS.map((m) => `<button data-m="${m.key}" class="m-opt px-3 py-2 rounded-full text-label-md whitespace-nowrap ${m.key === entry.mealType ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}">${m.label}</button>`).join('');
    const fav = Store.isFavorite(entry.foodId);

    openSheet(entry.foodName, `
      <div class="flex items-center justify-between mb-4">
        <p class="text-label-md text-on-surface-variant">${fmt(per.calories)} kcal · E${fmt(per.protein)} K${fmt(per.carbs)} F${fmt(per.fat)} /${entry.unit === 'piece' ? 'Stk' : entry.unit === 'ml' ? '100ml' : '100g'}</p>
        <button id="fav-toggle" title="Als Favorit merken" class="w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition ${fav ? 'bg-secondary/10 text-secondary' : 'bg-surface-container text-on-surface-variant'}"><span class="material-symbols-outlined ${fav ? 'fill-icon' : ''}">favorite</span></button>
      </div>
      <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">${mealOpts}</div>
      <label class="text-label-md text-on-surface-variant">Menge (${unitLabel})</label>
      <div class="flex items-center gap-3 bg-surface-container-low rounded-xl p-4 mt-1">
        <input id="portion" type="number" inputmode="decimal" step="${entry.unit === 'piece' ? 1 : 10}" value="${entry.portion}" class="flex-1 bg-transparent border-none focus:ring-0 text-headline-md p-0" />
        <span class="text-on-surface-variant">${unitLabel}</span>
      </div>
      <div class="grid grid-cols-4 gap-2 mt-3 mb-5">
        ${(entry.unit === 'piece' ? [1, 2, 3, 5] : [50, 100, 150, 200]).map((q) => `<button data-q="${q}" class="quick-q py-2 rounded-lg bg-surface-container text-label-md text-on-surface-variant active:scale-95 transition">${q}</button>`).join('')}
      </div>
      <div class="flex items-center justify-between bg-primary/5 rounded-xl p-4 mb-4">
        <span class="text-label-md text-on-surface-variant">Ergibt</span>
        <span id="calc-kcal" class="text-headline-md text-primary">${fmt(entry.calories)} kcal</span>
      </div>
      <div class="flex gap-3">
        <button id="delete-entry" class="flex-1 py-4 rounded-xl bg-error-container text-on-error-container text-label-md active:scale-95 transition">Löschen</button>
        <button id="save-entry" class="flex-[2] py-4 rounded-xl bg-primary text-on-primary text-label-md flex items-center justify-center gap-2 active:scale-95 transition shadow-lg">
          <span class="material-symbols-outlined fill-icon text-[20px]">check_circle</span>Speichern</button>
      </div>
    `, (root) => {
      let selMeal = entry.mealType;
      const portion = root.querySelector('#portion');
      const calc = root.querySelector('#calc-kcal');
      const update = () => {
        const por = parseFloat(portion.value) || 0;
        const factor = entry.unit === 'piece' ? por : por / 100;
        calc.textContent = `${fmt(per.calories * factor)} kcal`;
      };
      portion.addEventListener('input', update);
      root.querySelectorAll('.quick-q').forEach((b) => b.addEventListener('click', () => { portion.value = b.dataset.q; update(); }));
      root.querySelectorAll('.m-opt').forEach((b) => b.addEventListener('click', () => {
        selMeal = b.dataset.m;
        root.querySelectorAll('.m-opt').forEach((x) => { x.classList.remove('bg-primary', 'text-on-primary'); x.classList.add('bg-surface-container', 'text-on-surface-variant'); });
        b.classList.add('bg-primary', 'text-on-primary'); b.classList.remove('bg-surface-container', 'text-on-surface-variant');
      }));
      root.querySelector('#fav-toggle').addEventListener('click', (ev) => {
        const food = { id: entry.foodId, name: entry.foodName, calories: per.calories, protein: per.protein, carbs: per.carbs, fat: per.fat, unit: entry.unit, barcode: null, source: 'custom' };
        const now = Store.toggleFavorite(food);
        const btn = ev.currentTarget, ic = btn.querySelector('.material-symbols-outlined');
        btn.className = `w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition ${now ? 'bg-secondary/10 text-secondary' : 'bg-surface-container text-on-surface-variant'}`;
        ic.classList.toggle('fill-icon', now);
      });
      root.querySelector('#delete-entry').addEventListener('click', () => {
        Store.removeDiaryEntry(entry.id);
        closeModal();
        toast(`${entry.foodName} gelöscht`);
        render();
      });
      root.querySelector('#save-entry').addEventListener('click', () => {
        const por = parseFloat(portion.value);
        if (!por || por <= 0) { toast('Menge eingeben'); return; }
        const factor = entry.unit === 'piece' ? por : por / 100;
        Store.updateDiaryEntry(entry.id, {
          portion: por,
          mealType: selMeal,
          calories: round(per.calories * factor),
          protein: round(per.protein * factor),
          carbs: round(per.carbs * factor),
          fat: round(per.fat * factor),
        });
        closeModal();
        toast('Gespeichert');
        render();
      });
    });
  }

  // ---------- Eigenes Lebensmittel ----------
  function openCustomFood(prefill = {}, edit = false) {
    const barcode = prefill.barcode || null;
    const f = (id, label, unit, ph = '0') => `<div class="flex items-center justify-between bg-surface-container-low rounded-xl p-3">
      <label for="cf-${id}" class="text-body-md">${label}</label>
      <div class="flex items-center gap-2"><input id="cf-${id}" type="number" inputmode="decimal" value="${prefill[id] ?? ''}" class="w-24 bg-transparent border-none focus:ring-0 text-right text-label-md p-0" placeholder="${ph}" /><span class="text-on-surface-variant text-label-sm w-6">${unit}</span></div></div>`;
    const hint = barcode && !edit
      ? `<div class="bg-secondary-container/10 rounded-xl p-3 mb-3 flex items-start gap-2">
           <span class="material-symbols-outlined text-primary text-[20px]">info</span>
           <p class="text-label-sm text-on-surface-variant">Barcode <span class="font-semibold">${esc(barcode)}</span> nicht in OpenFoodFacts. Einmal selbst anlegen — beim nächsten Scan ist er sofort da.</p>
         </div>`
      : '';
    openSheet(edit ? 'Lebensmittel bearbeiten' : 'Eigenes Lebensmittel', `
      ${hint}
      <div class="bg-surface-container-low rounded-xl p-3 mb-3"><input id="cf-name" type="text" placeholder="Name" aria-label="Name" value="${esc(prefill.name || '')}" class="w-full bg-transparent border-none focus:ring-0 text-body-md p-0" /></div>
      <p class="text-label-sm text-on-surface-variant mb-2 px-1">Werte pro 100 g</p>
      <div class="space-y-2">
        ${f('calories', 'Kalorien', 'kcal')}${f('protein', 'Eiweiß', 'g')}${f('carbs', 'Kohlenhydrate', 'g')}${f('fat', 'Fett', 'g')}
        ${f('serving', 'Portion/Stück wiegt', 'g', 'optional')}
      </div>
      ${edit
        ? `<div class="flex gap-3 mt-5">
            <button id="cf-delete" class="flex-1 py-4 rounded-xl bg-error-container text-on-error-container text-label-md active:scale-95 transition">Löschen</button>
            <button id="cf-save" class="flex-[2] py-4 rounded-xl bg-primary text-on-primary text-label-md active:scale-95 transition">Speichern</button></div>`
        : `<button id="cf-save" class="mt-5 w-full py-4 rounded-xl bg-primary text-on-primary text-label-md active:scale-95 transition">Anlegen & hinzufügen</button>`}
    `, (root) => {
      root.querySelector('#cf-delete')?.addEventListener('click', () => {
        if (!confirm(`„${prefill.name}" löschen? Tagebuch-Einträge bleiben erhalten.`)) return;
        Store.removeCustomFood(prefill.id);
        closeModal(); render(); toast('Gelöscht');
      });
      root.querySelector('#cf-save').addEventListener('click', () => {
        const name = root.querySelector('#cf-name').value.trim();
        if (!name) { toast('Name eingeben'); return; }
        const values = {
          name,
          calories: +root.querySelector('#cf-calories').value || 0,
          protein: +root.querySelector('#cf-protein').value || 0,
          carbs: +root.querySelector('#cf-carbs').value || 0,
          fat: +root.querySelector('#cf-fat').value || 0,
          serving: +root.querySelector('#cf-serving').value || null,
        };
        if (edit) {
          Store.updateCustomFood(prefill.id, values);
          closeModal(); render(); toast('Gespeichert');
          return;
        }
        const food = Store.addCustomFood({
          // Bei Barcode: id = barcode → off.js findet ihn beim nächsten Scan im Cache
          id: barcode || undefined,
          barcode,
          unit: 'g',
          ...values,
        });
        if (barcode) Store.cacheFood(food); // unter Barcode cachen für künftige Scans
        closeModal();
        openPortionSheet(food);
      });
    });
  }

  // ---------- Rezept (Zutaten → eigenes Lebensmittel mit Werten pro 100 g + Portionsgewicht) ----------
  function openRecipe(existing = null) {
    const ings = existing ? existing.recipe.ingredients.map((i) => ({ ...i })) : [];
    let found = [];
    openSheet(existing ? 'Rezept bearbeiten' : 'Neues Rezept', `
      <div class="bg-surface-container-low rounded-xl p-3 mb-3"><input id="rz-name" type="text" placeholder="Name, z. B. Bolognese" aria-label="Name" value="${esc(existing?.name || '')}" class="w-full bg-transparent border-none focus:ring-0 text-body-md p-0" /></div>
      <div class="flex items-center justify-between bg-surface-container-low rounded-xl p-3 mb-4">
        <label for="rz-portions" class="text-body-md">Ergibt Portionen</label>
        <input id="rz-portions" type="number" inputmode="numeric" min="1" value="${existing?.recipe.portions || 1}" class="w-16 bg-transparent border-none focus:ring-0 text-right text-label-md p-0" />
      </div>
      <p class="text-label-md text-on-surface-variant mb-2 px-1">Zutaten</p>
      <div id="rz-list" class="space-y-2 mb-3"></div>
      <div class="flex items-center bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/30 focus-within:ring-2 ring-primary">
        <span class="material-symbols-outlined text-outline mr-2">search</span>
        <input id="rz-q" type="text" inputmode="search" placeholder="Zutat suchen…" aria-label="Zutat suchen" class="w-full bg-transparent border-none focus:ring-0 text-body-md p-0" />
      </div>
      <div id="rz-res" class="space-y-1 mt-2"></div>
      <div id="rz-sum" class="bg-primary/5 rounded-xl p-4 my-4 text-label-md text-on-surface-variant"></div>
      ${existing
        ? `<div class="flex gap-3">
            <button id="rz-delete" class="flex-1 py-4 rounded-xl bg-error-container text-on-error-container text-label-md active:scale-95 transition">Löschen</button>
            <button id="rz-save" class="flex-[2] py-4 rounded-xl bg-primary text-on-primary text-label-md active:scale-95 transition">Speichern</button></div>`
        : `<button id="rz-save" class="w-full py-4 rounded-xl bg-primary text-on-primary text-label-md active:scale-95 transition">Rezept speichern</button>`}
    `, (root) => {
      const list = root.querySelector('#rz-list'), res = root.querySelector('#rz-res');
      const sum = root.querySelector('#rz-sum'), portionsIn = root.querySelector('#rz-portions');
      const totals = () => {
        const t = { grams: 0, calories: 0, protein: 0, carbs: 0, fat: 0 };
        for (const i of ings) {
          t.grams += i.grams;
          for (const k of ['calories', 'protein', 'carbs', 'fat']) t[k] += (i[k] * i.grams) / 100;
        }
        return t;
      };
      const updateSum = () => {
        const t = totals(), portions = Math.max(1, parseInt(portionsIn.value) || 1);
        sum.innerHTML = ings.length
          ? `Gesamt ${fmt(t.grams)} g · ${fmt(t.calories)} kcal<br><span class="text-primary font-bold">Pro Portion ${fmt(t.grams / portions)} g · ${fmt(t.calories / portions)} kcal</span>`
          : 'Noch keine Zutaten';
      };
      const renderList = () => {
        list.innerHTML = ings.map((i, n) => `<div class="flex items-center gap-2 bg-surface-container rounded-lg pl-3">
          <p class="flex-1 min-w-0 text-label-md truncate">${esc(i.name)}</p>
          <input data-i="${n}" type="number" inputmode="decimal" value="${i.grams}" aria-label="Menge ${esc(i.name)} in Gramm" class="rz-g w-16 bg-transparent border-none focus:ring-0 text-right text-label-md p-0" />
          <span class="text-label-sm text-on-surface-variant">g</span>
          <button data-i="${n}" title="Zutat entfernen" class="rz-x w-11 h-11 flex items-center justify-center text-on-surface-variant active:text-error"><span class="material-symbols-outlined text-[20px]">close</span></button>
        </div>`).join('');
        updateSum();
      };
      renderList();
      portionsIn.addEventListener('input', updateSum);
      list.addEventListener('input', (e) => {
        if (!e.target.classList.contains('rz-g')) return;
        ings[e.target.dataset.i].grams = parseFloat(e.target.value) || 0;
        updateSum();
      });
      list.addEventListener('click', (e) => {
        const x = e.target.closest('.rz-x');
        if (x) { ings.splice(x.dataset.i, 1); renderList(); }
      });
      let t;
      const q = root.querySelector('#rz-q');
      q.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const term = q.value.trim().toLowerCase();
          if (term.length < 2) { res.innerHTML = ''; return; }
          const own = Store.getCustomFoods().filter((f) => f.id !== existing?.id && f.name.toLowerCase().includes(term));
          found = own.concat(FoodsDE.search(term)).slice(0, 8);
          res.innerHTML = found.length
            ? found.map((f, n) => `<button data-i="${n}" class="rz-add w-full flex justify-between items-center text-left p-3 rounded-lg bg-surface-container-low active:scale-[0.99] transition">
                <span class="text-label-md truncate pr-2">${esc(f.name)}</span><span class="text-label-sm text-on-surface-variant shrink-0">${fmt(f.calories)} kcal/100g</span></button>`).join('')
            : '<p class="text-label-sm text-on-surface-variant px-1">Nichts gefunden — erst als eigenes Lebensmittel anlegen.</p>';
        }, 200);
      });
      res.addEventListener('click', (e) => {
        const b = e.target.closest('.rz-add');
        if (!b) return;
        const f = found[b.dataset.i];
        ings.push({ name: f.name, grams: f.serving || 100, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat });
        q.value = ''; res.innerHTML = '';
        renderList();
      });
      root.querySelector('#rz-delete')?.addEventListener('click', () => {
        if (!confirm(`Rezept „${existing.name}" löschen? Tagebuch-Einträge bleiben erhalten.`)) return;
        Store.removeCustomFood(existing.id);
        closeModal(); render(); toast('Rezept gelöscht');
      });
      root.querySelector('#rz-save').addEventListener('click', () => {
        const name = root.querySelector('#rz-name').value.trim();
        const tot = totals(), portions = Math.max(1, parseInt(portionsIn.value) || 1);
        if (!name) { toast('Name eingeben'); return; }
        if (!ings.length || tot.grams <= 0) { toast('Zutaten mit Menge eingeben'); return; }
        const per100 = (v) => round((v / tot.grams) * 100);
        const values = {
          name, unit: 'g',
          calories: per100(tot.calories), protein: per100(tot.protein), carbs: per100(tot.carbs), fat: per100(tot.fat),
          serving: Math.round(tot.grams / portions),
          recipe: { portions, ingredients: ings.filter((i) => i.grams > 0) },
        };
        if (existing) Store.updateCustomFood(existing.id, values);
        else Store.addCustomFood(values);
        closeModal(); render(); toast(existing ? 'Rezept gespeichert' : 'Rezept angelegt');
      });
    });
  }

  // ---------- Barcode-Scanner (ZXing, lazy) ----------
  let zxingLoaded = null;
  function loadZXing() {
    if (zxingLoaded) return zxingLoaded;
    zxingLoaded = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'vendor/zxing.min.js'; // lokal gehostet (offline-fest)
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
            else openCustomFood({ barcode: code }); // Lücke füllen: selbst anlegen + cachen
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

  // App über Mitternacht offen/im Hintergrund → beim Zurückkommen auf den neuen Tag springen
  let shownDay = Store.todayStr();
  document.addEventListener('visibilitychange', () => {
    const today = Store.todayStr();
    if (document.hidden || today === shownDay) return;
    if (diaryDate === shownDay) diaryDate = today;
    shownDay = today;
    render();
  });

  // ---------- Start ----------
  (async () => {
    const restored = await Store.autoRecoverIfEmpty();
    go('dashboard');
    if (restored) toast('Daten automatisch wiederhergestellt');
  })();
})();
