import { hexFromArgb, sourceColorFromImage } from "@material/material-color-utilities";
import { AnimatePresence, motion, Reorder, useDragControls } from "motion/react";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { inflateSync, strFromU8 } from "fflate";
import { BLOCKS, defaults, LANG_ICONS, palette, render, REPO_URL, slug, usedIcons, type BlockId, type Config, type Data, type Item, type Lang, type ShapeName } from "../render";
import { buildZip, DEMO, detectTechStack, hasIcon, LoadError, loadAllIcons, loadRepository, parseRepoInput, repoFiles, store } from "./data";
import { SheetBody, type SheetId } from "./editors";
import { DICTS, type Dict } from "./i18n";
import { bouncy, Button, Glyph, IconButton, Morph, spring, useCycle } from "./ui";

type Theme = "system" | "light" | "dark";
const DEMO_REPO = "northerncatboy/expressive-repo";
const CYCLE: ShapeName[] = ["cookie", "clover", "sunny", "flower", "gem", "soft", "cookie12"];

// Storage
function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch { }
}

function initialLang(): Lang {
  const saved = read<Lang | null>("er:lang", null);
  if (saved) return saved;
  const nav = navigator.language?.toLowerCase() || "";
  return nav.startsWith("ru") ? "ru" : "en";
}

function migrate(c: any, lang: Lang): Config {
  const base = defaults(DEMO_REPO, lang);
  if (!c || typeof c !== "object") return base;
  const isOldDefault = !c.owner || (c.repo === "expressive-repo" && c.owner !== "northerncatboy");
  const owner = isOldDefault ? base.owner : c.owner;
  const repo = (!c.repo || isOldDefault) ? base.repo : c.repo;
  const repoUrl = (!c.repoUrl || isOldDefault) ? `${owner}/${repo}` : c.repoUrl;
  return {
    ...base,
    ...c,
    owner,
    repo,
    repoUrl,
    hero: {
      ...base.hero,
      ...c.hero,
      license: c.hero?.license || base.hero.license,
      release: c.hero?.release || base.hero.release,
      logoShape: c.hero?.logoShape || c.hero?.avatarShape || base.hero.logoShape,
      chips: Array.isArray(c.hero?.chips) ? c.hero.chips : base.hero.chips,
    },
    features: {
      ...base.features,
      ...c.features,
      items: Array.isArray(c.features?.items) ? c.features.items : base.features.items,
    },
    quickstart: {
      ...base.quickstart,
      ...c.quickstart,
      steps: Array.isArray(c.quickstart?.steps) ? c.quickstart.steps : base.quickstart.steps,
    },
    stack: {
      ...base.stack,
      ...c.stack,
      groups: Array.isArray(c.stack?.groups) ? c.stack.groups : base.stack.groups,
    },
    stats: { ...base.stats, ...c.stats },
    buttons: {
      ...base.buttons,
      ...c.buttons,
      items: Array.isArray(c.buttons?.items) ? c.buttons.items : base.buttons.items,
    },
    order: Array.isArray(c.order) ? placeNew(c.order.filter((b: any) => BLOCKS.includes(b))) : base.order,
    hidden: Array.isArray(c.hidden) ? c.hidden.filter((b: any) => BLOCKS.includes(b)) : [],
  };
}

function placeNew(order: BlockId[]) {
  const out = [...order];
  BLOCKS.forEach((b, i) => {
    if (out.includes(b)) return;
    const prev = BLOCKS.slice(0, i).reverse().find((x) => out.includes(x));
    out.splice(prev ? out.indexOf(prev) + 1 : 0, 0, b);
  });
  return out;
}

function retranslate<T>(value: T, from: unknown, to: unknown): T {
  if (typeof value === "string") return (value === from && typeof to === "string" ? to : value) as T;
  if (Array.isArray(value)) {
    if (!Array.isArray(from) || !Array.isArray(to) || from.length !== value.length || to.length !== value.length) return value;
    return value.map((v, i) => retranslate(v, from[i], to[i])) as T;
  }
  if (value && typeof value === "object" && from && to && typeof from === "object" && typeof to === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = retranslate(v, (from as any)[k], (to as any)[k]);
    return out as T;
  }
  return value;
}

function decode(s: string): Config | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(strFromU8(inflateSync(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)))));
  } catch {
    return null;
  }
}

function sharedFromHash() {
  const m = /[#&]c=([^&]+)/.exec(location.hash);
  return m ? decode(m[1]) : null;
}

function remixFrom(theirs: Config, lang: Lang, repoSlug: string): Config {
  const base = defaults(repoSlug, lang);
  return {
    ...base,
    seed: theirs.seed ?? base.seed,
    seedFromAvatar: false,
    scheme: theirs.scheme ?? base.scheme,
    motion: theirs.motion ?? base.motion,
    order: theirs.order ?? base.order,
    hidden: theirs.hidden ?? base.hidden,
    hero: { ...base.hero, logoShape: theirs.hero?.logoShape ?? base.hero.logoShape, typing: theirs.hero?.typing ?? base.hero.typing },
  };
}

// Preview
function useBlobUrls(files: Record<string, string>) {
  const cache = useRef(new Map<string, { svg: string; url: string }>());
  return useMemo(() => {
    const out: Record<string, string> = {};
    for (const [path, svg] of Object.entries(files)) {
      const hit = cache.current.get(path);
      if (hit && hit.svg === svg) {
        out[path] = hit.url;
        continue;
      }
      if (hit) setTimeout(() => URL.revokeObjectURL(hit.url), 4000);
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      cache.current.set(path, { svg, url });
      out[path] = url;
    }
    return out;
  }, [files]);
}

function useDark(theme: Theme) {
  const [sys, setSys] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const m = matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSys(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return theme === "system" ? sys : theme === "dark";
}

function useWide() {
  const [wide, setWide] = useState(() => innerWidth >= 1100);
  useEffect(() => {
    const on = () => setWide(innerWidth >= 1100);
    addEventListener("resize", on);
    return () => removeEventListener("resize", on);
  }, []);
  return wide;
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
const WIDTH_RE = /width="([0-9.]+)"/;
const HEIGHT_RE = /height="([0-9.]+)"/;

// App
export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const t = DICTS[lang];
  const [shared] = useState(sharedFromHash);
  const [from] = useState(() => new URLSearchParams(location.search).get("repo"));
  const [config, setConfig] = useState<Config>(() => migrate(shared ?? read<Config | null>("er:config", null), lang));
  const [theme, setTheme] = useState<Theme>(() => read<Theme>("er:theme", "system"));
  const dark = useDark(theme);
  const wide = useWide();
  const [data, setData] = useState<Data>(DEMO);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarSeed, setAvatarSeed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(config.repoUrl || DEMO_REPO);
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [iconsTick, setIconsTick] = useState(0);
  const isDemo = config.repoUrl === DEMO_REPO;
  const [landing, setLanding] = useState(Boolean(from));
  const field = useRef<HTMLInputElement>(null);

  const set = useCallback((fn: (c: Config) => Config) => setConfig(fn), []);

  useEffect(() => write("er:config", config), [config]);
  useEffect(() => write("er:theme", theme), [theme]);
  useEffect(() => {
    write("er:lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (usedIcons(config, data).some((n) => !hasIcon(n))) {
      loadAllIcons().then(() => setIconsTick((x) => x + 1));
    }
  }, [config, data]);

  const p = useMemo(() => palette(config.seed, config.scheme, dark), [config.seed, config.scheme, dark]);
  useEffect(() => {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(p)) root.style.setProperty(`--${kebab(k)}`, v);
    root.style.colorScheme = dark ? "dark" : "light";
    root.dataset.theme = dark ? "dark" : "light";
  }, [p, dark]);

  const load = useCallback(
    async (repoInput: string) => {
      const parsed = parseRepoInput(repoInput);
      if (!parsed) {
        setToast(t.needRepo);
        return;
      }
      setLoading(true);
      try {
        const r = await loadRepository(parsed.owner, parsed.repo, lang);
        if (r.stale) setToast(t.stale);
        setData(r.data);
        setAvatar(r.avatar);
        setInput(`${parsed.owner}/${parsed.repo}`);

        const starsLabel = r.data.stars > 999 ? `★ ${(r.data.stars / 1000).toFixed(1)}k` : `★ ${r.data.stars}`;
        const forksLabel = r.data.forks > 999 ? `⑂ ${(r.data.forks / 1000).toFixed(1)}k` : `⑂ ${r.data.forks}`;
        const licenseLabel = r.data.license || "MIT";
        const releaseLabel = r.data.release || null;
        const topLang = r.data.languages[0]?.[0] || r.data.language || "Code";
        const langIcon = LANG_ICONS[topLang] || (hasIcon(`brand:${slug(topLang)}`) ? `brand:${slug(topLang)}` : "code");
        const langChip = { icon: langIcon, label: topLang };
        const stackGroups = detectTechStack(r.data, lang);

        const chips: Item[] = [
          { icon: "star", label: starsLabel },
          { icon: "fork_right", label: forksLabel },
        ];
        if (releaseLabel) {
          chips.push({ icon: "sell", label: releaseLabel });
        }
        if (licenseLabel) {
          chips.push({ icon: "license", label: licenseLabel });
        }
        chips.push(langChip);

        setConfig((c) => ({
          ...c,
          repoUrl: `${parsed.owner}/${parsed.repo}`,
          owner: parsed.owner,
          repo: parsed.repo,
          hero: {
            ...c.hero,
            tag: (!c.hero.tag || /open\s*source|опенсурс/i.test(c.hero.tag)) ? "" : c.hero.tag,
            title: r.parsed.title || parsed.repo,
            subtitle: r.parsed.subtitle || r.data.description || c.hero.subtitle,
            license: licenseLabel,
            release: releaseLabel || "",
            chips,
          },
          features: {
            ...c.features,
            items: r.parsed.featureItems.length > 0 ? r.parsed.featureItems : c.features.items,
          },
          quickstart: {
            ...c.quickstart,
            steps: r.parsed.quickstartSteps.length > 0 ? r.parsed.quickstartSteps : [
              { label: lang === "ru" ? "Клонирование" : "Clone", code: `git clone https://github.com/${parsed.owner}/${parsed.repo}.git` },
              { label: lang === "ru" ? "Установка" : "Install", code: "npm install" },
            ],
          },
          stack: {
            ...c.stack,
            groups: stackGroups,
          },
          buttons: {
            ...c.buttons,
            items: [
              r.data.homepage ? { icon: "language", label: lang === "ru" ? "Демо сайта" : "Live Demo", url: r.data.homepage, style: "filled" as const } : null,
              { icon: "book_2", label: lang === "ru" ? "Документация" : "Documentation", url: "", style: "tonal" as const },
              { icon: "star", label: lang === "ru" ? "Звезда на GitHub" : "Star on GitHub", url: `https://github.com/${parsed.owner}/${parsed.repo}`, style: "tonal" as const },
            ].filter((b): b is NonNullable<typeof b> => !!b),
          },
        }));
        setToast(lang === "ru" ? "Репозиторий загружен!" : "Repository loaded!");
      } catch (e) {
        if (e instanceof LoadError && e.message === "limit" && e.reset) {
          setToast(t.limitAt.replace("{time}", e.reset.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })));
        } else {
          setToast(e instanceof LoadError ? t[e.message as "limit" | "notFound" | "failed"] : t.failed);
        }
      } finally {
        setLoading(false);
      }
    },
    [lang, t],
  );

  useEffect(() => {
    if (!from && config.owner && config.repo) {
      load(`${config.owner}/${config.repo}`);
    }
    if (shared) {
      setToast(t.shared);
      history.replaceState(null, "", location.pathname + location.search);
    }
  }, []);

  const fromImage = async (f: File) => {
    const url = URL.createObjectURL(f);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const argb = await sourceColorFromImage(img);
      setConfig((c) => ({ ...c, seed: hexFromArgb(argb).toUpperCase(), seedFromAvatar: false }));
    } catch {
      setToast(t.failed);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const leaveLanding = (next: Config) => {
    history.replaceState(null, "", location.pathname);
    setConfig(next);
    setInput(next.repoUrl || DEMO_REPO);
    setData(DEMO);
    setAvatar(null);
    setLanding(false);
    setTimeout(() => field.current?.focus(), 400);
  };

  useEffect(() => {
    if (!avatar) return setAvatarSeed(null);
    const img = new Image();
    img.src = avatar;
    img.decode().then(() => sourceColorFromImage(img)).then((argb) => setAvatarSeed(hexFromArgb(argb).toUpperCase())).catch(() => setAvatarSeed(null));
  }, [avatar]);

  useEffect(() => {
    if (avatarSeed && config.seedFromAvatar && config.seed !== avatarSeed) {
      setConfig((c) => ({ ...c, seed: avatarSeed }));
    }
  }, [avatarSeed, config.seedFromAvatar]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSheet(null);
      }
    };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  }, []);

  const switchLang = () => {
    const next: Lang = lang === "en" ? "ru" : "en";
    setConfig((c) => retranslate(c, defaults(c.repoUrl, lang), defaults(c.repoUrl, next)));
    setLang(next);
  };

  const deferred = useDeferredValue(config);
  const files = useMemo(() => render(deferred, data, store, avatar, [dark ? "dark" : "light"]), [deferred, data, avatar, dark, iconsTick]);
  const urls = useBlobUrls(files);
  const src = (name: string) => urls[`assets/${name}-${dark ? "dark" : "light"}.svg`];
  const attr = (name: string, re: RegExp) => Number(re.exec(files[`assets/${name}-${dark ? "dark" : "light"}.svg`] ?? "")?.[1] ?? 0);
  const width = (name: string) => attr(name, WIDTH_RE);
  const ratio = (name: string) => attr(name, HEIGHT_RE) / (width(name) || 1);
  const body = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);

  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(e.contentRect.width / 840));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visible = config.order.filter((b) => !config.hidden.includes(b));
  const hidden = config.order.filter((b) => config.hidden.includes(b));
  const hide = (id: BlockId) => {
    setConfig((c) => ({ ...c, hidden: [...c.hidden, id] }));
    if (sheet === id) setSheet(null);
  };
  const show = (id: BlockId) => setConfig((c) => ({ ...c, hidden: c.hidden.filter((x) => x !== id) }));

  const save = async () => {
    await buildZip(config, data, avatar);
  };

  const reset = () => {
    if (!confirm(t.resetConfirm)) return;
    setConfig(defaults(config.repoUrl, lang));
  };

  const shiftForSheet = wide && sheet ? 440 : 0;

  if (landing && from) {
    return (
      <div className="app">
        <Backdrop />
        <Landing
          repoSlug={from}
          t={t}
          dark={dark}
          lang={lang}
          onRemix={(theirs) => {
            leaveLanding(remixFrom(theirs, lang, DEMO_REPO));
            setToast(t.copied);
          }}
          onScratch={() => leaveLanding(defaults(DEMO_REPO, lang))}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Backdrop />
      <header className="topbar">
        <Logo />
        <form
          className="login"
          onSubmit={(e) => {
            e.preventDefault();
            load(input);
          }}
        >
          <Glyph name="brand:github" size={22} />
          <input
            ref={field}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.repoUrl}
            spellCheck={false}
            autoCapitalize="off"
            aria-label={t.repoUrl}
          />
          <AnimatePresence mode="wait" initial={false}>
            {loading ? (
              <motion.span key="l" className="login-state" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={bouncy}>
                <Loader />
              </motion.span>
            ) : (
              <motion.button key="b" type="submit" className="login-go" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={bouncy} whileTap={{ scale: 0.85 }} aria-label={t.load}>
                <Glyph name="arrow_outward" size={20} />
              </motion.button>
            )}
          </AnimatePresence>
        </form>

        <div className="actions">
          <IconButton icon="palette" title={t.style} onClick={() => setSheet(sheet === "style" ? null : "style")} active={sheet === "style"} />
          <motion.button type="button" className="lang-btn" onClick={switchLang} whileTap={{ scale: 0.85 }} transition={bouncy} title={t.language}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={lang} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={spring}>
                {lang.toUpperCase()}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <IconButton
            icon={theme === "dark" ? "dark_mode" : theme === "light" ? "light_mode" : "contrast"}
            title={`${t.theme}: ${t[theme]}`}
            onClick={() => setTheme(theme === "system" ? (dark ? "light" : "dark") : theme === "dark" ? "light" : "system")}
          />
          <Button icon="download" onClick={save}>{t.download}</Button>
        </div>
      </header>

      <main className="stage">
        <motion.div className="stage-inner" animate={{ paddingRight: shiftForSheet }} transition={spring}>
          <AnimatePresence initial={false}>
            {isDemo && (
              <motion.div key="demo" className="banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
                <Glyph name="info" size={20} />
                <span>{t.demo}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`paper${dark ? " dark" : ""}`}>
            <div className="paper-head">
              <Glyph name="book_2" size={16} />
              <span>{config.owner || "owner"} / {config.repo || "repository"} / README.md</span>
            </div>
            <Reorder.Group
              ref={body}
              axis="y"
              as="div"
              className="paper-body"
              values={visible}
              onReorder={(next: BlockId[]) => setConfig((c) => ({ ...c, order: [...next, ...c.order.filter((b) => c.hidden.includes(b))] }))}
            >
              {visible.map((id) => (
                <Block key={id} id={id} t={t} active={sheet === id} onEdit={id === "wave" ? undefined : () => setSheet(id as SheetId)} onHide={() => hide(id)}>
                  <BlockView id={id} config={deferred} data={data} src={src} size={(n) => width(n) * Math.min(1, k)} fill={(n) => width(n) * k} ratio={ratio} />
                </Block>
              ))}
            </Reorder.Group>
            <div className="credit">
              <img draggable={false} src={src("credit")} alt="Made with Expressive Repo" style={{ width: width("credit") * Math.min(1, k), height: width("credit") * Math.min(1, k) * ratio("credit") }} />
            </div>
          </div>

          <AnimatePresence>
            {hidden.length > 0 && (
              <motion.div className="tray" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={spring}>
                <span className="tray-title">{t.hidden}</span>
                <div className="chips-wrap">
                  <AnimatePresence>
                    {hidden.map((id) => (
                      <motion.button key={id} type="button" layout className="filter-chip" onClick={() => show(id)} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} whileTap={{ scale: 0.9 }} transition={bouncy}>
                        <Glyph name="add" size={18} />
                        {t.blocks[id]}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <AnimatePresence>
        {sheet && (
          <Sheet key="sheet" wide={wide} title={sheet === "style" ? t.style : t.blocks[sheet]} onClose={() => setSheet(null)} t={t}>
            <SheetBody key={sheet} id={sheet} c={config} set={set} t={t} d={data} avatarSeed={avatarSeed} onReset={reset} onImage={fromImage} />
          </Sheet>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div className="toast" role="status" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={bouncy}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Parts
function Logo() {
  const shape = useCycle(CYCLE, 2600);
  return (
    <div className="logo">
      <motion.span className="logo-mark" whileHover={{ rotate: 90, scale: 1.1 }} transition={bouncy}>
        <Morph shape={shape} size={34} />
      </motion.span>
      <span className="logo-text">Expressive Repo</span>
    </div>
  );
}

function Loader() {
  const shape = useCycle(CYCLE, 520);
  return <Morph shape={shape} size={26} spin className="loader" />;
}

function Backdrop() {
  const a = useCycle(CYCLE, 5200);
  const b = useCycle([...CYCLE].reverse(), 6100);
  return (
    <div className="backdrop" aria-hidden="true">
      <Morph shape={a} size={620} className="bd bd-a" />
      <Morph shape={b} size={420} className="bd bd-b" />
    </div>
  );
}

function Block({ id, t, children, active, onEdit, onHide }: { id: BlockId; t: Dict; children: ReactNode; active: boolean; onEdit?: () => void; onHide: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={id}
      as="div"
      className={`block${active ? " active" : ""}${onEdit ? " editable" : ""}`}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={spring}
      whileDrag={{ scale: 1.02, zIndex: 10 }}
      onClick={onEdit}
    >
      {children}
      <div className="block-tools" onClick={(e) => e.stopPropagation()}>
        <span className="tool grip" onPointerDown={(e) => controls.start(e)} title={t.move}>
          <Glyph name="drag_indicator" size={20} />
        </span>
        {onEdit && <IconButton icon="edit" title={t.edit} onClick={onEdit} />}
        <IconButton icon="visibility_off" title={t.hide} onClick={onHide} />
      </div>
    </Reorder.Item>
  );
}

function BlockView({ id, config, data, src, size, fill, ratio }: { id: BlockId; config: Config; data: Data; src: (n: string) => string; size: (n: string) => number; fill: (n: string) => number; ratio: (n: string) => number }) {
  if (id === "buttons") return <LinkRow prefix="button" count={config.buttons.items.length} src={src} size={size} fill={fill} ratio={ratio} />;
  return <img draggable={false} className="full" src={src(id)} alt={id} style={{ aspectRatio: 1 / (ratio(id) || 1) }} />;
}

function LinkRow({ prefix, count, src, size, fill, ratio }: { prefix: string; count: number; src: (n: string) => string; size: (n: string) => number; fill: (n: string) => number; ratio: (n: string) => number }) {
  const card = !!src(`${prefix}-l`);
  const names = Array.from({ length: count }, (_, i) => `${prefix}-${i + 1}`);
  if (card) names.unshift(`${prefix}-l`), names.push(`${prefix}-r`);
  return (
    <div className={`buttons${card ? " row-card" : ""}`}>
      {names.map((n) => (
        <img draggable={false} key={n} src={src(n)} alt="" style={{ width: card ? fill(n) : size(n), height: (card ? fill(n) : size(n)) * ratio(n) }} />
      ))}
    </div>
  );
}

function Sheet({ title, children, onClose, wide, t }: { title: string; children: ReactNode; onClose: () => void; wide: boolean; t: Dict }) {
  const from = wide ? { x: 480, opacity: 0.4 } : { y: "100%" };
  return (
    <>
      {!wide && <motion.div className="scrim sheet-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
      <motion.aside className={`sheet${wide ? " side" : " bottom"}`} initial={from} animate={{ x: 0, y: 0, opacity: 1 }} exit={from} transition={spring}>
        <div className="sheet-head">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.h2 key={title} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={spring}>
              {title}
            </motion.h2>
          </AnimatePresence>
          <IconButton icon="close" title={t.close} onClick={onClose} />
        </div>
        <div className="sheet-body">{children}</div>
      </motion.aside>
    </>
  );
}

function Landing({ repoSlug, t, dark, lang, onRemix, onScratch }: { repoSlug: string; t: Dict; dark: boolean; lang: Lang; onRemix: (c: Config) => void; onScratch: () => void }) {
  const [parsed] = useState(() => parseRepoInput(repoSlug));
  const [view, setView] = useState<{ data: Data; avatar: string | null } | null>(null);

  useEffect(() => {
    if (parsed) {
      loadRepository(parsed.owner, parsed.repo, lang).then(setView).catch(() => { });
    }
  }, [parsed, lang]);

  return (
    <main className="landing">
      <motion.div className="land-card" initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}>
        <Logo />
        <h1>{repoSlug}</h1>
        <p>{view?.data.description || t.preview}</p>
        <div className="land-actions">
          <Button icon="edit_square" onClick={() => onRemix(defaults(repoSlug, lang))}>{t.edit}</Button>
          <Button kind="tonal" icon="refresh" onClick={onScratch}>{t.reset}</Button>
          <Button kind="text" icon="brand:github" href={`https://github.com/${repoSlug}`}>GitHub</Button>
        </div>
      </motion.div>
    </main>
  );
}
