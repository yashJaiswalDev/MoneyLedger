# Money Ledger

A personal finance ledger that runs entirely on your own device. No server, no account, no sync — your data never leaves the browser it's stored in.

Tracks savings accounts with daily interest accrual, credit card spends, EMIs friends owe you, shared bills, scheduled loans and subscriptions, budgets, and a dashboard that keeps investments out of your expense figures.

See **[GUIDE.md](./GUIDE.md)** for a full walkthrough of the features and how the numbers are calculated.

---

## Run it locally

Requires **Node.js 20 or newer**.

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`).

To preview the real production build, including the service worker:

```bash
npm run build
npm run preview
```

> The service worker only registers in production builds, so `npm run dev` never serves stale code.

---

## Deploy to GitHub Pages

**1. Create the repository**

```bash
git init
git add .
git commit -m "Money Ledger"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

**2. Turn on Pages**

In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

**3. That's it**

The included workflow (`.github/workflows/deploy.yml`) builds and publishes on every push to `main`. It derives the base path from your repository name automatically, so you don't need to edit any config.

Your app will be live at `https://<your-username>.github.io/<repo-name>/`.

### If you're deploying somewhere else

The `base` path in `vite.config.js` must match how the site is served:

| Hosting | Build command |
|---|---|
| GitHub Pages project site | handled by the workflow |
| GitHub Pages user site (`<you>.github.io`) | `VITE_BASE=/ npm run build` |
| Netlify, Vercel, Cloudflare Pages, own domain | `VITE_BASE=/ npm run build` |

---

## Install it as an app

**Android (Chrome)** — open the site, tap the ⋮ menu, choose *Install app* or *Add to Home screen*.

**iOS (Safari, 16.4+)** — open the site **in Safari specifically**, tap the Share button, choose *Add to Home Screen*. It must be opened from the home screen icon afterwards, not from a Safari tab.

**Desktop (Chrome/Edge)** — an install icon appears in the address bar.

Once installed it launches full-screen with its own icon, and works offline.

---

## Your data — read this bit

Everything is stored in your browser's `localStorage`, on that one device, in that one browser profile. That means:

- Clearing browsing data / site data **erases the ledger**
- Uninstalling the PWA **erases the ledger**
- Nothing syncs between devices — a phone and a laptop are two separate ledgers
- On iOS, Safari can clear script-writable storage for sites not opened in **7 days**

The app asks the browser to mark its storage as persistent, which reduces the risk of eviction, but it's a request rather than a guarantee.

**So: use the Backup tab.** Download the `.json` file periodically and keep it somewhere else. That file is also how you move your ledger to a new device — download on the old one, restore on the new one.

---

## Updating the app

Push to `main` and the workflow redeploys. Installed PWAs pick up the new version on the next launch or two, since the service worker updates in the background.

If you want to force every device to refresh promptly after a significant change, bump the cache name in `public/sw.js`:

```js
const CACHE = "money-ledger-v2";   // was v1
```

---

## Project structure

```
├── index.html                    entry document, PWA meta tags, theme colors
├── vite.config.js                build config — base path lives here
├── public/
│   ├── manifest.webmanifest      app name, icons, standalone display mode
│   ├── sw.js                     service worker: offline shell + asset caching
│   └── icons/                    app icons, including a maskable one for Android
├── src/
│   ├── main.jsx                  mounts the app, registers the SW, requests persistent storage
│   ├── MoneyLedger.jsx           the entire application
│   └── index.css                 page-level reset only; the app styles itself
├── .github/workflows/deploy.yml  build + publish to GitHub Pages
└── GUIDE.md                      feature and logic documentation
```

The whole application is one file — `src/MoneyLedger.jsx` — with its styles in a `<style>` block at the top and no CSS framework or component library. Nothing to learn beyond React itself to modify it.

---

## Making it a real iOS/Android app later

This runs well as a PWA, but a native wrapper removes the storage-eviction risk entirely and unlocks reliable local notifications for bill reminders. [Capacitor](https://capacitorjs.com/) wraps this exact codebase:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/preferences
npx cap init "Money Ledger" "com.yourname.moneyledger" --web-dir=dist
npm run build
npm install @capacitor/ios @capacitor/android
npx cap add android          # npx cap add ios   (macOS + Xcode required)
npx cap sync
npx cap open android
```

You'd swap the `store` object in `MoneyLedger.jsx` from `localStorage` to Capacitor's Preferences plugin — it's about ten lines, and the storage interface is already isolated in one place for exactly this reason.

---

## Notes

- No card numbers are stored, not even partial ones — cards are identified by the name you give them.
- Interest accrues daily, catching up for every day since you last opened the app.
- The RBI repo rate is set by you in Settings; individual accounts can override it with their own fixed rate.
