import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList, ComposedChart, Line, Legend,
} from "recharts";

const C = {
  ink: "#10242E", slate: "#37535F", paper: "#F5F2EC", line: "#D9D2C5",
  kelp: "#3C6E5A", brine: "#5B8CA3", coral: "#E07856", coralDeep: "#C25C3D",
  gold: "#C9A24B", muted: "#7C8A8F", salmon: "#E07856", mussel: "#3C6E5A",
};

const fmt$ = (n) => "$" + n.toLocaleString("en-NZ", { maximumFractionDigits: 0 });
const fmtM = (n) => "$" + (n / 1e6).toLocaleString("en-NZ", { maximumFractionDigits: 1 }) + "m";
const fmt$2 = (n) => "$" + n.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n) => (n * 100).toFixed(1) + "%";
const fmtKg = (n) => (n / 1000).toLocaleString("en-NZ", { maximumFractionDigits: 0 }) + " t";

// Real-data anchored defaults (see Sources panel)
const SPECIES = {
  salmon: {
    label: "King Salmon", color: C.salmon,
    farmgate: 19.23, cop: 15.0, volume: 6582000, mortality: 0.12,
    procMU: 0.30, expMU: 0.18, distMU: 0.22, retailMU: 0.40,
    shExport: 0.70, shFood: 0.22, shDTC: 0.08, fulfil: 4.5, marketing: 3.0,
  },
  mussel: {
    label: "Greenshell Mussels", color: C.mussel,
    farmgate: 3.41, cop: 3.2, volume: 30000000, mortality: 0.10,
    procMU: 0.40, expMU: 0.22, distMU: 0.25, retailMU: 0.45,
    shExport: 0.85, shFood: 0.12, shDTC: 0.03, fulfil: 3.0, marketing: 1.5,
  },
};

const SOURCES = [
  ["NZ aquaculture revenue ~$760m (2023); $3bn govt target by 2030", "MPI / NZ Aquaculture Development Plan 2025–2030"],
  ["King salmon >14,500 t, mussels >93,000 t harvested (2023)", "Aquaculture NZ 2023 Sector Overview"],
  ["NZ King Salmon FY25: $211.0m revenue on 6,582 t ≈ $32/kg; 6.3% margin", "NZK FY25 results (NZX:NZK)"],
  ["Mussel wholesale US$3.72–8.04/kg; NZ retail NZD 8.44–18.28/kg (2025)", "Selina Wamucii market prices Nov 2025"],
  ["Frozen half-shell mussels top export at $257.3m; salmon $129.5m", "NZ Aquaculture Development Plan, export table"],
];

function computeSpecies(a) {
  const saleable = a.volume * (1 - a.mortality);
  const procOut = a.farmgate * (1 + a.procMU);
  const expOut = procOut * (1 + a.expMU);
  const distOut = expOut * (1 + a.distMU);
  const retailOut = distOut * (1 + a.retailMU);
  const consumer = retailOut;
  const stages = [
    { name: "Farmer", margin: a.farmgate - a.cop },
    { name: "Processor", margin: procOut - a.farmgate },
    { name: "Exporter", margin: expOut - procOut },
    { name: "Distributor", margin: distOut - expOut },
    { name: "Retail", margin: retailOut - distOut },
  ];
  const farmerShare = (a.farmgate - a.cop) / consumer;
  const channels = [
    { key: "export", name: "Export", color: C.kelp, share: a.shExport, priceRecv: a.farmgate, extra: 0 },
    { key: "food", name: "Foodservice", color: C.brine, share: a.shFood, priceRecv: procOut, extra: 0 },
    { key: "dtc", name: "Direct", color: C.coral, share: a.shDTC, priceRecv: retailOut, extra: a.fulfil + a.marketing },
  ].map((c) => {
    const vol = saleable * c.share;
    const netMargin = c.priceRecv - a.cop - c.extra;
    return { ...c, vol, netMargin, marginPct: netMargin / c.priceRecv, totalProfit: netMargin * vol };
  });
  const blended = channels.reduce((s, c) => s + c.totalProfit, 0);
  return { saleable, consumer, stages, farmerShare, channels, blended, buildup: [
    { name: "Farm gate", value: a.farmgate, type: "base" },
    { name: "Processor", value: stages[1].margin, type: "add" },
    { name: "Exporter", value: stages[2].margin, type: "add" },
    { name: "Distributor", value: stages[3].margin, type: "add" },
    { name: "Retail", value: stages[4].margin, type: "add" },
  ] };
}

export default function NZAquacultureDashboard() {
  const [sp, setSp] = useState("salmon");
  const [overrides, setOverrides] = useState({ salmon: {}, mussel: {} });

  const a = useMemo(() => ({ ...SPECIES[sp], ...overrides[sp] }), [sp, overrides]);
  const set = (k) => (v) => setOverrides((p) => ({ ...p, [sp]: { ...p[sp], [k]: v } }));
  const reset = () => setOverrides((p) => ({ ...p, [sp]: {} }));

  const m = useMemo(() => computeSpecies(a), [a]);
  const other = useMemo(() => computeSpecies({ ...SPECIES[sp === "salmon" ? "mussel" : "salmon"], ...overrides[sp === "salmon" ? "mussel" : "salmon"] }), [sp, overrides]);
  const mixTotal = a.shExport + a.shFood + a.shDTC;

  return (
    <div style={{ background: C.paper, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <header style={{ background: C.ink, color: C.paper, padding: "30px 36px 26px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>
            Aquaculture Commercial Strategy · Real NZ Data 2023–2025
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 36, margin: "8px 0 6px", lineHeight: 1.05 }}>
            NZ Aquaculture — Distribution Economics
          </h1>
          <p style={{ margin: 0, color: "#AEBEC2", fontSize: 15, maxWidth: 680 }}>
            Where margin is captured from farm gate to plate, and what a producer earns across export,
            foodservice and direct channels — anchored to published industry figures.
          </p>
          {/* Species toggle */}
          <div style={{ display: "inline-flex", marginTop: 18, background: "#1B3540", borderRadius: 10, padding: 4 }}>
            {Object.entries(SPECIES).map(([k, v]) => (
              <button key={k} onClick={() => setSp(k)} style={{
                border: "none", cursor: "pointer", padding: "9px 20px", borderRadius: 7, fontSize: 14, fontWeight: 600,
                background: sp === k ? v.color : "transparent", color: sp === k ? "#fff" : "#AEBEC2",
                transition: "all .2s",
              }}>{v.label}</button>
            ))}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "26px 36px 60px", display: "grid", gridTemplateColumns: "310px 1fr", gap: 30 }}>
        <aside>
          <Panel title="Assumptions" accent={a.color}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Editing: <b style={{ color: a.color }}>{a.label}</b></span>
              <button onClick={reset} style={{ fontSize: 11, border: `1px solid ${C.line}`, background: "#fff", borderRadius: 6, padding: "3px 9px", cursor: "pointer", color: C.slate }}>Reset</button>
            </div>
            <SubLabel>Farm economics</SubLabel>
            <Slider label="Farm-gate price" value={a.farmgate} min={1} max={30} step={0.25} onChange={set("farmgate")} format={fmt$2} hint="per kg" />
            <Slider label="Cost of production" value={a.cop} min={1} max={25} step={0.25} onChange={set("cop")} format={fmt$2} hint="per kg" />
            <Slider label="Production volume" value={a.volume} min={1000000} max={40000000} step={500000} onChange={set("volume")} format={fmtKg} />
            <Slider label="Mortality / loss" value={a.mortality} min={0} max={0.45} step={0.01} onChange={set("mortality")} format={fmtPct} hint="salmon hit 42% in 2022 heat" />
            <SubLabel>Stage markups</SubLabel>
            <Slider label="Processor" value={a.procMU} min={0} max={0.8} step={0.05} onChange={set("procMU")} format={fmtPct} />
            <Slider label="Exporter" value={a.expMU} min={0} max={0.8} step={0.05} onChange={set("expMU")} format={fmtPct} />
            <Slider label="Distributor" value={a.distMU} min={0} max={0.8} step={0.05} onChange={set("distMU")} format={fmtPct} />
            <Slider label="Retail / foodservice" value={a.retailMU} min={0} max={0.8} step={0.05} onChange={set("retailMU")} format={fmtPct} />
            <SubLabel>Channel mix</SubLabel>
            <Slider label="Export / wholesale" value={a.shExport} min={0} max={1} step={0.01} onChange={set("shExport")} format={fmtPct} />
            <Slider label="Domestic foodservice" value={a.shFood} min={0} max={1} step={0.01} onChange={set("shFood")} format={fmtPct} />
            <Slider label="Direct-to-consumer" value={a.shDTC} min={0} max={1} step={0.01} onChange={set("shDTC")} format={fmtPct} />
            <div style={{ fontSize: 12, marginTop: -4, marginBottom: 12, fontWeight: 600, color: Math.abs(mixTotal - 1) < 0.001 ? C.kelp : C.coralDeep }}>
              Mix total: {fmtPct(mixTotal)} {Math.abs(mixTotal - 1) < 0.001 ? "✓" : "— should be 100%"}
            </div>
            <SubLabel>DTC extra costs</SubLabel>
            <Slider label="Fulfilment / packaging" value={a.fulfil} min={0} max={8} step={0.25} onChange={set("fulfil")} format={fmt$2} hint="per kg" />
            <Slider label="Marketing / acquisition" value={a.marketing} min={0} max={8} step={0.25} onChange={set("marketing")} format={fmt$2} hint="per kg" />
          </Panel>
        </aside>

        <main style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            <Kpi label="Consumer price / kg" value={fmt$2(m.consumer)} sub="end of chain" accent={a.color} />
            <Kpi label="Farmer's share" value={fmtPct(m.farmerShare)} sub="of consumer $" accent={C.gold} />
            <Kpi label="Blended profit" value={fmtM(m.blended)} sub="all channels" />
            <Kpi label="Best margin %" value={fmtPct(Math.max(...m.channels.map((c) => c.marginPct)))} sub="DTC channel" accent={C.coral} />
          </div>

          <Panel title={`Margin build-up: farm gate → consumer (${a.label}, per kg)`} accent={C.brine}>
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={m.buildup} margin={{ top: 24, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.line} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.slate }} axisLine={{ stroke: C.line }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => "$" + v} />
                <Tooltip formatter={(v) => fmt$2(v)} contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 13 }} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {m.buildup.map((d, i) => <Cell key={i} fill={d.type === "base" ? C.gold : C.brine} />)}
                  <LabelList dataKey="value" position="top" formatter={(v) => "$" + v.toFixed(1)} style={{ fontSize: 11, fill: C.slate, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 12.5, color: C.muted, margin: "4px 4px 0" }}>
              Gold = farm-gate price the producer receives. Blue = margin added by each downstream party.
              Stacked height = consumer price.
            </p>
          </Panel>

          <Panel title="Who captures the consumer dollar?" accent={C.gold}>
            {m.stages.map((s) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}>
                <div style={{ width: 92, fontSize: 13, fontWeight: 600, textAlign: "right" }}>{s.name}</div>
                <div style={{ flex: 1, background: "#EAE4D8", borderRadius: 6, height: 24, overflow: "hidden" }}>
                  <div style={{ width: `${Math.max(s.margin / m.consumer, 0) * 100}%`, height: "100%", background: s.name === "Farmer" ? C.gold : C.slate, borderRadius: 6, transition: "width .3s" }} />
                </div>
                <div style={{ width: 52, fontSize: 13, fontWeight: 700, color: s.name === "Farmer" ? C.coralDeep : C.slate, fontVariantNumeric: "tabular-nums" }}>
                  {fmtPct(s.margin / m.consumer)}
                </div>
              </div>
            ))}
          </Panel>

          <Panel title="Channel economics: what the producer earns" accent={a.color}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
              {m.channels.map((c) => (
                <div key={c.key} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</span>
                  </div>
                  <Row k="Volume" v={fmtKg(c.vol)} />
                  <Row k="Price recv." v={fmt$2(c.priceRecv)} />
                  <Row k="Margin / kg" v={fmt$2(c.netMargin)} strong />
                  <Row k="Margin %" v={fmtPct(c.marginPct)} />
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
                    <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>Total profit</div>
                    <div style={{ fontSize: 19, fontWeight: 700, color: c.color, fontFamily: "'Fraunces', serif" }}>{fmtM(c.totalProfit)}</div>
                  </div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={m.channels} margin={{ top: 20, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.line} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.slate }} axisLine={{ stroke: C.line }} tickLine={false} />
                <YAxis yAxisId="l" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => "$" + (v / 1e6).toFixed(0) + "m"} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => (v * 100).toFixed(0) + "%"} />
                <Tooltip formatter={(v, n) => n === "Margin %" ? fmtPct(v) : fmtM(v)} contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 13 }} />
                <Bar yAxisId="l" dataKey="totalProfit" name="Total profit" radius={[5, 5, 0, 0]}>
                  {m.channels.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
                <Line yAxisId="r" dataKey="marginPct" name="Margin %" stroke={C.ink} strokeWidth={2} dot={{ r: 4, fill: C.ink }} />
              </ComposedChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 12.5, color: C.muted, margin: "4px 4px 0" }}>
              Bars (left) = total dollars per channel. Line (right) = margin % per kg. Direct earns the
              highest rate but the lowest volume — the central tension in any move downstream.
            </p>
          </Panel>

          {/* Species comparison */}
          <Panel title="Salmon vs mussels — blended profit" accent={C.slate}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart layout="vertical" data={[
                { name: SPECIES.salmon.label, value: sp === "salmon" ? m.blended : other.blended, fill: C.salmon },
                { name: SPECIES.mussel.label, value: sp === "mussel" ? m.blended : other.blended, fill: C.mussel },
              ]} margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.line} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => "$" + (v / 1e6).toFixed(0) + "m"} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: C.ink }} axisLine={false} tickLine={false} width={120} />
                <Tooltip formatter={(v) => fmtM(v)} contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 13 }} />
                <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                  <LabelList dataKey="value" position="right" formatter={(v) => fmtM(v)} style={{ fontSize: 12, fill: C.slate, fontWeight: 600 }} />
                  <Cell fill={C.salmon} /><Cell fill={C.mussel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <div style={{ background: C.ink, color: C.paper, borderRadius: 14, padding: "22px 26px" }}>
            <div style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: C.gold, fontWeight: 600, marginBottom: 8 }}>
              Business development takeaway
            </div>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "#DCE4E6" }}>
              Both species are export-led and the producer keeps a minority of the consumer dollar — value
              concentrates downstream. Salmon carries higher unit margin and a premium global position (NZ is
              ~75% of world King salmon), so branded foodservice and direct channels can defend price; the key
              risk is climate-driven mortality. Mussels are lower-priced and commodity-frozen at the base, but
              volume is vast and value-added lines (mussel oil exported $56.8m) point to where margin uplift
              lives. In both, the BD play is the same: move up the value ladder and recapture downstream margin.
            </p>
          </div>

          <Panel title="Data sources" accent={C.muted}>
            {SOURCES.map(([claim, src], i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: i < SOURCES.length - 1 ? `1px solid ${C.line}` : "none" }}>
                <span style={{ fontSize: 12.5, color: C.ink, flex: 1 }}>{claim}</span>
                <span style={{ fontSize: 11.5, color: C.muted, fontStyle: "italic", width: 200, textAlign: "right" }}>{src}</span>
              </div>
            ))}
            <p style={{ fontSize: 11, color: C.muted, marginTop: 12, marginBottom: 0 }}>
              Figures are public point-in-time estimates compiled for a portfolio model. Markups and channel
              mix are reasoned assumptions, editable above.
            </p>
          </Panel>
        </main>
      </div>
    </div>
  );
}

function Panel({ title, accent, children }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #E8E2D6", borderRadius: 16, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ width: 6, height: 18, borderRadius: 3, background: accent }} />
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: ".01em" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}
function SubLabel({ children }) {
  return <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: C.muted, fontWeight: 700, margin: "16px 0 12px" }}>{children}</div>;
}
function Slider({ label, value, min, max, step, onChange, format, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
        <span style={{ fontSize: 13, color: C.coralDeep, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} style={{ width: "100%", accentColor: C.coral, cursor: "pointer" }} />
      {hint && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{hint}</div>}
    </div>
  );
}
function Kpi({ label, value, sub, accent = C.slate }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E8E2D6", borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 25, fontWeight: 600, fontFamily: "'Fraunces', serif", color: accent, margin: "4px 0 2px", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>
    </div>
  );
}
function Row({ k, v, strong }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 0" }}>
      <span style={{ color: C.muted }}>{k}</span>
      <span style={{ fontWeight: strong ? 700 : 500, fontVariantNumeric: "tabular-nums" }}>{v}</span>
    </div>
  );
}
