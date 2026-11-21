import { chip, esc, fit, icon, mix, pop, shape, svg, textWidth, txt, wrap } from "./kit";
import type { Config, Data, FeatureItem, Icons, LinkButton, Palette, QuickstartStep, ShapeName } from "./types";

export const W = 840;
export const CARD_SHAPES: ShapeName[] = ["cookie", "clover", "sunny", "flower"];
export const REPO_URL = "https://github.com/northerncatboy/expressive-repo";
export const SITE_URL = "https://northerncatboy.github.io/expressive-repo/";

const ICON_RULES: [string[], string][] = [
  [["zip", "archive", "7-zip", "rar"], "folder_zip"],
  [["music", "audio", "spotify", "player", "sound"], "music_note"],
  [["dictat", "speech", "voice", "whisper", "mic"], "mic"],
  [["tracker", "screen time", "activity", "monitor", "stats", "metric"], "monitoring"],
  [["discord"], "brand:discord"],
  [["telegram"], "brand:telegram"],
  [["game", "minecraft", "mod "], "sports_esports"],
  [["site", "website", "web ", "landing", "docs", "doc"], "language"],
  [["launcher", "installer", "package"], "deployed_code"],
  [["theme", "design", "ui kit", "palette", "material", "md3"], "palette"],
  [["terminal", "cli", "shell", "bash"], "terminal"],
  [["speed", "fast", "perform", "lightweight"], "bolt"],
  [["secure", "auth", "verified", "safe"], "verified"],
  [["tool", "widget", "component", "ui"], "widgets"],
  [["cloud", "server", "deploy"], "cloud"],
  [["data", "db", "store", "cache"], "database"],
  [["star", "popular"], "star"],
];

export const LANG_ICONS: Record<string, string> = {
  Rust: "brand:rust",
  Python: "brand:python",
  TypeScript: "brand:typescript",
  JavaScript: "brand:javascript",
  "C#": "brand:dotnet",
  Java: "brand:openjdk",
  Go: "brand:go",
  Kotlin: "brand:kotlin",
  Swift: "brand:swift",
  "C++": "brand:cplusplus",
  C: "brand:cplusplus",
  Dart: "brand:dart",
  PHP: "brand:php",
  HTML: "brand:html5",
  CSS: "brand:css",
  SCSS: "brand:css",
  Vue: "brand:vuedotjs",
  Svelte: "brand:svelte",
  Shell: "terminal",
  Bash: "terminal",
  Dockerfile: "brand:docker",
};

export const AUTO_ICONS = [...new Set([...ICON_RULES.map(([, n]) => n), ...Object.values(LANG_ICONS), "code"])];

interface Ctx {
  c: Config;
  d: Data;
  p: Palette;
  i: Icons;
}

export function pickFeatureIcon(text: string) {
  const hay = text.toLowerCase();
  for (const [keys, name] of ICON_RULES) {
    if (keys.some((k) => hay.includes(k))) return name;
  }
  return "widgets";
}

function sectionTitle(x: number, y: number, label: string, ic: string, { p, i }: Ctx, delay = 0) {
  const tile = `<path class="pop" style="animation-delay:${delay.toFixed(2)}s" d="${shape("cookie", x + 20, y + 20, 20)}" fill="${p.primaryContainer}"/>`;
  const glyph = pop(icon(i, ic, x + 9, y + 9, 22, p.onPrimaryContainer), delay + 0.05);
  return tile + glyph + txt(x + 54, y + 28, fit(label, 24, W - x - 82, 600), 24, p.onSurface, { weight: 600, cls: "up", delay });
}

// Hero
export function hero(ctx: Ctx, avatar: string | null) {
  const { c, d, p, i } = ctx;
  const h = 310;
  const b = [`<clipPath id="card"><rect width="${W}" height="${h}" rx="32"/></clipPath>`];
  b.push(`<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainer}"/>`);
  b.push('<g clip-path="url(#card)">');
  b.push(`<path class="spin" d="${shape("flower", 780, 30, 150)}" fill="${p.primaryContainer}"/>`);
  b.push(`<path class="bob" d="${shape("clover", 690, 300, 62)}" fill="${p.tertiaryContainer}"/>`);
  b.push(`<path class="spin-r" d="${shape("sunny", 812, 240, 34)}" fill="${p.secondaryContainer}"/>`);
  b.push("</g>");

  const cx = 150;
  const cy = 155;
  const frame = c.hero.logoShape || "cookie12";
  b.push(`<path class="spin" d="${shape("sunny", cx, cy, 112)}" fill="${p.primary}" opacity=".9"/>`);
  b.push(`<clipPath id="logo-ava"><path d="${shape(frame, cx, cy, 98)}"/></clipPath>`);
  b.push(`<path d="${shape(frame, cx, cy, 102)}" fill="${p.surfaceContainer}"/>`);

  if (avatar) {
    b.push(`<g class="fade"><image href="${avatar}" x="${cx - 100}" y="${cy - 100}" width="200" height="200" clip-path="url(#logo-ava)" preserveAspectRatio="xMidYMid slice"/></g>`);
  } else {
    b.push(`<path d="${shape(frame, cx, cy, 98)}" fill="${p.primaryContainer}"/>`);
    b.push(icon(i, "folder_open", cx - 44, cy - 44, 88, p.onPrimaryContainer));
  }

  const x = 294;
  const name = c.hero.title || c.repo || d.name || "Repository";
  const rawTag = (c.hero.tag || "").trim();
  const isRu = /[а-яё]/i.test(rawTag) || /[а-яё]/i.test(c.hero.subtitle || "") || /опенсурс/i.test(rawTag);

  const author = c.hero.author || c.owner || d.owner || "author";
  const defaultLabel = isRu ? `Создано @${author}` : `Created by @${author}`;
  const headerLabel = (!rawTag || /open\s*source|опенсурс/i.test(rawTag)) ? defaultLabel : rawTag;

  const room = W - x - 40;
  const size = Math.min(54, room / Math.max(1, textWidth(name, 1, 700)));

  // Author / eyebrow label: Создано @ник
  b.push(txt(x, 82, headerLabel, 14, p.primary, { weight: 700, cls: "up", delay: 0.08, extra: ' letter-spacing="0.5"' }));

  b.push(pop(txt(x - 2, 142, name, size, p.onSurface, { cls: "wght" }), 0.18, "up"));

  const subtitle = c.hero.subtitle || d.description || "Open source project";
  const lines = wrap(subtitle, 17, 480, 400, 2);
  let extra = "";
  if (c.hero.typing && c.motion && lines.join("")) {
    const [body, css] = typing(lines, x, p, 180);
    b.push(body);
    extra = css;
  } else {
    lines.forEach((line, n) => {
      b.push(txt(x, 180 + n * 24, line, 17, p.onSurfaceVariant, { cls: "up", delay: 0.3 + n * 0.08 }));
    });
  }

  let cx2 = x;
  (c.hero?.chips || []).forEach((item, n) => {
    const [g, w] = chip(i, p, cx2, 238, item.label, { icon: item.icon, delay: 0.5 + n * 0.08, style: "tonal" });
    if (cx2 + w > W - 24) return;
    b.push(g);
    cx2 += w + 8;
  });

  return svg(W, h, b.join(""), `${name} - ${headerLabel}`, c.motion, extra);
}

function typing(lines: string[], x: number, p: Palette, startY = 194): [string, string] {
  const t0 = 0.6;
  const step = 0.04;
  const chars = lines.map((l) => [...l]);
  const n = chars.reduce((a, l) => a + l.length, 0);
  const dur = t0 + n * step;
  const starts = chars.map((_, li) => chars.slice(0, li).reduce((a, l) => a + l.length, 0));
  const revealed = (li: number, k: number) => {
    const m = Math.max(0, Math.min(chars[li].length, k - starts[li]));
    return m ? textWidth(chars[li].slice(0, m).join(""), 17) + 2 : 0;
  };
  const ks = Array.from({ length: n + 1 }, (_, k) => k);
  const times = ["0", ...ks.map((k) => ((t0 + k * step) / dur).toFixed(4))].join(";");
  const smil = (attr: string, values: string[]) =>
    `<animate attributeName="${attr}" values="${values.join(";")}" keyTimes="${times}" calcMode="discrete" dur="${dur.toFixed(2)}s" fill="freeze"/>`;
  const out: string[] = [];
  lines.forEach((line, li) => {
    const y = startY + li * 24;
    const full = textWidth(line, 17) + 4;
    const widths = ["0", ...ks.map((k) => revealed(li, k).toFixed(1))];
    out.push(`<clipPath id="tc${li}"><rect x="${x - 2}" y="${y - 20}" width="${full}" height="26">${smil("width", widths)}</rect></clipPath>`);
    out.push(`<g clip-path="url(#tc${li})">${txt(x, y, line, 17, p.onSurfaceVariant)}</g>`);
  });
  const last = lines.length - 1;
  const pos = (k: number) => {
    let li = chars.findIndex((_, i) => k <= starts[i] + chars[i].length);
    if (li < 0) li = last;
    return [x + revealed(li, k), startY + li * 24];
  };
  const [fx, fy] = pos(n);
  const moves = [pos(0), ...ks.map(pos)].map(([cx, cy]) => `${(cx - fx).toFixed(1)} ${cy - fy}`);
  out.push(
    `<rect x="${fx.toFixed(1)}" y="${fy - 16}" width="2.5" height="20" rx="1.25" fill="${p.primary}">` +
      `<animateTransform attributeName="transform" type="translate" values="${moves.join(";")}" keyTimes="${times}" calcMode="discrete" dur="${dur.toFixed(2)}s" fill="freeze"/>` +
      `<animate attributeName="opacity" values="1;0" calcMode="discrete" dur="1s" begin="${dur.toFixed(2)}s" repeatCount="indefinite"/>` +
      `</rect>`,
  );
  return [out.join(""), ""];
}

// Features
export function features(ctx: Ctx) {
  const { c, p, i } = ctx;
  const items = c.features?.items || [];
  const cols = items.length <= 1 ? 1 : 2;
  const cardW = cols === 1 ? W - 56 : (W - 56 - 16) / 2;
  const cardH = 136;
  const rows = Math.max(1, Math.ceil(items.length / cols));
  const h = 96 + rows * (cardH + 14) + 12;

  const b = [`<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainerLow}"/>`];
  b.push(sectionTitle(28, 26, c.features.title, "auto_awesome_mosaic", ctx));

  items.forEach((item, n) => {
    const col = n % cols;
    const row = Math.floor(n / cols);
    const tx = 28 + col * (cardW + 16);
    const ty = 86 + row * (cardH + 14);
    const d0 = 0.12 + n * 0.08;
    const sh = item.shape || CARD_SHAPES[n % CARD_SHAPES.length];

    b.push(`<g class="up" style="animation-delay:${d0.toFixed(2)}s">`);
    b.push(`<rect x="${tx}" y="${ty}" width="${cardW}" height="${cardH}" rx="22" fill="${p.surfaceContainerHigh}"/>`);
    b.push(pop(`<path class="spin" d="${shape(sh, tx + 40, ty + 40, 24)}" fill="${p.primaryContainer}"/>`, d0));
    b.push(pop(icon(i, item.icon || "widgets", tx + 28, ty + 28, 24, p.onPrimaryContainer), d0 + 0.05));

    const title = fit(item.title, 18, cardW - 90, 650);
    b.push(txt(tx + 76, ty + 45, title, 18, p.onSurface, { weight: 650 }));

    const descLines = wrap(item.desc, 14, cardW - 44, 400, 3);
    descLines.forEach((line, li) => {
      b.push(txt(tx + 22, ty + 82 + li * 20, line, 14, p.onSurfaceVariant, { weight: 400 }));
    });
    b.push("</g>");
  });

  return svg(W, h, b.join(""), c.features.title, c.motion);
}

// Quickstart
export function quickstart(ctx: Ctx) {
  const { c, p, i } = ctx;
  const steps = c.quickstart?.steps || [];
  const tx = 28;
  const ty = 86;
  const tw = W - 56;
  const stepH = 46;
  const termBodyH = Math.max(1, steps.length) * stepH + 18;
  const termTotalH = 40 + termBodyH;
  const h = ty + termTotalH + 28;

  const b = [`<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainerLow}"/>`];
  b.push(sectionTitle(28, 26, c.quickstart.title, "terminal", ctx));

  // Terminal box
  b.push(`<g class="up" style="animation-delay:0.15s">`);
  // Top bar
  b.push(`<rect x="${tx}" y="${ty}" width="${tw}" height="40" rx="18" fill="${p.surfaceContainerHighest}"/>`);
  b.push(`<circle cx="${tx + 22}" cy="${ty + 20}" r="5.5" fill="${p.error}"/>`);
  b.push(`<circle cx="${tx + 38}" cy="${ty + 20}" r="5.5" fill="${p.tertiary}"/>`);
  b.push(`<circle cx="${tx + 54}" cy="${ty + 20}" r="5.5" fill="${p.primary}"/>`);
  b.push(txt(tx + tw / 2, ty + 25, c.quickstart.terminalTitle || "bash", 13, p.onSurfaceVariant, { weight: 600, anchor: "middle" }));

  // Main terminal screen
  b.push(`<rect x="${tx}" y="${ty + 34}" width="${tw}" height="${termBodyH + 6}" rx="18" fill="${p.surfaceContainerLowest}"/>`);

  steps.forEach((step, idx) => {
    const sy = ty + 40 + 16 + idx * stepH;
    b.push(`<g class="fade" style="animation-delay:${(0.25 + idx * 0.1).toFixed(2)}s">`);
    if (step.label) {
      b.push(txt(tx + 24, sy, `# ${step.label}`, 12, p.outline, { weight: 500 }));
    }
    b.push(txt(tx + 24, sy + 20, "$", 15, p.primary, { weight: 700 }));
    b.push(txt(tx + 42, sy + 20, step.code, 15, p.onSurface, { weight: 500 }));
    b.push("</g>");
  });
  b.push("</g>");

  return svg(W, h, b.join(""), c.quickstart.title, c.motion);
}

// Stack
export function stack(ctx: Ctx) {
  const { c, p, i } = ctx;
  let y = 86;
  let d = 0.1;
  const groups: string[] = [];

  for (const group of (c.stack?.groups || [])) {
    if (group.title) {
      groups.push(txt(28, y + 14, group.title.toUpperCase(), 12, p.onSurfaceVariant, { weight: 600, cls: "fade", delay: d, extra: ' letter-spacing="1.4"' }));
    }
    let x = 28;
    let cy = group.title ? y + 26 : y;
    for (const item of group.items) {
      const [, w] = chip(i, p, 0, 0, item.label, { icon: item.icon });
      if (x + w > W - 28) {
        x = 28;
        cy += 44;
      }
      groups.push(chip(i, p, x, cy, item.label, { icon: item.icon, delay: d })[0]);
      x += w + 8;
      d += 0.05;
    }
    y = cy + 36 + 22;
  }

  const h = y + 6;
  const b = [`<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainerLow}"/>`];
  b.push(sectionTitle(28, 26, c.stack.title, "code", ctx));
  b.push(...groups);
  return svg(W, h, b.join(""), c.stack.title, c.motion);
}

// Stats
export function stats(ctx: Ctx) {
  const { c, d, p, i } = ctx;
  const s = c.stats || {};
  const langs = s.showLanguages ? (d.languages || []) : [];
  const total = langs.reduce((a, [, v]) => a + v, 0) || 1;
  const legend: [number, number, string][] = [];
  let x = 28;
  let row = 0;

  for (const [name, v] of langs) {
    const label = `${name} ${((100 * v) / total).toFixed(1)}%`.replace(".0%", "%");
    const lw = 15 + textWidth(label, 14, 500) + 18;
    if (x + lw > W - 28) {
      x = 28;
      row++;
    }
    legend.push([x, row, label]);
    x += lw;
  }

  const hasLangs = s.showLanguages && langs.length > 0;
  const h = hasLangs ? 320 + row * 26 : 220;
  const b = [`<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainerLow}"/>`];
  b.push(sectionTitle(28, 26, s.title || "Metrics", "monitoring", ctx));

  const tiles: [string, number | string, string, ShapeName][] = [
    ["star", d.stars ?? 0, s.stars || "Stars", "cookie"],
    ["fork_right", d.forks ?? 0, s.forks || "Forks", "clover"],
    ["info", d.issues ?? 0, s.issues || "Issues", "sunny"],
    ["visibility", d.watchers ?? 0, s.watchers || "Watchers", "flower"],
  ];

  const tw = (W - 56 - 36) / 4;
  tiles.forEach(([ic, value, label, sh], n) => {
    const tx = 28 + n * (tw + 12);
    const ty = 86;
    b.push(`<g class="up" style="animation-delay:${(0.1 + n * 0.08).toFixed(2)}s">`);
    b.push(`<rect x="${tx}" y="${ty}" width="${tw}" height="96" rx="22" fill="${p.surfaceContainerHigh}"/>`);
    b.push(`<path d="${shape(sh, tx + 32, ty + 32, 17)}" fill="${p.primaryContainer}"/>`);
    b.push(icon(i, ic, tx + 22, ty + 22, 20, p.onPrimaryContainer));
    b.push(txt(tx + 58, ty + 44, String(value), 26, p.onSurface, { weight: 700 }));
    b.push(txt(tx + 18, ty + 76, fit(label, 13, tw - 32, 500), 13, p.onSurfaceVariant, { weight: 500 }));
    b.push("</g>");
  });

  if (hasLangs) {
    const ly = 210;
    b.push(txt(28, ly, s.languages, 14, p.onSurfaceVariant, { weight: 600, cls: "fade", delay: 0.3 }));
    const surf = p.surfaceContainerLow;
    const colors = [p.primary, p.tertiary, p.secondary, mix(p.primary, surf, 0.45), mix(p.tertiary, surf, 0.45), mix(p.secondary, surf, 0.45), p.outline, p.outlineVariant];
    const bw = W - 56;
    const gaps = 4 * (langs.length - 1);
    const widths = langs.map(([, v]) => Math.max(8, ((bw - gaps) * v) / total));
    const k = (bw - gaps) / (widths.reduce((a, v) => a + v, 0) || 1);
    let sx = 28;
    const segs = widths.map((sw, n) => {
      const r = `<rect x="${sx.toFixed(1)}" y="${ly + 12}" width="${(sw * k).toFixed(1)}" height="14" rx="7" fill="${colors[n % colors.length]}"/>`;
      sx += sw * k + 4;
      return r;
    });
    b.push(`<g class="grow" style="animation-delay:.4s">${segs.join("")}</g>`);
    legend.forEach(([lx, lrow, label], n) => {
      const ly2 = ly + 50 + lrow * 26;
      b.push(pop(`<circle cx="${lx + 5}" cy="${ly2 - 5}" r="5" fill="${colors[n % colors.length]}"/>` + txt(lx + 15, ly2, label, 14, p.onSurfaceVariant, { weight: 500 }), 0.6 + n * 0.06, "fade"));
    });
  }

  return svg(W, h, b.join(""), s.title, c.motion);
}

// Buttons
interface Piece {
  body: string;
  w: number;
  h: number;
  title: string;
}

function buttonPiece({ p, i }: Ctx, btn: LinkButton, n: number): Piece {
  const h = 56;
  const size = 17;
  const iw = btn.icon ? 32 : 0;
  const w = 56 + iw + textWidth(btn.label, size, 600);
  const [bg, fg] = btn.style === "filled" ? [p.primary, p.onPrimary] : [p.secondaryContainer, p.onSecondaryContainer];
  let body = `<rect width="${w.toFixed(1)}" height="${h}" rx="28" fill="${bg}"/>`;
  if (btn.icon) body += icon(i, btn.icon, 28, (h - 22) / 2, 22, fg);
  body += txt(28 + iw, h / 2 + 6, btn.label, size, fg, { weight: 600 });
  return { body: pop(body, n * 0.08), w, h, title: btn.label };
}

const PAD = 20;
const GAP = 8;
const CAP = 28;

export function rowFits(pieces: { w: number }[]) {
  return pieces.length > 0 && pieces.reduce((a, x) => a + x.w + GAP, 0) + CAP * 2 <= W;
}

function row(ctx: Ctx, prefix: string, pieces: Piece[], card: boolean) {
  const { c, p } = ctx;
  const files: Record<string, string> = {};
  if (!card || !rowFits(pieces)) {
    pieces.forEach((x, n) => (files[`${prefix}-${n + 1}`] = svg(x.w, x.h, x.body, x.title, c.motion)));
    return files;
  }
  const h = Math.max(...pieces.map((x) => x.h)) + PAD * 2;
  const cap = (W - pieces.reduce((a, x) => a + x.w + GAP, 0)) / 2;
  const bg = p.surfaceContainerLow;
  files[`${prefix}-l`] = svg(cap, h, `<rect width="${(cap + 40).toFixed(1)}" height="${h}" rx="32" fill="${bg}"/>`, "", c.motion);
  files[`${prefix}-r`] = svg(cap, h, `<rect x="-40" width="${(cap + 40).toFixed(1)}" height="${h}" rx="32" fill="${bg}"/>`, "", c.motion);
  pieces.forEach((x, n) => {
    const w = x.w + GAP;
    files[`${prefix}-${n + 1}`] = svg(w, h, `<rect width="${w + 1}" height="${h}" fill="${bg}"/><g transform="translate(${GAP / 2} ${(h - x.h) / 2})">${x.body}</g>`, x.title, c.motion);
  });
  return files;
}

export function buttons(ctx: Ctx) {
  const c = ctx.c;
  return row(ctx, "button", (c.buttons?.items || []).map((b, n) => buttonPiece(ctx, b, n)), !!c.buttons?.card);
}

export function wave({ c, p }: Ctx) {
  const h = 28;
  const amp = 5;
  const length = 48;
  const pts: string[] = [];
  for (let x = 0; x <= W + length * 2; x += 4) pts.push(`${x} ${(h / 2 + amp * Math.sin((2 * Math.PI * x) / length)).toFixed(1)}`);
  const body =
    `<clipPath id="w"><rect x="0" y="0" width="${W}" height="${h}"/></clipPath><g clip-path="url(#w)">` +
    `<path class="wave" d="M${pts.join(" L")}" fill="none" stroke="${p.primary}" stroke-width="5" stroke-linecap="round"/></g>`;
  return svg(W, h, body, "divider", c.motion);
}

export function credit({ p }: Ctx) {
  const label = "Made with Expressive Repo";
  const size = 12;
  const w = textWidth(label, size, 500) + 4;
  return svg(w, 18, txt(2, 13, label, size, p.onSurfaceVariant, { weight: 500, extra: ' opacity=".7"' }), label, false);
}
