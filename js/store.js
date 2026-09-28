// store.js — Datenschicht
// localStorage: profile, diary, favorites, customFoods
// IndexedDB:    foodCache (OpenFoodFacts-Produkte für Offline-Fallback)

const LS = {
  profile: 'kt.profile',
  diary: 'kt.diary',
  favorites: 'kt.favorites',
  customFoods: 'kt.customFoods',
};

const DEFAULT_PROFILE = {
  weight: 78.5,
  height: 182,
  age: 30,
  sex: 'male', // male | female — für Grundumsatz-Formel
  activityLevel: 'moderate', // sedentary | light | moderate | active | very_active
  goal: 'lose', // lose | maintain | gain
  pace: 'steady', // gentle | steady | aggressive
  targetWeight: null, // kg, optional
  dailyCalorieTarget: 2200,
  proteinTarget: 120,
  carbsTarget: 240,
  fatTarget: 70,
};

const ACTIVITY_FACTOR = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
const KCAL_PER_KG = 7700;

// ---------- localStorage Helfer ----------
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
let snapshotT;
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  clearTimeout(snapshotT);
  snapshotT = setTimeout(saveAutoSnapshot, 500);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayStr(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`; // YYYY-MM-DD, lokale Zeitzone (toISOString wäre UTC und driftet abends/morgens einen Tag)
}

// ---------- Profil ----------
function getProfile() {
  return { ...DEFAULT_PROFILE, ...read(LS.profile, {}) };
}
function saveProfile(patch) {
  const next = { ...getProfile(), ...patch };
  write(LS.profile, next);
  return next;
}

// ---------- Tagebuch ----------
function getDiary() {
  return read(LS.diary, []);
}
function getDiaryByDate(date) {
  return getDiary().filter((e) => e.date === date);
}
function addDiaryEntry(food, portion, mealType, date = todayStr()) {
  // food = {id?,name,calories,protein,carbs,fat per 100g/unit}, portion in g/ml/piece
  const factor = food.unit === 'piece' ? portion : portion / 100;
  const entry = {
    id: uid(),
    date,
    timestamp: Date.now(),
    mealType, // breakfast | lunch | dinner | snack
    foodId: food.id || null,
    foodName: food.name,
    portion,
    unit: food.unit || 'g',
    calories: round(food.calories * factor),
    protein: round(food.protein * factor),
    carbs: round(food.carbs * factor),
    fat: round(food.fat * factor),
  };
  const diary = getDiary();
  diary.push(entry);
  write(LS.diary, diary);
  return entry;
}
function removeDiaryEntry(id) {
  write(LS.diary, getDiary().filter((e) => e.id !== id));
}
function updateDiaryEntry(id, patch) {
  const diary = getDiary().map((e) => (e.id === id ? { ...e, ...patch } : e));
  write(LS.diary, diary);
}

// Tagessummen
function daySummary(date = todayStr()) {
  const entries = getDiaryByDate(date);
  const sum = entries.reduce(
    (a, e) => ({
      calories: a.calories + e.calories,
      protein: a.protein + e.protein,
      carbs: a.carbs + e.carbs,
      fat: a.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return {
    calories: Math.round(sum.calories),
    protein: Math.round(sum.protein),
    carbs: Math.round(sum.carbs),
    fat: Math.round(sum.fat),
    byMeal: groupByMeal(entries),
  };
}
function weekSummary(end = todayStr()) {
  const days = [];
  const d = new Date(end + 'T00:00:00');
  d.setDate(d.getDate() - 6);
  for (let i = 0; i < 7; i++) {
    const date = todayStr(d);
    const entries = getDiaryByDate(date);
    days.push({ date, calories: Math.round(entries.reduce((a, e) => a + e.calories, 0)), count: entries.length });
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function copyMeal(fromDate, mealType, toDate) {
  const src = getDiaryByDate(fromDate).filter((e) => e.mealType === mealType);
  const now = Date.now();
  const diary = getDiary();
  src.forEach((e, i) => diary.push({ ...e, id: uid(), date: toDate, timestamp: now + i }));
  write(LS.diary, diary);
  return src.length;
}

function groupByMeal(entries) {
  const meals = { breakfast: [], lunch: [], dinner: [], snack: [] };
  for (const e of entries) (meals[e.mealType] || meals.snack).push(e);
  return meals;
}

// ---------- Export (Tages-Summen für Fitness-Dashboard) ----------
function getAllDaySummaries() {
  const byDate = {};
  for (const e of getDiary()) {
    const d = (byDate[e.date] ||= { date: e.date, calories: 0, protein: 0, carbs: 0, fat: 0, entries: [] });
    d.calories += e.calories;
    d.protein += e.protein;
    d.carbs += e.carbs;
    d.fat += e.fat;
    d.entries.push({
      name: e.foodName, mealType: e.mealType, portion: e.portion, unit: e.unit,
      calories: e.calories, protein: e.protein, carbs: e.carbs, fat: e.fat,
    });
  }
  return Object.values(byDate)
    .map((d) => ({ ...d, calories: round(d.calories), protein: round(d.protein), carbs: round(d.carbs), fat: round(d.fat) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- Favoriten ----------
function getFavorites() {
  return read(LS.favorites, []);
}
function isFavorite(foodId) {
  return getFavorites().some((f) => f.id === foodId);
}
function toggleFavorite(food) {
  const favs = getFavorites();
  const i = favs.findIndex((f) => f.id === food.id);
  if (i >= 0) favs.splice(i, 1);
  else favs.push(food);
  write(LS.favorites, favs);
  return i < 0; // true = jetzt Favorit
}

// ---------- Eigene Lebensmittel ----------
function getCustomFoods() {
  return read(LS.customFoods, []);
}
function addCustomFood(food) {
  const f = { ...food, id: food.id || uid(), source: 'custom' };
  const list = getCustomFoods();
  list.push(f);
  write(LS.customFoods, list);
  return f;
}
function updateCustomFood(id, patch) {
  let updated = null;
  write(LS.customFoods, getCustomFoods().map((f) => (f.id === id ? (updated = { ...f, ...patch }) : f)));
  if (!updated) return null;
  const favs = getFavorites();
  if (favs.some((f) => f.id === id)) write(LS.favorites, favs.map((f) => (f.id === id ? updated : f)));
  if (updated.barcode) cacheFood(updated);
  return updated;
}
function removeCustomFood(id) {
  write(LS.customFoods, getCustomFoods().filter((f) => f.id !== id));
  write(LS.favorites, getFavorites().filter((f) => f.id !== id));
}

// ---------- Zuletzt verwendet (aus Tagebuch abgeleitet) ----------
function getRecentFoods(limit = 8) {
  const seen = new Map();
  const diary = getDiary().sort((a, b) => b.timestamp - a.timestamp);
  for (const e of diary) {
    const key = e.foodId || e.foodName;
    if (!seen.has(key)) {
      seen.set(key, {
        id: e.foodId || key,
        name: e.foodName,
        portion: e.portion,
        unit: e.unit,
        // Werte pro Eintrag zurückrechnen auf 100g für Wiederverwendung
        calories: per100(e.calories, e.portion, e.unit),
        protein: per100(e.protein, e.portion, e.unit),
        carbs: per100(e.carbs, e.portion, e.unit),
        fat: per100(e.fat, e.portion, e.unit),
        source: 'recent',
      });
    }
    if (seen.size >= limit) break;
  }
  return [...seen.values()];
}
function per100(value, portion, unit) {
  if (unit === 'piece' || !portion) return round(value);
  return round((value / portion) * 100);
}

// ---------- IndexedDB: OpenFoodFacts-Cache ----------
let _db = null;
function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('kt-foods', 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('foodCache')) {
        db.createObjectStore('foodCache', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('autoBackup')) {
        db.createObjectStore('autoBackup', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => {
      _db = req.result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}
async function cacheFood(food) {
  try {
    const db = await openDB();
    const tx = db.transaction('foodCache', 'readwrite');
    tx.objectStore('foodCache').put(food);
  } catch {
    /* Cache optional */
  }
}
async function getCachedFood(id) {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const req = db.transaction('foodCache').objectStore('foodCache').get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

function round(n) {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

// ---------- Ziel-Rechner (Mifflin-St-Jeor) ----------
function calcTargets(p = getProfile()) {
  const bmr = p.sex === 'female'
    ? 10 * p.weight + 6.25 * p.height - 5 * p.age - 161
    : 10 * p.weight + 6.25 * p.height - 5 * p.age + 5;
  const tdee = bmr * (ACTIVITY_FACTOR[p.activityLevel] || ACTIVITY_FACTOR.moderate);

  let dailyCalorieTarget;
  if (p.goal === 'lose') {
    const paceFactor = { gentle: 0.005, steady: 0.0075, aggressive: 0.01 }[p.pace] ?? 0.0075;
    const deficit = (p.weight * paceFactor * KCAL_PER_KG) / 7;
    const floor = p.sex === 'female' ? 1200 : 1500;
    dailyCalorieTarget = Math.max(tdee - deficit, floor);
  } else if (p.goal === 'gain') {
    const surplus = { gentle: 250, steady: 325, aggressive: 400 }[p.pace] ?? 325;
    dailyCalorieTarget = tdee + surplus;
  } else {
    dailyCalorieTarget = tdee;
  }
  dailyCalorieTarget = Math.round(dailyCalorieTarget / 10) * 10;

  const proteinPerKg = p.goal === 'lose' || p.activityLevel === 'very_active' ? 2.2 : 1.8;
  const proteinTarget = Math.round(p.weight * proteinPerKg);
  const fatTarget = Math.round(p.weight * 0.8);
  const carbsTarget = Math.max(0, Math.round((dailyCalorieTarget - proteinTarget * 4 - fatTarget * 9) / 4));
  const waterTarget = round((p.weight * 32.5) / 1000);

  let weeks = null;
  if ((p.goal === 'lose' || p.goal === 'gain') && p.targetWeight) {
    const weeklyChangeKg = ((tdee - dailyCalorieTarget) * 7) / KCAL_PER_KG;
    const diffKg = Math.abs(p.weight - p.targetWeight);
    if (weeklyChangeKg !== 0) weeks = Math.round(diffKg / Math.abs(weeklyChangeKg));
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalorieTarget,
    proteinTarget,
    carbsTarget,
    fatTarget,
    waterTarget,
    weeks,
  };
}

// ---------- Vollstaendiges Backup (Schutz vor Speicherverlust) ----------
function exportBackup() {
  return {
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    profile: getProfile(),
    diary: getDiary(),
    favorites: getFavorites(),
    customFoods: getCustomFoods(),
  };
}
function restoreBackup(data) {
  if (!data || typeof data !== 'object') throw new Error('Ungueltige Sicherungsdatei');
  if (data.profile) write(LS.profile, data.profile);
  if (Array.isArray(data.diary)) write(LS.diary, data.diary);
  if (Array.isArray(data.favorites)) write(LS.favorites, data.favorites);
  if (Array.isArray(data.customFoods)) write(LS.customFoods, data.customFoods);
}

// ---------- Automatischer Hintergrund-Snapshot (IndexedDB, unabhaengig von localStorage) ----------
// Schutz gegen iOS-Speicherverlust bei App-Updates: localStorage kann verschwinden,
// IndexedDB ist ein separater Speicherbereich und ueberlebt das haeufiger.
// Zusaetzlich ein Snapshot je Kalendertag (letzte 7): 'latest' allein wird bei teilweisem
// Verlust binnen 500 ms mit dem kaputten Stand ueberschrieben, die Vortage bleiben.
const DAY_SNAPSHOTS = 7;
async function saveAutoSnapshot() {
  try {
    const db = await openDB();
    const data = exportBackup();
    const store = db.transaction('autoBackup', 'readwrite').objectStore('autoBackup');
    store.put({ id: 'latest', ...data });
    store.put({ id: 'day-' + todayStr(), ...data });
    store.getAllKeys().onsuccess = (ev) => {
      ev.target.result
        .filter((k) => k.startsWith('day-'))
        .sort()
        .slice(0, -DAY_SNAPSHOTS)
        .forEach((k) => store.delete(k));
    };
  } catch {
    /* Snapshot optional */
  }
}
async function getAutoSnapshot(id = 'latest') {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const req = db.transaction('autoBackup').objectStore('autoBackup').get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
async function listSnapshots() {
  try {
    const db = await openDB();
    const all = await new Promise((resolve) => {
      const req = db.transaction('autoBackup').objectStore('autoBackup').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
    return all
      .filter((s) => s.id !== 'latest')
      .map((s) => ({ id: s.id, exportedAt: s.exportedAt, entries: (s.diary || []).length }))
      .sort((a, b) => b.exportedAt.localeCompare(a.exportedAt));
  } catch {
    return [];
  }
}
// Vor dem Zurueckholen den aktuellen Stand sichern — sonst ueberschreibt der Restore
// sofort den heutigen Tages-Snapshot und ein Fehlgriff waere nicht mehr umkehrbar.
async function restoreSnapshot(id) {
  const snap = await getAutoSnapshot(id);
  if (!snap) return false;
  const db = await openDB();
  await new Promise((resolve) => {
    const tx = db.transaction('autoBackup', 'readwrite');
    tx.objectStore('autoBackup').put({ ...exportBackup(), id: 'before-restore' });
    tx.oncomplete = tx.onerror = resolve;
  });
  restoreBackup(snap);
  return true;
}
async function autoRecoverIfEmpty() {
  if (localStorage.getItem(LS.profile) || localStorage.getItem(LS.diary)) return false;
  const snap = await getAutoSnapshot();
  if (!snap || (!snap.profile && (!snap.diary || !snap.diary.length))) return false;
  restoreBackup(snap);
  return true;
}

window.Store = {
  todayStr,
  uid,
  getProfile,
  saveProfile,
  calcTargets,
  getDiary,
  getDiaryByDate,
  addDiaryEntry,
  removeDiaryEntry,
  updateDiaryEntry,
  daySummary,
  weekSummary,
  copyMeal,
  getAllDaySummaries,
  getFavorites,
  isFavorite,
  toggleFavorite,
  getCustomFoods,
  addCustomFood,
  updateCustomFood,
  removeCustomFood,
  getRecentFoods,
  cacheFood,
  getCachedFood,
  exportBackup,
  restoreBackup,
  autoRecoverIfEmpty,
  saveAutoSnapshot,
  listSnapshots,
  restoreSnapshot,
};
