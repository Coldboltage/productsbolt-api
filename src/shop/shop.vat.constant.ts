// Does this country normally show VAT/GST included in consumer prices?

export const VAT_INCLUDED_BY_DEFAULT: Record<string, boolean> = {
  // 🇪🇺 EU (always true)
  AT: true,
  BE: true,
  BG: true,
  HR: true,
  CY: true,
  CZ: true,
  DK: true,
  EE: true,
  FI: true,
  FR: true,
  DE: true,
  GR: true,
  HU: true,
  IE: true,
  IT: true,
  LV: true,
  LT: true,
  LU: true,
  MT: true,
  NL: true,
  PL: true,
  PT: true,
  RO: true,
  SK: true,
  SI: true,
  ES: true,
  SE: true,

  // 🇬🇧 UK
  GB: true,

  // 🇪🇺 Non-EU Europe
  NO: true,
  IS: true,
  CH: true,
  TR: true,

  // 🌎 Other major markets
  JP: true,
  AU: true,
  NZ: true,
  SG: true,

  // 🇺🇸 / 🇨🇦 / 🇭🇰
  US: false,
  CA: false,
  HK: false,
};
