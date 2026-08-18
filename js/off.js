// off.js — OpenFoodFacts API (Suche + Barcode)
// Direkt aus dem Browser aufrufbar (CORS offen, kein Proxy nötig).

const OFF_BASE = 'https://world.openfoodfacts.org';
const FIELDS = 'code,product_name,product_name_de,brands,nutriments,serving_quantity';

function mapProduct(p) {
  const n = p.nutriments || {};
  const name =
    p.product_name_de || p.product_name || p.generic_name || 'Unbekanntes Produkt';
  return {
    id: p.code || name,
    name: p.brands ? `${name} (${p.brands.split(',')[0]})` : name,
    calories: num(n['energy-kcal_100g']) || Math.round(num(n['energy_100g']) / 4.184),
    protein: num(n.proteins_100g),
    carbs: num(n.carbohydrates_100g),
    fat: num(n.fat_100g),
    portion: num(p.serving_quantity) || 100,
    unit: 'g',
    barcode: p.code || null,
    source: 'openfoodfacts',
  };
}

function num(v) {
  const x = parseFloat(v);
  return Number.isFinite(x) ? Math.round(x * 10) / 10 : 0;
}

// OFF liefert sporadisch 503 — ein Wiederholversuch fängt die meisten davon ab.
async function fetchRetry(url, signal) {
  for (let versuch = 0; versuch < 2; versuch++) {
    if (versuch) await new Promise((r) => setTimeout(r, 700));
    try {
      const res = await fetch(url, { signal });
      if (res.ok) return res;
      if (versuch) throw new Error(`OFF Suche fehlgeschlagen: ${res.status}`);
    } catch (err) {
      if (err.name === 'AbortError' || versuch) throw err;
    }
  }
}

async function search(term, { signal } = {}) {
  const url =
    `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(term)}` +
    `&search_simple=1&action=process&json=1&page_size=20&fields=${FIELDS}`;
  const res = await fetchRetry(url, signal);
  const data = await res.json();
  return (data.products || [])
    .map(mapProduct)
    .filter((f) => f.calories > 0); // unvollständige Treffer raus
}

async function byBarcode(code) {
  // Erst Cache (Offline-Fallback), dann Netz
  const url = `${OFF_BASE}/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OFF Barcode HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 1 || !data.product) {
      const cached = await Store.getCachedFood(code);
      if (cached) return cached;
      return null;
    }
    const food = mapProduct({ ...data.product, code });
    Store.cacheFood(food);
    return food;
  } catch (err) {
    const cached = await Store.getCachedFood(code);
    if (cached) return cached;
    throw err;
  }
}

window.OFF = { search, byBarcode };
