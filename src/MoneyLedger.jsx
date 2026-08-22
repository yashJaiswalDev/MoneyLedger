import React, { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================
   MONEY LEDGER
   A passbook-style personal finance ledger.
   Signature device: every entry is posted into one of three
   columns — DEBIT | CREDIT | INVESTED. Investments physically
   never sit in the expense column.
   ============================================================ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Public+Sans:wght@400;500;600&display=swap');

.ml-root{
  --paper:#E7E5DC; --sheet:#FCFBF8; --ink:#1A1D24; --soft:#6E7280;
  --rule:#D6D2C6; --rule-soft:#E8E4DA; --field:#FFFFFF; --body:#3D424C;
  --ctl:40px; --ctlpad:8px 10px; --ctlfont:16px;
  --credit:#1B6B54; --debit:#A63A2A; --stamp:#27408B; --amber:#8F6212;
  color-scheme:light;
  background:var(--paper); color:var(--ink);
  font-family:'Public Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  font-size:15px; line-height:1.45; min-height:100vh; min-height:100dvh;
  -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%; text-size-adjust:100%;
  -webkit-tap-highlight-color:transparent; overscroll-behavior-y:contain;
}
.ml-root *{box-sizing:border-box;}
.ml-root button{font-family:inherit;cursor:pointer;-webkit-appearance:none;appearance:none;touch-action:manipulation;}
.ml-root input,.ml-root select,.ml-root textarea{font-family:inherit;font-size:var(--ctlfont);
  -webkit-appearance:none;appearance:none;border-radius:2px;max-width:100%;}
.ml-root :focus-visible{outline:2px solid var(--stamp);outline-offset:2px;}

/* One switch: every surface, rule and figure below reads from these. */
.ml-root[data-theme="dark"]{
  --paper:#13161B; --sheet:#1B1F26; --ink:#E9E7E1; --soft:#98A0AC;
  --rule:#2F343D; --rule-soft:#242932; --field:#20252D; --body:#C2C8D2;
  --credit:#4FBE99; --debit:#EC7C67; --stamp:#8AA0F0; --amber:#D8A74A;
  color-scheme:dark;
}
.ml-root[data-theme="dark"] .ml-face{filter:saturate(1.08) brightness(1.2);}
.ml-root[data-theme="dark"] .ml-toast{box-shadow:0 6px 20px rgba(0,0,0,.55);}
.ml-root[data-theme="dark"] .ml-facebar{background:rgba(255,255,255,.3);}
.ml-root,.ml-card,.ml-in,.ml-ta,.ml-seg button,.ml-btn,.ml-face,.ml-top{
  transition:background-color .18s ease,color .18s ease,border-color .18s ease;}

.ml-num{font-family:'IBM Plex Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;}
.ml-eyebrow{font-family:'Archivo',sans-serif;font-size:10.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--soft);}
.ml-h{font-family:'Archivo',sans-serif;font-weight:700;letter-spacing:-.01em;}

/* ---- shell ---- */
.ml-wrap{max-width:1060px;margin:0 auto;
  padding:0 calc(14px + env(safe-area-inset-right,0px)) calc(72px + env(safe-area-inset-bottom,0px)) calc(14px + env(safe-area-inset-left,0px));}
.ml-top{border-bottom:1px solid var(--rule);background:var(--paper);position:sticky;top:0;z-index:20;}
.ml-topin{max-width:1060px;margin:0 auto;
  padding:calc(14px + env(safe-area-inset-top,0px)) calc(14px + env(safe-area-inset-right,0px)) 0 calc(14px + env(safe-area-inset-left,0px));}
.ml-headline{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.ml-brandrow{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:2px;}
.ml-brand{font-family:'Archivo',sans-serif;font-weight:700;font-size:19px;letter-spacing:.04em;text-transform:uppercase;line-height:1;}
.ml-brand span{color:var(--stamp);}
.ml-brandsub{font-size:11px;color:var(--soft);margin-top:4px;letter-spacing:.02em;}
.ml-nw{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:2px;}
.ml-theme{width:36px;height:36px;min-height:36px;flex:0 0 auto;border:1px solid var(--rule);border-radius:2px;
  background:transparent;color:var(--ink);display:inline-flex;align-items:center;justify-content:center;}
.ml-theme:hover{background:var(--sheet);border-color:var(--ink);}
.ml-nwv{font-size:22px;font-weight:600;line-height:1.1;}
.ml-tabs{display:flex;gap:2px;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
.ml-tabs::-webkit-scrollbar{display:none;}
.ml-tab{background:none;border:0;border-bottom:2px solid transparent;padding:9px 12px;white-space:nowrap;
  font-family:'Archivo',sans-serif;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--soft);
  min-height:42px;flex:0 0 auto;}
.ml-tab:hover{color:var(--ink);}
.ml-tab[data-on="1"]{color:var(--ink);border-bottom-color:var(--stamp);}

/* ---- cards ---- */
.ml-card{background:var(--sheet);border:1px solid var(--rule);border-radius:3px;padding:14px;margin-top:12px;}
.ml-card>.ml-eyebrow:first-child{display:block;margin-bottom:10px;}
.ml-grid{display:grid;gap:12px;margin-top:12px;grid-template-columns:1fr;}
.ml-page{display:grid;gap:12px;margin-top:12px;grid-template-columns:1fr;}
.ml-page>*{min-width:0;margin-top:0;}
@media(min-width:680px){
  .ml-page{grid-template-columns:repeat(6,1fr);}
  .ml-page>.ml-w6{grid-column:span 6;}
  .ml-page>.ml-w3{grid-column:span 3;}
  .ml-page>.ml-w2{grid-column:span 2;}
}
.ml-grid>*{min-width:0;}
.ml-grid>.ml-card{margin-top:0;}
.ml-card{width:100%;}
.ml-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:3px;margin-top:12px;overflow:hidden;}
@media(min-width:680px){
  .ml-stats{grid-template-columns:repeat(var(--cols,4),1fr);}
  .ml-2{grid-template-columns:repeat(2,1fr);}
  .ml-3{grid-template-columns:repeat(3,1fr);}
}
.ml-stat{background:var(--sheet);padding:11px 12px;}
.ml-statv{font-size:17px;font-weight:600;margin-top:5px;line-height:1.2;}
.ml-statn{font-size:10.5px;color:var(--soft);margin-top:2px;}

/* ---- ledger rows ---- */
.ml-lhead,.ml-lrow{display:grid;grid-template-columns:minmax(0,1fr) 100px 100px 100px 26px;gap:8px;align-items:center;}
.ml-lhead{padding:0 0 6px;border-bottom:1px solid var(--rule);}
.ml-lhead div{font-family:'Archivo',sans-serif;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--soft);}
.ml-lhead div:not(:first-child){text-align:right;}
.ml-lrow{padding:9px 0;border-bottom:1px solid var(--rule-soft);}
.ml-lrow:last-child{border-bottom:0;}
.ml-ltitle{font-weight:500;font-size:14px;overflow-wrap:anywhere;}
.ml-lmeta{font-size:11px;color:var(--soft);margin-top:2px;overflow-wrap:anywhere;}
.ml-lcell{text-align:right;font-family:'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums;font-size:13px;}
.ml-debit{color:var(--debit);} .ml-credit{color:var(--credit);} .ml-invest{color:var(--stamp);}
.ml-x{background:none;border:0;color:var(--soft);font-size:17px;line-height:1;padding:2px 4px;border-radius:2px;
  min-width:32px;min-height:32px;display:inline-flex;align-items:center;justify-content:center;}
.ml-x:hover{color:var(--debit);background:var(--paper);}
.ml-eye{position:relative;}
@media(max-width:700px){
  .ml-lhead{display:none;}
  .ml-lrow{grid-template-columns:minmax(0,1fr) 26px;row-gap:3px;}
  .ml-lmain{grid-column:1;} .ml-x{grid-column:2;grid-row:1;}
  .ml-lcell{grid-column:1/-1;display:flex;justify-content:space-between;text-align:left;}
  .ml-lcell:empty{display:none;}
  .ml-lcell::before{content:attr(data-l);font-family:'Archivo',sans-serif;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--soft);}
}

/* ---- forms ---- */
.ml-form{display:grid;gap:9px;grid-template-columns:1fr;}
@media(min-width:620px){.ml-form{grid-template-columns:repeat(2,1fr);}.ml-span{grid-column:1/-1;}}
.ml-f label{display:block;font-family:'Archivo',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--soft);margin-bottom:3px;}
.ml-in{width:100%;padding:var(--ctlpad);border:1px solid var(--rule);border-radius:2px;background:var(--field);color:var(--ink);min-height:var(--ctl);line-height:1.25;font-size:var(--ctlfont);}
.ml-in:focus{border-color:var(--stamp);}
select.ml-in{-webkit-appearance:none;appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--soft) 50%),linear-gradient(135deg,var(--soft) 50%,transparent 50%);background-position:calc(100% - 15px) 51%,calc(100% - 10px) 51%;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:28px;}
.ml-btn{padding:8px 14px;border:1px solid var(--ink);background:var(--ink);color:var(--paper);border-radius:2px;
  font-family:'Archivo',sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
  min-height:var(--ctl);display:inline-flex;align-items:center;justify-content:center;text-align:center;}
.ml-btn:hover{background:#000;}
.ml-btn.ghost{background:transparent;color:var(--ink);border-color:var(--rule);}
.ml-btn.ghost:hover{background:var(--paper);border-color:var(--ink);}
.ml-btn.danger{background:transparent;color:var(--debit);border-color:var(--debit);}
.ml-btn.danger:hover{background:var(--debit);color:var(--sheet);}
.ml-btn.sm{padding:4px 10px;font-size:10px;min-height:30px;}
.ml-seg{display:inline-flex;border:1px solid var(--rule);border-radius:2px;overflow:hidden;}
.ml-seg button{padding:8px 16px;border:0;background:var(--field);color:var(--soft);font-family:'Archivo',sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;min-height:var(--ctl);}
.ml-seg button[data-on="1"]{background:var(--ink);color:var(--paper);}

/* ---- stamp (signature) ---- */
.ml-stamp{border:2px double var(--stamp);color:var(--stamp);border-radius:3px;padding:9px 14px;text-align:center;
  transform:rotate(-2.2deg);display:inline-block;background:transparent;animation:mlpress .45s cubic-bezier(.2,1.4,.4,1);}
@keyframes mlpress{from{transform:rotate(-9deg) scale(1.5);opacity:0;}to{transform:rotate(-2.2deg) scale(1);opacity:1;}}
.ml-stampt{font-family:'Archivo',sans-serif;font-size:9.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;}
.ml-stampv{font-family:'IBM Plex Mono',monospace;font-size:19px;font-weight:600;margin:2px 0;}
.ml-stampd{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.06em;}

/* ---- misc ---- */
.ml-bar{height:7px;background:var(--rule-soft);border-radius:1px;overflow:hidden;}
.ml-bar i{display:block;height:100%;background:var(--stamp);}
.ml-pill{display:inline-block;font-family:'Archivo',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
  border:1px solid var(--rule);border-radius:2px;padding:2px 6px;color:var(--soft);}
.ml-pill.on{border-color:var(--credit);color:var(--credit);}
.ml-pill.off{border-color:var(--amber);color:var(--amber);}
.ml-empty{border:1px dashed var(--rule);border-radius:3px;padding:20px;text-align:center;color:var(--soft);font-size:13px;}
.ml-tip{border-left:2px solid var(--stamp);padding:2px 0 2px 12px;margin-bottom:14px;}
.ml-tip b{font-family:'Archivo',sans-serif;font-size:12px;letter-spacing:.02em;display:block;margin-bottom:2px;}
.ml-tip p{margin:0;font-size:13px;color:var(--body);}
.ml-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:var(--ink);color:var(--paper);
  padding:9px 16px;border-radius:2px;font-size:13px;z-index:60;box-shadow:0 6px 20px rgba(0,0,0,.18);max-width:92vw;}
.ml-sub{font-size:12px;color:var(--soft);}
.ml-hr{border:0;border-top:1px solid var(--rule-soft);margin:14px 0;}
.ml-flex{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
.ml-between{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;}
.ml-ta{width:100%;min-height:100px;padding:9px;border:1px solid var(--rule);border-radius:2px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:16px;line-height:1.4;background:var(--field);color:var(--ink);word-break:break-all;}
/* ---- modal ---- */
.ml-scrim{position:fixed;inset:0;z-index:80;background:rgba(20,22,27,.45);display:flex;
  align-items:center;justify-content:center;padding:16px;}
.ml-modal{width:100%;max-width:440px;max-height:82vh;display:flex;flex-direction:column;
  background:var(--sheet);border:1px solid var(--rule);border-radius:4px;box-shadow:0 20px 50px rgba(0,0,0,.28);}
.ml-modalhead{display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:12px 14px;border-bottom:1px solid var(--rule);}
.ml-modalbody{padding:14px;overflow-y:auto;-webkit-overflow-scrolling:touch;}

/* ---- custom select ---- */
.ml-pick{position:relative;width:100%;}
.ml-pickbtn{width:100%;min-height:var(--ctl);padding:var(--ctlpad);padding-right:30px;border:1px solid var(--rule);border-radius:2px;
  background:var(--field);color:var(--ink);text-align:left;font-size:var(--ctlfont);line-height:1.25;
  display:flex;align-items:center;justify-content:space-between;gap:8px;}
.ml-pickbtn:hover{border-color:var(--soft);}
.ml-pick.open .ml-pickbtn{border-color:var(--stamp);}
.ml-picklabel{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ml-chev{position:absolute;right:12px;top:50%;width:7px;height:7px;border-right:1.5px solid var(--soft);
  border-bottom:1.5px solid var(--soft);transform:translateY(-70%) rotate(45deg);pointer-events:none;}
.ml-pick.open .ml-chev{transform:translateY(-30%) rotate(-135deg);border-color:var(--stamp);}
.ml-pickmenu{position:absolute;z-index:40;top:calc(100% + 4px);left:0;right:0;max-height:260px;overflow-y:auto;
  -webkit-overflow-scrolling:touch;background:var(--sheet);border:1px solid var(--rule);border-radius:3px;
  box-shadow:0 10px 28px rgba(0,0,0,.16);padding:4px;}
.ml-pickopt{display:flex;flex-direction:column;align-items:flex-start;gap:1px;width:100%;text-align:left;
  padding:9px 10px;border:0;background:none;color:var(--ink);border-radius:2px;font-size:14px;min-height:40px;}
.ml-pickopt:hover{background:var(--paper);}
.ml-pickopt.on{background:var(--paper);font-weight:600;}
.ml-pickopt.on::after{content:"✓";position:absolute;right:14px;color:var(--stamp);}
.ml-pickhint{font-size:11px;color:var(--soft);font-weight:400;}
.ml-pick.sm .ml-pickbtn{min-height:34px;padding:5px 26px 5px 8px;font-size:12px;border-color:transparent;background:transparent;}
.ml-pick.sm .ml-chev{right:8px;width:6px;height:6px;}
.ml-pick.sm .ml-pickmenu{left:auto;right:0;min-width:210px;}

/* ---- custom date field ---- */
.ml-cal{position:absolute;z-index:40;top:calc(100% + 4px);left:0;width:280px;max-width:calc(100vw - 40px);
  background:var(--sheet);border:1px solid var(--rule);border-radius:3px;box-shadow:0 10px 28px rgba(0,0,0,.16);padding:10px;}
.ml-calhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.ml-calnav{width:30px;height:30px;min-height:30px;border:1px solid var(--rule);border-radius:2px;background:none;
  color:var(--ink);display:inline-flex;align-items:center;justify-content:center;font-size:15px;line-height:1;}
.ml-calnav:hover{border-color:var(--ink);}
.ml-calmon{font-family:'Archivo',sans-serif;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;}
.ml-calgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
.ml-caldow{font-family:'Archivo',sans-serif;font-size:9px;font-weight:600;letter-spacing:.06em;color:var(--soft);
  text-align:center;padding:4px 0;text-transform:uppercase;}
.ml-calday{aspect-ratio:1/1;min-height:32px;border:0;background:none;border-radius:2px;color:var(--ink);
  font-family:'IBM Plex Mono',monospace;font-size:12.5px;display:flex;align-items:center;justify-content:center;}
.ml-calday:hover{background:var(--paper);}
.ml-calday.on{background:var(--ink);color:var(--paper);font-weight:600;}
.ml-calday.today{box-shadow:inset 0 0 0 1px var(--stamp);}
.ml-calday.mute{visibility:hidden;}
.ml-calfoot{display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid var(--rule-soft);}

/* ---- wallet faces ---- */
.ml-wallet{display:flex;gap:12px;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;
  scroll-snap-type:x mandatory;padding:2px 0 6px;scrollbar-width:none;}
.ml-wallet::-webkit-scrollbar{display:none;}
.ml-face{flex:0 0 62%;max-width:240px;scroll-snap-align:start;border:0;border-radius:10px;padding:11px 12px;
  color:#fff;text-align:left;display:flex;flex-direction:column;justify-content:space-between;
  min-height:110px;aspect-ratio:1.586/1;font-family:inherit;transition:box-shadow .15s ease;}
.ml-face.on{box-shadow:0 0 0 2px var(--paper),0 0 0 4px var(--ink);}
@media(min-width:780px){
  .ml-wallet{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));overflow:visible;}
  .ml-face{flex:none;max-width:260px;}
}
.ml-facetop{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;}
.ml-facename{font-family:'Archivo',sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;line-height:1.25;overflow-wrap:anywhere;}
.ml-facesub{font-size:11px;opacity:.72;margin-top:3px;}
.ml-chip{width:30px;height:22px;border-radius:4px;background:rgba(255,255,255,.26);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.45);flex:0 0 auto;position:relative;}
.ml-chip::after{content:"";position:absolute;left:4px;right:4px;top:50%;height:1px;background:rgba(255,255,255,.4);}
.ml-facebar{height:4px;border-radius:2px;background:rgba(255,255,255,.24);overflow:hidden;margin-top:10px;}
.ml-facebar i{display:block;height:100%;background:rgba(255,255,255,.85);}
.ml-facefoot{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-top:10px;}
.ml-facelab{font-family:'Archivo',sans-serif;font-size:8.5px;font-weight:600;letter-spacing:.14em;
  text-transform:uppercase;opacity:.72;}
.ml-faceval{font-size:13.5px;font-weight:600;margin-top:2px;}
.ml-filter{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;}
/* Desktop has no zoom-on-focus problem, so controls can tighten up there. */
@media(min-width:780px){
  .ml-root{--ctl:34px; --ctlpad:6px 9px; --ctlfont:14px;}
}
@media(prefers-reduced-motion:reduce){.ml-root *{animation:none!important;transition:none!important;}}
`;

/* ---------- helpers ---------- */
const uid = () => Math.random().toString(36).slice(2, 10);
const isoOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const TODAY = () => isoOf(new Date());
const dayMs = 86400000;
const parseISO = (s) => new Date(`${s}T00:00:00`);
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / dayMs);
const addDays = (s, n) => isoOf(new Date(parseISO(s).getTime() + n * dayMs));
const addMonths = (s, n) => {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1 + n, 1);
  const last = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
  dt.setDate(Math.min(d, last));
  return isoOf(dt);
};
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (s) => {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d} ${MON[Number(m) - 1]} ${y.slice(2)}`;
};
const monthLabel = (key) => `${MON[Number(key.slice(5, 7)) - 1]} ${key.slice(2, 4)}`;
const num = (v) => {
  const n = parseFloat(v);
  return isFinite(n) ? n : 0;
};
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const fmt = (n, dp = 2) =>
  "₹" + (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp });
const fmt0 = (n) => fmt(n, 0);
const compact = (n) => {
  const a = Math.abs(n);
  if (a >= 1e7) return "₹" + (n / 1e7).toFixed(1) + "Cr";
  if (a >= 1e5) return "₹" + (n / 1e5).toFixed(1) + "L";
  if (a >= 1e3) return "₹" + Math.round(n / 1e3) + "k";
  return "₹" + Math.round(n);
};

/* Categories that are never counted as a standard expense. */
/* Categories that start out excluded from spend analysis. The user can change
   any of these, and exclude or include any category they add. */
const DEFAULT_EXCLUDED = ["Investment", "Transfer", "Card Payment", "Settlement", "Refund"];
/* Excluded categories still move the balance — they just don't count as spending. */
const isExcluded = (config, cat) => (config.excluded || DEFAULT_EXCLUDED).includes(cat);
const BASE_CATEGORIES = [
  "Groceries", "Dining", "Utilities", "Rent", "Travel", "Fuel", "Shopping",
  "Health", "Entertainment", "Subscriptions", "Education", "Loan EMI",
  "Investment", "Transfer", "Card Payment", "Settlement", "Refund", "Other",
];
/* What a credit into an account can be. None of these count as income —
   income is the figure you set in Settings and is never a ledger entry. */
const DEPOSIT_KINDS = [
  ["Settlement", "a friend paying you back for a shared bill"],
  ["Transfer", "moved in from another account of yours, or salary landing"],
  ["Refund", "money returned to you"],
  ["Other", "anything else that raises the balance"],
];

/* Flat printed-ink tones, cycled by position. Deeper set for cards, cooler set for accounts. */
const CARD_INKS = ["#27408B", "#5C2E3E", "#2F4F4F", "#4A3B6B", "#7A3B22", "#1F3A5F"];
const ACC_INKS = ["#1F6F5C", "#3E5C76", "#6B5B3E", "#4E6E58", "#5B4B6E", "#2F5D62"];
const inkFor = (set, i) => set[i % set.length];

/* ---------- storage (window.storage in Claude, localStorage elsewhere) ---------- */
const KEY = "money-ledger-v1";
const store = {
  async load() {
    try {
      if (typeof window !== "undefined" && window.storage && window.storage.get) {
        const res = await window.storage.get(KEY, false);
        if (res && res.value) return JSON.parse(res.value);
      }
    } catch (e) { /* key absent — fall through */ }
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage blocked */ }
    return null;
  },
  async save(state) {
    const payload = JSON.stringify(state);
    try {
      if (typeof window !== "undefined" && window.storage && window.storage.set) {
        await window.storage.set(KEY, payload, false);
        return "cloud";
      }
    } catch (e) { /* fall through */ }
    try {
      window.localStorage.setItem(KEY, payload);
      return "local";
    } catch (e) { return "none"; }
  },
};

/* ---------- icons ---------- */
const SunIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
  </svg>
);
const MoonIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.5 14.8A8.6 8.6 0 1 1 9.2 3.5a6.9 6.9 0 0 0 11.3 11.3z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 6.5h16M9.5 6.5V4.8h5v1.7M6.4 6.5l.8 12.1a1.5 1.5 0 0 0 1.5 1.4h6.6a1.5 1.5 0 0 0 1.5-1.4l.8-12.1M10.2 10v6.4M13.8 10v6.4" />
  </svg>
);
const EyeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.9" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.6 6.1A9.6 9.6 0 0 1 12 5.8c6 0 9.5 6.2 9.5 6.2a17 17 0 0 1-3 3.8M6.4 8.1A17 17 0 0 0 2.5 12S6 18.2 12 18.2c1.3 0 2.4-.3 3.4-.7" />
    <path d="M10 10a2.9 2.9 0 0 0 4 4M3.5 3.5l17 17" />
  </svg>
);

/* Figures the user may not want visible over their shoulder. Ledger entries
   stay readable; balances and totals are what get hidden. */
let MASKED = false;
const mask = (v) => (MASKED ? "••••" : v);

/* ---------- initial state ---------- */
const blank = () => ({
  config: {
    repoRate: 5.25,          // set in the Settings tab — the only source of the rate
    monthlyIncome: 0,
    hidden: false,
    excluded: DEFAULT_EXCLUDED.slice(),
    lastBackup: "",
    theme: "",
    categories: BASE_CATEGORIES.slice(),
  },
  accounts: [
    { id: uid(), name: "Salary account", type: "Savings", earningInterest: true, balance: 0, lastAccrual: TODAY(), interestEarned: 0 },
    { id: uid(), name: "Emergency fund", type: "Savings", earningInterest: true, balance: 0, lastAccrual: TODAY(), interestEarned: 0 },
    { id: uid(), name: "Cash wallet", type: "Cash", earningInterest: false, balance: 0, lastAccrual: TODAY(), interestEarned: 0 },
  ],
  cards: [{ id: uid(), name: "Primary credit card", limit: 200000 }],
  spends: [],       // credit-card ledger
  savingsTx: [],    // deposits, withdrawals, interest, auto-debits, card payments
  emis: [],         // friends' purchases on your card
  repayments: [],   // money friends paid back
  recurring: [],    // loans, rent, SIPs, subscriptions
  budgets: {},      // category -> monthly amount
});

/* ---------- engines ---------- */
/* Daily interest. Rate is read from config only — never hardcoded here. */
/* Daily interest, driven solely by the RBI repo rate held in config.
   The rate is annual (% p.a.); each day earns rate/365, compounded daily.
   One entry covers the whole gap since you were last here, so the total is the
   same whether you open the app every day or once a year. */
function runAccrual(d) {
  const today = TODAY();
  const rate = num(d.config.repoRate);
  const perDay = rate / 100 / 365;
  const posted = [];

  d.accounts.forEach((a) => {
    if (!a.lastAccrual) a.lastAccrual = today;
    if (!a.earningInterest || !(perDay > 0)) { a.lastAccrual = today; return; }

    const days = daysBetween(a.lastAccrual, today);
    if (!(days > 0) || !(a.balance > 0)) { a.lastAccrual = today; return; }

    const interest = r2(a.balance * (Math.pow(1 + perDay, days) - 1));
    a.lastAccrual = today;
    if (!(interest > 0)) return;

    a.balance = r2(a.balance + interest);
    a.interestEarned = r2((a.interestEarned || 0) + interest);
    d.savingsTx.push({
      id: uid(), date: today, accountId: a.id, type: "interest", amount: interest,
      category: "Interest", note: `${days} day${days > 1 ? "s" : ""} @ ${rate.toFixed(2)}% p.a.`,
    });
    posted.push({ account: a.name, amount: interest });
  });

  return posted;
}

/* Scheduled loans / rent / SIPs / subscriptions deduct themselves. */
function runRecurring(d) {
  const today = TODAY();
  const fired = [];
  d.recurring.forEach((r) => {
    if (!r.active) return;
    let guard = 0;
    while (r.nextDue && r.nextDue <= today && guard < 60) {
      if (r.totalInstallments && r.paidInstallments >= r.totalInstallments) { r.active = false; break; }
      const when = r.nextDue;
      if (r.sourceType === "savings") {
        const acc = d.accounts.find((a) => a.id === r.sourceId);
        if (!acc) { r.active = false; break; }
        acc.balance = r2(acc.balance - num(r.amount));
        d.savingsTx.push({
          id: uid(), date: when, accountId: acc.id, type: "auto", amount: num(r.amount),
          category: r.category, note: `Auto: ${r.name}`,
          shareAmount: num(r.shareAmount), shareFriend: r.shareFriend || "",
        });
      } else {
        const card = d.cards.find((c) => c.id === r.sourceId);
        if (!card) { r.active = false; break; }
        d.spends.push({
          id: uid(), date: when, cardId: card.id, amount: num(r.amount),
          category: r.category, note: `Auto: ${r.name}`, auto: true,
          shareAmount: num(r.shareAmount), shareFriend: r.shareFriend || "",
        });
      }
      r.paidInstallments = (r.paidInstallments || 0) + 1;
      r.nextDue = r.frequency === "weekly" ? addDays(when, 7)
        : r.frequency === "quarterly" ? addMonths(when, 3)
        : r.frequency === "yearly" ? addMonths(when, 12)
        : addMonths(when, 1);
      if (r.totalInstallments && r.paidInstallments >= r.totalInstallments) r.active = false;
      fired.push(r.name);
      guard++;
    }
  });
  return fired;
}

const emiMonthly = (e) => (num(e.months) > 0 ? r2(num(e.principal) / num(e.months)) : 0);
const emiDueCount = (e) => {
  const today = TODAY();
  let n = 0;
  for (let i = 0; i < num(e.months); i++) if (addMonths(e.startDate, i) <= today) n++;
  return n;
};

/* ---------- sample data ---------- */
function sampleData() {
  const d = blank();
  const t = TODAY();
  d.config.monthlyIncome = 115000;
  const [sal, emg, cash] = d.accounts;
  sal.balance = 184500; sal.lastAccrual = addDays(t, -4);
  emg.balance = 260000; emg.type = "Savings (FD linked)"; emg.lastAccrual = addDays(t, -4);
  cash.balance = 4200;
  d.cards.push({ id: uid(), name: "Travel card", limit: 120000 });
  const c1 = d.cards[0].id, c2 = d.cards[1].id;
  const rows = [
    [2, "Groceries", 3480, "Weekly big basket", c1], [3, "Dining", 920, "Team lunch", c1],
    [5, "Fuel", 2100, "Petrol", c1], [7, "Subscriptions", 649, "Music + storage", c1],
    [9, "Investment", 15000, "Index fund lumpsum", c1], [11, "Shopping", 4599, "Running shoes", c2],
    [14, "Utilities", 1870, "Electricity", c1], [16, "Groceries", 2960, "Restock", c1],
    [19, "Travel", 8450, "Weekend trip tickets", c2], [22, "Dining", 1640, "Dinner out", c2],
    [26, "Health", 3200, "Dental checkup", c1], [31, "Groceries", 3310, "Monthly stock", c1],
    [35, "Entertainment", 1180, "Concert", c2], [40, "Dining", 780, "Cafe", c1],
    [44, "Investment", 15000, "Index fund lumpsum", c1], [48, "Utilities", 1790, "Broadband + gas", c1],
    [52, "Shopping", 2250, "Home stuff", c2], [57, "Groceries", 3050, "Restock", c1],
  ];
  rows.forEach(([ago, category, amount, note, cardId]) => {
    d.spends.push({ id: uid(), date: addDays(t, -ago), cardId, amount, category, note, shareAmount: 0, shareFriend: "" });
  });
  /* shared bills — you paid in full, half comes back */
  const shared1 = { id: uid(), date: addDays(t, -8), cardId: c1, amount: 6400, category: "Groceries", note: "Household restock (split)", shareAmount: 3200, shareFriend: "Arjun" };
  const shared2 = { id: uid(), date: addDays(t, -21), cardId: c1, amount: 5200, category: "Utilities", note: "Electricity + water (split)", shareAmount: 2600, shareFriend: "Arjun" };
  d.spends.push(shared1, shared2);
  d.savingsTx.push({ id: uid(), date: addDays(t, -18), accountId: sal.id, type: "settlement", amount: 2600, category: "Settlement", flowId: shared2.id, friend: "Arjun", note: "Settled: Electricity + water (split) — Arjun" });
  d.savingsTx.push({ id: uid(), date: addDays(t, -30), accountId: sal.id, type: "deposit", amount: 115000, category: "Salary", note: "Monthly salary" });
  d.savingsTx.push({ id: uid(), date: addDays(t, -28), accountId: emg.id, type: "deposit", amount: 20000, category: "Transfer", note: "Emergency top-up" });
  const emi1 = { id: uid(), friend: "Rahul", item: "iPhone 16", cardId: c1, principal: 72000, months: 6, startDate: addDays(t, -70), note: "No-cost EMI" };
  const emi2 = { id: uid(), friend: "Sneha", item: "Laptop", cardId: c2, principal: 54000, months: 6, startDate: addDays(t, -40), note: "" };
  d.emis.push(emi1, emi2);
  d.repayments.push({ id: uid(), emiId: emi1.id, date: addDays(t, -60), amount: 12000, note: "Installment 1" });
  d.repayments.push({ id: uid(), emiId: emi1.id, date: addDays(t, -30), amount: 12000, note: "Installment 2" });
  d.repayments.push({ id: uid(), emiId: emi2.id, date: addDays(t, -10), amount: 9000, note: "Installment 1" });
  d.recurring.push({ id: uid(), name: "Home loan", amount: 24800, frequency: "monthly", nextDue: addDays(t, 6), sourceType: "savings", sourceId: sal.id, category: "Loan EMI", totalInstallments: 180, paidInstallments: 34, active: true });
  d.recurring.push({ id: uid(), name: "Rent", amount: 21000, frequency: "monthly", nextDue: addDays(t, 9), sourceType: "savings", sourceId: sal.id, category: "Rent", totalInstallments: 0, paidInstallments: 0, active: true, shareAmount: 10500, shareFriend: "Arjun" });
  d.recurring.push({ id: uid(), name: "SIP — Nifty 50", amount: 10000, frequency: "monthly", nextDue: addDays(t, 3), sourceType: "savings", sourceId: sal.id, category: "Investment", totalInstallments: 0, paidInstallments: 0, active: true });
  d.recurring.push({ id: uid(), name: "OTT bundle", amount: 599, frequency: "monthly", nextDue: addDays(t, 12), sourceType: "card", sourceId: c1, category: "Subscriptions", totalInstallments: 0, paidInstallments: 0, active: true });
  d.budgets = { Groceries: 12000, Dining: 5000, Travel: 8000, Shopping: 6000, Utilities: 4000, Investment: 25000 };
  return d;
}

/* ============================================================ */

export default function MoneyLedger() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState("");
  const [view, setView] = useState("total");
  const [hidden, setHidden] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch (e) { return "light"; }
  });
  const [posted, setPosted] = useState([]);
  const [where, setWhere] = useState("");
  const loaded = useRef(false);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await store.load();
      const d = saved ? { ...blank(), ...saved, config: { ...blank().config, ...(saved.config || {}) } } : blank();
      const p = runAccrual(d);
      runRecurring(d);
      if (!alive) return;
      if (d.config.theme === "dark" || d.config.theme === "light") setTheme(d.config.theme);
      if (d.config.hidden) setHidden(true);
      setPosted(p);
      setData(d);
      loaded.current = true;
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!data || !loaded.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => { setWhere(await store.save(data)); }, 450);
    return () => clearTimeout(timer.current);
  }, [data]);

  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const dark = theme === "dark";
  MASKED = hidden;
  const toggleHidden = () => {
    const next = !hidden;
    setHidden(next);
    if (loaded.current) mutate((d) => { d.config.hidden = next; });
  };
  const toggleTheme = () => {
    const next = dark ? "light" : "dark";
    setTheme(next);
    if (loaded.current) mutate((d) => { d.config.theme = next; });
  };
  const mutate = (fn) => setData((prev) => { const d = JSON.parse(JSON.stringify(prev)); fn(d); return d; });

  /* ---------- derived analytics ---------- */
  const A = useMemo(() => {
    if (!data) return null;
    const today = TODAY();
    const thisMonth = today.slice(0, 7);
    const cardOf = (id) => (data.cards.find((c) => c.id === id) || {}).name || "Card";
    const accOf = (id) => (data.accounts.find((a) => a.id === id) || {}).name || "Account";

    const recoverableIds = new Set();
    const emiRows = data.emis.map((e) => {
      const monthly = emiMonthly(e);
      const due = emiDueCount(e);
      const received = data.repayments.filter((r) => r.emiId === e.id).reduce((s, r) => s + num(r.amount), 0);
      const outstanding = r2(num(e.principal) - received);
      const overdue = r2(Math.max(0, due * monthly - received));
      return { ...e, monthly, due, received, outstanding, overdue };
    });
    const receivable = r2(emiRows.reduce((s, e) => s + Math.max(0, e.outstanding), 0));
    const emiBilled = r2(emiRows.reduce((s, e) => s + Math.min(num(e.principal), e.due * e.monthly), 0));

    // unified outflow stream (card spends + savings auto-debits + withdrawals)
    const flows = [
      ...data.spends.map((s) => ({ ...s, kind: "card", source: cardOf(s.cardId) })),
      ...data.savingsTx
        .filter((t) => t.type === "auto" || t.type === "withdrawal")
        .map((t) => ({ ...t, kind: "bank", source: accOf(t.accountId) })),
    ];
    /* A shared bill: you paid it all, but only your slice is your expense. */
    const share = (f) => Math.max(0, Math.min(num(f.shareAmount), num(f.amount)));
    const mine = (f) => r2(num(f.amount) - share(f));
    const isExpense = (f) => !isExcluded(data.config, f.category);
    const expenses = flows.filter(isExpense);
    const investments = flows.filter((f) => f.category === "Investment");

    const sumIn = (list, month) => r2(list.filter((f) => f.date.slice(0, 7) === month).reduce((s, f) => s + mine(f), 0));

    /* shared bills waiting to be settled */
    const settlements = data.savingsTx.filter((t) => t.type === "settlement");
    const settledFor = (id) => r2(settlements.filter((t) => t.flowId === id).reduce((s, t) => s + num(t.amount), 0));
    const sharedRows = flows.filter((f) => share(f) > 0).map((f) => {
      const settled = settledFor(f.id);
      return { ...f, shareDue: share(f), settled, pending: r2(Math.max(0, share(f) - settled)) };
    }).sort((a, b) => (b.pending - a.pending) || b.date.localeCompare(a.date));
    const sharedBilled = r2(sharedRows.reduce((s, f) => s + f.shareDue, 0));
    const settledIn = r2(settlements.reduce((s, t) => s + num(t.amount), 0));
    const loose = r2(settlements.filter((t) => !t.flowId).reduce((s, t) => s + num(t.amount), 0));
    const sharedPending = r2(Math.max(0, sharedRows.reduce((s, f) => s + f.pending, 0) - loose));
    const spentMonth = sumIn(expenses, thisMonth);
    const investedMonth = sumIn(investments, thisMonth);

    const byCategory = {};
    expenses.filter((f) => f.date.slice(0, 7) === thisMonth).forEach((f) => {
      byCategory[f.category] = r2((byCategory[f.category] || 0) + mine(f));
    });
    const catRows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(); dt.setDate(1); dt.setMonth(dt.getMonth() - i);
      const key = isoOf(dt).slice(0, 7);
      months.push({ key, label: monthLabel(key), spend: sumIn(expenses, key), invest: sumIn(investments, key) });
    }

    const interestMonth = r2(
      data.savingsTx.filter((t) => t.type === "interest" && t.date.slice(0, 7) === thisMonth).reduce((s, t) => s + num(t.amount), 0)
    );
    const interestAll = r2(data.savingsTx.filter((t) => t.type === "interest").reduce((s, t) => s + num(t.amount), 0));

    const cardRows = data.cards.map((c) => {
      const own = r2(data.spends.filter((s) => s.cardId === c.id).reduce((s, x) => s + num(x.amount), 0));
      const mine = emiRows.filter((e) => e.cardId === c.id);
      /* Billed: only the instalments whose month has come due are payable now. */
      const emiDue = r2(mine.reduce((s, e) => s + Math.min(num(e.principal), e.due * e.monthly), 0));
      /* Blocked: the rest of the purchase still sits against the limit until repaid. */
      const blocked = r2(mine.reduce((s, e) => s + Math.max(0, e.outstanding), 0));
      const paid = r2(data.savingsTx.filter((t) => t.type === "card-payment" && t.cardId === c.id).reduce((s, t) => s + num(t.amount), 0));
      const outstanding = r2(own + emiDue - paid);
      const used = r2(own - paid + blocked);
      return { ...c, own, friends: emiDue, emiDue, blocked, paid, outstanding, used, available: r2(num(c.limit) - used) };
    });
    const cardOutstanding = r2(cardRows.reduce((s, c) => s + c.outstanding, 0));

    const savingsTotal = r2(data.accounts.reduce((s, a) => s + num(a.balance), 0));
    const loanRemaining = r2(
      data.recurring.filter((r) => r.active && r.totalInstallments > 0)
        .reduce((s, r) => s + num(r.amount) * Math.max(0, r.totalInstallments - (r.paidInstallments || 0)), 0)
    );
    const receivableTotal = r2(receivable + sharedPending);
    const netWorth = r2(savingsTotal + receivableTotal - cardOutstanding - loanRemaining);

    /* Income is an analysis figure set in Settings — never derived from entries. */
    const income = num(data.config.monthlyIncome);
    const saved = r2(income - spentMonth);
    const saveRate = income > 0 ? Math.round((saved / income) * 100) : null;
    const avgSpend = r2(months.slice(0, 5).reduce((s, m) => s + m.spend, 0) / 5) || spentMonth;

    const budgetRows = Object.entries(data.budgets || {}).map(([cat, amt]) => {
      const used = cat === "Investment"
        ? sumIn(investments, thisMonth)
        : r2(expenses.filter((f) => f.category === cat && f.date.slice(0, 7) === thisMonth).reduce((s, f) => s + mine(f), 0));
      return { cat, amount: num(amt), used, pct: num(amt) > 0 ? Math.round((used / num(amt)) * 100) : 0, target: cat === "Investment" };
    }).sort((a, b) => b.pct - a.pct);

    const upcoming = data.recurring.filter((r) => r.active)
      .sort((a, b) => (a.nextDue || "").localeCompare(b.nextDue || "")).slice(0, 6);

    /* dynamic tips */
    const tips = [];
    if (income <= 0)
      tips.push(["Set your monthly income", "Without it there's no save rate to work from. Put your take-home in Settings — it's used for analysis only and never becomes a transaction."]);
    if (saveRate !== null && saveRate < 20)
      tips.push(["Your save rate is thin", `You're keeping ${saveRate}% of income this month. Move ₹${Math.max(2000, Math.round((income * 0.2 - saved) / 500) * 500).toLocaleString("en-IN")} to the emergency fund on salary day, before spending starts.`]);
    if (saveRate !== null && saveRate >= 35)
      tips.push(["Strong month", `You're saving ${saveRate}% of income. Idle savings earn near the repo rate — anything above six months of expenses is better off in a longer-dated instrument.`]);
    if (catRows.length && spentMonth > 0 && catRows[0][1] / spentMonth > 0.35)
      tips.push([`${catRows[0][0]} dominates`, `${Math.round((catRows[0][1] / spentMonth) * 100)}% of this month's spending sits in one category. Cap it in the Budget tab and the dashboard will flag it before month end.`]);
    if (investedMonth === 0)
      tips.push(["Nothing invested yet", "No investment entries this month. Set up a recurring SIP under Auto-pay — it's categorised as Investment, so it never inflates your expense numbers."]);
    else if (income > 0 && investedMonth / income < 0.15)
      tips.push(["Room to invest more", `Investments are ${Math.round((investedMonth / income) * 100)}% of income. A common floor is 15–20% once your emergency fund is full.`]);
    const overdueTotal = r2(emiRows.reduce((s, e) => s + e.overdue, 0));
    if (overdueTotal > 0)
      tips.push(["Friends owe you", `${fmt0(overdueTotal)} of friends' EMIs are past due. Your card gets billed on schedule whether or not they pay — nudge them.`]);
    if (sharedPending > 0)
      tips.push(["Shared bills unsettled", `${fmt0(sharedPending)} of shared spending is still to come back to you. It's already out of your expense figures, but it isn't in your account yet — the Shared tab lists what's open.`]);
    const idle = r2(data.accounts.filter((a) => !a.earningInterest).reduce((s, a) => s + num(a.balance), 0));
    if (idle > 25000)
      tips.push(["Idle cash", `${fmt0(idle)} sits in accounts marked as not earning interest. At the repo rate of ${num(data.config.repoRate).toFixed(2)}% that's roughly ${fmt0((idle * num(data.config.repoRate)) / 100)} a year left on the table.`]);
    if (cardOutstanding > savingsTotal * 0.3 && cardOutstanding > 0)
      tips.push(["Card load is high", `Card outstanding is ${Math.round((cardOutstanding / Math.max(1, savingsTotal)) * 100)}% of your liquid savings. Clear the revolving portion first — no investment reliably beats card interest.`]);
    const emergency = r2(data.accounts.filter((a) => /emergency/i.test(a.name)).reduce((s, a) => s + num(a.balance), 0));
    if (avgSpend > 0 && emergency < avgSpend * 6)
      tips.push(["Emergency fund below six months", `You average ${fmt0(avgSpend)} of expenses a month; six months is ${fmt0(avgSpend * 6)}. You're at ${fmt0(emergency)}.`]);
    const over = budgetRows.filter((b) => !b.target && b.pct > 100);
    if (over.length)
      tips.push(["Over budget", `${over.map((b) => b.cat).join(", ")} ${over.length > 1 ? "have" : "has"} crossed the monthly cap. Adjust the cap or pause the category for the rest of the month.`]);

    return {
      share, mine, sharedRows, sharedBilled, sharedPending, settledIn, receivableTotal,
      today, thisMonth, cardOf, accOf, emiRows, receivable, emiBilled, flows, expenses, investments,
      cardBlocked: r2(cardRows.reduce((s, c) => s + c.blocked, 0)),
      spentMonth, investedMonth, catRows, months, interestMonth, interestAll, cardRows, cardOutstanding,
      savingsTotal, loanRemaining, netWorth, income, saved, saveRate, avgSpend, budgetRows, upcoming,
      tips: tips.slice(0, 5), overdueTotal, recoverableIds,
    };
  }, [data]);

  if (!data || !A) {
    return (
      <div className="ml-root" data-theme={theme}>
        <style>{CSS}</style>
        <div className="ml-wrap" style={{ paddingTop: 40 }}>
          <div className="ml-eyebrow">Money Ledger</div>
          <p className="ml-sub" style={{ marginTop: 8 }}>Opening the ledger…</p>
        </div>
      </div>
    );
  }

  const effRate = num(data.config.repoRate);

  /* What the header shows: everything, one account, or one card. */
  const balanceViews = [
    { value: "total", label: "Total balance" },
    ...data.accounts.map((a) => ({ value: `a:${a.id}`, label: a.name })),
    ...A.cardRows.map((c) => ({ value: `c:${c.id}`, label: c.name })),
  ];
  const resolveView = () => {
    if (view.startsWith("a:")) {
      const a = data.accounts.find((x) => x.id === view.slice(2));
      if (a) return { value: a.balance, note: a.earningInterest ? `earning ${effRate.toFixed(2)}% p.a.` : a.type };
    }
    if (view.startsWith("c:")) {
      const c = A.cardRows.find((x) => x.id === view.slice(2));
      if (c) return { value: -c.outstanding, note: `${fmt0(c.available)} available` };
    }
    return { value: A.savingsTotal, note: `across ${data.accounts.length} account${data.accounts.length > 1 ? "s" : ""}` };
  };
  const shown = resolveView();
  const TABS = [
    ["overview", "Overview"], ["accounts", "Accounts"], ["cards", "Cards"],
    ["shared", "Shared"], ["emi", "Friends"], ["auto", "Auto-pay"], ["budget", "Budget"],
    ["backup", "Backup"], ["settings", "Settings"],
  ];

  return (
    <div className="ml-root" data-theme={theme}>
      <style>{CSS}</style>

      <header className="ml-top">
        <div className="ml-topin">
          <div className="ml-headline">
            <div className="ml-brand">Money <span>Ledger</span></div>
            <div className="ml-flex" style={{ flexWrap: "nowrap", gap: 6 }}>
              <button className="ml-theme" onClick={toggleHidden}
                aria-label={hidden ? "Show figures" : "Hide figures"}
                title={hidden ? "Show figures" : "Hide figures"}>
                {hidden ? <EyeOffIcon /> : <EyeIcon />}
              </button>
              <button className="ml-theme" onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                title={dark ? "Light mode" : "Dark mode"}>
                {dark ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>
          <div className="ml-brandrow">
            <div className="ml-brandsub">
              {`${A.today.slice(8, 10)} ${MON[Number(A.today.slice(5, 7)) - 1]} ${A.today.slice(0, 4)}`}
            </div>
            <div className="ml-nw">
              <Pick small value={view} onChange={setView} options={balanceViews} />
              <div className="ml-nwv ml-num" style={{ color: shown.value < 0 ? "var(--debit)" : "var(--ink)" }}>{mask(fmt0(shown.value))}</div>
              {shown.note && <div className="ml-statn" style={{ textAlign: "right" }}>{hidden ? "hidden" : shown.note}</div>}
            </div>
          </div>
          <nav className="ml-tabs">
            {TABS.map(([id, label]) => (
              <button key={id} className="ml-tab" data-on={tab === id ? "1" : "0"} onClick={() => setTab(id)}>{label}</button>
            ))}
          </nav>
        </div>
      </header>

      <main className="ml-wrap">
        {tab === "overview" && <Overview A={A} data={data} posted={posted} setTab={setTab} />}
        {tab === "accounts" && <Savings A={A} data={data} mutate={mutate} say={say} posted={posted} effRate={effRate} />}
        {tab === "cards" && <Cards A={A} data={data} mutate={mutate} say={say} />}
        {tab === "shared" && <SharedPanel A={A} data={data} mutate={mutate} say={say} />}
        {tab === "emi" && <Emis A={A} data={data} mutate={mutate} say={say} />}
        {tab === "auto" && <Auto A={A} data={data} mutate={mutate} say={say} />}
        {tab === "budget" && <Budget A={A} data={data} mutate={mutate} say={say} />}
        {tab === "backup" && <Backup A={A} data={data} mutate={mutate} setData={setData} say={say} />}
        {tab === "settings" && <Settings A={A} data={data} mutate={mutate} setData={setData} say={say} setPosted={setPosted} where={where} />}
      </main>

      {toast && <div className="ml-toast">{toast}</div>}
    </div>
  );
}

/* ---------- small building blocks ---------- */
const Stat = ({ label, value, note, tone, raw }) => (
  <div className="ml-stat">
    <div className="ml-eyebrow">{label}</div>
    <div className="ml-statv ml-num" style={tone ? { color: `var(--${tone})` } : null}>{raw ? value : mask(value)}</div>
    {note && <div className="ml-statn">{note}</div>}
  </div>
);

const Field = ({ label, span, children }) => (
  <div className={"ml-f" + (span ? " ml-span" : "")}>
    <label>{label}</label>
    {children}
  </div>
);

function Face({ tone, title, sub, leftLabel, leftValue, rightLabel, rightValue, pct, chip, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ background: tone }}
      className={"ml-face" + (active ? " on" : "")}>
      <div>
        <div className="ml-facetop">
          <div className="ml-facename">{title}</div>
          {chip && <span className="ml-chip" />}
        </div>
        {sub && <div className="ml-facesub">{sub}</div>}
      </div>
      <div>
        {typeof pct === "number" && (
          <div className="ml-facebar"><i style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div>
        )}
        <div className="ml-facefoot">
          <div>
            {leftLabel && <div className="ml-facelab">{leftLabel}</div>}
            {leftValue && <div className="ml-faceval ml-num">{mask(leftValue)}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            {rightLabel && <div className="ml-facelab">{rightLabel}</div>}
            {rightValue && <div className="ml-faceval ml-num">{mask(rightValue)}</div>}
          </div>
        </div>
      </div>
    </button>
  );
}

/* A small window over the app, for configuration that would otherwise
   swamp the page it belongs to. */
function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="ml-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ml-modal" role="dialog" aria-modal="true">
        <div className="ml-modalhead">
          <div>
            <div className="ml-eyebrow">{title}</div>
            {subtitle && <div className="ml-sub" style={{ marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button className="ml-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="ml-modalbody">{children}</div>
      </div>
    </div>
  );
}

/* Keeps every stat cell the same size whether a tab shows two or four. */
const StatRow = ({ children }) => (
  <div className="ml-stats ml-w6" style={{ ["--cols"]: React.Children.count(children) }}>{children}</div>
);

/* Closes a popup on an outside tap or Escape. */
function useDismiss(open, close) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

/* Select, in the app's own type and colours rather than the browser's. */
function Pick({ value, onChange, options, placeholder, small }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const cur = options.find((o) => o.value === value);
  return (
    <div className={"ml-pick" + (small ? " sm" : "") + (open ? " open" : "")} ref={ref}>
      <button type="button" className="ml-pickbtn" aria-haspopup="listbox" aria-expanded={open}
        onClick={() => setOpen(!open)}>
        <span className="ml-picklabel">{cur ? cur.label : (placeholder || "Select")}</span>
        <span className="ml-chev" />
      </button>
      {open && (
        <div className="ml-pickmenu" role="listbox">
          {options.length === 0 && <div className="ml-pickopt ml-sub">Nothing to choose from</div>}
          {options.map((o) => (
            <button key={o.value} type="button" role="option" aria-selected={o.value === value}
              className={"ml-pickopt" + (o.value === value ? " on" : "")}
              onClick={() => { onChange(o.value); setOpen(false); }}>
              <span>{o.label}</span>
              {o.hint && <span className="ml-pickhint">{o.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

/* Date field with the app's own calendar instead of the browser's. */
function DateField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const [view, setView] = useState((value || TODAY()).slice(0, 7));
  useEffect(() => { if (open) setView((value || TODAY()).slice(0, 7)); }, [open, value]);

  const y = Number(view.slice(0, 4));
  const m = Number(view.slice(5, 7));
  const lead = new Date(y, m - 1, 1).getDay();
  const total = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  const shift = (n) => {
    const dt = new Date(y, m - 1 + n, 1);
    setView(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className={"ml-pick" + (open ? " open" : "")} ref={ref}>
      <button type="button" className="ml-pickbtn" onClick={() => setOpen(!open)}>
        <span className="ml-picklabel ml-num">{value ? fmtDate(value) : "Pick a date"}</span>
        <span className="ml-chev" />
      </button>
      {open && (
        <div className="ml-cal">
          <div className="ml-calhead">
            <button type="button" className="ml-calnav" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
            <span className="ml-calmon">{MON[m - 1]} {y}</span>
            <button type="button" className="ml-calnav" onClick={() => shift(1)} aria-label="Next month">›</button>
          </div>
          <div className="ml-calgrid">
            {DOW.map((d, i) => <div className="ml-caldow" key={i}>{d}</div>)}
            {cells.map((iso, i) => iso === null
              ? <span className="ml-calday mute" key={`x${i}`} />
              : (
                <button type="button" key={iso}
                  className={"ml-calday" + (iso === value ? " on" : "") + (iso === TODAY() ? " today" : "")}
                  onClick={() => { onChange(iso); setOpen(false); }}>
                  {Number(iso.slice(8, 10))}
                </button>
              ))}
          </div>
          <div className="ml-calfoot">
            <button type="button" className="ml-btn ghost sm" onClick={() => { onChange(TODAY()); setOpen(false); }}>Today</button>
            <span className="ml-sub ml-num">{value ? fmtDate(value) : ""}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const LedgerHead = () => (
  <div className="ml-lhead">
    <div>Entry</div><div>Debit</div><div>Credit</div><div>Invested</div><div />
  </div>
);

function LedgerRow({ title, meta, debit, credit, invest, onDelete }) {
  return (
    <div className="ml-lrow">
      <div className="ml-lmain">
        <div className="ml-ltitle">{title}</div>
        <div className="ml-lmeta">{meta}</div>
      </div>
      <div className="ml-lcell ml-debit" data-l="Debit">{debit ? fmt(debit) : ""}</div>
      <div className="ml-lcell ml-credit" data-l="Credit">{credit ? fmt(credit) : ""}</div>
      <div className="ml-lcell ml-invest" data-l="Invested">{invest ? fmt(invest) : ""}</div>
      {onDelete ? <button className="ml-x" onClick={onDelete} title="Delete entry"><TrashIcon /></button> : <span />}
    </div>
  );
}

/* ---------- OVERVIEW ---------- */
function Overview({ A, data, posted, setTab }) {
  const [logOpen, setLogOpen] = useState(false);
  const max = Math.max(1, ...A.months.map((m) => Math.max(m.spend, m.invest)));
  const catMax = Math.max(1, ...A.catRows.map((c) => c[1]));
  const recent = [...A.flows, ...data.savingsTx.filter((t) => ["deposit", "interest", "settlement"].includes(t.type))]
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);

  return (
    <div className="ml-page">
      <StatRow>
        <Stat label="Spent this month" value={fmt0(A.spentMonth)} note="your share only" tone="debit" />
        <Stat label="Invested" value={fmt0(A.investedMonth)} note="never counted as expense" tone="stamp" />
        <Stat label="Interest earned" value={fmt(A.interestMonth)} note={`${fmt(A.interestAll)} lifetime`} tone="credit" />
        <Stat label="Save rate" value={A.saveRate === null ? "—" : `${A.saveRate}%`} note={A.income ? `on ${fmt0(A.income)} income` : "set income in Settings"} />
      </StatRow>

      <div className="ml-wallet ml-w6">
        {data.accounts.map((a, i) => (
          <Face key={a.id} tone={inkFor(ACC_INKS, i)} title={a.name} sub={a.type}
            rightLabel="Balance" rightValue={fmt0(a.balance)} onClick={() => setTab("accounts")} />
        ))}
        {A.cardRows.map((c, i) => (
          <Face key={c.id} chip tone={inkFor(CARD_INKS, i)} title={c.name}
            leftLabel="Limit" leftValue={fmt0(c.limit || 0)}
            rightLabel="Outstanding" rightValue={fmt0(c.outstanding)}
            onClick={() => setTab("cards")} />
        ))}
      </div>

      {A.tips.length > 0 && (
        <div className="ml-card ml-w6">
          <div className="ml-eyebrow">What to do next</div>
          {A.tips.map(([t, body], i) => (
            <div className="ml-tip" key={i}><b>{t}</b><p>{body}</p></div>
          ))}
        </div>
      )}

        <div className="ml-card ml-w3">
          <div className="ml-eyebrow">Six months — spending vs investing</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 150, marginTop: 10 }}>
            {A.months.map((m) => (
              <div key={m.key} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", justifyContent: "center", height: 120 }}>
                  <div title={`Spent ${fmt0(m.spend)}`} style={{ width: "42%", background: "var(--debit)", height: `${(m.spend / max) * 100}%`, minHeight: m.spend ? 2 : 0 }} />
                  <div title={`Invested ${fmt0(m.invest)}`} style={{ width: "42%", background: "var(--stamp)", height: `${(m.invest / max) * 100}%`, minHeight: m.invest ? 2 : 0 }} />
                </div>
                <div className="ml-num" style={{ fontSize: 10, color: "var(--soft)", marginTop: 6 }}>{m.label}</div>
              </div>
            ))}
          </div>
          <div className="ml-flex" style={{ marginTop: 10, fontSize: 11, color: "var(--soft)" }}>
            <span><i style={{ display: "inline-block", width: 9, height: 9, background: "var(--debit)", marginRight: 5 }} />Expenses</span>
            <span><i style={{ display: "inline-block", width: 9, height: 9, background: "var(--stamp)", marginRight: 5 }} />Investments</span>
          </div>
        </div>

        <div className="ml-card ml-w3">
          <div className="ml-eyebrow">Where this month went</div>
          {A.catRows.length === 0 ? (
            <div className="ml-empty">No categorised spending yet this month. Log one on the Cards tab.</div>
          ) : (
            A.catRows.slice(0, 8).map(([cat, amt]) => (
              <div key={cat} style={{ marginBottom: 11 }}>
                <div className="ml-between" style={{ fontSize: 13, marginBottom: 4 }}>
                  <span>{cat}</span>
                  <span className="ml-num">{fmt0(amt)} <span style={{ color: "var(--soft)", fontSize: 11 }}>{Math.round((amt / A.spentMonth) * 100)}%</span></span>
                </div>
                <div className="ml-bar"><i style={{ width: `${(amt / catMax) * 100}%`, background: "var(--debit)" }} /></div>
              </div>
            ))
          )}
        </div>

        <div className="ml-card ml-w2">
          <div className="ml-eyebrow">Assets</div>
          <div className="ml-between" style={{ fontSize: 13, marginTop: 4 }}><span>Savings & cash</span><span className="ml-num ml-credit">{mask(fmt0(A.savingsTotal))}</span></div>
          <div className="ml-between" style={{ fontSize: 13, marginTop: 6 }}><span>Friends' EMI due back</span><span className="ml-num ml-credit">{mask(fmt0(A.receivable))}</span></div>
          <div className="ml-between" style={{ fontSize: 13, marginTop: 6 }}><span>Shared bills to settle</span><span className="ml-num ml-credit">{mask(fmt0(A.sharedPending))}</span></div>
        </div>
        <div className="ml-card ml-w2">
          <div className="ml-eyebrow">Liabilities</div>
          <div className="ml-between" style={{ fontSize: 13, marginTop: 4 }}><span>Card outstanding</span><span className="ml-num ml-debit">{mask(fmt0(A.cardOutstanding))}</span></div>
          <div className="ml-between" style={{ fontSize: 13, marginTop: 6 }}><span>Loan instalments left</span><span className="ml-num ml-debit">{mask(fmt0(A.loanRemaining))}</span></div>
        </div>
        <div className="ml-card ml-w2">
          <div className="ml-eyebrow">Next auto-payments</div>
          {A.upcoming.length === 0 ? <div className="ml-sub" style={{ marginTop: 4 }}>Nothing scheduled.</div> :
            A.upcoming.map((r) => (
              <div className="ml-between" key={r.id} style={{ fontSize: 13, marginTop: 6 }}>
                <span>{r.name} <span className="ml-sub">· {fmtDate(r.nextDue)}</span></span>
                <span className="ml-num">{fmt0(r.amount)}</span>
              </div>
            ))}
        </div>

      <div className="ml-card ml-w6">
        <div className="ml-between">
          <div>
            <div className="ml-eyebrow">Recent entries</div>
            <div className="ml-sub" style={{ marginTop: 4 }}>
              {recent.length === 0 ? "Nothing logged yet." : `${recent.length} most recent across every account and card.`}
            </div>
          </div>
          <button className="ml-btn sm" onClick={() => setLogOpen(true)}>View</button>
        </div>
      </div>

      {logOpen && (
        <Modal title="Recent entries" subtitle="Newest first, from every source" onClose={() => setLogOpen(false)}>
        <LedgerHead />
        {recent.length === 0 ? <div className="ml-empty" style={{ marginTop: 12 }}>The ledger is empty. Load a sample month from Settings to see how it reads.</div> :
          recent.map((f) => {
            const isIn = ["deposit", "interest", "settlement"].includes(f.type);
            const isInv = f.category === "Investment";
            const sh = A.share(f);
            return (
              <LedgerRow key={f.id}
                title={f.note || f.category}
                meta={`${fmtDate(f.date)} · ${f.source || A.accOf(f.accountId)} · ${f.category}${sh > 0 ? ` · ${fmt0(sh)} back from ${f.shareFriend || "a friend"}` : ""}`}
                debit={!isIn && !isInv ? f.amount : 0}
                credit={isIn ? f.amount : 0}
                invest={isInv ? f.amount : 0}
              />
            );
          })}
        </Modal>
      )}
    </div>
  );
}

/* ---------- SAVINGS ---------- */
function Savings({ A, data, mutate, say, posted, effRate }) {
  const [f, setF] = useState({ name: "", type: "", interest: true, balance: "" });
  const [mv, setMv] = useState({
    mode: "spend", accountId: "", toId: "", amount: "",
    category: "Groceries", kind: "Settlement", date: TODAY(), note: "",
  });
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(null);
  const [edit, setEdit] = useState(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [ef, setEf] = useState({ name: "", type: "", balance: "" });
  const todayPosted = posted.reduce((s, p) => s + p.amount, 0);

  const openEdit = (a) => {
    setEdit(edit === a.id ? null : a.id);
    setEf({ name: a.name, type: a.type, balance: String(a.balance) });
  };
  const saveEdit = (a) => {
    if (!ef.name.trim()) return say("The account needs a name.");
    const want = num(ef.balance);
    mutate((d) => {
      const x = d.accounts.find((z) => z.id === a.id);
      x.name = ef.name.trim();
      x.type = ef.type.trim() || "Savings";
      const diff = r2(want - x.balance);
      if (diff !== 0) {
        x.balance = want;
        /* a correction, logged so the statement still adds up */
        d.savingsTx.push({
          id: uid(), date: TODAY(), accountId: x.id, type: "adjustment",
          amount: Math.abs(diff), up: diff > 0, category: "Transfer",
          note: `Balance corrected to ${fmt(want)}`,
        });
      }
    });
    setEdit(null);
    say("Account updated.");
  };

  const toggleInterest = (a) => {
    mutate((d) => {
      runAccrual(d); // settle what's already earned before the switch flips
      const x = d.accounts.find((z) => z.id === a.id);
      x.earningInterest = !x.earningInterest;
      x.lastAccrual = TODAY();
    });
    say(a.earningInterest ? `Interest switched off for ${a.name}.` : `${a.name} now earns the repo rate.`);
  };

  const addAccount = () => {
    if (!f.name.trim()) return say("Give the account a name first.");
    mutate((d) => {
      d.accounts.push({
        id: uid(), name: f.name.trim(), type: f.type.trim() || "Savings",
        earningInterest: f.interest, balance: num(f.balance), lastAccrual: TODAY(), interestEarned: 0,
      });
    });
    setF({ name: "", type: "", interest: true, balance: "" });
    setOpen(false);
    say("Account opened.");
  };

  const post = () => {
    const from = mv.accountId || (data.accounts[0] || {}).id;
    if (!from) return say("Add an account first.");
    const amt = num(mv.amount);
    if (!(amt > 0)) return say("Enter an amount above zero.");

    if (mv.mode === "transfer") {
      const to = mv.toId || (data.accounts.find((a) => a.id !== from) || {}).id;
      if (!to) return say("You need a second account to transfer into.");
      if (to === from) return say("Pick two different accounts.");
      mutate((d) => {
        const pairId = uid();
        const a = d.accounts.find((x) => x.id === from);
        const b = d.accounts.find((x) => x.id === to);
        a.balance = r2(a.balance - amt);
        b.balance = r2(b.balance + amt);
        const note = mv.note.trim() || `${a.name} → ${b.name}`;
        d.savingsTx.push({ id: uid(), pairId, date: mv.date, accountId: from, type: "transfer-out", amount: amt, category: "Transfer", note });
        d.savingsTx.push({ id: uid(), pairId, date: mv.date, accountId: to, type: "transfer-in", amount: amt, category: "Transfer", note });
      });
      setMv({ ...mv, amount: "", note: "" });
      setEntryOpen(false);
      return say("Transferred between your accounts — not an expense either side.");
    }

    if (mv.mode === "in") {
      mutate((d) => {
        const a = d.accounts.find((x) => x.id === from);
        a.balance = r2(a.balance + amt);
        d.savingsTx.push({
          id: uid(), date: mv.date, accountId: from,
          type: mv.kind === "Settlement" ? "settlement" : "deposit",
          amount: amt, category: mv.kind, note: mv.note.trim() || mv.kind,
        });
      });
      setMv({ ...mv, amount: "", note: "" });
      setEntryOpen(false);
      return say("Added to the balance — not counted as income.");
    }

    mutate((d) => {
      const a = d.accounts.find((x) => x.id === from);
      a.balance = r2(a.balance - amt);
      d.savingsTx.push({
        id: uid(), date: mv.date, accountId: from, type: "withdrawal",
        amount: amt, category: mv.category, note: mv.note.trim() || mv.category,
      });
    });
    setMv({ ...mv, amount: "", note: "" });
    setEntryOpen(false);
    say(mv.category === "Investment" ? "Logged as an investment — kept out of expenses." : "Expense logged.");
  };

  const txs = [...data.savingsTx]
    .filter((t) => !focus || t.accountId === focus)
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25);
  const focused = data.accounts.find((a) => a.id === focus);

  return (
    <>
      <StatRow>
        <Stat label="Total balance" value={fmt0(A.savingsTotal)} note={`${data.accounts.length} accounts`} />
        <Stat label="Interest this month" value={fmt(A.interestMonth)} tone="credit" note={`${fmt(A.interestAll)} lifetime`} />
        <Stat label="RBI repo rate" value={`${effRate.toFixed(2)}% p.a.`} note={`${(effRate / 365).toFixed(5)}% a day, compounded`} />
        <Stat label="Earning today" value={fmt(data.accounts.filter((a) => a.earningInterest).reduce((s, a) => s + (a.balance * effRate) / 100 / 365, 0))} note="one day's interest at today's balances" />
      </StatRow>

      {todayPosted > 0 && (
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <div className="ml-stamp">
            <div className="ml-stampt">Interest credited</div>
            <div className="ml-stampv">{fmt(todayPosted)}</div>
            <div className="ml-stampd">{fmtDate(TODAY())} · {effRate.toFixed(2)}% p.a.</div>
          </div>
        </div>
      )}

      <div className="ml-wallet">
        {data.accounts.map((a, i) => (
          <Face key={a.id} tone={inkFor(ACC_INKS, i)}
            title={a.name}
            sub={`${a.type}${a.earningInterest ? ` · ${effRate.toFixed(2)}% p.a.` : " · no interest"}`}
            rightLabel="Current balance" rightValue={fmt0(a.balance)}
            active={focus === a.id}
            onClick={() => setFocus(focus === a.id ? null : a.id)} />
        ))}
      </div>

      <div className="ml-card">
        <div className="ml-between">
          <div className="ml-eyebrow">Accounts</div>
          <button className="ml-btn sm" onClick={() => setOpen(true)}>Add account</button>
        </div>

        {open && (
          <Modal title="Open an account" onClose={() => setOpen(false)}>
            <div className="ml-form" style={{ marginTop: 12 }}>
              <Field label="Name of the account">
                <input className="ml-in" value={f.name} placeholder="e.g. Travel fund" onChange={(e) => setF({ ...f, name: e.target.value })} />
              </Field>
              <Field label="Type">
                <input className="ml-in" value={f.type} placeholder="e.g. Savings, FD, Cash" onChange={(e) => setF({ ...f, type: e.target.value })} />
              </Field>
              <Field label="Earning interest">
                <div className="ml-seg">
                  <button data-on={f.interest ? "1" : "0"} onClick={() => setF({ ...f, interest: true })}>Yes</button>
                  <button data-on={!f.interest ? "1" : "0"} onClick={() => setF({ ...f, interest: false })}>No</button>
                </div>
              </Field>
              <Field label="Opening balance">
                <input className="ml-in ml-num" inputMode="decimal" value={f.balance} placeholder="0" onChange={(e) => setF({ ...f, balance: e.target.value })} />
              </Field>
            </div>
            <div className="ml-flex" style={{ marginTop: 12 }}>
              <button className="ml-btn" onClick={addAccount}>Open account</button>
            </div>
            <div className="ml-sub" style={{ marginTop: 10 }}>
              Interest-earning accounts all use the RBI repo rate set in Settings — an annual rate, compounded daily.
            </div>
          </Modal>
        )}

        <div style={{ marginTop: 12 }}>
          {data.accounts.map((a) => (
            <div key={a.id} style={{ padding: "11px 0", borderBottom: "1px solid var(--rule-soft)" }}>
              <div className="ml-between">
                <div>
                  <div style={{ fontWeight: 600 }}>{a.name}</div>
                  <div className="ml-sub" style={{ marginTop: 3 }}>
                    {a.type} · <span className={"ml-pill " + (a.earningInterest ? "on" : "off")}>{a.earningInterest ? `Earns ${effRate.toFixed(2)}% p.a.` : "No interest"}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="ml-num" style={{ fontSize: 16, fontWeight: 600 }}>{mask(fmt(a.balance))}</div>
                  <div className="ml-sub ml-num">{a.earningInterest ? mask(`+${fmt(a.interestEarned || 0)} interest`) : "—"}</div>
                </div>
              </div>
              <div className="ml-flex" style={{ marginTop: 8 }}>
                <button className="ml-btn ghost sm" onClick={() => openEdit(a)}>{edit === a.id ? "Cancel" : "Edit"}</button>
                <button className="ml-btn ghost sm" onClick={() => toggleInterest(a)}>
                  {a.earningInterest ? "Stop earning interest" : "Start earning interest"}
                </button>
                <button className="ml-btn ghost sm" onClick={() => {
                  if (data.accounts.length <= 1) return say("Keep at least one account.");
                  mutate((d) => { d.accounts = d.accounts.filter((z) => z.id !== a.id); });
                  say("Account removed.");
                }}>Remove account</button>
              </div>

              {edit === a.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--rule-soft)" }}>
                  <div className="ml-form">
                    <Field label="Name of the account">
                      <input className="ml-in" value={ef.name} onChange={(e) => setEf({ ...ef, name: e.target.value })} />
                    </Field>
                    <Field label="Type">
                      <input className="ml-in" value={ef.type} onChange={(e) => setEf({ ...ef, type: e.target.value })} />
                    </Field>
                    <Field label="Balance" span>
                      <input className="ml-in ml-num" inputMode="decimal" value={ef.balance}
                        onChange={(e) => setEf({ ...ef, balance: e.target.value })} />
                    </Field>
                  </div>
                  <div className="ml-flex" style={{ marginTop: 10 }}>
                    <button className="ml-btn sm" onClick={() => saveEdit(a)}>Save changes</button>
                    <span className="ml-sub">Changing the balance posts a correction entry, so the statement still adds up.</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="ml-card">
        <div className="ml-between">
          <div>
            <div className="ml-eyebrow">Log an entry</div>
            <div className="ml-sub" style={{ marginTop: 4 }}>An expense, a transfer between your own accounts, or money coming in.</div>
          </div>
          <button className="ml-btn sm" onClick={() => setEntryOpen(true)}>New entry</button>
        </div>
      </div>

      {entryOpen && (
        <Modal title="Log an entry" onClose={() => setEntryOpen(false)}>
        <div className="ml-flex" style={{ margin: "10px 0 14px" }}>
          <div className="ml-seg">
            <button data-on={mv.mode === "spend" ? "1" : "0"} onClick={() => setMv({ ...mv, mode: "spend" })}>Expense</button>
            <button data-on={mv.mode === "transfer" ? "1" : "0"} onClick={() => setMv({ ...mv, mode: "transfer" })}>Transfer</button>
            <button data-on={mv.mode === "in" ? "1" : "0"} onClick={() => setMv({ ...mv, mode: "in" })}>Money in</button>
          </div>
        </div>
        <div className="ml-form">
          <Field label={mv.mode === "transfer" ? "From account" : "Account"}>
            <Pick value={mv.accountId || (data.accounts[0] || {}).id} onChange={(v) => setMv({ ...mv, accountId: v })}
              options={data.accounts.map((a) => ({ value: a.id, label: a.name }))} />
          </Field>
          {mv.mode === "transfer" && (
            <Field label="To account">
              <Pick
                value={mv.toId || (data.accounts.find((a) => a.id !== (mv.accountId || (data.accounts[0] || {}).id)) || {}).id || ""}
                onChange={(v) => setMv({ ...mv, toId: v })} options={data.accounts.map((a) => ({ value: a.id, label: a.name }))} />
            </Field>
          )}
          <Field label="Amount">
            <input className="ml-in ml-num" inputMode="decimal" value={mv.amount} placeholder="0" onChange={(e) => setMv({ ...mv, amount: e.target.value })} />
          </Field>
          {mv.mode === "spend" && (
            <Field label="Category">
              <Pick value={mv.category} onChange={(v) => setMv({ ...mv, category: v })} options={data.config.categories.map((c) => ({ value: c, label: c, hint: isExcluded(data.config, c) ? "tracked, not counted as spending" : undefined }))} />
            </Field>
          )}
          {mv.mode === "in" && (
            <Field label="What kind of money is this">
              <Pick value={mv.kind} onChange={(v) => setMv({ ...mv, kind: v })}
                options={DEPOSIT_KINDS.map(([k, hint]) => ({ value: k, label: k, hint }))} />
            </Field>
          )}
          <Field label="Date">
            <DateField value={mv.date} onChange={(v) => setMv({ ...mv, date: v })} />
          </Field>
          <Field label="Note" span>
            <input className="ml-in" value={mv.note} placeholder="What was this for?" onChange={(e) => setMv({ ...mv, note: e.target.value })} />
          </Field>
        </div>
        <div className="ml-flex" style={{ marginTop: 12 }}>
          <button className="ml-btn" onClick={post}>
            {mv.mode === "spend" ? "Log expense" : mv.mode === "transfer" ? "Move it" : "Add to balance"}
          </button>
          <span className="ml-sub">
            {mv.mode === "spend" ? "Leaves the account and counts against your spending, unless the category says otherwise."
              : mv.mode === "transfer" ? "Both sides post at once. Your own money moving around is never an expense."
              : "Raises the balance and stays out of both income and expenses. Income is the figure in Settings, not an entry here."}
          </span>
        </div>
        </Modal>
      )}

      <div className="ml-card">
        <div className="ml-filter">
          <div className="ml-eyebrow">{focused ? `Statement — ${focused.name}` : "Account statement"}</div>
          {focused && <button className="ml-btn ghost sm" onClick={() => setFocus(null)}>Show all accounts</button>}
        </div>
        <div style={{ height: 10 }} />
        <LedgerHead />
        {txs.length === 0 ? <div className="ml-empty" style={{ marginTop: 12 }}>No entries yet.</div> :
          txs.map((t) => {
            const isIn = ["deposit", "interest", "settlement", "transfer-in"].includes(t.type) || (t.type === "adjustment" && t.up);
            const isInv = t.category === "Investment";
            return (
              <LedgerRow key={t.id}
                title={t.note}
                meta={`${fmtDate(t.date)} · ${A.accOf(t.accountId)} · ${t.type === "interest" ? "Interest" : t.type === "adjustment" ? "Correction" : t.type === "transfer-out" ? "Transfer out" : t.type === "transfer-in" ? "Transfer in" : t.category}`}
                debit={!isIn && !isInv ? t.amount : 0}
                credit={isIn ? t.amount : 0}
                invest={isInv ? t.amount : 0}
                onDelete={t.type === "interest" ? null : () => mutate((d) => {
                  const legs = t.pairId ? d.savingsTx.filter((x) => x.pairId === t.pairId) : [t];
                  legs.forEach((leg) => {
                    const acc = d.accounts.find((a) => a.id === leg.accountId);
                    if (!acc) return;
                    const legIn = ["deposit", "interest", "settlement", "transfer-in"].includes(leg.type) || (leg.type === "adjustment" && leg.up);
                    acc.balance = r2(acc.balance + (legIn ? -num(leg.amount) : num(leg.amount)));
                  });
                  const ids = new Set(legs.map((x) => x.id));
                  d.savingsTx = d.savingsTx.filter((x) => !ids.has(x.id));
                })}
              />
            );
          })}
      </div>
    </>
  );
}

/* ---------- CARDS ---------- */
function Cards({ A, data, mutate, say }) {
  const [s, setS] = useState({ cardId: "", amount: "", category: "Groceries", date: TODAY(), note: "", shared: false, shareFriend: "", shareAmount: "" });
  const [pay, setPay] = useState({ cardId: "", accountId: "", amount: "" });
  const [nc, setNc] = useState({ name: "", limit: "" });
  const [showCard, setShowCard] = useState(false);
  const [focus, setFocus] = useState(null);
  const [edit, setEdit] = useState(null);
  const [spendOpen, setSpendOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [ec, setEc] = useState({ name: "", limit: "" });

  const openEdit = (c) => {
    setEdit(edit === c.id ? null : c.id);
    setEc({ name: c.name, limit: String(c.limit || "") });
  };
  const saveEdit = (c) => {
    if (!ec.name.trim()) return say("The card needs a name.");
    mutate((d) => {
      const x = d.cards.find((z) => z.id === c.id);
      x.name = ec.name.trim();
      x.limit = num(ec.limit);
    });
    setEdit(null);
    say("Card updated.");
  };

  const log = () => {
    const card = s.cardId || (data.cards[0] || {}).id;
    if (!card) return say("Add a card first.");
    if (num(s.amount) <= 0) return say("Enter an amount above zero.");
    mutate((d) => {
      d.spends.push({
        id: uid(), date: s.date, cardId: card, amount: num(s.amount), category: s.category,
        note: s.note.trim() || s.category,
        shareAmount: s.shared ? Math.min(num(s.shareAmount), num(s.amount)) : 0,
        shareFriend: s.shared ? s.shareFriend.trim() : "",
      });
    });
    const back = s.shared ? Math.min(num(s.shareAmount), num(s.amount)) : 0;
    setS({ ...s, amount: "", note: "", shareAmount: "" });
    setSpendOpen(false);
    say(s.category === "Investment" ? "Logged as an investment — kept out of expenses."
      : back > 0 ? `Logged. ${fmt0(back)} sits as owed to you, not as your spending.` : "Spend logged.");
  };

  const payCard = () => {
    const card = pay.cardId || (data.cards[0] || {}).id;
    const acc = pay.accountId || (data.accounts[0] || {}).id;
    if (!card || !acc) return say("Need a card and an account.");
    if (num(pay.amount) <= 0) return say("Enter an amount above zero.");
    mutate((d) => {
      const a = d.accounts.find((x) => x.id === acc);
      a.balance = r2(a.balance - num(pay.amount));
      d.savingsTx.push({
        id: uid(), date: TODAY(), accountId: acc, cardId: card, type: "card-payment",
        amount: num(pay.amount), category: "Card Payment", note: `Bill payment — ${A.cardOf(card)}`,
      });
    });
    setPay({ ...pay, amount: "" });
    setPayOpen(false);
    say("Card payment posted.");
  };

  const spends = [...data.spends]
    .filter((x) => !focus || x.cardId === focus)
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  const focused = A.cardRows.find((c) => c.id === focus);

  return (
    <>
      <div className="ml-wallet">
        {A.cardRows.map((c, i) => (
          <Face key={c.id} chip tone={inkFor(CARD_INKS, i)}
            title={c.name}
            sub={c.limit ? mask(`${fmt0(c.available)} available of ${fmt0(c.limit)}`) : "No limit set"}
            pct={c.limit ? (c.used / c.limit) * 100 : 0}
            leftLabel="Credit limit" leftValue={fmt0(c.limit || 0)}
            rightLabel="Outstanding" rightValue={fmt0(c.outstanding)}
            active={focus === c.id}
            onClick={() => setFocus(focus === c.id ? null : c.id)} />
        ))}
      </div>

      <div className="ml-card">
        <div className="ml-eyebrow">What makes up each balance</div>
        {A.cardRows.map((c) => (
          <div key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--rule-soft)" }}>
            <div className="ml-between">
              <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
              <span style={{ textAlign: "right" }}>
                <span className="ml-num" style={{ color: "var(--debit)", fontWeight: 600 }}>{mask(fmt0(c.outstanding))}</span>
                <span className="ml-sub" style={{ display: "block" }}>payable now</span>
              </span>
            </div>
            <div className="ml-flex" style={{ marginTop: 6, fontSize: 11.5, color: "var(--soft)", justifyContent: "space-between" }}>
              <span>Yours {mask(fmt0(c.own))}</span>
              <span>EMI due {mask(fmt0(c.emiDue))}</span>
              <span>EMI blocking {mask(fmt0(c.blocked))}</span>
              <span>Paid {mask(fmt0(c.paid))}</span>
              <span>Available {mask(fmt0(c.available))}</span>
            </div>
            <div className="ml-flex" style={{ marginTop: 8 }}>
              <button className="ml-btn ghost sm" onClick={() => openEdit(c)}>{edit === c.id ? "Cancel" : "Edit"}</button>
              {data.cards.length > 1 && (
                <button className="ml-btn ghost sm" onClick={() => {
                  mutate((d) => { d.cards = d.cards.filter((z) => z.id !== c.id); });
                  say("Card removed. Its entries stay in the ledger.");
                }}>Remove</button>
              )}
            </div>
            {edit === c.id && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--rule-soft)" }}>
                <div className="ml-form">
                  <Field label="Card name">
                    <input className="ml-in" value={ec.name} onChange={(e) => setEc({ ...ec, name: e.target.value })} />
                  </Field>
                  <Field label="Credit limit">
                    <input className="ml-in ml-num" inputMode="decimal" value={ec.limit}
                      onChange={(e) => setEc({ ...ec, limit: e.target.value })} />
                  </Field>
                </div>
                <div style={{ marginTop: 10 }}>
                  <button className="ml-btn sm" onClick={() => saveEdit(c)}>Save changes</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="ml-card">
        <div className="ml-between">
          <div>
            <div className="ml-eyebrow">Log a spend</div>
            <div className="ml-sub" style={{ marginTop: 4 }}>Anything charged to a card, including bills you split with someone.</div>
          </div>
          <button className="ml-btn sm" onClick={() => setSpendOpen(true)}>New spend</button>
        </div>
      </div>

      {spendOpen && (
        <Modal title="Log a spend" onClose={() => setSpendOpen(false)}>
        <div className="ml-form">
          <Field label="Card">
            <Pick value={s.cardId || (data.cards[0] || {}).id} onChange={(v) => setS({ ...s, cardId: v })}
              options={data.cards.map((c) => ({ value: c.id, label: c.name }))} />
          </Field>
          <Field label="Category">
            <Pick value={s.category} onChange={(v) => setS({ ...s, category: v })} options={data.config.categories.map((c) => ({ value: c, label: c, hint: isExcluded(data.config, c) ? "tracked, not counted as spending" : undefined }))} />
          </Field>
          <Field label="Amount">
            <input className="ml-in ml-num" inputMode="decimal" value={s.amount} placeholder="0" onChange={(e) => setS({ ...s, amount: e.target.value })} />
          </Field>
          <Field label="Date">
            <DateField value={s.date} onChange={(v) => setS({ ...s, date: v })} />
          </Field>
          <Field label="Note" span>
            <input className="ml-in" value={s.note} placeholder="What did you buy?" onChange={(e) => setS({ ...s, note: e.target.value })} />
          </Field>
          <Field label="Shared with someone">
            <div className="ml-seg">
              <button data-on={!s.shared ? "1" : "0"} onClick={() => setS({ ...s, shared: false })}>No</button>
              <button data-on={s.shared ? "1" : "0"} onClick={() => setS({ ...s, shared: true })}>Yes</button>
            </div>
          </Field>
          {s.shared && (
            <>
              <Field label="Their share (₹)">
                <input className="ml-in ml-num" inputMode="decimal" value={s.shareAmount} placeholder="0"
                  onChange={(e) => setS({ ...s, shareAmount: e.target.value })} />
              </Field>
              <Field label="Who owes you" span>
                <input className="ml-in" value={s.shareFriend} placeholder="Name"
                  onChange={(e) => setS({ ...s, shareFriend: e.target.value })} />
              </Field>
            </>
          )}
        </div>
        <div className="ml-flex" style={{ marginTop: 12 }}>
          <button className="ml-btn" onClick={log}>Post spend</button>
          {s.category === "Investment" && <span className="ml-sub">Investments post to their own column, never to expenses.</span>}
          {s.shared && num(s.shareAmount) > 0 && num(s.amount) > 0 &&
            <span className="ml-sub">Your share: {fmt0(Math.max(0, num(s.amount) - num(s.shareAmount)))}. The rest becomes a settlement to collect.</span>}
        </div>
        </Modal>
      )}

      <div className="ml-card">
        <div className="ml-between">
          <div>
            <div className="ml-eyebrow">Pay a card bill</div>
            <div className="ml-sub" style={{ marginTop: 4 }}>Moves money from an account and reduces what the card owes.</div>
          </div>
          <button className="ml-btn sm" onClick={() => setPayOpen(true)}>Pay bill</button>
        </div>
      </div>

      {payOpen && (
        <Modal title="Pay a card bill" onClose={() => setPayOpen(false)}>
        <div className="ml-form">
          <Field label="Card">
            <Pick value={pay.cardId || (data.cards[0] || {}).id} onChange={(v) => setPay({ ...pay, cardId: v })}
              options={data.cards.map((c) => ({ value: c.id, label: c.name }))} />
          </Field>
          <Field label="From account">
            <Pick value={pay.accountId || (data.accounts[0] || {}).id} onChange={(v) => setPay({ ...pay, accountId: v })}
              options={data.accounts.map((a) => ({ value: a.id, label: a.name }))} />
          </Field>
          <Field label="Amount" span>
            <input className="ml-in ml-num" inputMode="decimal" value={pay.amount} placeholder="0" onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
          </Field>
        </div>
        <div className="ml-flex" style={{ marginTop: 12 }}>
          <button className="ml-btn" onClick={payCard}>Pay bill</button>
          <span className="ml-sub">Reduces the account balance and the card outstanding. Not counted twice as an expense.</span>
        </div>
        </Modal>
      )}

      <div className="ml-card">
        <div className="ml-between">
          <div className="ml-eyebrow">Add a card</div>
          <button className="ml-btn sm ghost" onClick={() => setShowCard(true)}>New card</button>
        </div>
        {showCard && (
          <Modal title="Add a card" onClose={() => setShowCard(false)}>
            <div className="ml-form">
              <Field label="Card name"><input className="ml-in" value={nc.name} placeholder="e.g. Cashback card" onChange={(e) => setNc({ ...nc, name: e.target.value })} /></Field>
              <Field label="Credit limit"><input className="ml-in ml-num" inputMode="decimal" value={nc.limit} placeholder="0" onChange={(e) => setNc({ ...nc, limit: e.target.value })} /></Field>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="ml-btn" onClick={() => {
                if (!nc.name.trim()) return say("Name the card first.");
                mutate((d) => d.cards.push({ id: uid(), name: nc.name.trim(), limit: num(nc.limit) }));
                setNc({ name: "", limit: "" }); setShowCard(false); say("Card added.");
              }}>Add card</button>
            </div>
          </Modal>
        )}
      </div>

      <div className="ml-card">
        <div className="ml-filter">
          <div className="ml-eyebrow">{focused ? `Spends — ${focused.name}` : "Spends ledger"}</div>
          {focused && <button className="ml-btn ghost sm" onClick={() => setFocus(null)}>Show all cards</button>}
        </div>
        <div style={{ height: 10 }} />
        <LedgerHead />
        {spends.length === 0 ? <div className="ml-empty" style={{ marginTop: 12 }}>Nothing logged yet. Your first spend goes above.</div> :
          spends.map((x) => (
            <LedgerRow key={x.id}
              title={x.note}
              meta={`${fmtDate(x.date)} · ${A.cardOf(x.cardId)} · ${x.category}${x.auto ? " · auto" : ""}${num(x.shareAmount) > 0 ? ` · ${fmt0(num(x.shareAmount))} owed by ${x.shareFriend || "a friend"}` : ""}`}
              debit={x.category === "Investment" ? 0 : x.amount}
              credit={0}
              invest={x.category === "Investment" ? x.amount : 0}
              onDelete={() => mutate((d) => { d.spends = d.spends.filter((z) => z.id !== x.id); })}
            />
          ))}
      </div>
    </>
  );
}

/* ---------- SHARED BILLS & SETTLEMENTS ---------- */
function SharedPanel({ A, data, mutate, say }) {
  const [f, setF] = useState({});
  const [open, setOpen] = useState(false);
  const [nb, setNb] = useState({
    note: "", friend: "", amount: "", share: "", date: TODAY(),
    payFrom: "card", sourceId: "", category: "Groceries",
  });

  const addBill = () => {
    const total = num(nb.amount), part = num(nb.share);
    if (!nb.note.trim()) return say("What was the bill for?");
    if (!(total > 0)) return say("Enter the total amount.");
    if (!(part > 0) || part > total) return say("Their share must be above zero and no more than the total.");
    const src = nb.sourceId || (nb.payFrom === "card" ? (data.cards[0] || {}).id : (data.accounts[0] || {}).id);
    if (!src) return say(`Add a ${nb.payFrom === "card" ? "card" : "account"} first.`);
    mutate((d) => {
      const entry = {
        id: uid(), date: nb.date, amount: total, category: nb.category,
        note: nb.note.trim(), shareAmount: part, shareFriend: nb.friend.trim(),
      };
      if (nb.payFrom === "card") {
        d.spends.push({ ...entry, cardId: src });
      } else {
        const acc = d.accounts.find((a) => a.id === src);
        acc.balance = r2(acc.balance - total);
        d.savingsTx.push({ ...entry, accountId: src, type: "withdrawal" });
      }
    });
    setNb({ ...nb, note: "", amount: "", share: "" });
    setOpen(false);
    say(`Logged. ${fmt0(part)} is owed to you; ${fmt0(total - part)} counts as your spending.`);
  };

  const removeBill = (row) => {
    mutate((d) => {
      if (row.kind === "card") {
        d.spends = d.spends.filter((x) => x.id !== row.id);
      } else {
        const t = d.savingsTx.find((x) => x.id === row.id);
        if (t) {
          const acc = d.accounts.find((a) => a.id === t.accountId);
          if (acc) acc.balance = r2(acc.balance + num(t.amount));
        }
        d.savingsTx = d.savingsTx.filter((x) => x.id !== row.id);
      }
      /* settlements logged against it go too, with the balance put back */
      d.savingsTx.filter((x) => x.type === "settlement" && x.flowId === row.id).forEach((x) => {
        const acc = d.accounts.find((a) => a.id === x.accountId);
        if (acc) acc.balance = r2(acc.balance - num(x.amount));
      });
      d.savingsTx = d.savingsTx.filter((x) => !(x.type === "settlement" && x.flowId === row.id));
    });
    say("Shared bill removed, along with anything settled against it.");
  };
  const settlements = [...data.savingsTx.filter((t) => t.type === "settlement")].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  const openRows = A.sharedRows.filter((x) => x.pending > 0);
  const doneRows = A.sharedRows.filter((x) => x.pending <= 0).slice(0, 5);

  const settle = (row) => {
    const v = f[row.id] || {};
    const amount = num(v.amount !== undefined ? v.amount : row.pending);
    const accId = v.accountId || (data.accounts[0] || {}).id;
    if (amount <= 0) return say("Enter what they paid you.");
    if (!accId) return say("Add an account to receive it into.");
    mutate((d) => {
      const a = d.accounts.find((x) => x.id === accId);
      a.balance = r2(a.balance + amount);
      d.savingsTx.push({
        id: uid(), date: TODAY(), accountId: accId, type: "settlement", amount,
        category: "Settlement", flowId: row.id, friend: row.shareFriend || "",
        note: `Settled: ${row.note || row.category}${row.shareFriend ? ` — ${row.shareFriend}` : ""}`,
      });
    });
    setF({ ...f, [row.id]: { accountId: accId } });
    say(`${fmt0(amount)} added to the balance — not income, not a spend.`);
  };

  const sources = nb.payFrom === "card" ? data.cards : data.accounts;

  return (
    <>
      {A.sharedRows.length > 0 && (
        <StatRow>
          <Stat label="Waiting to come back" value={fmt0(A.sharedPending)} tone="credit"
            note={`${openRows.length} open of ${A.sharedRows.length}`} />
          <Stat label="Already settled" value={fmt0(A.settledIn)} note={`${fmt0(A.sharedBilled)} split in total`} />
        </StatRow>
      )}

    <div className="ml-card">
      <div className="ml-between">
        <div>
          <div className="ml-eyebrow">Shared bills to collect</div>
          <div className="ml-sub" style={{ marginTop: 4 }}>
            Rent splits, household runs, anything you paid in full for someone else. Only your slice is counted as
            spending, and what they pay back lands in your balance without ever being income.
          </div>
        </div>
        <button className="ml-btn sm" onClick={() => setOpen(true)}>Add bill</button>
      </div>

      {open && (
        <Modal title="Log a shared bill" onClose={() => setOpen(false)}>
          <div className="ml-form">
            <Field label="What was it for" span>
              <input className="ml-in" value={nb.note} placeholder="e.g. Monthly household restock"
                onChange={(e) => setNb({ ...nb, note: e.target.value })} />
            </Field>
            <Field label="Who owes you">
              <input className="ml-in" value={nb.friend} placeholder="Name"
                onChange={(e) => setNb({ ...nb, friend: e.target.value })} />
            </Field>
            <Field label="Category">
              <Pick value={nb.category} onChange={(v) => setNb({ ...nb, category: v })} options={data.config.categories.map((c) => ({ value: c, label: c, hint: isExcluded(data.config, c) ? "tracked, not counted as spending" : undefined }))} />
            </Field>
            <Field label="Total you paid">
              <input className="ml-in ml-num" inputMode="decimal" value={nb.amount} placeholder="0"
                onChange={(e) => setNb({ ...nb, amount: e.target.value })} />
            </Field>
            <Field label="Their share">
              <input className="ml-in ml-num" inputMode="decimal" value={nb.share} placeholder="0"
                onChange={(e) => setNb({ ...nb, share: e.target.value })} />
            </Field>
            <Field label="Date">
              <DateField value={nb.date} onChange={(v) => setNb({ ...nb, date: v })} />
            </Field>
            <Field label="Paid from">
              <div className="ml-seg">
                <button data-on={nb.payFrom === "card" ? "1" : "0"} onClick={() => setNb({ ...nb, payFrom: "card", sourceId: "" })}>Card</button>
                <button data-on={nb.payFrom === "account" ? "1" : "0"} onClick={() => setNb({ ...nb, payFrom: "account", sourceId: "" })}>Account</button>
              </div>
            </Field>
            <Field label={nb.payFrom === "card" ? "Which card" : "Which account"} span>
              <Pick value={nb.sourceId || (sources[0] || {}).id} onChange={(v) => setNb({ ...nb, sourceId: v })}
                options={sources.map((x) => ({ value: x.id, label: x.name }))} />
            </Field>
          </div>
          <div className="ml-flex" style={{ marginTop: 12 }}>
            <button className="ml-btn" onClick={addBill}>Log shared bill</button>
          </div>
          {num(nb.amount) > 0 && num(nb.share) > 0 &&
            <div className="ml-sub" style={{ marginTop: 10 }}>
              Your share: {fmt0(Math.max(0, num(nb.amount) - num(nb.share)))}. The full {fmt0(num(nb.amount))} leaves the {nb.payFrom}.
            </div>}
        </Modal>
      )}

      {openRows.length === 0 ? (
        <div className="ml-empty" style={{ marginTop: 14 }}>
          Nothing to collect. Add a bill above, mark a spend as shared on the Cards tab, or give an auto-payment someone's share.
        </div>
      ) : openRows.map((x) => {
        const v = f[x.id] || {};
        return (
          <div key={x.id} style={{ padding: "13px 0", borderTop: "1px solid var(--rule-soft)" }}>
            <div className="ml-between">
              <div>
                <div style={{ fontWeight: 600 }}>{x.note || x.category}</div>
                <div className="ml-sub" style={{ marginTop: 3 }}>
                  {fmtDate(x.date)} · {x.source} · paid {fmt(x.amount)} · yours {fmt(A.mine(x))}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="ml-num ml-credit" style={{ fontWeight: 600 }}>{fmt(x.pending)}</div>
                <div className="ml-sub">{x.shareFriend || "a friend"} owes</div>
                <button className="ml-btn ghost sm" style={{ marginTop: 6 }} onClick={() => removeBill(x)}>Delete</button>
              </div>
            </div>
            <div className="ml-form" style={{ marginTop: 10 }}>
              <Field label="They paid">
                <input className="ml-in ml-num" inputMode="decimal" placeholder={String(x.pending)}
                  value={v.amount !== undefined ? v.amount : ""}
                  onChange={(e) => setF({ ...f, [x.id]: { ...v, amount: e.target.value } })} />
              </Field>
              <Field label="Into which account">
                <Pick value={v.accountId || (data.accounts[0] || {}).id}
                  onChange={(val) => setF({ ...f, [x.id]: { ...v, accountId: val } })}
                  options={data.accounts.map((a) => ({ value: a.id, label: a.name }))} />
              </Field>
            </div>
            <div className="ml-flex" style={{ marginTop: 10 }}>
              <button className="ml-btn sm" onClick={() => settle(x)}>Mark settled</button>
              {x.settled > 0 && <span className="ml-sub ml-num">{fmt(x.settled)} already received</span>}
            </div>
          </div>
        );
      })}

      {doneRows.length > 0 && (
        <>
          <hr className="ml-hr" />
          <div className="ml-eyebrow">Settled in full</div>
          {doneRows.map((x) => (
            <div className="ml-between" key={x.id} style={{ fontSize: 13, marginTop: 7 }}>
              <span>{x.note || x.category} <span className="ml-sub">· {fmtDate(x.date)} · {x.shareFriend || "friend"}</span></span>
              <span className="ml-num ml-credit">{fmt(x.shareDue)}</span>
            </div>
          ))}
        </>
      )}

      {settlements.length > 0 && (
        <>
          <hr className="ml-hr" />
          <div className="ml-eyebrow">Money received back</div>
          {settlements.map((t) => (
            <div className="ml-between" key={t.id} style={{ padding: "7px 0", borderTop: "1px solid var(--rule-soft)", fontSize: 13 }}>
              <span>{fmtDate(t.date)} <span className="ml-sub">· {t.note} · into {A.accOf(t.accountId)}</span></span>
              <span className="ml-flex">
                <span className="ml-num ml-credit">{fmt(t.amount)}</span>
                <button className="ml-x" title="Remove" onClick={() => mutate((d) => {
                  const a = d.accounts.find((x) => x.id === t.accountId);
                  if (a) a.balance = r2(a.balance - num(t.amount));
                  d.savingsTx = d.savingsTx.filter((x) => x.id !== t.id);
                })}><TrashIcon /></button>
              </span>
            </div>
          ))}
        </>
      )}
    </div>
    </>
  );
}

/* ---------- FRIENDS' EMI ---------- */
function Emis({ A, data, mutate, say }) {
  const [e, setE] = useState({ friend: "", item: "", cardId: "", principal: "", months: "6", startDate: TODAY(), note: "" });
  const [rp, setRp] = useState({});
  const [repay, setRepay] = useState(null);
  const [open, setOpen] = useState(false);

  const add = () => {
    if (!e.friend.trim()) return say("Whose purchase is this?");
    if (num(e.principal) <= 0 || num(e.months) <= 0) return say("Add the amount and number of months.");
    mutate((d) => d.emis.push({
      id: uid(), friend: e.friend.trim(), item: e.item.trim() || "Purchase",
      cardId: e.cardId || (d.cards[0] || {}).id, principal: num(e.principal),
      months: Math.round(num(e.months)), startDate: e.startDate, note: e.note.trim(),
    }));
    setE({ ...e, friend: "", item: "", principal: "", note: "" });
    setOpen(false);
    say("EMI tracked.");
  };

  const logRepayment = (emi) => {
    const v = rp[emi.id];
    const amount = num(v && v.amount);
    if (amount <= 0) return say("Enter what they paid you.");
    mutate((d) => d.repayments.push({
      id: uid(), emiId: emi.id, date: (v && v.date) || TODAY(), amount,
      note: (v && v.note) || `Repayment from ${emi.friend}`,
    }));
    setRp({ ...rp, [emi.id]: { amount: "", date: TODAY(), note: "" } });
    say(`Logged ${fmt0(amount)} from ${emi.friend}.`);
  };

  return (
    <>
      {A.emiRows.length > 0 && (
        <StatRow>
          <Stat label="Owed to you" value={fmt0(A.receivable)} tone="credit"
            note={`${A.emiRows.length} purchase${A.emiRows.length > 1 ? "s" : ""} · ${fmt0(A.cardBlocked)} blocking your limit`} />
          <Stat label="Past due" value={fmt0(A.overdueTotal)} tone={A.overdueTotal > 0 ? "debit" : null}
            note={A.overdueTotal > 0 ? "billed but not repaid" : "everyone's up to date"} />
        </StatRow>
      )}

      <div className="ml-card">
        <div className="ml-between">
          <div>
            <div className="ml-eyebrow">Friends' purchases</div>
            <div className="ml-sub" style={{ marginTop: 4 }}>The full amount holds against your card's limit from the day they buy and is released as they repay you, while only the instalments actually due show as payable. These never count as your spending.</div>
          </div>
          <button className="ml-btn sm" onClick={() => setOpen(true)}>Track EMI</button>
        </div>

        {open && (
          <Modal title="Track a friend's EMI" onClose={() => setOpen(false)}>
            <div className="ml-form">
              <Field label="Friend"><input className="ml-in" value={e.friend} placeholder="Name" onChange={(x) => setE({ ...e, friend: x.target.value })} /></Field>
              <Field label="What they bought"><input className="ml-in" value={e.item} placeholder="e.g. Phone" onChange={(x) => setE({ ...e, item: x.target.value })} /></Field>
              <Field label="On which card">
                <Pick value={e.cardId || (data.cards[0] || {}).id} onChange={(v) => setE({ ...e, cardId: v })}
                  options={data.cards.map((c) => ({ value: c.id, label: c.name }))} />
              </Field>
              <Field label="Total amount"><input className="ml-in ml-num" inputMode="decimal" value={e.principal} placeholder="0" onChange={(x) => setE({ ...e, principal: x.target.value })} /></Field>
              <Field label="Months"><input className="ml-in ml-num" inputMode="numeric" value={e.months} onChange={(x) => setE({ ...e, months: x.target.value })} /></Field>
              <Field label="First instalment"><DateField value={e.startDate} onChange={(v) => setE({ ...e, startDate: v })} /></Field>
              <Field label="Note" span><input className="ml-in" value={e.note} placeholder="Terms you agreed on" onChange={(x) => setE({ ...e, note: x.target.value })} /></Field>
            </div>
            <div style={{ marginTop: 12 }}><button className="ml-btn" onClick={add}>Start tracking</button></div>
          </Modal>
        )}
      </div>

      {A.emiRows.length === 0 ? (
        <div className="ml-card"><div className="ml-empty">No friend EMIs yet. Add one above and the repayment log appears here.</div></div>
      ) : A.emiRows.map((x) => {
        const pct = Math.min(100, Math.round((x.received / Math.max(1, num(x.principal))) * 100));
        const mine = data.repayments.filter((r) => r.emiId === x.id).sort((a, b) => b.date.localeCompare(a.date));
        const v = rp[x.id] || { amount: "", date: TODAY(), note: "" };
        return (
          <div className="ml-card" key={x.id}>
            <div className="ml-between">
              <div>
                <div className="ml-h" style={{ fontSize: 15 }}>{x.friend} — {x.item}</div>
                <div className="ml-sub" style={{ marginTop: 3 }}>
                  {fmt0(x.monthly)}/month × {x.months} · started {fmtDate(x.startDate)} · {A.cardOf(x.cardId)}
                </div>
              </div>
              <button className="ml-x" title="Remove" onClick={() => mutate((d) => {
                d.emis = d.emis.filter((z) => z.id !== x.id);
                d.repayments = d.repayments.filter((z) => z.emiId !== x.id);
              })}><TrashIcon /></button>
            </div>

            <div className="ml-bar" style={{ marginTop: 12 }}>
              <i style={{ width: `${pct}%`, background: x.overdue > 0 ? "var(--amber)" : "var(--credit)" }} />
            </div>
            <div className="ml-flex" style={{ marginTop: 8, justifyContent: "space-between", fontSize: 12 }}>
              <span className="ml-num">{fmt0(x.received)} repaid ({pct}%)</span>
              <span className="ml-num" style={{ color: "var(--debit)" }}>{fmt0(x.outstanding)} outstanding</span>
            </div>
            <div className="ml-sub" style={{ marginTop: 6 }}>
              {x.due} of {x.months} instalments billed.{" "}
              {x.overdue > 0
                ? <span style={{ color: "var(--amber)" }}>{fmt0(x.overdue)} past due — you're carrying it.</span>
                : <span style={{ color: "var(--credit)" }}>Up to date.</span>}
            </div>

            <hr className="ml-hr" />
            <div className="ml-between">
              <div className="ml-eyebrow">Repayments received</div>
              <button className="ml-btn sm" onClick={() => { setRepay(x.id); setRp({ ...rp, [x.id]: { ...v, amount: String(x.monthly) } }); }}>
                Log repayment
              </button>
            </div>

            {repay === x.id && (
              <Modal title={`Repayment from ${x.friend}`} subtitle={`${fmt0(x.monthly)} a month · ${fmt0(x.pending || x.outstanding)} outstanding`}
                onClose={() => setRepay(null)}>
                <div className="ml-form">
                  <Field label="Amount">
                    <input className="ml-in ml-num" inputMode="decimal" value={v.amount} placeholder={String(x.monthly)}
                      onChange={(ev) => setRp({ ...rp, [x.id]: { ...v, amount: ev.target.value } })} />
                  </Field>
                  <Field label="Received on">
                    <DateField value={v.date || TODAY()} onChange={(val) => setRp({ ...rp, [x.id]: { ...v, date: val } })} />
                  </Field>
                </div>
                <div className="ml-flex" style={{ marginTop: 12 }}>
                  <button className="ml-btn" onClick={() => { logRepayment(x); setRepay(null); }}>Log it</button>
                  <button className="ml-btn ghost" onClick={() => setRp({ ...rp, [x.id]: { ...v, amount: String(x.monthly) } })}>One instalment</button>
                </div>
              </Modal>
            )}

            {mine.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {mine.map((r) => (
                  <div className="ml-between" key={r.id} style={{ padding: "7px 0", borderTop: "1px solid var(--rule-soft)", fontSize: 13 }}>
                    <span>{fmtDate(r.date)} <span className="ml-sub">· {r.note}</span></span>
                    <span className="ml-flex">
                      <span className="ml-num ml-credit">{fmt(r.amount)}</span>
                      <button className="ml-x" onClick={() => mutate((d) => { d.repayments = d.repayments.filter((z) => z.id !== r.id); })}><TrashIcon /></button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ---------- AUTO-PAY ---------- */
function Auto({ A, data, mutate, say }) {
  const [r, setR] = useState({
    name: "", amount: "", frequency: "monthly", nextDue: TODAY(),
    sourceType: "savings", sourceId: "", category: "Loan EMI", totalInstallments: "",
    shareAmount: "", shareFriend: "",
  });
  const [open, setOpen] = useState(false);

  const add = () => {
    if (!r.name.trim()) return say("Name the payment.");
    if (num(r.amount) <= 0) return say("Enter an amount above zero.");
    const src = r.sourceId || (r.sourceType === "savings" ? (data.accounts[0] || {}).id : (data.cards[0] || {}).id);
    if (!src) return say(`Add a ${r.sourceType === "savings" ? "savings account" : "card"} first.`);
    mutate((d) => d.recurring.push({
      id: uid(), name: r.name.trim(), amount: num(r.amount), frequency: r.frequency,
      nextDue: r.nextDue, sourceType: r.sourceType, sourceId: src, category: r.category,
      totalInstallments: Math.round(num(r.totalInstallments)), paidInstallments: 0, active: true,
      shareAmount: num(r.shareAmount), shareFriend: r.shareFriend.trim(),
    }));
    setR({ ...r, name: "", amount: "", totalInstallments: "" });
    setOpen(false);
    say("Scheduled. It deducts itself on the due date.");
  };

  const sources = r.sourceType === "savings" ? data.accounts : data.cards;

  return (
    <>
      <div className="ml-card">
        <div className="ml-between">
          <div>
            <div className="ml-eyebrow">Scheduled payments</div>
            <div className="ml-sub" style={{ marginTop: 4 }}>
              Mapped to an account or a card. On the due date the balance moves on its own and the entry lands in the ledger.
            </div>
          </div>
          <button className="ml-btn sm" onClick={() => setOpen(true)}>Add payment</button>
        </div>

        {open && (
          <Modal title="Schedule a payment" onClose={() => setOpen(false)}>
            <div className="ml-form">
              <Field label="Name"><input className="ml-in" value={r.name} placeholder="e.g. Home loan, Rent, SIP" onChange={(e) => setR({ ...r, name: e.target.value })} /></Field>
              <Field label="Amount"><input className="ml-in ml-num" inputMode="decimal" value={r.amount} placeholder="0" onChange={(e) => setR({ ...r, amount: e.target.value })} /></Field>
              <Field label="Repeats">
                <Pick value={r.frequency} onChange={(v) => setR({ ...r, frequency: v })}
                  options={[["weekly", "Weekly"], ["monthly", "Monthly"], ["quarterly", "Quarterly"], ["yearly", "Yearly"]]
                    .map(([value, label]) => ({ value, label }))} />
              </Field>
              <Field label="Next due"><DateField value={r.nextDue} onChange={(v) => setR({ ...r, nextDue: v })} /></Field>
              <Field label="Deduct from">
                <div className="ml-seg">
                  <button data-on={r.sourceType === "savings" ? "1" : "0"} onClick={() => setR({ ...r, sourceType: "savings", sourceId: "" })}>Account</button>
                  <button data-on={r.sourceType === "card" ? "1" : "0"} onClick={() => setR({ ...r, sourceType: "card", sourceId: "" })}>Card</button>
                </div>
              </Field>
              <Field label={r.sourceType === "savings" ? "Which account" : "Which card"}>
                <Pick value={r.sourceId || (sources[0] || {}).id} onChange={(v) => setR({ ...r, sourceId: v })}
                  options={sources.map((x) => ({ value: x.id, label: x.name }))} />
              </Field>
              <Field label="Category">
                <Pick value={r.category} onChange={(v) => setR({ ...r, category: v })} options={data.config.categories.map((c) => ({ value: c, label: c, hint: isExcluded(data.config, c) ? "tracked, not counted as spending" : undefined }))} />
              </Field>
              <Field label="Total instalments (0 = open-ended)">
                <input className="ml-in ml-num" inputMode="numeric" value={r.totalInstallments} placeholder="e.g. 180 for a loan" onChange={(e) => setR({ ...r, totalInstallments: e.target.value })} />
              </Field>
              <Field label="Someone's share of this (₹)">
                <input className="ml-in ml-num" inputMode="decimal" value={r.shareAmount} placeholder="0 if it's all yours" onChange={(e) => setR({ ...r, shareAmount: e.target.value })} />
              </Field>
              <Field label="Who owes you that share">
                <input className="ml-in" value={r.shareFriend} placeholder="e.g. flatmate" onChange={(e) => setR({ ...r, shareFriend: e.target.value })} />
              </Field>
            </div>
            <div className="ml-sub" style={{ marginTop: 10 }}>
              Split rent works here: the full amount leaves your account, only your slice counts as spending, and their slice waits on the Friends tab.
            </div>
            <div style={{ marginTop: 12 }}><button className="ml-btn" onClick={add}>Schedule it</button></div>
          </Modal>
        )}
      </div>

      {data.recurring.length === 0 ? (
        <div className="ml-card"><div className="ml-empty">Nothing on schedule. Loans, rent, SIPs and subscriptions belong here.</div></div>
      ) : (
        <div className="ml-card">
          {data.recurring.map((x) => {
            const left = x.totalInstallments ? Math.max(0, x.totalInstallments - (x.paidInstallments || 0)) : null;
            const src = x.sourceType === "savings" ? A.accOf(x.sourceId) : A.cardOf(x.sourceId);
            return (
              <div key={x.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--rule-soft)" }}>
                <div className="ml-between">
                  <div>
                    <div style={{ fontWeight: 600 }}>{x.name} {!x.active && <span className="ml-pill">Finished</span>}</div>
                    <div className="ml-sub" style={{ marginTop: 3 }}>
                      {x.frequency} · from {src} · {x.category}
                      {isExcluded(data.config, x.category) && <span style={{ color: "var(--stamp)" }}> · not counted as spending</span>}
                      {num(x.shareAmount) > 0 && <span style={{ color: "var(--credit)" }}> · {fmt0(num(x.shareAmount))} back from {x.shareFriend || "a friend"}</span>}
                    </div>
                    <div className="ml-sub ml-num" style={{ marginTop: 3 }}>
                      Next {fmtDate(x.nextDue)}{left !== null ? ` · ${left} of ${x.totalInstallments} left` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="ml-num" style={{ fontWeight: 600 }}>{fmt0(x.amount)}</div>
                    {left !== null && left > 0 && <div className="ml-sub ml-num">{fmt0(left * num(x.amount))} to go</div>}
                  </div>
                </div>
                <div className="ml-flex" style={{ marginTop: 8 }}>
                  <button className="ml-btn ghost sm" onClick={() => mutate((d) => {
                    const y = d.recurring.find((z) => z.id === x.id); y.active = !y.active;
                  })}>{x.active ? "Pause" : "Resume"}</button>
                  <button className="ml-btn ghost sm" onClick={() => mutate((d) => { d.recurring = d.recurring.filter((z) => z.id !== x.id); })}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ---------- BUDGET ---------- */
function Budget({ A, data, mutate, say }) {
  const [b, setB] = useState({ cat: "Groceries", amount: "" });
  const [budgetOpen, setBudgetOpen] = useState(false);
  const totalCap = A.budgetRows.filter((x) => !x.target).reduce((s, x) => s + x.amount, 0);
  const totalUsed = A.budgetRows.filter((x) => !x.target).reduce((s, x) => s + x.used, 0);

  return (
    <>
      <StatRow>
        <Stat label="Budgeted" value={fmt0(totalCap)} note="expense categories" />
        <Stat label="Used" value={fmt0(totalUsed)} tone={totalUsed > totalCap && totalCap > 0 ? "debit" : null} />
        <Stat label="Left to spend" value={fmt0(Math.max(0, totalCap - totalUsed))} tone="credit" />
        <Stat label="Unbudgeted spend" value={fmt0(Math.max(0, A.spentMonth - totalUsed))} note="outside your caps" />
      </StatRow>

      <div className="ml-card">
        <div className="ml-between">
          <div>
            <div className="ml-eyebrow">Set money aside</div>
            <div className="ml-sub" style={{ marginTop: 4 }}>A monthly cap per category, or a target for Investment.</div>
          </div>
          <button className="ml-btn sm" onClick={() => setBudgetOpen(true)}>Set a budget</button>
        </div>
      </div>

      {budgetOpen && (
        <Modal title="Set money aside" onClose={() => setBudgetOpen(false)}>
        <div className="ml-form">
          <Field label="Category">
            <Pick value={b.cat} onChange={(v) => setB({ ...b, cat: v })}
              options={data.config.categories.map((c) => ({ value: c, label: c }))} />
          </Field>
          <Field label={b.cat === "Investment" ? "Monthly target" : "Monthly cap"}>
            <input className="ml-in ml-num" inputMode="decimal" value={b.amount} placeholder="0" onChange={(e) => setB({ ...b, amount: e.target.value })} />
          </Field>
        </div>
        <div className="ml-flex" style={{ marginTop: 12 }}>
          <button className="ml-btn" onClick={() => {
            if (num(b.amount) <= 0) return say("Enter an amount above zero.");
            mutate((d) => { d.budgets[b.cat] = num(b.amount); });
            setB({ ...b, amount: "" });
            setBudgetOpen(false);
            say(`${b.cat} set to ${fmt0(num(b.amount))} a month.`);
          }}>Save budget</button>
          <span className="ml-sub">Investment is a target to hit, not a cap to stay under.</span>
        </div>
        </Modal>
      )}

      <div className="ml-card">
        <div className="ml-eyebrow">This month against plan</div>
        {A.budgetRows.length === 0 ? <div className="ml-empty" style={{ marginTop: 12 }}>No budgets yet. Start with your two biggest categories.</div> :
          A.budgetRows.map((x) => {
            const over = !x.target && x.pct > 100;
            const colour = x.target ? "var(--stamp)" : over ? "var(--debit)" : x.pct > 80 ? "var(--amber)" : "var(--credit)";
            return (
              <div key={x.cat} style={{ marginBottom: 15 }}>
                <div className="ml-between" style={{ fontSize: 13.5 }}>
                  <span>
                    {x.cat} {x.target && <span className="ml-pill">Target</span>}
                    {over && <span className="ml-pill off">Over</span>}
                  </span>
                  <span className="ml-num">{fmt0(x.used)} <span className="ml-sub">of {fmt0(x.amount)}</span></span>
                </div>
                <div className="ml-bar" style={{ marginTop: 5 }}><i style={{ width: `${Math.min(100, x.pct)}%`, background: colour }} /></div>
                <div className="ml-flex" style={{ marginTop: 5, justifyContent: "space-between" }}>
                  <span className="ml-sub">
                    {x.target ? `${x.pct}% of target reached` : over ? `${fmt0(x.used - x.amount)} over` : `${fmt0(x.amount - x.used)} left`}
                  </span>
                  <button className="ml-btn ghost sm" onClick={() => mutate((d) => { delete d.budgets[x.cat]; })}>Remove</button>
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}

/* ---------- BACKUP ---------- */
function Backup({ A, data, mutate, setData, say }) {
  const [restore, setRestore] = useState("");
  const [reveal, setReveal] = useState(false);
  const [fileName, setFileName] = useState("");
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const text = JSON.stringify(data);
  const pretty = JSON.stringify(data, null, 2);
  const entries = data.spends.length + data.savingsTx.length + data.emis.length + data.repayments.length;
  const size = `${Math.max(1, Math.round(text.length / 1024))} KB`;
  const last = data.config.lastBackup;

  const mark = () => mutate((d) => { d.config.lastBackup = new Date().toISOString(); });

  const download = () => {
    try {
      const blob = new Blob([pretty], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `money-ledger-${TODAY()}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 400);
      mark();
      say("Backup file saved to your device.");
    } catch (err) {
      setReveal(true);
      say("Download isn't available here — copy the text instead.");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      mark();
      say("Backup copied to the clipboard.");
    } catch (err) {
      setReveal(true);
      setTimeout(() => { if (taRef.current) taRef.current.select(); }, 50);
      say("Select the text and copy it manually.");
    }
  };

  const apply = (raw) => {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.accounts) throw new Error("shape");
      const d = { ...blank(), ...parsed, config: { ...blank().config, ...(parsed.config || {}) } };
      runAccrual(d); runRecurring(d);
      setData(d); setRestore("");
      say("Backup restored.");
    } catch (err) { say("That doesn't look like a Money Ledger backup."); }
  };

  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => apply(String(reader.result));
    reader.onerror = () => say("Couldn't read that file.");
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <>
      <StatRow>
        <Stat raw label="Entries" value={String(entries)} note={`${data.accounts.length} accounts · ${data.cards.length} cards`} />
        <Stat raw label="Backup size" value={size} />
        <Stat raw label="Last taken" value={last ? fmtDate(last.slice(0, 10)) : "Never"} tone={last ? null : "debit"} />
        <Stat raw label="Stored" value="This device" note="nothing is uploaded" />
      </StatRow>

      <div className="ml-card">
        <div className="ml-eyebrow">Take a backup</div>
        <div className="ml-sub" style={{ marginTop: 4 }}>
          Your ledger lives only in this app's storage. Clearing the app, clearing browser data, or a device wipe takes it
          with them — a copy kept somewhere else is the only thing that survives that.
        </div>
        <div className="ml-flex" style={{ marginTop: 12 }}>
          <button className="ml-btn" onClick={download}>Download .json file</button>
          <button className="ml-btn ghost" onClick={copy}>Copy as text</button>
          <button className="ml-btn ghost" onClick={() => setReveal(!reveal)}>{reveal ? "Hide contents" : "Show contents"}</button>
        </div>
        {reveal && (
          <>
            <div className="ml-sub" style={{ marginTop: 12 }}>Every figure you've entered is in here in plain text. Keep it somewhere private.</div>
            <textarea ref={taRef} className="ml-ta" readOnly style={{ marginTop: 8 }} value={text} onFocus={(e) => e.target.select()} />
          </>
        )}
      </div>

      <div className="ml-card">
        <div className="ml-eyebrow">Restore</div>
        <div className="ml-sub" style={{ marginTop: 4 }}>
          Replaces everything currently in the ledger, then catches up interest and any auto-payments due since the backup was taken.
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="ml-eyebrow">From a file</div>
          <input ref={fileRef} type="file" accept="application/json,.json,text/plain" onChange={onFile} style={{ display: "none" }} />
          <div className="ml-flex" style={{ marginTop: 8 }}>
            <button className="ml-btn ghost" onClick={() => fileRef.current && fileRef.current.click()}>Choose a file</button>
            <span className="ml-sub">{fileName || "No file chosen yet"}</span>
          </div>
        </div>
        <hr className="ml-hr" />
        <div className="ml-eyebrow">Or paste the text</div>
        <textarea className="ml-ta" style={{ marginTop: 8 }} placeholder="Paste a backup here" value={restore} onChange={(e) => setRestore(e.target.value)} />
        <div style={{ marginTop: 10 }}>
          <button className="ml-btn ghost" onClick={() => apply(restore)}>Restore from text</button>
        </div>
      </div>

      <div className="ml-card">
        <div className="ml-eyebrow">Moving to a new phone</div>
        <ol style={{ fontSize: 13, color: "var(--body)", paddingLeft: 18, marginTop: 8, lineHeight: 1.7 }}>
          <li>Download the .json file on the old device.</li>
          <li>Send it to yourself however you like, or keep it in your files app.</li>
          <li>Open the ledger on the new device and restore from that file.</li>
        </ol>
      </div>
    </>
  );
}

/* ---------- SETTINGS ---------- */
function Settings({ A, data, mutate, setData, say, setPosted, where }) {
  const [rate, setRate] = useState(String(data.config.repoRate));
  const [income, setIncome] = useState(String(data.config.monthlyIncome || ""));
  const [newCat, setNewCat] = useState("");
  const [catCounts, setCatCounts] = useState(true);
  const [catOpen, setCatOpen] = useState(false);
  const [armed, setArmed] = useState(false);

  const applyRate = () => {
    if (!(num(rate) >= 0)) return say("Enter a rate of zero or more.");
    mutate((d) => {
      runAccrual(d); // settle interest at the old rate first
      d.config.repoRate = num(rate);
    });
    setPosted([]);
    say(`Repo rate set to ${num(rate).toFixed(2)}%. Interest up to today was settled at the old rate.`);
  };

  return (
    <>
      <div className="ml-card">
        <div className="ml-eyebrow">Interest engine</div>
        <div className="ml-sub" style={{ marginTop: 4, marginBottom: 12 }}>
          The RBI repo rate is the one and only interest rate in this app. Every account marked as earning interest
          uses it — there are no per-account rates. Update it here whenever the RBI moves and every account follows
          from the next day's accrual onwards.
        </div>
        <div className="ml-form">
          <Field label="RBI repo rate (% p.a.)" span>
            <input className="ml-in ml-num" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
          </Field>
        </div>
        <div className="ml-flex" style={{ marginTop: 12 }}>
          <button className="ml-btn" onClick={applyRate}>Update rate</button>
          <span className="ml-sub ml-num">{num(rate).toFixed(2)}% a year → {(num(rate) / 365).toFixed(5)}% a day, compounded daily.</span>
        </div>
      </div>

      <div className="ml-card">
        <div className="ml-eyebrow">Income</div>
        <div className="ml-form" style={{ marginTop: 10 }}>
          <Field label="Monthly take-home">
            <input className="ml-in ml-num" inputMode="decimal" value={income} placeholder="0" onChange={(e) => setIncome(e.target.value)} />
          </Field>
        </div>
        <div className="ml-flex" style={{ marginTop: 12 }}>
          <button className="ml-btn" onClick={() => { mutate((d) => { d.config.monthlyIncome = num(income); }); say("Income updated."); }}>Save income</button>
          <span className="ml-sub">An analysis figure only — it drives the save rate and the advice on Overview, and never appears as a transaction. Salary landing in an account is logged separately under Move money.</span>
        </div>
      </div>

      <div className="ml-card">
        <div className="ml-between">
          <div>
            <div className="ml-eyebrow">Categories</div>
            <div className="ml-sub" style={{ marginTop: 4 }}>
              {data.config.categories.length} in use · {data.config.categories.filter((c) => isExcluded(data.config, c)).length} tracked only
            </div>
          </div>
          <button className="ml-btn sm" onClick={() => setCatOpen(true)}>Manage</button>
        </div>
      </div>

      {catOpen && (
        <Modal title="Categories" subtitle="Tracked-only ones still move your balance" onClose={() => setCatOpen(false)}>
          {data.config.categories.map((c) => {
            const off = isExcluded(data.config, c);
            return (
              <div key={c} className="ml-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--rule-soft)" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, overflowWrap: "anywhere" }}>{c}</div>
                  <div className="ml-sub" style={{ marginTop: 1 }}>{off ? "Tracked only" : "Counts as spending"}</div>
                </div>
                <div className="ml-flex" style={{ flexWrap: "nowrap" }}>
                  <button className="ml-btn ghost sm" onClick={() => mutate((d) => {
                    const list = d.config.excluded || DEFAULT_EXCLUDED.slice();
                    d.config.excluded = off ? list.filter((x) => x !== c) : [...list, c];
                  })}>{off ? "Count it" : "Track only"}</button>
                  <button className="ml-x" title="Remove" onClick={() => {
                    if (data.config.categories.length <= 1) return say("Keep at least one category.");
                    mutate((d) => {
                      d.config.categories = d.config.categories.filter((x) => x !== c);
                      d.config.excluded = (d.config.excluded || []).filter((x) => x !== c);
                    });
                  }}><TrashIcon /></button>
                </div>
              </div>
            );
          })}

          <div className="ml-form" style={{ marginTop: 14 }}>
            <Field label="New category" span>
              <input className="ml-in" value={newCat} placeholder="e.g. Gifts" onChange={(e) => setNewCat(e.target.value)} />
            </Field>
            <Field label="Counts as spending" span>
              <div className="ml-seg">
                <button data-on={catCounts ? "1" : "0"} onClick={() => setCatCounts(true)}>Yes</button>
                <button data-on={!catCounts ? "1" : "0"} onClick={() => setCatCounts(false)}>Track only</button>
              </div>
            </Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="ml-btn" onClick={() => {
              const v = newCat.trim();
              if (!v) return say("Type a name first.");
              if (data.config.categories.includes(v)) return say("That one already exists.");
              mutate((d) => {
                d.config.categories = [...d.config.categories, v];
                if (!catCounts) d.config.excluded = [...(d.config.excluded || DEFAULT_EXCLUDED.slice()), v];
              });
              setNewCat("");
            }}>Add category</button>
          </div>
        </Modal>
      )}

      <div className="ml-card">
        <div className="ml-eyebrow">Your data</div>
        <div className="ml-sub" style={{ marginTop: 4 }}>
          Everything is saved on this device {where === "local" ? "in browser storage" : "automatically"} and reloads when you come back.
          Nothing leaves it — which also means clearing it here is final. Take a copy from the Backup tab first.
        </div>
        <div className="ml-flex" style={{ marginTop: 12 }}>
          <button className="ml-btn ghost" onClick={() => {
            const d = sampleData(); runAccrual(d); runRecurring(d);
            setData(d); say("Sample month loaded.");
          }}>Load a sample month</button>
          <button className="ml-btn danger" onClick={() => {
            if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 4000); return; }
            setData(blank()); setPosted([]); setArmed(false); say("Ledger cleared.");
          }}>{armed ? "Tap again to erase" : "Clear everything"}</button>
        </div>

      </div>

    </>
  );
}
