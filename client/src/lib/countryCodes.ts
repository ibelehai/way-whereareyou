import countries from 'world-countries';

type CountryEntry = {
  cca2: string;
  cca3: string;
  ccn3?: string;
  name: {
    common: string;
    official: string;
    nativeName?: Record<string, { common: string; official: string }>;
  };
  altSpellings?: string[];
};

const byLowerName: Record<string, string> = {};
const byNumeric: Record<string, string> = {};
const byCode: Record<string, string> = {};
const options: { code: string; name: string }[] = [];

function addName(key: string, code: string) {
  const trimmed = key.trim().toLowerCase();
  if (!trimmed) return;
  if (!byLowerName[trimmed]) {
    byLowerName[trimmed] = code;
  }
}

(countries as CountryEntry[]).forEach((c) => {
  const code = c.cca2.toUpperCase();
  byCode[code] = c.name.common;
  options.push({ code, name: c.name.common });
  addName(c.name.common, code);
  addName(c.name.official, code);
  if (c.altSpellings) c.altSpellings.forEach((s) => addName(s, code));
  if (c.name.nativeName) {
    Object.values(c.name.nativeName).forEach((n) => {
      addName(n.common, code);
      addName(n.official, code);
    });
  }
  if (c.ccn3) {
    byNumeric[c.ccn3] = code;
    byNumeric[String(parseInt(c.ccn3, 10))] = code;
  }
});

export function nameToAlpha2(name?: string): string | null {
  if (!name) return null;
  const code = byLowerName[name.trim().toLowerCase()];
  return code || null;
}

export function numericToAlpha2(numeric?: string | number): string | null {
  if (numeric === undefined || numeric === null) return null;
  const key = String(numeric);
  return byNumeric[key] || null;
}

export function alpha2ToName(code?: string): string | null {
  if (!code) return null;
  return byCode[code.toUpperCase()] || null;
}

export const countryOptions = options;
