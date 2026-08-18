import openpyxl, json, re, unicodedata

SWISS_DE = {
    'poulet': ['hähnchen', 'huhn', 'hühnchen'],
    'rüebli': ['karotte', 'karotten', 'möhre'],
    'peperoni': ['paprika'],
    'peperoncini': ['chili'],
    'kefen': ['zuckerschoten'],
    'cervelat': ['cervelatwurst'],
    'nidel': ['sahne', 'schlagobers'],
    'rahm': ['sahne', 'obers'],
    'quark': ['topfen'],
    'aprikose': ['marille'],
    'blumenkohl': ['karfiol'],
    'kartoffel': ['erdapfel', 'erdäpfel'],
    'pflaume': ['zwetschke'],
    'brötchen': ['semmel'],
    'weggli': ['semmel', 'brötchen'],
    'gipfeli': ['croissant'],
    'hackfleisch': ['faschiertes'],
    'schlagsahne': ['schlagobers'],
    'randen': ['rote bete', 'rote rüben'],
    'bohnen': ['fisolen'],
    'maiskolben': ['kukuruz'],
    'meerrettich': ['kren'],
    'kebab': ['döner', 'doener', 'dönerkebab'],
    'gehacktes': ['faschiertes', 'hackfleisch'],
    'rotkohl': ['rotkraut', 'blaukraut'],
    'weisskohl': ['weisskraut', 'weißkraut'],
    'wirz': ['wirsing'],
    'sellerie': ['zeller'],
    'johannisbeere': ['ribisel', 'ribiseln'],
    'crêpes': ['palatschinke', 'palatschinken'],
    'pommes frites': ['fritten'],
    'kartoffelstock': ['kartoffelpüree', 'erdäpfelpüree'],
    'zwetschge': ['zwetschke'],
    'bohne, grün': ['fisolen', 'grüne bohnen'],
    'apfelsine': ['orange'],
    'maisgriess': ['polenta'],
}

def num(v):
    if v is None:
        return 0
    s = str(v).strip().replace(',', '.').replace('<', '')
    m = re.match(r'^-?\d+(\.\d+)?$', s)
    return round(float(s), 1) if m else 0

def tags_for(name, syn):
    out = set()
    base = name.split(',')[0].split('(')[0].strip().lower()
    out.add(base)
    for w in re.split(r'[\s/]+', base):
        w = w.strip('-.')
        if len(w) > 3:
            out.add(w)
    for s in re.split(r'[,;/]', (syn or '')):
        s = s.strip().lower()
        if s and s != 'none':
            out.add(s)
    haystack = name.lower() + ' | ' + ' | '.join(out)
    for key, extra in SWISS_DE.items():
        if key in haystack:
            out.update(extra)
    return sorted(out)

wb = openpyxl.load_workbook('swiss.xlsx', read_only=True)
ws = wb['Generische Lebensmittel']
rows = list(ws.iter_rows(min_row=4, values_only=True))

out, seen = [], set()
for r in rows:
    name = (r[3] or '').strip()
    kcal = num(r[11])
    if not name or kcal <= 0:
        continue
    key = name.lower()
    if key in seen:
        continue
    seen.add(key)
    unit = 'ml' if 'ml' in str(r[7] or '') else 'g'
    e = {
        'name': name,
        'calories': round(kcal),
        'protein': num(r[41]),
        'carbs': num(r[29]),
        'fat': num(r[14]),
        'tags': tags_for(name, r[4]),
    }
    if unit == 'ml':
        e['unit'] = 'ml'
    out.append(e)

lines = [json.dumps(e, ensure_ascii=False, separators=(',', ':')) for e in out]
js = (
    "// foods_ch.js — Schweizer Naehrwertdatenbank (BLV), generische Lebensmittel\n"
    "// Quelle: https://naehrwertdaten.ch (Bundesamt fuer Lebensmittelsicherheit und Veterinaerwesen), Nutzung kostenlos.\n"
    "// Werte pro 100 g/ml. Automatisch aus Schweizer_Nahrwertdatenbank.xlsx erzeugt — nicht von Hand editieren.\n"
    "window.FOODS_CH = [\n" + ",\n".join(lines) + "\n];\n"
)
open('foods_ch.js', 'w', encoding='utf-8').write(js)
print('Eintraege:', len(out))
for probe in ['pizza', 'bier', 'kebab', 'poulet', 'rüebli']:
    hits = [e['name'] for e in out if any(probe in t for t in e['tags'])]
    print(probe, len(hits), hits[:3])
