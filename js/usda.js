// usda.js — USDA FoodData Central (kostenlos, kein Account nötig)
const USDA_KEY = 'DEMO_KEY';
const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

// Häufige DE→EN Übersetzungen für generische Lebensmittel
const DE_EN = {
  banane: 'banana raw', apfel: 'apple raw', birne: 'pear raw', orange: 'orange raw',
  mandarine: 'tangerine raw', erdbeere: 'strawberry raw', traube: 'grape raw',
  trauben: 'grape raw', himbeere: 'raspberry raw', heidelbeere: 'blueberry raw',
  kirsche: 'cherry raw', pfirsich: 'peach raw', mango: 'mango raw',
  ananas: 'pineapple raw', melone: 'melon raw', avocado: 'avocado raw',
  karotte: 'carrot raw', möhre: 'carrot raw', tomate: 'tomato raw',
  gurke: 'cucumber raw', paprika: 'bell pepper raw', zwiebel: 'onion raw',
  knoblauch: 'garlic raw', spinat: 'spinach raw', brokkoli: 'broccoli raw',
  blumenkohl: 'cauliflower raw', kartoffel: 'potato raw', süßkartoffel: 'sweet potato raw',
  ei: 'egg whole raw', eier: 'egg whole raw', huhn: 'chicken breast raw',
  hühnchen: 'chicken breast raw', rindfleisch: 'beef raw', lachs: 'salmon raw',
  thunfisch: 'tuna raw', milch: 'milk whole', joghurt: 'yogurt plain',
  butter: 'butter', käse: 'cheese cheddar', quark: 'cottage cheese',
  haferflocken: 'oats raw', reis: 'rice white raw', nudeln: 'pasta raw',
  brot: 'bread whole wheat', weißbrot: 'bread white', mandeln: 'almonds raw',
  nüsse: 'mixed nuts', walnüsse: 'walnuts raw', erdnüsse: 'peanuts raw',
  olivenöl: 'olive oil', zucker: 'sugar white', honig: 'honey',
  bananen: 'banana raw', äpfel: 'apple raw',
};

function getNutrient(nutrients, id) {
  const n = nutrients.find((x) => x.nutrientId === id);
  return n ? Math.round(n.value * 10) / 10 : 0;
}

function mapFood(f) {
  const n = f.foodNutrients || [];
  return {
    id: 'usda_' + f.fdcId,
    name: f.description || 'Unbekannt',
    calories: getNutrient(n, 1008),
    protein: getNutrient(n, 1003),
    carbs: getNutrient(n, 1005),
    fat: getNutrient(n, 1004),
    portion: 100,
    unit: 'g',
    source: 'usda',
  };
}

async function search(term, { signal } = {}) {
  const key = term.toLowerCase().trim();
  const query = DE_EN[key] || term;
  const url =
    `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}` +
    `&api_key=${USDA_KEY}&dataType=Foundation,SR%20Legacy&pageSize=15`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`USDA ${res.status}`);
  const data = await res.json();
  return (data.foods || []).map(mapFood).filter((f) => f.calories > 0);
}

window.USDA = { search };
