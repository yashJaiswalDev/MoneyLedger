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

/* ============================================================
   1. DESIGN TOKENS
   Light-first neobank palette. Depth comes from layered soft
   shadows, never borders. One ink accent, pastel data hues.
   ============================================================ */
.ml-root{
  --ground:#F6F7F9; --card:#FFFFFF; --raise:#FFFFFF; --field:#F2F4F7; --sunk:#F8F9FB;
  --ink:#0D0F14; --soft:#8A9099; --body:#4E555F; --faint:#B9BEC6;
  --line:#EEF0F3; --line-soft:#F4F5F7;
  --accent:#0D0F14; --accent-ink:#FFFFFF;
  --brand:#1B6EF3; --brand-soft:#E8F0FE;
  --credit:#1B9C5A; --credit-soft:#E4F5EC;
  --debit:#E0563F; --debit-soft:#FCEBE7;
  --stamp:#6544E0; --stamp-soft:#EEEAFD;
  --amber:#D08700; --amber-soft:#FDF3DF;
  --ink-hover:#000000; --soft-hover:#F2F4F7;

  --r-xl:26px; --r:20px; --r-sm:14px; --r-xs:10px;
  --sh-1:0 1px 2px rgba(13,15,20,.04);
  --sh-2:0 2px 6px rgba(13,15,20,.04), 0 10px 30px rgba(13,15,20,.04);
  --sh-3:0 4px 12px rgba(13,15,20,.06), 0 18px 44px rgba(13,15,20,.07);
  --sh-float:0 6px 16px rgba(13,15,20,.08), 0 20px 50px rgba(13,15,20,.10);

  --ctl:48px; --ctlpad:13px 16px; --ctlfont:16px;
  --ease:cubic-bezier(.22,.61,.36,1);
  --font:'Public Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  --font-label:'Archivo',sans-serif; --font-mono:'IBM Plex Mono',ui-monospace,monospace;

  background:var(--ground); color:var(--ink); font-family:var(--font);
  font-size:15px; line-height:1.5; min-height:100vh; min-height:100dvh;
  -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%; text-size-adjust:100%;
  -webkit-tap-highlight-color:transparent; overscroll-behavior-y:contain; color-scheme:light;
}
.ml-root[data-theme="dark"]{
  --ground:#08090B; --card:#111318; --raise:#161920; --field:#181B21; --sunk:#0D0F13;
  --ink:#F7F8FA; --soft:#7E858F; --body:#C2C7CF; --faint:#5A6069;
  --line:#1C1F26; --line-soft:#15181D;
  --accent:#FFFFFF; --accent-ink:#0D0F14;
  --brand:#5B9CFF; --brand-soft:#132339;
  --credit:#4ECB84; --credit-soft:#12291D;
  --debit:#FF8067; --debit-soft:#2E1A16;
  --stamp:#A48BFF; --stamp-soft:#1E1934;
  --amber:#E8B44C; --amber-soft:#2C2312;
  --ink-hover:#E8EAED; --soft-hover:#1A1D23;
  --sh-1:0 1px 2px rgba(0,0,0,.4);
  --sh-2:0 2px 8px rgba(0,0,0,.45);
  --sh-3:0 8px 28px rgba(0,0,0,.5);
  --sh-float:0 10px 40px rgba(0,0,0,.6);
  color-scheme:dark;
}
@media(min-width:900px){ .ml-root{--ctl:42px; --ctlpad:10px 14px; --ctlfont:14.5px;} }

.ml-root *{box-sizing:border-box;}
.ml-root button{font-family:inherit;cursor:pointer;-webkit-appearance:none;appearance:none;
  touch-action:manipulation;transition:transform .16s var(--ease), background .16s var(--ease), box-shadow .16s var(--ease);}
.ml-root button:active{transform:scale(.97);}
.ml-root input,.ml-root textarea{font-family:inherit;font-size:var(--ctlfont);
  -webkit-appearance:none;appearance:none;border-radius:var(--r-sm);max-width:100%;}
.ml-root :focus-visible{outline:2px solid var(--brand);outline-offset:2px;}
.ml-num{font-family:var(--font-mono);font-variant-numeric:tabular-nums;letter-spacing:-.01em;}
.ml-eyebrow{font-family:var(--font-label);font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);}
.ml-h{font-family:var(--font-label);font-weight:700;letter-spacing:-.01em;}
.ml-sub{font-size:13px;color:var(--soft);line-height:1.45;}
.ml-hr{border:0;border-top:1px solid var(--line);margin:18px 0;}
.ml-flex{display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
.ml-between{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}
.ml-credit{color:var(--credit);} .ml-debit{color:var(--debit);} .ml-invest{color:var(--stamp);}
@keyframes mlfade{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
.ml-page,.ml-card{animation:mlfade .32s var(--ease) both;}

/* ============================================================
   2. LAYOUT SHELL — floating pill sidebar / floating bottom bar
   ============================================================ */
.ml-shell{display:flex;min-height:100dvh;}
.ml-side{display:none;}
.ml-main{flex:1;min-width:0;}
.ml-wrap{max-width:1120px;margin:0 auto;
  padding:0 calc(18px + env(safe-area-inset-right,0px)) calc(122px + env(safe-area-inset-bottom,0px)) calc(18px + env(safe-area-inset-left,0px));}
.ml-top{background:var(--ground);position:sticky;top:0;z-index:20;}
.ml-topin{max-width:1120px;margin:0 auto;padding:calc(18px + env(safe-area-inset-top,0px)) 18px 0;}
.ml-headline{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.ml-brand{font-weight:800;font-size:18px;letter-spacing:-.03em;}
.ml-brand span{color:var(--soft);font-weight:600;}
.ml-brandsub{font-size:12.5px;color:var(--soft);margin-top:2px;}

/* hero: balance, then quick actions — nothing else competes */
.ml-brandrow{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:22px 0 4px;}
.ml-nw{display:flex;flex-direction:column;align-items:flex-start;gap:6px;width:100%;}
.ml-nwv{font-size:42px;font-weight:800;letter-spacing:-.045em;line-height:1;}
@media(min-width:680px){.ml-nwv{font-size:50px;}}
.ml-theme{width:42px;height:42px;flex:0 0 auto;border:0;border-radius:50%;
  background:var(--card);color:var(--ink);display:inline-flex;align-items:center;justify-content:center;box-shadow:var(--sh-2);}
.ml-theme:hover{background:var(--soft-hover);}
.ml-tabsel{display:none;}

/* quick actions strip */
.ml-qa{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;margin-top:18px;padding-bottom:2px;}
.ml-qa::-webkit-scrollbar{display:none;}
.ml-qabtn{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:8px;width:76px;
  border:0;background:none;color:var(--ink);font-family:inherit;font-size:11.5px;font-weight:600;}
.ml-qaic{width:52px;height:52px;border-radius:var(--r-sm);background:var(--card);box-shadow:var(--sh-2);
  display:flex;align-items:center;justify-content:center;color:var(--ink);}
.ml-qabtn:hover .ml-qaic{background:var(--soft-hover);}

/* floating bottom bar (phones) */
.ml-bnav{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));
  z-index:50;display:flex;align-items:center;gap:2px;padding:8px;width:calc(100% - 32px);max-width:440px;
  background:var(--card);border-radius:999px;box-shadow:var(--sh-float);}
.ml-bitem{position:relative;flex:1;min-width:0;border:0;background:none;color:var(--soft);border-radius:999px;
  padding:8px 2px;display:flex;flex-direction:column;align-items:center;gap:4px;
  font-family:inherit;font-size:10px;font-weight:600;letter-spacing:-.01em;}
.ml-bitem[data-on="1"]{color:var(--ink);background:var(--field);}
.ml-bcount{position:absolute;top:2px;right:calc(50% - 20px);min-width:16px;height:16px;padding:0 4px;
  border-radius:999px;background:var(--debit);color:#fff;font-size:9.5px;font-weight:700;line-height:16px;text-align:center;}
.ml-bfab{flex:0 0 auto;width:50px;height:50px;border:0;border-radius:50%;
  background:var(--accent);color:var(--accent-ink);box-shadow:var(--sh-2);
  display:flex;align-items:center;justify-content:center;}

@media(min-width:1000px){
  .ml-bnav{display:none;}
  .ml-wrap{padding-bottom:64px;}
  .ml-side{display:flex;flex-direction:column;gap:4px;width:76px;flex:0 0 76px;padding:20px 12px;
    position:sticky;top:0;height:100dvh;transition:width .22s var(--ease);}
  .ml-side:hover{width:238px;}
  .ml-sidepill{display:flex;flex-direction:column;gap:4px;padding:12px 10px;background:var(--card);
    border-radius:var(--r-xl);box-shadow:var(--sh-3);height:100%;overflow:hidden;}
  .ml-sidebrand{font-weight:800;font-size:15px;letter-spacing:-.03em;padding:6px 10px 14px;white-space:nowrap;overflow:hidden;}
  .ml-sidebrand span{color:var(--soft);opacity:0;transition:opacity .18s var(--ease);}
  .ml-side:hover .ml-sidebrand span{opacity:1;}
  .ml-sidelink{display:flex;align-items:center;gap:12px;width:100%;padding:11px 10px;border:0;border-radius:var(--r-sm);
    background:none;color:var(--soft);font-family:inherit;font-size:13.5px;font-weight:600;text-align:left;white-space:nowrap;}
  .ml-sidelink:hover{background:var(--soft-hover);color:var(--ink);}
  .ml-sidelink[data-on="1"]{background:var(--field);color:var(--ink);}
  .ml-sidelink span{opacity:0;transition:opacity .18s var(--ease);overflow:hidden;}
  .ml-side:hover .ml-sidelink span{opacity:1;}
  .ml-sidehint{display:none;}
  .ml-sidefoot{margin-top:auto;padding-top:14px;display:flex;gap:8px;}
  .ml-top,.ml-topin{padding-left:0;padding-right:0;}
  .ml-wrap,.ml-topin{max-width:none;padding-left:4px;padding-right:26px;}
  .ml-top{padding-top:24px;}
}

/* ---- surfaces ---- */
.ml-card{background:var(--card);border:0;border-radius:var(--r);padding:20px;margin-top:14px;width:100%;box-shadow:var(--sh-2);}
.ml-card>.ml-eyebrow:first-child{display:block;margin-bottom:14px;}
.ml-grid{display:grid;gap:14px;margin-top:14px;grid-template-columns:1fr;}
.ml-grid>*{min-width:0;} .ml-grid>.ml-card{margin-top:0;}
.ml-page{display:grid;gap:14px;margin-top:14px;grid-template-columns:1fr;}
.ml-page>*{min-width:0;margin-top:0;}
@media(min-width:680px){
  .ml-2{grid-template-columns:repeat(2,1fr);}
  .ml-3{grid-template-columns:repeat(3,1fr);}
  .ml-page{grid-template-columns:repeat(6,1fr);}
  .ml-page>.ml-w6{grid-column:span 6;}
  .ml-page>.ml-w3{grid-column:span 3;}
  .ml-page>.ml-w2{grid-column:span 2;}
}
.ml-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:14px;}
@media(min-width:680px){.ml-stats{grid-template-columns:repeat(var(--cols,4),1fr);}}
.ml-stat{background:var(--card);border-radius:var(--r);padding:18px;box-shadow:var(--sh-2);}
.ml-statv{font-size:25px;font-weight:800;letter-spacing:-.035em;margin-top:8px;line-height:1.05;}
.ml-statn{font-size:11.5px;color:var(--soft);margin-top:6px;}

/* ---- 3. SMART LOGO ---- */
.ml-logo{flex:0 0 auto;width:42px;height:42px;border-radius:var(--r-xs);display:flex;align-items:center;
  justify-content:center;font-weight:700;font-size:14px;letter-spacing:-.02em;overflow:hidden;}
.ml-logo.sm{width:34px;height:34px;border-radius:9px;}
.ml-logo svg{width:19px;height:19px;}
.ml-logo.sm svg{width:16px;height:16px;}

/* ---- rows ---- */
.ml-lhead{display:none;}
.ml-lrow{display:flex;align-items:center;gap:13px;padding:11px 0;border-bottom:1px solid var(--line-soft);}
.ml-lrow:last-child{border-bottom:0;}
.ml-lmain{flex:1;min-width:0;}
.ml-ltitle{font-weight:600;font-size:14.5px;letter-spacing:-.01em;overflow-wrap:anywhere;}
.ml-lmeta{font-size:12px;color:var(--soft);margin-top:2px;overflow-wrap:anywhere;}
.ml-lcell{text-align:right;font-variant-numeric:tabular-nums;font-size:14.5px;font-weight:700;letter-spacing:-.02em;flex:0 0 auto;}
.ml-lcell:empty{display:none;}
.ml-rowacts{display:flex;gap:2px;justify-content:flex-end;flex:0 0 auto;opacity:.55;}
.ml-lrow:hover .ml-rowacts{opacity:1;}
.ml-x{background:none;border:0;color:var(--soft);font-size:16px;line-height:1;padding:2px 4px;border-radius:8px;
  min-width:30px;min-height:30px;display:inline-flex;align-items:center;justify-content:center;}
.ml-x:hover{color:var(--debit);background:var(--soft-hover);}

/* ---- forms ---- */
.ml-form{display:grid;gap:14px;grid-template-columns:1fr;}
@media(min-width:620px){.ml-form{grid-template-columns:repeat(2,1fr);}.ml-span{grid-column:1/-1;}}
.ml-f label{display:block;font-size:12px;font-weight:600;color:var(--soft);margin-bottom:7px;}
.ml-in{width:100%;padding:var(--ctlpad);border:1.5px solid transparent;border-radius:var(--r-sm);
  background:var(--field);color:var(--ink);min-height:var(--ctl);line-height:1.25;font-size:var(--ctlfont);
  transition:border-color .16s var(--ease), background .16s var(--ease);}
.ml-in:focus{border-color:var(--brand);background:var(--card);}
.ml-btn{padding:12px 22px;border:0;background:var(--accent);color:var(--accent-ink);border-radius:999px;
  font-family:inherit;font-size:14px;font-weight:700;letter-spacing:-.01em;box-shadow:var(--sh-1);
  min-height:var(--ctl);display:inline-flex;align-items:center;justify-content:center;text-align:center;}
.ml-btn:hover{background:var(--ink-hover);}
.ml-btn.ghost{background:var(--field);color:var(--ink);box-shadow:none;}
.ml-btn.ghost:hover{background:var(--soft-hover);}
.ml-btn.danger{background:var(--debit-soft);color:var(--debit);box-shadow:none;}
.ml-btn.danger:hover{background:var(--debit);color:#fff;}
.ml-btn.sm{padding:8px 16px;font-size:12.5px;min-height:36px;}
.ml-seg{display:inline-flex;border-radius:999px;overflow:hidden;background:var(--field);padding:4px;gap:3px;}
.ml-seg button{padding:8px 16px;border:0;background:none;color:var(--soft);border-radius:999px;
  font-family:inherit;font-size:13px;font-weight:600;min-height:36px;}
.ml-seg button[data-on="1"]{background:var(--card);color:var(--ink);box-shadow:var(--sh-1);}
.ml-ta{width:100%;min-height:112px;padding:14px;border:1.5px solid transparent;border-radius:var(--r-sm);
  font-family:ui-monospace,'SF Mono',monospace;font-size:13.5px;line-height:1.5;
  background:var(--field);color:var(--ink);word-break:break-all;}

/* ---- pills, bars ---- */
.ml-pill{display:inline-flex;align-items:center;font-size:11.5px;font-weight:600;border:0;border-radius:999px;
  padding:4px 11px;color:var(--soft);background:var(--field);}
.ml-pill.on{background:var(--credit-soft);color:var(--credit);}
.ml-pill.off{background:var(--amber-soft);color:var(--amber);}
.ml-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
.ml-bar{height:8px;background:var(--field);border-radius:999px;overflow:hidden;}
.ml-bar i{display:block;height:100%;border-radius:999px;background:var(--ink);transition:width .5s var(--ease);}
.ml-empty{border:0;background:var(--sunk);border-radius:var(--r-sm);padding:28px 20px;text-align:center;
  color:var(--soft);font-size:13.5px;}
.ml-tip{padding:0 0 0 2px;margin-bottom:18px;}
.ml-tip b{font-size:14px;font-weight:700;letter-spacing:-.01em;display:block;margin-bottom:4px;}
.ml-tip p{margin:0;font-size:13px;color:var(--body);}
.ml-toast{position:fixed;left:50%;bottom:calc(100px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);
  background:var(--ink);color:var(--ground);padding:13px 22px;border-radius:999px;font-size:13.5px;font-weight:600;
  z-index:60;box-shadow:var(--sh-float);max-width:92vw;text-align:center;animation:mlfade .3s var(--ease);}
@media(min-width:1000px){.ml-toast{bottom:28px;}}
.ml-filter{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;}

/* ---- 4. ACCORDION (progressive disclosure) ---- */
.ml-acc{border-radius:var(--r);background:var(--card);box-shadow:var(--sh-2);margin-top:12px;overflow:hidden;}
.ml-acchead{display:flex;align-items:center;gap:13px;width:100%;padding:17px 18px;border:0;background:none;
  color:var(--ink);text-align:left;font-family:inherit;}
.ml-acchead:hover{background:var(--soft-hover);}
.ml-accttl{flex:1;min-width:0;}
.ml-accttl b{display:block;font-size:14.5px;font-weight:700;letter-spacing:-.01em;}
.ml-accttl span{display:block;font-size:12.5px;color:var(--soft);margin-top:2px;}
.ml-accbody{padding:0 18px 18px;animation:mlfade .28s var(--ease);}

/* ---- stamp ---- */
.ml-stamp{border:0;border-radius:var(--r);padding:18px 26px;text-align:center;display:inline-block;
  background:var(--credit-soft);color:var(--credit);box-shadow:var(--sh-2);animation:mlfade .4s var(--ease);}
.ml-stampt{font-size:11.5px;font-weight:600;opacity:.8;}
.ml-stampv{font-size:28px;font-weight:800;margin:6px 0;letter-spacing:-.04em;}
.ml-stampd{font-size:12px;font-weight:500;opacity:.75;}

/* ---- wallet faces ---- */
.ml-wallet{display:flex;gap:14px;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;
  scroll-snap-type:x mandatory;padding:2px 0 10px;scrollbar-width:none;}
.ml-wallet::-webkit-scrollbar{display:none;}
.ml-face{position:relative;overflow:hidden;flex:0 0 78%;max-width:290px;scroll-snap-align:start;border:0;
  border-radius:var(--r);padding:20px;color:#fff;text-align:left;display:flex;flex-direction:column;
  justify-content:space-between;min-height:158px;aspect-ratio:1.62/1;font-family:inherit;box-shadow:var(--sh-3);}
.ml-face::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(120% 90% at 12% 8%, rgba(255,255,255,.22), transparent 58%);}
.ml-face.on{box-shadow:0 0 0 2.5px var(--brand), var(--sh-3);}
@media(min-width:900px){
  .ml-wallet{display:grid;grid-template-columns:repeat(auto-fill,minmax(256px,1fr));overflow:visible;}
  .ml-face{flex:none;max-width:none;}
}
.ml-facetop{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;position:relative;z-index:1;}
.ml-facename{font-size:13px;font-weight:700;letter-spacing:-.01em;line-height:1.3;overflow-wrap:anywhere;}
.ml-facesub{font-size:11.5px;opacity:.78;margin-top:3px;}
.ml-chip{width:32px;height:24px;border-radius:6px;flex:0 0 auto;position:relative;
  background:linear-gradient(140deg,rgba(255,255,255,.55),rgba(255,255,255,.22));}
.ml-chip::after{content:"";position:absolute;left:5px;right:5px;top:50%;height:1px;background:rgba(255,255,255,.4);}
.ml-facebar{height:5px;border-radius:999px;background:rgba(255,255,255,.24);overflow:hidden;margin-top:12px;position:relative;z-index:1;}
.ml-facebar i{display:block;height:100%;border-radius:999px;background:#fff;}
.ml-facefoot{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-top:12px;position:relative;z-index:1;}
.ml-facelab{font-size:10px;font-weight:600;letter-spacing:.02em;opacity:.75;}
.ml-faceval{font-size:17px;font-weight:800;margin-top:4px;letter-spacing:-.03em;}

/* ---- drawer + modal ---- */
.ml-scrim{position:fixed;inset:0;z-index:80;background:rgba(8,9,11,.42);display:flex;
  align-items:flex-end;justify-content:center;padding:0;backdrop-filter:blur(6px);animation:mlfade .2s var(--ease);}
@media(min-width:680px){.ml-scrim{align-items:center;padding:18px;}}
.ml-modal{width:100%;max-width:480px;max-height:88vh;display:flex;flex-direction:column;
  background:var(--card);border-radius:var(--r-xl) var(--r-xl) 0 0;box-shadow:var(--sh-float);
  animation:mlrise .34s var(--ease);}
@keyframes mlrise{from{transform:translateY(18px);opacity:.6;}to{transform:none;opacity:1;}}
@media(min-width:680px){.ml-modal{border-radius:var(--r-xl);}}
.ml-modalhead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:20px 22px 14px;}
.ml-modalbody{padding:0 22px calc(24px + env(safe-area-inset-bottom,0px));overflow-y:auto;-webkit-overflow-scrolling:touch;}

/* ---- select ---- */
.ml-pick{position:relative;width:100%;}
.ml-pickbtn{width:100%;min-height:var(--ctl);padding:var(--ctlpad);padding-right:38px;border:1.5px solid transparent;
  border-radius:var(--r-sm);background:var(--field);color:var(--ink);text-align:left;font-size:var(--ctlfont);
  line-height:1.25;display:flex;align-items:center;gap:8px;}
.ml-pickbtn:hover{background:var(--soft-hover);}
.ml-pick.open .ml-pickbtn{border-color:var(--brand);background:var(--card);}
.ml-picklabel{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;}
.ml-chev{position:absolute;right:16px;top:50%;width:7px;height:7px;border-right:2px solid var(--soft);
  border-bottom:2px solid var(--soft);transform:translateY(-70%) rotate(45deg);pointer-events:none;border-radius:1px;
  transition:transform .18s var(--ease);}
.ml-pick.open .ml-chev{transform:translateY(-30%) rotate(-135deg);border-color:var(--brand);}
.ml-pickmenu{position:absolute;z-index:40;top:calc(100% + 8px);left:0;right:0;max-height:290px;overflow-y:auto;
  background:var(--card);border:0;border-radius:var(--r-sm);box-shadow:var(--sh-float);padding:8px;
  animation:mlfade .18s var(--ease);}
.ml-pickopt{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:1px;width:100%;
  text-align:left;padding:11px 40px 11px 13px;border:0;background:none;color:var(--ink);border-radius:var(--r-xs);
  font-size:14.5px;font-family:inherit;min-height:44px;font-weight:500;}
.ml-pickopt:hover{background:var(--soft-hover);}
.ml-pickopt.on{background:var(--field);font-weight:700;}
.ml-pickopt.on::after{content:"";position:absolute;right:15px;top:50%;width:16px;height:8px;margin-top:-7px;
  border-left:2.5px solid var(--credit);border-bottom:2.5px solid var(--credit);transform:rotate(-45deg);border-radius:1px;}
.ml-pickhint{font-size:12px;color:var(--soft);font-weight:500;}
.ml-pick.sm .ml-pickbtn{min-height:36px;padding:6px 28px 6px 12px;font-size:13px;background:transparent;font-weight:600;}
.ml-pick.sm .ml-chev{right:10px;width:6px;height:6px;}
.ml-pick.sm .ml-pickmenu{left:auto;right:0;min-width:236px;}

/* ---- calendar ---- */
.ml-cal{position:absolute;z-index:40;top:calc(100% + 8px);left:0;width:300px;max-width:calc(100vw - 40px);
  background:var(--card);border:0;border-radius:var(--r-sm);box-shadow:var(--sh-float);padding:16px;
  animation:mlfade .18s var(--ease);}
.ml-calhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.ml-calnav{width:32px;height:32px;border:0;border-radius:50%;background:var(--field);color:var(--ink);
  display:inline-flex;align-items:center;justify-content:center;font-size:15px;line-height:1;}
.ml-calnav:hover{background:var(--soft-hover);}
.ml-calmon{font-size:14px;font-weight:700;letter-spacing:-.01em;}
.ml-calgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
.ml-caldow{font-size:10.5px;font-weight:600;color:var(--faint);text-align:center;padding:5px 0;}
.ml-calday{aspect-ratio:1/1;min-height:36px;border:0;background:none;border-radius:50%;color:var(--ink);
  font-family:inherit;font-size:13.5px;font-weight:500;display:flex;align-items:center;justify-content:center;}
.ml-calday:hover{background:var(--soft-hover);}
.ml-calday.on{background:var(--accent);color:var(--accent-ink);font-weight:700;}
.ml-calday.today{box-shadow:inset 0 0 0 1.5px var(--brand);}
.ml-calday.mute{visibility:hidden;}
.ml-calfoot{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--line);}

/* ---- alerts ---- */
.ml-alert{display:flex;gap:13px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--line-soft);}
.ml-alert:last-child{border-bottom:0;}
.ml-adot{flex:0 0 auto;width:8px;height:8px;border-radius:50%;margin-top:7px;background:var(--faint);}
.ml-adot.now{background:var(--debit);} .ml-adot.soon{background:var(--amber);} .ml-adot.ok{background:var(--credit);}
.ml-atitle{font-weight:700;font-size:14.5px;letter-spacing:-.01em;}
.ml-ameta{font-size:12.5px;color:var(--soft);margin-top:3px;}
.ml-awhen{margin-left:auto;text-align:right;flex:0 0 auto;}
.ml-awhen b{display:block;font-size:13px;font-weight:700;}

/* ---- 4b. SPARKLINE / AREA CHART ---- */
.ml-spark{width:100%;height:auto;display:block;overflow:visible;}
.ml-sparkwrap{margin-top:6px;}
.ml-sparkx{display:flex;justify-content:space-between;margin-top:8px;}
.ml-sparkx span{font-size:11px;color:var(--faint);font-weight:500;}
.ml-legend{display:flex;gap:16px;margin-top:14px;}
.ml-legend span{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--soft);font-weight:500;}
.ml-legend i{width:9px;height:9px;border-radius:3px;display:inline-block;}

/* ---- disclosure, schedule, month ---- */
.ml-disclose{display:flex;align-items:center;gap:12px;width:100%;padding:0;border:0;background:none;
  color:var(--ink);text-align:left;min-height:46px;}
.ml-disclose:hover .ml-h{color:var(--brand);}
.ml-chevs{position:static;transform:rotate(45deg);flex:0 0 auto;margin-left:2px;}
.ml-chevs.up{transform:rotate(-135deg);}
.ml-sched{margin-top:14px;border-top:1px solid var(--line);}
.ml-srow{display:grid;grid-template-columns:24px minmax(0,1fr) 98px 32px;gap:10px;align-items:center;
  padding:11px 0;border-bottom:1px solid var(--line-soft);font-size:13.5px;}
.ml-srow:last-child{border-bottom:0;}
.ml-sk{font-size:11.5px;font-weight:600;color:var(--faint);}
.ml-samt{text-align:right;font-variant-numeric:tabular-nums;font-weight:700;letter-spacing:-.02em;}
.ml-sedit{grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:4px 0 12px;}
.ml-sedit input{flex:1 1 120px;min-width:0;}
.ml-monthbal{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;padding:17px;margin:14px 0 4px;
  border-radius:var(--r-sm);background:var(--sunk);}
@media(min-width:620px){.ml-monthbal{grid-template-columns:repeat(4,1fr);}}
.ml-mbv{font-size:17px;font-weight:800;margin-top:5px;letter-spacing:-.03em;}
.ml-mbnote{grid-column:1/-1;}
.ml-monthbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px;}
.ml-monthbar .ml-pick{flex:0 1 210px;}
.ml-barcol{flex:1;text-align:center;background:none;border:0;padding:0;color:inherit;border-radius:var(--r-xs);}
.ml-barcol:hover{background:var(--soft-hover);}

@media(hover:none){
  .ml-btn:hover{background:var(--accent);}
  .ml-btn.ghost:hover{background:var(--field);}
  .ml-x:hover,.ml-pickopt:hover,.ml-calday:hover,.ml-theme:hover,.ml-calnav:hover,.ml-barcol:hover,.ml-acchead:hover{background:transparent;}
  .ml-rowacts{opacity:1;}
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
const monthOf = (iso) => iso.slice(0, 7);
const addMonthKey = (key, n) => {
  const [y, m] = key.split("-").map(Number);
  const dt = new Date(y, m - 1 + n, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};
/* Day N of a given month, clamped for short months. */
const onDay = (key, day) => {
  const [y, m] = key.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${key}-${String(Math.min(Math.max(1, day), last)).padStart(2, "0")}`;
};
/* The statement day on or before this date — where the open cycle began. */
const cycleStartOn = (iso, sday) => {
  const here = onDay(monthOf(iso), sday);
  return iso >= here ? here : onDay(addMonthKey(monthOf(iso), -1), sday);
};
/* Payment date for a statement that closed on this date. */
const dueAfter = (close, dday) => {
  const same = onDay(monthOf(close), dday);
  return same > close ? same : onDay(addMonthKey(monthOf(close), 1), dday);
};
/* A card carries two dates: when its cycle turns over, and when that bill is
   payable. Only the day-of-month matters — both repeat every month. */
const clampDay = (n, fallback) => Math.min(28, Math.max(1, num(n) || fallback));
const stmtDay = (c) => clampDay(
  c.cycleStart ? c.cycleStart.slice(8, 10) : c.cycleDate ? c.cycleDate.slice(8, 10) : c.statementDay, 1);
/* The end of a cycle that begins on this date — the day before the next one. */
const cycleEndFor = (start) => addDays(addMonths(start, 1), -1);
const dueDayOf = (c) => clampDay(c.dueDate ? c.dueDate.slice(8, 10) : c.dueDay, 20);
/* The cycle running today, and the date its bill falls due. */
const currentCycle = (c, today) => {
  const start = cycleStartOn(today, stmtDay(c));
  const close = onDay(addMonthKey(monthOf(start), 1), stmtDay(c));
  return { start, close, end: addDays(close, -1), due: dueAfter(close, dueDayOf(c)) };
};
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
const NAV_ICONS = {
  log: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>),
  overview: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>),
  alerts: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>),
  accounts: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18M7 15h4" /></svg>),
  cards: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="5.5" width="19" height="13" rx="2.5" /><path d="M2.5 10h19" /></svg>),
  shared: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="18" cy="7.5" r="2.4" /><path d="M15.5 12.2c2.9.4 5 2.5 5 5.3" /></svg>),
  emi: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.3" /><path d="M4.5 20.5c0-4.1 3.3-7 7.5-7s7.5 2.9 7.5 7" /></svg>),
  auto: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11A8 8 0 1 0 6.3 17.5" /><path d="M20 5v6h-6M4 22v-4M9 20h-5" /></svg>),
  budget: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>),
  backup: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13m0 0-4-4m4 4 4-4" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></svg>),
  settings: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" /></svg>),
  more: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></svg>),
};
const NavIcon = ({ id }) => <span style={{ width: 19, height: 19, display: "inline-flex", flex: "0 0 auto" }}>{NAV_ICONS[id] || NAV_ICONS.more}</span>;

/* ---------- 3. SMART LOGO ----------
   Resolves an icon (by keyword match on category/note) or falls back to a
   deterministic pastel initial badge — same idea as Google Pay's merchant
   avatars, without depending on any external logo service. */
const LOGO_KEYS = [
  [/grocer|super ?market|mart/i, "cart", ["#FDEDD3", "#B9720B"]],
  [/dining|restaurant|food|cafe|coffee/i, "cup", ["#FBE3E0", "#C2452F"]],
  [/travel|flight|train|uber|ola|cab/i, "plane", ["#E3ECFC", "#2A5BC7"]],
  [/fuel|petrol|gas/i, "fuel", ["#FDEBD6", "#B85A15"]],
  [/util|electri|water|broadband|internet|wifi/i, "bolt", ["#FFF3CE", "#B08900"]],
  [/rent/i, "home", ["#E7F3EC", "#1E7F4E"]],
  [/health|medic|pharma|doctor|hospital/i, "heart", ["#FCE4EC", "#C2306B"]],
  [/entertain|movie|music|game|stream/i, "play", ["#F0E6FB", "#6B3FB0"]],
  [/subscri/i, "repeat", ["#E4F0FB", "#1E6FB0"]],
  [/educat|course|tuition|school/i, "book", ["#E9F0FE", "#2C57B5"]],
  [/loan|emi/i, "bank", ["#F0EAFB", "#5B3FAE"]],
  [/invest/i, "trend", ["#E7F3EC", "#1E7F4E"]],
  [/transfer/i, "swap", ["#EDEFF3", "#4B5563"]],
  [/settle|refund/i, "check", ["#E7F3EC", "#1E7F4E"]],
  [/salary|income/i, "wallet", ["#FFF3CE", "#B08900"]],
  [/shop|store|amazon|flipkart/i, "bag", ["#FBE3E0", "#C2452F"]],
];
const LOGO_GLYPHS = {
  cart: "M4 5h2l1.2 9.6a2 2 0 0 0 2 1.7h6.6a2 2 0 0 0 2-1.6L19 8H7 M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  cup: "M4 8h13a3 3 0 0 1 0 6h-1M4 8v7a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V8M4 8V5h9v3",
  plane: "M11 3 3 10l4 1 1 4 3-3 3 5 3-14-13 4 4 2",
  fuel: "M5 21V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v15M5 21h8M5 11h6M15 8l3 2v6.5a1.5 1.5 0 0 0 3 0V9l-2-2",
  bolt: "M13 2 4 14h6l-1 8 9-12h-6z",
  home: "M4 11 12 4l8 7M6 10v10h5v-6h2v6h5V10",
  heart: "M12 20s-7-4.4-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5c-2.5 4.6-9.5 9-9.5 9Z",
  play: "M7 4v16l14-8Z",
  repeat: "M17 2 21 6l-4 4M3 12a6 6 0 0 1 10.2-4.2L21 6M7 22 3 18l4-4M21 12a6 6 0 0 1-10.2 4.2L3 18",
  book: "M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13",
  bank: "M3 21h18M4 21V10l8-6 8 6v11M9 21v-6h6v6",
  trend: "m3 17 6-6 4 4 8-8M15 6h6v6",
  swap: "m17 3 4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3",
  check: "M20 6 9 17l-5-5",
  wallet: "M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2H5v10a1 1 0 0 0 1 1h13V9M17 13h.01",
  bag: "M6 8h12l1 12H5L6 8Zm3 0V6a3 3 0 0 1 6 0v2",
};
const initialsOf = (s) => {
  const words = String(s || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words.length === 1 ? words[0].slice(0, 2).toUpperCase() : (words[0][0] + words[1][0]).toUpperCase();
};
/* Deterministic pastel pair from the string itself — same label, same colour, every time. */
const pastelFor = (s) => {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return [`hsl(${hue} 72% 92%)`, `hsl(${hue} 45% 38%)`];
};
function SmartLogo({ label, small }) {
  const text = String(label || "");
  const hit = LOGO_KEYS.find(([re]) => re.test(text));
  const [bg, fg] = hit ? hit[2] : pastelFor(text || "?");
  return (
    <div className={"ml-logo" + (small ? " sm" : "")} style={{ background: bg, color: fg }}>
      {hit ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d={LOGO_GLYPHS[hit[1]]} />
        </svg>
      ) : (
        <span style={{ fontWeight: 700 }}>{initialsOf(text)}</span>
      )}
    </div>
  );
}

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
const CARD_INKS = ["#1C1E22", "#2E2A55", "#5C3A1E", "#123C36", "#3B2440", "#26303D"];
const ACC_INKS = ["#3F4D2A", "#123B4D", "#3A2A55", "#4D2A1E", "#1F4D33", "#4A3B1E"];
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

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 19.5h4.2L19.4 8.8a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L4.5 15.3v4.2z" />
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
  cards: [{
    id: uid(), name: "Primary credit card", limit: 200000,
    cycleStart: onDay(monthOf(TODAY()), 15),
    cycleEnd: cycleEndFor(onDay(monthOf(TODAY()), 15)),
    dueDate: onDay(addMonthKey(monthOf(TODAY()), 1), 5),
  }],
  spends: [],       // credit-card ledger
  savingsTx: [],    // deposits, withdrawals, interest, auto-debits, card payments
  emis: [],         // friends' purchases on your card
  repayments: [],   // money friends paid back
  recurring: [],    // loans, rent, SIPs, subscriptions
  budgets: {},      // category -> monthly amount
});

/* Cuts a card's activity into billing cycles. Everything dated inside a cycle
   lands on that cycle's statement; the cycle still running is not yet billed.
   Payments name the statement they clear, and anything left unpaid stays on
   that statement as overdue rather than quietly disappearing. */
function buildStatements(card, entries, payments, today) {
  const sday = stmtDay(card), dday = dueDayOf(card);
  if (entries.length === 0) return [];
  const first = entries.reduce((min, e) => (e.date < min ? e.date : min), entries[0].date);
  let start = cycleStartOn(first < today ? first : today, sday);

  const byKey = {};
  let loose = 0;
  payments.forEach((t) => {
    if (t.statementKey) byKey[t.statementKey] = r2((byKey[t.statementKey] || 0) + num(t.amount));
    else loose = r2(loose + num(t.amount));   // older payments with no statement named
  });

  const out = [];
  let guard = 0;
  while (guard++ < 300) {
    const close = onDay(addMonthKey(monthOf(start), 1), sday);
    const inside = entries.filter((e) => e.date >= start && e.date < close);
    const amount = r2(inside.reduce((sum, e) => sum + num(e.amount), 0));
    const open = close > today;
    out.push({
      key: close, start, close, end: addDays(close, -1), due: dueAfter(close, dday),
      amount, entries: inside, open, paid: 0, balance: amount,
    });
    if (open) break;
    start = close;
  }

  /* named payments first, then anything unallocated against the oldest bill */
  out.forEach((st) => {
    const named = byKey[st.key] || 0;
    st.paid = named;
    st.balance = r2(st.amount - named);
  });
  out.forEach((st) => {
    if (loose <= 0 || st.open || st.balance <= 0) return;
    const take = Math.min(loose, st.balance);
    st.paid = r2(st.paid + take);
    st.balance = r2(st.balance - take);
    loose = r2(loose - take);
  });
  out.forEach((st) => {
    st.overdue = !st.open && st.balance > 0 && st.due < today;
  });
  return out;
}

const CREDIT_TYPES = ["deposit", "interest", "settlement", "transfer-in"];
const isCredit = (t) => CREDIT_TYPES.includes(t.type) || (t.type === "adjustment" && t.up);

/* Every month that actually has something in it, newest first. */
function monthsWithData(data) {
  const seen = {};
  data.spends.forEach((x) => { seen[monthOf(x.date)] = 1; });
  data.savingsTx.forEach((x) => { seen[monthOf(x.date)] = 1; });
  return Object.keys(seen).sort().reverse();
}

/* An account's balance as it stood before a given date — worked back from
   today's balance by unwinding everything posted on or after it. */
function balanceBefore(data, accountId, iso) {
  const a = data.accounts.find((x) => x.id === accountId);
  if (!a) return 0;
  let bal = num(a.balance);
  data.savingsTx.forEach((t) => {
    if (t.accountId !== accountId || t.date < iso) return;
    bal = r2(bal + (isCredit(t) ? -num(t.amount) : num(t.amount)));
  });
  return r2(bal);
}
const monthStart = (key) => `${key}-01`;
const monthAfter = (key) => `${addMonthKey(key, 1)}-01`;

/* Opening and closing for one account, or for all of them together. */
function monthBalances(data, key, accountId) {
  const list = accountId ? data.accounts.filter((a) => a.id === accountId) : data.accounts;
  const open = r2(list.reduce((sum, a) => sum + balanceBefore(data, a.id, monthStart(key)), 0));
  const close = r2(list.reduce((sum, a) => sum + balanceBefore(data, a.id, monthAfter(key)), 0));
  const moves = data.savingsTx.filter((t) =>
    monthOf(t.date) === key && (!accountId || t.accountId === accountId));
  return {
    open, close,
    inflow: r2(moves.filter(isCredit).reduce((sum, t) => sum + num(t.amount), 0)),
    outflow: r2(moves.filter((t) => !isCredit(t)).reduce((sum, t) => sum + num(t.amount), 0)),
    count: moves.length,
  };
}

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

/* A card EMI is not just principal ÷ months.
   No-cost: the merchant absorbs the interest, but the bank still charges a
   processing fee and tax on that fee up front.
   Interest-bearing: a reducing-balance schedule, with tax on each month's
   interest portion — so the instalment drifts slightly month to month.
   Every rate is a field on the EMI, never assumed. */
function emiSchedule(e) {
  const P = num(e.principal);
  const n = Math.max(1, Math.round(num(e.months)));
  const start = e.startDate || TODAY();
  const fee = num(e.procFee);
  const feeTax = r2(fee * num(e.feeGst) / 100);
  const upfront = r2(fee + feeTax);
  const rows = [];

  if ((e.emiType || "nocost") === "interest" && num(e.rate) > 0) {
    const i = num(e.rate) / 100 / 12;
    const factor = Math.pow(1 + i, n);
    const flat = (P * i * factor) / (factor - 1);
    let bal = P;
    for (let k = 0; k < n; k++) {
      const interest = bal * i;
      const principal = flat - interest;
      const tax = interest * num(e.intGst) / 100;
      bal = bal - principal;
      rows.push({
        k, date: addMonths(start, k), principal: r2(principal),
        interest: r2(interest), tax: r2(tax), amount: r2(flat + tax),
      });
    }
  } else {
    const per = P / n;
    for (let k = 0; k < n; k++) {
      rows.push({ k, date: addMonths(start, k), principal: r2(per), interest: 0, tax: 0, amount: r2(per) });
    }
  }

  /* The bank's statement wins. An override replaces that one month's figure;
     every later month stays as computed, and the totals follow the effective
     amounts rather than the modelled ones. */
  const ov = e.overrides || {};
  rows.forEach((r) => {
    const raw = ov[String(r.k)];
    if (raw === undefined || raw === null || raw === "") return;
    const v = num(raw);
    if (!(v >= 0)) return;
    r.computed = r.amount;
    r.amount = r2(v);
    r.override = true;
  });

  const instalments = r2(rows.reduce((sum, r) => sum + r.amount, 0));
  const modelled = r2(rows.reduce((sum, r) => sum + (r.override ? r.computed : r.amount), 0));
  return {
    rows, fee: r2(fee), feeTax, upfront, instalments,
    interest: r2(rows.reduce((sum, r) => sum + r.interest, 0)),
    tax: r2(rows.reduce((sum, r) => sum + r.tax, 0)),
    total: r2(instalments + upfront),
    modelledTotal: r2(modelled + upfront),
    drift: r2(instalments - modelled),
    overrides: rows.filter((r) => r.override).length,
    monthly: rows.length ? rows[0].amount : 0,
  };
}

/* Everything the card has been charged for this EMI so far. */
const emiDueBy = (sched, e, on) => {
  let due = (e.startDate || TODAY()) <= on ? sched.upfront : 0;
  sched.rows.forEach((r) => { if (r.date <= on) due = r2(due + r.amount); });
  return r2(due);
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
  d.cards.push({
    id: uid(), name: "Travel card", limit: 120000,
    cycleStart: onDay(monthOf(t), 25), cycleEnd: cycleEndFor(onDay(monthOf(t), 25)),
    dueDate: onDay(addMonthKey(monthOf(t), 1), 14),
  });
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
  const [jump, setJump] = useState(null);   // { tab, id } — opened from Overview
  const [moreOpen, setMoreOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
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
      const sched = emiSchedule(e);
      const due = sched.rows.filter((r) => r.date <= today).length;
      const received = r2(data.repayments.filter((r) => r.emiId === e.id).reduce((s, r) => s + num(r.amount), 0));
      /* the friend carries the whole cost, so what they owe is the full schedule */
      const outstanding = r2(Math.max(0, sched.total - received));
      const overpaid = r2(Math.max(0, received - sched.total));
      const billedSoFar = emiDueBy(sched, e, today);
      const overdue = r2(Math.max(0, billedSoFar - received));
      return { ...e, sched, monthly: sched.monthly, due, received, outstanding, overpaid, overdue, billedSoFar, total: sched.total };
    });
    const receivable = r2(emiRows.reduce((s, e) => s + Math.max(0, e.outstanding), 0));
    const emiBilled = r2(emiRows.reduce((s, e) => s + e.billedSoFar, 0));

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
      const spends = data.spends.filter((x) => x.cardId === c.id)
        .map((x) => ({ date: x.date, amount: num(x.amount), label: x.note || x.category, kind: "spend" }));

      /* A friend's instalments are dated, so they fall into cycles like any spend. */
      const mine = emiRows.filter((e) => e.cardId === c.id);
      const instal = [];
      mine.forEach((e) => {
        if (e.sched.upfront > 0) {
          instal.push({
            date: e.startDate, amount: e.sched.upfront, kind: "emi", emiId: e.id,
            label: `${e.friend} — ${e.item} · fee + tax`,
          });
        }
        e.sched.rows.forEach((r) => {
          instal.push({
            date: r.date, amount: r.amount, kind: "emi", emiId: e.id,
            label: `${e.friend} — ${e.item} (${r.k + 1}/${e.months})`,
          });
        });
      });

      const payments = data.savingsTx.filter((t) => t.type === "card-payment" && t.cardId === c.id);
      const statements = buildStatements(c, [...spends, ...instal], payments, today);
      const openSt = statements.find((x) => x.open) || null;
      const closed = statements.filter((x) => !x.open);

      const billed = r2(closed.reduce((sum, x) => sum + Math.max(0, x.balance), 0));
      const unbilled = openSt ? r2(Math.max(0, openSt.amount - openSt.paid)) : 0;
      /* what the card owes right now, moving with every entry rather than
         waiting for the cycle to close */
      const live = r2(billed + unbilled);
      /* Instalments not yet on any statement still hold against the limit. */
      const horizon = openSt ? openSt.close : today;
      const emiHold = r2(mine.reduce((sum, e) => {
        const onCard = instal.filter((i) => i.emiId === e.id && i.date < horizon).reduce((a, i) => a + i.amount, 0);
        return sum + Math.max(0, e.total - onCard);
      }, 0));

      const paid = r2(payments.reduce((sum, t) => sum + num(t.amount), 0));
      const used = r2(live + emiHold);
      const nextBill = closed.find((x) => x.balance > 0) || (openSt && openSt.amount > 0 ? openSt : null);

      return {
        ...c, cycle: currentCycle(c, today), statements, closed, openSt, billed, unbilled, emiHold, paid,
        own: r2(spends.reduce((sum, x) => sum + x.amount, 0)),
        emiDue: r2(instal.filter((i) => !openSt || i.date < openSt.start).reduce((a, i) => a + i.amount, 0)),
        blocked: emiHold,
        outstanding: live, billedOnly: billed,
        overdue: r2(closed.filter((x) => x.overdue).reduce((sum, x) => sum + x.balance, 0)),
        nextDue: nextBill ? nextBill.due : null,
        nextDueAmount: nextBill ? (nextBill.open ? nextBill.amount : nextBill.balance) : 0,
        used, available: r2(num(c.limit) - used),
      };
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

    /* Everything with a date attached, gathered into one feed. */
    const alerts = [];
    const inDays = (d) => daysBetween(today, d);
    cardRows.forEach((c) => {
      c.closed.filter((st) => st.balance > 0).forEach((st) => {
        const left = inDays(st.due);
        if (left > 12) return;
        alerts.push({
          id: `card-${c.id}-${st.key}`, kind: "Card bill", amount: st.balance, title: `${c.name} — ${fmt0(st.balance)} due`,
          meta: `Statement of ${fmtDate(st.end)}${st.paid > 0 ? ` · ${fmt0(st.paid)} already paid` : ""}`,
          date: st.due, days: left, level: left < 0 ? "now" : left <= 5 ? "soon" : "later",
        });
      });
    });
    data.recurring.filter((r) => r.active && r.nextDue).forEach((r) => {
      const left = inDays(r.nextDue);
      if (left > 7) return;
      alerts.push({
        id: `auto-${r.id}`, kind: "Auto-payment", amount: num(r.amount), title: `${r.name} — ${fmt0(r.amount)}`,
        meta: `From ${r.sourceType === "savings" ? accOf(r.sourceId) : cardOf(r.sourceId)}`,
        date: r.nextDue, days: left, level: left < 0 ? "now" : left <= 5 ? "soon" : "later",
      });
    });
    emiRows.filter((e) => e.overdue > 0).forEach((e) => {
      alerts.push({
        id: `emi-${e.id}`, kind: "Owed to you", amount: 0, title: `${e.friend} is behind by ${fmt0(e.overdue)}`,
        meta: `${e.item} · ${e.due} of ${e.months} instalments billed to your card`,
        date: today, days: 0, level: "now",
      });
    });
    sharedRows.filter((x) => x.pending > 0 && daysBetween(x.date, today) >= 14).forEach((x) => {
      alerts.push({
        id: `shared-${x.id}`, kind: "Owed to you", amount: 0, title: `${x.shareFriend || "A friend"} owes ${fmt0(x.pending)}`,
        meta: `${x.note || x.category} · split ${daysBetween(x.date, today)} days ago`,
        date: x.date, days: 0, level: "soon",
      });
    });
    budgetRows.filter((b) => !b.target && b.pct >= 80).forEach((b) => {
      alerts.push({
        id: `budget-${b.cat}`, kind: "Budget", amount: 0, title: `${b.cat} at ${b.pct}% of ${fmt0(b.amount)}`,
        meta: b.pct > 100 ? `${fmt0(b.used - b.amount)} over the cap` : `${fmt0(b.amount - b.used)} left this month`,
        date: today, days: 0, level: b.pct > 100 ? "now" : "soon",
      });
    });
    const lastBackup = data.config.lastBackup ? data.config.lastBackup.slice(0, 10) : null;
    const backupAge = lastBackup ? daysBetween(lastBackup, today) : null;
    if (backupAge === null || backupAge >= 14) {
      alerts.push({
        id: "backup", kind: "Housekeeping", amount: 0,
        title: lastBackup ? `No backup for ${backupAge} days` : "No backup taken yet",
        meta: "Browser storage can be cleared without warning — keep a copy elsewhere.",
        date: today, days: 0, level: "later",
      });
    }
    const rank = { now: 0, soon: 1, later: 2 };
    alerts.sort((a, b) => (rank[a.level] - rank[b.level]) || (a.days - b.days) || a.title.localeCompare(b.title));
    const urgent = alerts.filter((a) => a.level !== "later").length;

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
      alerts, urgent,
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
    ["log", "Quick log"], ["overview", "Overview"], ["alerts", "Alerts"],
    ["accounts", "Accounts"], ["cards", "Cards"], ["shared", "Shared"],
    ["emi", "Friends & Family"], ["auto", "Auto-pay"], ["budget", "Budget"],
    ["backup", "Backup"], ["settings", "Settings"],
  ];

  return (
    <div className="ml-root" data-theme={theme}>
      <style>{CSS}</style>
      <div className="ml-shell">

      <aside className="ml-side">
        <div className="ml-sidepill">
          <div className="ml-sidebrand"><NavIcon id="overview" /> Money<span> Ledger</span></div>
          {TABS.map(([id, label]) => (
            <button key={id} className="ml-sidelink" data-on={tab === id ? "1" : "0"} onClick={() => setTab(id)}>
              <NavIcon id={id} />
              <span>{label}</span>
              {id === "alerts" && A.urgent > 0 && <span className="ml-pill off">{A.urgent}</span>}
            </button>
          ))}
          <div className="ml-sidefoot">
            <button className="ml-theme" onClick={toggleHidden} title={hidden ? "Show figures" : "Hide figures"}>
              {hidden ? <EyeOffIcon /> : <EyeIcon />}
            </button>
            <button className="ml-theme" onClick={toggleTheme} title={dark ? "Light mode" : "Dark mode"}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </aside>

      <div className="ml-main">
      <header className="ml-top">
        <div className="ml-topin">
          <div className="ml-headline">
            <div className="ml-brand">Money<span> Ledger</span></div>
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
          <div className="ml-tabsel">
            <Pick value={tab} onChange={setTab}
              options={TABS.map(([id, label]) => ({
                value: id,
                label: id === "alerts" && A.urgent > 0 ? `${label} (${A.urgent})` : label,
                hint: TAB_HINTS[id],
              }))} />
            {A.urgent > 0 && tab !== "alerts" && (
              <button className="ml-btn ghost sm" onClick={() => setTab("alerts")}>
                {A.urgent} need{A.urgent === 1 ? "s" : ""} attention
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="ml-wrap">
        {tab === "log" && <QuickLog A={A} data={data} mutate={mutate} say={say} setTab={setTab} />}
        {tab === "overview" && (
          <Overview A={A} data={data} posted={posted} setTab={setTab}
            open={(t, id) => { setJump({ tab: t, id }); setTab(t); }} />
        )}
        {tab === "accounts" && <Savings A={A} data={data} mutate={mutate} say={say} posted={posted} effRate={effRate} jump={jump && jump.tab === "accounts" ? jump.id : null} />}
        {tab === "cards" && <Cards A={A} data={data} mutate={mutate} say={say} jump={jump && jump.tab === "cards" ? jump.id : null} />}
        {tab === "alerts" && <Alerts A={A} setTab={setTab} />}
        {tab === "shared" && <SharedPanel A={A} data={data} mutate={mutate} say={say} />}
        {tab === "emi" && <Emis A={A} data={data} mutate={mutate} say={say} />}
        {tab === "auto" && <Auto A={A} data={data} mutate={mutate} say={say} />}
        {tab === "budget" && <Budget A={A} data={data} mutate={mutate} say={say} />}
        {tab === "backup" && <Backup A={A} data={data} mutate={mutate} setData={setData} say={say} />}
        {tab === "settings" && <Settings A={A} data={data} mutate={mutate} setData={setData} say={say} setPosted={setPosted} where={where} />}
      </main>

      </div>
      </div>

      <nav className="ml-bnav">
        {BOTTOM_NAV.map(([id, label]) => (
          <button key={id} className="ml-bitem" data-on={tab === id ? "1" : "0"} onClick={() => setTab(id)}>
            <NavIcon id={id} />
            <span>{label}</span>
            {id === "alerts" && A.urgent > 0 && <span className="ml-bcount">{A.urgent}</span>}
          </button>
        ))}
        <button className="ml-bfab" onClick={() => setTab("log")} aria-label="Quick log">
          <NavIcon id="log" />
        </button>
        <button className="ml-bitem" data-on={moreOpen ? "1" : "0"} onClick={() => setMoreOpen(true)}>
          <NavIcon id="more" />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <Modal title="All sections" onClose={() => setMoreOpen(false)}>
          {TABS.map(([id, label]) => (
            <button key={id} className="ml-pickopt" style={{ marginBottom: 4, display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}
              onClick={() => { setTab(id); setMoreOpen(false); }}>
              <NavIcon id={id} />
              <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span>{label}</span>
                <span className="ml-pickhint">{TAB_HINTS[id]}</span>
              </span>
            </button>
          ))}
          <div className="ml-flex" style={{ marginTop: 14 }}>
            <button className="ml-btn ghost sm" onClick={() => { toggleHidden(); }}>
              {hidden ? "Show figures" : "Hide figures"}
            </button>
            <button className="ml-btn ghost sm" onClick={() => { toggleTheme(); }}>
              {dark ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </Modal>
      )}

      {toast && <div className="ml-toast">{toast}</div>}
    </div>
  );
}

/* What sits on the phone's bottom bar; everything else lives behind More. */
const BOTTOM_NAV = [["overview", "Home"], ["cards", "Cards"], ["alerts", "Alerts"]];

const TAB_HINTS = {
  log: "log anything, anywhere",
  overview: "where the month stands",
  alerts: "what's falling due",
  accounts: "balances, interest, statements",
  cards: "cycles, bills and limits",
  shared: "split bills to collect",
  emi: "purchases on your card",
  auto: "loans, rent, subscriptions",
  budget: "caps and targets",
  backup: "take a copy",
  settings: "rate, income, categories",
};

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

/* Pick a month to look back at, or stay on the most recent entries. */
function MonthPick({ value, onChange, months }) {
  return (
    <Pick value={value} onChange={onChange} placeholder="Latest entries"
      options={[{ value: "", label: "Latest entries", hint: "most recent, all months" },
        ...months.map((k) => ({ value: k, label: monthLabel(k) }))]} />
  );
}

/* Opening and closing for the month being viewed. */
function MonthBalance({ b, label }) {
  return (
    <div className="ml-monthbal">
      <div>
        <div className="ml-eyebrow">Opening</div>
        <div className="ml-num ml-mbv">{mask(fmt(b.open))}</div>
      </div>
      <div>
        <div className="ml-eyebrow">In</div>
        <div className="ml-num ml-mbv ml-credit">{mask(fmt0(b.inflow))}</div>
      </div>
      <div>
        <div className="ml-eyebrow">Out</div>
        <div className="ml-num ml-mbv ml-debit">{mask(fmt0(b.outflow))}</div>
      </div>
      <div>
        <div className="ml-eyebrow">Closing</div>
        <div className="ml-num ml-mbv" style={{ fontWeight: 600 }}>{mask(fmt(b.close))}</div>
      </div>
      {label && <div className="ml-sub ml-mbnote">{label}</div>}
    </div>
  );
}

/* Edits an entry in place — same fields you filled in, opened on the row itself. */
function InlineEdit({ fields, values, onSave, onCancel, note }) {
  const [v, setV] = useState(values);
  const set = (k, x) => setV({ ...v, [k]: x });
  return (
    <div style={{ padding: "10px 0 4px", borderTop: "1px dashed var(--rule)" }}>
      <div className="ml-form">
        {fields.map((f) => (
          <Field key={f.key} label={f.label} span={f.span}>
            {f.type === "date" ? <DateField value={v[f.key]} onChange={(x) => set(f.key, x)} />
              : f.type === "select" ? <Pick value={v[f.key]} onChange={(x) => set(f.key, x)} options={f.options} />
                : <input className={"ml-in" + (f.type === "num" ? " ml-num" : "")}
                    inputMode={f.type === "num" ? "decimal" : undefined}
                    value={v[f.key] === undefined ? "" : v[f.key]}
                    onChange={(ev) => set(f.key, ev.target.value)} />}
          </Field>
        ))}
      </div>
      {note && <div className="ml-sub" style={{ marginTop: 8 }}>{note}</div>}
      <div className="ml-flex" style={{ marginTop: 10 }}>
        <button className="ml-btn sm" onClick={() => onSave(v)}>Save changes</button>
        <button className="ml-btn ghost sm" onClick={onCancel}>Cancel</button>
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

function LedgerRow({ title, meta, debit, credit, invest, onDelete, onEdit }) {
  const tone = invest ? "ml-invest" : credit ? "ml-credit" : "ml-debit";
  const amount = invest || credit || debit || 0;
  const sign = invest ? "" : credit ? "+" : debit ? "−" : "";
  return (
    <div className="ml-lrow">
      <SmartLogo small label={title} />
      <div className="ml-lmain">
        <div className="ml-ltitle">{title}</div>
        <div className="ml-lmeta">{meta}</div>
      </div>
      {amount > 0 && <div className={"ml-lcell " + tone}>{sign}{fmt(amount)}</div>}
      <span className="ml-rowacts">
        {onEdit && <button className="ml-x" onClick={onEdit} title="Edit entry"><PencilIcon /></button>}
        {onDelete && <button className="ml-x" onClick={onDelete} title="Delete entry"><TrashIcon /></button>}
      </span>
    </div>
  );
}

/* Progressive disclosure: a summary row that expands on tap, so a heavy
   section (recurring rules, exports, repayment history) never front-loads
   its detail. */
function Accordion({ title, subtitle, right, icon, open, onToggle, children }) {
  return (
    <div className="ml-acc">
      <button type="button" className="ml-acchead" onClick={onToggle} aria-expanded={open}>
        {icon && <SmartLogo small label={icon} />}
        <span className="ml-accttl">
          <b>{title}</b>
          {subtitle && <span>{subtitle}</span>}
        </span>
        {right}
        <span className={"ml-chevs" + (open ? " up" : "")} style={{ color: "var(--faint)" }} />
      </button>
      {open && <div className="ml-accbody">{children}</div>}
    </div>
  );
}

/* Soft gradient area sparkline — one or two series over N points. */
function Sparkline({ series, labels, height = 130, onPointClick }) {
  const W = 600, H = height, PAD = 8;
  const all = series.flatMap((s) => s.values);
  const max = Math.max(1, ...all);
  const n = labels.length;
  const x = (i) => PAD + (i * (W - PAD * 2)) / Math.max(1, n - 1);
  const y = (v) => H - PAD - (v / max) * (H - PAD * 2 - 14);
  const pathFor = (values) => values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const areaFor = (values) => `${pathFor(values)} L${x(values.length - 1)},${H} L${x(0)},${H} Z`;

  return (
    <div className="ml-sparkwrap">
      <svg className="ml-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`mlgrad${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {series.map((s, i) => (
          <path key={"a" + i} d={areaFor(s.values)} fill={`url(#mlgrad${i})`} stroke="none" />
        ))}
        {series.map((s, i) => (
          <path key={"l" + i} d={pathFor(s.values)} fill="none" stroke={s.color} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {labels.map((_, i) => (
          <circle key={i} cx={x(i)} cy={y(series[0].values[i])} r="9" fill="transparent"
            style={{ cursor: onPointClick ? "pointer" : "default" }}
            onClick={() => onPointClick && onPointClick(i)} />
        ))}
      </svg>
      <div className="ml-sparkx">
        {labels.map((l, i) => <span key={i}>{l}</span>)}
      </div>
    </div>
  );
}

/* ---------- OVERVIEW ---------- */
function Overview({ A, data, posted, setTab, open }) {
  const [logOpen, setLogOpen] = useState(false);
  const [month, setMonth] = useState("");
  const catMax = Math.max(1, ...A.catRows.map((c) => c[1]));
  const months = monthsWithData(data);
  const everything = [...A.flows, ...data.savingsTx.filter((t) => ["deposit", "interest", "settlement"].includes(t.type))]
    .sort((a, b) => b.date.localeCompare(a.date));
  const recent = month ? everything.filter((f) => monthOf(f.date) === month) : everything.slice(0, 12);
  const monthBal = month ? monthBalances(data, month, null) : null;

  return (
    <div className="ml-page">
      <StatRow>
        <Stat label="Spent this month" value={fmt0(A.spentMonth)} note="your share only" tone="debit" />
        <Stat label="Invested" value={fmt0(A.investedMonth)} note="never counted as expense" tone="stamp" />
        <Stat label="Interest earned" value={fmt(A.interestMonth)} note={`${fmt(A.interestAll)} lifetime`} tone="credit" />
        <Stat label="Save rate" value={A.saveRate === null ? "—" : `${A.saveRate}%`} note={A.income ? `on ${fmt0(A.income)} income` : "set income in Settings"} />
      </StatRow>

      <div className="ml-qa ml-w6">
        {[
          ["log", "Add spend", "log"],
          ["accounts", "Transfer", "swap"],
          ["shared", "Split bill", "shared"],
          ["cards", "Pay a bill", "cards"],
          ["alerts", "Reminders", "alerts"],
        ].map(([t, label, icon]) => (
          <button key={label} className="ml-qabtn" onClick={() => setTab(t)}>
            <span className="ml-qaic"><NavIcon id={icon} /></span>
            {label}
          </button>
        ))}
      </div>

      <div className="ml-wallet ml-w6">
        {data.accounts.map((a, i) => (
          <Face key={a.id} tone={inkFor(ACC_INKS, i)} title={a.name} sub={a.type}
            rightLabel="Balance" rightValue={fmt0(a.balance)} onClick={() => open("accounts", a.id)} />
        ))}
        {A.cardRows.map((c, i) => (
          <Face key={c.id} chip tone={inkFor(CARD_INKS, i)} title={c.name}
            leftLabel="Limit" leftValue={fmt0(c.limit || 0)}
            rightLabel="Outstanding" rightValue={fmt0(c.outstanding)}
            onClick={() => open("cards", c.id)} />
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
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 150, marginTop: 12 }}>
            {A.months.map((m) => {
              const max = Math.max(1, ...A.months.map((x) => Math.max(x.spend, x.invest)));
              return (
                <button key={m.key} type="button" className="ml-barcol"
                  onClick={() => { setMonth(m.key); setLogOpen(true); }}
                  title={`Open ${m.label}`}>
                  <div style={{ display: "flex", gap: 3, alignItems: "flex-end", justifyContent: "center", height: 120 }}>
                    <div title={`Spent ${fmt0(m.spend)}`}
                      style={{ width: "42%", background: "var(--debit)", borderRadius: "5px 5px 2px 2px",
                        height: `${(m.spend / max) * 100}%`, minHeight: m.spend ? 3 : 0 }} />
                    <div title={`Invested ${fmt0(m.invest)}`}
                      style={{ width: "42%", background: "var(--stamp)", borderRadius: "5px 5px 2px 2px",
                        height: `${(m.invest / max) * 100}%`, minHeight: m.invest ? 3 : 0 }} />
                  </div>
                  <div className="ml-num" style={{ fontSize: 10, color: "var(--soft)", marginTop: 6 }}>{m.label}</div>
                </button>
              );
            })}
          </div>
          <div className="ml-legend">
            <span><i style={{ background: "var(--debit)" }} />Expenses</span>
            <span><i style={{ background: "var(--stamp)" }} />Investments</span>
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
                <div className="ml-bar"><i style={{ width: `${(amt / catMax) * 100}%` }} /></div>
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
              {everything.length === 0 ? "Nothing logged yet."
                : `${everything.length} entries across every account and card — browse them by month.`}
            </div>
          </div>
          <button className="ml-btn sm" onClick={() => setLogOpen(true)}>{month ? monthLabel(month) : "View"}</button>
        </div>
      </div>

      {logOpen && (
        <Modal title={month ? monthLabel(month) : "Recent entries"} subtitle="Newest first, from every source" onClose={() => setLogOpen(false)}>
          <div className="ml-monthbar" style={{ marginTop: 0, marginBottom: 4 }}>
            <MonthPick value={month} onChange={setMonth} months={months} />
          </div>
          {monthBal && <MonthBalance b={monthBal} label={`All accounts · ${monthBal.count} movement${monthBal.count === 1 ? "" : "s"}`} />}
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
function Savings({ A, data, mutate, say, posted, effRate, jump }) {
  const [f, setF] = useState({ name: "", type: "", interest: true, balance: "" });
  const [mv, setMv] = useState({
    mode: "spend", accountId: "", toId: "", amount: "",
    category: "Groceries", kind: "Settlement", date: TODAY(), note: "",
  });
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(jump || null);
  const [edit, setEdit] = useState(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [month, setMonth] = useState("");
  useEffect(() => { if (jump) setFocus(jump); }, [jump]);
  const [rowEdit, setRowEdit] = useState(null);
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

  const months = monthsWithData(data);
  const allTx = [...data.savingsTx]
    .filter((t) => !focus || t.accountId === focus)
    .filter((t) => !month || monthOf(t.date) === month)
    .sort((a, b) => b.date.localeCompare(a.date));
  const txs = month ? allTx : allTx.slice(0, 25);
  const focused = data.accounts.find((a) => a.id === focus);
  const bal = month ? monthBalances(data, month, focus) : null;

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
                    {a.type}
                    <span className="ml-pills" style={{ marginTop: 4 }}>
                      <span className={"ml-pill " + (a.earningInterest ? "on" : "off")}>{a.earningInterest ? `Earns ${effRate.toFixed(2)}% p.a.` : "No interest"}</span>
                    </span>
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
        <div className="ml-monthbar">
          <MonthPick value={month} onChange={setMonth} months={months} />
          {month && <span className="ml-sub">{txs.length} entr{txs.length === 1 ? "y" : "ies"} in {monthLabel(month)}</span>}
        </div>
        {bal && <MonthBalance b={bal} label={focused ? `${focused.name} through ${monthLabel(month)}` : `All accounts through ${monthLabel(month)}`} />}
        <div style={{ height: 10 }} />
        <LedgerHead />
        {txs.length === 0 ? <div className="ml-empty" style={{ marginTop: 12 }}>No entries yet.</div> :
          txs.map((t) => {
            const isIn = ["deposit", "interest", "settlement", "transfer-in"].includes(t.type) || (t.type === "adjustment" && t.up);
            const isInv = t.category === "Investment";
            const locked = t.type === "interest";
            return (
              <div key={t.id}>
              <LedgerRow
                title={t.note}
                meta={`${fmtDate(t.date)} · ${A.accOf(t.accountId)} · ${t.type === "interest" ? "Interest" : t.type === "adjustment" ? "Correction" : t.type === "transfer-out" ? "Transfer out" : t.type === "transfer-in" ? "Transfer in" : t.category}`}
                debit={!isIn && !isInv ? t.amount : 0}
                credit={isIn ? t.amount : 0}
                invest={isInv ? t.amount : 0}
                onEdit={locked ? null : () => setRowEdit(rowEdit === t.id ? null : t.id)}
                onDelete={locked ? null : () => mutate((d) => {
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
              {rowEdit === t.id && (
                <InlineEdit
                  values={{ note: t.note || "", amount: String(t.amount), date: t.date, category: t.category || "Other" }}
                  fields={[
                    { key: "note", label: "Note", span: true },
                    { key: "amount", label: "Amount", type: "num" },
                    { key: "date", label: "Date", type: "date" },
                    { key: "category", label: "Category", type: "select", options: data.config.categories.map((c) => ({ value: c, label: c, hint: isExcluded(data.config, c) ? "not counted as spending" : undefined })) },
                  ]}
                  note={t.pairId ? "This is one leg of a transfer — both sides move together." : null}
                  onCancel={() => setRowEdit(null)}
                  onSave={(v) => {
                    const amt = num(v.amount);
                    if (!(amt > 0)) return say("Amount must be above zero.");
                    mutate((d) => {
                      const legs = t.pairId ? d.savingsTx.filter((x) => x.pairId === t.pairId) : d.savingsTx.filter((x) => x.id === t.id);
                      legs.forEach((leg) => {
                        const acc = d.accounts.find((a) => a.id === leg.accountId);
                        const legIn = ["deposit", "interest", "settlement", "transfer-in"].includes(leg.type) || (leg.type === "adjustment" && leg.up);
                        if (acc) acc.balance = r2(acc.balance + (legIn ? -num(leg.amount) + amt : num(leg.amount) - amt));
                        leg.amount = amt;
                        leg.date = v.date;
                        leg.note = v.note.trim() || leg.note;
                        if (!leg.pairId) leg.category = v.category;
                      });
                    });
                    setRowEdit(null);
                    say("Entry updated.");
                  }}
                />
              )}
              </div>
            );
          })}
      </div>
    </>
  );
}

/* ---------- CARDS ---------- */
function Cards({ A, data, mutate, say, jump }) {
  const [s, setS] = useState({ cardId: "", amount: "", category: "Groceries", date: TODAY(), note: "", shared: false, shareFriend: "", shareAmount: "" });
  const [pay, setPay] = useState({ cardId: "", accountId: "", amount: "", statementKey: "" });
  const [nc, setNc] = useState({
    name: "", limit: "",
    cycleStart: TODAY(), cycleEnd: cycleEndFor(TODAY()), dueDate: addDays(TODAY(), 20),
  });
  const [showCard, setShowCard] = useState(false);
  const [focus, setFocus] = useState(jump || null);
  const [month, setMonth] = useState("");
  const [rowEdit, setRowEdit] = useState(null);
  const [edit, setEdit] = useState(null);
  const [spendOpen, setSpendOpen] = useState(false);
  useEffect(() => { if (jump) { setFocus(jump); setEdit(null); } }, [jump]);
  const [payOpen, setPayOpen] = useState(false);
  const [ec, setEc] = useState({ name: "", limit: "", cycleStart: TODAY(), cycleEnd: TODAY(), dueDate: TODAY() });

  const openEdit = (c) => {
    setEdit(edit === c.id ? null : c.id);
    const cyc = currentCycle(c, TODAY());
    setEc({
      name: c.name, limit: String(c.limit || ""),
      cycleStart: c.cycleStart || c.cycleDate || cyc.start,
      cycleEnd: c.cycleEnd || cyc.end,
      dueDate: c.dueDate || cyc.due,
    });
  };
  const saveEdit = (c) => {
    if (!ec.name.trim()) return say("The card needs a name.");
    if (ec.cycleEnd <= ec.cycleStart) return say("The cycle has to end after it starts.");
    mutate((d) => {
      const x = d.cards.find((z) => z.id === c.id);
      x.name = ec.name.trim();
      x.limit = num(ec.limit);
      x.cycleStart = ec.cycleStart;
      x.cycleEnd = ec.cycleEnd;
      x.dueDate = ec.dueDate;
      delete x.cycleDate;
      delete x.statementDay;
      delete x.dueDay;
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

  const payCardId = pay.cardId || (data.cards[0] || {}).id;
  const payCardRow = A.cardRows.find((c) => c.id === payCardId);
  const payable = payCardRow
    ? [...payCardRow.statements].reverse().filter((st) => st.open ? st.amount > 0 : st.balance > 0)
    : [];
  const payStatement = payable.find((st) => st.key === pay.statementKey) || payable[0] || null;

  const payCard = () => {
    const acc = pay.accountId || (data.accounts[0] || {}).id;
    if (!payCardId || !acc) return say("Need a card and an account.");
    if (!payStatement) return say("Nothing outstanding on that card.");
    const amt = num(pay.amount) || (payStatement.open ? payStatement.amount : payStatement.balance);
    if (!(amt > 0)) return say("Enter an amount above zero.");
    mutate((d) => {
      const a = d.accounts.find((x) => x.id === acc);
      a.balance = r2(a.balance - amt);
      d.savingsTx.push({
        id: uid(), date: TODAY(), accountId: acc, cardId: payCardId, type: "card-payment",
        statementKey: payStatement.key, amount: amt, category: "Card Payment",
        note: `${A.cardOf(payCardId)} — statement of ${fmtDate(payStatement.end)}`,
      });
    });
    setPay({ ...pay, amount: "" });
    setPayOpen(false);
    say(amt < (payStatement.open ? payStatement.amount : payStatement.balance)
      ? "Part payment posted — the rest stays on that statement."
      : "Statement cleared.");
  };

  const months = monthsWithData(data);
  const allSpends = [...data.spends]
    .filter((x) => !focus || x.cardId === focus)
    .filter((x) => !month || monthOf(x.date) === month)
    .sort((a, b) => b.date.localeCompare(a.date));
  const spends = month ? allSpends : allSpends.slice(0, 30);
  const focused = A.cardRows.find((c) => c.id === focus);
  const monthCharged = r2(allSpends.reduce((sum, x) => sum + num(x.amount), 0));
  const monthPaid = month ? r2(data.savingsTx.filter((t) => t.type === "card-payment"
    && monthOf(t.date) === month && (!focus || t.cardId === focus))
    .reduce((sum, t) => sum + num(t.amount), 0)) : 0;

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
              <span>Not yet billed {mask(fmt0(c.unbilled))}</span>
              <span>EMI holding {mask(fmt0(c.emiHold))}</span>
              <span>Paid {mask(fmt0(c.paid))}</span>
              <span>Available {mask(fmt0(c.available))}</span>
            </div>
            <div className="ml-sub" style={{ marginTop: 6 }}>
              This cycle {fmtDate(c.cycle.start)} – {fmtDate(c.cycle.end)} · bill due {fmtDate(c.cycle.due)}
              {c.nextDue ? ` · next payment ${fmt0(c.nextDueAmount)} on ${fmtDate(c.nextDue)}` : ""}
            </div>

            {c.statements.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {[...c.statements].reverse().slice(0, 4).map((st) => (
                  <div key={st.key} className="ml-between" style={{ padding: "6px 0", borderTop: "1px solid var(--rule-soft)", fontSize: 12.5 }}>
                    <span>
                      {fmtDate(st.start)} – {fmtDate(st.end)}
                      {st.open
                        ? <span className="ml-pill" style={{ marginLeft: 6 }}>Open</span>
                        : st.balance <= 0
                          ? <span className="ml-pill on" style={{ marginLeft: 6 }}>Paid</span>
                          : st.overdue
                            ? <span className="ml-pill off" style={{ marginLeft: 6 }}>Overdue</span>
                            : <span className="ml-pill" style={{ marginLeft: 6 }}>Due {fmtDate(st.due)}</span>}
                    </span>
                    <span className="ml-num" style={{ color: st.open ? "var(--soft)" : st.balance > 0 ? "var(--debit)" : "var(--credit)" }}>
                      {mask(fmt0(st.open ? st.amount : st.balance))}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
                  <Field label="Billing cycle start">
                    <DateField value={ec.cycleStart} onChange={(e) => setEc({ ...ec, cycleStart: e, cycleEnd: cycleEndFor(e) })} />
                  </Field>
                  <Field label="Billing cycle end">
                    <DateField value={ec.cycleEnd} onChange={(e) => setEc({ ...ec, cycleEnd: e })} />
                  </Field>
                  <Field label="Payment due date" span>
                    <DateField value={ec.dueDate} onChange={(e) => setEc({ ...ec, dueDate: e })} />
                  </Field>
                </div>
                <div className="ml-sub" style={{ marginTop: 8 }}>
                  {fmtDate(ec.cycleStart)} – {fmtDate(ec.cycleEnd)}, payable {fmtDate(ec.dueDate)}. The days repeat every
                  month on their own.
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
          <Field label="Which statement" span>
            <Pick value={payStatement ? payStatement.key : ""} onChange={(v) => setPay({ ...pay, statementKey: v, amount: "" })}
              placeholder="Nothing outstanding"
              options={payable.map((st) => ({
                value: st.key,
                label: `${fmtDate(st.start)} – ${fmtDate(st.end)} · ${fmt0(st.open ? st.amount : st.balance)}`,
                hint: st.open ? "still open, not billed yet" : st.overdue ? `overdue since ${fmtDate(st.due)}` : `due ${fmtDate(st.due)}`,
              }))} />
          </Field>
          <Field label="Amount" span>
            <input className="ml-in ml-num" inputMode="decimal" value={pay.amount}
              placeholder={payStatement ? String(payStatement.open ? payStatement.amount : payStatement.balance) : "0"}
              onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
          </Field>
        </div>
        <div className="ml-flex" style={{ marginTop: 12 }}>
          <button className="ml-btn" onClick={payCard}>Pay bill</button>
          <span className="ml-sub">
            Leave the amount blank to clear the whole statement. Pay less and the remainder stays on it, carrying forward as overdue.
          </span>
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
              <Field label="Billing cycle start">
                <DateField value={nc.cycleStart}
                  onChange={(v) => setNc({ ...nc, cycleStart: v, cycleEnd: cycleEndFor(v) })} />
              </Field>
              <Field label="Billing cycle end">
                <DateField value={nc.cycleEnd} onChange={(v) => setNc({ ...nc, cycleEnd: v })} />
              </Field>
              <Field label="Payment due date" span>
                <DateField value={nc.dueDate} onChange={(v) => setNc({ ...nc, dueDate: v })} />
              </Field>
            </div>
            <div className="ml-sub" style={{ marginTop: 10 }}>
              {fmtDate(nc.cycleStart)} – {fmtDate(nc.cycleEnd)}, payable {fmtDate(nc.dueDate)}. Only the day of the month
              matters — every following cycle picks up the same days automatically. The end date fills itself in when you
              set the start; change it only if your bank cuts the cycle differently.
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="ml-btn" onClick={() => {
                if (!nc.name.trim()) return say("Name the card first.");
                if (nc.cycleEnd <= nc.cycleStart) return say("The cycle has to end after it starts.");
                mutate((d) => d.cards.push({
                  id: uid(), name: nc.name.trim(), limit: num(nc.limit),
                  cycleStart: nc.cycleStart, cycleEnd: nc.cycleEnd, dueDate: nc.dueDate,
                }));
                setNc({ name: "", limit: "", cycleStart: TODAY(), cycleEnd: cycleEndFor(TODAY()), dueDate: addDays(TODAY(), 20) });
                setShowCard(false); say("Card added.");
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
        <div className="ml-monthbar">
          <MonthPick value={month} onChange={setMonth} months={months} />
          {month && (
            <span className="ml-sub">
              {monthLabel(month)} · {mask(fmt0(monthCharged))} charged · {mask(fmt0(monthPaid))} paid off
            </span>
          )}
        </div>
        <div style={{ height: 10 }} />
        <LedgerHead />
        {spends.length === 0 ? <div className="ml-empty" style={{ marginTop: 12 }}>Nothing logged yet. Your first spend goes above.</div> :
          spends.map((x) => (
            <div key={x.id}>
              <LedgerRow
                title={x.note}
                meta={`${fmtDate(x.date)} · ${A.cardOf(x.cardId)} · ${x.category}${x.auto ? " · auto" : ""}${num(x.shareAmount) > 0 ? ` · ${fmt0(num(x.shareAmount))} owed by ${x.shareFriend || "a friend"}` : ""}`}
                debit={x.category === "Investment" ? 0 : x.amount}
                credit={0}
                invest={x.category === "Investment" ? x.amount : 0}
                onEdit={() => setRowEdit(rowEdit === x.id ? null : x.id)}
                onDelete={() => mutate((d) => { d.spends = d.spends.filter((z) => z.id !== x.id); })}
              />
              {rowEdit === x.id && (
                <InlineEdit
                  values={{
                    note: x.note || "", amount: String(x.amount), date: x.date, category: x.category,
                    cardId: x.cardId, shareAmount: String(num(x.shareAmount) || ""), shareFriend: x.shareFriend || "",
                  }}
                  fields={[
                    { key: "note", label: "Note", span: true },
                    { key: "amount", label: "Amount", type: "num" },
                    { key: "date", label: "Date", type: "date" },
                    { key: "category", label: "Category", type: "select", options: data.config.categories.map((c) => ({ value: c, label: c, hint: isExcluded(data.config, c) ? "not counted as spending" : undefined })) },
                    { key: "cardId", label: "Card", type: "select", options: data.cards.map((c) => ({ value: c.id, label: c.name })) },
                    { key: "shareAmount", label: "Someone's share", type: "num" },
                    { key: "shareFriend", label: "Who owes you" },
                  ]}
                  note="Changing the amount or date can move this entry into a different billing cycle."
                  onCancel={() => setRowEdit(null)}
                  onSave={(v) => {
                    if (!(num(v.amount) > 0)) return say("Amount must be above zero.");
                    if (num(v.shareAmount) > num(v.amount)) return say("Their share can't be more than the total.");
                    mutate((d) => {
                      const y = d.spends.find((z) => z.id === x.id);
                      y.note = v.note.trim() || y.category;
                      y.amount = num(v.amount);
                      y.date = v.date;
                      y.category = v.category;
                      y.cardId = v.cardId;
                      y.shareAmount = num(v.shareAmount);
                      y.shareFriend = v.shareFriend.trim();
                    });
                    setRowEdit(null);
                    say("Entry updated.");
                  }}
                />
              )}
            </div>
          ))}
      </div>
    </>
  );
}

/* ---------- QUICK LOG ---------- */
/* One place to record anything, routed into exactly the same records the
   individual tabs create — so every total downstream still adds up. */
function QuickLog({ A, data, mutate, say, setTab }) {
  const [f, setF] = useState({
    mode: "spend", via: "card",
    cardId: "", accountId: "", toId: "", statementKey: "",
    amount: "", category: "Groceries", kind: "Settlement", date: TODAY(), note: "",
    shared: false, shareAmount: "", shareFriend: "",
  });

  const cardId = f.cardId || (data.cards[0] || {}).id;
  const accId = f.accountId || (data.accounts[0] || {}).id;
  const payCardRow = A.cardRows.find((c) => c.id === cardId);
  const payable = payCardRow
    ? [...payCardRow.statements].reverse().filter((st) => st.open ? st.amount > 0 : st.balance > 0)
    : [];
  const payStatement = payable.find((st) => st.key === f.statementKey) || payable[0] || null;
  const catOpts = data.config.categories.map((c) => ({
    value: c, label: c, hint: isExcluded(data.config, c) ? "not counted as spending" : undefined,
  }));

  const reset = () => setF({ ...f, amount: "", note: "", shareAmount: "", shareFriend: "", shared: false });

  const post = () => {
    const amt = num(f.amount);
    if (!(amt > 0)) return say("Enter an amount above zero.");
    const share = f.shared ? Math.min(num(f.shareAmount), amt) : 0;
    if (f.shared && !(share > 0)) return say("Enter what they owe you, or turn sharing off.");

    if (f.mode === "spend") {
      if (f.via === "card") {
        if (!cardId) return say("Add a card first.");
        mutate((d) => d.spends.push({
          id: uid(), date: f.date, cardId, amount: amt, category: f.category,
          note: f.note.trim() || f.category, shareAmount: share, shareFriend: f.shared ? f.shareFriend.trim() : "",
        }));
      } else {
        if (!accId) return say("Add an account first.");
        mutate((d) => {
          const a = d.accounts.find((x) => x.id === accId);
          a.balance = r2(a.balance - amt);
          d.savingsTx.push({
            id: uid(), date: f.date, accountId: accId, type: "withdrawal", amount: amt,
            category: f.category, note: f.note.trim() || f.category,
            shareAmount: share, shareFriend: f.shared ? f.shareFriend.trim() : "",
          });
        });
      }
      reset();
      return say(share > 0
        ? `Logged. ${fmt0(share)} sits as owed to you.`
        : isExcluded(data.config, f.category) ? "Logged — kept out of spending." : "Spend logged.");
    }

    if (f.mode === "in") {
      if (!accId) return say("Add an account first.");
      mutate((d) => {
        const a = d.accounts.find((x) => x.id === accId);
        a.balance = r2(a.balance + amt);
        d.savingsTx.push({
          id: uid(), date: f.date, accountId: accId,
          type: f.kind === "Settlement" ? "settlement" : "deposit",
          amount: amt, category: f.kind, note: f.note.trim() || f.kind,
        });
      });
      reset();
      return say("Added to the balance — income stays the figure in Settings.");
    }

    if (f.mode === "pay") {
      if (!cardId || !accId) return say("Need a card and an account.");
      if (!payStatement) return say("Nothing outstanding on that card.");
      const due = payStatement.open ? payStatement.amount : payStatement.balance;
      const payAmt = amt || due;
      mutate((d) => {
        const a = d.accounts.find((x) => x.id === accId);
        a.balance = r2(a.balance - payAmt);
        d.savingsTx.push({
          id: uid(), date: f.date, accountId: accId, cardId, type: "card-payment",
          statementKey: payStatement.key, amount: payAmt, category: "Card Payment",
          note: f.note.trim() || `${A.cardOf(cardId)} — statement of ${fmtDate(payStatement.end)}`,
        });
      });
      reset();
      return say(payAmt < due ? "Part payment posted — the rest stays on that statement." : "Statement cleared.");
    }

    const to = f.toId || (data.accounts.find((a) => a.id !== accId) || {}).id;
    if (!to || to === accId) return say("Pick two different accounts.");
    mutate((d) => {
      const pairId = uid();
      const a = d.accounts.find((x) => x.id === accId);
      const b = d.accounts.find((x) => x.id === to);
      a.balance = r2(a.balance - amt);
      b.balance = r2(b.balance + amt);
      const note = f.note.trim() || `${a.name} → ${b.name}`;
      d.savingsTx.push({ id: uid(), pairId, date: f.date, accountId: accId, type: "transfer-out", amount: amt, category: "Transfer", note });
      d.savingsTx.push({ id: uid(), pairId, date: f.date, accountId: to, type: "transfer-in", amount: amt, category: "Transfer", note });
    });
    reset();
    say("Moved between your accounts.");
  };

  const recent = [
    ...data.spends.map((x) => ({ ...x, where: A.cardOf(x.cardId), out: true })),
    ...data.savingsTx.filter((t) => t.type !== "interest").map((t) => ({
      ...t, where: A.accOf(t.accountId),
      out: ["withdrawal", "auto", "card-payment", "transfer-out"].includes(t.type),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 6);

  return (
    <div className="ml-page">
      <div className="ml-card ml-w6">
        <div className="ml-eyebrow">What are you recording</div>
        <div className="ml-flex" style={{ margin: "10px 0 4px" }}>
          <div className="ml-seg">
            <button data-on={f.mode === "spend" ? "1" : "0"} onClick={() => setF({ ...f, mode: "spend" })}>Spend</button>
            <button data-on={f.mode === "in" ? "1" : "0"} onClick={() => setF({ ...f, mode: "in" })}>Money in</button>
            <button data-on={f.mode === "transfer" ? "1" : "0"} onClick={() => setF({ ...f, mode: "transfer" })}>Transfer</button>
            <button data-on={f.mode === "pay" ? "1" : "0"} onClick={() => setF({ ...f, mode: "pay" })}>Pay a bill</button>
          </div>
        </div>

        {f.mode === "spend" && (
          <div className="ml-flex" style={{ marginBottom: 4 }}>
            <div className="ml-seg">
              <button data-on={f.via === "card" ? "1" : "0"} onClick={() => setF({ ...f, via: "card" })}>On a card</button>
              <button data-on={f.via === "account" ? "1" : "0"} onClick={() => setF({ ...f, via: "account" })}>From an account</button>
            </div>
          </div>
        )}

        <div className="ml-form" style={{ marginTop: 10 }}>
          {(f.mode === "spend" && f.via === "card") || f.mode === "pay" ? (
            <Field label="Card">
              <Pick value={cardId} onChange={(v) => setF({ ...f, cardId: v, statementKey: "" })}
                options={data.cards.map((c) => ({ value: c.id, label: c.name }))} />
            </Field>
          ) : f.mode !== "pay" && (
            <Field label={f.mode === "transfer" ? "From account" : "Account"}>
              <Pick value={accId} onChange={(v) => setF({ ...f, accountId: v })}
                options={data.accounts.map((a) => ({ value: a.id, label: a.name }))} />
            </Field>
          )}

          {f.mode === "pay" && (
            <Field label="From account">
              <Pick value={accId} onChange={(v) => setF({ ...f, accountId: v })}
                options={data.accounts.map((a) => ({ value: a.id, label: a.name }))} />
            </Field>
          )}
          {f.mode === "pay" && (
            <Field label="Which statement" span>
              <Pick value={payStatement ? payStatement.key : ""} onChange={(v) => setF({ ...f, statementKey: v })}
                placeholder="Nothing outstanding"
                options={payable.map((st) => ({
                  value: st.key,
                  label: `${fmtDate(st.start)} – ${fmtDate(st.end)} · ${fmt0(st.open ? st.amount : st.balance)}`,
                  hint: st.open ? "still open, not billed yet" : st.overdue ? `overdue since ${fmtDate(st.due)}` : `due ${fmtDate(st.due)}`,
                }))} />
            </Field>
          )}

          {f.mode === "transfer" && (
            <Field label="To account">
              <Pick value={f.toId || (data.accounts.find((a) => a.id !== accId) || {}).id || ""}
                onChange={(v) => setF({ ...f, toId: v })}
                options={data.accounts.map((a) => ({ value: a.id, label: a.name }))} />
            </Field>
          )}

          <Field label="Amount">
            <input className="ml-in ml-num" inputMode="decimal" value={f.amount}
              placeholder={f.mode === "pay" && payStatement ? String(payStatement.open ? payStatement.amount : payStatement.balance) : "0"}
              onChange={(e) => setF({ ...f, amount: e.target.value })} />
          </Field>

          {f.mode === "spend" && (
            <Field label="Category">
              <Pick value={f.category} onChange={(v) => setF({ ...f, category: v })} options={catOpts} />
            </Field>
          )}
          {f.mode === "in" && (
            <Field label="What kind of money">
              <Pick value={f.kind} onChange={(v) => setF({ ...f, kind: v })}
                options={DEPOSIT_KINDS.map(([k, hint]) => ({ value: k, label: k, hint }))} />
            </Field>
          )}

          <Field label="Date">
            <DateField value={f.date} onChange={(v) => setF({ ...f, date: v })} />
          </Field>
          <Field label="Note" span>
            <input className="ml-in" value={f.note} placeholder="What was this for?"
              onChange={(e) => setF({ ...f, note: e.target.value })} />
          </Field>

          {f.mode === "spend" && (
            <Field label="Someone owes you part of it">
              <div className="ml-seg">
                <button data-on={!f.shared ? "1" : "0"} onClick={() => setF({ ...f, shared: false })}>No</button>
                <button data-on={f.shared ? "1" : "0"} onClick={() => setF({ ...f, shared: true })}>Yes</button>
              </div>
            </Field>
          )}
          {f.mode === "spend" && f.shared && (
            <>
              <Field label="Their share">
                <input className="ml-in ml-num" inputMode="decimal" value={f.shareAmount} placeholder="0"
                  onChange={(e) => setF({ ...f, shareAmount: e.target.value })} />
              </Field>
              <Field label="Who owes you" span>
                <input className="ml-in" value={f.shareFriend} placeholder="Name"
                  onChange={(e) => setF({ ...f, shareFriend: e.target.value })} />
              </Field>
            </>
          )}
        </div>

        <div className="ml-flex" style={{ marginTop: 12 }}>
          <button className="ml-btn" onClick={post}>
            {f.mode === "spend" ? "Log spend" : f.mode === "in" ? "Add to balance" : f.mode === "pay" ? "Pay bill" : "Move it"}
          </button>
          <span className="ml-sub">
            {f.mode === "spend" && f.via === "card" ? "Lands on that card's current billing cycle."
              : f.mode === "spend" ? "Comes straight off the account balance."
                : f.mode === "in" ? "Raises the balance without counting as income."
                  : f.mode === "pay" ? "Leave the amount blank to clear the statement in full."
                    : "Both legs post at once and neither counts as spending."}
          </span>
        </div>
      </div>

      <div className="ml-card ml-w6">
        <div className="ml-between">
          <div className="ml-eyebrow">Just logged</div>
          <button className="ml-btn ghost sm" onClick={() => setTab("overview")}>See the month</button>
        </div>
        {recent.length === 0 ? (
          <div className="ml-empty" style={{ marginTop: 12 }}>Nothing yet — the first entry goes above.</div>
        ) : (
          <div style={{ marginTop: 6 }}>
            {recent.map((x) => (
              <div className="ml-between" key={x.id} style={{ padding: "8px 0", borderTop: "1px solid var(--rule-soft)", fontSize: 13 }}>
                <span style={{ minWidth: 0 }}>
                  {x.note || x.category}
                  <span className="ml-sub" style={{ display: "block", marginTop: 1 }}>
                    {fmtDate(x.date)} · {x.where} · {x.category}
                  </span>
                </span>
                <span className="ml-num" style={{ color: x.out ? "var(--debit)" : "var(--credit)" }}>
                  {mask((x.out ? "−" : "+") + fmt(x.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- ALERTS ---------- */
function Alerts({ A, setTab }) {
  const when = (a) => {
    if (a.days < 0) return `${Math.abs(a.days)}d late`;
    if (a.days === 0) return "Today";
    if (a.days === 1) return "Tomorrow";
    return `In ${a.days}d`;
  };
  const goto = (a) => setTab(
    a.kind === "Card bill" ? "cards" : a.kind === "Auto-payment" ? "auto"
      : a.kind === "Budget" ? "budget" : a.kind === "Housekeeping" ? "backup"
        : a.id.startsWith("emi") ? "emi" : "shared"
  );

  return (
    <div className="ml-page">
      <StatRow>
        <Stat raw label="Needs attention" value={String(A.alerts.filter((a) => a.level !== "later").length)}
          tone={A.urgent > 0 ? "debit" : null} note="due soon or already late" />
        <Stat label="Falling due" value={fmt0(A.alerts.reduce((s, a) => s + num(a.amount), 0))}
          note="cards and auto-payments ahead" />
      </StatRow>

      <div className="ml-card ml-w6">
        <div className="ml-eyebrow">What's coming</div>
        <div className="ml-sub" style={{ marginTop: 4, marginBottom: 6 }}>
          Card bills appear once they're within twelve days, so a reminder always lands well before the five-day mark.
        </div>
        {A.alerts.length === 0 ? (
          <div className="ml-empty">Nothing needs you right now.</div>
        ) : A.alerts.map((a) => (
          <div className="ml-alert" key={a.id}>
            <span className={"ml-adot " + a.level} />
            <div style={{ minWidth: 0 }}>
              <div className="ml-atitle">{a.title}</div>
              <div className="ml-ameta">{a.kind} · {a.meta}</div>
              <button className="ml-btn ghost sm" style={{ marginTop: 7 }} onClick={() => goto(a)}>Open</button>
            </div>
            <div className="ml-awhen">
              <b style={{ color: a.level === "now" ? "var(--debit)" : a.level === "soon" ? "var(--amber)" : "var(--soft)" }}>
                {when(a)}
              </b>
              <span className="ml-sub ml-num">{fmtDate(a.date)}</span>
            </div>
          </div>
        ))}
      </div>

      {A.tips.length > 0 && (
        <div className="ml-card ml-w6">
          <div className="ml-eyebrow">Worth thinking about</div>
          {A.tips.map(([t, body], i) => (
            <div className="ml-tip" key={i}><b>{t}</b><p>{body}</p></div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- SHARED BILLS & SETTLEMENTS ---------- */
function SharedPanel({ A, data, mutate, say }) {
  const [f, setF] = useState({});
  const [open, setOpen] = useState(false);
  const [rowEdit, setRowEdit] = useState(null);
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
                <span className="ml-rowacts" style={{ marginTop: 6 }}>
                  <button className="ml-x" title="Edit" onClick={() => setRowEdit(rowEdit === x.id ? null : x.id)}><PencilIcon /></button>
                  <button className="ml-x" title="Delete" onClick={() => removeBill(x)}><TrashIcon /></button>
                </span>
              </div>
            </div>
            {rowEdit === x.id && (
              <InlineEdit
                values={{ note: x.note || "", amount: String(x.amount), share: String(x.shareDue), date: x.date, shareFriend: x.shareFriend || "" }}
                fields={[
                  { key: "note", label: "What it was for", span: true },
                  { key: "amount", label: "Total you paid", type: "num" },
                  { key: "share", label: "Their share", type: "num" },
                  { key: "date", label: "Date", type: "date" },
                  { key: "shareFriend", label: "Who owes you", span: true },
                ]}
                note={x.settled > 0 ? `${fmt(x.settled)} already settled — their share can't drop below that.` : null}
                onCancel={() => setRowEdit(null)}
                onSave={(v) => {
                  const total = num(v.amount), part = num(v.share);
                  if (!(total > 0)) return say("Total must be above zero.");
                  if (part > total) return say("Their share can't be more than the total.");
                  if (part < x.settled) return say(`They've already paid ${fmt0(x.settled)} — their share can't be less.`);
                  mutate((d) => {
                    const list = x.kind === "card" ? d.spends : d.savingsTx;
                    const y = list.find((z) => z.id === x.id);
                    if (!y) return;
                    if (x.kind !== "card") {
                      const acc = d.accounts.find((a) => a.id === y.accountId);
                      if (acc) acc.balance = r2(acc.balance + num(y.amount) - total);
                    }
                    y.amount = total; y.shareAmount = part; y.date = v.date;
                    y.note = v.note.trim() || y.note; y.shareFriend = v.shareFriend.trim();
                  });
                  setRowEdit(null);
                  say("Shared bill updated.");
                }}
              />
            )}

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
  const [e, setE] = useState({
    friend: "", item: "", cardId: "", principal: "", months: "6", startDate: TODAY(), note: "",
    emiType: "nocost", procFee: "", feeGst: "18", rate: "", intGst: "18",
  });
  const [rp, setRp] = useState({});
  const [repay, setRepay] = useState(null);
  const [emiEdit, setEmiEdit] = useState(null);
  const [openEmi, setOpenEmi] = useState(null);
  const [schedEdit, setSchedEdit] = useState(null);   // "<emiId>:<monthIndex>"
  const [schedVal, setSchedVal] = useState("");

  const setOverride = (emi, k, raw) => {
    mutate((d) => {
      const y = d.emis.find((z) => z.id === emi.id);
      y.overrides = { ...(y.overrides || {}) };
      if (raw === null) delete y.overrides[String(k)];
      else y.overrides[String(k)] = num(raw);
    });
    setSchedEdit(null);
    say(raw === null ? "Back to the computed figure." : "Bank's figure saved for that month.");
  };
  const [repEdit, setRepEdit] = useState(null);
  const [open, setOpen] = useState(false);

  const add = () => {
    if (!e.friend.trim()) return say("Whose purchase is this?");
    if (num(e.principal) <= 0 || num(e.months) <= 0) return say("Add the amount and number of months.");
    if (e.emiType === "interest" && !(num(e.rate) > 0)) return say("Add the interest rate, or switch to no-cost.");
    mutate((d) => d.emis.push({
      id: uid(), friend: e.friend.trim(), item: e.item.trim() || "Purchase",
      cardId: e.cardId || (d.cards[0] || {}).id, principal: num(e.principal),
      months: Math.round(num(e.months)), startDate: e.startDate, note: e.note.trim(),
      emiType: e.emiType, procFee: num(e.procFee), feeGst: num(e.feeGst),
      rate: e.emiType === "interest" ? num(e.rate) : 0, intGst: num(e.intGst),
    }));
    setE({ ...e, friend: "", item: "", principal: "", note: "" });
    setOpen(false);
    say("EMI tracked.");
  };

  const logRepayment = (emi) => {
    const v = rp[emi.id];
    const amount = num(v && v.amount);
    if (amount <= 0) return say("Enter what they paid you.");
    if (amount > emi.outstanding + 0.01) {
      return say(`That's more than the ${fmt0(emi.outstanding)} still owed on this one.`);
    }
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
              <Field label="EMI type" span>
                <div className="ml-seg">
                  <button data-on={e.emiType === "nocost" ? "1" : "0"} onClick={() => setE({ ...e, emiType: "nocost" })}>No-cost</button>
                  <button data-on={e.emiType === "interest" ? "1" : "0"} onClick={() => setE({ ...e, emiType: "interest" })}>Interest</button>
                </div>
              </Field>
              <Field label="Processing fee">
                <input className="ml-in ml-num" inputMode="decimal" value={e.procFee} placeholder="0"
                  onChange={(x) => setE({ ...e, procFee: x.target.value })} />
              </Field>
              <Field label="Tax on fee (%)">
                <input className="ml-in ml-num" inputMode="decimal" value={e.feeGst}
                  onChange={(x) => setE({ ...e, feeGst: x.target.value })} />
              </Field>
              {e.emiType === "interest" && (
                <>
                  <Field label="Interest rate (% p.a.)">
                    <input className="ml-in ml-num" inputMode="decimal" value={e.rate} placeholder="e.g. 16"
                      onChange={(x) => setE({ ...e, rate: x.target.value })} />
                  </Field>
                  <Field label="Tax on interest (%)">
                    <input className="ml-in ml-num" inputMode="decimal" value={e.intGst}
                      onChange={(x) => setE({ ...e, intGst: x.target.value })} />
                  </Field>
                </>
              )}
              <Field label="Note" span><input className="ml-in" value={e.note} placeholder="Terms you agreed on" onChange={(x) => setE({ ...e, note: x.target.value })} /></Field>
            </div>
            <div className="ml-sub" style={{ marginTop: 10 }}>
              {e.emiType === "nocost"
                ? "No-cost still usually carries a processing fee and tax on it — the bank charges those even when the merchant absorbs the interest."
                : "Interest is worked out on the reducing balance, so the instalment eases down slightly each month as the tax on interest shrinks."}
              {" "}Your friend carries the whole cost: fee, tax and interest included.
            </div>
            <div style={{ marginTop: 12 }}><button className="ml-btn" onClick={add}>Start tracking</button></div>
          </Modal>
        )}
      </div>

      {A.emiRows.length === 0 ? (
        <div className="ml-card"><div className="ml-empty">No friend EMIs yet. Add one above and the repayment log appears here.</div></div>
      ) : A.emiRows.map((x) => {
        const pct = Math.min(100, Math.round((x.received / Math.max(1, x.total)) * 100));
        const mine = data.repayments.filter((r) => r.emiId === x.id).sort((a, b) => b.date.localeCompare(a.date));
        const v = rp[x.id] || { amount: "", date: TODAY(), note: "" };
        const shown = openEmi === x.id;
        return (
          <div className="ml-card" key={x.id}>
            <button type="button" className="ml-disclose"
              onClick={() => { setOpenEmi(shown ? null : x.id); setEmiEdit(null); setSchedEdit(null); }}
              aria-expanded={shown}>
              <span style={{ minWidth: 0 }}>
                <span className="ml-h" style={{ fontSize: 15, display: "block" }}>{x.friend} — {x.item}</span>
                <span className="ml-sub" style={{ display: "block", marginTop: 3 }}>
                  {fmt0(x.monthly)}/month × {x.months} · {A.cardOf(x.cardId)}
                  {x.overdue > 0 && <span className="ml-pill off" style={{ marginLeft: 6 }}>{fmt0(x.overdue)} past due</span>}
                </span>
              </span>
              <span style={{ textAlign: "right", flex: "0 0 auto" }}>
                <span className="ml-num" style={{ fontWeight: 600, color: "var(--debit)" }}>{mask(fmt0(x.outstanding))}</span>
                <span className="ml-sub" style={{ display: "block" }}>{pct}% repaid</span>
              </span>
              <span className={"ml-chev ml-chevs" + (shown ? " up" : "")} />
            </button>

            {!shown && (
              <div className="ml-bar" style={{ marginTop: 10 }}>
                <i style={{ width: `${pct}%`, background: x.overdue > 0 ? "var(--amber)" : "var(--credit)" }} />
              </div>
            )}

            {shown && (
            <>
            <div className="ml-between" style={{ marginTop: 12 }}>
              <div>
                <div className="ml-sub">
                  Started {fmtDate(x.startDate)} · {fmt0(x.principal)} borrowed
                </div>
                <div className="ml-pills">
                  <span className="ml-pill">{(x.emiType || "nocost") === "interest" ? `Interest ${num(x.rate).toFixed(2)}%` : "No-cost"}</span>
                  {x.sched.upfront > 0 && <span className="ml-pill">Fee {fmt0(x.sched.upfront)}</span>}
                  {x.sched.interest > 0 && <span className="ml-pill">Interest {fmt0(x.sched.interest)}</span>}
                  {x.sched.tax > 0 && <span className="ml-pill">Tax {fmt0(x.sched.tax)}</span>}
                </div>
              </div>
              <span className="ml-rowacts">
                <button className="ml-x" title="Edit" onClick={() => setEmiEdit(emiEdit === x.id ? null : x.id)}><PencilIcon /></button>
                <button className="ml-x" title="Remove" onClick={() => mutate((d) => {
                  d.emis = d.emis.filter((z) => z.id !== x.id);
                  d.repayments = d.repayments.filter((z) => z.emiId !== x.id);
                })}><TrashIcon /></button>
              </span>
            </div>

            {emiEdit === x.id && (
              <InlineEdit
                values={{
                  friend: x.friend, item: x.item, principal: String(x.principal), months: String(x.months),
                  startDate: x.startDate, cardId: x.cardId, emiType: x.emiType || "nocost",
                  procFee: String(num(x.procFee) || ""), feeGst: String(num(x.feeGst) || ""),
                  rate: String(num(x.rate) || ""), intGst: String(num(x.intGst) || ""),
                }}
                fields={[
                  { key: "friend", label: "Friend" },
                  { key: "item", label: "What they bought" },
                  { key: "principal", label: "Amount", type: "num" },
                  { key: "months", label: "Months", type: "num" },
                  { key: "startDate", label: "First instalment", type: "date" },
                  { key: "cardId", label: "Card", type: "select", options: data.cards.map((c) => ({ value: c.id, label: c.name })) },
                  { key: "emiType", label: "EMI type", type: "select", options: [{ value: "nocost", label: "No-cost" }, { value: "interest", label: "Interest-bearing" }] },
                  { key: "procFee", label: "Processing fee", type: "num" },
                  { key: "feeGst", label: "Tax on fee (%)", type: "num" },
                  { key: "rate", label: "Interest (% p.a.)", type: "num" },
                  { key: "intGst", label: "Tax on interest (%)", type: "num" },
                ]}
                note={`${fmt(x.received)} already repaid — the amount can't go below that.`}
                onCancel={() => setEmiEdit(null)}
                onSave={(v) => {
                  if (!(num(v.principal) > 0) || !(num(v.months) > 0)) return say("Amount and months must be above zero.");
                  const months = Math.round(num(v.months));
                  /* an override for a month that no longer exists must not linger */
                  const overrides = {};
                  Object.entries(x.overrides || {}).forEach(([k, val]) => {
                    if (Number(k) < months) overrides[k] = val;
                  });
                  const draft = {
                    principal: num(v.principal), months, startDate: v.startDate,
                    emiType: v.emiType, procFee: num(v.procFee), feeGst: num(v.feeGst),
                    rate: v.emiType === "interest" ? num(v.rate) : 0, intGst: num(v.intGst),
                    overrides,
                  };
                  if (emiSchedule(draft).total < x.received) {
                    return say(`They've already repaid ${fmt0(x.received)} — the total can't be less than that.`);
                  }
                  mutate((d) => {
                    const y = d.emis.find((z) => z.id === x.id);
                    y.friend = v.friend.trim() || y.friend;
                    y.item = v.item.trim() || y.item;
                    y.cardId = v.cardId;
                    Object.assign(y, draft);
                  });
                  setEmiEdit(null);
                  say("EMI updated.");
                }}
              />
            )}

            <div className="ml-bar" style={{ marginTop: 12 }}>
              <i style={{ width: `${pct}%`, background: x.overdue > 0 ? "var(--amber)" : "var(--credit)" }} />
            </div>
            <div className="ml-flex" style={{ marginTop: 8, justifyContent: "space-between", fontSize: 12 }}>
              <span className="ml-num">{mask(fmt0(x.received))} repaid ({pct}%)</span>
              <span className="ml-num" style={{ color: "var(--debit)" }}>{mask(fmt0(x.outstanding))} outstanding</span>
            </div>
            {x.overpaid > 0 && (
              <div className="ml-sub" style={{ marginTop: 6, color: "var(--amber)" }}>
                {fmt(x.overpaid)} more has been logged than this EMI comes to — worth checking the repayments below.
              </div>
            )}
            <div className="ml-sub" style={{ marginTop: 4 }}>
              Owes {mask(fmt(x.total))} in all — {fmt0(x.principal)} borrowed
              {x.sched.total - num(x.principal) > 0 ? ` plus ${fmt0(r2(x.sched.total - num(x.principal)))} of fee, interest and tax` : ""}
            </div>
            <div className="ml-sub" style={{ marginTop: 6 }}>
              {x.due} of {x.months} instalments billed.{" "}
              {x.overdue > 0
                ? <span style={{ color: "var(--amber)" }}>{fmt0(x.overdue)} past due — you're carrying it.</span>
                : <span style={{ color: "var(--credit)" }}>Up to date.</span>}
            </div>

            <div className="ml-eyebrow" style={{ marginTop: 16 }}>Month by month</div>
            <div className="ml-sub" style={{ marginTop: 4 }}>
              Worked out on a reducing balance. Where the bank's statement differs, put their figure in — that month
              switches to it and the rest stay as calculated.
            </div>
            <div className="ml-sched">
              {x.sched.upfront > 0 && (
                <div className="ml-srow">
                  <span className="ml-sk">fee</span>
                  <span>Processing fee + tax <span className="ml-sub">· {fmtDate(x.startDate)}</span></span>
                  <span className="ml-samt">{mask(fmt(x.sched.upfront))}</span>
                  <span />
                </div>
              )}
              {x.sched.rows.map((r) => {
                const billed = r.date <= A.today;
                const key = `${x.id}:${r.k}`;
                return (
                  <React.Fragment key={key}>
                    <div className="ml-srow">
                      <span className="ml-sk">{r.k + 1}</span>
                      <span style={{ minWidth: 0 }}>
                        {fmtDate(r.date)}
                        {r.override
                          ? <span className="ml-pill on" style={{ marginLeft: 6 }}>Bank</span>
                          : billed ? <span className="ml-pill" style={{ marginLeft: 6 }}>Billed</span> : null}
                        {r.interest > 0 && (
                          <span className="ml-sub" style={{ display: "block", marginTop: 1 }}>
                            {fmt0(r.principal)} principal · {fmt0(r.interest)} interest · {fmt0(r.tax)} tax
                          </span>
                        )}
                      </span>
                      <span className="ml-samt" style={{ color: r.override ? "var(--stamp)" : "var(--ink)" }}>
                        {mask(fmt(r.amount))}
                      </span>
                      <button className="ml-x" title="Use the bank's figure"
                        onClick={() => { setSchedEdit(schedEdit === key ? null : key); setSchedVal(String(r.amount)); }}>
                        <PencilIcon />
                      </button>
                    </div>
                    {schedEdit === key && (
                      <div className="ml-sedit">
                        <input className="ml-in ml-num" inputMode="decimal" value={schedVal}
                          placeholder={String(r.computed || r.amount)}
                          onChange={(ev) => setSchedVal(ev.target.value)} />
                        <button className="ml-btn sm" onClick={() => {
                          if (!(num(schedVal) >= 0)) return say("Enter the amount from the statement.");
                          setOverride(x, r.k, schedVal);
                        }}>Save</button>
                        {r.override && (
                          <button className="ml-btn ghost sm" onClick={() => setOverride(x, r.k, null)}>Reset</button>
                        )}
                        <button className="ml-btn ghost sm" onClick={() => setSchedEdit(null)}>Cancel</button>
                        {r.override && <span className="ml-sub">Computed {fmt(r.computed)}</span>}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            {x.sched.overrides > 0 && (
              <div className="ml-sub" style={{ marginTop: 8 }}>
                {x.sched.overrides} month{x.sched.overrides > 1 ? "s" : ""} taken from the statement ·
                {" "}{x.sched.drift >= 0 ? "+" : ""}{fmt(x.sched.drift)} against the calculated schedule
              </div>
            )}

            <hr className="ml-hr" />
            <div className="ml-between">
              <div className="ml-eyebrow">Repayments received</div>
              <button className="ml-btn sm" onClick={() => { setRepay(x.id); setRp({ ...rp, [x.id]: { ...v, amount: String(x.monthly) } }); }}>
                Log repayment
              </button>
            </div>

            {repay === x.id && (
              <Modal title={`Repayment from ${x.friend}`} subtitle={`${fmt0(x.monthly)} a month · ${fmt0(x.outstanding)} still owed`}
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
                  <div key={r.id} style={{ borderTop: "1px solid var(--rule-soft)" }}>
                    <div className="ml-between" style={{ padding: "7px 0", fontSize: 13 }}>
                      <span>{fmtDate(r.date)} <span className="ml-sub">· {r.note}</span></span>
                      <span className="ml-flex">
                        <span className="ml-num ml-credit">{mask(fmt(r.amount))}</span>
                        <button className="ml-x" title="Edit" onClick={() => setRepEdit(repEdit === r.id ? null : r.id)}><PencilIcon /></button>
                        <button className="ml-x" title="Remove" onClick={() => mutate((d) => { d.repayments = d.repayments.filter((z) => z.id !== r.id); })}><TrashIcon /></button>
                      </span>
                    </div>
                    {repEdit === r.id && (
                      <InlineEdit
                        values={{ amount: String(r.amount), date: r.date, note: r.note || "" }}
                        fields={[
                          { key: "amount", label: "Amount", type: "num" },
                          { key: "date", label: "Received on", type: "date" },
                          { key: "note", label: "Note", span: true },
                        ]}
                        onCancel={() => setRepEdit(null)}
                        onSave={(v) => {
                          if (!(num(v.amount) > 0)) return say("Amount must be above zero.");
                          if (num(v.amount) > r2(x.outstanding + num(r.amount)) + 0.01) {
                            return say(`That would put them over the ${fmt0(x.total)} owed.`);
                          }
                          mutate((d) => {
                            const y = d.repayments.find((z) => z.id === r.id);
                            y.amount = num(v.amount); y.date = v.date; y.note = v.note.trim() || y.note;
                          });
                          setRepEdit(null);
                          say("Repayment updated.");
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            </>
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
  const [rowEdit, setRowEdit] = useState(null);
  const [openItem, setOpenItem] = useState(null);

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
              <Accordion key={x.id} icon={x.category} open={openItem === x.id}
                onToggle={() => setOpenItem(openItem === x.id ? null : x.id)}
                title={<>{x.name} {!x.active && <span className="ml-pill">Finished</span>}</>}
                subtitle={`${x.frequency} · next ${fmtDate(x.nextDue)}${left !== null ? ` · ${left} left` : ""}`}
                right={<div className="ml-num" style={{ fontWeight: 700, marginRight: 8 }}>{fmt0(x.amount)}</div>}>
                <div className="ml-sub">
                  From {src} · {x.category}
                  {isExcluded(data.config, x.category) && <span style={{ color: "var(--stamp)" }}> · not counted as spending</span>}
                  {num(x.shareAmount) > 0 && <span style={{ color: "var(--credit)" }}> · {fmt0(num(x.shareAmount))} back from {x.shareFriend || "a friend"}</span>}
                  {left !== null && left > 0 && <><br />{fmt0(left * num(x.amount))} left to go</>}
                </div>
                <div className="ml-flex" style={{ marginTop: 10 }}>
                  <button className="ml-btn ghost sm" onClick={() => setRowEdit(rowEdit === x.id ? null : x.id)}>{rowEdit === x.id ? "Cancel" : "Edit"}</button>
                  <button className="ml-btn ghost sm" onClick={() => mutate((d) => {
                    const y = d.recurring.find((z) => z.id === x.id); y.active = !y.active;
                  })}>{x.active ? "Pause" : "Resume"}</button>
                  <button className="ml-btn ghost sm" onClick={() => mutate((d) => { d.recurring = d.recurring.filter((z) => z.id !== x.id); })}>Remove</button>
                </div>

                {rowEdit === x.id && (
                  <InlineEdit
                    values={{
                      name: x.name, amount: String(x.amount), frequency: x.frequency, nextDue: x.nextDue,
                      category: x.category, shareAmount: String(num(x.shareAmount) || ""), shareFriend: x.shareFriend || "",
                      totalInstallments: String(num(x.totalInstallments) || ""),
                    }}
                    fields={[
                      { key: "name", label: "Name", span: true },
                      { key: "amount", label: "Amount", type: "num" },
                      { key: "nextDue", label: "Next due", type: "date" },
                      { key: "frequency", label: "Repeats", type: "select", options: [["weekly", "Weekly"], ["monthly", "Monthly"], ["quarterly", "Quarterly"], ["yearly", "Yearly"]].map(([value, label]) => ({ value, label })) },
                      { key: "category", label: "Category", type: "select", options: data.config.categories.map((c) => ({ value: c, label: c })) },
                      { key: "totalInstallments", label: "Total instalments", type: "num" },
                      { key: "shareAmount", label: "Someone's share", type: "num" },
                      { key: "shareFriend", label: "Who owes you" },
                    ]}
                    onCancel={() => setRowEdit(null)}
                    onSave={(v) => {
                      if (!(num(v.amount) > 0)) return say("Amount must be above zero.");
                      mutate((d) => {
                        const y = d.recurring.find((z) => z.id === x.id);
                        y.name = v.name.trim() || y.name;
                        y.amount = num(v.amount);
                        y.frequency = v.frequency;
                        y.nextDue = v.nextDue;
                        y.category = v.category;
                        y.totalInstallments = Math.round(num(v.totalInstallments));
                        y.shareAmount = num(v.shareAmount);
                        y.shareFriend = v.shareFriend.trim();
                      });
                      setRowEdit(null);
                      say("Schedule updated.");
                    }}
                  />
                )}
              </Accordion>
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

  const [openSec, setOpenSec] = useState("export");
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

      <Accordion icon="backup" open={openSec === "export"} onToggle={() => setOpenSec(openSec === "export" ? null : "export")}
        title="Take a backup" subtitle="Your ledger lives only on this device">
        <div className="ml-sub">
          Clearing the app, clearing browser data, or a device wipe takes it with them — a copy kept somewhere else is
          the only thing that survives that.
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
      </Accordion>

      <Accordion icon="restore" open={openSec === "restore"} onToggle={() => setOpenSec(openSec === "restore" ? null : "restore")}
        title="Restore" subtitle="Replace everything from a saved backup">
        <div className="ml-sub">
          Catches up interest and any auto-payments due since the backup was taken.
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
      </Accordion>

      <Accordion icon="transfer" open={openSec === "move"} onToggle={() => setOpenSec(openSec === "move" ? null : "move")}
        title="Moving to a new phone" subtitle="Three steps">
        <ol style={{ fontSize: 13, color: "var(--body)", paddingLeft: 18, lineHeight: 1.8, margin: 0 }}>
          <li>Download the .json file on the old device.</li>
          <li>Send it to yourself however you like, or keep it in your files app.</li>
          <li>Open the ledger on the new device and restore from that file.</li>
        </ol>
      </Accordion>
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
