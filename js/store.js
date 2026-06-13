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
  activityLevel: 'moderate', // sedentary | light | moderate | active | very_active
  dailyCalorieTarget: 2200,
  proteinTarget: 120,
  carbsTarget: 240,
  fatTarget: 70,
};

// ---------- localStorage Helfer ----------
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
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
function groupByMeal(entries) {
  const meals = { breakfast: [], lunch: [], dinner: [], snack: [] };
  for (const e of entries) (meals[e.mealType] || meals.snack).push(e);
  return meals;
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
    const req = indexedDB.open('kt-foods', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('foodCache')) {
        db.createObjectStore('foodCache', { keyPath: 'id' });
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

window.Store = {
  todayStr,
  uid,
  getProfile,
  saveProfile,
  getDiary,
  getDiaryByDate,
  addDiaryEntry,
  removeDiaryEntry,
  updateDiaryEntry,
  daySummary,
  getFavorites,
  isFavorite,
  toggleFavorite,
  getCustomFoods,
  addCustomFood,
  getRecentFoods,
  cacheFood,
  getCachedFood,
};
