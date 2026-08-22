import React from "react";
import { createRoot } from "react-dom/client";
import MoneyLedger from "./MoneyLedger.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MoneyLedger />
  </React.StrictMode>
);

/*
 * Ask the browser to treat this site's storage as important.
 * Reduces the chance of the ledger being evicted when the device is low on space.
 * It is a request, not a guarantee — take backups from the Backup tab regardless.
 */
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

/* Service worker: production only, so dev reloads are never served from cache. */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const base = import.meta.env.BASE_URL;
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {});
  });
}
