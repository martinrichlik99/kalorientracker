// foods_de.js — Lokale deutsche Lebensmitteldatenbank (~250 Einträge)
// Nährwerte pro 100g/ml, Quelle: BLS / DGE / USDA
(function () {
  const DB = [
    // ── OBST ──
    { name: 'Banane', calories: 89,  protein: 1.1, carbs: 23,  fat: 0.3, tags: ['banane','bananen'] },
    { name: 'Apfel',  calories: 52,  protein: 0.3, carbs: 14,  fat: 0.2, tags: ['apfel','äpfel'] },
    { name: 'Birne',  calories: 57,  protein: 0.4, carbs: 15,  fat: 0.1, tags: ['birne','birnen'] },
    { name: 'Orange', calories: 47,  protein: 0.9, carbs: 12,  fat: 0.1, tags: ['orange','orangen'] },
    { name: 'Mandarine', calories: 53, protein: 0.8, carbs: 13, fat: 0.3, tags: ['mandarine','mandarinen','clementine'] },
    { name: 'Erdbeere', calories: 32, protein: 0.7, carbs: 8,  fat: 0.3, tags: ['erdbeere','erdbeeren'] },
    { name: 'Himbeere', calories: 52, protein: 1.2, carbs: 12, fat: 0.7, tags: ['himbeere','himbeeren'] },
    { name: 'Heidelbeere', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, tags: ['heidelbeere','heidelbeeren','blaubeere','blaubeeren'] },
    { name: 'Traube',  calories: 69,  protein: 0.7, carbs: 18,  fat: 0.2, tags: ['traube','trauben','weintraube','weintrauben'] },
    { name: 'Kirsche', calories: 63,  protein: 1.1, carbs: 16,  fat: 0.2, tags: ['kirsche','kirschen'] },
    { name: 'Pfirsich', calories: 39, protein: 0.9, carbs: 10, fat: 0.3, tags: ['pfirsich'] },
    { name: 'Pflaume', calories: 46,  protein: 0.7, carbs: 11,  fat: 0.3, tags: ['pflaume','pflaumen','zwetschge'] },
    { name: 'Mango',   calories: 60,  protein: 0.8, carbs: 15,  fat: 0.4, tags: ['mango','mangos'] },
    { name: 'Ananas',  calories: 50,  protein: 0.5, carbs: 13,  fat: 0.1, tags: ['ananas'] },
    { name: 'Wassermelone', calories: 30, protein: 0.6, carbs: 8, fat: 0.2, tags: ['wassermelone','melone'] },
    { name: 'Honigmelone', calories: 36, protein: 0.5, carbs: 9, fat: 0.1, tags: ['honigmelone','cantaloupe'] },
    { name: 'Avocado', calories: 160, protein: 2.0, carbs: 9,  fat: 15,  tags: ['avocado','avocados'] },
    { name: 'Kiwi',    calories: 61,  protein: 1.1, carbs: 15,  fat: 0.5, tags: ['kiwi'] },
    { name: 'Zitrone', calories: 29,  protein: 1.1, carbs: 9,   fat: 0.3, tags: ['zitrone','zitronen','lemon'] },
    { name: 'Grapefruit', calories: 42, protein: 0.8, carbs: 11, fat: 0.1, tags: ['grapefruit','pampelmuse'] },
    { name: 'Papaya',  calories: 43,  protein: 0.5, carbs: 11,  fat: 0.3, tags: ['papaya'] },
    { name: 'Granatapfel', calories: 83, protein: 1.7, carbs: 19, fat: 1.2, tags: ['granatapfel'] },
    { name: 'Feige',   calories: 74,  protein: 0.8, carbs: 19,  fat: 0.3, tags: ['feige','feigen'] },
    { name: 'Dattel',  calories: 282, protein: 2.5, carbs: 75,  fat: 0.4, tags: ['dattel','datteln'] },
    { name: 'Brombeere', calories: 43, protein: 1.4, carbs: 10, fat: 0.5, tags: ['brombeere','brombeeren'] },
    { name: 'Stachelbeere', calories: 44, protein: 0.9, carbs: 10, fat: 0.6, tags: ['stachelbeere','stachelbeeren'] },
    { name: 'Johannisbeere (rot)', calories: 56, protein: 1.4, carbs: 14, fat: 0.2, tags: ['johannisbeere','rote johannisbeere'] },
    { name: 'Kokosnuss', calories: 354, protein: 3.3, carbs: 15, fat: 33, tags: ['kokosnuss','kokos'] },
    { name: 'Litschi', calories: 66, protein: 0.8, carbs: 17, fat: 0.4, tags: ['litschi','litschis'] },

    // ── GEMÜSE ──
    { name: 'Karotte', calories: 41,  protein: 0.9, carbs: 10,  fat: 0.2, tags: ['karotte','karotten','möhre','möhren'] },
    { name: 'Tomate',  calories: 18,  protein: 0.9, carbs: 4,   fat: 0.2, tags: ['tomate','tomaten'] },
    { name: 'Gurke',   calories: 15,  protein: 0.7, carbs: 4,   fat: 0.1, tags: ['gurke','gurken'] },
    { name: 'Paprika (rot)', calories: 31, protein: 1.0, carbs: 6, fat: 0.3, tags: ['paprika','rote paprika'] },
    { name: 'Paprika (grün)', calories: 20, protein: 0.9, carbs: 5, fat: 0.2, tags: ['grüne paprika'] },
    { name: 'Paprika (gelb)', calories: 27, protein: 1.0, carbs: 6, fat: 0.2, tags: ['gelbe paprika'] },
    { name: 'Zwiebel', calories: 40,  protein: 1.1, carbs: 9,   fat: 0.1, tags: ['zwiebel','zwiebeln'] },
    { name: 'Knoblauch', calories: 149, protein: 6.4, carbs: 33, fat: 0.5, tags: ['knoblauch'] },
    { name: 'Spinat',  calories: 23,  protein: 2.9, carbs: 3.6, fat: 0.4, tags: ['spinat'] },
    { name: 'Brokkoli', calories: 34, protein: 2.8, carbs: 7,   fat: 0.4, tags: ['brokkoli','broccoli'] },
    { name: 'Blumenkohl', calories: 25, protein: 1.9, carbs: 5, fat: 0.3, tags: ['blumenkohl'] },
    { name: 'Kartoffel (roh)', calories: 77, protein: 2.0, carbs: 17, fat: 0.1, tags: ['kartoffel','kartoffeln'] },
    { name: 'Kartoffel (gekocht)', calories: 86, protein: 1.9, carbs: 20, fat: 0.1, tags: ['kartoffel gekocht','gekochte kartoffel'] },
    { name: 'Süßkartoffel', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, tags: ['süßkartoffel','sweet potato','batate'] },
    { name: 'Zucchini', calories: 17, protein: 1.2, carbs: 3,  fat: 0.3, tags: ['zucchini'] },
    { name: 'Aubergine', calories: 25, protein: 1.0, carbs: 6, fat: 0.2, tags: ['aubergine','auberginen'] },
    { name: 'Kopfsalat', calories: 13, protein: 1.4, carbs: 2, fat: 0.2, tags: ['kopfsalat','salat','grüner salat'] },
    { name: 'Eisbergsalat', calories: 14, protein: 0.9, carbs: 3, fat: 0.1, tags: ['eisbergsalat','eisberg'] },
    { name: 'Rucola',  calories: 25,  protein: 2.6, carbs: 4,   fat: 0.7, tags: ['rucola','rauke'] },
    { name: 'Sellerie', calories: 16, protein: 0.7, carbs: 3,  fat: 0.2, tags: ['sellerie','staudensellerie'] },
    { name: 'Lauch',   calories: 61,  protein: 1.5, carbs: 14,  fat: 0.3, tags: ['lauch','porree'] },
    { name: 'Erbsen',  calories: 81,  protein: 5.4, carbs: 14,  fat: 0.4, tags: ['erbsen','erbse'] },
    { name: 'Mais (gekocht)', calories: 96, protein: 3.4, carbs: 21, fat: 1.5, tags: ['mais','corn'] },
    { name: 'Grüne Bohnen', calories: 31, protein: 1.8, carbs: 7, fat: 0.1, tags: ['grüne bohnen','bohnen'] },
    { name: 'Kürbis',  calories: 26,  protein: 1.0, carbs: 7,   fat: 0.1, tags: ['kürbis','hokkaido'] },
    { name: 'Rote Bete', calories: 43, protein: 1.6, carbs: 10, fat: 0.1, tags: ['rote bete','rote beete'] },
    { name: 'Fenchel', calories: 31,  protein: 1.2, carbs: 7,   fat: 0.2, tags: ['fenchel'] },
    { name: 'Champignon', calories: 22, protein: 3.1, carbs: 3, fat: 0.3, tags: ['champignon','champignons','pilze','pilz'] },
    { name: 'Chinakohl', calories: 13, protein: 1.5, carbs: 2, fat: 0.2, tags: ['chinakohl'] },
    { name: 'Kohlrabi', calories: 27, protein: 1.7, carbs: 6,  fat: 0.1, tags: ['kohlrabi'] },
    { name: 'Rosenkohl', calories: 43, protein: 3.4, carbs: 9, fat: 0.3, tags: ['rosenkohl'] },
    { name: 'Rotkohl', calories: 31,  protein: 1.5, carbs: 7,   fat: 0.1, tags: ['rotkohl','rotkraut'] },
    { name: 'Weißkohl', calories: 25, protein: 1.3, carbs: 6,  fat: 0.1, tags: ['weißkohl','weißkraut','kraut'] },
    { name: 'Spargel (weiß)', calories: 20, protein: 2.2, carbs: 4, fat: 0.1, tags: ['spargel','weißer spargel'] },
    { name: 'Spargel (grün)', calories: 20, protein: 2.2, carbs: 4, fat: 0.2, tags: ['grüner spargel'] },
    { name: 'Wirsing', calories: 28, protein: 2.0, carbs: 6,  fat: 0.3, tags: ['wirsing','wirsingkohl'] },
    { name: 'Pak Choi', calories: 13, protein: 1.5, carbs: 2, fat: 0.2, tags: ['pak choi','pak choy'] },
    { name: 'Meerrettich', calories: 48, protein: 1.5, carbs: 11, fat: 0.5, tags: ['meerrettich'] },
    { name: 'Rhabarber', calories: 21, protein: 0.9, carbs: 5, fat: 0.2, tags: ['rhabarber'] },

    // ── FLEISCH ──
    { name: 'Hähnchenbrust (roh)', calories: 110, protein: 23, carbs: 0, fat: 1.2, tags: ['hähnchenbrust','hühnerbrust','hähnchen','hühnchen'] },
    { name: 'Hähnchenbrust (gebraten)', calories: 165, protein: 31, carbs: 0, fat: 3.6, tags: ['hähnchenbrust gebraten','gebratene hähnchenbrust'] },
    { name: 'Hähnchenkeule', calories: 150, protein: 19, carbs: 0, fat: 8, tags: ['hähnchenkeule','hühnerkeule','keule'] },
    { name: 'Putenbrust', calories: 107, protein: 24, carbs: 0, fat: 0.7, tags: ['putenbrust','pute','turkey'] },
    { name: 'Rinderhack', calories: 254, protein: 17, carbs: 0, fat: 20, tags: ['rinderhack','hackfleisch','hack','gehacktes'] },
    { name: 'Rindersteak', calories: 158, protein: 21, carbs: 0, fat: 8, tags: ['rindersteak','steak','rind'] },
    { name: 'Rinderfilet', calories: 144, protein: 22, carbs: 0, fat: 6, tags: ['rinderfilet','filet'] },
    { name: 'Schweinefilet', calories: 109, protein: 22, carbs: 0, fat: 2, tags: ['schweinefilet','schwein'] },
    { name: 'Schweineschnitzel', calories: 113, protein: 21, carbs: 0, fat: 3, tags: ['schweineschnitzel','schnitzel'] },
    { name: 'Bratwurst', calories: 291, protein: 13, carbs: 1, fat: 26, tags: ['bratwurst','wurst'] },
    { name: 'Frankfurter Würstchen', calories: 280, protein: 12, carbs: 2, fat: 25, tags: ['frankfurter','würstchen','wiener'] },
    { name: 'Salami', calories: 430, protein: 23, carbs: 2, fat: 37, tags: ['salami'] },
    { name: 'Schinken (gekocht)', calories: 145, protein: 21, carbs: 1, fat: 6, tags: ['schinken','gekochter schinken','kochschinken'] },
    { name: 'Bacon/Speck', calories: 541, protein: 37, carbs: 1, fat: 42, tags: ['bacon','speck'] },
    { name: 'Leberwurst', calories: 310, protein: 13, carbs: 2, fat: 27, tags: ['leberwurst'] },
    { name: 'Lammkeule', calories: 180, protein: 20, carbs: 0, fat: 11, tags: ['lammkeule','lamm'] },

    // ── FISCH & MEERESFRÜCHTE ──
    { name: 'Lachs (roh)', calories: 208, protein: 20, carbs: 0, fat: 13, tags: ['lachs','salmon'] },
    { name: 'Lachs (geräuchert)', calories: 179, protein: 18, carbs: 0, fat: 12, tags: ['geräucherter lachs','räucherlachs'] },
    { name: 'Thunfisch (Dose, Wasser)', calories: 116, protein: 26, carbs: 0, fat: 1, tags: ['thunfisch','tuna'] },
    { name: 'Kabeljau', calories: 82, protein: 18, carbs: 0, fat: 0.7, tags: ['kabeljau','dorsch','cod'] },
    { name: 'Forelle', calories: 119, protein: 20, carbs: 0, fat: 4, tags: ['forelle','regenbogenforelle'] },
    { name: 'Makrele', calories: 205, protein: 19, carbs: 0, fat: 14, tags: ['makrele'] },
    { name: 'Hering', calories: 158, protein: 18, carbs: 0, fat: 9, tags: ['hering'] },
    { name: 'Tilapia', calories: 96, protein: 20, carbs: 0, fat: 2, tags: ['tilapia'] },
    { name: 'Garnelen', calories: 99, protein: 21, carbs: 0, fat: 0.3, tags: ['garnelen','shrimps','krabben'] },
    { name: 'Seelachs', calories: 73, protein: 16, carbs: 0, fat: 0.6, tags: ['seelachs','alaska seelachs','pollack'] },

    // ── MILCHPRODUKTE & EIER ──
    { name: 'Vollmilch (3,5%)', calories: 64, protein: 3.3, carbs: 4.8, fat: 3.5, tags: ['vollmilch','milch'] },
    { name: 'Halbfettmilch (1,5%)', calories: 45, protein: 3.3, carbs: 4.8, fat: 1.5, tags: ['halbfettmilch','fettarme milch','1,5% milch'] },
    { name: 'Magermilch', calories: 35, protein: 3.5, carbs: 5.0, fat: 0.1, tags: ['magermilch','entrahmte milch'] },
    { name: 'Sojamilch', calories: 33, protein: 3.3, carbs: 1.8, fat: 1.8, tags: ['sojamilch','soja'] },
    { name: 'Hafermilch', calories: 45, protein: 1.0, carbs: 7.5, fat: 1.5, tags: ['hafermilch','oat milk'] },
    { name: 'Mandelmilch', calories: 15, protein: 0.5, carbs: 0.8, fat: 1.1, tags: ['mandelmilch'] },
    { name: 'Joghurt (3,5%)', calories: 61, protein: 3.5, carbs: 4.0, fat: 3.5, tags: ['joghurt','naturjoghurt'] },
    { name: 'Joghurt (1,5%)', calories: 49, protein: 3.8, carbs: 5.0, fat: 1.5, tags: ['joghurt 1,5%','fettarmer joghurt'] },
    { name: 'Joghurt (0,1%)', calories: 38, protein: 4.3, carbs: 5.5, fat: 0.1, tags: ['magerjoghurt','0,1% joghurt'] },
    { name: 'Skyr', calories: 63, protein: 11, carbs: 4.0, fat: 0.2, tags: ['skyr'] },
    { name: 'Quark (mager)', calories: 73, protein: 12, carbs: 3.5, fat: 0.2, tags: ['magerquark','quark mager'] },
    { name: 'Quark (40% F.i.Tr.)', calories: 131, protein: 10, carbs: 3.0, fat: 9, tags: ['quark','sahnequark','40% quark'] },
    { name: 'Hüttenkäse', calories: 98, protein: 11, carbs: 3.3, fat: 4.3, tags: ['hüttenkäse','cottage cheese'] },
    { name: 'Frischkäse', calories: 256, protein: 7, carbs: 3.0, fat: 24, tags: ['frischkäse','philadelphia'] },
    { name: 'Butter', calories: 741, protein: 0.7, carbs: 0.6, fat: 83, tags: ['butter'] },
    { name: 'Sahne (30%)', calories: 302, protein: 2.4, carbs: 3.0, fat: 30, tags: ['sahne','schlagsahne','obers'] },
    { name: 'Schmand (24%)', calories: 237, protein: 2.8, carbs: 3.0, fat: 24, tags: ['schmand','crème fraîche'] },
    { name: 'Sauerrahm', calories: 130, protein: 3.1, carbs: 4.0, fat: 10, tags: ['sauerrahm','saure sahne'] },
    { name: 'Gouda', calories: 356, protein: 25, carbs: 0.4, fat: 27, tags: ['gouda'] },
    { name: 'Emmentaler', calories: 380, protein: 28, carbs: 0, fat: 29, tags: ['emmentaler','emmental'] },
    { name: 'Cheddar', calories: 403, protein: 25, carbs: 1.3, fat: 33, tags: ['cheddar'] },
    { name: 'Mozzarella', calories: 253, protein: 18, carbs: 2.7, fat: 19, tags: ['mozzarella'] },
    { name: 'Parmesan', calories: 431, protein: 38, carbs: 0, fat: 29, tags: ['parmesan','parmigiano'] },
    { name: 'Feta', calories: 264, protein: 14, carbs: 4.0, fat: 21, tags: ['feta','fetakäse'] },
    { name: 'Brie', calories: 334, protein: 20, carbs: 0, fat: 28, tags: ['brie'] },
    { name: 'Camembert', calories: 299, protein: 20, carbs: 0, fat: 24, tags: ['camembert'] },
    { name: 'Ei (ganzes)', calories: 155, protein: 13, carbs: 1.1, fat: 11, tags: ['ei','eier','hühnerei'] },
    { name: 'Eiweiß', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, tags: ['eiweiß','egg white'] },
    { name: 'Eigelb', calories: 322, protein: 16, carbs: 3.6, fat: 27, tags: ['eigelb','eidotter'] },

    // ── GETREIDE & KOHLENHYDRATE ──
    { name: 'Weißbrot', calories: 265, protein: 9, carbs: 51, fat: 3, tags: ['weißbrot','toastbrot','toast','brot'] },
    { name: 'Vollkornbrot', calories: 240, protein: 8, carbs: 45, fat: 3.3, tags: ['vollkornbrot','vollkorn'] },
    { name: 'Brötchen', calories: 279, protein: 9.5, carbs: 54, fat: 2.5, tags: ['brötchen','semmel','schrippe'] },
    { name: 'Croissant', calories: 406, protein: 8, carbs: 46, fat: 21, tags: ['croissant'] },
    { name: 'Haferflocken', calories: 372, protein: 13, carbs: 66, fat: 7, tags: ['haferflocken','oats','oatmeal','müsli'] },
    { name: 'Müsli', calories: 350, protein: 9, carbs: 65, fat: 6, tags: ['müsli','granola'] },
    { name: 'Cornflakes', calories: 378, protein: 7.5, carbs: 84, fat: 0.9, tags: ['cornflakes','cerealien'] },
    { name: 'Reis (roh)', calories: 357, protein: 7, carbs: 77, fat: 0.6, tags: ['reis roh','roher reis'] },
    { name: 'Reis (gekocht)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, tags: ['reis','gekochter reis','weißer reis'] },
    { name: 'Vollkornreis (gekocht)', calories: 123, protein: 2.7, carbs: 26, fat: 1.0, tags: ['vollkornreis','brauner reis','brown rice'] },
    { name: 'Nudeln (roh)', calories: 352, protein: 12, carbs: 72, fat: 1.5, tags: ['nudeln roh'] },
    { name: 'Nudeln (gekocht)', calories: 158, protein: 5.5, carbs: 31, fat: 0.9, tags: ['nudeln','pasta','spaghetti','penne','tagliatelle'] },
    { name: 'Vollkornnudeln (gekocht)', calories: 149, protein: 6, carbs: 29, fat: 1.1, tags: ['vollkornnudeln','vollkornpasta'] },
    { name: 'Quinoa (gekocht)', calories: 120, protein: 4.4, carbs: 22, fat: 1.9, tags: ['quinoa'] },
    { name: 'Couscous (gekocht)', calories: 112, protein: 3.8, carbs: 23, fat: 0.2, tags: ['couscous'] },
    { name: 'Bulgur (gekocht)', calories: 83, protein: 3.0, carbs: 19, fat: 0.2, tags: ['bulgur'] },
    { name: 'Pommes Frites', calories: 312, protein: 3.4, carbs: 41, fat: 15, tags: ['pommes','pommes frites','fritten'] },
    { name: 'Wrap / Tortilla', calories: 306, protein: 8, carbs: 56, fat: 6, tags: ['wrap','tortilla'] },
    { name: 'Bagel', calories: 275, protein: 11, carbs: 53, fat: 1.7, tags: ['bagel'] },
    { name: 'Mehl (Weizen, Typ 405)', calories: 364, protein: 10, carbs: 76, fat: 1.0, tags: ['mehl','weizenmehl'] },

    // ── HÜLSENFRÜCHTE ──
    { name: 'Linsen (gekocht)', calories: 116, protein: 9, carbs: 20, fat: 0.4, tags: ['linsen','lentils'] },
    { name: 'Kichererbsen (gekocht)', calories: 164, protein: 8.9, carbs: 27, fat: 2.6, tags: ['kichererbsen','hummus basis'] },
    { name: 'Schwarze Bohnen (gekocht)', calories: 132, protein: 8.9, carbs: 24, fat: 0.5, tags: ['schwarze bohnen'] },
    { name: 'Kidneybohnen (gekocht)', calories: 127, protein: 8.7, carbs: 23, fat: 0.5, tags: ['kidneybohnen','kidney'] },
    { name: 'Weiße Bohnen (gekocht)', calories: 139, protein: 9.7, carbs: 25, fat: 0.5, tags: ['weiße bohnen'] },
    { name: 'Edamame', calories: 122, protein: 11, carbs: 10, fat: 5, tags: ['edamame','sojabohnen'] },
    { name: 'Tofu (natur)', calories: 76, protein: 8, carbs: 1.9, fat: 4.8, tags: ['tofu'] },
    { name: 'Tempeh', calories: 193, protein: 19, carbs: 9, fat: 11, tags: ['tempeh'] },

    // ── NÜSSE & SAMEN ──
    { name: 'Mandeln', calories: 579, protein: 21, carbs: 22, fat: 50, tags: ['mandeln','mandel'] },
    { name: 'Walnüsse', calories: 654, protein: 15, carbs: 14, fat: 65, tags: ['walnüsse','walnuss'] },
    { name: 'Cashews', calories: 553, protein: 18, carbs: 30, fat: 44, tags: ['cashews','cashewnüsse'] },
    { name: 'Erdnüsse', calories: 567, protein: 26, carbs: 16, fat: 49, tags: ['erdnüsse','erdnuss','peanuts'] },
    { name: 'Haselnüsse', calories: 628, protein: 15, carbs: 17, fat: 61, tags: ['haselnüsse','haselnuss'] },
    { name: 'Macadamia', calories: 718, protein: 8, carbs: 14, fat: 76, tags: ['macadamia'] },
    { name: 'Pistazien', calories: 562, protein: 20, carbs: 28, fat: 45, tags: ['pistazien','pistazie'] },
    { name: 'Pekannüsse', calories: 691, protein: 9, carbs: 14, fat: 72, tags: ['pekannüsse','pekan'] },
    { name: 'Sonnenblumenkerne', calories: 584, protein: 21, carbs: 20, fat: 51, tags: ['sonnenblumenkerne'] },
    { name: 'Kürbiskerne', calories: 559, protein: 30, carbs: 11, fat: 49, tags: ['kürbiskerne'] },
    { name: 'Chiasamen', calories: 486, protein: 17, carbs: 42, fat: 31, tags: ['chiasamen','chia'] },
    { name: 'Leinsamen', calories: 534, protein: 18, carbs: 29, fat: 42, tags: ['leinsamen','flachs'] },
    { name: 'Sesam', calories: 573, protein: 18, carbs: 23, fat: 50, tags: ['sesam','sesamsamen'] },
    { name: 'Hanfsamen', calories: 553, protein: 32, carbs: 9, fat: 49, tags: ['hanfsamen','hemp'] },

    // ── ÖLE & FETTE ──
    { name: 'Olivenöl', calories: 884, protein: 0, carbs: 0, fat: 100, tags: ['olivenöl','olive oil'] },
    { name: 'Rapsöl', calories: 884, protein: 0, carbs: 0, fat: 100, tags: ['rapsöl'] },
    { name: 'Sonnenblumenöl', calories: 884, protein: 0, carbs: 0, fat: 100, tags: ['sonnenblumenöl'] },
    { name: 'Kokosöl', calories: 862, protein: 0, carbs: 0, fat: 100, tags: ['kokosöl','coconut oil'] },

    // ── AUFSTRICHE & SAUCEN ──
    { name: 'Erdnussbutter', calories: 588, protein: 25, carbs: 20, fat: 50, tags: ['erdnussbutter','peanut butter'] },
    { name: 'Mandelmus', calories: 614, protein: 21, carbs: 20, fat: 55, tags: ['mandelmus'] },
    { name: 'Nutella', calories: 539, protein: 6.3, carbs: 57, fat: 31, tags: ['nutella','nougat','schokocreme'] },
    { name: 'Marmelade', calories: 250, protein: 0.4, carbs: 65, fat: 0.1, tags: ['marmelade','konfitüre'] },
    { name: 'Honig', calories: 304, protein: 0.3, carbs: 82, fat: 0, tags: ['honig'] },
    { name: 'Mayonnaise', calories: 680, protein: 1.4, carbs: 3, fat: 74, tags: ['mayonnaise','mayo'] },
    { name: 'Ketchup', calories: 101, protein: 1.9, carbs: 25, fat: 0.5, tags: ['ketchup'] },
    { name: 'Senf', calories: 66, protein: 4.1, carbs: 6, fat: 3.3, tags: ['senf','dijon'] },
    { name: 'Tomatenmark', calories: 87, protein: 4.5, carbs: 19, fat: 0.4, tags: ['tomatenmark'] },
    { name: 'Passata', calories: 35, protein: 1.5, carbs: 7, fat: 0.3, tags: ['passata','tomatenpassata'] },
    { name: 'Hummus', calories: 177, protein: 8, carbs: 14, fat: 10, tags: ['hummus'] },
    { name: 'Pesto (Basilikum)', calories: 450, protein: 8, carbs: 5, fat: 45, tags: ['pesto'] },
    { name: 'Sojasoße', calories: 53, protein: 8, carbs: 5, fat: 0.1, tags: ['sojasoße','soja sauce'] },
    { name: 'Tahini', calories: 595, protein: 17, carbs: 21, fat: 54, tags: ['tahini','sesammus'] },

    // ── SÜSSIGKEITEN & SNACKS ──
    { name: 'Vollmilchschokolade', calories: 535, protein: 7.6, carbs: 56, fat: 31, tags: ['schokolade','vollmilchschokolade','milchschokolade'] },
    { name: 'Zartbitterschokolade (70%)', calories: 540, protein: 5, carbs: 46, fat: 38, tags: ['zartbitterschokolade','dunkle schokolade','dark chocolate'] },
    { name: 'Gummibärchen', calories: 343, protein: 6.9, carbs: 77, fat: 0.1, tags: ['gummibärchen','gummi','haribo'] },
    { name: 'Chips', calories: 536, protein: 7, carbs: 53, fat: 35, tags: ['chips','kartoffelchips'] },
    { name: 'Popcorn (gesalzen)', calories: 387, protein: 13, carbs: 78, fat: 4, tags: ['popcorn'] },
    { name: 'Butterkekse', calories: 473, protein: 7, carbs: 70, fat: 19, tags: ['kekse','butterkekse','plätzchen'] },
    { name: 'Marzipan', calories: 479, protein: 9, carbs: 60, fat: 25, tags: ['marzipan'] },

    // ── GETRÄNKE ──
    { name: 'Orangensaft', calories: 45, protein: 0.7, carbs: 10, fat: 0.2, unit: 'ml', tags: ['orangensaft','oj'] },
    { name: 'Apfelsaft', calories: 46, protein: 0.1, carbs: 11, fat: 0.1, unit: 'ml', tags: ['apfelsaft'] },
    { name: 'Cola', calories: 42, protein: 0, carbs: 11, fat: 0, unit: 'ml', tags: ['cola','coca cola','pepsi'] },
    { name: 'Bier (5%)', calories: 43, protein: 0.5, carbs: 3.6, fat: 0, unit: 'ml', tags: ['bier'] },
    { name: 'Rotwein', calories: 85, protein: 0.1, carbs: 2.6, fat: 0, unit: 'ml', tags: ['rotwein','wein'] },
    { name: 'Weißwein', calories: 82, protein: 0.1, carbs: 2.6, fat: 0, unit: 'ml', tags: ['weißwein'] },

    // ── SONSTIGES / ZUTATEN ──
    { name: 'Zucker', calories: 399, protein: 0, carbs: 100, fat: 0, tags: ['zucker','weißer zucker'] },
    { name: 'Brauner Zucker', calories: 377, protein: 0, carbs: 97, fat: 0, tags: ['brauner zucker','rohrzucker'] },
    { name: 'Stevia', calories: 0, protein: 0, carbs: 0, fat: 0, tags: ['stevia'] },
    { name: 'Kokosblütenzucker', calories: 382, protein: 0, carbs: 96, fat: 0.5, tags: ['kokosblütenzucker'] },
    { name: 'Ahornsirup', calories: 260, protein: 0, carbs: 67, fat: 0.1, tags: ['ahornsirup','maple syrup'] },
    { name: 'Agavendicksaft', calories: 310, protein: 0, carbs: 77, fat: 0, tags: ['agavendicksaft','agave'] },
    { name: 'Proteinpulver (Whey)', calories: 380, protein: 75, carbs: 10, fat: 5, tags: ['protein','whey','proteinpulver','eiweißpulver'] },
    { name: 'Haferkleie', calories: 246, protein: 17, carbs: 51, fat: 7, tags: ['haferkleie','kleie'] },
    { name: 'Weizenkeime', calories: 360, protein: 27, carbs: 51, fat: 10, tags: ['weizenkeime'] },
  ];

  function num(v) {
    const x = parseFloat(v);
    return Number.isFinite(x) ? Math.round(x * 10) / 10 : 0;
  }

  function search(term) {
    if (!term || term.length < 1) return [];
    const q = term.toLowerCase().trim();
    const words = q.split(/\s+/);

    const scored = DB.map((f) => {
      const name = f.name.toLowerCase();
      const tags = f.tags || [];
      let score = 0;

      // Exakter Tag-Match → höchste Prio
      if (tags.includes(q)) score = 100;
      // Name beginnt mit Suchbegriff
      else if (name.startsWith(q)) score = 80;
      // Alle Wörter im Namen enthalten
      else if (words.every((w) => name.includes(w) || tags.some((t) => t.includes(w)))) score = 60;
      // Mindestens ein Wort trifft
      else if (words.some((w) => name.includes(w) || tags.some((t) => t.includes(w)))) score = 30;

      return { food: f, score };
    })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ food: f }) => ({
        id: 'de_' + f.name.toLowerCase().replace(/\s+/g, '_'),
        name: f.name,
        calories: num(f.calories),
        protein: num(f.protein),
        carbs: num(f.carbs),
        fat: num(f.fat),
        portion: 100,
        unit: f.unit || 'g',
        source: 'local_de',
      }));

    return scored;
  }

  window.FoodsDE = { search };
})();
