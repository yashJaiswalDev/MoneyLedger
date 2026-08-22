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
.ml-root input,.ml-root select,.ml-root textarea{font-family:inherit;font-size:16px;
  -webkit-appearance:none;appearance:none;border-radius:2px;max-width:100%;}
.ml-root :focus-visible{outline:2px solid var(--stamp);outline-offset:2px;}
.ml-root input[type="date"]{min-width:0;display:block;text-align:left;}
.ml-root input[type="date"]::-webkit-date-and-time-value{text-align:left;margin:0;}
.ml-root input[type="date"]::-webkit-calendar-picker-indicator{opacity:.55;}

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
.ml-nw{text-align:right;}
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
.ml-card{background:var(--sheet);border:1px solid var(--rule);border-radius:3px;padding:16px;margin-top:14px;}
.ml-card>.ml-eyebrow:first-child{display:block;margin-bottom:10px;}
.ml-grid{display:grid;gap:14px;}
@media(min-width:780px){.ml-2{grid-template-columns:1fr 1fr;}.ml-3{grid-template-columns:repeat(3,1fr);}}
.ml-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:3px;margin-top:14px;overflow:hidden;}
@media(min-width:680px){.ml-stats{grid-template-columns:repeat(4,1fr);}}
.ml-stat{background:var(--sheet);padding:13px 14px;}
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
.ml-x{background:none;border:0;color:var(--soft);font-size:17px;line-height:1;padding:2px 4px;border-radius:2px;min-width:32px;min-height:32px;}
.ml-x:hover{color:var(--debit);background:var(--paper);}
@media(max-width:700px){
  .ml-lhead{display:none;}
  .ml-lrow{grid-template-columns:minmax(0,1fr) 26px;row-gap:3px;}
  .ml-lmain{grid-column:1;} .ml-x{grid-column:2;grid-row:1;}
  .ml-lcell{grid-column:1/-1;display:flex;justify-content:space-between;text-align:left;}
  .ml-lcell:empty{display:none;}
  .ml-lcell::before{content:attr(data-l);font-family:'Archivo',sans-serif;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--soft);}
}

/* ---- forms ---- */
.ml-form{display:grid;gap:10px;grid-template-columns:1fr;}
@media(min-width:620px){.ml-form{grid-template-columns:repeat(2,1fr);}.ml-span{grid-column:1/-1;}}
.ml-f label{display:block;font-family:'Archivo',sans-serif;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);margin-bottom:4px;}
.ml-in{width:100%;padding:10px;border:1px solid var(--rule);border-radius:2px;background:var(--field);color:var(--ink);min-height:44px;line-height:1.25;}
.ml-in:focus{border-color:var(--stamp);}
select.ml-in{-webkit-appearance:none;appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--soft) 50%),linear-gradient(135deg,var(--soft) 50%,transparent 50%);background-position:calc(100% - 15px) 51%,calc(100% - 10px) 51%;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:28px;}
.ml-btn{padding:8px 14px;border:1px solid var(--ink);background:var(--ink);color:var(--paper);border-radius:2px;
  font-family:'Archivo',sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
  min-height:44px;display:inline-flex;align-items:center;justify-content:center;text-align:center;}
.ml-btn:hover{background:#000;}
.ml-btn.ghost{background:transparent;color:var(--ink);border-color:var(--rule);}
.ml-btn.ghost:hover{background:var(--paper);border-color:var(--ink);}
.ml-btn.danger{background:transparent;color:var(--debit);border-color:var(--debit);}
.ml-btn.danger:hover{background:var(--debit);color:var(--sheet);}
.ml-btn.sm{padding:5px 10px;font-size:10px;min-height:34px;}
.ml-seg{display:inline-flex;border:1px solid var(--rule);border-radius:2px;overflow:hidden;}
.ml-seg button{padding:8px 16px;border:0;background:var(--field);color:var(--soft);font-family:'Archivo',sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;min-height:44px;}
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
.ml-ta{width:100%;min-height:110px;padding:10px;border:1px solid var(--rule);border-radius:2px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:16px;line-height:1.4;background:var(--field);color:var(--ink);word-break:break-all;}
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
const NON_EXPENSE = ["Investment", "Transfer", "Card Payment", "Settlement", "Refund"];
/* Credits that raise a balance but are not income. */
const NON_INCOME = ["Settlement", "Transfer", "Refund", "Card Payment"];
const BASE_CATEGORIES = [
  "Groceries", "Dining", "Utilities", "Rent", "Travel", "Fuel", "Shopping",
  "Health", "Entertainment", "Subscriptions", "Education", "Loan EMI",
  "Investment", "Transfer", "Card Payment", "Settlement", "Refund", "Other",
];
/* What a credit into an account can be. Only Income counts as income. */
const DEPOSIT_KINDS = [
  ["Income", "salary, freelance, anything you earned"],
  ["Settlement", "a friend paying you back for a shared bill"],
  ["Transfer", "moved in from another account of yours"],
  ["Refund", "money returned to you"],
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

/* ---------- initial state ---------- */
const blank = () => ({
  config: {
    repoRate: 5.25,          // set in the Settings tab — the only source of the rate
    monthlyIncome: 0,
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
    const isExpense = (f) => !NON_EXPENSE.includes(f.category);
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
      const friends = r2(emiRows.filter((e) => e.cardId === c.id).reduce((s, e) => s + Math.min(num(e.principal), e.due * e.monthly), 0));
      const paid = r2(data.savingsTx.filter((t) => t.type === "card-payment" && t.cardId === c.id).reduce((s, t) => s + num(t.amount), 0));
      return { ...c, own, friends, paid, outstanding: r2(own + friends - paid) };
    });
    const cardOutstanding = r2(cardRows.reduce((s, c) => s + c.outstanding, 0));

    const savingsTotal = r2(data.accounts.reduce((s, a) => s + num(a.balance), 0));
    const loanRemaining = r2(
      data.recurring.filter((r) => r.active && r.totalInstallments > 0)
        .reduce((s, r) => s + num(r.amount) * Math.max(0, r.totalInstallments - (r.paidInstallments || 0)), 0)
    );
    const receivableTotal = r2(receivable + sharedPending);
    const netWorth = r2(savingsTotal + receivableTotal - cardOutstanding - loanRemaining);

    /* settlements and transfers raise the balance but are never income */
    const income = num(data.config.monthlyIncome) ||
      r2(data.savingsTx
        .filter((t) => t.type === "deposit" && !NON_INCOME.includes(t.category) && t.date.slice(0, 7) === thisMonth)
        .reduce((s, t) => s + num(t.amount), 0));
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
      tips.push(["Shared bills unsettled", `${fmt0(sharedPending)} of shared spending is still to come back to you. It's already out of your expense figures, but it isn't in your account yet.`]);
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
  const TABS = [
    ["overview", "Overview"], ["savings", "Savings"], ["cards", "Cards"],
    ["emi", "Friends"], ["auto", "Auto-pay"], ["budget", "Budget"],
    ["backup", "Backup"], ["settings", "Settings"],
  ];

  return (
    <div className="ml-root" data-theme={theme}>
      <style>{CSS}</style>

      <header className="ml-top">
        <div className="ml-topin">
          <div className="ml-headline">
            <div className="ml-brand">Money <span>Ledger</span></div>
            <button className="ml-theme" onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Light mode" : "Dark mode"}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
          <div className="ml-brandrow">
            <div className="ml-brandsub">
              {`${A.today.slice(8, 10)} ${MON[Number(A.today.slice(5, 7)) - 1]} ${A.today.slice(0, 4)}`}
            </div>
            <div className="ml-nw">
              <div className="ml-eyebrow">Net position</div>
              <div className="ml-nwv ml-num" style={{ color: A.netWorth < 0 ? "var(--debit)" : "var(--ink)" }}>{fmt0(A.netWorth)}</div>
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
        {tab === "savings" && <Savings A={A} data={data} mutate={mutate} say={say} posted={posted} effRate={effRate} />}
        {tab === "cards" && <Cards A={A} data={data} mutate={mutate} say={say} />}
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
const Stat = ({ label, value, note, tone }) => (
  <div className="ml-stat">
    <div className="ml-eyebrow">{label}</div>
    <div className="ml-statv ml-num" style={tone ? { color: `var(--${tone})` } : null}>{value}</div>
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
            {leftValue && <div className="ml-faceval ml-num">{leftValue}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            {rightLabel && <div className="ml-facelab">{rightLabel}</div>}
            {rightValue && <div className="ml-faceval ml-num">{rightValue}</div>}
          </div>
        </div>
      </div>
    </button>
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
      {onDelete ? <button className="ml-x" onClick={onDelete} title="Delete entry">×</button> : <span />}
    </div>
  );
}

/* ---------- OVERVIEW ---------- */
function Overview({ A, data, posted, setTab }) {
  const max = Math.max(1, ...A.months.map((m) => Math.max(m.spend, m.invest)));
  const catMax = Math.max(1, ...A.catRows.map((c) => c[1]));
  const recent = [...A.flows, ...data.savingsTx.filter((t) => ["deposit", "interest", "settlement"].includes(t.type))]
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);

  return (
    <>
      <div className="ml-stats">
        <Stat label="Spent this month" value={fmt0(A.spentMonth)} note="your share only" tone="debit" />
        <Stat label="Invested" value={fmt0(A.investedMonth)} note="never counted as expense" tone="stamp" />
        <Stat label="Interest earned" value={fmt(A.interestMonth)} note={`${fmt(A.interestAll)} lifetime`} tone="credit" />
        <Stat label="Save rate" value={A.saveRate === null ? "—" : `${A.saveRate}%`} note={A.income ? `on ${fmt0(A.income)} income` : "set income in Settings"} />
      </div>

      <div className="ml-wallet">
        {data.accounts.map((a, i) => (
          <Face key={a.id} tone={inkFor(ACC_INKS, i)} title={a.name} sub={a.type}
            rightLabel="Balance" rightValue={fmt0(a.balance)} onClick={() => setTab("savings")} />
        ))}
        {A.cardRows.map((c, i) => (
          <Face key={c.id} chip tone={inkFor(CARD_INKS, i)} title={c.name}
            leftLabel="Limit" leftValue={fmt0(c.limit || 0)}
            rightLabel="Outstanding" rightValue={fmt0(c.outstanding)}
            onClick={() => setTab("cards")} />
        ))}
      </div>

      {A.tips.length > 0 && (
        <div className="ml-card">
          <div className="ml-eyebrow">What to do next</div>
          {A.tips.map(([t, body], i) => (
            <div className="ml-tip" key={i}><b>{t}</b><p>{body}</p></div>
          ))}
        </div>
      )}

      <div className="ml-grid ml-2">
        <div className="ml-card">
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

        <div className="ml-card">
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
      </div>

      <div className="ml-grid ml-3">
        <div className="ml-card">
          <div className="ml-eyebrow">Assets</div>
          <div className="ml-between" style={{ fontSize: 13, marginTop: 4 }}><span>Savings & cash</span><span className="ml-num ml-credit">{fmt0(A.savingsTotal)}</span></div>
          <div className="ml-between" style={{ fontSize: 13, marginTop: 6 }}><span>Friends' EMI due back</span><span className="ml-num ml-credit">{fmt0(A.receivable)}</span></div>
          <div className="ml-between" style={{ fontSize: 13, marginTop: 6 }}><span>Shared bills to settle</span><span className="ml-num ml-credit">{fmt0(A.sharedPending)}</span></div>
        </div>
        <div className="ml-card">
          <div className="ml-eyebrow">Liabilities</div>
          <div className="ml-between" style={{ fontSize: 13, marginTop: 4 }}><span>Card outstanding</span><span className="ml-num ml-debit">{fmt0(A.cardOutstanding)}</span></div>
          <div className="ml-between" style={{ fontSize: 13, marginTop: 6 }}><span>Loan instalments left</span><span className="ml-num ml-debit">{fmt0(A.loanRemaining)}</span></div>
        </div>
        <div className="ml-card">
          <div className="ml-eyebrow">Next auto-payments</div>
          {A.upcoming.length === 0 ? <div className="ml-sub" style={{ marginTop: 4 }}>Nothing scheduled.</div> :
            A.upcoming.map((r) => (
              <div className="ml-between" key={r.id} style={{ fontSize: 13, marginTop: 6 }}>
                <span>{r.name} <span className="ml-sub">· {fmtDate(r.nextDue)}</span></span>
                <span className="ml-num">{fmt0(r.amount)}</span>
              </div>
            ))}
        </div>
      </div>

      <div className="ml-card">
        <div className="ml-eyebrow">Recent entries</div>
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
      </div>
    </>
  );
}

/* ---------- SAVINGS ---------- */
function Savings({ A, data, mutate, say, posted, effRate }) {
  const [f, setF] = useState({ name: "", type: "", interest: true, balance: "" });
  const [mv, setMv] = useState({ accountId: "", dir: "deposit", amount: "", category: "Transfer", kind: "Income", note: "" });
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(null);
  const todayPosted = posted.reduce((s, p) => s + p.amount, 0);

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

  const move = () => {
    const acc = mv.accountId || (data.accounts[0] || {}).id;
    if (!acc) return say("Add an account first.");
    if (num(mv.amount) <= 0) return say("Enter an amount above zero.");
    const isIn = mv.dir === "deposit";
    mutate((d) => {
      const a = d.accounts.find((x) => x.id === acc);
      a.balance = r2(a.balance + (isIn ? num(mv.amount) : -num(mv.amount)));
      d.savingsTx.push({
        id: uid(), date: TODAY(), accountId: acc,
        type: isIn ? (mv.kind === "Settlement" ? "settlement" : "deposit") : "withdrawal",
        amount: num(mv.amount),
        category: isIn ? mv.kind : mv.category,
        note: mv.note.trim() || (isIn ? mv.kind : "Withdrawal"),
      });
    });
    setMv({ ...mv, amount: "", note: "" });
    say(!isIn ? "Withdrawal posted." : mv.kind === "Income" ? "Income posted."
      : `Added to the balance — not counted as income.`);
  };

  const txs = [...data.savingsTx]
    .filter((t) => !focus || t.accountId === focus)
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25);
  const focused = data.accounts.find((a) => a.id === focus);

  return (
    <>
      <div className="ml-stats">
        <Stat label="Total balance" value={fmt0(A.savingsTotal)} note={`${data.accounts.length} accounts`} />
        <Stat label="Interest this month" value={fmt(A.interestMonth)} tone="credit" note={`${fmt(A.interestAll)} lifetime`} />
        <Stat label="RBI repo rate" value={`${effRate.toFixed(2)}%`} note="set in Settings" />
        <Stat label="Earning today" value={fmt(data.accounts.filter((a) => a.earningInterest).reduce((s, a) => s + (a.balance * effRate) / 100 / 365, 0))} note="one day at the repo rate" />
      </div>

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
            sub={`${a.type}${a.earningInterest ? ` · earns ${effRate.toFixed(2)}%` : " · no interest"}`}
            rightLabel="Current balance" rightValue={fmt0(a.balance)}
            active={focus === a.id}
            onClick={() => setFocus(focus === a.id ? null : a.id)} />
        ))}
      </div>

      <div className="ml-card">
        <div className="ml-between">
          <div className="ml-eyebrow">Accounts</div>
          <button className="ml-btn sm" onClick={() => setOpen(!open)}>{open ? "Close" : "Add account"}</button>
        </div>

        {open && (
          <>
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
              <span className="ml-sub">Interest-earning accounts all use the RBI repo rate set in Settings.</span>
            </div>
            <hr className="ml-hr" />
          </>
        )}

        <div style={{ marginTop: open ? 0 : 12 }}>
          {data.accounts.map((a) => (
            <div key={a.id} style={{ padding: "11px 0", borderBottom: "1px solid var(--rule-soft)" }}>
              <div className="ml-between">
                <div>
                  <div style={{ fontWeight: 600 }}>{a.name}</div>
                  <div className="ml-sub" style={{ marginTop: 3 }}>
                    {a.type} · <span className={"ml-pill " + (a.earningInterest ? "on" : "off")}>{a.earningInterest ? `Earns ${effRate.toFixed(2)}% daily` : "No interest"}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="ml-num" style={{ fontSize: 16, fontWeight: 600 }}>{fmt(a.balance)}</div>
                  <div className="ml-sub ml-num">{a.earningInterest ? `+${fmt(a.interestEarned || 0)} interest` : "—"}</div>
                </div>
              </div>
              <div className="ml-flex" style={{ marginTop: 8 }}>
                <button className="ml-btn ghost sm" onClick={() => toggleInterest(a)}>
                  {a.earningInterest ? "Stop earning interest" : "Start earning interest"}
                </button>
                <button className="ml-btn ghost sm" onClick={() => {
                  if (data.accounts.length <= 1) return say("Keep at least one account.");
                  mutate((d) => { d.accounts = d.accounts.filter((z) => z.id !== a.id); });
                  say("Account removed.");
                }}>Remove account</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ml-card">
        <div className="ml-eyebrow">Move money</div>
        <div className="ml-form">
          <Field label="Account">
            <select className="ml-in" value={mv.accountId || (data.accounts[0] || {}).id} onChange={(e) => setMv({ ...mv, accountId: e.target.value })}>
              {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Direction">
            <div className="ml-seg">
              <button data-on={mv.dir === "deposit" ? "1" : "0"} onClick={() => setMv({ ...mv, dir: "deposit" })}>In</button>
              <button data-on={mv.dir === "withdrawal" ? "1" : "0"} onClick={() => setMv({ ...mv, dir: "withdrawal" })}>Out</button>
            </div>
          </Field>
          <Field label="Amount">
            <input className="ml-in ml-num" inputMode="decimal" value={mv.amount} placeholder="0" onChange={(e) => setMv({ ...mv, amount: e.target.value })} />
          </Field>
          {mv.dir === "deposit" ? (
            <Field label="What kind of money is this">
              <select className="ml-in" value={mv.kind} onChange={(e) => setMv({ ...mv, kind: e.target.value })}>
                {DEPOSIT_KINDS.map(([k, hint]) => <option key={k} value={k}>{k} — {hint}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Category">
              <select className="ml-in" value={mv.category} onChange={(e) => setMv({ ...mv, category: e.target.value })}>
                {data.config.categories.map((c) => <option key={c} value={c}>{c}{NON_EXPENSE.includes(c) ? " (not an expense)" : ""}</option>)}
              </select>
            </Field>
          )}
          <Field label="Note" span>
            <input className="ml-in" value={mv.note} placeholder="What was this for?" onChange={(e) => setMv({ ...mv, note: e.target.value })} />
          </Field>
        </div>
        <div className="ml-flex" style={{ marginTop: 12 }}>
          <button className="ml-btn" onClick={move}>Post entry</button>
          {mv.dir === "deposit" && mv.kind !== "Income" &&
            <span className="ml-sub">Raises the balance, stays out of income and out of expenses.</span>}
        </div>
      </div>

      <div className="ml-card">
        <div className="ml-filter">
          <div className="ml-eyebrow">{focused ? `Statement — ${focused.name}` : "Account statement"}</div>
          {focused && <button className="ml-btn ghost sm" onClick={() => setFocus(null)}>Show all accounts</button>}
        </div>
        <div style={{ height: 10 }} />
        <LedgerHead />
        {txs.length === 0 ? <div className="ml-empty" style={{ marginTop: 12 }}>No entries yet.</div> :
          txs.map((t) => {
            const isIn = ["deposit", "interest", "settlement"].includes(t.type);
            const isInv = t.category === "Investment";
            return (
              <LedgerRow key={t.id}
                title={t.note}
                meta={`${fmtDate(t.date)} · ${A.accOf(t.accountId)} · ${t.type === "interest" ? "Interest" : t.category}`}
                debit={!isIn && !isInv ? t.amount : 0}
                credit={isIn ? t.amount : 0}
                invest={isInv ? t.amount : 0}
                onDelete={t.type === "interest" ? null : () => mutate((d) => {
                  const acc = d.accounts.find((a) => a.id === t.accountId);
                  if (acc) acc.balance = r2(acc.balance + (isIn ? -num(t.amount) : num(t.amount)));
                  d.savingsTx = d.savingsTx.filter((x) => x.id !== t.id);
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
            sub={c.limit ? `${Math.round((c.outstanding / Math.max(1, c.limit)) * 100)}% of limit used` : "No limit set"}
            pct={c.limit ? (c.outstanding / c.limit) * 100 : 0}
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
              <span className="ml-num" style={{ color: "var(--debit)", fontWeight: 600 }}>{fmt0(c.outstanding)}</span>
            </div>
            <div className="ml-flex" style={{ marginTop: 6, fontSize: 11.5, color: "var(--soft)", justifyContent: "space-between" }}>
              <span>Yours {fmt0(c.own)}</span>
              <span>Friends' EMI {fmt0(c.friends)}</span>
              <span>Paid {fmt0(c.paid)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ml-card">
        <div className="ml-eyebrow">Log a spend</div>
        <div className="ml-form">
          <Field label="Card">
            <select className="ml-in" value={s.cardId || (data.cards[0] || {}).id} onChange={(e) => setS({ ...s, cardId: e.target.value })}>
              {data.cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select className="ml-in" value={s.category} onChange={(e) => setS({ ...s, category: e.target.value })}>
              {data.config.categories.map((c) => <option key={c} value={c}>{c}{NON_EXPENSE.includes(c) ? " (not an expense)" : ""}</option>)}
            </select>
          </Field>
          <Field label="Amount">
            <input className="ml-in ml-num" inputMode="decimal" value={s.amount} placeholder="0" onChange={(e) => setS({ ...s, amount: e.target.value })} />
          </Field>
          <Field label="Date">
            <input className="ml-in ml-num" type="date" value={s.date} onChange={(e) => setS({ ...s, date: e.target.value })} />
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
      </div>

      <div className="ml-card">
        <div className="ml-eyebrow">Pay a card bill</div>
        <div className="ml-form">
          <Field label="Card">
            <select className="ml-in" value={pay.cardId || (data.cards[0] || {}).id} onChange={(e) => setPay({ ...pay, cardId: e.target.value })}>
              {data.cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="From account">
            <select className="ml-in" value={pay.accountId || (data.accounts[0] || {}).id} onChange={(e) => setPay({ ...pay, accountId: e.target.value })}>
              {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Amount" span>
            <input className="ml-in ml-num" inputMode="decimal" value={pay.amount} placeholder="0" onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
          </Field>
        </div>
        <div className="ml-flex" style={{ marginTop: 12 }}>
          <button className="ml-btn" onClick={payCard}>Pay bill</button>
          <span className="ml-sub">Reduces the account balance and the card outstanding. Not counted twice as an expense.</span>
        </div>
      </div>

      <div className="ml-card">
        <div className="ml-between">
          <div className="ml-eyebrow">Add a card</div>
          <button className="ml-btn sm ghost" onClick={() => setShowCard(!showCard)}>{showCard ? "Close" : "New card"}</button>
        </div>
        {showCard && (
          <>
            <div className="ml-form" style={{ marginTop: 12 }}>
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
          </>
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

  return (
    <div className="ml-card">
      <div className="ml-eyebrow">Shared bills to collect</div>
      <div className="ml-sub" style={{ marginTop: 4 }}>
        Rent splits, household runs, anything you paid in full for someone else. Only your slice is counted as spending,
        and what they pay back lands in your balance without ever being income.
      </div>

      {openRows.length === 0 ? (
        <div className="ml-empty" style={{ marginTop: 14 }}>
          Nothing to collect. Mark a spend as shared on the Cards tab, or give an auto-payment someone's share.
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
              </div>
            </div>
            <div className="ml-form" style={{ marginTop: 10 }}>
              <Field label="They paid">
                <input className="ml-in ml-num" inputMode="decimal" placeholder={String(x.pending)}
                  value={v.amount !== undefined ? v.amount : ""}
                  onChange={(e) => setF({ ...f, [x.id]: { ...v, amount: e.target.value } })} />
              </Field>
              <Field label="Into which account">
                <select className="ml-in" value={v.accountId || (data.accounts[0] || {}).id}
                  onChange={(e) => setF({ ...f, [x.id]: { ...v, accountId: e.target.value } })}>
                  {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
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
                })}>×</button>
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ---------- FRIENDS' EMI ---------- */
function Emis({ A, data, mutate, say }) {
  const [e, setE] = useState({ friend: "", item: "", cardId: "", principal: "", months: "6", startDate: TODAY(), note: "" });
  const [rp, setRp] = useState({});
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
      <div className="ml-stats">
        <Stat label="Owed to you" value={fmt0(A.receivableTotal)} note="shared bills + EMIs" tone="credit" />
        <Stat label="Shared bills pending" value={fmt0(A.sharedPending)} note={`${fmt0(A.sharedBilled)} split so far`} />
        <Stat label="Friends' EMI left" value={fmt0(A.receivable)} note={`${A.emiRows.length} purchases`} />
        <Stat label="Past due" value={fmt0(A.overdueTotal)} tone={A.overdueTotal > 0 ? "debit" : null} note="billed but not repaid" />
      </div>

      <SharedPanel A={A} data={data} mutate={mutate} say={say} />

      <div className="ml-card">
        <div className="ml-between">
          <div>
            <div className="ml-eyebrow">Friends' purchases</div>
            <div className="ml-sub" style={{ marginTop: 4 }}>Your card is billed on schedule whether or not they pay. These never count as your spending.</div>
          </div>
          <button className="ml-btn sm" onClick={() => setOpen(!open)}>{open ? "Close" : "Track EMI"}</button>
        </div>

        {open && (
          <>
            <div className="ml-form" style={{ marginTop: 14 }}>
              <Field label="Friend"><input className="ml-in" value={e.friend} placeholder="Name" onChange={(x) => setE({ ...e, friend: x.target.value })} /></Field>
              <Field label="What they bought"><input className="ml-in" value={e.item} placeholder="e.g. Phone" onChange={(x) => setE({ ...e, item: x.target.value })} /></Field>
              <Field label="On which card">
                <select className="ml-in" value={e.cardId || (data.cards[0] || {}).id} onChange={(x) => setE({ ...e, cardId: x.target.value })}>
                  {data.cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Total amount"><input className="ml-in ml-num" inputMode="decimal" value={e.principal} placeholder="0" onChange={(x) => setE({ ...e, principal: x.target.value })} /></Field>
              <Field label="Months"><input className="ml-in ml-num" inputMode="numeric" value={e.months} onChange={(x) => setE({ ...e, months: x.target.value })} /></Field>
              <Field label="First instalment"><input className="ml-in ml-num" type="date" value={e.startDate} onChange={(x) => setE({ ...e, startDate: x.target.value })} /></Field>
              <Field label="Note" span><input className="ml-in" value={e.note} placeholder="Terms you agreed on" onChange={(x) => setE({ ...e, note: x.target.value })} /></Field>
            </div>
            <div style={{ marginTop: 12 }}><button className="ml-btn" onClick={add}>Start tracking</button></div>
          </>
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
              })}>×</button>
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
            <div className="ml-eyebrow">Repayments received</div>
            <div className="ml-form" style={{ marginTop: 10 }}>
              <Field label="Amount">
                <input className="ml-in ml-num" inputMode="decimal" value={v.amount} placeholder={String(x.monthly)}
                  onChange={(ev) => setRp({ ...rp, [x.id]: { ...v, amount: ev.target.value } })} />
              </Field>
              <Field label="Received on">
                <input className="ml-in ml-num" type="date" value={v.date || TODAY()}
                  onChange={(ev) => setRp({ ...rp, [x.id]: { ...v, date: ev.target.value } })} />
              </Field>
            </div>
            <div className="ml-flex" style={{ marginTop: 10 }}>
              <button className="ml-btn sm" onClick={() => logRepayment(x)}>Log repayment</button>
              <button className="ml-btn sm ghost" onClick={() => setRp({ ...rp, [x.id]: { ...v, amount: String(x.monthly) } })}>Fill one instalment</button>
            </div>

            {mine.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {mine.map((r) => (
                  <div className="ml-between" key={r.id} style={{ padding: "7px 0", borderTop: "1px solid var(--rule-soft)", fontSize: 13 }}>
                    <span>{fmtDate(r.date)} <span className="ml-sub">· {r.note}</span></span>
                    <span className="ml-flex">
                      <span className="ml-num ml-credit">{fmt(r.amount)}</span>
                      <button className="ml-x" onClick={() => mutate((d) => { d.repayments = d.repayments.filter((z) => z.id !== r.id); })}>×</button>
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
          <button className="ml-btn sm" onClick={() => setOpen(!open)}>{open ? "Close" : "Add payment"}</button>
        </div>

        {open && (
          <>
            <div className="ml-form" style={{ marginTop: 14 }}>
              <Field label="Name"><input className="ml-in" value={r.name} placeholder="e.g. Home loan, Rent, SIP" onChange={(e) => setR({ ...r, name: e.target.value })} /></Field>
              <Field label="Amount"><input className="ml-in ml-num" inputMode="decimal" value={r.amount} placeholder="0" onChange={(e) => setR({ ...r, amount: e.target.value })} /></Field>
              <Field label="Repeats">
                <select className="ml-in" value={r.frequency} onChange={(e) => setR({ ...r, frequency: e.target.value })}>
                  <option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option><option value="yearly">Yearly</option>
                </select>
              </Field>
              <Field label="Next due"><input className="ml-in ml-num" type="date" value={r.nextDue} onChange={(e) => setR({ ...r, nextDue: e.target.value })} /></Field>
              <Field label="Deduct from">
                <div className="ml-seg">
                  <button data-on={r.sourceType === "savings" ? "1" : "0"} onClick={() => setR({ ...r, sourceType: "savings", sourceId: "" })}>Account</button>
                  <button data-on={r.sourceType === "card" ? "1" : "0"} onClick={() => setR({ ...r, sourceType: "card", sourceId: "" })}>Card</button>
                </div>
              </Field>
              <Field label={r.sourceType === "savings" ? "Which account" : "Which card"}>
                <select className="ml-in" value={r.sourceId || (sources[0] || {}).id} onChange={(e) => setR({ ...r, sourceId: e.target.value })}>
                  {sources.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select className="ml-in" value={r.category} onChange={(e) => setR({ ...r, category: e.target.value })}>
                  {data.config.categories.map((c) => <option key={c} value={c}>{c}{NON_EXPENSE.includes(c) ? " (not an expense)" : ""}</option>)}
                </select>
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
          </>
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
                      {NON_EXPENSE.includes(x.category) && <span style={{ color: "var(--stamp)" }}> · not an expense</span>}
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
  const totalCap = A.budgetRows.filter((x) => !x.target).reduce((s, x) => s + x.amount, 0);
  const totalUsed = A.budgetRows.filter((x) => !x.target).reduce((s, x) => s + x.used, 0);

  return (
    <>
      <div className="ml-stats">
        <Stat label="Budgeted" value={fmt0(totalCap)} note="expense categories" />
        <Stat label="Used" value={fmt0(totalUsed)} tone={totalUsed > totalCap && totalCap > 0 ? "debit" : null} />
        <Stat label="Left to spend" value={fmt0(Math.max(0, totalCap - totalUsed))} tone="credit" />
        <Stat label="Unbudgeted spend" value={fmt0(Math.max(0, A.spentMonth - totalUsed))} note="outside your caps" />
      </div>

      <div className="ml-card">
        <div className="ml-eyebrow">Set money aside</div>
        <div className="ml-form">
          <Field label="Category">
            <select className="ml-in" value={b.cat} onChange={(e) => setB({ ...b, cat: e.target.value })}>
              {data.config.categories.filter((c) => !NON_INCOME.includes(c)).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
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
            say(`${b.cat} set to ${fmt0(num(b.amount))} a month.`);
          }}>Save budget</button>
          <span className="ml-sub">Investment is a target to hit, not a cap to stay under.</span>
        </div>
      </div>

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
      <div className="ml-stats">
        <Stat label="Entries" value={String(entries)} note={`${data.accounts.length} accounts · ${data.cards.length} cards`} />
        <Stat label="Backup size" value={size} />
        <Stat label="Last taken" value={last ? fmtDate(last.slice(0, 10)) : "Never"} tone={last ? null : "debit"} />
        <Stat label="Stored" value="This device" note="nothing is uploaded" />
      </div>

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
          <span className="ml-sub">Used for the save rate and the advice on the Overview tab.</span>
        </div>
      </div>

      <div className="ml-card">
        <div className="ml-eyebrow">Categories</div>
        <div className="ml-sub" style={{ marginTop: 4, marginBottom: 10 }}>
          Investment, Transfer and Card Payment are permanently excluded from expense totals.
        </div>
        <div className="ml-flex">
          {data.config.categories.map((c) => (
            <span key={c} className={"ml-pill " + (NON_EXPENSE.includes(c) ? "on" : "")} style={{ padding: "4px 8px" }}>
              {c}
              {!BASE_CATEGORIES.includes(c) && (
                <button className="ml-x" style={{ fontSize: 13, padding: "0 0 0 5px" }}
                  onClick={() => mutate((d) => { d.config.categories = d.config.categories.filter((x) => x !== c); })}>×</button>
              )}
            </span>
          ))}
        </div>
        <div className="ml-form" style={{ marginTop: 12 }}>
          <Field label="New category">
            <input className="ml-in" value={newCat} placeholder="e.g. Gifts" onChange={(e) => setNewCat(e.target.value)} />
          </Field>
          <div className="ml-f" style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="ml-btn" onClick={() => {
              const v = newCat.trim();
              if (!v) return say("Type a name first.");
              if (data.config.categories.includes(v)) return say("That one already exists.");
              mutate((d) => d.config.categories.splice(d.config.categories.length - 1, 0, v));
              setNewCat(""); say("Category added.");
            }}>Add</button>
          </div>
        </div>
      </div>

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

      <div className="ml-card">
        <div className="ml-eyebrow">How the numbers are built</div>
        <ul style={{ fontSize: 13, color: "var(--body)", paddingLeft: 18, marginTop: 8, lineHeight: 1.7 }}>
          <li>Interest is driven solely by the RBI repo rate in this tab. It compounds daily on every account marked as earning interest, and one entry covers every day since your last visit — so the total is the same whether you open the app daily or once a year.</li>
          <li>Investment, Transfer and Card Payment entries never reach the expense column or the category chart.</li>
          <li>Friends' EMI instalments raise the card outstanding but stay out of your spending — they're a receivable.</li>
          <li>Scheduled payments catch up on load, so a month away still lands the right number of instalments.</li>
          <li>A friend's share of a bill is subtracted from your expense and waits on the Friends tab. When they pay you, the balance goes up but income does not.</li>
        </ul>
      </div>
    </>
  );
}
