// Import crawled matchup data from JSON and champion definitions
import rawData from "./matchup-data.json";
import { adcs, supports, botLaners } from "./champions";

export interface MatchupValue {
  delta: number;
  games: number;
}

export interface MatchupData {
  counters: Record<string, MatchupValue>;
  synergy: Record<string, MatchupValue>;
  enemyBottom: Record<string, MatchupValue>;
}

export interface SupportMatchupData {
  vsSupport: Record<string, MatchupValue>;
  vsBottom: Record<string, MatchupValue>;
  synergyBottom: Record<string, MatchupValue>;
}

// Weight a delta by sample size so low-game matchups contribute less
const GAME_CONFIDENCE_DECAY = 1000;
export function weightedDelta(value: MatchupValue | undefined): number {
  if (!value) return 0;
  const games = Math.max(0, value.games || 0);
  const confidence = 1 - Math.exp(-games / GAME_CONFIDENCE_DECAY);
  return value.delta * confidence;
}

const CONFIDENCE_Z_95 = 1.96;
export function confidenceMargin(value: MatchupValue | undefined): number | null {
  if (!value) return null;
  const games = Math.max(0, value.games || 0);
  if (!games) return null;
  const winrate = Math.min(1, Math.max(0, 0.5 + value.delta / 100));
  const standardError = Math.sqrt((winrate * (1 - winrate)) / games);
  return CONFIDENCE_Z_95 * standardError * 100;
}

// Build normalization map dynamically from champion data
function buildNormalizationMap(): Record<string, string> {
  const map: Record<string, string> = {};

  // Add all ADCs
  for (const adc of adcs) {
    const key = adc.id.toLowerCase().replace(/['\s-]/g, "");
    map[key] = adc.name;
    // Also add name-based key for reverse lookup
    const nameKey = adc.name.toLowerCase().replace(/['\s-]/g, "");
    map[nameKey] = adc.name;
  }

  // Add all supports
  for (const support of supports) {
    const key = support.id.toLowerCase().replace(/['\s-]/g, "");
    map[key] = support.name;
    const nameKey = support.name.toLowerCase().replace(/['\s-]/g, "");
    map[nameKey] = support.name;
  }

  // Add all bot laners (includes mage bots like Syndra)
  for (const botLaner of botLaners) {
    const key = botLaner.id.toLowerCase().replace(/['\s-]/g, "");
    map[key] = botLaner.name;
    const nameKey = botLaner.name.toLowerCase().replace(/['\s-]/g, "");
    map[nameKey] = botLaner.name;
  }

  // Add any additional aliases that might appear in the JSON
  const additionalAliases: Record<string, string> = {
    "renata": "Renata Glasc",
    "renataglasc": "Renata Glasc",
    "tahmkench": "Tahm Kench",
    "missfortune": "Miss Fortune",
    "kogmaw": "Kog'Maw",
    "velkoz": "Vel'Koz",
    "kaisa": "Kai'Sa",
  };

  for (const [alias, name] of Object.entries(additionalAliases)) {
    map[alias] = name;
  }

  return map;
}

const CHAMPION_NAMES = buildNormalizationMap();

function normalizeName(name: string): string {
  if (!name) return "";
  const key = name.toLowerCase().replace(/['\s-]/g, "");
  return CHAMPION_NAMES[key] || name;
}

const BOT_LANER_NAMES = new Set(botLaners.map((botLaner) => normalizeName(botLaner.name)));

// Transform the raw JSON data into the expected format
function transformData(): Record<string, MatchupData> {
  const result: Record<string, MatchupData> = {};

  for (const [adcKey, adcData] of Object.entries(rawData.bottom as Record<string, any>)) {
    const adcName = normalizeName(adcKey);

    const matchup: MatchupData = {
      counters: {},
      synergy: {},
      enemyBottom: {},
    };

    // Transform counters.support (vs enemy support)
    if (adcData.counters?.support) {
      for (const entry of adcData.counters.support) {
        const name = normalizeName(entry.opponent || entry.ally || "");
        if (name && entry.delta !== undefined) {
          matchup.counters[name] = { delta: entry.delta, games: entry.games ?? 0 };
          if (BOT_LANER_NAMES.has(name) && !matchup.enemyBottom[name]) {
            matchup.enemyBottom[name] = { delta: entry.delta, games: entry.games ?? 0 };
          }
        }
      }
    }

    // Transform counters.bottom (vs enemy bottom)
    if (adcData.counters?.bottom) {
      for (const entry of adcData.counters.bottom) {
        const name = normalizeName(entry.opponent || entry.ally || "");
        if (name && entry.delta !== undefined) {
          matchup.enemyBottom[name] = { delta: entry.delta, games: entry.games ?? 0 };
        }
      }
    }

    // Transform synergy.support (with ally support)
    if (adcData.synergy?.support) {
      for (const entry of adcData.synergy.support) {
        const name = normalizeName(entry.ally || entry.opponent || "");
        if (name && entry.delta !== undefined) {
          matchup.synergy[name] = { delta: entry.delta, games: entry.games ?? 0 };
        }
      }
    }

    result[adcName] = matchup;
  }

  return result;
}

export const MATCHUP_DATA: Record<string, MatchupData> = transformData();

// Transform support matchup data (support vs support)
function transformSupportData(): Record<string, SupportMatchupData> {
  const result: Record<string, SupportMatchupData> = {};

  for (const [supportKey, supportData] of Object.entries(rawData.support as Record<string, any>)) {
    const supportName = normalizeName(supportKey);

    const matchup: SupportMatchupData = {
      vsSupport: {},
      vsBottom: {},
      synergyBottom: {},
    };

    // Transform counters.support (vs enemy support)
    if (supportData.counters?.support) {
      for (const entry of supportData.counters.support) {
        const name = normalizeName(entry.opponent || "");
        if (name && entry.delta !== undefined) {
          matchup.vsSupport[name] = { delta: entry.delta, games: entry.games ?? 0 };
        }
      }
    }

    if (supportData.counters?.bottom) {
      for (const entry of supportData.counters.bottom) {
        const name = normalizeName(entry.opponent || "");
        if (name && entry.delta !== undefined) {
          matchup.vsBottom[name] = { delta: entry.delta, games: entry.games ?? 0 };
        }
      }
    }

    if (supportData.synergy?.bottom) {
      for (const entry of supportData.synergy.bottom) {
        const name = normalizeName(entry.ally || entry.opponent || "");
        if (name && entry.delta !== undefined) {
          matchup.synergyBottom[name] = { delta: entry.delta, games: entry.games ?? 0 };
        }
      }
    }

    result[supportName] = matchup;
  }

  return result;
}

export const SUPPORT_MATCHUP_DATA: Record<string, SupportMatchupData> = transformSupportData();
