import { AUTO_ICONS, buttons, credit, features, hero, quickstart, REPO_URL, SITE_URL, stack, stats, wave } from "./blocks";
import { esc } from "./kit";
import { palette } from "./palette";
import type { BlockId, Config, Data, Icons, Lang } from "./types";

export * from "./types";
export { palette } from "./palette";
export { LANG_ICONS, REPO_URL, SITE_URL } from "./blocks";

export const BLOCKS: BlockId[] = ["hero", "features", "quickstart", "stack", "stats", "buttons", "wave"];

// Defaults
export function defaults(repoSlug: string, lang: Lang): Config {
  const ru = lang === "ru";
  const [owner = "northerncatboy", repo = "expressive-repo"] = repoSlug.includes("/") ? repoSlug.split("/") : ["northerncatboy", repoSlug || "expressive-repo"];

  return {
    version: 1,
    repoUrl: `${owner}/${repo}`,
    owner,
    repo,
    seed: "#6750A4",
    seedFromAvatar: true,
    scheme: "tonalSpot",
    motion: true,
    iconFill: true,
    order: [...BLOCKS],
    hidden: [],
    hero: {
      tag: "",
      title: repo,
      subtitle: ru ? "Генератор красивых README для репозиториев в стиле Material 3 Expressive." : "Repository README generator in Material 3 Expressive style.",
      license: "MIT",
      release: "v1.0.0",
      typing: true,
      logoShape: "cookie12",
      chips: [
        { icon: "star", label: "★ 340" },
        { icon: "fork_right", label: "⑂ 48" },
        { icon: "sell", label: "v1.0.0" },
        { icon: "license", label: "MIT" },
        { icon: "brand:typescript", label: "TypeScript" },
      ],
    },
    features: {
      title: ru ? "Ключевые возможности" : "Key Features",
      items: [
        {
          icon: "palette",
          title: ru ? "Material 3 Дизайн" : "Material 3 Design",
          desc: ru ? "Гармоничная тональная палитра, адаптивные контейнеры и выразительные формы." : "Harmonious tonal color palettes, adaptive containers, and expressive shapes.",
          shape: "cookie",
        },
        {
          icon: "bolt",
          title: ru ? "Мгновенное превью" : "Instant Live Preview",
          desc: ru ? "Интерактивный редактор блоков с drag-and-drop и светлой/тёмной темой." : "Interactive block editor with drag-and-drop and real-time light/dark themes.",
          shape: "flower",
        },
        {
          icon: "widgets",
          title: ru ? "Адаптивные SVG-карточки" : "Adaptive SVG Cards",
          desc: ru ? "Чёткое отображение на любых экранах и нативная поддержка тем GitHub." : "Crisp rendering across any display with native GitHub theme switching.",
          shape: "sunny",
        },
        {
          icon: "terminal",
          title: ru ? "Автоматический парсер" : "Automatic Parser",
          desc: ru ? "Извлекает возможности, стек и команды установки прямо из README репозитория." : "Extracts features, tech stack, and install commands directly from the repo README.",
          shape: "clover",
        },
      ],
    },
    quickstart: {
      title: ru ? "Быстрый старт" : "Quick Start",
      terminalTitle: "bash",
      steps: [
        { label: ru ? "Клонирование репозитория" : "Clone repository", code: `git clone https://github.com/${owner}/${repo}.git` },
        { label: ru ? "Установка зависимостей" : "Install dependencies", code: "npm install" },
        { label: ru ? "Запуск сервера разработки" : "Start development server", code: "npm run dev" },
      ],
    },
    stack: {
      title: ru ? "Стек технологий" : "Tech Stack",
      groups: [
        {
          title: ru ? "Языки" : "Languages",
          items: [
            { icon: "brand:typescript", label: "TypeScript" },
            { icon: "brand:html5", label: "HTML" },
            { icon: "brand:css", label: "CSS" },
            { icon: "brand:javascript", label: "JavaScript" },
          ],
        },
        {
          title: ru ? "Фреймворки и экосистема" : "Frameworks & Ecosystem",
          items: [
            { icon: "brand:react", label: "React" },
            { icon: "brand:vite", label: "Vite" },
            { icon: "palette", label: "Material You" },
            { icon: "brand:git", label: "Git" },
            { icon: "brand:githubactions", label: "GitHub Actions" },
          ],
        },
      ],
    },
    stats: {
      title: ru ? "Показатели репозитория" : "Repository Metrics",
      stars: ru ? "Звёзд" : "Stars",
      forks: ru ? "Форков" : "Forks",
      issues: ru ? "Задач" : "Issues",
      watchers: ru ? "Подписчиков" : "Watchers",
      languages: ru ? "Языки репозитория" : "Language Distribution",
      showLanguages: true,
    },
    buttons: {
      items: [
        { icon: "language", label: ru ? "Демо" : "Live Demo", url: "https://example.com", style: "filled" },
        { icon: "book_2", label: ru ? "Документация" : "Documentation", url: "", style: "tonal" },
        { icon: "star", label: ru ? "Поставить звезду" : "Star on GitHub", url: `https://github.com/${owner}/${repo}`, style: "tonal" },
      ],
      card: false,
    },
  };
}

// Icons
export function usedIcons(c: Config, d: Data) {
  const set = new Set<string>(AUTO_ICONS);
  for (const chip of (c.hero?.chips || [])) set.add(chip.icon);
  for (const f of (c.features?.items || [])) set.add(f.icon);
  for (const g of (c.stack?.groups || [])) for (const it of (g.items || [])) set.add(it.icon);
  for (const b of (c.buttons?.items || [])) set.add(b.icon);
  return [...set].filter(Boolean);
}

export function pickIcons(all: Icons, names: string[]): Icons {
  const symbol: Record<string, string> = {};
  const brand: Record<string, { t: string; d: string; c?: string }> = {};
  for (const name of names) {
    if (name.startsWith("brand:")) {
      const k = name.slice(6);
      if (all.brand[k]) brand[k] = all.brand[k];
    } else {
      if (all.symbol[name]) symbol[name] = all.symbol[name];
      if (all.symbol[name + "#fill"]) symbol[name + "#fill"] = all.symbol[name + "#fill"];
    }
  }
  return { symbol, brand };
}

// Render
export function render(c: Config, d: Data, i: Icons, ava: string | null, themes: ("light" | "dark")[] = ["light", "dark"]) {
  const out: Record<string, string> = {};
  for (const theme of themes) {
    const dark = theme === "dark";
    const p = palette(c.seed, c.scheme, dark);
    const ctx = { c, d, p, i };
    const suf = `-${theme}.svg`;

    out[`assets/hero${suf}`] = hero(ctx, ava);
    out[`assets/features${suf}`] = features(ctx);
    out[`assets/quickstart${suf}`] = quickstart(ctx);
    out[`assets/stack${suf}`] = stack(ctx);
    out[`assets/stats${suf}`] = stats(ctx);
    out[`assets/wave${suf}`] = wave(ctx);
    out[`assets/credit${suf}`] = credit(ctx);

    const b = buttons(ctx);
    for (const [k, v] of Object.entries(b)) out[`assets/${k}${suf}`] = v;
  }
  return out;
}

// Readme
export function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buttonUrl(c: Config, url: string) {
  if (url) return url;
  return `https://github.com/${c.owner}/${c.repo}`;
}

function linkRow(files: Record<string, string>, prefix: string, links: { url: string; alt: string }[], loose: string, sep: string) {
  if (files[`assets/${prefix}-l-light.svg`]) {
    const row = [pic(`${prefix}-l`, "", loose)];
    links.forEach((l, n) => row.push(`<a href="${esc(l.url)}">${pic(`${prefix}-${n + 1}`, l.alt, loose)}</a>`));
    row.push(pic(`${prefix}-r`, "", loose));
    return row.join("");
  }
  return links.map((l, n) => `<a href="${esc(l.url)}">${pic(`${prefix}-${n + 1}`, l.alt, loose)}</a>`).join(sep);
}

function pic(name: string, alt: string, width = "100%") {
  return (
    `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark.svg">` +
    `<img src="assets/${name}-light.svg" width="${width}" alt="${esc(alt)}"></picture>`
  );
}

export function readme(c: Config, d: Data, files: Record<string, string>) {
  const parts: string[] = [];
  for (const id of c.order) {
    if (c.hidden.includes(id)) continue;
    if (id === "hero") parts.push(pic("hero", c.hero.title || c.repo));
    if (id === "features") parts.push(pic("features", c.features.title));
    if (id === "quickstart") parts.push(pic("quickstart", c.quickstart.title));
    if (id === "stack") parts.push(pic("stack", c.stack.title));
    if (id === "stats") parts.push(pic("stats", c.stats.title));
    if (id === "wave") parts.push(pic("wave", ""));
    if (id === "buttons" && c.buttons.items.length) {
      const links = c.buttons.items.map((b) => ({ url: buttonUrl(c, b.url), alt: b.label }));
      parts.push(linkRow(files, "button", links, "auto", "&nbsp;&nbsp;"));
    }
  }
  parts.push(`<a href="${SITE_URL}?repo=${encodeURIComponent(c.owner + "/" + c.repo)}">${pic("credit", "Made with Expressive Repo", "auto")}</a>`);
  return '<div align="center">\n\n' + parts.join("\n\n") + "\n\n</div>\n";
}
