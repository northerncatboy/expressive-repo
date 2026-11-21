import { AnimatePresence, motion, Reorder, useDragControls } from "motion/react";
import { useState } from "react";
import type { Config, Data, FeatureItem, QuickstartStep, SchemeName } from "../render";
import type { Dict } from "./i18n";
import { activePreset, applyPreset, PRESETS, type PresetId } from "./presets";
import { detectTechStack } from "./data";
import { bouncy, Button, Field, Glyph, IconButton, IconSelect, ItemList, Section, Segmented, ShapePicker, spring, Switch } from "./ui";

export type SheetId = "hero" | "features" | "quickstart" | "stack" | "stats" | "buttons" | "style";

interface Props {
  c: Config;
  set: (fn: (c: Config) => Config) => void;
  t: Dict;
  d: Data;
}

// Hero
const LICENSES = ["MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause", "MPL-2.0", "Unlicense"];

function Hero({ c, set, t }: Props) {
  const h = c.hero;
  const up = (v: Partial<Config["hero"]>) => set((c) => ({ ...c, hero: { ...c.hero, ...v } }));

  const currentLicense = h.license ?? (h.chips.find((ch) => ch.icon === "license" || ch.icon === "verified")?.label ?? "");
  const currentRelease = h.release ?? (h.chips.find((ch) => ch.icon === "sell" || ch.icon === "tag")?.label ?? "");

  const updateLicense = (val: string) => {
    const clean = val.trim();
    let nextChips = [...h.chips];
    const idx = nextChips.findIndex((ch) => ch.icon === "license" || ch.icon === "verified");
    if (idx >= 0) {
      if (clean) nextChips[idx] = { icon: "license", label: clean };
      else nextChips.splice(idx, 1);
    } else if (clean) {
      nextChips.push({ icon: "license", label: clean });
    }
    up({ license: val, chips: nextChips });
  };

  const updateRelease = (val: string) => {
    const clean = val.trim();
    let nextChips = [...h.chips];
    const idx = nextChips.findIndex((ch) => ch.icon === "sell" || ch.icon === "tag");
    if (idx >= 0) {
      if (clean) nextChips[idx] = { icon: "sell", label: clean };
      else nextChips.splice(idx, 1);
    } else if (clean) {
      const licIdx = nextChips.findIndex((ch) => ch.icon === "license" || ch.icon === "verified");
      if (licIdx >= 0) nextChips.splice(licIdx, 0, { icon: "sell", label: clean });
      else nextChips.push({ icon: "sell", label: clean });
    }
    up({ release: val, chips: nextChips });
  };

  const onChipsChange = (nextChips: typeof h.chips) => {
    const lic = nextChips.find((ch) => ch.icon === "license" || ch.icon === "verified")?.label ?? "";
    const rel = nextChips.find((ch) => ch.icon === "sell" || ch.icon === "tag")?.label ?? "";
    up({ chips: nextChips, license: lic, release: rel });
  };

  return (
    <>
      <Section>
        <Field label={t.tag} value={h.tag} onChange={(tag) => up({ tag })} maxLength={32} />
        <Field label={t.title} value={h.title} placeholder={c.repo || "Repository"} onChange={(title) => up({ title })} maxLength={36} />
        <Field label={t.subtitle} value={h.subtitle} onChange={(subtitle) => up({ subtitle })} multiline maxLength={140} />
        <Field label={t.license} value={currentLicense} placeholder={t.licensePlaceholder} onChange={updateLicense} maxLength={32} />
        <div className="chips-wrap" style={{ marginTop: -4, marginBottom: 8 }}>
          {LICENSES.map((lic) => (
            <button
              key={lic}
              type="button"
              className={`filter-chip${currentLicense.toUpperCase() === lic.toUpperCase() ? " on" : ""}`}
              onClick={() => updateLicense(lic)}
            >
              {lic}
            </button>
          ))}
        </div>
        <Field label={t.release} value={currentRelease} placeholder={t.releasePlaceholder} onChange={updateRelease} maxLength={24} />
        <Switch label={t.typing} value={h.typing} onChange={(typing) => up({ typing })} />
      </Section>
      <Section title={t.logoShape}>
        <ShapePicker value={h.logoShape} onChange={(s) => up({ logoShape: s ?? "cookie12" })} />
      </Section>
      <Section title={t.chips}>
        <ItemList items={h.chips} onChange={onChipsChange} t={t} max={7} fresh={{ icon: "star", label: "★ 1.0k" }} />
      </Section>
    </>
  );
}

// Features
function Features({ c, set, t }: Props) {
  const f = c.features;
  const up = (v: Partial<Config["features"]>) => set((c) => ({ ...c, features: { ...c.features, ...v } }));
  const items = f.items;

  const upItem = (idx: number, patch: Partial<FeatureItem>) => {
    up({ items: items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });
  };

  const removeItem = (idx: number) => {
    up({ items: items.filter((_, i) => i !== idx) });
  };

  return (
    <>
      <Section>
        <Field label={t.title} value={f.title} onChange={(title) => up({ title })} maxLength={40} />
      </Section>
      <Section title={t.blocks.features}>
        <AnimatePresence initial={false}>
          {items.map((item, idx) => (
            <motion.div key={idx} className="group-card" layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={spring}>
              <div className="group-head">
                <IconSelect value={item.icon} onChange={(icon) => upItem(idx, { icon })} t={t} />
                <Field value={item.title} placeholder={t.featureTitle} onChange={(title) => upItem(idx, { title })} maxLength={32} />
                <IconButton icon="delete" title={t.remove} onClick={() => removeItem(idx)} />
              </div>
              <Field label={t.featureDesc} value={item.desc} placeholder={t.featureDesc} onChange={(desc) => upItem(idx, { desc })} multiline maxLength={120} />
              <div className="inline">
                <span className="field-label">{t.logoShape}</span>
                <ShapePicker value={item.shape} onChange={(shape) => upItem(idx, { shape })} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length < 6 && (
          <Button
            kind="outlined"
            icon="add"
            onClick={() =>
              up({
                items: [
                  ...items,
                  { icon: "widgets", title: "New Feature", desc: "Description of this feature and what it provides.", shape: "cookie" },
                ],
              })
            }
          >
            {t.addFeature}
          </Button>
        )}
      </Section>
    </>
  );
}

// Quickstart
function Quickstart({ c, set, t }: Props) {
  const q = c.quickstart;
  const up = (v: Partial<Config["quickstart"]>) => set((c) => ({ ...c, quickstart: { ...c.quickstart, ...v } }));
  const steps = q.steps;

  const upStep = (idx: number, patch: Partial<QuickstartStep>) => {
    up({ steps: steps.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  };

  return (
    <>
      <Section>
        <Field label={t.title} value={q.title} onChange={(title) => up({ title })} maxLength={40} />
        <Field label={t.terminalTitle} value={q.terminalTitle} onChange={(terminalTitle) => up({ terminalTitle })} maxLength={24} />
      </Section>
      <Section title={t.blocks.quickstart}>
        <AnimatePresence initial={false}>
          {steps.map((step, idx) => (
            <motion.div key={idx} className="group-card" layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={spring}>
              <div className="group-head">
                <Field value={step.label} placeholder={t.stepLabel} onChange={(label) => upStep(idx, { label })} maxLength={32} />
                <IconButton icon="delete" title={t.remove} onClick={() => up({ steps: steps.filter((_, i) => i !== idx) })} />
              </div>
              <Field label={t.stepCode} value={step.code} placeholder="npm run dev" onChange={(code) => upStep(idx, { code })} maxLength={80} />
            </motion.div>
          ))}
        </AnimatePresence>
        {steps.length < 5 && (
          <Button kind="outlined" icon="add" onClick={() => up({ steps: [...steps, { label: "Run", code: "npm start" }] })}>
            {t.addStep}
          </Button>
        )}
      </Section>
    </>
  );
}

// Stack
function Stack({ c, set, t, d }: Props) {
  const groups = c.stack.groups;
  const up = (v: Partial<Config["stack"]>) => set((c) => ({ ...c, stack: { ...c.stack, ...v } }));
  const upGroup = (i: number, v: Partial<Config["stack"]["groups"][number]>) => up({ groups: groups.map((g, j) => (j === i ? { ...g, ...v } : g)) });
  const autoDetect = () => {
    const isRu = /[а-яё]/i.test(c.hero.subtitle || c.stack.title);
    up({ groups: detectTechStack(d, isRu ? "ru" : "en") });
  };
  return (
    <>
      <Section>
        <Field label={t.title} value={c.stack.title} onChange={(title) => up({ title })} maxLength={40} />
        <Button kind="tonal" icon="auto_awesome" onClick={autoDetect}>
          {t.autoDetectStack}
        </Button>
      </Section>
      <AnimatePresence initial={false}>
        {groups.map((g, i) => (
          <motion.div key={i} className="group-card" layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={spring}>
            <div className="group-head">
              <Field value={g.title} placeholder={t.groupTitle} onChange={(title) => upGroup(i, { title })} maxLength={24} />
              <IconButton icon="delete" title={t.remove} onClick={() => up({ groups: groups.filter((_, j) => j !== i) })} />
            </div>
            <ItemList items={g.items} onChange={(items) => upGroup(i, { items })} t={t} max={14} prefer="brands" fresh={{ icon: "brand:github", label: "" }} />
          </motion.div>
        ))}
      </AnimatePresence>
      {groups.length < 5 && (
        <Button kind="outlined" icon="add" onClick={() => up({ groups: [...groups, { title: "Tools", items: [] }] })}>
          {t.addGroup}
        </Button>
      )}
    </>
  );
}

// Stats
function Stats({ c, set, t }: Props) {
  const s = c.stats;
  const up = (v: Partial<Config["stats"]>) => set((c) => ({ ...c, stats: { ...c.stats, ...v } }));
  return (
    <>
      <Section>
        <Field label={t.title} value={s.title} onChange={(title) => up({ title })} maxLength={40} />
      </Section>
      <Section title={t.blocks.stats}>
        <div className="grid2">
          <Field value={s.stars} onChange={(stars) => up({ stars })} maxLength={24} />
          <Field value={s.forks} onChange={(forks) => up({ forks })} maxLength={24} />
          <Field value={s.issues} onChange={(issues) => up({ issues })} maxLength={24} />
          <Field value={s.watchers} onChange={(watchers) => up({ watchers })} maxLength={24} />
        </div>
      </Section>
      <Section>
        <Switch label={t.showLanguages} value={s.showLanguages} onChange={(showLanguages) => up({ showLanguages })} />
        {s.showLanguages && <Field label={t.languagesLabel} value={s.languages} onChange={(languages) => up({ languages })} maxLength={60} />}
      </Section>
    </>
  );
}

// Buttons
function Buttons({ c, set, t }: Props) {
  const items = c.buttons.items;
  const up = (next: typeof items) => set((c) => ({ ...c, buttons: { ...c.buttons, items: next } }));
  return (
    <>
      <Switch label={t.cardBg} value={!!c.buttons.card} onChange={(card) => set((c) => ({ ...c, buttons: { ...c.buttons, card } }))} />
      <AnimatePresence initial={false}>
        {items.map((b, i) => {
          const setB = (v: Partial<typeof b>) => up(items.map((x, j) => (j === i ? { ...x, ...v } : x)));
          return (
            <motion.div key={i} className="group-card" layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={spring}>
              <div className="group-head">
                <IconSelect value={b.icon} onChange={(icon) => setB({ icon })} t={t} />
                <Field value={b.label} placeholder={t.label} onChange={(label) => setB({ label })} maxLength={28} />
                <IconButton icon="delete" title={t.remove} onClick={() => up(items.filter((_, j) => j !== i))} />
              </div>
              <Field label={t.link} value={b.url} placeholder={t.linkPlaceholder} onChange={(url) => setB({ url })} />
              <Segmented value={b.style} onChange={(style) => setB({ style })} options={[["filled", t.filled], ["tonal", t.tonal]]} />
            </motion.div>
          );
        })}
      </AnimatePresence>
      {items.length < 5 && (
        <Button kind="outlined" icon="add" onClick={() => up([...items, { icon: "link", label: "Link", url: "", style: "tonal" }])}>
          {t.add}
        </Button>
      )}
    </>
  );
}

// Style
export const SEEDS = ["#6750A4", "#FF5CA8", "#B36CFF", "#5C7CFF", "#2BB3C0", "#3DAA6B", "#C9A800", "#FF8A3D"];

function Style({ c, set, t, avatarSeed, onReset, onImage }: Props & { avatarSeed: string | null; onReset: () => void; onImage: (f: File) => void }) {
  const preset = activePreset(c);
  return (
    <>
      <Section title={t.templates}>
        <div className="presets">
          {(Object.keys(PRESETS) as PresetId[]).map((id) => (
            <motion.button key={id} type="button" className={`preset${preset === id ? " on" : ""}`} onClick={() => set((c) => applyPreset(c, id))} whileTap={{ scale: 0.94 }} transition={bouncy}>
              <span className="preset-bars">
                {PRESETS[id].filter((b) => b !== "wave").slice(0, 5).map((b) => (
                  <span key={b} className={`bar bar-${b}`} />
                ))}
              </span>
              <span>{t.presets[id]}</span>
            </motion.button>
          ))}
        </div>
      </Section>
      <Section title={t.seed}>
        <div className="swatches">
          {SEEDS.map((s) => (
            <motion.button key={s} type="button" className={`swatch${c.seed.toUpperCase() === s ? " on" : ""}`} style={{ background: s }} onClick={() => set((c) => ({ ...c, seed: s, seedFromAvatar: false }))} whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }} transition={bouncy} aria-label={s}>
              {c.seed.toUpperCase() === s && <Glyph name="check" size={20} />}
            </motion.button>
          ))}
          <label className={`swatch custom${!SEEDS.includes(c.seed.toUpperCase()) ? " on" : ""}`} title={t.custom} style={{ background: c.seed }}>
            <Glyph name="palette" size={20} />
            <input type="color" value={c.seed} onChange={(e) => set((c) => ({ ...c, seed: e.target.value.toUpperCase(), seedFromAvatar: false }))} />
          </label>
        </div>
        <label className="from-avatar file">
          <Glyph name="add_photo_alternate" size={22} />
          {t.fromImage}
          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImage(f); e.target.value = ""; }} />
        </label>
        {avatarSeed && (
          <button type="button" className={`from-avatar${c.seedFromAvatar ? " on" : ""}`} onClick={() => set((c) => ({ ...c, seed: avatarSeed, seedFromAvatar: true }))}>
            <span className="dot" style={{ background: avatarSeed }} />
            {t.fromAvatar}
          </button>
        )}
      </Section>
      <Section title={t.scheme}>
        <div className="chips-wrap">
          {(Object.keys(t.schemes) as SchemeName[]).map((s) => (
            <motion.button key={s} type="button" layout className={`filter-chip${c.scheme === s ? " on" : ""}`} onClick={() => set((c) => ({ ...c, scheme: s }))} whileTap={{ scale: 0.92 }} transition={bouncy}>
              {c.scheme === s && <Glyph name="check" size={18} />}
              {t.schemes[s]}
            </motion.button>
          ))}
        </div>
      </Section>
      <Section>
        <Switch label={t.iconFill} value={c.iconFill !== false} onChange={(iconFill) => set((c) => ({ ...c, iconFill }))} />
        <Switch label={t.motion} value={c.motion} onChange={(motion) => set((c) => ({ ...c, motion }))} />
      </Section>
      <Section>
        <Button kind="text" icon="restart_alt" onClick={onReset}>{t.reset}</Button>
      </Section>
    </>
  );
}

export function SheetBody({ id, ...p }: Props & { id: SheetId; avatarSeed: string | null; onReset: () => void; onImage: (f: File) => void }) {
  if (id === "hero") return <Hero {...p} />;
  if (id === "features") return <Features {...p} />;
  if (id === "quickstart") return <Quickstart {...p} />;
  if (id === "stack") return <Stack {...p} />;
  if (id === "stats") return <Stats {...p} />;
  if (id === "buttons") return <Buttons {...p} />;
  return <Style {...p} />;
}
