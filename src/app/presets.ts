import type { BlockId, Config } from "../render";
import { BLOCKS } from "../render";

export const PRESETS: Record<"full" | "minimal" | "showcase" | "technical", BlockId[]> = {
  full: ["hero", "features", "quickstart", "stack", "stats", "buttons", "wave"],
  minimal: ["hero", "features", "quickstart", "buttons"],
  showcase: ["hero", "features", "buttons", "stack", "stats"],
  technical: ["hero", "quickstart", "stack", "stats", "buttons"],
};

export type PresetId = keyof typeof PRESETS;

export function applyPreset(c: Config, id: PresetId): Config {
  const shown = PRESETS[id];
  return { ...c, order: [...shown, ...BLOCKS.filter((b) => !shown.includes(b))], hidden: BLOCKS.filter((b) => !shown.includes(b)) };
}

export function activePreset(c: Config): PresetId | null {
  const shown = c.order.filter((b) => !c.hidden.includes(b)).join();
  return (Object.keys(PRESETS) as PresetId[]).find((k) => PRESETS[k].join() === shown) ?? null;
}
