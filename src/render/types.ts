export type BlockId = "hero" | "features" | "quickstart" | "stack" | "stats" | "buttons" | "wave";
export type ShapeName = "cookie" | "cookie12" | "clover" | "sunny" | "flower" | "pill" | "soft" | "gem";
export type SchemeName = "tonalSpot" | "vibrant" | "expressive" | "fidelity" | "monochrome";
export type Lang = "en" | "ru";

export interface Item {
  icon: string;
  label: string;
}

export interface LinkButton extends Item {
  url: string;
  style: "filled" | "tonal";
}

export interface FeatureItem {
  icon: string;
  title: string;
  desc: string;
  shape?: ShapeName;
}

export interface QuickstartStep {
  label: string;
  code: string;
}

export interface Config {
  version: 1;
  repoUrl: string;
  owner: string;
  repo: string;
  seed: string;
  seedFromAvatar?: boolean;
  scheme: SchemeName;
  motion: boolean;
  iconFill?: boolean;
  order: BlockId[];
  hidden: BlockId[];
  hero: {
    tag: string;
    title: string;
    subtitle: string;
    license?: string;
    release?: string;
    typing: boolean;
    logoShape: ShapeName;
    chips: Item[];
    author?: string;
  };
  features: {
    title: string;
    items: FeatureItem[];
  };
  quickstart: {
    title: string;
    terminalTitle: string;
    steps: QuickstartStep[];
  };
  stack: {
    title: string;
    groups: { title: string; items: Item[] }[];
  };
  stats: {
    title: string;
    stars: string;
    forks: string;
    issues: string;
    watchers: string;
    languages: string;
    showLanguages: boolean;
  };
  buttons: {
    items: LinkButton[];
    card?: boolean;
  };
}

export interface RepoData {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  issues: number;
  watchers: number;
  license: string | null;
  release?: string | null;
  language: string | null;
  topics: string[];
  homepage: string | null;
  defaultBranch: string;
  languages: [string, number][];
  readmeRaw?: string;
  manifestDeps?: string[];
}

export type Data = RepoData;

export interface Palette {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  surface: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  scrim: string;
  shadow: string;
  [key: string]: string;
}

export interface Icons {
  symbol: Record<string, string>;
  brand: Record<string, { t: string; d: string; c?: string }>;
}
