import { zipSync, strToU8, strFromU8 } from "fflate";
import core from "../render/core-icons.json";
import { pickIcons, readme, render, usedIcons, type Config, type Data, type FeatureItem, type Icons, type Lang, type QuickstartStep, type ShapeName } from "../render";
import { LANG_ICONS, pickFeatureIcon } from "../render/blocks";

// Icons store
export const store: Icons = structuredClone(core) as Icons;
let full: Promise<void> | null = null;

export function loadAllIcons() {
  full ??= Promise.all([
    fetch("symbols.json").then((r) => r.json()),
    fetch("brands.json").then((r) => r.json()),
  ]).then(([s, b]) => {
    Object.assign(store.symbol, s);
    Object.assign(store.brand, b);
  });
  return full;
}

export function hasIcon(name: string) {
  return name.startsWith("brand:") ? !!store.brand[name.slice(6)] : !!store.symbol[name];
}

// Demo data
export const DEMO: Data = {
  owner: "northerncatboy",
  name: "expressive-repo",
  fullName: "northerncatboy/expressive-repo",
  description: "Repository README generator in Material 3 Expressive design style.",
  stars: 340,
  forks: 48,
  issues: 5,
  watchers: 32,
  license: "MIT",
  release: "v1.2.0",
  language: "TypeScript",
  topics: ["material-design", "md3", "readme", "generator", "github", "svg"],
  homepage: "https://northerncatboy.github.io/expressive-repo/",
  defaultBranch: "main",
  languages: [
    ["TypeScript", 68],
    ["HTML", 16],
    ["CSS", 12],
    ["JavaScript", 4],
  ],
  manifestDeps: ["react", "vite", "typescript", "motion", "@material/material-color-utilities", "fflate"],
  readmeRaw: `# Expressive Repo

Repository README generator in Material 3 Expressive design style.

## Features
- **Material 3 Design**: Harmonious tonal color palettes, adaptive containers, and expressive shapes.
- **Instant Live Preview**: Interactive block editor with drag-and-drop and real-time light/dark themes.
- **Adaptive SVG Cards**: Crisp rendering across any display with native GitHub theme switching.
- **Automatic Parser**: Extracts features, tech stack, and install commands directly from the repo README.

## Quick Start
\`\`\`bash
git clone https://github.com/northerncatboy/expressive-repo.git
npm install
npm run dev
\`\`\`
`,
};

// URL parser
export function parseRepoInput(input: string): { owner: string; repo: string } | null {
  let s = input.trim();
  s = s.replace(/^git@github\.com:/, "").replace(/\.git$/, "");
  s = s.replace(/^https?:\/\/github\.com\//, "");
  s = s.replace(/^github\.com\//, "");
  const parts = s.split("/").map((p) => p.trim().replace(/^@/, "")).filter(Boolean);
  if (parts.length >= 2) {
    return { owner: parts[0], repo: parts[1] };
  }
  return null;
}

// Errors
export class LoadError extends Error {
  reset?: Date;
}

async function api(path: string) {
  const r = await fetch(`https://api.github.com/${path}`, { headers: { Accept: "application/vnd.github+json" } });
  if (r.status === 404) throw new LoadError("notFound");
  if (r.status === 403 || r.status === 429) {
    const e = new LoadError("limit");
    const reset = Number(r.headers.get("x-ratelimit-reset"));
    if (reset) e.reset = new Date(reset * 1000);
    throw e;
  }
  if (!r.ok) throw new LoadError("failed");
  return r.json();
}

async function toDataUrl(url: string) {
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Tech stack auto-detection
interface TechRule {
  id: string;
  label: string;
  icon: string;
  regex: RegExp;
  packages?: string[];
}

const TECH_RULES: TechRule[] = [
  // UI & Web Frameworks
  { id: "react", label: "React", icon: "brand:react", regex: /\b(react|reactjs|react\.js)\b/i, packages: ["react", "react-dom"] },
  { id: "nextjs", label: "Next.js", icon: "brand:nextdotjs", regex: /\b(next\.?js|nextjs)\b/i, packages: ["next"] },
  { id: "vue", label: "Vue.js", icon: "brand:vuedotjs", regex: /\b(vue|vuejs|vue\.js|vue3)\b/i, packages: ["vue"] },
  { id: "nuxt", label: "Nuxt", icon: "brand:nuxt", regex: /\b(nuxt|nuxtjs)\b/i, packages: ["nuxt", "nuxt3"] },
  { id: "svelte", label: "Svelte", icon: "brand:svelte", regex: /\b(svelte|sveltekit)\b/i, packages: ["svelte", "@sveltejs/kit"] },
  { id: "angular", label: "Angular", icon: "brand:angular", regex: /\b(angular|angularjs)\b/i, packages: ["@angular/core"] },
  { id: "astro", label: "Astro", icon: "brand:astro", regex: /\b(astro)\b/i, packages: ["astro"] },
  { id: "vite", label: "Vite", icon: "brand:vite", regex: /\b(vite|vitejs)\b/i, packages: ["vite"] },
  { id: "webpack", label: "Webpack", icon: "brand:webpack", regex: /\b(webpack)\b/i, packages: ["webpack"] },
  { id: "tailwind", label: "Tailwind CSS", icon: "brand:tailwindcss", regex: /\b(tailwind|tailwindcss)\b/i, packages: ["tailwindcss"] },

  // Node & Runtimes & Backends
  { id: "nodejs", label: "Node.js", icon: "brand:nodedotjs", regex: /\b(node\.?js|nodejs)\b/i },
  { id: "bun", label: "Bun", icon: "bolt", regex: /\b(bun)\b/i, packages: ["bun"] },
  { id: "deno", label: "Deno", icon: "terminal", regex: /\b(deno)\b/i },
  { id: "express", label: "Express", icon: "brand:express", regex: /\b(express|expressjs)\b/i, packages: ["express"] },
  { id: "fastify", label: "Fastify", icon: "brand:fastify", regex: /\b(fastify)\b/i, packages: ["fastify"] },
  { id: "nestjs", label: "NestJS", icon: "brand:nestjs", regex: /\b(nestjs)\b/i, packages: ["@nestjs/core"] },

  // State & Data & ORM
  { id: "prisma", label: "Prisma", icon: "brand:prisma", regex: /\b(prisma)\b/i, packages: ["prisma", "@prisma/client"] },
  { id: "drizzle", label: "Drizzle ORM", icon: "database", regex: /\b(drizzle|drizzle-orm)\b/i, packages: ["drizzle-orm"] },
  { id: "redux", label: "Redux", icon: "brand:redux", regex: /\b(redux|rtk)\b/i, packages: ["redux", "@reduxjs/toolkit"] },
  { id: "zustand", label: "Zustand", icon: "widgets", regex: /\b(zustand)\b/i, packages: ["zustand"] },
  { id: "trpc", label: "tRPC", icon: "bolt", regex: /\b(trpc)\b/i, packages: ["@trpc/server", "@trpc/client"] },
  { id: "graphql", label: "GraphQL", icon: "brand:graphql", regex: /\b(graphql)\b/i, packages: ["graphql", "@apollo/client"] },
  { id: "framer", label: "Motion", icon: "palette", regex: /\b(framer-motion|motion\/react)\b/i, packages: ["framer-motion", "motion"] },
  { id: "three", label: "Three.js", icon: "brand:threedotjs", regex: /\b(three\.?js|threejs)\b/i, packages: ["three"] },

  // Python Stack
  { id: "fastapi", label: "FastAPI", icon: "bolt", regex: /\b(fastapi)\b/i, packages: ["fastapi"] },
  { id: "django", label: "Django", icon: "brand:django", regex: /\b(django)\b/i, packages: ["django"] },
  { id: "flask", label: "Flask", icon: "brand:flask", regex: /\b(flask)\b/i, packages: ["flask"] },
  { id: "pytorch", label: "PyTorch", icon: "brand:pytorch", regex: /\b(pytorch|torch)\b/i, packages: ["torch", "pytorch"] },
  { id: "tensorflow", label: "TensorFlow", icon: "brand:tensorflow", regex: /\b(tensorflow)\b/i, packages: ["tensorflow"] },
  { id: "numpy", label: "NumPy", icon: "brand:numpy", regex: /\b(numpy)\b/i, packages: ["numpy"] },
  { id: "pandas", label: "Pandas", icon: "brand:pandas", regex: /\b(pandas)\b/i, packages: ["pandas"] },

  // Rust Stack
  { id: "tokio", label: "Tokio", icon: "bolt", regex: /\b(tokio)\b/i, packages: ["tokio"] },
  { id: "actix", label: "Actix", icon: "bolt", regex: /\b(actix|actix-web)\b/i, packages: ["actix-web"] },
  { id: "axum", label: "Axum", icon: "bolt", regex: /\b(axum)\b/i, packages: ["axum"] },

  // Databases & Backend Services
  { id: "postgres", label: "PostgreSQL", icon: "brand:postgresql", regex: /\b(postgres|postgresql)\b/i, packages: ["pg", "postgres", "psycopg2"] },
  { id: "mysql", label: "MySQL", icon: "brand:mysql", regex: /\b(mysql)\b/i, packages: ["mysql", "mysql2"] },
  { id: "sqlite", label: "SQLite", icon: "brand:sqlite", regex: /\b(sqlite|sqlite3)\b/i, packages: ["sqlite", "better-sqlite3"] },
  { id: "mongodb", label: "MongoDB", icon: "brand:mongodb", regex: /\b(mongodb|mongo|mongoose)\b/i, packages: ["mongodb", "mongoose"] },
  { id: "redis", label: "Redis", icon: "brand:redis", regex: /\b(redis|ioredis)\b/i, packages: ["redis", "ioredis"] },
  { id: "supabase", label: "Supabase", icon: "brand:supabase", regex: /\b(supabase)\b/i, packages: ["@supabase/supabase-js"] },
  { id: "firebase", label: "Firebase", icon: "brand:firebase", regex: /\b(firebase)\b/i, packages: ["firebase", "firebase-admin"] },

  // Containers & DevOps
  { id: "docker", label: "Docker", icon: "brand:docker", regex: /\b(docker|dockerfile|containers?)\b/i },
  { id: "kubernetes", label: "Kubernetes", icon: "brand:kubernetes", regex: /\b(kubernetes|k8s)\b/i },
  { id: "githubactions", label: "GitHub Actions", icon: "brand:githubactions", regex: /\b(github-actions|github\s*actions|workflows?)\b/i },
  { id: "git", label: "Git", icon: "brand:git", regex: /\b(git)\b/i },
  { id: "linux", label: "Linux", icon: "brand:linux", regex: /\b(linux|ubuntu|debian|archlinux)\b/i },
  { id: "vercel", label: "Vercel", icon: "brand:vercel", regex: /\b(vercel)\b/i },

  // Mobile & Desktop
  { id: "electron", label: "Electron", icon: "brand:electron", regex: /\b(electron)\b/i, packages: ["electron"] },
  { id: "tauri", label: "Tauri", icon: "brand:tauri", regex: /\b(tauri)\b/i, packages: ["@tauri-apps/api", "tauri"] },
  { id: "flutter", label: "Flutter", icon: "brand:flutter", regex: /\b(flutter)\b/i },
  { id: "reactnative", label: "React Native", icon: "brand:react", regex: /\b(react-native|react\s*native|expo)\b/i, packages: ["react-native", "expo"] },
  { id: "android", label: "Android", icon: "brand:android", regex: /\b(android|jetpack\s*compose)\b/i },
  { id: "swiftui", label: "SwiftUI", icon: "brand:swift", regex: /\b(swiftui|ios|macos)\b/i },

  // Design & Tools
  { id: "material", label: "Material You", icon: "palette", regex: /\b(material\s*design|material\s*you|md3|material-3)\b/i, packages: ["@material/material-color-utilities", "@material/web"] },
  { id: "figma", label: "Figma", icon: "brand:figma", regex: /\b(figma)\b/i },
  { id: "unity", label: "Unity", icon: "brand:unity", regex: /\b(unity|unity3d)\b/i },
  { id: "godot", label: "Godot", icon: "brand:godotengine", regex: /\b(godot|godotengine)\b/i },
  { id: "blender", label: "Blender", icon: "brand:blender", regex: /\b(blender)\b/i },
];

export function detectTechStack(
  data: { languages?: [string, number][]; language?: string | null; topics?: string[]; readmeRaw?: string; description?: string; manifestDeps?: string[] },
  lang: Lang,
): { title: string; items: { label: string; icon: string }[] }[] {
  const ru = lang === "ru";
  const langItems: { label: string; icon: string }[] = [];
  const seen = new Set<string>();

  // 1. Languages
  const langs = data.languages || [];
  if (langs.length > 0) {
    for (const [name, pct] of langs) {
      if (pct > 0 || langs.length <= 4) {
        const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const ic = LANG_ICONS[name] || (hasIcon(`brand:${key}`) ? `brand:${key}` : "code");
        langItems.push({ label: name, icon: ic });
        seen.add(name.toLowerCase());
      }
    }
  } else if (data.language) {
    const ic = LANG_ICONS[data.language] || "code";
    langItems.push({ label: data.language, icon: ic });
    seen.add(data.language.toLowerCase());
  }

  // 2. Shields.io badges logos in readme
  const shieldLogoMatches = [
    ...(data.readmeRaw || "").matchAll(/(?:logo|logoColor)=([a-zA-Z0-9._-]+)/gi),
  ];
  const shieldBadges = new Set(shieldLogoMatches.map((m) => m[1].toLowerCase().replace(/[^a-z0-9]/g, "")));

  // 3. Manifest dependencies
  const manifestSet = new Set((data.manifestDeps || []).map((d) => d.toLowerCase()));

  // 4. Text corpus (topics, description, readme)
  const textCorpus = [
    (data.topics || []).join(" "),
    data.description || "",
    (data.readmeRaw || "").slice(0, 15000),
  ].join("\n");

  const ecoItems: { label: string; icon: string }[] = [];
  for (const rule of TECH_RULES) {
    if (seen.has(rule.label.toLowerCase())) continue;

    // Check manifest packages
    const pkgMatch = rule.packages && rule.packages.some((p) => manifestSet.has(p.toLowerCase()));
    // Check shields logo badge
    const shieldMatch = shieldBadges.has(rule.id) || shieldBadges.has(rule.label.toLowerCase().replace(/[^a-z0-9]/g, ""));
    // Check text regex
    const regexMatch = rule.regex.test(textCorpus);

    if (pkgMatch || shieldMatch || regexMatch) {
      ecoItems.push({ label: rule.label, icon: rule.icon });
      seen.add(rule.label.toLowerCase());
      if (ecoItems.length >= 8) break;
    }
  }

  const groups: { title: string; items: { label: string; icon: string }[] }[] = [];
  if (langItems.length > 0 && ecoItems.length > 0) {
    groups.push({
      title: ru ? "Языки" : "Languages",
      items: langItems.slice(0, 5),
    });
    groups.push({
      title: ru ? "Фреймворки и экосистема" : "Frameworks & Ecosystem",
      items: ecoItems.slice(0, 8),
    });
  } else if (langItems.length > 0) {
    groups.push({
      title: ru ? "Технологии" : "Technologies",
      items: langItems.slice(0, 8),
    });
  } else if (ecoItems.length > 0) {
    groups.push({
      title: ru ? "Технологии" : "Technologies",
      items: ecoItems.slice(0, 8),
    });
  } else {
    groups.push({
      title: ru ? "Стек технологий" : "Tech Stack",
      items: [
        { label: "TypeScript", icon: "brand:typescript" },
        { label: "Git", icon: "brand:git" },
      ],
    });
  }

  return groups;
}

// README parser
export function parseReadme(raw: string, repoMeta: any, lang: Lang, languages?: [string, number][], manifestDeps?: string[]) {
  const ru = lang === "ru";
  const titleMatch = raw.match(/^#\s+([^\n\r]+)/m);
  let title = repoMeta.name || "Repository";
  if (titleMatch) {
    let rawTitle = titleMatch[1];
    rawTitle = rawTitle.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "");
    rawTitle = rawTitle.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
    rawTitle = rawTitle.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
    rawTitle = rawTitle.replace(/&middot;/g, "").replace(/[·•|].*$/, "");
    rawTitle = rawTitle.replace(/<[^>]+>/g, "").trim();
    if (rawTitle && rawTitle.length < 50) title = rawTitle;
  }

  let subtitle = (repoMeta.description || "").trim();
  if (!subtitle && raw) {
    const lines = raw.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim();
      if (l.startsWith("# ") || l.toLowerCase().startsWith(String(repoMeta.name || "").toLowerCase())) {
        for (let j = i + 1; j < Math.min(lines.length, i + 15); j++) {
          let next = lines[j].trim();
          if (next && !next.startsWith("#") && !next.startsWith("!") && !next.startsWith("<") && !next.startsWith("[!")) {
            next = next.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "");
            next = next.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
            next = next.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").trim();
            if (next && next.length > 10) {
              subtitle = next.slice(0, 160);
              break;
            }
          }
        }
        if (subtitle) break;
      }
    }
  }

  const featureItems: FeatureItem[] = [];
  const featureSectionMatch = raw.match(/(?:^|\n)##?\s+([^\n]*(?:feature|highlight|overview|capabilities|what|why|преимущ|возможност|особенност)[^\n]*)\n([\s\S]*?)(?=\n##?|\Z)/i);
  if (featureSectionMatch) {
    const secContent = featureSectionMatch[2];
    const bulletRegex = /(?:^|\n)[*-]\s+(.+)/g;
    let m: RegExpExecArray | null;
    const shapes: ShapeName[] = ["cookie", "flower", "sunny", "clover"];
    while ((m = bulletRegex.exec(secContent)) !== null && featureItems.length < 6) {
      const line = m[1].trim();
      const boldMatch = line.match(/^\*\*([^*]+)\*\*[:\s—–-]+(.*)/);
      if (boldMatch) {
        const fTitle = boldMatch[1].trim();
        const fDesc = boldMatch[2].trim() || fTitle;
        featureItems.push({
          title: fTitle,
          desc: fDesc,
          icon: pickFeatureIcon(`${fTitle} ${fDesc}`),
          shape: shapes[featureItems.length % shapes.length],
        });
      } else if (line.includes(":")) {
        const [fTitle, ...rest] = line.split(":");
        const fDesc = rest.join(":").trim();
        if (fTitle.length < 40) {
          featureItems.push({
            title: fTitle.replace(/\*\*/g, "").trim(),
            desc: fDesc,
            icon: pickFeatureIcon(`${fTitle} ${fDesc}`),
            shape: shapes[featureItems.length % shapes.length],
          });
        }
      } else if (line.length > 5) {
        const clean = line.replace(/\*\*/g, "").trim();
        featureItems.push({
          title: clean.slice(0, 32),
          desc: clean,
          icon: pickFeatureIcon(clean),
          shape: shapes[featureItems.length % shapes.length],
        });
      }
    }
  }

  const quickstartSteps: QuickstartStep[] = [];
  const installSectionMatch = raw.match(/(?:^|\n)##?\s+([^\n]*(?:install|quick\s*start|getting\s*started|usage|setup|быстрый\s*старт|установка|запуск)[^\n]*)\n([\s\S]*?)(?=\n##?|\Z)/i);
  if (installSectionMatch) {
    const sec = installSectionMatch[2];
    const codeMatch = sec.match(/```(?:bash|sh|shell|zsh)?\r?\n([\s\S]*?)```/i);
    if (codeMatch) {
      const commands = codeMatch[1].split(/\r?\n/).map((c) => c.trim()).filter((c) => c && !c.startsWith("#"));
      commands.slice(0, 4).forEach((cmd, idx) => {
        quickstartSteps.push({
          label: idx === 0 ? (ru ? "Клонирование / установка" : "Clone / install") : (ru ? "Запуск" : "Run"),
          code: cmd.replace(/^\$\s*/, ""),
        });
      });
    }
  }

  const stackGroups = detectTechStack(
    {
      languages,
      language: repoMeta.language,
      topics: repoMeta.topics || [],
      readmeRaw: raw,
      description: repoMeta.description,
      manifestDeps,
    },
    lang,
  );

  return { title, subtitle, featureItems, quickstartSteps, stackGroups };
}

export type Loaded = {
  data: Data;
  avatar: string | null;
  parsed: ReturnType<typeof parseReadme>;
  stale?: boolean;
};

const cache = new Map<string, Promise<Loaded>>();
const FRESH = 30 * 60 * 1000;

function saved(key: string): { t: number; v: Loaded } | null {
  try {
    const raw = localStorage.getItem(`er:gh:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(key: string, v: Loaded) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith("er:gh:") && k !== `er:gh:${key}`) localStorage.removeItem(k);
    }
    localStorage.setItem(`er:gh:${key}`, JSON.stringify({ t: Date.now(), v }));
  } catch {}
}

export function loadRepository(owner: string, repo: string, lang: Lang, force = false): Promise<Loaded> {
  const key = `${owner}/${repo}`.toLowerCase();
  const hit = saved(key);
  if (!force && hit && Date.now() - hit.t < FRESH) {
    if (hit.v.data) {
      hit.v.parsed.stackGroups = detectTechStack(hit.v.data, lang);
    }
    return Promise.resolve(hit.v);
  }
  if (!cache.has(key) || force) {
    const p = fetchRepository(owner, repo, lang).then(
      (v) => {
        save(key, v);
        return v;
      },
      (e) => {
        cache.delete(key);
        if (e instanceof LoadError && e.message === "limit" && hit) return { ...hit.v, stale: true };
        throw e;
      },
    );
    cache.set(key, p);
  }
  return cache.get(key)!;
}

async function fetchRepository(owner: string, repo: string, lang: Lang): Promise<Loaded> {
  const repoMeta = await api(`repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  const [langsObj, readmeObj, releaseObj] = await Promise.all([
    api(`repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`).catch(() => ({})),
    api(`repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`).catch(() => null),
    api(`repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest`).catch(() => null),
  ]);

  let latestRelease: string | null = releaseObj?.tag_name || releaseObj?.name || null;
  let licenseDetected: string | null = repoMeta.license?.spdx_id || repoMeta.license?.name || null;
  if (licenseDetected === "NOASSERTION") licenseDetected = repoMeta.license?.name || null;

  let readmeRaw = "";
  if (readmeObj && readmeObj.content) {
    try {
      const cleanBase64 = readmeObj.content.replace(/\s+/g, "");
      const bin = atob(cleanBase64);
      readmeRaw = strFromU8(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
    } catch {
      readmeRaw = "";
    }
  }

  const defaultBranch = repoMeta.default_branch || "main";
  const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}`;

  if (!readmeRaw && repoMeta.default_branch) {
    try {
      const rawRes = await fetch(`${rawBase}/README.md`);
      if (rawRes.ok) readmeRaw = await rawRes.text();
    } catch {}
  }

  const manifestDeps: string[] = [];
  try {
    const [pkgRes, cargoRes, reqsRes, goRes] = await Promise.allSettled([
      fetch(`${rawBase}/package.json`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${rawBase}/Cargo.toml`).then((r) => (r.ok ? r.text() : null)),
      fetch(`${rawBase}/requirements.txt`).then((r) => (r.ok ? r.text() : null)),
      fetch(`${rawBase}/go.mod`).then((r) => (r.ok ? r.text() : null)),
    ]);

    if (pkgRes.status === "fulfilled" && pkgRes.value) {
      const pkg = pkgRes.value;
      const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
      manifestDeps.push(...Object.keys(deps));
      if (!latestRelease && pkg.version) {
        latestRelease = pkg.version.startsWith("v") ? pkg.version : `v${pkg.version}`;
      }
      if (!licenseDetected && pkg.license) {
        licenseDetected = typeof pkg.license === "string" ? pkg.license : pkg.license?.type || null;
      }
    }
    if (cargoRes.status === "fulfilled" && cargoRes.value) {
      const cargoText = cargoRes.value;
      if (!latestRelease) {
        const vm = cargoText.match(/\[package\][^\[]*version\s*=\s*"([^"]+)"/s);
        if (vm) latestRelease = vm[1].startsWith("v") ? vm[1] : `v${vm[1]}`;
      }
      if (!licenseDetected) {
        const lm = cargoText.match(/\[package\][^\[]*license(?:-file)?\s*=\s*"([^"]+)"/s);
        if (lm) licenseDetected = lm[1];
      }
      const lines = cargoText.split(/\r?\n/);
      let inDeps = false;
      for (const l of lines) {
        if (/^\[.*dependencies.*\]/i.test(l)) inDeps = true;
        else if (/^\[/.test(l)) inDeps = false;
        else if (inDeps) {
          const m = l.match(/^([a-zA-Z0-9_-]+)\s*=/);
          if (m) manifestDeps.push(m[1].toLowerCase());
        }
      }
    }
    if (reqsRes.status === "fulfilled" && reqsRes.value) {
      for (const l of reqsRes.value.split(/\r?\n/)) {
        const clean = l.replace(/#.*$/, "").trim();
        const m = clean.match(/^([a-zA-Z0-9_-]+)/);
        if (m) manifestDeps.push(m[1].toLowerCase());
      }
    }
    if (goRes.status === "fulfilled" && goRes.value) {
      for (const l of goRes.value.split(/\r?\n/)) {
        const m = l.trim().match(/^(?:require\s+)?([a-zA-Z0-9._/-]+)\s+v/);
        if (m) manifestDeps.push(m[1].toLowerCase());
      }
    }
  } catch {}

  if (!latestRelease) {
    try {
      const tags = await api(`repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tags`);
      if (Array.isArray(tags) && tags.length > 0 && tags[0]?.name) {
        latestRelease = tags[0].name;
      }
    } catch {}
  }

  if (!licenseDetected && readmeRaw) {
    const lm = readmeRaw.match(/license[/-]([a-zA-Z0-9.-]+)/i) || readmeRaw.match(/\[([a-zA-Z0-9.-]+\s+License)\]/i);
    if (lm) licenseDetected = lm[1];
  }

  const langsTotal = Object.values(langsObj as Record<string, number>).reduce((a, b) => a + b, 0) || 1;
  const languages: [string, number][] = Object.entries(langsObj as Record<string, number>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, size]) => [name, Math.round((size / langsTotal) * 100)]);

  const parsed = parseReadme(readmeRaw, repoMeta, lang, languages, manifestDeps);

  const data: Data = {
    owner: repoMeta.owner?.login || owner,
    name: repoMeta.name || repo,
    fullName: repoMeta.full_name || `${owner}/${repo}`,
    description: repoMeta.description || "",
    stars: repoMeta.stargazers_count || 0,
    forks: repoMeta.forks_count || 0,
    issues: repoMeta.open_issues_count || 0,
    watchers: repoMeta.subscribers_count || repoMeta.watchers_count || 0,
    license: licenseDetected,
    release: latestRelease,
    language: repoMeta.language || null,
    topics: repoMeta.topics || [],
    homepage: repoMeta.homepage ? repoMeta.homepage.replace(/https:\/\/[^.]+\.github\.io/gi, `https://${owner}.github.io`) : null,
    defaultBranch,
    languages,
    readmeRaw,
    manifestDeps,
  };

  const avatarUrl = repoMeta.owner?.avatar_url ? `${repoMeta.owner.avatar_url}${repoMeta.owner.avatar_url.includes("?") ? "&" : "?"}s=320` : null;
  const avatar = avatarUrl ? await toDataUrl(avatarUrl) : null;

  return { data, avatar, parsed };
}

// Workflow
export function repoFiles(c: Config, d: Data, avatar: string | null) {
  const svgs = render(c, d, store, avatar);
  const files: Record<string, string> = { ...svgs };
  files["README.md"] = readme(c, d, svgs);
  return files;
}

export async function buildZip(c: Config, d: Data, avatar: string | null) {
  const files: Record<string, Uint8Array> = {};
  for (const [path, text] of Object.entries(repoFiles(c, d, avatar))) files[path] = strToU8(text);
  const zip = zipSync(files, { level: 9 });
  const url = URL.createObjectURL(new Blob([zip], { type: "application/zip" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${c.repo}-expressive-readme.zip`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
