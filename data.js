/** Embedded country set. No network needed.
 *  tier: easy | medium | hard — how familiar the country is
 *  region: used to keep distractors far apart (easy) or nearby (harder)
 *  flagGroup: look-alike flags; "unique" means no close visual twin
 */
function flagEmoji(iso) {
  return [...iso.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

/** [name, capital, iso, tier, region, flagGroup] */
const COUNTRY_SEED = [
  ["France", "Paris", "FR", "easy", "europe", "vert-stripe"],
  ["Japan", "Tokyo", "JP", "easy", "asia", "disc"],
  ["Brazil", "Brasília", "BR", "easy", "americas", "unique"],
  ["India", "New Delhi", "IN", "easy", "asia", "unique"],
  ["Egypt", "Cairo", "EG", "easy", "africa", "pan-arab"],
  ["Canada", "Ottawa", "CA", "easy", "americas", "unique"],
  ["Australia", "Canberra", "AU", "easy", "oceania", "union"],
  ["Italy", "Rome", "IT", "easy", "europe", "vert-stripe"],
  ["Germany", "Berlin", "DE", "easy", "europe", "horiz-other"],
  ["Spain", "Madrid", "ES", "easy", "europe", "unique"],
  ["Mexico", "Mexico City", "MX", "easy", "americas", "vert-stripe"],
  ["South Korea", "Seoul", "KR", "easy", "asia", "unique"],
  ["United Kingdom", "London", "GB", "easy", "europe", "union"],
  ["United States", "Washington, D.C.", "US", "easy", "americas", "stars-stripes"],
  ["China", "Beijing", "CN", "easy", "asia", "red-star"],
  ["Argentina", "Buenos Aires", "AR", "easy", "americas", "unique"],
  ["South Africa", "Pretoria", "ZA", "easy", "africa", "unique"],
  ["Turkey", "Ankara", "TR", "easy", "mena", "crescent"],
  ["Greece", "Athens", "GR", "easy", "europe", "unique"],
  ["Sweden", "Stockholm", "SE", "easy", "europe", "nordic"],
  ["Norway", "Oslo", "NO", "easy", "europe", "nordic"],
  ["Netherlands", "Amsterdam", "NL", "easy", "europe", "rbw"],
  ["Portugal", "Lisbon", "PT", "easy", "europe", "unique"],
  ["Russia", "Moscow", "RU", "easy", "europe", "rbw"],
  ["Ireland", "Dublin", "IE", "easy", "europe", "vert-stripe"],
  ["Switzerland", "Bern", "CH", "easy", "europe", "unique"],
  ["Thailand", "Bangkok", "TH", "easy", "asia", "unique"],
  ["New Zealand", "Wellington", "NZ", "easy", "oceania", "union"],
  ["Poland", "Warsaw", "PL", "easy", "europe", "red-white"],
  ["Belgium", "Brussels", "BE", "easy", "europe", "vert-stripe"],
  ["Denmark", "Copenhagen", "DK", "easy", "europe", "nordic"],
  ["Cuba", "Havana", "CU", "easy", "americas", "unique"],

  ["Austria", "Vienna", "AT", "medium", "europe", "red-white"],
  ["Finland", "Helsinki", "FI", "medium", "europe", "nordic"],
  ["Vietnam", "Hanoi", "VN", "medium", "asia", "red-star"],
  ["Indonesia", "Jakarta", "ID", "medium", "asia", "red-white"],
  ["Malaysia", "Kuala Lumpur", "MY", "medium", "asia", "crescent"],
  ["Philippines", "Manila", "PH", "medium", "asia", "unique"],
  ["Saudi Arabia", "Riyadh", "SA", "medium", "mena", "unique"],
  ["United Arab Emirates", "Abu Dhabi", "AE", "medium", "mena", "pan-arab"],
  ["Kenya", "Nairobi", "KE", "medium", "africa", "unique"],
  ["Nigeria", "Abuja", "NG", "medium", "africa", "vert-stripe"],
  ["Morocco", "Rabat", "MA", "medium", "africa", "red-star"],
  ["Chile", "Santiago", "CL", "medium", "americas", "stars-stripes"],
  ["Colombia", "Bogotá", "CO", "medium", "americas", "ybr"],
  ["Peru", "Lima", "PE", "medium", "americas", "vert-stripe"],
  ["Ukraine", "Kyiv", "UA", "medium", "europe", "unique"],
  ["Czech Republic", "Prague", "CZ", "medium", "europe", "unique"],
  ["Hungary", "Budapest", "HU", "medium", "europe", "horiz-other"],
  ["Israel", "Jerusalem", "IL", "medium", "mena", "unique"],
  ["Singapore", "Singapore", "SG", "medium", "asia", "crescent"],
  ["Iceland", "Reykjavík", "IS", "medium", "europe", "nordic"],
  ["Jamaica", "Kingston", "JM", "medium", "americas", "unique"],
  ["Pakistan", "Islamabad", "PK", "medium", "asia", "crescent"],
  ["Bangladesh", "Dhaka", "BD", "medium", "asia", "disc"],
  ["Romania", "Bucharest", "RO", "medium", "europe", "vert-stripe"],
  ["Croatia", "Zagreb", "HR", "medium", "europe", "rbw"],
  ["Iran", "Tehran", "IR", "medium", "mena", "unique"],
  ["Iraq", "Baghdad", "IQ", "medium", "mena", "pan-arab"],
  ["Qatar", "Doha", "QA", "medium", "mena", "unique"],
  ["Ethiopia", "Addis Ababa", "ET", "medium", "africa", "pan-african"],
  ["Ghana", "Accra", "GH", "medium", "africa", "pan-african"],
  ["Ecuador", "Quito", "EC", "medium", "americas", "ybr"],
  ["Venezuela", "Caracas", "VE", "medium", "americas", "ybr"],
  ["Uruguay", "Montevideo", "UY", "medium", "americas", "stars-stripes"],
  ["Costa Rica", "San José", "CR", "medium", "americas", "unique"],
  ["Panama", "Panama City", "PA", "medium", "americas", "unique"],
  ["Dominican Republic", "Santo Domingo", "DO", "medium", "americas", "unique"],
  ["Nepal", "Kathmandu", "NP", "medium", "asia", "unique"],
  ["Tanzania", "Dodoma", "TZ", "medium", "africa", "unique"],

  ["Chad", "N'Djamena", "TD", "hard", "africa", "vert-stripe"],
  ["Mali", "Bamako", "ML", "hard", "africa", "vert-stripe"],
  ["Guinea", "Conakry", "GN", "hard", "africa", "vert-stripe"],
  ["Côte d'Ivoire", "Yamoussoukro", "CI", "hard", "africa", "vert-stripe"],
  ["Cameroon", "Yaoundé", "CM", "hard", "africa", "vert-stripe"],
  ["Senegal", "Dakar", "SN", "hard", "africa", "vert-stripe"],
  ["Moldova", "Chișinău", "MD", "hard", "europe", "vert-stripe"],
  ["Tunisia", "Tunis", "TN", "hard", "africa", "crescent"],
  ["Algeria", "Algiers", "DZ", "hard", "africa", "crescent"],
  ["Luxembourg", "Luxembourg", "LU", "hard", "europe", "rbw"],
  ["Monaco", "Monaco", "MC", "hard", "europe", "red-white"],
  ["Slovakia", "Bratislava", "SK", "hard", "europe", "rbw"],
  ["Slovenia", "Ljubljana", "SI", "hard", "europe", "rbw"],
  ["Bulgaria", "Sofia", "BG", "hard", "europe", "horiz-other"],
  ["Serbia", "Belgrade", "RS", "hard", "europe", "rbw"],
  ["Lithuania", "Vilnius", "LT", "hard", "europe", "horiz-other"],
  ["Latvia", "Riga", "LV", "hard", "europe", "red-white"],
  ["Estonia", "Tallinn", "EE", "hard", "europe", "horiz-other"],
  ["Armenia", "Yerevan", "AM", "hard", "mena", "horiz-other"],
  ["Azerbaijan", "Baku", "AZ", "hard", "mena", "crescent"],
  ["Georgia", "Tbilisi", "GE", "hard", "mena", "unique"],
  ["Jordan", "Amman", "JO", "hard", "mena", "pan-arab"],
  ["Kuwait", "Kuwait City", "KW", "hard", "mena", "pan-arab"],
  ["Oman", "Muscat", "OM", "hard", "mena", "unique"],
  ["Yemen", "Sana'a", "YE", "hard", "mena", "pan-arab"],
  ["Syria", "Damascus", "SY", "hard", "mena", "pan-arab"],
  ["Lebanon", "Beirut", "LB", "hard", "mena", "unique"],
  ["Bahrain", "Manama", "BH", "hard", "mena", "unique"],
  ["Kazakhstan", "Astana", "KZ", "hard", "asia", "unique"],
  ["Uzbekistan", "Tashkent", "UZ", "hard", "asia", "crescent"],
  ["Mongolia", "Ulaanbaatar", "MN", "hard", "asia", "unique"],
  ["Cambodia", "Phnom Penh", "KH", "hard", "asia", "unique"],
  ["Myanmar", "Naypyidaw", "MM", "hard", "asia", "unique"],
  ["Laos", "Vientiane", "LA", "hard", "asia", "unique"],
  ["Fiji", "Suva", "FJ", "hard", "oceania", "union"],
  ["Papua New Guinea", "Port Moresby", "PG", "hard", "oceania", "unique"],
  ["Samoa", "Apia", "WS", "hard", "oceania", "unique"],
  ["Bolivia", "Sucre", "BO", "hard", "americas", "horiz-other"],
  ["Paraguay", "Asunción", "PY", "hard", "americas", "rbw"],
  ["Guatemala", "Guatemala City", "GT", "hard", "americas", "unique"],
  ["Honduras", "Tegucigalpa", "HN", "hard", "americas", "cam-blue"],
  ["El Salvador", "San Salvador", "SV", "hard", "americas", "cam-blue"],
  ["Nicaragua", "Managua", "NI", "hard", "americas", "cam-blue"],
  ["Liberia", "Monrovia", "LR", "hard", "africa", "stars-stripes"],
  ["Madagascar", "Antananarivo", "MG", "hard", "africa", "unique"],
  ["Mozambique", "Maputo", "MZ", "hard", "africa", "unique"],
  ["Angola", "Luanda", "AO", "hard", "africa", "unique"],
  ["Uganda", "Kampala", "UG", "hard", "africa", "unique"],
  ["Rwanda", "Kigali", "RW", "hard", "africa", "unique"],
  ["Zimbabwe", "Harare", "ZW", "hard", "africa", "unique"],
  ["Zambia", "Lusaka", "ZM", "hard", "africa", "unique"],
  ["Botswana", "Gaborone", "BW", "hard", "africa", "unique"],
  ["Namibia", "Windhoek", "NA", "hard", "africa", "unique"],
  ["Gabon", "Libreville", "GA", "hard", "africa", "horiz-other"],
  ["Congo", "Brazzaville", "CG", "hard", "africa", "pan-african"],
  ["DR Congo", "Kinshasa", "CD", "hard", "africa", "unique"],
  ["Benin", "Porto-Novo", "BJ", "hard", "africa", "pan-african"],
  ["Burkina Faso", "Ouagadougou", "BF", "hard", "africa", "pan-african"],
  ["Niger", "Niamey", "NE", "hard", "africa", "horiz-other"],
  ["Togo", "Lomé", "TG", "hard", "africa", "pan-african"],
  ["Sierra Leone", "Freetown", "SL", "hard", "africa", "horiz-other"],
  ["Sudan", "Khartoum", "SD", "hard", "africa", "pan-arab"],
  ["Libya", "Tripoli", "LY", "hard", "africa", "pan-arab"],
  ["Mauritania", "Nouakchott", "MR", "hard", "africa", "crescent"],
  ["Maldives", "Malé", "MV", "hard", "asia", "crescent"],
  ["Bhutan", "Thimphu", "BT", "hard", "asia", "unique"],
  ["Brunei", "Bandar Seri Begawan", "BN", "hard", "asia", "unique"],
  ["Cyprus", "Nicosia", "CY", "hard", "europe", "unique"],
  ["Malta", "Valletta", "MT", "hard", "europe", "unique"],
  ["Albania", "Tirana", "AL", "hard", "europe", "unique"],
  ["North Macedonia", "Skopje", "MK", "hard", "europe", "unique"],
  ["Montenegro", "Podgorica", "ME", "hard", "europe", "unique"],
  ["Bosnia and Herzegovina", "Sarajevo", "BA", "hard", "europe", "unique"],
  ["Belarus", "Minsk", "BY", "hard", "europe", "unique"],
  ["Sri Lanka", "Sri Jayawardenepura Kotte", "LK", "hard", "asia", "unique"],
  ["Palau", "Ngerulmud", "PW", "hard", "oceania", "disc"],
  ["Tuvalu", "Funafuti", "TV", "hard", "oceania", "union"],
  ["Solomon Islands", "Honiara", "SB", "hard", "oceania", "unique"],
  ["Vanuatu", "Port Vila", "VU", "hard", "oceania", "unique"],
  ["North Korea", "Pyongyang", "KP", "hard", "asia", "red-star"],
  ["Kyrgyzstan", "Bishkek", "KG", "hard", "asia", "unique"],
  ["Tajikistan", "Dushanbe", "TJ", "hard", "asia", "unique"],
  ["Turkmenistan", "Ashgabat", "TM", "hard", "asia", "unique"],
  ["Haiti", "Port-au-Prince", "HT", "hard", "americas", "unique"],
  ["Trinidad and Tobago", "Port of Spain", "TT", "hard", "americas", "unique"],
  ["Bahamas", "Nassau", "BS", "hard", "americas", "unique"],
  ["Barbados", "Bridgetown", "BB", "hard", "americas", "unique"],
  ["Belize", "Belmopan", "BZ", "hard", "americas", "unique"],
  ["Guyana", "Georgetown", "GY", "hard", "americas", "unique"],
  ["Suriname", "Paramaribo", "SR", "hard", "americas", "unique"],
  ["Cabo Verde", "Praia", "CV", "hard", "africa", "unique"],
  ["Gambia", "Banjul", "GM", "hard", "africa", "unique"],
  ["Guinea-Bissau", "Bissau", "GW", "hard", "africa", "pan-african"],
  ["Malawi", "Lilongwe", "MW", "hard", "africa", "unique"],
  ["Mauritius", "Port Louis", "MU", "hard", "africa", "unique"],
  ["Somalia", "Mogadishu", "SO", "hard", "africa", "crescent"],
  ["Timor-Leste", "Dili", "TL", "hard", "asia", "unique"],
  ["Tonga", "Nuku'alofa", "TO", "hard", "oceania", "unique"],
];

const COUNTRIES = COUNTRY_SEED.map(([name, capital, iso, tier, region, flagGroup]) => ({
  name,
  capital,
  iso,
  tier,
  region,
  flagGroup,
  flag: flagEmoji(iso),
}));

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Higher means a more confusing distractor. */
function similarity(a, b) {
  let score = 0;
  if (a.region === b.region) score += 2;
  if (a.flagGroup !== "unique" && a.flagGroup === b.flagGroup) score += 4;
  return score;
}

function difficultyPool(level) {
  if (level === "easy") return COUNTRIES.filter((c) => c.tier === "easy");
  if (level === "medium") return COUNTRIES.filter((c) => c.tier === "easy" || c.tier === "medium");
  if (level === "hard") return COUNTRIES.filter((c) => c.tier === "hard");
  return COUNTRIES.slice();
}

/**
 * Pick wrong answers.
 * Easy: different region and a different kind of flag, preferring familiar countries.
 * Medium: same part of the world, but not a look-alike flag.
 * Hard: look-alike flags first, then countries from the same region.
 */
function pickDistractors(correct, difficulty, count) {
  const ranked = COUNTRIES.filter((c) => c.name !== correct.name).map((c) => ({
    c,
    s: similarity(correct, c),
  }));

  const buckets =
    difficulty === "easy"
      ? [
          (x) => x.s === 0 && x.c.tier !== "hard",
          (x) => x.s === 0,
          (x) => x.c.region !== correct.region,
        ]
      : difficulty === "medium"
        ? [(x) => x.s === 2, () => true]
        : [(x) => x.s >= 4, (x) => x.s >= 2, () => true];

  const chosen = [];
  const used = new Set();
  buckets.forEach((pred) => {
    if (chosen.length >= count) return;
    shuffle(ranked.filter((x) => pred(x) && !used.has(x.c.name))).forEach((x) => {
      if (chosen.length >= count) return;
      chosen.push(x.c);
      used.add(x.c.name);
    });
  });
  return chosen;
}
