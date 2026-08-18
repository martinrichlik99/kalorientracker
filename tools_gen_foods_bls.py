import openpyxl, json, re

AT_SYN = {
    'kartoffel': ['erdapfel', 'erdäpfel'],
    'aprikose': ['marille', 'marillen'],
    'blumenkohl': ['karfiol'],
    'quark': ['topfen'],
    'hackfleisch': ['faschiertes'],
    'grüne bohne': ['fisolen'],
    'johannisbeere': ['ribisel', 'ribiseln'],
    'meerrettich': ['kren'],
    'pflaume': ['zwetschke', 'zwetschken'],
    'sahne': ['obers', 'schlagobers'],
    'brötchen': ['semmel', 'semmerl'],
    'tomate': ['paradeiser'],
    'aubergine': ['melanzani'],
    'sellerie': ['zeller'],
    'mais': ['kukuruz'],
    'pfannkuchen': ['palatschinke', 'palatschinken'],
    'feldsalat': ['vogerlsalat'],
    'hefe': ['germ'],
    'pflaumenmus': ['powidl'],
    'hähnchen': ['hendl', 'huhn'],
    'rosenkohl': ['kohlsprossen'],
    'weißkohl': ['weißkraut'],
    'rotkohl': ['rotkraut', 'blaukraut'],
    'rote bete': ['rote rüben'],
    'schlagsahne': ['schlagobers'],
    'kuchen': [],
}

def num(v):
    if v is None:
        return 0
    s = str(v).strip().replace(',', '.')
    return round(float(s), 1) if re.match(r'^-?\d+(\.\d+)?$', s) else 0

rows = json.load(open('bls_rows.json'))
out, seen = [], set()
for name, kcal, prot, fat, cho in rows:
    name = (name or '').strip()
    kcal = num(kcal)
    if not name or kcal <= 0 or name.lower() in seen:
        continue
    seen.add(name.lower())
    e = {'name': name, 'calories': round(kcal), 'protein': num(prot), 'carbs': num(cho), 'fat': num(fat)}
    low = name.lower()
    tags = sorted({s for key, syns in AT_SYN.items() if key in low for s in syns})
    if tags:
        e['tags'] = tags
    out.append(e)

lines = [json.dumps(e, ensure_ascii=False, separators=(',', ':')) for e in out]
js = (
    "// foods_bls.js — Bundeslebensmittelschluessel (BLS) 4.0, Max Rubner-Institut, CC BY 4.0\n"
    "// Quelle: https://www.blsdb.de — Max Rubner-Institut (2025): Bundeslebensmittelschluessel (BLS),\n"
    "// Version 4.0 - Deutsche Naehrstoffdatenbank. Karlsruhe. DOI: 10.25826/Data20251217-134202-0\n"
    "// Werte pro 100 g. Automatisch erzeugt (tools_gen_foods_bls.py) — nicht von Hand editieren.\n"
    "window.FOODS_BLS = [\n" + ",\n".join(lines) + "\n];\n"
)
open('foods_bls.js', 'w', encoding='utf-8').write(js)
print('Eintraege:', len(out))
