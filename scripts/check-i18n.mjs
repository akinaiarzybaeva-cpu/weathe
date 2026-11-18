// Verifies every translation key exists in all languages with the same shape.
import { translations } from '../src/i18n/translations.js';

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) return [[key, `array:${v.length}`]];
    if (v && typeof v === 'object') return flatten(v, key);
    return [[key, typeof v]];
  });

const langs = Object.keys(translations);
const maps = Object.fromEntries(langs.map((l) => [l, new Map(flatten(translations[l]))]));
const all = new Set(langs.flatMap((l) => [...maps[l].keys()]));
let problems = 0;
for (const key of all) {
  for (const l of langs) {
    const shape = maps[l].get(key);
    if (shape === undefined) {
      console.log(`missing  [${l}] ${key}`);
      problems++;
    } else if (shape !== maps.en.get(key)) {
      console.log(`mismatch [${l}] ${key}: ${shape} vs en ${maps.en.get(key)}`);
      problems++;
    }
  }
}
console.log(problems ? `${problems} problem(s)` : `OK – ${all.size} keys × ${langs.length} languages`);
process.exit(problems ? 1 : 0);
